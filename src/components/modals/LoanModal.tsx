"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { useAccounts, useCreateLoan } from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import { formatCurrency } from "@/lib/currency";

const LOAN_TYPES = [
  { value: "home", label: "Home Loan" },
  { value: "car", label: "Car Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "education", label: "Education Loan" },
  { value: "other", label: "Other" },
];

/** Standard amortised EMI: P·r·(1+r)^n / ((1+r)^n − 1). */
function calculateEmi(principal: number, annualRate: number, months: number) {
  if (!principal || !months) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function LoanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: accounts = [] } = useAccounts();
  const create = useCreateLoan();

  const [name, setName] = useState("");
  const [loanType, setLoanType] = useState("personal");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [account, setAccount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setName("");
    setLoanType("personal");
    setPrincipal("");
    setRate("");
    setTenure("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setAccount("");
    setErrors({});
    setFormError("");
  });

  const emi = useMemo(
    () => calculateEmi(Number(principal), Number(rate), Number(tenure)),
    [principal, rate, tenure]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!name.trim()) {
      setErrors({ name: "Give the loan a name." });
      return;
    }
    if (!Number(principal) || !Number(tenure)) {
      setErrors({
        principal_amount: !Number(principal) ? "Enter the loan amount." : "",
        tenure_months: !Number(tenure) ? "Enter the tenure in months." : "",
      });
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      loan_type: loanType,
      principal_amount: Number(principal).toFixed(2),
      interest_rate: Number(rate || 0).toFixed(2),
      tenure_months: Number(tenure),
      start_date: startDate,
    };
    if (account) payload.linked_account = account;

    try {
      await create.mutateAsync(payload);
      toast("Loan added.");
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add loan"
      description="Track an outstanding loan and its EMI schedule."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="loan-form" loading={create.isPending}>
            Add loan
          </Button>
        </>
      }
    >
      <form id="loan-form" onSubmit={submit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Loan name"
            name="name"
            required
            placeholder="e.g. Home Loan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Select
            label="Type"
            name="loan_type"
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            options={LOAN_TYPES}
            error={errors.loan_type}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Principal amount"
            name="principal_amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            error={errors.principal_amount}
          />
          <Input
            label="Interest rate (% p.a.)"
            name="interest_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            error={errors.interest_rate}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tenure (months)"
            name="tenure_months"
            type="number"
            min="1"
            required
            placeholder="60"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            error={errors.tenure_months}
          />
          <Input
            label="Start date"
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.start_date}
          />
        </div>

        <Select
          label="Linked account"
          name="linked_account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="None"
          error={errors.linked_account}
        />

        {emi > 0 && (
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <p className="text-sm text-[var(--text-secondary)]">
              Estimated monthly EMI
            </p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
              {formatCurrency(emi)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Total repayment {formatCurrency(emi * Number(tenure))} over{" "}
              {tenure} months
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
