"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, CreditCard, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { LoanModal } from "@/components/modals/LoanModal";
import { EmiCalculatorModal } from "@/components/modals/EmiCalculatorModal";
import { useDeleteLoan, useLoans, useMe } from "@/hooks/useFinanceData";
import { formatCurrency } from "@/lib/currency";
import { getErrorMessage } from "@/lib/apiError";
import type { Loan } from "@/types/finance";

const LOAN_LABELS: Record<string, string> = {
  home: "Home Loan",
  car: "Car Loan",
  personal: "Personal Loan",
  education: "Education Loan",
  other: "Other",
};

export default function LoansPage() {
  const { toast } = useToast();
  const { data: user } = useMe();
  const { data: loans = [], isLoading, isError, refetch } = useLoans();
  const remove = useDeleteLoan();

  const [modalOpen, setModalOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const currency = user?.default_currency?.code ?? "USD";

  const totalOutstanding = loans.reduce(
    (s, l) => s + Number(l.outstanding_balance),
    0
  );
  const totalEmi = loans
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + Number(l.emi_amount), 0);

  const handleDelete = async (loan: Loan) => {
    if (!window.confirm(`Delete the loan “${loan.name}”?`)) return;
    try {
      await remove.mutateAsync(loan.id);
      toast("Loan deleted.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  if (isError)
    return (
      <ErrorState message="We couldn't load your loans." onRetry={() => refetch()} />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Loans &amp; EMI
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Track outstanding debt and monthly repayments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setCalcOpen(true)}>
            <Calculator className="w-4 h-4" />
            EMI Calculator
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Loan
          </Button>
        </div>
      </div>

      {loans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Outstanding",
              value: totalOutstanding,
              accent: "amount-negative",
            },
            { label: "Monthly EMI", value: totalEmi, accent: "text-[var(--text-primary)]" },
            {
              label: "Active loans",
              value: loans.filter((l) => l.status === "active").length,
              accent: "text-[var(--text-primary)]",
              raw: true,
            },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm font-medium text-[var(--text-muted)]">
                {s.label}
              </p>
              <p className={`text-2xl font-bold mt-2 ${s.accent}`}>
                {s.raw ? s.value : formatCurrency(s.value, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No loans tracked"
          description="Add a loan to track its EMI, interest and outstanding balance over time."
          actionLabel="Add Loan"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan, i) => {
            const pct = loan.progress_percentage ?? 0;
            return (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {loan.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {LOAN_LABELS[loan.loan_type] ?? loan.loan_type} ·{" "}
                        {loan.interest_rate}% p.a.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(loan)}
                    aria-label={`Delete ${loan.name}`}
                    className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Outstanding</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {formatCurrency(
                        Number(loan.outstanding_balance),
                        currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">EMI</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {formatCurrency(Number(loan.emi_amount), currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Tenure</p>
                    <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {loan.tenure_months} mo
                    </p>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05 }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-[var(--text-muted)]">
                  <span>{pct.toFixed(0)}% repaid</span>
                  <span>
                    Principal{" "}
                    {formatCurrency(Number(loan.principal_amount), currency)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <LoanModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <EmiCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
