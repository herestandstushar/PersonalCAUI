"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/apiError";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { AuthResponse } from "@/types/auth";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: "At least 8 characters", met: form.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(form.password) },
    { label: "Contains uppercase", met: /[A-Z]/.test(form.password) },
    { label: "Passwords match", met: form.password === form.password_confirm && form.password_confirm.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>("/auth/register/", {
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      login(data);
      router.push("/onboarding");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#5D5FEF]/25 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-16 w-96 h-96 bg-[#5D5FEF]/15 rounded-full blur-3xl" />
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
            Start your journey to
            <br />
            <span className="text-white/90">financial clarity</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Join thousands of users who&apos;ve transformed their relationship with money. Smart tracking, beautiful insights, zero hassle.
          </p>
          <div className="mt-10 space-y-4">
            {["AI-powered spending insights", "Auto-categorize transactions", "Track investments & net worth"].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[var(--surface-bg)]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-10">
            <BrandLogo size={40} withWordmark wordmarkClassName="text-2xl" />
          </div>

          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Create your account
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Get started in under 2 minutes
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">First name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="John"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Last name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password_confirm}
                  onChange={(e) => updateField("password_confirm", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password strength */}
            {form.password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-2 gap-2"
              >
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    {check.met ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                    <span className={check.met ? "text-green-600 dark:text-green-400" : "text-[var(--text-muted)]"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-primary-500/25 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
