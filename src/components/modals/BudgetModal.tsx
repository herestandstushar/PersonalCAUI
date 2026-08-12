"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { useCategories, useCreateBudget } from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";

const PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function BudgetModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const create = useCreateBudget();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [rollover, setRollover] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setCategory("");
    setAmount("");
    setPeriod("monthly");
    setRollover(false);
    setErrors({});
    setFormError("");
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const value = Number(amount);
    if (!value || value <= 0) {
      setErrors({ amount: "Enter a budget amount greater than zero." });
      return;
    }

    try {
      await create.mutateAsync({
        category: category || null,
        amount: value.toFixed(2),
        period,
        is_rollover: rollover,
        start_date: new Date().toISOString().slice(0, 10),
      });
      toast("Budget created.");
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
      title="Create budget"
      description="Cap your spending for a category over a period."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="budget-form" loading={create.isPending}>
            Create budget
          </Button>
        </>
      }
    >
      <form id="budget-form" onSubmit={submit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <Select
          label="Category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories
            .filter((c) => c.category_type === "expense")
            .map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Overall budget (all categories)"
          error={errors.category}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
          />
          <Select
            label="Period"
            name="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={PERIODS}
            error={errors.period}
          />
        </div>

        <Toggle
          label="Roll over unused budget"
          description="Carry any leftover amount into the next period."
          checked={rollover}
          onChange={setRollover}
        />
      </form>
    </Modal>
  );
}
