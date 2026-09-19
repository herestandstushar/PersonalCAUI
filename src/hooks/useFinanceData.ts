/**
 * Domain hooks for every FinSight resource, backed by the REST API.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  useCreate,
  useDetail,
  useList,
  usePaginatedList,
  useRemove,
  useUpdate,
} from "./useApiResource";
import type { Account, AccountSummary } from "@/types/account";
import type { Category, Transaction, TransactionFilters } from "@/types/transaction";
import type { DashboardData } from "@/types/dashboard";
import type { Currency, User } from "@/types/auth";
import type {
  Budget,
  BudgetStatus,
  Insight,
  InvestmentPortfolio,
  Loan,
  SavingsGoal,
  Subscription,
} from "@/types/finance";

export const qk = {
  me: ["me"] as const,
  currencies: ["currencies"] as const,
  dashboard: ["dashboard"] as const,
  accounts: ["accounts"] as const,
  accountSummary: ["accounts", "summary"] as const,
  categories: ["categories"] as const,
  transactions: ["transactions"] as const,
  budgets: ["budgets"] as const,
  budgetStatus: ["budgets", "status"] as const,
  savings: ["savings"] as const,
  loans: ["loans"] as const,
  portfolios: ["investments", "portfolios"] as const,
  subscriptions: ["subscriptions"] as const,
  insights: ["insights"] as const,
};

/** Keys whose data is derived from transactions/accounts and must refetch on writes. */
const MONEY_KEYS = [qk.dashboard, qk.accounts, qk.accountSummary, qk.transactions];

// ---- User ----

export function useMe(enabled = true) {
  return useDetail<User>(qk.me, "/users/me/", {
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const { data } = await api.patch<User>("/users/me/", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch("/users/me/profile/", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: qk.currencies,
    queryFn: async () => {
      const { data } = await api.get<Currency[]>("/users/currencies/");
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      currency_code: string;
      monthly_income?: number;
    }) => {
      const { data } = await api.post<User>("/users/onboarding/", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.me }),
  });
}

// ---- Dashboard ----

export function useDashboard() {
  return useDetail<DashboardData>(qk.dashboard, "/dashboard/", {
    staleTime: 60 * 1000,
  });
}

// ---- Accounts ----

export function useAccounts() {
  return useList<Account>(qk.accounts, "/accounts/", undefined, {
    staleTime: 2 * 60 * 1000,
  });
}

export function useAccountSummary() {
  return useDetail<AccountSummary>(qk.accountSummary, "/accounts/summary/", {
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAccount() {
  return useCreate<Record<string, unknown>, Account>("/accounts/", MONEY_KEYS);
}

export function useUpdateAccount() {
  return useUpdate<Record<string, unknown>, Account>(
    (id) => `/accounts/${id}/`,
    MONEY_KEYS
  );
}

export function useDeleteAccount() {
  return useRemove((id) => `/accounts/${id}/`, MONEY_KEYS);
}

export type AccountResetResult = {
  accounts_reset: number;
  transactions_cleared: number;
  statements_cleared: number;
};

export function useResetAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<AccountResetResult>(`/accounts/${id}/reset/`);
      return data;
    },
    onSuccess: () => {
      MONEY_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

export function useResetAllAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<AccountResetResult>("/accounts/reset-all/");
      return data;
    },
    onSuccess: () => {
      MONEY_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

// ---- Categories ----

export function useCategories() {
  return useList<Category>(qk.categories, "/categories/", undefined, {
    staleTime: 30 * 60 * 1000,
  });
}

// ---- Transactions ----

export function useTransactions(filters?: TransactionFilters) {
  const params: Record<string, unknown> = {
    page_size: filters?.page_size ?? 40,
    page: filters?.page ?? 1,
    ordering: filters?.ordering ?? "-date,-created_at",
  };
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (
        k === "page" ||
        k === "page_size" ||
        k === "ordering" ||
        v === undefined ||
        v === "" ||
        v === null
      ) {
        return;
      }
      params[k] = v;
    });
  }
  const query = usePaginatedList<Transaction>(
    qk.transactions,
    "/transactions/",
    params,
    { staleTime: 30 * 1000 }
  );
  return {
    ...query,
    /** Flat list for existing call sites. */
    data: query.data?.items ?? [],
    meta: query.data?.meta ?? null,
  };
}

export function useCreateTransaction() {
  return useCreate<Record<string, unknown>, Transaction>(
    "/transactions/",
    MONEY_KEYS
  );
}

export function useUpdateTransaction() {
  return useUpdate<Record<string, unknown>, Transaction>(
    (id) => `/transactions/${id}/`,
    MONEY_KEYS
  );
}

export function useDeleteTransaction() {
  return useRemove((id) => `/transactions/${id}/`, MONEY_KEYS);
}

// ---- Budgets ----

export function useBudgets() {
  return useList<Budget>(qk.budgets, "/budgets/");
}

export function useBudgetStatus() {
  return useDetail<BudgetStatus[]>(qk.budgetStatus, "/budgets/status/");
}

export function useCreateBudget() {
  return useCreate<Record<string, unknown>, Budget>("/budgets/", [
    qk.budgets,
    qk.budgetStatus,
    qk.dashboard,
  ]);
}

export function useDeleteBudget() {
  return useRemove((id) => `/budgets/${id}/`, [
    qk.budgets,
    qk.budgetStatus,
    qk.dashboard,
  ]);
}

// ---- Savings ----

export function useSavingsGoals() {
  return useList<SavingsGoal>(qk.savings, "/savings/");
}

export function useCreateSavingsGoal() {
  return useCreate<Record<string, unknown>, SavingsGoal>("/savings/", [
    qk.savings,
    qk.dashboard,
  ]);
}

export function useContributeToGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      notes,
    }: {
      id: string;
      amount: number;
      notes?: string;
    }) => {
      const { data } = await api.post(`/savings/${id}/contribute/`, {
        amount,
        notes,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.savings });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useDeleteSavingsGoal() {
  return useRemove((id) => `/savings/${id}/`, [qk.savings, qk.dashboard]);
}

// ---- Loans ----

export function useLoans() {
  return useList<Loan>(qk.loans, "/loans/");
}

export function useCreateLoan() {
  return useCreate<Record<string, unknown>, Loan>("/loans/", [
    qk.loans,
    qk.dashboard,
  ]);
}

export function useDeleteLoan() {
  return useRemove((id) => `/loans/${id}/`, [qk.loans, qk.dashboard]);
}

// ---- Investments ----

export function usePortfolios() {
  return useList<InvestmentPortfolio>(qk.portfolios, "/investments/portfolios/");
}

export function useCreatePortfolio() {
  return useCreate<Record<string, unknown>, InvestmentPortfolio>(
    "/investments/portfolios/",
    [qk.portfolios, qk.dashboard]
  );
}

export function useCreateAsset() {
  return useCreate<Record<string, unknown>>("/investments/assets/", [
    qk.portfolios,
    qk.dashboard,
  ]);
}

export function useDeleteAsset() {
  return useRemove((id) => `/investments/assets/${id}/`, [
    qk.portfolios,
    qk.dashboard,
  ]);
}

// ---- Subscriptions ----

export function useSubscriptions() {
  return useList<Subscription>(
    qk.subscriptions,
    "/subscriptions/subscriptions/"
  );
}

export function useCreateSubscription() {
  return useCreate<Record<string, unknown>, Subscription>(
    "/subscriptions/subscriptions/",
    [qk.subscriptions, qk.dashboard]
  );
}

export function useUpdateSubscription() {
  return useUpdate<Record<string, unknown>, Subscription>(
    (id) => `/subscriptions/subscriptions/${id}/`,
    [qk.subscriptions, qk.dashboard]
  );
}

export function useDeleteSubscription() {
  return useRemove((id) => `/subscriptions/subscriptions/${id}/`, [
    qk.subscriptions,
    qk.dashboard,
  ]);
}

// ---- Insights ----

export function useInsights() {
  return useDetail<{ insights: Insight[] } | Insight[]>(
    qk.insights,
    "/insights/"
  );
}
