"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useAccounts,
  useCategories,
  useCreateSubscription,
} from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import { CHART_COLORS } from "@/lib/constants";

const BILLING_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export function SubscriptionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const create = useCreateSubscription();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [nextDate, setNextDate] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [url, setUrl] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [color, setColor] = useState<string>(CHART_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    const inAMonth = new Date();
    inAMonth.setMonth(inAMonth.getMonth() + 1);
    setName("");
    setAmount("");
    setCycle("monthly");
    setNextDate(inAMonth.toISOString().slice(0, 10));
    setAccount("");
    setCategory("");
    setUrl("");
    setAutoRenew(true);
    setColor(CHART_COLORS[0]);
    setErrors({});
    setFormError("");
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!name.trim()) {
      setErrors({ name: "Give the subscription a name." });
      return;
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      setErrors({ amount: "Enter an amount greater than zero." });
      return;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      amount: value.toFixed(2),
      billing_cycle: cycle,
      next_billing_date: nextDate,
      auto_renew: autoRenew,
      url,
      color,
    };
    if (account) payload.account = account;
    if (category) payload.category = category;

    try {
      await create.mutateAsync(payload);
      toast("Subscription added.");
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
      title="Add subscription"
      description="Track a recurring service and its next billing date."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="subscription-form" loading={create.isPending}>
            Add subscription
          </Button>
        </>
      }
    >
      <form id="subscription-form" onSubmit={submit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name"
            name="name"
            required
            placeholder="e.g. Netflix"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Billing cycle"
            name="billing_cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            options={BILLING_CYCLES}
            error={errors.billing_cycle}
          />
          <Input
            label="Next billing date"
            name="next_billing_date"
            type="date"
            required
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            error={errors.next_billing_date}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Account"
            name="account"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="None"
            error={errors.account}
          />
          <Select
            label="Category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories
              .filter((c) => c.category_type === "expense")
              .map((c) => ({ value: c.id, label: c.name }))}
            placeholder="None"
            error={errors.category}
          />
        </div>

        <Input
          label="Website"
          name="url"
          type="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={errors.url}
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

        <Toggle
          label="Auto-renew"
          description="This subscription renews automatically."
          checked={autoRenew}
          onChange={setAutoRenew}
        />
      </form>
    </Modal>
  );
}
