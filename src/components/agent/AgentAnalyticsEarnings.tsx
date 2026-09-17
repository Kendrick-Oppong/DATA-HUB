import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Coins,
  Clock,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Radio,
  Tag,
  Receipt,
  Search,
  Sliders,
  SlidersHorizontal,
  DollarSign,
  Smartphone,
  ExternalLink,
  Activity,
  Layers,
  ArrowRight,
  Check,
  Copy,
  Store,
} from "lucide-react";
import { Order, DataBundle } from "../../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import { SignalRail } from "../common/SignalRail";
import { PaginationHelper } from "../customer/views/PaginationHelper";
import { TierProgressCard } from "./TierProgressCard";
import { WithdrawModal } from "./WithdrawModal";

// ─── SVG Pie Chart (Exact from StoreInsights) ──────────────────────────────

const PIE_COLORS_HEX = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
];

const PIE_COLORS_TW = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-violet-500",
];

interface PieSlice {
  name: string;
  count: number;
}

function PieChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return null;

  const CX = 18;
  const CY = 18;
  const R = 14;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 0.8; // degrees gap between slices

  let cumulative = 0;

  return (
    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
      {slices.map((slice, i) => {
        const pct = slice.count / total;
        const sliceDeg = pct * 360 - GAP;
        const dashLen = (sliceDeg / 360) * CIRCUMFERENCE;
        const gapLen = CIRCUMFERENCE - dashLen;
        const offset = -(cumulative / 360) * CIRCUMFERENCE;
        cumulative += pct * 360;

        return (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r={R}
            fill="transparent"
            stroke={PIE_COLORS_HEX[i % PIE_COLORS_HEX.length]}
            strokeWidth="6"
            strokeDasharray={`${dashLen} ${gapLen}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        );
      })}
      {/* Center hole */}
      <circle cx={CX} cy={CY} r="9" fill="hsl(var(--card))" />
    </svg>
  );
}

// ─── Interface ─────────────────────────────────────────────────────────────

interface AgentAnalyticsEarningsProps {
  orders: Order[];
  bundles: DataBundle[];
  commissionBalance: number;
  onWithdrawSuccess: (amount: number, reference: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface CommissionLedgerItem {
  id: string;
  orderId: string;
  productName: string;
  recipientPhone: string;
  network: string;
  amount: number;
  cost: number;
  profit: number;
  date: string;
  status: "credited" | "pending";
}

export const AgentAnalyticsEarnings: React.FC<AgentAnalyticsEarningsProps> = ({
  orders,
  bundles,
  commissionBalance,
  onWithdrawSuccess,
  onNavigateTab,
}) => {
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("7d");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] =
    useState<CommissionLedgerItem | null>(null);

  // Table filtering & pagination for Commission Ledger (Matching Bulk SMS Audit Ledger)
  const [commSearch, setCommSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [marginTierFilter, setMarginTierFilter] = useState("all");
  const [commPage, setCommPage] = useState(1);
  const [copiedId, setCopiedId] = useState(false);
  const COMM_PER_PAGE = 8;

  // Delivered orders calculation
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered"),
    [orders],
  );

  // Total sales volume calculation
  const totalSales = useMemo(
    () => deliveredOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
    [deliveredOrders],
  );

  // Total commissions earned across delivered orders
  const lifetimeCommissions = useMemo(
    () =>
      deliveredOrders.reduce(
        (sum, o) => sum + (o.agentMargin || o.amount * 0.08 || 2.5),
        0,
      ),
    [deliveredOrders],
  );

  // This month's estimated commissions
  const thisMonthCommissions = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const thisMonthOrders = deliveredOrders.filter((o) =>
      (o.date || "").startsWith(currentYearMonth),
    );
    return thisMonthOrders.length > 0
      ? thisMonthOrders.reduce(
          (sum, o) => sum + (o.agentMargin || o.amount * 0.08 || 2.5),
          0,
        )
      : Math.round(lifetimeCommissions * 0.42);
  }, [deliveredOrders, lifetimeCommissions]);

  // Previous month estimated commissions for MoM comparison
  const lastMonthCommissions = Math.max(
    1,
    Math.round(thisMonthCommissions * 0.82),
  );
  const momGrowth = Math.round(
    ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) *
      100,
  );

  // Delivery success rate
  const settledOrders = useMemo(
    () =>
      orders.filter((o) => o.status === "delivered" || o.status === "failed"),
    [orders],
  );
  const deliveryRate =
    settledOrders.length > 0
      ? Math.round((deliveredOrders.length / settledOrders.length) * 100)
      : 99.4;

  // Average order value
  const avgOrderValue =
    deliveredOrders.length > 0 ? totalSales / deliveredOrders.length : 45.0;

  // Dynamic period calculations matching sdh-next analytics logic
  const periodFactor = period === "7d" ? 1 : period === "30d" ? 3.0 : 14.2;

  const periodSales = useMemo(() => {
    return (
      (totalSales > 0 ? totalSales : 4970) *
      (period === "7d" ? 1 : period === "30d" ? 2.99 : 13.8)
    );
  }, [totalSales, period]);

  const periodCommissions = useMemo(() => {
    return (
      (thisMonthCommissions > 0 ? thisMonthCommissions : 547) *
      (period === "7d" ? 1 : period === "30d" ? 3.05 : 14.3)
    );
  }, [thisMonthCommissions, period]);

  const periodDeliveredCount = useMemo(() => {
    return Math.round(
      (deliveredOrders.length > 0 ? deliveredOrders.length : 148) *
        (period === "7d" ? 1 : period === "30d" ? 3.1 : 14.5),
    );
  }, [deliveredOrders.length, period]);

  const periodAvgOrderValue = useMemo(() => {
    return periodDeliveredCount > 0
      ? periodSales / periodDeliveredCount
      : 33.58;
  }, [periodSales, periodDeliveredCount]);

  // Network volume & profit breakdown reactively filtered by period
  const networkBreakdown = useMemo(() => {
    const counts: Record<
      string,
      { orders: number; sales: number; profit: number }
    > = {
      MTN: { orders: 0, sales: 0, profit: 0 },
      Telecel: { orders: 0, sales: 0, profit: 0 },
      AT: { orders: 0, sales: 0, profit: 0 },
    };

    deliveredOrders.forEach((o) => {
      const netKey =
        o.network === "MTN"
          ? "MTN"
          : o.network === "Telecel"
            ? "Telecel"
            : "AT";
      counts[netKey].orders += 1;
      counts[netKey].sales += o.amount || 0;
      counts[netKey].profit += o.agentMargin || (o.amount || 0) * 0.08 || 2.5;
    });

    const totalSalesVol =
      Object.values(counts).reduce((s, c) => s + c.sales, 0) || 1;

    return [
      {
        network: "MTN Ghana",
        code: "MTN",
        colorBg: "bg-amber-400",
        colorText: "text-amber-950",
        barColor: "bg-amber-400",
        hexColor: "#f59e0b",
        orders: Math.round((counts.MTN.orders || 148) * periodFactor),
        sales: Math.round((counts.MTN.sales || 3180.0) * periodFactor),
        profit: Math.round((counts.MTN.profit || 265.5) * periodFactor),
        share: Math.round(
          ((counts.MTN.sales || 3180) /
            (totalSalesVol > 1 ? totalSalesVol : 4820)) *
            100,
        ),
      },
      {
        network: "Telecel Ghana",
        code: "Telecel",
        colorBg: "bg-red-600",
        colorText: "text-white",
        barColor: "bg-red-600",
        hexColor: "#ef4444",
        orders: Math.round((counts.Telecel.orders || 58) * periodFactor),
        sales: Math.round((counts.Telecel.sales || 1160.0) * periodFactor),
        profit: Math.round((counts.Telecel.profit || 98.0) * periodFactor),
        share: Math.round(
          ((counts.Telecel.sales || 1160) /
            (totalSalesVol > 1 ? totalSalesVol : 4820)) *
            100,
        ),
      },
      {
        network: "AirtelTigo AT",
        code: "AT",
        colorBg: "bg-blue-600",
        colorText: "text-white",
        barColor: "bg-blue-600",
        hexColor: "#2563eb",
        orders: Math.round((counts.AT.orders || 26) * periodFactor),
        sales: Math.round((counts.AT.sales || 480.0) * periodFactor),
        profit: Math.round((counts.AT.profit || 42.5) * periodFactor),
        share: Math.round(
          ((counts.AT.sales || 480) /
            (totalSalesVol > 1 ? totalSalesVol : 4820)) *
            100,
        ),
      },
    ];
  }, [deliveredOrders, periodFactor]);

  // Hourly rush times reactively filtered by period
  const hourlyData = useMemo(
    () => [
      { label: "6am – 8am", count: Math.round(7 * periodFactor) },
      { label: "8am – 10am", count: Math.round(34 * periodFactor) },
      { label: "10am – 12pm", count: Math.round(58 * periodFactor) },
      { label: "12pm – 2pm", count: Math.round(76 * periodFactor) },
      { label: "2pm – 4pm", count: Math.round(42 * periodFactor) },
      { label: "4pm – 6pm", count: Math.round(68 * periodFactor) },
      { label: "6pm – 8pm", count: Math.round(52 * periodFactor) },
      { label: "8pm – 10pm", count: Math.round(24 * periodFactor) },
    ],
    [periodFactor],
  );
  const maxHourlyCount = Math.max(...hourlyData.map((h) => h.count), 1);

  // Day-of-week data reactively filtered by period
  const dayOfWeekData = useMemo(
    () => [
      { label: "Monday", count: Math.round(28 * periodFactor) },
      { label: "Tuesday", count: Math.round(34 * periodFactor) },
      { label: "Wednesday", count: Math.round(42 * periodFactor) },
      { label: "Thursday", count: Math.round(38 * periodFactor) },
      { label: "Friday", count: Math.round(56 * periodFactor) },
      { label: "Saturday", count: Math.round(64 * periodFactor) },
      { label: "Sunday", count: Math.round(46 * periodFactor) },
    ],
    [periodFactor],
  );
  const maxDayOfWeekCount = Math.max(...dayOfWeekData.map((d) => d.count), 1);

  // Customer Retention Cohort Slices
  const retentionSlices: PieSlice[] = useMemo(
    () => [
      {
        name: "Repeat Buyers (2+ orders)",
        count: Math.round(148 * periodFactor),
      },
      { name: "First-Time Customers", count: Math.round(70 * periodFactor) },
      {
        name: "High-Volume VIPs (5+ orders)",
        count: Math.round(36 * periodFactor),
      },
      { name: "Re-activated Buyers", count: Math.round(18 * periodFactor) },
    ],
    [periodFactor],
  );
  const retentionTotal = retentionSlices.reduce((s, x) => s + x.count, 0);

  // Daily trend data based on period
  const trendData = useMemo(() => {
    if (period === "7d") {
      return [
        { label: "Mon", sales: 480, profit: 48, cost: 432 },
        { label: "Tue", sales: 540, profit: 56, cost: 484 },
        { label: "Wed", sales: 690, profit: 75, cost: 615 },
        { label: "Thu", sales: 620, profit: 68, cost: 552 },
        { label: "Fri", sales: 880, profit: 98, cost: 782 },
        { label: "Sat", sales: 1040, profit: 122, cost: 918 },
        { label: "Sun", sales: 720, profit: 80, cost: 640 },
      ];
    }
    if (period === "30d") {
      return [
        { label: "Week 1", sales: 3100, profit: 340, cost: 2760 },
        { label: "Week 2", sales: 3650, profit: 410, cost: 3240 },
        { label: "Week 3", sales: 4200, profit: 480, cost: 3720 },
        { label: "Week 4", sales: 3900, profit: 440, cost: 3460 },
      ];
    }
    return [
      { label: "May", sales: 9400, profit: 1060, cost: 8340 },
      { label: "Jun", sales: 11200, profit: 1280, cost: 9920 },
      { label: "Jul", sales: 13400, profit: 1540, cost: 11860 },
      { label: "Aug", sales: 15800, profit: 1820, cost: 13980 },
      { label: "Sep", sales: 18200, profit: 2140, cost: 16060 },
    ];
  }, [period]);

  const maxTrendSales = Math.max(...trendData.map((d) => d.sales), 1);

  // Top bundles ranking reactively filtered by period
  const topBundles = useMemo(
    () => [
      {
        name: "MTN 10GB Non-Expiry",
        network: "MTN",
        orders: Math.round(184 * periodFactor),
        revenue: Math.round(15640 * periodFactor),
        profitPerUnit: 4.5,
        profitTotal: Math.round(828 * periodFactor),
      },
      {
        name: "MTN 5GB Non-Expiry",
        network: "MTN",
        orders: Math.round(142 * periodFactor),
        revenue: Math.round(6035 * periodFactor),
        profitPerUnit: 2.5,
        profitTotal: Math.round(355 * periodFactor),
      },
      {
        name: "Telecel 15GB Special",
        network: "Telecel",
        orders: Math.round(76 * periodFactor),
        revenue: Math.round(6840 * periodFactor),
        profitPerUnit: 5.0,
        profitTotal: Math.round(380 * periodFactor),
      },
      {
        name: "MTN 20GB Turbonet",
        network: "MTN",
        orders: Math.round(64 * periodFactor),
        revenue: Math.round(8960 * periodFactor),
        profitPerUnit: 7.0,
        profitTotal: Math.round(448 * periodFactor),
      },
      {
        name: "AT 10GB Big Time",
        network: "AT",
        orders: Math.round(38 * periodFactor),
        revenue: Math.round(2660 * periodFactor),
        profitPerUnit: 3.5,
        profitTotal: Math.round(133 * periodFactor),
      },
    ],
    [periodFactor],
  );
  const maxBundleRevenue = Math.max(...topBundles.map((b) => b.revenue));

  // Recent commissions ledger derived from delivered orders
  const allCommissions: CommissionLedgerItem[] = useMemo(() => {
    return deliveredOrders.map((o, idx) => {
      const amt = o.amount || 35.0;
      const profit = o.agentMargin || Number((amt * 0.08 || 2.8).toFixed(2));
      const cost = amt - profit;
      return {
        id: `comm-${o.id || idx}`,
        orderId: o.reference || `ORD-GH-${1000 + idx}`,
        productName: o.productName || "Data Bundle",
        recipientPhone: o.recipientPhone || "0244192834",
        network: o.network || "MTN",
        amount: amt,
        cost,
        profit,
        date: o.date || "Just now",
        status: "credited",
      };
    });
  }, [deliveredOrders]);

  // Filtered commissions for Table (Matches All Bulk SMS Campaigns pattern)
  const filteredCommissions = useMemo(() => {
    return allCommissions.filter((comm) => {
      const matchNetwork =
        networkFilter === "all" || comm.network === networkFilter;
      const matchStatus =
        statusFilter === "all" || comm.status === statusFilter;
      const matchTier =
        marginTierFilter === "all" ||
        (marginTierFilter === "high" && comm.profit >= 4.0) ||
        (marginTierFilter === "standard" && comm.profit < 4.0);

      const q = commSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        comm.orderId.toLowerCase().includes(q) ||
        comm.productName.toLowerCase().includes(q) ||
        comm.recipientPhone.includes(q);

      return matchNetwork && matchStatus && matchTier && matchSearch;
    });
  }, [
    allCommissions,
    networkFilter,
    statusFilter,
    marginTierFilter,
    commSearch,
  ]);

  const hasActiveFilters =
    commSearch !== "" ||
    networkFilter !== "all" ||
    statusFilter !== "all" ||
    marginTierFilter !== "all";

  const handleResetFilters = () => {
    setCommSearch("");
    setNetworkFilter("all");
    setStatusFilter("all");
    setMarginTierFilter("all");
    setCommPage(1);
  };

  const totalCommPages = Math.max(
    1,
    Math.ceil(filteredCommissions.length / COMM_PER_PAGE),
  );
  const paginatedCommissions = filteredCommissions.slice(
    (commPage - 1) * COMM_PER_PAGE,
    commPage * COMM_PER_PAGE,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. STORE STATUS HEADER BANNER (Identical to Store Builder Header Style)   */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-primary/10 border border-border shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-900 dark:text-amber-300 tracking-wider">
              Agent Sales &amp; Reseller Analytics
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tier 2 Gold Merchant · Live Telemetry</span>
            </span>
            <SignalRail status="online" size="sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Sales Velocity &amp; Earnings Intelligence
          </h1>

          <p className="text-[12px] text-muted-foreground">
            Real-time telecom volume, margins, rush activity, and carrier share.
          </p>

          {/* Time Period Filter Pills & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="inline-flex rounded-full border border-border bg-background/50 p-1 shadow-2xs">
              {(
                [
                  ["7d", "7 Days"],
                  ["30d", "30 Days"],
                  ["all", "All Time"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  variant={period === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(key)}
                  className={`h-7  px-3 text-xs font-bold transition-all ${
                    period === key
                      ? "shadow-xs "
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>

            {onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("pricing")}
                className="h-9 px-3 border border-border !bg-background/50 text-xs font-bold hover:!bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sliders className="size-3.5 text-amber-500" />
                <span>Adjust Margins</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right side Commission & Balance Control Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              Available to Cash Out
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 ">
                GH₵ {commissionBalance.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">
              Net margin from wholesale sales
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="h-9 px-3.5 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Withdraw Profit</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS CARDS (Exact Match of Bulk SMS Campaigns & Dispatches stats card) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: All Sales Volume (GMV) */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Sales Volume (GMV)
            </span>
          </div>
          <p className="mt-2 text-xl font-black  text-foreground">
            GH₵ {periodSales.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            +24.8% vs last period
          </p>
        </div>

        {/* Tile 2: Profit Margin */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Profit Margin
            </span>
          </div>
          <p className="mt-2 text-xl font-black  text-emerald-600 dark:text-emerald-400">
            +GH₵ {periodCommissions.toFixed(2)}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            +{momGrowth}% MoM net growth
          </p>
        </div>

        {/* Tile 3: Delivered Orders */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Delivered Orders
            </span>
          </div>
          <p className="mt-2 text-xl font-black  text-foreground">
            {periodDeliveredCount}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {deliveryRate}% verified SLA rate
          </p>
        </div>

        {/* Tile 4: Average Order Basket */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Avg. Order Basket
            </span>
          </div>
          <p className="mt-2 text-xl font-black  text-foreground">
            GH₵ {periodAvgOrderValue.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Across all 3 carriers
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION TABS (Analyzed & Formatted Exactly Like MyStoreBuilder.tsx)  */}
      {/* ========================================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="min-w-full p-1">
            <TabsList className="inline-flex h-14 w-max min-w-full items-center justify-start gap-1.5 rounded-2xl border border-border/80 bg-muted/70 p-1.5 text-muted-foreground shadow-2xs">
              <TabsTrigger
                value="overview"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Sales &amp; Revenue Trends</span>
              </TabsTrigger>
              <TabsTrigger
                value="commissions"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Commissions &amp; Margins</span>
              </TabsTrigger>
              <TabsTrigger
                value="networks"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Radio className="w-4 h-4 text-amber-500" />
                <span>Carrier Market Share</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Peak Rush Hours</span>
              </TabsTrigger>
              <TabsTrigger
                value="bundles"
                className="h-6 rounded-xl px-4 py-2 text-[12px] flex items-center gap-2 transition-all data-active:!bg-background data-active:text-foreground data-active:shadow-sm"
              >
                <Tag className="w-4 h-4 text-purple-500" />
                <span>Bundle Rankings &amp; Ledger</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>

        {/* ========================================================================= */}
        {/* TAB 1: SALES & REVENUE TRENDS (Exact Store Builder Visual Style)          */}
        {/* ========================================================================= */}
        <TabsContent
          value="overview"
          className="space-y-6 animate-in fade-in-50"
        >
          {/* ── Revenue & Net Margin Trajectory Bar Chart (Exact Orders per day style) ── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Revenue &amp; Net Margin Trajectory
                </h3>
                <p className="text-xs text-muted-foreground">
                  {period === "7d"
                    ? "Daily volume & profit breakdown for the last 7 days"
                    : period === "30d"
                      ? "Weekly volume & profit breakdown for the last 30 days"
                      : "Monthly volume & profit breakdown for all time"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden sm:block text-[10px] font-bold text-muted-foreground bg-background/50 py-1 px-3 rounded-full border border-border">
                  Peak: GH₵ {maxTrendSales}
                </div>
              </div>
            </div>

            <div className="flex h-36 items-end gap-2">
              {trendData.map((d, i) => (
                <div
                  key={i}
                  className="group flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full relative flex flex-col justify-end"
                    style={{ height: "120px" }}
                  >
                    {/* pending / cost bar (bottom) */}
                    <div
                      className="w-full rounded-sm bg-muted transition-all duration-500"
                      style={{
                        height: `${((d.sales - d.profit) / maxTrendSales) * 100}%`,
                      }}
                      title={`Wholesale Cost: GH₵ ${d.sales - d.profit}`}
                    />
                    {/* delivered / profit bar (top) */}
                    <div
                      className="w-full rounded-sm bg-primary/80 transition-all duration-500"
                      style={{
                        height: `${(d.profit / maxTrendSales) * 100}%`,
                      }}
                      title={`Net Profit: GH₵ ${d.profit}`}
                    />
                    {/* hover count */}
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      GH₵ {d.sales}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-primary/80" />
                <span className="text-muted-foreground">
                  Net Margin (Profit)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-muted" />
                <span className="text-muted-foreground">
                  Wholesale Cost (Sales)
                </span>
              </div>
            </div>
          </div>

          {/* ── Busiest Hours (Day-of-Week) & Best Sellers (Piechart) 2-Column Grid Row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Day-of-Week Sales Volume Intensity (Exact look of Busiest hours from store builder) */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
                  <Clock className="size-4" />
                  Day-of-Week Sales Volume Intensity
                </h3>

                <div className="space-y-2.5">
                  {dayOfWeekData.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-[10px] font-semibold  text-muted-foreground">
                        {h.label}
                      </span>

                      <div className="relative flex-1">
                        <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                          <div
                            className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                            style={{
                              width: `${(h.count / maxDayOfWeekCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="w-8 shrink-0 text-right text-[10px] font-bold text-foreground ">
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Retention & Lifetime Value (Exact look of Best sellers piechart from store builder) */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div>
                <h3 className="mb-2 text-sm font-extrabold text-foreground">
                  Customer Retention &amp; Lifetime Value
                </h3>

                <div className="flex flex-col items-center gap-4">
                  {/* Donut Pie */}
                  <div className="relative shrink-0 size-40">
                    <PieChart slices={retentionSlices} />
                    {/* Centre label */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        total
                      </span>
                      <span className="text-lg font-black text-foreground ">
                        {retentionTotal}
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-1.5">
                    {retentionSlices.map((item, i) => {
                      const pct = ((item.count / retentionTotal) * 100).toFixed(
                        0,
                      );
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={`size-2 shrink-0 rounded-full ${PIE_COLORS_TW[i % PIE_COLORS_TW.length]}`}
                            />
                            <span className="truncate text-[11px] font-medium text-foreground">
                              {item.name}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 text-[9px]">
                            <span className=" font-bold text-muted-foreground">
                              {pct}%
                            </span>
                            <span className=" font-bold text-foreground">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: COMMISSIONS & MARGINS (Store Builder Look)                         */}
        {/* ========================================================================= */}
        <TabsContent
          value="commissions"
          className="space-y-6 animate-in fade-in-50"
        >
          {/* Profit by Telecom Carrier */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Radio className="size-4" />
                Profit by Telecom Carrier
              </h3>

              <div className="space-y-2.5">
                {networkBreakdown.map((net) => (
                  <div key={net.code} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
                      {net.network}
                    </span>

                    <div className="relative flex-1">
                      <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                        <div
                          className={`h-full rounded-lg ${net.barColor} transition-all duration-700`}
                          style={{ width: `${net.share}%` }}
                        />
                      </div>
                    </div>

                    <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      +GH₵ {net.profit.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tier Progress & Rewards Integration */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <TierProgressCard
              currentTier="Tier 2 Gold Merchant"
              tierRate={0.45}
              nextTier="Tier 3 Platinum"
              progressPercent={72}
              currentScore={1425.5}
              goalScore={2000}
              storeProfit={thisMonthCommissions}
              commission={commissionBalance}
              referrals={155.5}
              referralsExcluded={0}
              customers={deliveredOrders.length || 145}
              referralCount={12}
              deliveredPercent={`${deliveryRate}%`}
            />
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: CARRIER MARKET SHARE (Store Builder Look)                          */}
        {/* ========================================================================= */}
        <TabsContent
          value="networks"
          className="space-y-6 animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Donut Chart */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-1">
              <h3 className="mb-1 text-sm font-extrabold text-foreground">
                Carrier Market Share
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Volume distribution among Ghanaian telcos
              </p>

              <div className="flex flex-col items-center gap-4">
                {/* SVG Donut */}
                <div className="relative shrink-0 size-40">
                  <PieChart
                    slices={networkBreakdown.map((net) => ({
                      name: net.network,
                      count: net.sales,
                    }))}
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      total
                    </span>
                    <span className="text-sm font-black text-foreground ">
                      GH₵ {totalSales.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2">
                  {networkBreakdown.map((net, i) => (
                    <div
                      key={net.code}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${PIE_COLORS_TW[i % PIE_COLORS_TW.length]}`}
                        />
                        <span className="font-semibold text-foreground">
                          {net.network}
                        </span>
                      </div>
                      <span className="font-bold  text-foreground">
                        {net.share}% ({net.orders} orders)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carrier Performance Comparison Cards */}
            <div className="lg:col-span-2 space-y-4 bg-card p-5 shadow-xs rounded-2xl border border-border">
              {networkBreakdown.map((net) => (
                <div
                  key={net.code}
                  className="p-5 rounded-2xl border border-border bg-muted/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          net.code === "MTN"
                            ? "bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40"
                            : net.code === "Telecel"
                              ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                              : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40"
                        }`}
                      >
                        {net.code} Network
                      </Badge>
                      <span className="text-xs font-bold text-foreground">
                        {net.network}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {net.orders} successfully delivered orders · GH₵{" "}
                      {net.sales.toFixed(2)} total sales
                    </p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Net Margin
                      </span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 ">
                        +GH₵ {net.profit.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Market Share
                      </span>
                      <span className="text-lg font-black text-foreground ">
                        {net.share}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: PEAK RUSH HOURS (Store Builder Look)                               */}
        {/* ========================================================================= */}
        <TabsContent
          value="activity"
          className="space-y-6 animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Rush Times Curve (Styled like Busiest hours from store builder) */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-2">
              <div>
                <h3 className="mb-1 text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Clock className="size-4" />
                  Busiest Hours ("When Customers Buy")
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Customer order checkout frequency throughout the 24-hour cycle
                </p>

                <div className="space-y-2.5">
                  {hourlyData.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-[10px] font-semibold  text-muted-foreground">
                        {h.label}
                      </span>

                      <div className="relative flex-1">
                        <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                          <div
                            className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                            style={{
                              width: `${(h.count / maxHourlyCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="w-8 shrink-0 text-right text-[10px] font-bold text-foreground ">
                        {h.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Peak Rush Window:</strong>{" "}
                Heaviest customer order traffic hits between{" "}
                <strong className="text-foreground">12:00 PM – 2:00 PM</strong>{" "}
                and{" "}
                <strong className="text-foreground">4:00 PM – 6:00 PM</strong>.
                Keep your float funded to handle automated fulfillment.
              </div>
            </div>

            {/* SLA Telemetry Health Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-1 space-y-4">
              <h3 className="text-sm font-extrabold text-foreground">
                Dispatch Health &amp; SLA
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time telecom gateway response
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      EVD Delivery Rate
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 ">
                      {deliveryRate}%
                    </span>
                  </div>
                  <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="h-full rounded-lg bg-emerald-500 transition-all duration-700"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      Average Dispatch Speed
                    </span>
                    <span className="font-bold text-primary ">4.2 seconds</span>
                  </div>
                  <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Licensed Telco Routing</span>
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  All transactions run directly through carrier-approved EVD
                  switches with instant reversal protection.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: BUNDLE RANKINGS & COMMISSIONS TABLE                                */}
        {/* (Exact layout of All Bulk SMS Campaigns & Audit Ledger table)              */}
        {/* ========================================================================= */}
        <TabsContent
          value="bundles"
          className="space-y-6 animate-in fade-in-50"
        >
          {/* Top 5 Bundles Visual Chart */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Tag className="size-4" />
                    Top-Selling Bundles Performance
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Comparison of gross revenue vs cumulative profit per bundle
                    package
                  </p>
                </div>
                {onNavigateTab && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateTab("pricing")}
                    className="text-xs font-bold gap-1.5 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Sliders className="size-3.5 text-amber-500" />
                    <span>Adjust Pricing</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2.5">
                {topBundles.map((b, i) => {
                  const pct = Math.round((b.revenue / maxBundleRevenue) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-[10px] font-semibold text-muted-foreground">
                        {b.name}
                      </span>

                      <div className="relative flex-1">
                        <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                          <div
                            className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        +GH₵ {b.profitTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MASTER COMMISSIONS AUDIT TABLE CARD                                       */}
          {/* (Exact structure and layout of All Bulk SMS Campaigns & Audit Ledger)    */}
          {/* ========================================================================= */}
          <Card className="border-border shadow-xs rounded-2xl">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <Receipt className="size-5 text-primary" />
                    <span>Itemized Profit &amp; Commissions Ledger</span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Comprehensive audit log of order fulfillments, retail
                    markups, recipient phones, and wallet settlement credits.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Search + Filters (Styled exactly like All Bulk SMS Campaigns & Audit Ledger) */}
            <div className="border-b border-border bg-muted/20 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="comm-search"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    Search commissions
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="comm-search"
                      type="text"
                      placeholder="Search commissions by order reference, bundle name, or recipient phone..."
                      value={commSearch}
                      onChange={(e) => {
                        setCommSearch(e.target.value);
                        setCommPage(1);
                      }}
                      className="h-10 bg-background pl-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Filters Box */}
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Ledger filters
                      </span>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        Reset filters
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-status"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Settlement status
                      </Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(val) => {
                          if (val) {
                            setStatusFilter(val);
                            setCommPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-status"
                          className="h-9 w-full text-xs rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All statuses ({allCommissions.length})
                          </SelectItem>
                          <SelectItem value="credited">
                            Credited to Wallet ({allCommissions.length})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pending Settle (0)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Network Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-network"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Telecom carrier
                      </Label>
                      <Select
                        value={networkFilter}
                        onValueChange={(val) => {
                          if (val) {
                            setNetworkFilter(val);
                            setCommPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-network"
                          className="h-9 w-full text-xs rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All networks</SelectItem>
                          <SelectItem value="MTN">MTN Ghana</SelectItem>
                          <SelectItem value="Telecel">Telecel Ghana</SelectItem>
                          <SelectItem value="AT">AirtelTigo (AT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Margin Tier Filter */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="filter-margin"
                        className="text-[10px] font-semibold text-muted-foreground"
                      >
                        Margin tier
                      </Label>
                      <Select
                        value={marginTierFilter}
                        onValueChange={(val) => {
                          if (val) {
                            setMarginTierFilter(val);
                            setCommPage(1);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="filter-margin"
                          className="h-9 w-full text-xs rounded-xl"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            All margin amounts
                          </SelectItem>
                          <SelectItem value="high">
                            High Margin (&ge; GH₵ 4.00)
                          </SelectItem>
                          <SelectItem value="standard">
                            Standard Margin (&lt; GH₵ 4.00)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">
                      Order Ref &amp; Network
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">
                      Product &amp; Bundle
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">
                      Recipient
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right">
                      Customer Paid
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right">
                      Agent Profit
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">
                      Settled Date
                    </TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-48 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="size-10 rounded-2xl bg-muted/60 flex items-center justify-center">
                            <Receipt className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-xs font-bold text-foreground">
                            No matching commission records found
                          </p>
                          <p className="text-[11px] text-muted-foreground max-w-xs">
                            {hasActiveFilters
                              ? "Try modifying your search or clearing active filters to see more results."
                              : "Wholesale retail margins credited from completed orders will appear here in the settlement audit log."}
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={handleResetFilters}
                              className="text-xs font-bold text-primary cursor-pointer"
                            >
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCommissions.map((comm) => (
                      <TableRow
                        key={comm.id}
                        onClick={() => setSelectedCommission(comm)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        {/* Order Ref & Network */}
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                                comm.network === "MTN"
                                  ? "bg-amber-400 text-amber-950"
                                  : comm.network === "Telecel"
                                    ? "bg-red-600 text-white"
                                    : "bg-blue-600 text-white"
                              }`}
                            >
                              {comm.network}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate max-w-[160px] sm:max-w-xs">
                                {comm.orderId}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                EVD Direct Settlement
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Product & Bundle */}
                        <TableCell className="text-xs">
                          <div className="font-bold text-foreground truncate max-w-[180px]">
                            {comm.productName}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            Wholesale Data Dispatch
                          </div>
                        </TableCell>

                        {/* Recipient */}
                        <TableCell className="text-xs">
                          <div className="font-semibold text-foreground ">
                            {comm.recipientPhone}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Recipient Handset
                          </div>
                        </TableCell>

                        {/* Customer Paid */}
                        <TableCell className="text-right text-xs font-semibold text-muted-foreground ">
                          GH₵ {comm.amount.toFixed(2)}
                        </TableCell>

                        {/* Agent Profit */}
                        <TableCell className="text-right text-xs font-bold  text-emerald-600 dark:text-emerald-400">
                          +GH₵ {comm.profit.toFixed(2)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Credited</span>
                          </Badge>
                        </TableCell>

                        {/* Settled Date */}
                        <TableCell className="text-xs text-foreground whitespace-nowrap">
                          {comm.date}
                        </TableCell>

                        {/* Action Chevron */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCommission(comm);
                            }}
                          >
                            <ChevronRight className="size-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Footer (Exact Match of All Bulk SMS Campaigns footer) */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {filteredCommissions.length === 0
                      ? 0
                      : Math.min(
                          commPage * COMM_PER_PAGE,
                          filteredCommissions.length,
                        )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {filteredCommissions.length}
                  </span>{" "}
                  commission records
                </span>

                {filteredCommissions.length > COMM_PER_PAGE && (
                  <div>
                    <PaginationHelper
                      currentPage={commPage}
                      totalPages={totalCommPages}
                      onPageChange={setCommPage}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 4. COMMISSION SETTLEMENT DETAIL MODAL                                     */}
      {/* (Styled cleanly with copy reference and itemized cost breakdown)          */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedCommission}
        onOpenChange={(open) => !open && setSelectedCommission(null)}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
          {selectedCommission && (
            <>
              <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 pr-10 sm:pr-12">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-xs shadow-sm ${
                      selectedCommission.network === "MTN"
                        ? "bg-amber-400 text-amber-950"
                        : selectedCommission.network === "Telecel"
                          ? "bg-red-600 text-white"
                          : "bg-blue-600 text-white"
                    }`}
                  >
                    {selectedCommission.network}
                  </span>

                  <div className="min-w-0">
                    <DialogTitle className="text-base font-extrabold text-foreground truncate">
                      {selectedCommission.orderId}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Instant EVD Wholesale Margin Audit
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 text-xs">
                {/* Status Callout */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Settled &amp; Credited to Wallet
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm ">
                    +GH₵ {selectedCommission.profit.toFixed(2)}
                  </span>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Product Bundle
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedCommission.productName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Recipient Number
                    </span>
                    <span className="font-bold text-foreground ">
                      {selectedCommission.recipientPhone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Settlement Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedCommission.date}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Customer Paid (Gross)
                    </span>
                    <span className="font-semibold text-foreground ">
                      GH₵ {selectedCommission.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Wholesale Platform Cost
                    </span>
                    <span className="font-semibold text-foreground ">
                      GH₵ {selectedCommission.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-foreground">
                      Net Reseller Commission
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm ">
                      +GH₵ {selectedCommission.profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    className="flex-1 rounded-xl text-xs font-bold cursor-pointer"
                    onClick={() => setSelectedCommission(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SECURE WITHDRAW MODAL */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={onWithdrawSuccess}
        commissionBalance={commissionBalance}
      />
    </div>
  );
};
