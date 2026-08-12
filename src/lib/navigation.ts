/**
 * Shared navigation config — consumed by the desktop sidebar and the mobile drawer.
 */

import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  PiggyBank,
  CreditCard,
  Target,
  TrendingUp,
  FileText,
  Lightbulb,
  Settings,
  Receipt,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Import Statement", href: "/transactions/import", icon: Upload },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Loans & EMI", href: "/loans", icon: CreditCard },
  { name: "Savings Goals", href: "/savings", icon: Target },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Subscriptions", href: "/subscriptions", icon: Receipt },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Insights", href: "/insights", icon: Lightbulb },
];

export const bottomNav: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings },
];
