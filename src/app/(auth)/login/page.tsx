"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { AuthResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>("/auth/login/", {
        email: email.trim().toLowerCase(),
        password,
      });
      login(data);
      router.push(data.user.is_onboarded ? "/" : "/onboarding");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid credentials. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#5D5FEF]/25 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#5D5FEF]/15 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white max-w-md"
        >
          <div className="mb-10">
            <BrandLogo lockup lockupWidth={280} />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Take control of your
            <br />
            <span className="text-white/90">financial future</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Track expenses, manage budgets, monitor investments, and gain
            AI-powered insights — all in one beautiful dashboard.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { label: "Users", value: "10K+" },
              { label: "Tracked", value: "$2B+" },
              { label: "Insights", value: "500K+" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--surface-bg)]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <BrandLogo size={40} withWordmark wordmarkClassName="text-2xl" />
          </div>

          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Welcome back
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Sign in to your account to continue
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <GoogleSignInButton onError={setError} />

          {/* Register link */}
          <p className="mt-8 text-center text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
