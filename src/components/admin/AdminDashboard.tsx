import React, { useState } from "react";
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  ShoppingBag,
  Users,
  Coins,
  Share2,
  Server,
  Zap,
  Activity,
  Filter,
  Check,
  ExternalLink,
  Radio,
  Gift,
} from "lucide-react";
import {
  TelecomGateway,
  Order,
  AfaApplication,
  ResultCheckerProduct,
} from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";

interface AdminDashboardProps {
  orders: Order[];
  gateways: TelecomGateway[];
  onNavigateTab: (tab: string) => void;
  onSelectReceiptOrder?: (order: Order) => void;
  afaApplications?: AfaApplication[];
  checkers?: ResultCheckerProduct[];
}

interface ReferralLeader {
  id: string;
  name: string;
  phone: string;
  role: string;
  code: string;
  signups: number;
  qualified: number;
  earned: number;
}

interface RecentReferral {
  id: string;
  name: string;
  referrer: string;
  code: string;
  status: "qualified" | "pending";
  timeAgo: string;
}

const MOCK_REFERRAL_LEADERS: ReferralLeader[] = [
  {
    id: "ref-1",
    name: "Kofi Mensah",
    phone: "024 412 8901",
    role: "Agent",
    code: "KOFI-DATA",
    signups: 142,
    qualified: 118,
    earned: 354.0,
  },
  {
    id: "ref-2",
    name: "Emmanuel Osei",
    phone: "055 892 3410",
    role: "Agent",
    code: "SDH-OSEI",
    signups: 98,
    qualified: 74,
    earned: 222.0,
  },
  {
    id: "ref-3",
    name: "Ama Darko",
    phone: "020 771 9024",
    role: "Agent",
    code: "AMA-STORE",
    signups: 76,
    qualified: 62,
    earned: 186.0,
  },
  {
    id: "ref-4",
    name: "Kwabena Boateng",
    phone: "050 334 1189",
    role: "Agent",
    code: "KWAB-HUB",
    signups: 54,
    qualified: 45,
    earned: 135.0,
  },
  {
    id: "ref-5",
    name: "Eunice Addo",
    phone: "024 998 4402",
    role: "Agent",
    code: "EUNICE-FAST",
    signups: 41,
    qualified: 33,
    earned: 99.0,
  },
  {
    id: "ref-6",
    name: "Samuel Tetteh",
    phone: "027 665 1904",
    role: "Agent",
    code: "SAM-TELECOM",
    signups: 32,
    qualified: 28,
    earned: 84.0,
  },
];

const MOCK_RECENT_REFERRALS: RecentReferral[] = [
  {
    id: "rec-1",
    name: "Abena Boateng",
    referrer: "Kofi Mensah",
    code: "KOFI-DATA",
    status: "qualified",
    timeAgo: "4m ago",
  },
  {
    id: "rec-2",
    name: "Kwame Asante",
    referrer: "Emmanuel Osei",
    code: "SDH-OSEI",
    status: "qualified",
    timeAgo: "18m ago",
  },
  {
    id: "rec-3",
    name: "Dennis Appiah",
    referrer: "Ama Darko",
    code: "AMA-STORE",
    status: "pending",
    timeAgo: "35m ago",
  },
  {
    id: "rec-4",
    name: "Patricia Quaye",
    referrer: "Kwabena Boateng",
    code: "KWAB-HUB",
    status: "qualified",
    timeAgo: "1h ago",
  },
  {
    id: "rec-5",
    name: "Josephine Ansah",
    referrer: "Eunice Addo",
    code: "EUNICE-FAST",
    status: "pending",
    timeAgo: "2h ago",
  },
  {
    id: "rec-6",
    name: "Gideon Owusu",
    referrer: "Samuel Tetteh",
    code: "SAM-TELECOM",
    status: "qualified",
    timeAgo: "3h ago",
  },
];

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "Just now";
  try {
    const parseable = dateStr.includes("T")
      ? dateStr
      : dateStr.replace(" ", "T");
    const d = new Date(parseable);
    if (isNaN(d.getTime())) return "Recently";
    const now = Date.now();
    const diffMs = now - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  gateways,
  onNavigateTab,
  onSelectReceiptOrder,
}) => {
  // Core Platform Metrics
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const baseRevenue = 14850.0;
  const dynamicDeliveredTotal = deliveredOrders.reduce(
    (sum, o) => sum + o.amount,
    0,
  );
  const totalRevenueToday = baseRevenue + dynamicDeliveredTotal;

  const totalOrdersToday = orders.length + 146; // Platform total across retail & agents
  const inFlightCount =
    orders.filter(
      (o) =>
        o.status === "waiting" ||
        o.status === "processing" ||
        o.status === "pending",
    ).length + 4;

  const settledOrders = orders.filter(
    (o) =>
      o.status === "delivered" ||
      o.status === "failed" ||
      o.status === "refunded",
  );
  const deliveredRate =
    settledOrders.length > 0
      ? ((deliveredOrders.length / settledOrders.length) * 100).toFixed(1)
      : "99.2";

  // Failing / Auto-refunded orders alert
  const failingOrders = orders.filter(
    (o) => o.status === "failed" || o.status === "refunded",
  );

  // Network Mix calculations
  const totalTrackedOrders = orders.length || 1;
  const mtnOrders = orders.filter((o) => o.network === "MTN").length;
  const telecelOrders = orders.filter((o) => o.network === "Telecel").length;
  const atOrders = orders.filter((o) => o.network === "AirtelTigo").length;

  const mtnPercent = Math.max(
    58,
    Math.round((mtnOrders / totalTrackedOrders) * 100),
  );
  const telecelPercent = Math.max(
    28,
    Math.round((telecelOrders / totalTrackedOrders) * 100),
  );
  const atPercent = Math.max(14, 100 - mtnPercent - telecelPercent);

  // Core Liquidity Float
  const coreLiquidity = 48520.0;

  return (
    <div className="space-y-6">
      {/* Top Banner - Structured identical to AgentDashboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-primary/10 border border-border shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-primary tracking-wider">
              Admin Operations Hub
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              SDH Core Switch Active · 99.98% SLA
            </span>
            <SignalRail status="online" size="sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Platform Operations &amp; Infrastructure
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Live telecom dispatch switches, wholesale order routing, and partner
            storefront ecosystem.
          </p>
        </div>

        {/* Core Gateway Liquidity Float Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Core Gateway Liquidity
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              GH₵ {coreLiquidity}
            </div>
            <span className="text-[11px] text-muted-foreground">
              MTN EVD &amp; Telecel Float
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Core Platform KPI Tiles - Exactly replicating AgentDashboard tile structure */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Revenue Today
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            GH₵ {totalRevenueToday.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {totalOrdersToday} orders today
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Orders Today
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {totalOrdersToday}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Since midnight (00:00 GMT)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
              <CheckCircle2 className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Delivered Rate
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {deliveredRate}%
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            {settledOrders.length + 140} settled dispatches
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              In Flight
            </span>
          </div>
          <p className="mt-2 text-xl font-black tabular-nums text-foreground">
            {inFlightCount}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Waiting or processing
          </p>
        </div>
      </div>

      {/* Upstream Failing / Auto-refunded Orders Warning Banner */}
      {failingOrders.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <span className="font-bold text-red-600 dark:text-red-400">
                {failingOrders.length} order
                {failingOrders.length === 1 ? "" : "s"} failed &amp;
                auto-refunded
              </span>
              <p className="text-muted-foreground mt-0.5">
                The upstream carrier rejected these — customer wallet balances
                were refunded automatically.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigateTab("orders-audit")}
            className="h-8 shrink-0 px-3 text-xs font-bold border-red-500/30 hover:bg-red-500/15 text-red-600 dark:text-red-400 cursor-pointer"
          >
            Review
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Referral & Growth Engine Section (Audited from sdh-next AdminReferrals) */}
      <div className="space-y-4">
        {/* 4 Referral Metrics Tiles - Replicating AgentDashboard tile pattern */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10">
                <Users className="size-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Referred Signups
              </span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-foreground">
              312
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              48 people are referring
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Rewards Paid
              </span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-foreground">
              248
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              79.5% converted
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Awaiting Delivery
              </span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-foreground">
              64
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Bonus not paid yet
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Coins className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Referral Credit Paid
              </span>
            </div>
            <p className="mt-2 text-xl font-black tabular-nums text-foreground">
              GH₵ 1,240.00
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Across both sides
            </p>
          </div>
        </div>

        {/* Network Mix - Profit by Telecom Carrier Design (Own Section) */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Radio className="size-4 text-amber-500" />
              Network Mix
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
                  MTN Ghana
                </span>
                <div className="relative flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="h-full rounded-lg bg-amber-400 transition-all duration-700"
                      style={{ width: `${mtnPercent}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  +GH₵ {((mtnPercent / 100) * 265.5).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
                  Telecel Ghana
                </span>
                <div className="relative flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="h-full rounded-lg bg-red-600 transition-all duration-700"
                      style={{ width: `${telecelPercent}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  +GH₵ {((telecelPercent / 100) * 98).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
                  AirtelTigo AT
                </span>
                <div className="relative flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                    <div
                      className="h-full rounded-lg bg-blue-600 transition-all duration-700"
                      style={{ width: `${atPercent}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  +GH₵ {((atPercent / 100) * 42.5).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-foreground tabular-nums">
                48
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                active agents
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-foreground tabular-nums">
                64%
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                via agents
              </div>
            </div>
          </div>
        </div>

        {/* Top Referrers - Storefront Customer Orders Design */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
            <div>
              <CardTitle className="text-base font-extrabold text-foreground">
                Top Referrers (Top 6)
              </CardTitle>
              <CardDescription className="text-xs">
                Leading agents generating verified user acquisition and retail
                sales.
              </CardDescription>
            </div>
            <Button
              variant="link"
              onClick={() => onNavigateTab("users")}
              className="h-auto gap-1 px-0 text-xs font-bold text-primary cursor-pointer"
            >
              <span>All Users</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Affiliate Code</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Signups</TableHead>
                  <TableHead className="text-center">Funded</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REFERRAL_LEADERS.slice(0, 6).map((leader) => (
                  <TableRow key={leader.id} className="hover:bg-muted/40">
                    <TableCell className="text-xs font-bold text-foreground">
                      {leader.name}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground tabular-nums">
                      {leader.code}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {leader.phone}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium tabular-nums">
                      {leader.signups}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {leader.qualified > 0 ? (
                          <span className="text-[10px] font-bold">
                            {leader.qualified}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                      +GH₵ {leader.earned.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Live Order Feed - Storefront Customer Orders Design */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">
              Live Order Feed (Top 6)
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time carrier dispatches across customer purchases and agent
              stores.
            </CardDescription>
          </div>
          <Button
            variant="link"
            onClick={() => onNavigateTab("orders-audit")}
            className="h-auto gap-1 px-0 text-xs font-bold text-primary cursor-pointer"
          >
            <span>Order Monitor</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Order Reference</TableHead>
                <TableHead>Product Package</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    No orders found on the platform yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.slice(0, 6).map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() =>
                      onSelectReceiptOrder && onSelectReceiptOrder(order)
                    }
                  >
                    <TableCell>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                          order.network === "MTN"
                            ? "bg-amber-400 text-amber-950"
                            : order.network === "Telecel"
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                        }`}
                      >
                        {order.network.slice(0, 3)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-foreground">
                      {order.reference}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-foreground">
                      {order.productName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(order.date)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === "delivered" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Delivered
                          </span>
                        )}
                        {order.status === "processing" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Processing
                          </span>
                        )}
                        {order.status === "waiting" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
                            <span className="size-1.5 rounded-full bg-sky-500" />
                            Waiting
                          </span>
                        )}
                        {(order.status === "pending" ||
                          order.status === "pending_payment") && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                            <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {order.status === "failed" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Failed
                          </span>
                        )}
                        {order.status === "refunded" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">
                            <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                            Refunded
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Latest Referrals - Carrier Performance Comparison Cards Design */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Gift className="size-4 text-emerald-600" />
            Latest Referrals
          </h3>
          <Button
            variant="link"
            onClick={() => onNavigateTab("referrals")}
            className="h-auto gap-1 px-0 text-xs font-bold text-primary cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {MOCK_RECENT_REFERRALS.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-border bg-muted/50 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                      item.status === "qualified"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.status === "qualified" ? (
                      <Check className="size-5" />
                    ) : (
                      <Clock className="size-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      via {item.referrer} · {item.code}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Status
                  </span>
                  {item.status === "qualified" ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Qualified
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-[11px] text-muted-foreground">
                  {item.status === "qualified"
                    ? "First order delivered · reward credited"
                    : "Signed up · awaiting first delivery"}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {item.timeAgo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
