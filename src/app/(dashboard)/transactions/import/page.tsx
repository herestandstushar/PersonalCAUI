"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { qk, useAccounts } from "@/hooks/useFinanceData";
import { cn } from "@/lib/utils";

interface StatementResult {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  transactions_imported: number;
  transactions_skipped: number;
  error_message: string;
  filename: string;
}

function importSummary(data: StatementResult) {
  const parts = [`Imported ${data.transactions_imported} transactions`];
  if (data.transactions_skipped > 0) {
    parts.push(
      `skipped ${data.transactions_skipped} already on this account`
    );
  }
  return `${parts.join("; ")}.`;
}

const ACCEPTED = [".csv", ".xls", ".xlsx", ".pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

const PDF_PASSWORD_INPUT_CLASS =
  "w-full px-3.5 py-2.5 pr-11 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all";

function PdfPasswordField({
  label,
  placeholder,
  value,
  visible,
  onChange,
  onToggleVisible,
}: {
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <Label htmlFor="pdf-password">{label}</Label>
      <div className="relative">
        <input
          id="pdf-password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={PDF_PASSWORD_INPUT_CLASS}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ImportStatementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();

  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPdfPassword, setShowPdfPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(true);
  const [changePassword, setChangePassword] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statement, setStatement] = useState<StatementResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPdf = !!file && file.name.toLowerCase().endsWith(".pdf");
  const needsPassword =
    isPdf ||
    (statement?.status === "failed" &&
      /password/i.test(statement.error_message || ""));

  const selectedAccount =
    accountId ||
    (!isPdf
      ? accounts.find((a) => a.is_default)?.id || accounts[0]?.id || ""
      : "");

  const selectedAccountObj = useMemo(
    () => accounts.find((a) => a.id === selectedAccount),
    [accounts, selectedAccount]
  );

  const hasSavedPassword = useMemo(() => {
    if (selectedAccountObj?.has_statement_password) return true;
    // When auto-detecting, any saved password on the user's accounts may unlock the PDF.
    return isPdf && accounts.some((a) => a.has_statement_password);
  }, [selectedAccountObj, accounts, isPdf]);

  const canUpload = !!file && (isPdf || !!selectedAccount);

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
    setPdfPassword("");
    setShowPdfPassword(false);
    setChangePassword(false);
    setSavePassword(true);
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
            toast(importSummary(data), "success");
          } else {
            toast("Statement could not be parsed.", "error");
          }
        }
      } catch {
        stopPolling();
      }
      if (attempts > 80) stopPolling();
    }, 1500);
  };

  const upload = async () => {
    if (!file || !canUpload) return;
    setUploading(true);
    setError("");

    const body = new FormData();
    body.append("file", file);
    // Only send account when the user explicitly picked one — never send "".
    if (selectedAccount && selectedAccount.trim()) {
      body.append("account", selectedAccount.trim());
    }
    if (pdfPassword) body.append("password", pdfPassword);
    body.append("save_password", savePassword ? "true" : "false");

    try {
      const { data } = await api.post<StatementResult>("/statements/", body, {
        headers: { "Content-Type": "multipart/form-data" },
        // Parse + import can take a while on first response; we usually get
        // pending immediately and poll, but keep headroom for large PDFs.
        timeout: 120000,
      });
      setStatement(data);
      if (data.status === "completed") {
        queryClient.invalidateQueries({ queryKey: qk.transactions });
        queryClient.invalidateQueries({ queryKey: qk.dashboard });
        queryClient.invalidateQueries({ queryKey: qk.accounts });
        toast(importSummary(data), "success");
      } else if (data.status === "failed") {
        toast("Statement could not be parsed.", "error");
      } else {
        pollStatus(data.id);
      }
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
    setPdfPassword("");
    setShowPdfPassword(false);
    setChangePassword(false);
    setSavePassword(true);
    setError("");
  };

  const processing =
    statement?.status === "pending" || statement?.status === "processing";

  const showPasswordField =
    needsPassword &&
    (!hasSavedPassword || changePassword || /password/i.test(statement?.error_message || ""));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Import Statement
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Upload a bank PDF and we&apos;ll detect the bank, create the account if
          needed, and import the transactions. CSV/Excel still work too.
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
          label={isPdf ? "Account (optional)" : "Import into account"}
          name="statement_account"
          required={!isPdf}
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value);
            setChangePassword(false);
            setPdfPassword("");
          }}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          placeholder={
            isPdf
              ? "Auto-detect from PDF (recommended)"
              : accounts.length
                ? "Select an account"
                : "Create an account first for CSV/Excel"
          }
        />
        {isPdf && (
          <p className="text-xs text-[var(--text-muted)] -mt-3">
            Leave blank to detect ICICI / HDFC, create the account automatically,
            then import transactions.
          </p>
        )}

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
              Prefer PDF for auto bank detection · CSV/XLS also supported · up to
              10 MB
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
                    {importSummary(statement)}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    We couldn&apos;t parse this statement.
                  </p>
                  {statement.error_message && (
                    <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">
                      {statement.error_message}
                    </p>
                  )}
                  {/password/i.test(statement.error_message || "") ? (
                    <div className="mt-3 space-y-3">
                      <PdfPasswordField
                        label="PDF password"
                        placeholder="Enter the statement password"
                        value={pdfPassword}
                        visible={showPdfPassword}
                        onChange={setPdfPassword}
                        onToggleVisible={() => setShowPdfPassword((v) => !v)}
                      />
                      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={savePassword}
                          onChange={(e) => setSavePassword(e.target.checked)}
                          className="rounded border-[var(--border-default)]"
                        />
                        Remember password for this account
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={upload} loading={uploading}>
                          Unlock and import
                        </Button>
                        <Button variant="secondary" onClick={reset}>
                          Try another file
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" className="mt-3" onClick={reset}>
                      Try another file
                    </Button>
                  )}
                </div>
              </div>
            ) : processing ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                Parsing your statement — this usually takes a few seconds.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {needsPassword && hasSavedPassword && !changePassword && (
                  <div className="p-3 rounded-xl bg-[var(--surface-hover)] text-sm text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Using a saved statement password
                      {selectedAccountObj?.has_statement_password
                        ? ` for ${selectedAccountObj.name}`
                        : ""}
                      .
                    </span>
                    <button
                      type="button"
                      className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      onClick={() => setChangePassword(true)}
                    >
                      Change password
                    </button>
                  </div>
                )}

                {showPasswordField && (
                  <>
                    <PdfPasswordField
                      label="PDF password"
                      placeholder={
                        hasSavedPassword && changePassword
                          ? "Enter a new statement password"
                          : "Leave blank if the PDF is not locked"
                      }
                      value={pdfPassword}
                      visible={showPdfPassword}
                      onChange={setPdfPassword}
                      onToggleVisible={() => setShowPdfPassword((v) => !v)}
                    />
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={savePassword}
                        onChange={(e) => setSavePassword(e.target.checked)}
                        className="rounded border-[var(--border-default)]"
                      />
                      Remember password for next import
                    </label>
                    {changePassword && (
                      <button
                        type="button"
                        className="text-xs text-[var(--text-muted)] hover:underline"
                        onClick={() => {
                          setChangePassword(false);
                          setPdfPassword("");
                        }}
                      >
                        Cancel — keep saved password
                      </button>
                    )}
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={upload}
                  loading={uploading}
                  disabled={!canUpload}
                >
                  <Upload className="w-4 h-4" />
                  {isPdf && !selectedAccount
                    ? "Detect bank and import"
                    : "Upload and import"}
                </Button>
              </div>
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
            Leave Account blank (recommended) for ICICI / HDFC PDFs — the bank and
            account are detected from the file. Selecting an account is optional.
          </li>
          <li>
            ICICI and HDFC Bank PDFs are detected automatically — bank name,
            account number and transactions are read from the file.
          </li>
          <li>
            If the account doesn&apos;t exist yet, FinSight creates it for you.
          </li>
          <li>
            PDF passwords are saved (encrypted) on the account so the next import
            unlocks automatically. Change them anytime on import or in Edit
            account.
          </li>
          <li>
            CSV/Excel still work; pick an account first for those formats.
          </li>
        </ul>
      </div>
    </div>
  );
}
