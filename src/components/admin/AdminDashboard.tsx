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
} from "lucide-react";
import { TelecomGateway, Order, AfaApplication, ResultCheckerProduct } from "../../types";
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
    const parseable = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
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
  const dynamicDeliveredTotal = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalRevenueToday = baseRevenue + dynamicDeliveredTotal;

  const totalOrdersToday = orders.length + 146; // Platform total across retail & agents
  const inFlightCount = orders.filter(
    (o) => o.status === "waiting" || o.status === "processing" || o.status === "pending"
  ).length + 4;

  const settledOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "failed" || o.status === "refunded"
  );
  const deliveredRate =
    settledOrders.length > 0
      ? ((deliveredOrders.length / settledOrders.length) * 100).toFixed(1)
      : "99.2";

  // Failing / Auto-refunded orders alert
  const failingOrders = orders.filter(
    (o) => o.status === "failed" || o.status === "refunded"
  );

  // Network Mix calculations
  const totalTrackedOrders = orders.length || 1;
  const mtnOrders = orders.filter((o) => o.network === "MTN").length;
  const telecelOrders = orders.filter((o) => o.network === "Telecel").length;
  const atOrders = orders.filter((o) => o.network === "AirtelTigo").length;

  const mtnPercent = Math.max(58, Math.round((mtnOrders / totalTrackedOrders) * 100));
  const telecelPercent = Math.max(28, Math.round((telecelOrders / totalTrackedOrders) * 100));
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
            Live telecom dispatch switches, wholesale order routing, and partner storefront ecosystem.
          </p>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs">
              <span className="font-semibold text-foreground">
                api.smartdatahub.com/v1
              </span>
            </div>
            <button
              onClick={() => onNavigateTab("orders-audit")}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Order Monitor</span>
            </button>
            <button
              onClick={() => onNavigateTab("gateways")}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs inline-flex"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Carrier Switches</span>
            </button>
          </div>
        </div>

        {/* Core Gateway Liquidity Float Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Core Gateway Liquidity
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              GH₵ {coreLiquidity.toFixed(2)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              MTN EVD &amp; Telecel Float
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={() => onNavigateTab("gateways")}
              className="px-4 py-2.5 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
            >
              Gateways
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigateTab("orders-audit")}
              className="px-4 py-2.5 font-extrabold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              Live Monitor
            </Button>
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
          <p className="text-[10px] text-muted-foreground font-medium">Since midnight (00:00 GMT)</p>
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
          <p className="text-[10px] text-muted-foreground font-medium">Waiting or processing</p>
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
                {failingOrders.length} order{failingOrders.length === 1 ? "" : "s"} failed &amp; auto-refunded
              </span>
              <p className="text-muted-foreground mt-0.5">
                The upstream carrier rejected these — customer wallet balances were refunded automatically.
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

      {/* Quick Operational Actions (matching Agent Dashboard quick actions grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab("orders-audit")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Order Monitor
          </div>
          <div className="text-[10px] text-muted-foreground">
            Upstream dispatches &amp; retries
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("afa-verification")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            AFA Applications
          </div>
          <div className="text-[10px] text-muted-foreground">
            National youth auth queue
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("vouchers-stock")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Result Checkers
          </div>
          <div className="text-[10px] text-muted-foreground">
            BECE &amp; WASSCE inventory
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("agents")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Reseller Stores
          </div>
          <div className="text-[10px] text-muted-foreground">
            Agent margins &amp; stores
          </div>
        </button>
      </div>

      {/* Main Grid: Live Order Feed + Network Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Order Feed Table (2 cols on large screen) */}
        <Card className="border-border shadow-xs lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
            <div>
              <CardTitle className="text-base font-extrabold text-foreground">
                Live Order Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time carrier dispatches across customer purchases and agent stores.
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
                  <TableHead>Order</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      No orders found on the platform yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.slice(0, 7).map((order) => {
                    const isStorefront = !!order.agentMargin;
                    const isAgent = !isStorefront && order.customerName.toLowerCase().includes("agent");

                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/40 cursor-pointer"
                        onClick={() => onSelectReceiptOrder && onSelectReceiptOrder(order)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase shrink-0 ${
                                order.network === "MTN"
                                  ? "bg-amber-400 text-amber-950"
                                  : order.network === "Telecel"
                                    ? "bg-red-600 text-white"
                                    : "bg-blue-600 text-white"
                              }`}
                            >
                              {order.network.slice(0, 3)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">
                                {order.productName}
                              </div>
                              <div className="text-[11px] text-muted-foreground tabular-nums">
                                {order.reference}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-semibold text-foreground">
                            {order.customerName}
                          </div>
                          <div>
                            {isStorefront ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400">
                                Storefront
                              </span>
                            ) : isAgent ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                                Agent
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                                Customer
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right text-xs font-bold text-foreground tabular-nums">
                          GH₵ {order.amount.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              order.status === "delivered"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : order.status === "processing"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : order.status === "waiting" || order.status === "pending"
                                    ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </TableCell>

                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(order.date)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Network Mix & Volume Distribution Card */}
        <Card className="border-border shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-extrabold text-foreground">
                Network Mix
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time carrier distribution across current order volume.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* MTN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-bold text-foreground">MTN Ghana</span>
                  </div>
                  <span className="font-extrabold text-foreground tabular-nums">
                    {mtnPercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${mtnPercent}%` }}
                  />
                </div>
              </div>

              {/* Telecel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-red-600 shrink-0" />
                    <span className="font-bold text-foreground">Telecel Ghana</span>
                  </div>
                  <span className="font-extrabold text-foreground tabular-nums">
                    {telecelPercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all"
                    style={{ width: `${telecelPercent}%` }}
                  />
                </div>
              </div>

              {/* AT (AirtelTigo) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-foreground">AT (AirtelTigo)</span>
                  </div>
                  <span className="font-extrabold text-foreground tabular-nums">
                    {atPercent}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${atPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </div>

          {/* Card Footer Summary */}
          <div className="p-5 border-t border-border flex items-center justify-between bg-muted/20">
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
        </Card>
      </div>

      {/* Referral & Growth Engine Section (Audited from sdh-next AdminReferrals) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2">
          <div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <span>Referral &amp; Growth Engine</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Platform-wide affiliate signups, first delivery rewards, and credit payouts.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab("referrals")}
            className="text-xs font-bold cursor-pointer"
          >
            Tiers &amp; Incentives
          </Button>
        </div>

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

        {/* Referrals 2-Column Grid: Top Referrers + Latest Referrals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Referrers Table */}
          <Card className="border-border shadow-xs lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground">
                  Top Referrers
                </CardTitle>
                <CardDescription className="text-xs">
                  Leading agents generating verified user acquisition and retail sales.
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
                    <TableHead className="text-center">Signups</TableHead>
                    <TableHead className="text-center">Funded</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_REFERRAL_LEADERS.map((leader) => (
                    <TableRow key={leader.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="text-xs font-bold text-foreground">
                          {leader.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {leader.phone} · {leader.role}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground tabular-nums">
                        {leader.code}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium tabular-nums">
                        {leader.signups}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {leader.qualified}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground tabular-nums">
                        GH₵ {leader.earned.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Latest Referrals List */}
          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-extrabold text-foreground">
                Latest Referrals
              </CardTitle>
              <CardDescription className="text-xs">
                Recent user signups via affiliate invite links.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {MOCK_RECENT_REFERRALS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.status === "qualified"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.status === "qualified" ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      via {item.referrer} ·{" "}
                      <span className="font-semibold text-foreground/80 tabular-nums">
                        {item.code}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                    {item.timeAgo}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
