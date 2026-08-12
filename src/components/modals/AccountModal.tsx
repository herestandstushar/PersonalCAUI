"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useCreateAccount,
  useCurrencies,
  useUpdateAccount,
} from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import { ACCOUNT_TYPES, CHART_COLORS } from "@/lib/constants";
import type { Account } from "@/types/account";

interface Props {
  open: boolean;
  onClose: () => void;
  account?: Account | null;
}

const EMPTY = {
  name: "",
  account_type: "bank_account",
  bank_name: "",
  account_number: "",
  currency: "",
  current_balance: "",
  credit_limit: "",
  color: CHART_COLORS[0] as string,
  notes: "",
};

export function AccountModal({ open, onClose, account }: Props) {
  const { toast } = useToast();
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateAccount();
  const update = useUpdateAccount();

  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setErrors({});
    setFormError("");
    if (account) {
      setForm({
        name: account.name,
        account_type: account.account_type,
        bank_name: account.bank_name ?? "",
        account_number: "",
        currency: String(account.currency ?? ""),
        current_balance: String(account.current_balance ?? ""),
        credit_limit: String(account.credit_limit ?? ""),
        color: account.color || CHART_COLORS[0],
        notes: account.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY });
    }
  });

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isCreditCard = form.account_type === "credit_card";
  const busy = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!form.name.trim()) {
      setErrors({ name: "Give the account a name." });
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      account_type: form.account_type,
      bank_name: form.bank_name,
      color: form.color,
      notes: form.notes,
    };
    if (form.currency) payload.currency = Number(form.currency);
    if (form.account_number) payload.account_number = form.account_number;
    if (isCreditCard && form.credit_limit) {
      payload.credit_limit = Number(form.credit_limit).toFixed(2);
    }
    // Balance is derived from transactions once the account exists.
    if (!account && form.current_balance) {
      payload.current_balance = Number(form.current_balance).toFixed(2);
    }

    try {
      if (account) {
        await update.mutateAsync({ id: account.id, payload });
        toast("Account updated.");
      } else {
        await create.mutateAsync(payload);
        toast("Account created.");
      }
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
      title={account ? "Edit account" : "Add account"}
      description={
        account
          ? "Update this account's details."
          : "Connect a bank account, card, wallet or cash balance."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" loading={busy}>
            {account ? "Save changes" : "Add account"}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <Input
          label="Account name"
          name="name"
          required
          placeholder="e.g. HDFC Savings"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            name="account_type"
            required
            value={form.account_type}
            onChange={(e) => set("account_type", e.target.value)}
            options={ACCOUNT_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            error={errors.account_type}
          />
          <Select
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
            options={currencies.map((c) => ({
              value: String(c.id),
              label: `${c.code} — ${c.name}`,
            }))}
            placeholder="Use my default"
            error={errors.currency}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Bank name"
            name="bank_name"
            placeholder="Optional"
            value={form.bank_name}
            onChange={(e) => set("bank_name", e.target.value)}
            error={errors.bank_name}
          />
          <Input
            label="Account number"
            name="account_number"
            placeholder="Stored encrypted"
            value={form.account_number}
            onChange={(e) => set("account_number", e.target.value)}
            error={errors.account_number}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!account && (
            <Input
              label="Opening balance"
              name="current_balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.current_balance}
              onChange={(e) => set("current_balance", e.target.value)}
              error={errors.current_balance}
            />
          )}
          {isCreditCard && (
            <Input
              label="Credit limit"
              name="credit_limit"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={form.credit_limit}
              onChange={(e) => set("credit_limit", e.target.value)}
              error={errors.credit_limit}
            />
          )}
        </div>

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
                onClick={() => set("color", c)}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  form.color === c
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
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          error={errors.notes}
        />
      </form>
    </Modal>
  );
}
