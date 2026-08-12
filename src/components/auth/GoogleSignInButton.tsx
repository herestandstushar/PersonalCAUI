"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/stores/authStore";
import type { AuthResponse } from "@/types/auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface CodeClient {
  requestCode: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (response: { code?: string; error?: string }) => void;
          }) => CodeClient;
        };
      };
    };
  }
}

/**
 * Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured, so the
 * sign-in option only appears when it can actually work. Uses Google's popup
 * code flow, which pairs with the backend's `redirect_uri: postmessage`
 * exchange in AuthService.google_login.
 */
export function GoogleSignInButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const clientRef = useRef<CodeClient | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const init = () => {
      if (!window.google) return;
      clientRef.current = window.google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          if (!response.code) {
            setBusy(false);
            if (response.error && response.error !== "access_denied") {
              onError("Google sign-in was cancelled or failed.");
            }
            return;
          }
          try {
            const { data } = await api.post<AuthResponse>("/auth/google/", {
              code: response.code,
            });
            login(data);
            router.push(data.user.is_onboarded ? "/" : "/onboarding");
          } catch (err) {
            onError(getErrorMessage(err, "Google sign-in failed."));
          } finally {
            setBusy(false);
          }
        },
      });
      setReady(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`
    );
    if (existing) {
      if (window.google) init();
      else existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", init);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", init);
  }, [login, onError, router]);

  if (!CLIENT_ID) return null;

  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-default)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--surface-bg)] text-[var(--text-muted)]">
            or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => {
          setBusy(true);
          clientRef.current?.requestCode();
        }}
        className="w-full py-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] font-medium flex items-center justify-center gap-3 hover:bg-[var(--surface-hover)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {busy ? "Signing in..." : "Continue with Google"}
      </button>
    </>
  );
}
