/**
 * Common API response types.
 */

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
}

export interface ApiError {
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}
