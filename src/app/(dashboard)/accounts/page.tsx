"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Pencil,
  Trash2,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { AccountModal } from "@/components/modals/AccountModal";
import {
  useAccountSummary,
  useAccounts,
  useDeleteAccount,
  useMe,
  useResetAccount,
  useResetAllAccounts,
} from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { Account } from "@/types/account";

const ICONS: Record<string, LucideIcon> = {
  bank_account: Building2,
  credit_card: CreditCard,
  wallet: Wallet,
  cash: Banknote,
  upi: Smartphone,
};

const TYPE_LABELS: Record<string, string> = {
  bank_account: "Bank Account",
  credit_card: "Credit Card",
  wallet: "Wallet",
  cash: "Cash",
  upi: "UPI",
};

export default function AccountsPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: accounts = [], isLoading, isError, refetch } = useAccounts();
  const { data: summary } = useAccountSummary();
  const remove = useDeleteAccount();
  const resetOne = useResetAccount();
  const resetAll = useResetAllAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const currency = user?.default_currency?.code ?? "USD";
  const resetting =
    resetOne.isPending || resetAll.isPending || remove.isPending;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setModalOpen(true);
  };

  const handleDelete = async (account: Account) => {
    if (
      !window.confirm(
        `Delete “${account.name}”? Its transactions will be removed from your totals.`
      )
    )
      return;
    try {
      await remove.mutateAsync(account.id);
      toast("Account deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const handleReset = async (account: Account) => {
    if (
      !window.confirm(
        `Reset “${account.name}”? This clears all transactions and statement imports for this account and sets the balance to 0. The account itself stays.`
      )
    )
      return;
    try {
      const result = await resetOne.mutateAsync(account.id);
      toast(
        `Cleared ${result.transactions_cleared} transactions from “${account.name}”.`
      );
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const handleResetAll = async () => {
    if (accounts.length === 0) return;
    if (
      !window.confirm(
        `Reset ALL ${accounts.length} accounts? This clears every transaction and statement import, and sets all balances to 0. Accounts themselves stay.`
      )
    )
      return;
    if (
      !window.confirm(
        "This cannot be undone from the app. Continue only if you are sure."
      )
    )
      return;
    try {
      const result = await resetAll.mutateAsync();
      toast(
        `Reset ${result.accounts_reset} accounts (${result.transactions_cleared} transactions cleared).`
      );
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState
        message="We couldn't load your accounts."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Accounts
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            All your bank accounts, cards and wallets in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleResetAll}
              disabled={resetting}
            >
              <RotateCcw className="w-4 h-4" />
              Reset all history
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Net Worth", value: summary.net_worth, accent: "text-[var(--text-primary)]" },
            { label: "Total Assets", value: summary.total_assets, accent: "amount-positive" },
            {
              label: "Total Liabilities",
              value: summary.total_liabilities,
              accent: "amount-negative",
            },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm font-medium text-[var(--text-muted)]">
                {s.label}
              </p>
              <p className={`text-2xl font-bold mt-2 ${s.accent}`}>
                {formatCurrency(Number(s.value), currency)}
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
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first account to start tracking balances and transactions."
          actionLabel="Add Account"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, i) => {
            const Icon = ICONS[account.account_type] ?? Wallet;
            const isCredit = account.account_type === "credit_card";
            const balance = Number(account.current_balance);
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${account.color}20` }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: account.color }}
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReset(account)}
                      disabled={resetting}
                      aria-label={`Reset ${account.name} history`}
                      title="Clear transactions"
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(account)}
                      aria-label={`Edit ${account.name}`}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account)}
                      disabled={resetting}
                      aria-label={`Delete ${account.name}`}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    {account.name}
                  </h3>
                  {account.is_default && (
                    <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {TYPE_LABELS[account.account_type] ?? account.account_type}
                  {account.bank_name ? ` · ${account.bank_name}` : ""}
                  {account.masked_account_number
                    ? ` · ${account.masked_account_number}`
                    : ""}
                </p>

                <p
                  className={`text-2xl font-bold mt-4 ${
                    isCredit && balance > 0
                      ? "amount-negative"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {formatCurrency(
                    balance,
                    account.currency_detail?.code ?? currency
                  )}
                </p>
                {isCredit && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Outstanding / amount used
                  </p>
                )}

                {isCredit && account.credit_limit && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
                      <span>Credit used</span>
                      <span>
                        {(account.credit_utilization ?? 0).toFixed(0)}% of{" "}
                        {formatCurrency(
                          Number(account.credit_limit),
                          account.currency_detail?.code ?? currency
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${Math.min(account.credit_utilization ?? 0, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          <button
            onClick={openCreate}
            className="card p-5 border-dashed flex flex-col items-center justify-center gap-2 min-h-[180px] text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Add New Account</span>
          </button>
        </div>
      )}

      <AccountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        account={editing}
      />
    </div>
  );
}
