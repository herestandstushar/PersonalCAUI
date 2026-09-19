"use client";

import { useMemo, useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useMe, useTransactions } from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import type { Transaction } from "@/types/transaction";

type GroupBy = "category" | "merchant" | "account" | "payment_method";

const GROUP_OPTIONS = [
  { value: "category", label: "By category" },
  { value: "merchant", label: "By merchant" },
  { value: "account", label: "By account" },
  { value: "payment_method", label: "By payment method" },
];

function groupKey(t: Transaction, by: GroupBy): string {
  switch (by) {
    case "category":
      return t.category_detail?.name ?? "Uncategorised";
    case "merchant":
      return t.merchant_name || "Unknown";
    case "account":
      return t.account_detail?.name ?? "Unknown";
    case "payment_method":
      return (t.payment_method ?? "other").replace(/_/g, " ");
  }
}

/** Escapes a value for safe inclusion in a CSV cell. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();

  const startOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const [from, setFrom] = useState(startOfMonth);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<GroupBy>("category");

  const {
    data: transactions = [],
    isLoading,
    isError,
    refetch,
  } = useTransactions({ date_from: from, date_to: to, page_size: 500 });

  const currency = user?.default_currency?.code ?? "USD";

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.is_credit) income += Number(t.amount);
      else if (t.is_debit) expense += Number(t.amount);
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const rows = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      if (!t.is_debit) continue;
      const key = groupKey(t, groupBy);
      const entry = map.get(key) ?? { total: 0, count: 0 };
      entry.total += Number(t.amount);
      entry.count += 1;
      map.set(key, entry);
    }
    const total = [...map.values()].reduce((s, e) => s + e.total, 0);
    return [...map.entries()]
      .map(([name, e]) => ({
        name,
        ...e,
        share: total > 0 ? (e.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, groupBy]);

  const exportCsv = () => {
    if (transactions.length === 0) {
      toast("There is nothing to export for this period.", "error");
      return;
    }

    const header = [
      "Date",
      "Type",
      "Merchant",
      "Description",
      "Category",
      "Account",
      "Payment method",
      "Amount",
    ];
    const lines = transactions.map((t) =>
      [
        t.date,
        t.transaction_type,
        t.merchant_name,
        t.description,
        t.category_detail?.name ?? "",
        t.account_detail?.name ?? "",
        t.payment_method,
        Number(t.amount).toFixed(2),
      ]
        .map(csvCell)
        .join(",")
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finsight-transactions-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${transactions.length} transactions.`);
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't build your report."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Reports
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Summarise any date range and export it.
          </p>
        </div>
        <Button onClick={exportCsv} disabled={transactions.length === 0}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="From"
          name="from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To"
          name="to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Select
          label="Group by"
          name="group_by"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          options={GROUP_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Income", value: summary.income, accent: "amount-positive" },
          { label: "Expenses", value: summary.expense, accent: "amount-negative" },
          {
            label: "Net",
            value: summary.net,
            accent: summary.net >= 0 ? "amount-positive" : "amount-negative",
          },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-2 ${s.accent}`}>
              {formatCurrency(s.value, currency)}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="card p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No expenses in this period"
          description="Pick a different date range, or add some transactions first."
        />
      ) : (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Expense breakdown{" "}
            <span className="text-sm font-normal text-[var(--text-muted)]">
              ({transactions.length} transactions)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-default)]">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium text-right">Count</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right w-40">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td className="py-3 text-[var(--text-primary)] font-medium capitalize">
                      {r.name}
                    </td>
                    <td className="py-3 text-right text-[var(--text-secondary)]">
                      {r.count}
                    </td>
                    <td className="py-3 text-right text-[var(--text-primary)] font-medium">
                      {formatCurrency(r.total, currency)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-2 w-20 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${r.share}%` }}
                          />
                        </div>
                        <span className="text-[var(--text-muted)] w-11 text-right">
                          {r.share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
