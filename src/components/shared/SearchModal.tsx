"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useTransactions } from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { formatCurrency } from "@/lib/currency";
import { navigation, bottomNav } from "@/lib/navigation";

const ALL_PAGES = [...navigation, ...bottomNav];

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useResetOnOpen(open, () => setQuery(""));

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: transactions = [], isFetching } = useTransactions(
    debounced.length >= 2
      ? { search: debounced, page_size: 10 }
      : undefined
  );

  const pages = useMemo(() => {
    if (!query.trim()) return ALL_PAGES.slice(0, 6);
    return ALL_PAGES.filter((p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [query]);

  const results = debounced.length >= 2 ? transactions.slice(0, 8) : [];

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Search" size="lg">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions or jump to a page…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        />
      </div>

      {pages.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
            Pages
          </p>
          <div className="space-y-1">
            {pages.map((p) => (
              <button
                key={p.href}
                onClick={() => go(p.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
              >
                <p.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{p.name}</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Transactions
        </p>
        {debounced.length < 2 ? (
          <p className="text-sm text-[var(--text-muted)] px-3 py-2">
            Type at least 2 characters to search your transactions.
          </p>
        ) : isFetching ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] px-3 py-2">
            No transactions match “{debounced}”.
          </p>
        ) : (
          <div className="space-y-1">
            {results.map((t) => (
              <button
                key={t.id}
                onClick={() => go("/transactions")}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {t.merchant_name || t.description || "Transaction"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.date} · {t.category_detail?.name ?? "Uncategorised"}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ${
                    t.is_credit ? "amount-positive" : "amount-negative"
                  }`}
                >
                  {t.is_credit ? "+" : "-"}
                  {formatCurrency(Number(t.amount))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
