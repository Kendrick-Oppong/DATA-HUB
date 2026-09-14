import {
  Home,
  Wifi,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Zap,
  Wallet,
  Clock,
  Bell,
  MessageSquareWarning,
  BookOpen,
  ShoppingBag,
  BarChart2,
  Send,
  Sliders,
  DollarSign,
  Server,
  Users,
  Settings,
  TrendingUp,
  CreditCard,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

export type NavItem = {
  id: string;
  altIds?: string[];
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const CUSTOMER_NAV: NavGroup[] = [
  {
    group: "Telecom & Services",
    items: [
      {
        id: "overview",
        altIds: ["dashboard"],
        label: "Dashboard",
        icon: Home,
      },
      {
        id: "buy-data",
        label: "Buy Data",
        icon: Wifi,
        badge: "Instant",
      },
      { id: "buy-airtime", label: "Buy Airtime", icon: PhoneCall },
      {
        id: "results-checker",
        label: "Results Checker",
        icon: GraduationCap,
      },
      {
        id: "afa",
        label: "AFA Registration",
        icon: ShieldCheck,
        badge: "Subsidized",
      },
      { id: "utilities", label: "Utilities & Bills", icon: Zap },
    ],
  },
  {
    group: "Finance & History",
    items: [
      { id: "wallet", label: "Wallet & Ledger", icon: Wallet },
      { id: "orders", label: "My Orders", icon: Clock },
    ],
  },
  {
    group: "Support & Help",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        id: "complaints",
        label: "Complaints & Help",
        icon: MessageSquareWarning,
      },
      { id: "guides", label: "How-to Guides", icon: BookOpen },
    ],
  },
];

export const AGENT_NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [
      {
        id: "overview",
        altIds: ["dashboard"],
        label: "Dashboard",
        icon: Home,
      },
      {
        id: "my-store",
        label: "Store Builder",
        icon: ShoppingBag,
        badge: "Live",
      },
    ],
  },
  {
    group: "Sell",
    items: [
      { id: "store-orders", label: "Orders", icon: Clock },
      { id: "buy-data", label: "Buy Data", icon: Wifi },
      { id: "buy-airtime", label: "Buy Airtime", icon: PhoneCall },
      { id: "afa", label: "AFA Registration", icon: ShieldCheck },
      { id: "results-checker", label: "Results Checker", icon: GraduationCap },
      { id: "utilities", label: "Utilities & Bills", icon: Zap },
      { id: "bulk-sms", label: "Bulk SMS", icon: Send },
    ],
  },
  {
    group: "Earnings",
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart2 },
      { id: "earnings", label: "Earnings", icon: TrendingUp },
      { id: "withdraw", label: "Withdraw", icon: DollarSign },
      { id: "pricing", label: "Pricing", icon: Sliders },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "wallet", label: "Wallet", icon: Wallet },
      { id: "transactions", label: "Transactions", icon: CreditCard },
      { id: "customers", label: "Customers", icon: Users },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        id: "complaints",
        label: "My Complaints",
        icon: MessageSquareWarning,
      },
      { id: "guides", label: "How-to Guides", icon: BookOpen },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "whats-new", label: "What's New", icon: HelpCircle },
      { id: "community", label: "Join Community", icon: MessageSquare },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    group: "Operations & Gateways",
    items: [
      {
        id: "gateways",
        altIds: ["dashboard"],
        label: "Carrier Gateways & Latency",
        icon: Server,
        badge: "Live",
      },
      {
        id: "orders-audit",
        altIds: ["order-monitor"],
        label: "Orders Audit & Dispatch",
        icon: Clock,
      },
      {
        id: "settlement",
        altIds: ["payouts"],
        label: "Settlement & Balances",
        icon: DollarSign,
      },
    ],
  },
  {
    group: "Services Administration",
    items: [
      {
        id: "afa-verification",
        altIds: ["afa-admin"],
        label: "AFA Approvals",
        icon: ShieldCheck,
      },
      {
        id: "vouchers-stock",
        altIds: ["checkers-admin"],
        label: "Voucher Stock (WAEC/BECE)",
        icon: GraduationCap,
      },
    ],
  },
];
