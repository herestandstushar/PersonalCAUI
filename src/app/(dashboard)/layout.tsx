"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { MobileSidebar } from "@/components/shared/MobileSidebar";
import { TopBar } from "@/components/shared/TopBar";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { PrefetchShell } from "@/components/shared/PrefetchShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PrefetchShell>
        <div className="flex min-h-screen bg-[var(--surface-bg)]">
          <Sidebar />
          <MobileSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </PrefetchShell>
    </AuthGuard>
  );
}
