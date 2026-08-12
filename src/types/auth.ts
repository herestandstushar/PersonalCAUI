/**
 * Authentication types.
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  phone: string;
  timezone: string;
  default_currency: Currency | null;
  is_onboarded: boolean;
  profile: UserProfile | null;
  date_joined: string;
}

export interface UserProfile {
  monthly_income: number;
  financial_goal: string;
  dashboard_layout: Record<string, unknown>;
  notification_preferences: Record<string, unknown>;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
}

export interface AuthResponse {
  user: Pick<User, "id" | "email" | "first_name" | "last_name" | "full_name" | "is_onboarded">;
  access: string;
  refresh: string;
  is_new_user?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name?: string;
}
