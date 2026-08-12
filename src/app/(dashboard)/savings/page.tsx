"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  ContributeModal,
  SavingsGoalModal,
} from "@/components/modals/SavingsGoalModal";
import {
  useDeleteSavingsGoal,
  useMe,
  useSavingsGoals,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { SavingsGoal } from "@/types/finance";

export default function SavingsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: goals = [], isLoading, isError, refetch } = useSavingsGoals();
  const remove = useDeleteSavingsGoal();

  const [createOpen, setCreateOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const currency = user?.default_currency?.code ?? "USD";

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);

  const handleDelete = async (goal: SavingsGoal) => {
    if (!window.confirm(`Delete the goal “${goal.name}”?`)) return;
    try {
      await remove.mutateAsync(goal.id);
      toast("Savings goal deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't load your savings goals."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Savings Goals
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Set targets and watch your progress build up.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total saved", value: totalSaved, accent: "amount-positive" },
            { label: "Total target", value: totalTarget, accent: "text-[var(--text-primary)]" },
            {
              label: "Remaining",
              value: Math.max(totalTarget - totalSaved, 0),
              accent: "text-[var(--text-primary)]",
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
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="Create a goal — an emergency fund, a holiday, a new laptop — and track your progress."
          actionLabel="New Goal"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal, i) => {
            const saved = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
            const isComplete = goal.status === "completed" || saved >= target;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    {isComplete ? (
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: goal.color }}
                      />
                    ) : (
                      <Target className="w-5 h-5" style={{ color: goal.color }} />
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(goal)}
                    aria-label={`Delete ${goal.name}`}
                    className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-semibold text-[var(--text-primary)]">
                  {goal.name}
                </h3>
                {goal.target_date && (
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    Target{" "}
                    {new Date(goal.target_date).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

                <div className="flex items-baseline justify-between mt-4 mb-2">
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    {formatCurrency(saved, currency)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    of {formatCurrency(target, currency)}
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  {pct.toFixed(0)}% complete
                </p>

                <div className="mt-auto pt-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={isComplete}
                    onClick={() => setContributeGoal(goal)}
                  >
                    {isComplete ? "Goal reached" : "Add funds"}
                  </Button>
                </div>
              </motion.div>
            );
          })}

          <button
            onClick={() => setCreateOpen(true)}
            className="card p-5 border-dashed flex flex-col items-center justify-center gap-2 min-h-[220px] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Start a New Savings Goal</span>
          </button>
        </div>
      )}

      <SavingsGoalModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ContributeModal
        open={Boolean(contributeGoal)}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
      />
    </div>
  );
}
