"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, PiggyBank, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { BudgetModal } from "@/components/modals/BudgetModal";
import {
  useBudgetStatus,
  useDeleteBudget,
  useMe,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { BudgetStatus } from "@/types/finance";

export default function BudgetsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: budgets = [], isLoading, isError, refetch } = useBudgetStatus();
  const remove = useDeleteBudget();
  const [modalOpen, setModalOpen] = useState(false);

  const currency = user?.default_currency?.code ?? "USD";

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.is_over_budget);

  const handleDelete = async (b: BudgetStatus) => {
    if (!window.confirm(`Delete the budget for ${b.category_name}?`)) return;
    try {
      await remove.mutateAsync(b.budget_id);
      toast("Budget deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState message="We couldn't load your budgets." onRetry={() => refetch()} />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Budgets
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Set spending limits and track them against real transactions.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Budget
        </Button>
      </div>

      {budgets.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total budgeted", value: totalBudget, accent: "text-[var(--text-primary)]" },
              { label: "Spent", value: totalSpent, accent: "amount-negative" },
              {
                label: "Remaining",
                value: totalBudget - totalSpent,
                accent:
                  totalBudget - totalSpent >= 0
                    ? "amount-positive"
                    : "amount-negative",
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

          {overBudget.length > 0 && (
            <div className="card p-4 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You&apos;re over budget in{" "}
                <strong>
                  {overBudget.map((b) => b.category_name).join(", ")}
                </strong>
                . Consider adjusting your limits or reducing spending.
              </p>
            </div>
          )}
        </>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets yet"
          description="Create a budget for a category to start tracking your spending against a limit."
          actionLabel="Create Budget"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b, i) => {
            // percentage_used is clamped to 100 server-side; recompute for overage.
            const rawPct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
            return (
              <motion.div
                key={b.budget_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${b.category_color}20` }}
                    >
                      <PiggyBank
                        className="w-5 h-5"
                        style={{ color: b.category_color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {b.category_name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] capitalize">
                        {b.period}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(b)}
                    aria-label={`Delete budget for ${b.category_name}`}
                    className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    {formatCurrency(b.spent, currency)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    of {formatCurrency(b.amount, currency)}
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(rawPct, 100)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: b.is_over_budget
                        ? "#ef4444"
                        : rawPct > 80
                          ? "#f59e0b"
                          : b.category_color,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-sm">
                  <span
                    className={
                      b.is_over_budget
                        ? "amount-negative font-medium"
                        : "text-[var(--text-muted)]"
                    }
                  >
                    {rawPct.toFixed(0)}% used
                  </span>
                  <span
                    className={
                      b.available >= 0 ? "amount-positive" : "amount-negative"
                    }
                  >
                    {b.available >= 0
                      ? `${formatCurrency(b.available, currency)} left`
                      : `${formatCurrency(Math.abs(b.available), currency)} over`}
                  </span>
                </div>
              </motion.div>
            );
          })}

          <button
            onClick={() => setModalOpen(true)}
            className="card p-5 border-dashed flex flex-col items-center justify-center gap-2 min-h-[180px] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Add Budget Category</span>
          </button>
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
