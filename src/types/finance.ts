/**
 * Types for budgets, savings, loans, investments, subscriptions and insights.
 */

import type { Category } from "./transaction";

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  category: string | null;
  category_detail: Category | null;
  amount: string;
  period: BudgetPeriod;
  is_rollover: boolean;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

/** Shape returned by `GET /budgets/status/` — spend calculated against each budget. */
export interface BudgetStatus {
  budget_id: string;
  category_id: string | null;
  category_name: string;
  category_color: string;
  category_icon: string;
  amount: number;
  spent: number;
  available: number;
  percentage_used: number;
  is_over_budget: boolean;
  period: BudgetPeriod;
}

export type SavingsGoalStatus = "active" | "completed" | "cancelled";

export interface GoalContribution {
  id: string;
  amount: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string | null;
  status: SavingsGoalStatus;
  icon: string;
  color: string;
  notes: string;
  linked_account: string | null;
  progress_percentage: number;
  contributions: GoalContribution[];
  created_at: string;
}

export type LoanType = "home" | "car" | "personal" | "education" | "other";
export type LoanStatus = "active" | "paid_off" | "defaulted";

export interface Loan {
  id: string;
  name: string;
  loan_type: LoanType;
  principal_amount: string;
  interest_rate: string;
  tenure_months: number;
  emi_amount: string;
  outstanding_balance: string;
  start_date: string;
  status: LoanStatus;
  linked_account: string | null;
  progress_percentage: number;
  created_at: string;
}

export type AssetType =
  | "stock"
  | "crypto"
  | "mutual_fund"
  | "fixed_deposit"
  | "real_estate"
  | "other";

export interface InvestmentAsset {
  id: string;
  portfolio: string;
  name: string;
  symbol: string;
  asset_type: AssetType;
  quantity: string;
  average_buy_price: string;
  current_price: string;
  total_invested: string;
  current_value: string;
  return_percentage: number;
}

export interface InvestmentPortfolio {
  id: string;
  name: string;
  assets: InvestmentAsset[];
  total_invested: string;
  current_value: string;
  total_returns: string;
  created_at: string;
}

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "paused";

export interface Subscription {
  id: string;
  name: string;
  amount: string;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  category: string | null;
  account: string | null;
  status: SubscriptionStatus;
  auto_renew: boolean;
  url: string;
  color: string;
  icon: string;
  created_at: string;
}

export type InsightType = "warning" | "success" | "info" | "neutral";

export interface Insight {
  type: InsightType;
  title: string;
  message: string;
  icon: string;
  action_text: string;
  action_url: string;
}
