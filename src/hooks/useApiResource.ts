/**
 * Generic React Query helpers for the FinSight REST API.
 *
 * The backend wraps list endpoints in a `{ data, meta }` envelope while detail
 * endpoints return the object directly, so list reads unwrap `data` here.
 */

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types/api";

/** Unwraps a paginated envelope, tolerating endpoints that return a bare array. */
export function unwrapList<T>(payload: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

export function useList<T>(
  key: readonly unknown[],
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T[]>, "queryKey" | "queryFn">
) {
  return useQuery<T[]>({
    queryKey: [...key, params ?? {}],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<T> | T[]>(url, { params });
      return unwrapList<T>(data);
    },
    ...options,
  });
}

export function useDetail<T>(
  key: readonly unknown[],
  url: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<T>(url);
      return data;
    },
    ...options,
  });
}

/**
 * Creates a record and invalidates the supplied query keys so dependent
 * widgets (dashboard totals, account balances) refresh without a reload.
 */
export function useCreate<TPayload, TResult = unknown>(
  url: string,
  invalidate: readonly (readonly unknown[])[]
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, TPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<TResult>(url, payload);
      return data;
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

export function useUpdate<TPayload, TResult = unknown>(
  urlFor: (id: string) => string,
  invalidate: readonly (readonly unknown[])[]
) {
  const qc = useQueryClient();
  return useMutation<TResult, unknown, { id: string; payload: TPayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch<TResult>(urlFor(id), payload);
      return data;
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

export function useRemove(
  urlFor: (id: string) => string,
  invalidate: readonly (readonly unknown[])[]
) {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      await api.delete(urlFor(id));
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}
