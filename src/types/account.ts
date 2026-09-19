/**
 * Account types.
 */

import { Currency } from "./auth";

export type AccountType = "bank_account" | "credit_card" | "wallet" | "cash" | "upi";

export interface Account {
  id: string;
  name: string;
  account_type: AccountType;
  bank_name: string;
  masked_account_number: string;
  /** True when a PDF statement password is stored (value never returned). */
  has_statement_password: boolean;
  currency: number;
  currency_detail: Currency | null;
  current_balance: string;
  credit_limit: string | null;
  available_credit: string | null;
  credit_utilization: number | null;
  color: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  last_synced: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AccountSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
}

export interface AccountCreatePayload {
  name: string;
  account_type: AccountType;
  bank_name?: string;
  account_number?: string;
  statement_password?: string;
  clear_statement_password?: boolean;
  currency?: number;
  current_balance?: number;
  credit_limit?: number;
  color?: string;
  icon?: string;
  is_default?: boolean;
  notes?: string;
}
