"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useMe } from "@/hooks/useFinanceData";
import { getAccessToken } from "@/lib/api";

/**
 * Blocks dashboard routes until a valid session is confirmed.
 *
 * The persisted Zustand store gives an optimistic answer on first paint; the
 * `/users/me/` request is the authority and also refreshes the cached profile.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken());
  const { data, isLoading, isError } = useMe(hasToken);

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, router]);

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) {
      logout();
      router.replace("/login");
    }
  }, [isError, logout, router]);

  // Onboarding is mandatory before the rest of the app becomes useful.
  useEffect(() => {
    if (data && !data.is_onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [data, pathname, router]);

  if (!hasToken || (isLoading && !isAuthenticated)) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--surface-bg)]">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <p className="text-sm text-[var(--text-muted)]">Loading your workspace…</p>
    </div>
  );
}
