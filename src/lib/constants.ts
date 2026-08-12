/**
 * Application constants.
 */

export const APP_NAME = "FinSight";

export const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense", color: "#ef4444" },
  { value: "income", label: "Income", color: "#22c55e" },
  { value: "transfer", label: "Transfer", color: "#6366f1" },
  { value: "refund", label: "Refund", color: "#14b8a6" },
  { value: "investment", label: "Investment", color: "#8b5cf6" },
  { value: "loan_payment", label: "Loan Payment", color: "#f97316" },
  { value: "emi", label: "EMI", color: "#f43f5e" },
  { value: "recurring_expense", label: "Recurring Expense", color: "#ef4444" },
  { value: "recurring_income", label: "Recurring Income", color: "#22c55e" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "upi", label: "UPI", icon: "smartphone" },
  { value: "debit_card", label: "Debit Card", icon: "credit-card" },
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
  { value: "net_banking", label: "Net Banking", icon: "building" },
  { value: "wallet", label: "Wallet", icon: "wallet" },
  { value: "auto_debit", label: "Auto Debit", icon: "repeat" },
  { value: "cheque", label: "Cheque", icon: "file-text" },
  { value: "other", label: "Other", icon: "more-horizontal" },
] as const;

export const ACCOUNT_TYPES = [
  { value: "bank_account", label: "Bank Account", icon: "building-2" },
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
  { value: "wallet", label: "Wallet", icon: "wallet" },
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "upi", label: "UPI", icon: "smartphone" },
] as const;

export const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
] as const;
