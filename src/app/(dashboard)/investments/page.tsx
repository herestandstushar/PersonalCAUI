"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Trash2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import {
  useDeleteAsset,
  useMe,
  usePortfolios,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { InvestmentAsset } from "@/types/finance";

const ASSET_LABELS: Record<string, string> = {
  stock: "Stock",
  crypto: "Crypto",
  mutual_fund: "Mutual Fund",
  fixed_deposit: "Fixed Deposit",
  real_estate: "Real Estate",
  other: "Other",
};

export default function InvestmentsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: portfolios = [], isLoading, isError, refetch } = usePortfolios();
  const remove = useDeleteAsset();
  const [modalOpen, setModalOpen] = useState(false);

  const currency = user?.default_currency?.code ?? "USD";

  const assets = useMemo(
    () => portfolios.flatMap((p) => p.assets ?? []),
    [portfolios]
  );

  const totals = useMemo(() => {
    let invested = 0;
    let value = 0;
    for (const a of assets) {
      invested += Number(a.quantity) * Number(a.average_buy_price);
      value += Number(a.quantity) * Number(a.current_price);
    }
    const returns = value - invested;
    return {
      invested,
      value,
      returns,
      pct: invested > 0 ? (returns / invested) * 100 : 0,
    };
  }, [assets]);

  const handleDelete = async (asset: InvestmentAsset) => {
    if (!window.confirm(`Remove “${asset.name}” from your portfolio?`)) return;
    try {
      await remove.mutateAsync(asset.id);
      toast("Asset removed.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't load your portfolio."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Investments
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Track your holdings and how they&apos;re performing.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Current value
            </p>
            <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">
              {formatCurrency(totals.value, currency)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Invested
            </p>
            <p className="text-2xl font-bold mt-2 text-[var(--text-primary)]">
              {formatCurrency(totals.invested, currency)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Total returns
            </p>
            <p
              className={`text-2xl font-bold mt-2 ${
                totals.returns >= 0 ? "amount-positive" : "amount-negative"
              }`}
            >
              {formatCurrency(totals.returns, currency)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Return %
            </p>
            <p
              className={`text-2xl font-bold mt-2 flex items-center gap-1 ${
                totals.pct >= 0 ? "amount-positive" : "amount-negative"
              }`}
            >
              {totals.pct >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {totals.pct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No investments tracked"
          description="Add a stock, mutual fund, crypto holding or any other asset to start tracking returns."
          actionLabel="Add Asset"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, i) => {
            const invested =
              Number(asset.quantity) * Number(asset.average_buy_price);
            const value = Number(asset.quantity) * Number(asset.current_price);
            const gain = value - invested;
            const pct = invested > 0 ? (gain / invested) * 100 : 0;

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {asset.symbol ? `${asset.symbol} · ` : ""}
                      {ASSET_LABELS[asset.asset_type] ?? asset.asset_type}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(asset)}
                    aria-label={`Remove ${asset.name}`}
                    className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(value, currency)}
                </p>
                <p
                  className={`text-sm font-medium mt-1 flex items-center gap-1 ${
                    gain >= 0 ? "amount-positive" : "amount-negative"
                  }`}
                >
                  {gain >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatCurrency(gain, currency)} ({pct.toFixed(2)}%)
                </p>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-default)] text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Qty</p>
                    <p className="font-medium text-[var(--text-primary)] mt-0.5">
                      {Number(asset.quantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Avg buy</p>
                    <p className="font-medium text-[var(--text-primary)] mt-0.5">
                      {formatCurrency(
                        Number(asset.average_buy_price),
                        currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Current</p>
                    <p className="font-medium text-[var(--text-primary)] mt-0.5">
                      {formatCurrency(Number(asset.current_price), currency)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <button
            onClick={() => setModalOpen(true)}
            className="card p-5 border-dashed flex flex-col items-center justify-center gap-2 min-h-[200px] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Add Asset</span>
          </button>
        </div>
      )}

      <InvestmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
