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
  Flag,
  Coins,
  Download,
  AlertTriangle,
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
        label: "Overview",
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
        label: "Overview",
        icon: Home,
      },
      {
        id: "my-store",
        label: "Store Builder",
        icon: ShoppingBag,
        badge: "Live",
      },
      {
        id: "verify",
        label: "Verify",
        icon: ShieldCheck,
      },
    ],
  },
  {
    group: "Sell",
    items: [
      { id: "store-orders", label: "Orders", icon: Clock },
      { id: "buy-data", label: "Buy Data", icon: Wifi },
      { id: "buy-airtime", label: "Buy Airtime", icon: PhoneCall },
      {
        id: "afa",
        label: "AFA Registration",
        icon: ShieldCheck,
        badge: "Subsidized",
      },
      { id: "results-checker", label: "Results Checker", icon: GraduationCap },
      { id: "utilities", label: "Utilities & Bills", icon: Zap },
      { id: "bulk-sms", label: "Bulk SMS", icon: Send },
    ],
  },
  {
    group: "Earnings",
    items: [
      {
        id: "analytics",
        altIds: ["earnings"],
        label: "Analytics",
        icon: BarChart2,
      },
      { id: "pricing", label: "Pricing", icon: Sliders },
    ],
  },
  {
    group: "Account",
    items: [
      {
        id: "transactions",
        altIds: ["wallet", "withdraw"],
        label: "Transactions",
        icon: CreditCard,
      },
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
      { id: "community", label: "Join Community", icon: MessageSquare },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    group: "Operations",
    items: [
      {
        id: "overview",
        altIds: ["dashboard"],
        label: "Overview",
        icon: Home,
      },
      {
        id: "orders-audit",
        altIds: ["order-monitor", "orders"],
        label: "Orders ",
        icon: Clock,
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: CreditCard,
      },
      {
        id: "commissions",
        label: "Commissions",
        icon: Coins,
      },
      {
        id: "settlement",
        altIds: ["payouts", "withdrawals"],
        label: "Payouts",
        icon: Download,
      },
      {
        id: "complaints",
        label: "Complaints",
        icon: Flag,
      },
    ],
  },
  {
    group: "Services",
    items: [
      {
        id: "afa-verification",
        altIds: ["afa", "afa-admin"],
        label: "AFA Registration",
        icon: ShieldCheck,
      },
      {
        id: "vouchers-stock",
        altIds: ["checkers", "checkers-admin"],
        label: "Result Checkers",
        icon: GraduationCap,
      },
      {
        id: "sms",
        label: "SMS / Sender IDs",
        icon: Send,
      },
    ],
  },
  {
    group: "Manage",
    items: [
      {
        id: "failed-beneficiaries",
        label: "Beneficiary tracker",
        icon: AlertTriangle,
      },
      {
        id: "agents",
        label: "All Agents",
        icon: ShoppingBag,
      },
      {
        id: "users",
        label: "Users",
        icon: Users,
      },
      {
        id: "referrals",
        label: "Referrals & Tiers",
        icon: HelpCircle,
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        id: "pricing",
        label: "Pricing",
        icon: Sliders,
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];
