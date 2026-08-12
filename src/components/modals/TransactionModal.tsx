"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import { PAYMENT_METHODS, TRANSACTION_TYPES } from "@/lib/constants";
import type { Transaction } from "@/types/transaction";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When supplied the dialog edits this transaction instead of creating one. */
  transaction?: Transaction | null;
}

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  transaction_type: "expense",
  amount: "",
  date: today(),
  merchant_name: "",
  account: "",
  to_account: "",
  category: "",
  payment_method: "upi",
  notes: "",
};

export function TransactionModal({ open, onClose, transaction }: Props) {
  const { toast } = useToast();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();

  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setErrors({});
    setFormError("");
    if (transaction) {
      setForm({
        transaction_type: transaction.transaction_type,
        amount: String(transaction.amount ?? ""),
        date: transaction.date,
        merchant_name: transaction.merchant_name ?? "",
        account: transaction.account ?? "",
        to_account: transaction.to_account ?? "",
        category: transaction.category ?? "",
        payment_method: transaction.payment_method ?? "other",
        notes: transaction.notes ?? "",
      });
    } else {
      const defaultAccount =
        accounts.find((a) => a.is_default)?.id || accounts[0]?.id || "";
      setForm({ ...EMPTY, account: defaultAccount });
    }
  });

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isTransfer = form.transaction_type === "transfer";
  const busy = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!form.account) {
      setErrors({ account: "Select an account." });
      return;
    }
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setErrors({ amount: "Enter an amount greater than zero." });
      return;
    }

    const payload: Record<string, unknown> = {
      transaction_type: form.transaction_type,
      amount: amount.toFixed(2),
      date: form.date,
      merchant_name: form.merchant_name,
      account: form.account,
      payment_method: form.payment_method,
      notes: form.notes,
    };
    if (form.category) payload.category = form.category;
    if (isTransfer && form.to_account) payload.to_account = form.to_account;

    try {
      if (transaction) {
        await update.mutateAsync({ id: transaction.id, payload });
        toast("Transaction updated.");
      } else {
        await create.mutateAsync(payload);
        toast("Transaction added.");
      }
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    }
  };

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = categories
    .filter((c) =>
      form.transaction_type === "income"
        ? c.category_type === "income"
        : c.category_type !== "income"
    )
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? "Edit transaction" : "Add transaction"}
      description={
        transaction
          ? "Update the details of this transaction."
          : "Record a new expense, income or transfer."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="transaction-form" loading={busy}>
            {transaction ? "Save changes" : "Add transaction"}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type"
            name="transaction_type"
            required
            value={form.transaction_type}
            onChange={(e) => set("transaction_type", e.target.value)}
            options={TRANSACTION_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            error={errors.transaction_type}
          />
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={errors.amount}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            name="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            error={errors.date}
          />
          <Input
            label="Merchant"
            name="merchant_name"
            placeholder="e.g. Swiggy"
            value={form.merchant_name}
            onChange={(e) => set("merchant_name", e.target.value)}
            error={errors.merchant_name}
          />
        </div>

        <Select
          label={isTransfer ? "From account" : "Account"}
          name="account"
          required
          value={form.account}
          onChange={(e) => set("account", e.target.value)}
          options={accountOptions}
          placeholder={
            accountOptions.length ? "Select an account" : "No accounts yet"
          }
          error={errors.account}
        />

        {isTransfer && (
          <Select
            label="To account"
            name="to_account"
            required
            value={form.to_account}
            onChange={(e) => set("to_account", e.target.value)}
            options={accountOptions.filter((o) => o.value !== form.account)}
            placeholder="Select destination"
            error={errors.to_account}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            name="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            options={categoryOptions}
            placeholder="Auto-detect"
            error={errors.category}
          />
          <Select
            label="Payment method"
            name="payment_method"
            value={form.payment_method}
            onChange={(e) => set("payment_method", e.target.value)}
            options={PAYMENT_METHODS.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            error={errors.payment_method}
          />
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
