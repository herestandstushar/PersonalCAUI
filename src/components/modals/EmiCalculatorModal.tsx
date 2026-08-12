"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { formatCurrency } from "@/lib/currency";
import { useMe } from "@/hooks/useFinanceData";

/** Standard amortised EMI: P·r·(1+r)^n / ((1+r)^n − 1). */
function calculateEmi(principal: number, annualRate: number, months: number) {
  if (!principal || !months) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function EmiCalculatorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: user } = useMe();
  const currency = user?.default_currency?.code ?? "USD";

  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("9");
  const [tenure, setTenure] = useState("60");

  const { emi, total, interest } = useMemo(() => {
    const p = Number(principal);
    const n = Number(tenure);
    const value = calculateEmi(p, Number(rate), n);
    const totalPaid = value * n;
    return { emi: value, total: totalPaid, interest: totalPaid - p };
  }, [principal, rate, tenure]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="EMI Calculator"
      description="Estimate the monthly payment for a loan."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <Input
          label="Loan amount"
          name="principal"
          type="number"
          min="0"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Interest rate (% p.a.)"
            name="rate"
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <Input
            label="Tenure (months)"
            name="tenure"
            type="number"
            min="1"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
        </div>

        <div className="p-5 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm text-[var(--text-secondary)]">Monthly EMI</p>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {formatCurrency(emi, currency)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary-500/20">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total interest</p>
              <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                {formatCurrency(Math.max(interest, 0), currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total payable</p>
              <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                {formatCurrency(total, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
