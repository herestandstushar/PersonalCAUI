"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CreditCard,
  Target,
  Shield,
  Sparkles,
  Calendar,
  BarChart3,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useDashboard, useInsights, useMe } from "@/hooks/useFinanceData";
import { formatCurrency, formatCompactCurrency } from "@/lib/currency";
import { CHART_COLORS } from "@/lib/constants";
import { ErrorState, PageSkeleton } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "@/components/modals/TransactionModal";
import type { Insight } from "@/types/finance";

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
}

function AnimatedCounter({
  value,
  currency,
}: {
  value: number;
  currency?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * eased;
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{formatCompactCurrency(display, currency)}</span>;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm shadow-lg">
      <p className="text-[var(--text-muted)] text-xs mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {formatCurrency(entry.value ?? 0, currency)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: insightsData } = useInsights();
  const [addOpen, setAddOpen] = useState(false);

  const currency = user?.default_currency?.code ?? "USD";
  const insights: Insight[] = Array.isArray(insightsData)
    ? insightsData
    : insightsData?.insights ?? [];

  if (isLoading) return <PageSkeleton />;
  if (isError || !data)
    return (
      <ErrorState
        message="We couldn't load your dashboard. Check that the backend is running and try again."
        onRetry={() => refetch()}
      />
    );

  const {
    overview,
    spending,
    income,
    cash_flow,
    categories,
    merchants,
    payment_methods,
    daily_spending,
    financial_health,
  } = data;

  const hasActivity =
    (cash_flow?.length ?? 0) > 0 ||
    (categories?.length ?? 0) > 0 ||
    spending.this_year > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const cashFlowFormatted = (cash_flow ?? []).map((e) => ({
    ...e,
    month: new Date(e.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
  }));

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 17
                  ? "afternoon"
                  : "evening"}
              , {user?.first_name || "there"} 👋
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              Here&apos;s your financial overview for{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add transaction
          </Button>
        </motion.div>

        {!hasActivity && (
          <motion.div
            variants={itemVariants}
            className="card p-6 border-dashed flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
          >
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                No activity yet
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Add your first transaction or import a bank statement to see
                your dashboard come alive.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button variant="secondary" onClick={() => router.push("/transactions/import")}>
                Import statement
              </Button>
              <Button onClick={() => setAddOpen(true)}>Add transaction</Button>
            </div>
          </motion.div>
        )}

        {/* ---- Hero metrics ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            variants={itemVariants}
            className="card-elevated p-5 gradient-border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Net Worth
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              <AnimatedCounter value={overview.net_worth} currency={currency} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Assets minus liabilities
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Income
              </span>
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              <AnimatedCounter
                value={income.this_month}
                currency={currency}
              />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">This month</p>
          </motion.div>

          <motion.div variants={itemVariants} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Expenses
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              <AnimatedCounter
                value={spending.this_month}
                currency={currency}
              />
            </div>
            <div className="flex gap-3 mt-2 text-xs text-[var(--text-muted)]">
              <span>Today: {formatCurrency(spending.today, currency)}</span>
              <span>Week: {formatCurrency(spending.this_week, currency)}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Health Score
              </span>
              <div className="w-9 h-9 rounded-xl bg-lime-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-lime-500" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span
                className="text-4xl font-bold"
                style={{ color: financial_health.color }}
              >
                {financial_health.score}
              </span>
              <span className="text-sm font-medium text-[var(--text-muted)] mb-1">
                /100
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: financial_health.color }}>
              {financial_health.label}
            </p>
          </motion.div>
        </div>

        {/* ---- Summary tiles ---- */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {[
            {
              label: "Savings",
              value: overview.savings_this_month,
              icon: PiggyBank,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Savings Rate",
              value: overview.savings_rate,
              icon: Target,
              color: "text-green-500",
              bg: "bg-green-500/10",
              suffix: "%",
            },
            {
              label: "Assets",
              value: overview.total_assets,
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Liabilities",
              value: overview.total_liabilities,
              icon: CreditCard,
              color: "text-red-500",
              bg: "bg-red-500/10",
            },
            {
              label: "Yearly Spend",
              value: spending.this_year,
              icon: BarChart3,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
            {
              label: "Avg Daily",
              value: spending.this_month / 30,
              icon: Calendar,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {item.label}
                </span>
              </div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {item.suffix
                  ? `${item.value.toFixed(1)}${item.suffix}`
                  : formatCompactCurrency(item.value, currency)}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ---- Cash flow + categories ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div variants={itemVariants} className="lg:col-span-2 card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Cash Flow
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Income vs Expenses — Last 6 months
              </p>
            </div>
            {cashFlowFormatted.length === 0 ? (
              <EmptyChart message="No cash flow data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cashFlowFormatted}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                    strokeWidth={2}
                    name="Expense"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Spending by Category
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">This month</p>
            {categories.length === 0 ? (
              <EmptyChart message="No categorised spending yet." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="total"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="var(--surface-card)"
                    >
                      {categories.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2 max-h-36 overflow-y-auto">
                  {categories.slice(0, 5).map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[var(--text-secondary)]">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">
                        {formatCurrency(cat.total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* ---- Merchants + payment methods ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Top Merchants
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Highest spending this month
            </p>
            {merchants.length === 0 ? (
              <EmptyChart message="No merchant data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={merchants} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Bar
                    dataKey="total"
                    name="Spent"
                    fill="#6366f1"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="card p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Payment Methods
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">How you pay</p>
            {payment_methods.length === 0 ? (
              <EmptyChart message="No payment data yet." />
            ) : (
              <div className="space-y-4">
                {payment_methods.map((pm, i) => {
                  const maxTotal = Math.max(
                    ...payment_methods.map((p) => p.total)
                  );
                  const pct = maxTotal ? (pm.total / maxTotal) * 100 : 0;
                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-[var(--text-secondary)] font-medium capitalize">
                          {pm.method.replace(/_/g, " ")}
                        </span>
                        <span className="text-[var(--text-primary)] font-semibold">
                          {formatCurrency(pm.total, currency)}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ---- Daily spending ---- */}
        <motion.div variants={itemVariants} className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Daily Spending
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">Last 30 days</p>
          {daily_spending.length === 0 ? (
            <EmptyChart message="No spending recorded in the last 30 days." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily_spending}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#8b5cf6"
                  fill="url(#dailyGrad)"
                  strokeWidth={2}
                  name="Spent"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ---- Insights ---- */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              AI Insights
            </h3>
          </div>
          {insights.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Insights appear once you have a few weeks of transaction history.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight, i) => (
                <button
                  key={i}
                  onClick={() => router.push(insight.action_url || "/")}
                  className={`p-4 rounded-xl border text-sm text-left transition-transform hover:-translate-y-0.5 ${
                    insight.type === "success"
                      ? "border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
                      : insight.type === "warning"
                        ? "border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                        : insight.type === "info"
                          ? "border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                          : "border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                  }`}
                >
                  <p className="font-semibold mb-1">{insight.title}</p>
                  <p className="opacity-90">{insight.message}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      <TransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}
