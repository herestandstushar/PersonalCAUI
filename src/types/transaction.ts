/**
 * Transaction types.
 */

import type { Account } from "./account";

export type TransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "refund"
  | "investment"
  | "loan_payment"
  | "emi"
  | "recurring_expense"
  | "recurring_income";

export type PaymentMethod =
  | "cash"
  | "upi"
  | "debit_card"
  | "credit_card"
  | "net_banking"
  | "wallet"
  | "auto_debit"
  | "cheque"
  | "other";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  category_type: "expense" | "income" | "transfer";
  parent?: string | null;
  is_system?: boolean;
  keywords?: string[];
  sort_order?: number;
  subcategories?: Category[];
  created_at?: string;
}

export interface Transaction {
  id: string;
  transaction_type: TransactionType;
  amount: string;
  currency: number;
  exchange_rate: string;
  date: string;
  time: string | null;
  merchant_name: string;
  description: string;
  notes: string;
  category: string | null;
  category_detail: Category | null;
  account: string;
  account_detail: Account | null;
  to_account: string | null;
  payment_method: PaymentMethod;
  tags: string[];
  source: "manual" | "statement_import" | "recurring" | "api";
  is_recurring: boolean;
  is_duplicate: boolean;
  is_credit: boolean;
  is_debit: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreatePayload {
  transaction_type: TransactionType;
  amount: number;
  currency?: number;
  date: string;
  time?: string;
  merchant_name?: string;
  description?: string;
  notes?: string;
  category?: string;
  account: string;
  to_account?: string;
  payment_method?: PaymentMethod;
  tags?: string[];
  is_recurring?: boolean;
}

export interface SpendingSummary {
  today: number;
  this_week: number;
  this_month: number;
  this_year: number;
}

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  merchant?: string;
  transaction_type?: TransactionType;
  payment_method?: PaymentMethod;
  category?: string;
  account?: string;
  search?: string;
  is_recurring?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
