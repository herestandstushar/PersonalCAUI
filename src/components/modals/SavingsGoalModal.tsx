"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useContributeToGoal,
  useCreateSavingsGoal,
} from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import { CHART_COLORS } from "@/lib/constants";
import type { SavingsGoal } from "@/types/finance";

export function SavingsGoalModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const create = useCreateSavingsGoal();

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState<string>(CHART_COLORS[0]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setName("");
    setTarget("");
    setCurrent("");
    setDate("");
    setColor(CHART_COLORS[0]);
    setNotes("");
    setErrors({});
    setFormError("");
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!name.trim()) {
      setErrors({ name: "Give your goal a name." });
      return;
    }
    const targetValue = Number(target);
    if (!targetValue || targetValue <= 0) {
      setErrors({ target_amount: "Enter a target greater than zero." });
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      target_amount: targetValue.toFixed(2),
      color,
      notes,
    };
    if (current) payload.current_amount = Number(current).toFixed(2);
    if (date) payload.target_date = date;

    try {
      await create.mutateAsync(payload);
      toast("Savings goal created.");
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
      title="New savings goal"
      description="Set a target and track your progress toward it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="goal-form" loading={create.isPending}>
            Create goal
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <Input
          label="Goal name"
          name="name"
          required
          placeholder="e.g. Emergency fund"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target amount"
            name="target_amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            error={errors.target_amount}
          />
          <Input
            label="Already saved"
            name="current_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            error={errors.current_amount}
          />
        </div>

        <Input
          label="Target date"
          name="target_date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.target_date}
        />

        <div>
          <p className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Colour
          </p>
          <div className="flex flex-wrap gap-2">
            {CHART_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select colour ${c}`}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  color === c
                    ? "ring-2 ring-offset-2 ring-primary-500 ring-offset-[var(--surface-card)] scale-110"
                    : "hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Notes"
          name="notes"
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
        />
      </form>
    </Modal>
  );
}

export function ContributeModal({
  open,
  onClose,
  goal,
}: {
  open: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}) {
  const { toast } = useToast();
  const contribute = useContributeToGoal();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useResetOnOpen(open, () => {
    setAmount("");
    setNotes("");
    setError("");
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!goal) return;

    try {
      await contribute.mutateAsync({ id: goal.id, amount: value, notes });
      toast(`Added ${amount} to ${goal.name}.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add funds"
      description={goal ? `Contribute toward “${goal.name}”.` : undefined}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={contribute.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="contribute-form"
            loading={contribute.isPending}
          >
            Add funds
          </Button>
        </>
      }
    >
      <form id="contribute-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          autoFocus
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Textarea
          label="Notes"
          name="notes"
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
}
