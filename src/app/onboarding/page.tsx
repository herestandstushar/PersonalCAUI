"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useCompleteOnboarding,
  useCreateAccount,
  useCurrencies,
  useMe,
} from "@/hooks/useFinanceData";
import { getErrorMessage } from "@/lib/apiError";
import { getAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { ACCOUNT_TYPES } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);

  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken());
  const { data: user } = useMe(hasToken);
  const { data: currencies = [] } = useCurrencies();
  const completeOnboarding = useCompleteOnboarding();
  const createAccount = useCreateAccount();

  const [step, setStep] = useState(0);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [income, setIncome] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("bank_account");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasToken) router.replace("/login");
  }, [hasToken, router]);

  // Users who already finished onboarding have no reason to be here.
  useEffect(() => {
    if (user?.is_onboarded) router.replace("/");
  }, [user, router]);

  const finish = async () => {
    setError("");
    try {
      const updated = await completeOnboarding.mutateAsync({
        currency_code: currencyCode,
        monthly_income: income ? Number(income) : undefined,
      });
      setUser(updated);

      if (accountName.trim()) {
        await createAccount.mutateAsync({
          name: accountName.trim(),
          account_type: accountType,
          current_balance: balance ? Number(balance).toFixed(2) : "0.00",
        });
      }

      toast("You're all set. Welcome to FinSight!");
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const busy = completeOnboarding.isPending || createAccount.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-bg)] gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            FinSight
          </span>
        </div>

        <div className="card p-7">
          <div className="flex items-center gap-2 mb-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary-500" : "bg-[var(--surface-muted)]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Welcome{user?.first_name ? `, ${user.first_name}` : ""} 👋
              </h1>
              <p className="text-[var(--text-secondary)] mb-6">
                Let&apos;s set up the basics so your numbers make sense.
              </p>

              <div className="space-y-4">
                <Select
                  label="Primary currency"
                  name="currency_code"
                  required
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  options={currencies.map((c) => ({
                    value: c.code,
                    label: `${c.code} — ${c.name} (${c.symbol})`,
                  }))}
                />
                <Input
                  label="Monthly income"
                  name="monthly_income"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional — helps calculate your savings rate"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>

              <Button className="w-full mt-7" onClick={() => setStep(1)}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-primary-500" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Add your first account
              </h1>
              <p className="text-[var(--text-secondary)] mb-6">
                Transactions attach to an account. You can add more later or
                skip this for now.
              </p>

              <div className="space-y-4">
                <Input
                  label="Account name"
                  name="name"
                  placeholder="e.g. HDFC Savings"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    name="account_type"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    options={ACCOUNT_TYPES.map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                  />
                  <Input
                    label="Current balance"
                    name="current_balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(0)}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={finish} loading={busy}>
                  <Check className="w-4 h-4" />
                  Finish setup
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
