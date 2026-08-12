"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/States";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { qk, useAccounts } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";

interface StatementResult {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  transactions_imported: number;
  error_message: string;
  filename: string;
}

const ACCEPTED = [".csv", ".xls", ".xlsx", ".pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImportStatementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();

  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statement, setStatement] = useState<StatementResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Falls back to the default account until the user picks one explicitly.
  const selectedAccount =
    accountId ||
    accounts.find((a) => a.is_default)?.id ||
    accounts[0]?.id ||
    "";

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const validate = (f: File): string => {
    const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED.includes(ext))
      return `Unsupported file type. Accepted: ${ACCEPTED.join(", ")}`;
    if (f.size > MAX_BYTES) return "File is larger than the 10 MB limit.";
    return "";
  };

  const selectFile = (f: File) => {
    const problem = validate(f);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStatement(null);
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  };

  /** The backend parses in a background thread, so poll until it settles. */
  const pollStatus = (id: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const { data } = await api.get<StatementResult>(`/statements/${id}/`);
        setStatement(data);
        if (data.status === "completed" || data.status === "failed") {
          stopPolling();
          if (data.status === "completed") {
            queryClient.invalidateQueries({ queryKey: qk.transactions });
            queryClient.invalidateQueries({ queryKey: qk.dashboard });
            queryClient.invalidateQueries({ queryKey: qk.accounts });
            toast(
              `Imported ${data.transactions_imported} transactions.`,
              "success"
            );
          } else {
            toast("Statement could not be parsed.", "error");
          }
        }
      } catch {
        stopPolling();
      }
      if (attempts > 40) stopPolling();
    }, 1500);
  };

  const upload = async () => {
    if (!file || !selectedAccount) return;
    setUploading(true);
    setError("");

    const body = new FormData();
    body.append("file", file);
    body.append("account", selectedAccount);

    try {
      const { data } = await api.post<StatementResult>("/statements/", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatement(data);
      pollStatus(data.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    stopPolling();
    setFile(null);
    setStatement(null);
    setError("");
  };

  const processing =
    statement?.status === "pending" || statement?.status === "processing";

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Import Statement
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Upload a bank statement and we&apos;ll extract the transactions.
          </p>
        </div>
        <EmptyState
          title="Add an account first"
          description="Imported transactions need an account to attach to. Create one, then come back here."
          actionLabel="Go to Accounts"
          onAction={() => router.push("/accounts")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Import Statement
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Upload a CSV, Excel or PDF bank statement and we&apos;ll extract the
          transactions automatically.
        </p>
      </div>

      {error && (
        <div className="card p-4 border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="card p-6 space-y-5">
        <Select
          label="Import into account"
          name="account"
          required
          value={selectedAccount}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center text-center transition-colors",
              dragging
                ? "border-primary-500 bg-primary-500/5"
                : "border-[var(--border-default)]"
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-primary-500" />
            </div>
            <p className="font-medium text-[var(--text-primary)]">
              Drag and drop your statement here
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
              CSV, XLS, XLSX or PDF · up to 10 MB
            </p>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) selectFile(f);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="border border-[var(--border-default)] rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {file.name}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              {!processing && (
                <button
                  onClick={reset}
                  aria-label="Remove file"
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {statement?.status === "completed" ? (
              <div className="mt-5 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Imported {statement.transactions_imported} transactions.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => router.push("/transactions")}
                  >
                    View transactions
                  </Button>
                </div>
              </div>
            ) : statement?.status === "failed" ? (
              <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    We couldn&apos;t parse this statement.
                  </p>
                  {statement.error_message && (
                    <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
                      {statement.error_message}
                    </p>
                  )}
                  <Button variant="secondary" className="mt-3" onClick={reset}>
                    Try another file
                  </Button>
                </div>
              </div>
            ) : processing ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                Parsing your statement — this usually takes a few seconds.
              </div>
            ) : (
              <Button
                className="w-full mt-5"
                onClick={upload}
                loading={uploading}
              >
                <Upload className="w-4 h-4" />
                Upload and import
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-3">
          Tips for a clean import
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-muted)] list-disc pl-5">
          <li>
            Export your statement directly from your bank rather than editing it
            by hand.
          </li>
          <li>
            CSV files parse most reliably; PDFs depend on the bank&apos;s layout.
          </li>
          <li>
            Transactions are auto-categorised, and duplicates within 24 hours are
            flagged rather than double-counted.
          </li>
        </ul>
      </div>
    </div>
  );
}
