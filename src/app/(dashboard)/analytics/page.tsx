"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/ui/States";
import { Select } from "@/components/ui/Form";
import { useDashboard, useMe, useTransactions } from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { CHART_COLORS } from "@/lib/constants";

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
}

const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("90");
  const { data: user } = useMe();
  const { data: dashboard, isLoading, isError, refetch } = useDashboard();

  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const { data: transactions = [] } = useTransactions({
    date_from: dateFrom,
    page_size: 500,
  });

  const currency = user?.default_currency?.code ?? "USD";

  const tooltip = (props: unknown) => {
    const { active, payload, label } = props as {
      active?: boolean;
      payload?: readonly TooltipPayloadEntry[];
      label?: string;
    };
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card px-4 py-3 text-sm shadow-lg">
        <p className="text-[var(--text-muted)] text-xs mb-1">{label}</p>
        {payload.map((e, i) => (
          <p key={i} style={{ color: e.color }} className="font-semibold">
            {e.name}: {formatCurrency(e.value ?? 0, currency)}
          </p>
        ))}
      </div>
    );
  };

  /** Aggregates spending by weekday to surface habitual patterns. */
  const byWeekday = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = names.map((name) => ({ name, amount: 0, count: 0 }));
    for (const t of transactions) {
      if (!t.is_debit) continue;
      const day = new Date(t.date).getDay();
      buckets[day].amount += Number(t.amount);
      buckets[day].count += 1;
    }
    return buckets;
  }, [transactions]);

  const stats = useMemo(() => {
    const expenses = transactions.filter((t) => t.is_debit);
    const total = expenses.reduce((s, t) => s + Number(t.amount), 0);
    const largest = expenses.reduce(
      (max, t) => Math.max(max, Number(t.amount)),
      0
    );
    return {
      total,
      count: expenses.length,
      average: expenses.length ? total / expenses.length : 0,
      largest,
    };
  }, [transactions]);

  if (isLoading) return <PageSkeleton />;
  if (isError || !dashboard)
    return (
      <ErrorState
        message="We couldn't load your analytics."
        onRetry={() => refetch()}
      />
    );

  const { cash_flow, categories, daily_spending, payment_methods } = dashboard;

  const hasData =
    transactions.length > 0 ||
    categories.length > 0 ||
    (cash_flow?.length ?? 0) > 0;

  const cashFlowFormatted = (cash_flow ?? []).map((e) => ({
    ...e,
    month: new Date(e.month + "-01").toLocaleDateString("en-US", {
      month: "short",
    }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Analytics
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            A deeper look at where your money goes.
          </p>
        </div>
        <Select
          name="range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          options={RANGES}
          className="min-w-[170px]"
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          description="Once you record transactions, this page will break down your spending patterns."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total spent", value: formatCurrency(stats.total, currency) },
              { label: "Transactions", value: String(stats.count) },
              {
                label: "Average spend",
                value: formatCurrency(stats.average, currency),
              },
              {
                label: "Largest expense",
                value: formatCurrency(stats.largest, currency),
              },
            ].map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  {s.label}
                </p>
                <p className="text-xl font-bold mt-2 text-[var(--text-primary)]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Income vs Expenses
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Monthly comparison
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cashFlowFormatted}>
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
                  <Tooltip content={tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Spending by day of week
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Where your habits show up
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byWeekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis
                    dataKey="name"
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
                  <Tooltip content={tooltip} />
                  <Bar dataKey="amount" name="Spent" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Category distribution
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">This month</p>
              {categories.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-[var(--text-muted)]">
                  No categorised spending yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
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
                    <Tooltip content={tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Daily spending trend
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Last 30 days
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={daily_spending}>
                  <defs>
                    <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={tooltip} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Spent"
                    stroke="#8b5cf6"
                    fill="url(#analyticsGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {payment_methods.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Payment method breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border-default)]">
                      <th className="pb-3 font-medium">Method</th>
                      <th className="pb-3 font-medium text-right">
                        Transactions
                      </th>
                      <th className="pb-3 font-medium text-right">Total</th>
                      <th className="pb-3 font-medium text-right">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {payment_methods.map((pm) => (
                      <tr key={pm.method}>
                        <td className="py-3 capitalize text-[var(--text-primary)] font-medium">
                          {pm.method.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 text-right text-[var(--text-secondary)]">
                          {pm.count}
                        </td>
                        <td className="py-3 text-right text-[var(--text-primary)] font-medium">
                          {formatCurrency(pm.total, currency)}
                        </td>
                        <td className="py-3 text-right text-[var(--text-secondary)]">
                          {formatCurrency(
                            pm.count ? pm.total / pm.count : 0,
                            currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
