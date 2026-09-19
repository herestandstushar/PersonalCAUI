"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { unwrapList } from "@/hooks/useApiResource";
import { qk } from "@/hooks/useFinanceData";
import { getAccessToken } from "@/lib/api";
import type { Account } from "@/types/account";
import type { Category } from "@/types/transaction";
import type { PaginatedResponse } from "@/types/api";

/**
 * Warm the React Query cache for data almost every dashboard page needs,
 * so navigating Accounts / Transactions / Budgets feels instant.
 */
export function PrefetchShell({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!getAccessToken()) return;

    void qc.prefetchQuery({
      queryKey: [...qk.accounts, {}],
      queryFn: async () => {
        const { data } = await api.get<PaginatedResponse<Account> | Account[]>(
          "/accounts/"
        );
        return unwrapList(data);
      },
      staleTime: 2 * 60 * 1000,
    });

    void qc.prefetchQuery({
      queryKey: [...qk.categories, {}],
      queryFn: async () => {
        const { data } = await api.get<
          PaginatedResponse<Category> | Category[]
        >("/categories/");
        return unwrapList(data);
      },
      staleTime: 30 * 60 * 1000,
    });
  }, [qc]);

  return <>{children}</>;
}
