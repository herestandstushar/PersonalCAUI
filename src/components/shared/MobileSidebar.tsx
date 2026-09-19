"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { bottomNav, navigation } from "@/lib/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function MobileSidebar() {
  const pathname = usePathname();
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();

  // Route changes should dismiss the drawer, otherwise it covers the new page.
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [pathname, setSidebarMobileOpen]);

  return (
    <AnimatePresence>
      {sidebarMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarMobileOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="relative h-full w-72 max-w-[85vw] bg-[var(--surface-card)] border-r border-[var(--border-default)] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border-default)]">
              <BrandLogo size={28} withWordmark wordmarkClassName="text-lg" />
              <button
                onClick={() => setSidebarMobileOpen(false)}
                aria-label="Close navigation"
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[var(--border-default)] py-3 px-3">
              {bottomNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
