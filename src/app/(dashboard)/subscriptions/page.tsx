"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { SubscriptionModal } from "@/components/modals/SubscriptionModal";
import {
  useDeleteSubscription,
  useMe,
  useSubscriptions,
  useUpdateSubscription,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { Subscription } from "@/types/finance";

/** Normalises any billing cycle to a comparable monthly cost. */
const MONTHLY_FACTOR: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const {
    data: subscriptions = [],
    isLoading,
    isError,
    refetch,
  } = useSubscriptions();
  const remove = useDeleteSubscription();
  const update = useUpdateSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  const currency = user?.default_currency?.code ?? "USD";

  const active = subscriptions.filter((s) => s.status === "active");

  const monthlyCost = useMemo(
    () =>
      active.reduce(
        (sum, s) =>
          sum + Number(s.amount) * (MONTHLY_FACTOR[s.billing_cycle] ?? 1),
        0
      ),
    [active]
  );

  const pastDue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return active.filter((s) => s.next_billing_date < today);
  }, [active]);

  const handleDelete = async (sub: Subscription) => {
    if (!window.confirm(`Delete the subscription “${sub.name}”?`)) return;
    try {
      await remove.mutateAsync(sub.id);
      toast("Subscription deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const toggleStatus = async (sub: Subscription) => {
    const next = sub.status === "active" ? "paused" : "active";
    try {
      await update.mutateAsync({ id: sub.id, payload: { status: next } });
      toast(next === "active" ? "Subscription resumed." : "Subscription paused.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  /** Rolls the billing date forward by one cycle. */
  const markBilled = async (sub: Subscription) => {
    const d = new Date(sub.next_billing_date);
    if (sub.billing_cycle === "weekly") d.setDate(d.getDate() + 7);
    else if (sub.billing_cycle === "monthly") d.setMonth(d.getMonth() + 1);
    else if (sub.billing_cycle === "quarterly") d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);

    try {
      await update.mutateAsync({
        id: sub.id,
        payload: { next_billing_date: d.toISOString().slice(0, 10) },
      });
      toast(`${sub.name} moved to the next billing cycle.`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't load your subscriptions."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Subscriptions
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Everything that bills you on a schedule.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {subscriptions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Monthly cost", value: formatCurrency(monthlyCost, currency) },
            {
              label: "Yearly cost",
              value: formatCurrency(monthlyCost * 12, currency),
            },
            { label: "Active", value: String(active.length) },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm font-medium text-[var(--text-muted)]">
                {s.label}
              </p>
              <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {pastDue.length > 0 && (
        <div className="card p-4 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{pastDue.map((s) => s.name).join(", ")}</strong>{" "}
              {pastDue.length === 1 ? "has a" : "have"} billing date in the past.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => pastDue.forEach((s) => markBilled(s))}
            loading={update.isPending}
          >
            Roll forward
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No subscriptions tracked"
          description="Add your recurring services to see exactly what they cost you each month."
          actionLabel="Add Subscription"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-5 group ${
                sub.status !== "active" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: sub.color || "#6366f1" }}
                >
                  {sub.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => handleDelete(sub)}
                  aria-label={`Delete ${sub.name}`}
                  className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {sub.name}
                </h3>
                {sub.url && (
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${sub.name} website`}
                    className="text-[var(--text-muted)] hover:text-primary-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] capitalize mt-0.5">
                {sub.billing_cycle} · {sub.status}
              </p>

              <p className="text-2xl font-bold text-[var(--text-primary)] mt-3">
                {formatCurrency(Number(sub.amount), currency)}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Next bill{" "}
                {new Date(sub.next_billing_date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => toggleStatus(sub)}
                >
                  {sub.status === "active" ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => markBilled(sub)}
                >
                  Mark billed
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <SubscriptionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
