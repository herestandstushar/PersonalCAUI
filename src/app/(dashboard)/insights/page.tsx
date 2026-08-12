"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState, SkeletonCard } from "@/components/ui/States";
import { useInsights } from "@/hooks/useFinanceData";
import type { Insight, InsightType } from "@/types/finance";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle2,
};

const STYLES: Record<InsightType, { card: string; icon: string }> = {
  warning: {
    card: "border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10",
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  success: {
    card: "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10",
    icon: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  info: {
    card: "border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10",
    icon: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  neutral: {
    card: "border-[var(--border-default)] bg-[var(--surface-card)]",
    icon: "bg-primary-500/10 text-primary-500",
  },
};

export default function InsightsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useInsights();

  const insights: Insight[] = Array.isArray(data) ? data : data?.insights ?? [];

  if (isError)
    return (
      <ErrorState
        message="We couldn't generate your insights."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Insights
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Patterns and anomalies detected in your spending.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="card p-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Not enough data yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md">
            Insights are generated from your transaction history. Once you have
            a few weeks of activity, patterns will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const Icon = ICONS[insight.icon] ?? Sparkles;
            const style = STYLES[insight.type] ?? STYLES.neutral;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`card p-5 ${style.card}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {insight.message}
                    </p>
                    {insight.action_text && (
                      <button
                        onClick={() => router.push(insight.action_url || "/")}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2.5 transition-all"
                      >
                        {insight.action_text}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
