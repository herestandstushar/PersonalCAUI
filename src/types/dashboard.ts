/**
 * Dashboard types.
 */

export interface DashboardData {
  overview: DashboardOverview;
  spending: SpendingData;
  income: IncomeData;
  cash_flow: CashFlowEntry[];
  categories: CategoryBreakdownEntry[];
  merchants: MerchantBreakdownEntry[];
  recent_transactions: unknown[];
  payment_methods: PaymentMethodEntry[];
  daily_spending: DailySpendingEntry[];
  top_expenses: unknown[];
  financial_health: FinancialHealth;
}

export interface DashboardOverview {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  savings_this_month: number;
  savings_rate: number;
}

export interface SpendingData {
  today: number;
  this_week: number;
  this_month: number;
  this_year: number;
}

export interface IncomeData {
  this_month: number;
}

export interface CashFlowEntry {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdownEntry {
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export interface MerchantBreakdownEntry {
  name: string;
  total: number;
  count: number;
}

export interface PaymentMethodEntry {
  method: string;
  total: number;
  count: number;
}

export interface DailySpendingEntry {
  date: string;
  amount: number;
}

export interface FinancialHealth {
  score: number;
  label: string;
  color: string;
  breakdown: {
    savings: number;
    debt: number;
    budget: number;
  };
}
