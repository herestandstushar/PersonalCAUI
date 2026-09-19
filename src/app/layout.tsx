import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "FinSight — Personal Finance Management",
  description:
    "Track expenses, manage budgets, monitor investments, and gain AI-powered insights into your financial health.",
  keywords: [
    "finance",
    "budget",
    "expense tracker",
    "investment",
    "money management",
  ],
  applicationName: "FinSight",
  icons: {
    icon: [{ url: "/brand/finsight-icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: ["/brand/finsight-icon.png"],
    apple: [{ url: "/brand/finsight-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
