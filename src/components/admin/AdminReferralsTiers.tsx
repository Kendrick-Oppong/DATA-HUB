import React, { useState, useMemo } from "react";
import {
  Gift,
  Coins,
  TrendingUp,
  Clock,
  Users,
  Award,
  Sliders,
  Info,
  Search,
  SlidersHorizontal,
  Download,
  X,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Label } from "../ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { loadFromStorage, saveToStorage } from "../../mockData";

export interface AgentTierInfo {
  id: string;
  name: string;
  minEarnings: number;
  maxEarnings?: number;
  marginRate: number; // e.g. 0.05 = 5%
  sampleBonusOn420: number;
  agentsCount: number;
}

export interface AgentTierProgress {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  tier: string;
  tierRate: number;
  storeProfit: number;
  commission: number;
  referralsCounted: number;
  referralsExcluded: number;
  tierScore: number;
  nextTier?: string;
  toNextTier: number;
  creditBalance: number;
}

export interface ReferrerLeaderboardItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  code: string;
  signups: number;
  qualified: number;
  earned: number;
  lastAt?: string;
}

export interface RecentReferralRecord {
  id: string;
  name: string;
  phone: string;
  referrer: string;
  code: string;
  status: "qualified" | "pending" | "expired";
  reward: number;
  at: string;
}

export interface IncentiveRules {
  realSalesFloor: number; // 0.70
  referrerReward: number; // 3.00
  referredReward: number; // 2.00
  creditExpiryDays: number; // 90
  referralMonthlyCap: number; // 10
  overrideRate: number; // 0.05
  overrideMonthlyCap: number; // 500.00
}

export const INITIAL_TIER_CONFIGS: AgentTierInfo[] = [
  {
    id: "tier-bronze",
    name: "Bronze Tier",
    minEarnings: 0,
    maxEarnings: 500,
    marginRate: 0.0,
    sampleBonusOn420: 0.0,
    agentsCount: 18,
  },
  {
    id: "tier-silver",
    name: "Silver Tier",
    minEarnings: 500,
    maxEarnings: 1500,
    marginRate: 0.05,
    sampleBonusOn420: 0.21,
    agentsCount: 14,
  },
  {
    id: "tier-gold",
    name: "Gold Tier",
    minEarnings: 1500,
    maxEarnings: 3500,
    marginRate: 0.1,
    sampleBonusOn420: 0.42,
    agentsCount: 9,
  },
  {
    id: "tier-platinum",
    name: "Platinum Tier",
    minEarnings: 3500,
    maxEarnings: 7500,
    marginRate: 0.15,
    sampleBonusOn420: 0.63,
    agentsCount: 5,
  },
  {
    id: "tier-diamond",
    name: "Diamond Tier",
    minEarnings: 7500,
    marginRate: 0.2,
    sampleBonusOn420: 0.84,
    agentsCount: 2,
  },
];

export const INITIAL_AGENT_TIER_PROGRESS: AgentTierProgress[] = [
  {
    id: "agt-1",
    name: "Ama Boateng",
    businessName: "Ama Data Hub",
    phone: "0201234567",
    tier: "Silver Tier",
    tierRate: 0.05,
    storeProfit: 450.0,
    commission: 280.0,
    referralsCounted: 90.0,
    referralsExcluded: 0.0,
    tierScore: 820.0,
    nextTier: "Gold Tier",
    toNextTier: 680.0,
    creditBalance: 85.0,
  },
  {
    id: "agt-2",
    name: "Kofi Mensah",
    businessName: "Kofi Express Data",
    phone: "0244128901",
    tier: "Gold Tier",
    tierRate: 0.1,
    storeProfit: 1250.0,
    commission: 890.0,
    referralsCounted: 310.0,
    referralsExcluded: 45.0,
    tierScore: 2450.0,
    nextTier: "Platinum Tier",
    toNextTier: 1050.0,
    creditBalance: 140.0,
  },
  {
    id: "agt-3",
    name: "Emmanuel Osei",
    businessName: "Osei Ventures",
    phone: "0558923410",
    tier: "Bronze Tier",
    tierRate: 0.0,
    storeProfit: 210.0,
    commission: 140.0,
    referralsCounted: 45.0,
    referralsExcluded: 0.0,
    tierScore: 395.0,
    nextTier: "Silver Tier",
    toNextTier: 105.0,
    creditBalance: 30.0,
  },
  {
    id: "agt-4",
    name: "Abena Serwaa",
    businessName: "Serwaa Telecom",
    phone: "0509988776",
    tier: "Platinum Tier",
    tierRate: 0.15,
    storeProfit: 2900.0,
    commission: 1850.0,
    referralsCounted: 450.0,
    referralsExcluded: 120.0,
    tierScore: 5200.0,
    nextTier: "Diamond Tier",
    toNextTier: 2300.0,
    creditBalance: 210.0,
  },
  {
    id: "agt-5",
    name: "Kwame Nkrumah",
    businessName: "Nkrumah Data Store",
    phone: "0243344556",
    tier: "Diamond Tier",
    tierRate: 0.2,
    storeProfit: 5400.0,
    commission: 3200.0,
    referralsCounted: 600.0,
    referralsExcluded: 280.0,
    tierScore: 9200.0,
    nextTier: undefined,
    toNextTier: 0,
    creditBalance: 450.0,
  },
];

export const INITIAL_REFERRER_LEADERBOARD: ReferrerLeaderboardItem[] = [
  {
    id: "ref-1",
    name: "Kofi Mensah",
    phone: "0244128901",
    role: "Agent",
    code: "KOFI2026",
    signups: 42,
    qualified: 38,
    earned: 114.0,
    lastAt: "2026-09-17T14:30:00Z",
  },
  {
    id: "ref-2",
    name: "Ama Boateng",
    phone: "0201234567",
    role: "Agent",
    code: "AMA-HUB",
    signups: 31,
    qualified: 28,
    earned: 84.0,
    lastAt: "2026-09-16T11:15:00Z",
  },
  {
    id: "ref-3",
    name: "Abena Pokua",
    phone: "0541122334",
    role: "Customer",
    code: "ABENA55",
    signups: 19,
    qualified: 16,
    earned: 48.0,
    lastAt: "2026-09-15T09:40:00Z",
  },
  {
    id: "ref-4",
    name: "Kwame Nkrumah",
    phone: "0243344556",
    role: "Agent",
    code: "NKRUMAH1",
    signups: 15,
    qualified: 14,
    earned: 42.0,
    lastAt: "2026-09-14T16:20:00Z",
  },
  {
    id: "ref-5",
    name: "Abena Serwaa",
    phone: "0509988776",
    role: "Agent",
    code: "SERWAA99",
    signups: 12,
    qualified: 10,
    earned: 30.0,
    lastAt: "2026-09-12T18:05:00Z",
  },
];

export const INITIAL_RECENT_REFERRALS: RecentReferralRecord[] = [
  {
    id: "rec-1",
    name: "Francis Addo",
    phone: "0549911223",
    referrer: "Kofi Mensah",
    code: "KOFI2026",
    status: "qualified",
    reward: 3.0,
    at: "2026-09-17T14:30:00Z",
  },
  {
    id: "rec-2",
    name: "Grace Quaye",
    phone: "0208833445",
    referrer: "Ama Boateng",
    code: "AMA-HUB",
    status: "qualified",
    reward: 3.0,
    at: "2026-09-16T11:15:00Z",
  },
  {
    id: "rec-3",
    name: "Daniel Lamptey",
    phone: "0277711223",
    referrer: "Abena Pokua",
    code: "ABENA55",
    status: "pending",
    reward: 3.0,
    at: "2026-09-16T08:50:00Z",
  },
  {
    id: "rec-4",
    name: "Eunice Mensah",
    phone: "0554433221",
    referrer: "Kofi Mensah",
    code: "KOFI2026",
    status: "qualified",
    reward: 3.0,
    at: "2026-09-15T17:10:00Z",
  },
  {
    id: "rec-5",
    name: "Bernard Kwarteng",
    phone: "0501199887",
    referrer: "Kwame Nkrumah",
    code: "NKRUMAH1",
    status: "pending",
    reward: 3.0,
    at: "2026-09-15T12:00:00Z",
  },
];

export const DEFAULT_RULES: IncentiveRules = {
  realSalesFloor: 0.7,
  referrerReward: 3.0,
  referredReward: 2.0,
  creditExpiryDays: 90,
  referralMonthlyCap: 10,
  overrideRate: 0.05,
  overrideMonthlyCap: 500.0,
};

export interface AdminReferralsTiersProps {
  onNavigateTab?: (tab: string) => void;
}

const ITEMS_PER_PAGE = 8;

export const AdminReferralsTiers: React.FC<AdminReferralsTiersProps> = ({
  onNavigateTab,
}) => {
  void onNavigateTab;
  const [activeSubTab, setActiveSubTab] = useState<
    "tiers" | "agents" | "referrals" | "rules"
  >("tiers");

  // State
  const [agentProgressList] = useState<AgentTierProgress[]>(() =>
    loadFromStorage("sdh_admin_agent_tiers", INITIAL_AGENT_TIER_PROGRESS),
  );

  const [leaderboard] = useState<ReferrerLeaderboardItem[]>(() =>
    loadFromStorage(
      "sdh_admin_referrer_leaderboard",
      INITIAL_REFERRER_LEADERBOARD,
    ),
  );

  const [recentReferrals] = useState<RecentReferralRecord[]>(() =>
    loadFromStorage("sdh_admin_recent_referrals", INITIAL_RECENT_REFERRALS),
  );

  const [rules] = useState<IncentiveRules>(DEFAULT_RULES);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "info" | "error" = "info",
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute overall stats
  const totals = useMemo(() => {
    const tierBonusMonth = 1280.0;
    const referralCreditMonth = 840.0;
    const overrideMonth = 330.0;
    const incentiveSpendMonth =
      tierBonusMonth + referralCreditMonth + overrideMonth;
    const outstandingCredit = 640.0;
    const tierBonusLifetime = 14890.0;
    const overrideLifetime = 3120.0;
    const storeProfitMonth = 12450.0;

    const totalSignups = leaderboard.reduce((sum, r) => sum + r.signups, 0);
    const totalQualified = leaderboard.reduce((sum, r) => sum + r.qualified, 0);
    const totalPending = totalSignups - totalQualified;
    const totalCreditPaid = leaderboard.reduce((sum, r) => sum + r.earned, 0);

    return {
      incentiveSpendMonth,
      tierBonusMonth,
      referralCreditMonth,
      outstandingCredit,
      tierBonusLifetime,
      overrideLifetime,
      overrideMonth,
      storeProfitMonth,
      totalSignups,
      totalQualified,
      totalPending,
      totalCreditPaid,
    };
  }, [leaderboard]);

  // Filtered tiers list for "tiers" tab
  const filteredTiers = useMemo(() => {
    return INITIAL_TIER_CONFIGS.filter((t) => {
      if (tierFilter !== "all" && t.name !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchEarnings =
          `${t.minEarnings} ${t.maxEarnings || ""}`.includes(q);
        if (!matchName && !matchEarnings) return false;
      }
      return true;
    });
  }, [tierFilter, searchQuery]);

  // Filtered agent list for "agents" tab
  const filteredAgents = useMemo(() => {
    return agentProgressList.filter((a) => {
      if (tierFilter !== "all" && a.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.name || "").toLowerCase().includes(q);
        const matchBusiness = (a.businessName || "").toLowerCase().includes(q);
        const matchPhone = (a.phone || "").includes(q);
        if (!matchName && !matchBusiness && !matchPhone) return false;
      }
      return true;
    });
  }, [agentProgressList, tierFilter, searchQuery]);

  // Filtered referrals list for "referrals" tab
  const filteredReferrals = useMemo(() => {
    return recentReferrals.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (r.name || "").toLowerCase().includes(q);
        const matchReferrer = (r.referrer || "").toLowerCase().includes(q);
        const matchCode = (r.code || "").toLowerCase().includes(q);
        const matchPhone = (r.phone || "").includes(q);
        if (!matchName && !matchReferrer && !matchCode && !matchPhone)
          return false;
      }
      return true;
    });
  }, [recentReferrals, statusFilter, searchQuery]);

  const activeTotalCount = useMemo(() => {
    if (activeSubTab === "agents") return filteredAgents.length;
    if (activeSubTab === "referrals") return filteredReferrals.length;
    return 0;
  }, [activeSubTab, filteredAgents.length, filteredReferrals.length]);

  const totalPages = Math.max(1, Math.ceil(activeTotalCount / ITEMS_PER_PAGE));

  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAgents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAgents, currentPage]);

  const paginatedReferrals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReferrals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReferrals, currentPage]);

  const isFiltered =
    searchQuery !== "" || tierFilter !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    let head: string[] = [];
    let body: (string | number)[][] = [];
    const esc = (c: unknown) =>
      `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;

    if (activeSubTab === "agents") {
      head = [
        "Agent Name",
        "Business",
        "Phone",
        "Current Tier",
        "Tier Rate %",
        "Store Profit (GHS)",
        "Commission (GHS)",
        "Referrals Counted",
        "Held Back (GHS)",
        "Tier Score",
        "Next Tier",
        "Credit Balance (GHS)",
      ];
      body = filteredAgents.map((a) => [
        esc(a.name),
        esc(a.businessName || ""),
        esc(a.phone),
        esc(a.tier),
        esc(`${Math.round(a.tierRate * 100)}%`),
        esc(a.storeProfit.toFixed(2)),
        esc(a.commission.toFixed(2)),
        esc(a.referralsCounted.toFixed(2)),
        esc(a.referralsExcluded.toFixed(2)),
        esc(a.tierScore.toFixed(2)),
        esc(a.nextTier || "Top Tier"),
        esc(a.creditBalance.toFixed(2)),
      ]);
    } else {
      head = [
        "New Customer",
        "Phone",
        "Referred By",
        "Referral Code",
        "Status",
        "Reward (GHS)",
        "Joined Date",
      ];
      body = filteredReferrals.map((r) => [
        esc(r.name),
        esc(r.phone),
        esc(r.referrer),
        esc(r.code),
        esc(r.status),
        esc(r.reward.toFixed(2)),
        esc(r.at ? r.at.slice(0, 10) : ""),
      ]);
    }

    const csv = [
      head.map(esc).join(","),
      ...body.map((row) => row.join(",")),
    ].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `referrals-tiers-${activeSubTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    showToast(`Exported ${body.length} records to CSV`, "success");
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusPill = (status: string) => {
    const configs: Record<
      string,
      { dot: string; classes: string; label: string }
    > = {
      qualified: {
        dot: "bg-emerald-500",
        classes:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
        label: "Paid",
      },
      pending: {
        dot: "bg-amber-500 animate-pulse",
        classes:
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
        label: "Awaiting Delivery",
      },
      expired: {
        dot: "bg-muted-foreground/40",
        classes: "bg-muted text-muted-foreground border-border",
        label: "Expired",
      },
    };
    const c = configs[status] ?? {
      dot: "bg-muted-foreground/40",
      classes: "bg-muted text-muted-foreground border-border",
      label: status,
    };
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.classes}`}
      >
        <span className={`size-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. PAGE HEADER ── (Matching AdminUsers, AdminCheckers, AdminSms flow design) */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <Gift className="size-6 text-primary" />
            <span>Referrals &amp; Agent Tiers</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Track agent performance tiers, margin bonuses, customer referral
            credits, and recruitment overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toastMessage && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg animate-in fade-in duration-200 border ${
                toastMessage.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : toastMessage.type === "error"
                    ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}
            >
              {toastMessage.text}
            </span>
          )}

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="text-xs font-bold shadow-xs cursor-pointer gap-1.5 h-9"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. STATS TILES ── (Matching AdminUsers & AdminCheckers layout with icon + label next to icon) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Incentive Spend */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Coins className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Incentive spend
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-blue-600 dark:text-blue-400">
            GH₵ {totals.incentiveSpendMonth.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Tiers + Referrals + Overrides this month
          </p>
        </div>

        {/* Tier Bonuses */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tier bonuses
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            GH₵ {totals.tierBonusMonth.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Margin bonuses credited to agent wallets
          </p>
        </div>

        {/* Referral Credit */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <Gift className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Referral credit
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-teal-600 dark:text-teal-400">
            GH₵ {totals.referralCreditMonth.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Issued on 1st delivered orders this month
          </p>
        </div>

        {/* Credit Outstanding */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Credit outstanding
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600 dark:text-amber-400">
            GH₵ {totals.outstandingCredit.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Unspent active wallet credit
          </p>
        </div>
      </div>

      {/* ── 3. MASTER CARD CONTAINER ── (Matching SMS/Sender IDs, Users, Results Checker flow design) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <Gift className="size-5 text-primary" />
                <span>Referrals &amp; Performance Tiers Console</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Inspect tier bonus structures and verify programme rules.
              </CardDescription>
            </div>

            {/* Pill Tab Switcher in Header (Far right — Exact match to AdminSms & AdminUsers pattern) */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-full border border-border shrink-0">
              {(
                [
                  { id: "tiers", label: "Tiers & Bonuses" },
                  {
                    id: "agents",
                    label: "By Agent",
                    badge: String(agentProgressList.length),
                  },
                  {
                    id: "referrals",
                    label: "Referrals",
                    badge: String(recentReferrals.length),
                  },
                  { id: "rules", label: "Programme Rules" },
                ] as Array<{
                  id: "tiers" | "agents" | "referrals" | "rules";
                  label: string;
                  badge?: string;
                }>
              ).map((tab) => {
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 rounded-full py-1.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        {/* ── SEARCH & FILTERS BAR ── (Identical to Payout Requests & AdminUsers) */}
        {(activeSubTab === "tiers" ||
          activeSubTab === "agents" ||
          activeSubTab === "referrals") && (
          <div className="border-b border-border bg-muted/20 p-4 space-y-4">
            {/* Top Search Bar */}
            <div className="space-y-1.5">
              <Label
                htmlFor="referrals-search"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Search{" "}
                {activeSubTab === "tiers"
                  ? "tier levels & bonuses"
                  : activeSubTab === "agents"
                    ? "agents & storefronts"
                    : "customer referrals"}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="referrals-search"
                  type="text"
                  placeholder={
                    activeSubTab === "tiers"
                      ? "Search tier name (e.g. Silver, Gold) or earnings threshold..."
                      : activeSubTab === "agents"
                        ? "Search agent name, business name, or phone..."
                        : "Search customer name, phone, referrer, or code..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 bg-background pl-9 pr-9 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Box */}
            <div className="rounded-xl border border-border bg-background p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Filters &amp; Category Options
                  </span>
                  {isFiltered && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 font-semibold"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-6 px-2 text-[10px] font-bold text-primary cursor-pointer bg-transparent hover:!bg-transparent hover:text-primary"
                  >
                    Reset filters
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {(activeSubTab === "tiers" || activeSubTab === "agents") && (
                  <div className="space-y-1.5 w-full sm:w-1/2">
                    <Label
                      htmlFor="filter-tier-select"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Tier Level
                    </Label>
                    <Select
                      value={tierFilter}
                      onValueChange={(v) => {
                        setTierFilter(v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="filter-tier-select"
                        className="h-9 text-xs bg-background w-full"
                      >
                        <SelectValue placeholder="All Tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="Bronze Tier">Bronze Tier</SelectItem>
                        <SelectItem value="Silver Tier">Silver Tier</SelectItem>
                        <SelectItem value="Gold Tier">Gold Tier</SelectItem>
                        <SelectItem value="Platinum Tier">
                          Platinum Tier
                        </SelectItem>
                        <SelectItem value="Diamond Tier">
                          Diamond Tier
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {activeSubTab === "referrals" && (
                  <div className="space-y-1.5 w-full sm:w-1/2">
                    <Label
                      htmlFor="filter-status-select"
                      className="text-[10px] font-semibold text-muted-foreground"
                    >
                      Referral Status
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => {
                        setStatusFilter(v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="filter-status-select"
                        className="h-9 text-xs bg-background w-full"
                      >
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="qualified">
                          Paid (Qualified)
                        </SelectItem>
                        <SelectItem value="pending">
                          Awaiting Delivery
                        </SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: TIERS & BONUSES ── */}
        {activeSubTab === "tiers" && (
          <CardContent className="p-5 space-y-6">
            {/* 1. Summary Stats Cards (Moved ABOVE Table) */}
            <div className="grid grid-cols-1  md:grid-cols-3 gap-3">
              {/* Tier Bonuses Paid */}
              <div className="rounded-xl bg-muted/80 border border-border bg-card p-3.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                    <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tier bonuses paid
                  </span>
                </div>
                <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                  GH₵ {totals.tierBonusLifetime.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Lifetime · GH₵ {totals.tierBonusMonth.toFixed(2)} this month
                </p>
              </div>

              {/* Recruitment Overrides */}
              <div className="rounded-xl bg-muted/80  border border-border bg-card p-3.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10">
                    <Award className="size-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recruitment overrides
                  </span>
                </div>
                <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                  GH₵ {totals.overrideLifetime.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Lifetime · GH₵ {totals.overrideMonth.toFixed(2)} this month
                </p>
              </div>

              {/* Agent Store Profit */}
              <div className="rounded-xl bg-muted/80  border border-border bg-card p-3.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
                    <Coins className="size-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Agent store profit
                  </span>
                </div>
                <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                  GH₵ {totals.storeProfitMonth.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Total merchant store profit this month
                </p>
              </div>
            </div>

            {/* 2. Tier Matrix Section Header & Table (Below Stats Cards) */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Award className="size-4 text-emerald-600" />
                  <span>Agent Performance Tier Bonus Matrix</span>
                </h3>
              </div>

              {/* Tiers Matrix Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Tier Level
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Monthly Blended Earnings
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Bonus Rate on Margin
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Sample Bonus (on GH₵4.20 Margin)
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Active Agents
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTiers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No matching tiers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTiers.map((tier) => (
                        <TableRow key={tier.id} className="hover:bg-muted/20">
                          <TableCell className="py-3 font-extrabold text-xs text-foreground">
                            {tier.name}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground font-semibold tabular-nums">
                            {tier.maxEarnings
                              ? `GH₵ ${tier.minEarnings} – GH₵ ${tier.maxEarnings}`
                              : `GH₵ ${tier.minEarnings}+`}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              {Math.round(tier.marginRate * 100)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +GH₵ {tier.sampleBonusOn420.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-bold text-foreground text-right tabular-nums">
                            {tier.agentsCount}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        )}

        {/* ── TAB 2: AGENTS BY TIER ── */}
        {activeSubTab === "agents" && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Agent &amp; Store
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Current Tier
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Store Profit
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Commission
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Referrals Counted
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Held Back
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Tier Score
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                      To Next Tier
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Credit Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No agents found matching your query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAgents.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/20">
                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-foreground">
                              {a.businessName || a.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {a.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                            {a.tier} ({Math.round(a.tierRate * 100)}%)
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                          GH₵ {a.storeProfit.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                          GH₵ {a.commission.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                          GH₵ {a.referralsCounted.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold tabular-nums">
                          {a.referralsExcluded > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              GH₵ {a.referralsExcluded.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-black tabular-nums text-foreground">
                          GH₵ {a.tierScore.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs text-muted-foreground font-medium">
                          {a.nextTier ? (
                            <span>
                              GH₵ {a.toNextTier.toFixed(2)} → {a.nextTier}
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              Top Tier
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {a.creditBalance > 0
                            ? `GH₵ ${a.creditBalance.toFixed(2)}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                Showing{" "}
                <span className="font-bold text-foreground">
                  {Math.min(1, filteredAgents.length)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredAgents.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {filteredAgents.length}
                </span>{" "}
                entries
              </div>
              {totalPages > 1 && (
                <PaginationHelper
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </div>
          </CardContent>
        )}

        {/* ── TAB 3: REFERRALS ── */}
        {activeSubTab === "referrals" && (
          <CardContent className="p-0">
            {/* Top Referrers Leaderboard */}
            <div className="p-6 space-y-3 border-b border-border">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Gift className="size-4 text-primary" />
                  <span>Top Referrers Leaderboard</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Who is driving platform user growth and what they've earned in
                  referral rewards.
                </p>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referrer
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referral Code
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                        Signups
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                        Paid (Qualified)
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Earned Credit
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Last Activity
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/20">
                        <TableCell className="py-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-foreground">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {r.phone} · {r.role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className="text-xs font-extrabold tracking-wide"
                          >
                            {r.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-bold tabular-nums text-foreground">
                          {r.signups}
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {r.qualified}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                          +GH₵ {r.earned.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs text-muted-foreground">
                          {formatDateTime(r.lastAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Recent Referrals Log */}
            <div className="p-6 space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  <span>Recent Customer Referral Activity</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rewards qualify when the new customer's first order is
                  delivered — never on signup.
                </p>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        New Customer
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referred By
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Referral Code
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Reward
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                        Joined Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No referrals found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReferrals.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/20">
                          <TableCell className="py-3">
                            <div className="space-y-0.5">
                              <div className="text-xs font-extrabold text-foreground">
                                {r.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {r.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-xs font-semibold text-foreground">
                            {r.referrer}
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="text-xs font-bold text-muted-foreground">
                              {r.code}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            {getStatusPill(r.status)}
                          </TableCell>
                          <TableCell className="py-3 text-right text-xs font-extrabold tabular-nums text-foreground">
                            {r.status === "qualified"
                              ? `GH₵ ${r.reward.toFixed(2)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="py-3 text-right text-xs text-muted-foreground">
                            {formatDateTime(r.at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                Showing{" "}
                <span className="font-bold text-foreground">
                  {Math.min(1, filteredReferrals.length)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredReferrals.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">
                  {filteredReferrals.length}
                </span>{" "}
                entries
              </div>
              {totalPages > 1 && (
                <PaginationHelper
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </div>
          </CardContent>
        )}

        {/* ── TAB 4: PROGRAMME RULES ── */}
        {activeSubTab === "rules" && (
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  <span>Live Programme Incentive Rules</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Parameters used by the server engine to calculate margin
                  bonuses, referral credits, and recruitment overrides.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tier Bonus Base */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 shrink-0">
                      <Coins className="size-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Tier Bonus Base
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        Platform gross margin on each order (retail price minus
                        wholesale cost). Never retail sales value.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-Sales Safeguard */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                      <ShieldAlert className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Real-Sales Safeguard
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        At least{" "}
                        <span className="font-medium text-foreground">
                          {Math.round(rules.realSalesFloor * 100)}%
                        </span>{" "}
                        of an agent's blended monthly score must come from real
                        store profit and commission. Referral earnings above
                        that threshold do not count toward tier advancement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Referral Rewards */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 shrink-0">
                      <Gift className="size-4.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Referral Rewards
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">
                          GH₵ {rules.referrerReward.toFixed(2)}
                        </span>{" "}
                        credited to referrer,{" "}
                        <span className="font-medium text-foreground">
                          GH₵ {rules.referredReward.toFixed(2)}
                        </span>{" "}
                        credited to new customer. Paid strictly on the new
                        customer's{" "}
                        <strong className="text-primary">
                          first delivered order
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reward Type & Expiry */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                      <Clock className="size-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Reward Type &amp; Expiry
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        Wallet credit spendable on any telecom product. Expires
                        after{" "}
                        <span className="font-medium text-foreground">
                          {rules.creditExpiryDays} days
                        </span>{" "}
                        if unused. Not directly cashable or withdrawable.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Monthly Referral Cap */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 shrink-0">
                      <Users className="size-4.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Monthly Referral Cap
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        Maximum{" "}
                        <span className="font-medium text-foreground">
                          {rules.referralMonthlyCap}
                        </span>{" "}
                        paid referrals per person per calendar month. Strictly
                        one reward per recipient phone number lifetime.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recruitment Override */}
                <div className="rounded-2xl border border-border/80 bg-muted/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-pink-500/10 shrink-0">
                      <Award className="size-4.5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-foreground">
                        Recruitment Override
                      </h4>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">
                          {Math.round(rules.overrideRate * 100)}%
                        </span>{" "}
                        of a recruited agent's commission for their first 60
                        days. Single level only, capped at{" "}
                        <span className="font-bold text-foreground">
                          GH₵ {rules.overrideMonthlyCap.toFixed(2)}
                        </span>{" "}
                        per recruiter per month.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
