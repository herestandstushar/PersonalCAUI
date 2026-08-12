"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ArrowUpDown,
  Upload,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Form";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { TransactionModal } from "@/components/modals/TransactionModal";
import {
  useCategories,
  useDeleteTransaction,
  useMe,
  useTransactions,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import { TRANSACTION_TYPES } from "@/lib/constants";
import type { Transaction } from "@/types/transaction";

type SortKey = "date" | "amount";

export default function TransactionsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: categories = [] } = useCategories();
  const remove = useDeleteTransaction();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const {
    data: transactions = [],
    isLoading,
    isError,
    refetch,
  } = useTransactions({
    search: search.trim() || undefined,
    transaction_type: (type || undefined) as never,
    category: category || undefined,
  });

  const currency = user?.default_currency?.code ?? "USD";

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      const diff =
        sortBy === "amount"
          ? Number(a.amount) - Number(b.amount)
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDesc ? -diff : diff;
    });
    return copy;
  }, [transactions, sortBy, sortDesc]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.is_credit) income += Number(t.amount);
      else if (t.is_debit) expense += Number(t.amount);
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc((d) => !d);
    else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm("Delete this transaction? Balances will be adjusted."))
      return;
    try {
      await remove.mutateAsync(t.id);
      toast("Transaction deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't load your transactions."
        onRetry={() => refetch()}
      />
    );

  const hasFilters = Boolean(search.trim() || type || category);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Transactions
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Every movement of money across your accounts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/transactions/import">
            <Button variant="secondary">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </Link>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Income", value: totals.income, accent: "amount-positive" },
          { label: "Expenses", value: totals.expense, accent: "amount-negative" },
          {
            label: "Net",
            value: totals.net,
            accent:
              totals.net >= 0 ? "amount-positive" : "amount-negative",
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

      {/* Filters */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, description or notes…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
        <div className="flex gap-3">
          <Select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TRANSACTION_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            placeholder="All types"
            className="min-w-[150px]"
          />
          <Select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="All categories"
            className="min-w-[160px]"
          />
          <Button
            variant="secondary"
            onClick={() => toggleSort(sortBy === "date" ? "amount" : "date")}
            className="whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === "date" ? "Date" : "Amount"}
            {sortDesc ? " ↓" : " ↑"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="card divide-y divide-[var(--border-default)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={hasFilters ? "No matching transactions" : "No transactions yet"}
          description={
            hasFilters
              ? "Try clearing your filters or searching for something else."
              : "Add a transaction manually or import a bank statement to get started."
          }
          actionLabel={hasFilters ? undefined : "Add Transaction"}
          onAction={hasFilters ? undefined : openCreate}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border-default)]">
            {sorted.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-4 p-4 hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{
                    backgroundColor: `${t.category_detail?.color ?? "#94a3b8"}20`,
                    color: t.category_detail?.color ?? "#94a3b8",
                  }}
                >
                  {(t.merchant_name || t.description || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {t.merchant_name || t.description || "Transaction"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] truncate">
                    {new Date(t.date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {t.category_detail?.name ?? "Uncategorised"}
                    {t.account_detail ? ` · ${t.account_detail.name}` : ""}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold ${
                      t.is_credit
                        ? "amount-positive"
                        : t.is_debit
                          ? "amount-negative"
                          : "text-[var(--text-primary)]"
                    }`}
                  >
                    {t.is_credit ? "+" : t.is_debit ? "-" : ""}
                    {formatCurrency(Number(t.amount), currency)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] capitalize">
                    {t.payment_method?.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditing(t);
                      setModalOpen(true);
                    }}
                    aria-label="Edit transaction"
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    aria-label="Delete transaction"
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editing}
      />
    </div>
  );
}
