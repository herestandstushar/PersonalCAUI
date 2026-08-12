"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Sliders,
  Bell,
  Shield,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Form";
import { PageSkeleton, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import {
  useCurrencies,
  useMe,
  useUpdateMe,
  useUpdateProfile,
} from "@/hooks/useFinanceData";
import { useMounted } from "@/hooks/useMounted";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";
import api, { getRefreshToken } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");
  const { data: user, isLoading, isError, refetch } = useMe();

  if (isLoading) return <PageSkeleton cards={2} />;
  if (isError || !user)
    return (
      <ErrorState
        message="We couldn't load your settings. Check that the backend is running."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Manage your profile, preferences and security.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                  tab === t.id
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0"
        >
          {tab === "profile" && <ProfileSection />}
          {tab === "preferences" && <PreferencesSection />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "security" && <SecuritySection />}
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
          {description}
        </p>
      )}
      <div className={description ? "" : "mt-5"}>{children}</div>
      {footer && <div className="mt-6 flex justify-end">{footer}</div>}
    </div>
  );
}

// ---- Profile ----

function ProfileSection() {
  const { data: user } = useMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  // The page only renders sections once `useMe` has resolved, so the cached
  // user is available to seed the form on first render.
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    timezone: user?.timezone || "UTC",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await updateMe.mutateAsync(form);
      toast("Profile updated.");
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast(getErrorMessage(err), "error");
    }
  };

  const initials =
    `${form.first_name[0] ?? ""}${form.last_name[0] ?? ""}`.toUpperCase() || "U";

  return (
    <form onSubmit={save}>
      <Section
        title="Personal information"
        description="This is how your name appears across FinSight."
        footer={
          <Button type="submit" loading={updateMe.isPending}>
            Save changes
          </Button>
        }
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {user?.email}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Joined{" "}
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            name="first_name"
            required
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            error={errors.first_name}
          />
          <Input
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            error={errors.last_name}
          />
          <Input
            label="Phone"
            name="phone"
            placeholder="Optional"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone}
          />
          <Select
            label="Timezone"
            name="timezone"
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
            options={TIMEZONES.map((t) => ({ value: t, label: t }))}
            error={errors.timezone}
          />
        </div>
      </Section>
    </form>
  );
}

// ---- Preferences ----

function PreferencesSection() {
  const { data: user } = useMe();
  const { data: currencies = [] } = useCurrencies();
  const updateMe = useUpdateMe();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const [currency, setCurrency] = useState(
    user?.default_currency ? String(user.default_currency.id) : ""
  );
  const [income, setIncome] = useState(
    String(user?.profile?.monthly_income ?? "")
  );
  const [goal, setGoal] = useState(user?.profile?.financial_goal ?? "");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currency) {
        await updateMe.mutateAsync({
          default_currency: Number(currency),
        } as never);
      }
      await updateProfile.mutateAsync({
        monthly_income: income ? Number(income).toFixed(2) : "0.00",
        financial_goal: goal,
      });
      toast("Preferences saved.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  const busy = updateMe.isPending || updateProfile.isPending;

  return (
    <>
      <form onSubmit={save}>
        <Section
          title="Financial preferences"
          description="Used to personalise your dashboard and insights."
          footer={
            <Button type="submit" loading={busy}>
              Save changes
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencies.map((c) => ({
                value: String(c.id),
                label: `${c.code} — ${c.name}`,
              }))}
              placeholder="Select a currency"
            />
            <Input
              label="Monthly income"
              name="monthly_income"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Financial goal"
              name="financial_goal"
              placeholder="e.g. Build a 6-month emergency fund"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
        </Section>
      </form>

      <Section
        title="Appearance"
        description="Choose how FinSight looks on this device."
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                mounted && theme === opt.value
                  ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                  : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              <opt.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

// ---- Notifications ----

const NOTIFICATION_OPTIONS = [
  {
    key: "budget_alerts",
    label: "Budget alerts",
    description: "Warn me when I approach or exceed a budget.",
  },
  {
    key: "large_transactions",
    label: "Large transactions",
    description: "Flag unusually large spending on my accounts.",
  },
  {
    key: "subscription_renewals",
    label: "Subscription renewals",
    description: "Remind me before a subscription renews.",
  },
  {
    key: "weekly_summary",
    label: "Weekly summary",
    description: "Send a digest of my spending each week.",
  },
];

function NotificationsSection() {
  const { data: user } = useMe();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const saved = (user?.profile?.notification_preferences ?? {}) as Record<
      string,
      boolean
    >;
    return Object.fromEntries(
      NOTIFICATION_OPTIONS.map((o) => [o.key, saved[o.key] ?? true])
    );
  });

  const save = async () => {
    try {
      await updateProfile.mutateAsync({ notification_preferences: prefs });
      toast("Notification preferences saved.");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    }
  };

  return (
    <Section
      title="Notifications"
      description="Choose what FinSight should alert you about."
      footer={
        <Button onClick={save} loading={updateProfile.isPending}>
          Save changes
        </Button>
      }
    >
      <div className="divide-y divide-[var(--border-default)]">
        {NOTIFICATION_OPTIONS.map((o) => (
          <Toggle
            key={o.key}
            label={o.label}
            description={o.description}
            checked={prefs[o.key] ?? true}
            onChange={(v) => setPrefs((p) => ({ ...p, [o.key]: v }))}
          />
        ))}
      </div>
    </Section>
  );
}

// ---- Security ----

function SecuritySection() {
  const router = useRouter();
  const { toast } = useToast();
  const logout = useAuthStore((s) => s.logout);
  const { data: user } = useMe();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // Local sign-out proceeds even if the token could not be blacklisted.
    } finally {
      logout();
      toast("You have been signed out.");
      router.replace("/login");
    }
  };

  return (
    <>
      <Section
        title="Account"
        description="Your sign-in details."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-secondary)]">Email</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[var(--border-default)]">
            <span className="text-sm text-[var(--text-secondary)]">
              Onboarding
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {user?.is_onboarded ? "Complete" : "Incomplete"}
            </span>
          </div>
        </div>
      </Section>

      <Section
        title="Sign out"
        description="End this session on this device. Your refresh token is revoked server-side."
      >
        <Button variant="danger" onClick={signOut} loading={busy}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </Section>
    </>
  );
}
