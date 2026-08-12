/**
 * Normalises the backend's `{ errors: [{ code, message, field }] }` envelope
 * into a single human-readable string.
 */

import { AxiosError } from "axios";
import type { ApiError } from "@/types/api";

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const axiosError = error as AxiosError<ApiError>;
  const errors = axiosError?.response?.data?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    return errors
      .map((e) => (e.field ? `${humanise(e.field)}: ${e.message}` : e.message))
      .join(" ");
  }

  if (axiosError?.code === "ECONNABORTED") {
    return "The request timed out. Please check your connection and try again.";
  }

  if (axiosError?.message === "Network Error") {
    return "Cannot reach the server. Make sure the backend is running.";
  }

  return fallback;
}

/** Maps field errors by field name so forms can render them inline. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const axiosError = error as AxiosError<ApiError>;
  const errors = axiosError?.response?.data?.errors;
  const result: Record<string, string> = {};

  if (Array.isArray(errors)) {
    for (const e of errors) {
      if (e.field) result[e.field] = e.message;
    }
  }
  return result;
}

function humanise(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
