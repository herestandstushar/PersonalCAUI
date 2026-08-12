"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Sun, Moon, Plus, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/uiStore";
import { useInsights } from "@/hooks/useFinanceData";
import { useMounted } from "@/hooks/useMounted";
import { UserMenu } from "./UserMenu";
import { SearchModal } from "./SearchModal";
import { TransactionModal } from "@/components/modals/TransactionModal";
import type { Insight } from "@/types/finance";

export function TopBar() {
  const router = useRouter();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { setSidebarMobileOpen } = useUIStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: insightsData } = useInsights();
  const insights: Insight[] = Array.isArray(insightsData)
    ? insightsData
    : insightsData?.insights ?? [];
  // "Neutral" insights are status messages, not things needing attention.
  const actionable = insights.filter((i) => i.type !== "neutral");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notifOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-[var(--border-default)] bg-[var(--surface-card)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarMobileOpen(true)}
              aria-label="Open navigation"
              className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-muted)] hover:border-[var(--text-muted)] transition-colors text-sm w-64 max-w-[200px] sm:max-w-[260px]"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="hidden sm:inline ml-auto text-xs bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all shadow-md shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors w-10 h-10 flex items-center justify-center"
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )
              ) : null}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {actionable.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border-default)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Notifications
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {insights.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-[var(--text-muted)] text-center">
                          You&apos;re all caught up.
                        </p>
                      ) : (
                        insights.map((n, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setNotifOpen(false);
                              router.push(n.action_url || "/");
                            }}
                            className="w-full text-left px-4 py-3 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {n.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {n.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
