import React, { useState } from "react";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Share2,
  Users,
  Send,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Store,
  Sparkles,
  ChevronRight,
  Coins,
  RotateCcw,
} from "lucide-react";
import { AgentStoreConfig, Order } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { TierProgressCard } from "./TierProgressCard";
import { ReferralCard } from "./ReferralCard";
import { ReferralModal } from "./ReferralModal";
import { SalesChart } from "./SalesChart";
import { AgentFailedBeneficiary } from "./AgentFailedBeneficiary";
import { WithdrawModal } from "./WithdrawModal";
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
import { Button } from "../ui/button";

interface AgentDashboardProps {
  storeConfig: AgentStoreConfig;
  onNavigateTab: (tab: string) => void;
  onOpenStorefront: () => void;
  orders: Order[];
  commissionBalance: number;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  storeConfig,
  onNavigateTab,
  onOpenStorefront,
  orders,
  commissionBalance,
}) => {
  const [copiedLink, setCopiedLink] = useState(false); // Referral Modal State
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://smartdatahub.com";
  const fullStoreUrl = `${origin}/store/${storeConfig.handle || "store"}`;
  const displayStoreUrl = `smartdatahub.com/store/${storeConfig.handle || "store"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const storeOrders = orders.filter((o) => o.agentMargin !== undefined);
  const totalGmv = storeOrders.reduce((acc, o) => acc + o.amount, 0) + 1480.0;
  const todayProfit =
    storeOrders.reduce((acc, o) => acc + (o.agentMargin || 0), 0) + 142.5;

  return (
    <div className="space-y-6">
      {/* Agent Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-primary/10 border border-border shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-amber-900 dark:text-amber-300 tracking-wider">
              Agent Reseller Hub
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              Tier 2 Gold Merchant · 45% of margin
            </span>
            <SignalRail status="online" size="sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {storeConfig.storeName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your storefront is{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              Live & Selling
            </strong>
            . Orders auto-deliver through our core gateway.
          </p>

          {/* Store URL & Share Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs">
              <span className="text-muted-foreground">URL:</span>
              <span className="font-semibold text-foreground">
                {displayStoreUrl}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
            <a
              href={fullStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs inline-flex"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Storefront</span>
            </a>
          </div>
        </div>

        {/* Available Commission Card */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Withdrawable Commissions
            </span>
            <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums">
              GH₵ {commissionBalance.toFixed(2)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              MTN & Telecel Cash
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={() => setWithdrawModalOpen(true)}
              className="px-4 py-2.5 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
            >
              Withdraw
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setReferralModalOpen(true)}
              className="px-4 py-2.5 font-extrabold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Refer
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Today's Profit
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            +GH₵ {todayProfit.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            From 38 customer orders
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Monthly Sales GMV
          </span>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            GH₵ {totalGmv.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            +18.4% vs last month
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Store Health Score
          </span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">
            96 / 100
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            WhatsApp & Prices verified
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Registered Customers
          </span>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            145
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Available for Bulk SMS
          </p>
        </div>
      </div>

      {/* Info Banners */}
      <div className="grid grid-cols-1 gap-4">
        {/* Pending Dispatch Warning */}
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs">
          <div className="flex items-center gap-3">
            <SignalRail status="processing" size="sm" />

            <div>
              <span className="font-semibold">Active Delivery: </span>

              <span>Order SO-2289 (MTN 5GB) is in active upstream queue.</span>
            </div>
          </div>

          <Button
            variant="link"
            onClick={() => onNavigateTab("orders")}
            className="h-auto shrink-0 px-0 text-xs"
          >
            Track
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Tier Progress & Referral Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TierProgressCard
          currentTier="Tier 2 Gold Merchant"
          tierRate={0.45}
          nextTier="Tier 3 Platinum"
          progressPercent={72}
          currentScore={1425.5}
          goalScore={2000}
          storeProfit={850}
          commission={420}
          referrals={155.5}
          referralsExcluded={0}
          customers={145}
          referralCount={12}
          deliveredPercent="94%"
        />
        <ReferralCard
          referralCode="X7K9M2P4"
          signedUp={12}
          qualified={8}
          earned={24}
          pending={4}
          reward={3}
          referredReward={2}
          onOpenModal={() => setReferralModalOpen(true)}
        />
      </div>

      {/* Sales Chart */}
      <SalesChart
        data={[
          { day: "Mon", value: 180 },
          { day: "Tue", value: 240 },
          { day: "Wed", value: 310 },
          { day: "Thu", value: 280 },
          { day: "Fri", value: 450 },
          { day: "Sat", value: 520 },
          { day: "Sun", value: 380 },
        ]}
      />

      {/* Quick Agent Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab("my-store")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Customize Store
          </div>
          <div className="text-[10px] text-muted-foreground">
            Brand, colors, margins
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("pricing")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Set Retail Prices
          </div>
          <div className="text-[10px] text-muted-foreground">
            Wholesale vs margins
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("bulk-sms")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Send Bulk SMS</div>
          <div className="text-[10px] text-muted-foreground">
            Campaigns to buyers
          </div>
        </button>

        <button
          onClick={() => onNavigateTab("analytics")}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">
            Sales Analytics
          </div>
          <div className="text-[10px] text-muted-foreground">
            Charts & insights
          </div>
        </button>
      </div>

      {/* Recent Storefront Orders */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground">
              Storefront Customer Orders (Top 6)
            </CardTitle>
            <CardDescription className="text-xs">
              Orders placed by customers through your public link.
            </CardDescription>
          </div>
          <Button
            variant="link"
            onClick={() => onNavigateTab("store-orders")}
            className="h-auto gap-1 px-0 text-xs font-bold text-primary"
          >
            <span>View All</span>
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
                <TableHead>Recipient Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead className="text-right">Your Margin</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storeOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    No storefront orders found.
                  </TableCell>
                </TableRow>
              ) : (
                storeOrders.slice(0, 6).map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40">
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
                      {order.recipientPhone}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {order.date}
                    </TableCell>
                    <TableCell className="text-right text-xs font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                      +GH₵ {(order.agentMargin || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            order.status === "delivered"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : order.status === "processing"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              order.status === "delivered"
                                ? "bg-emerald-500"
                                : order.status === "processing"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          />
                          {order.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Referral Modal */}
      <ReferralModal
        open={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
        referralCode="X7K9M2P4"
        reward={3}
        referredReward={2}
        referrals={[
          {
            id: "1",
            name: "Ama Mensah",
            status: "qualified",
            reward: 3,
            at: Date.now() - 86400000 * 2,
          },
          {
            id: "2",
            name: "Kwame Asante",
            status: "pending",
            reward: 0,
            at: Date.now() - 86400000 * 5,
          },
          {
            id: "3",
            name: "Efua Boateng",
            status: "qualified",
            reward: 3,
            at: Date.now() - 86400000 * 7,
          },
        ]}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={(amount, reference) => {
          console.log(`Withdrawal successful: GH₵${amount}, Ref: ${reference}`);
        }}
        commissionBalance={commissionBalance}
      />

      {/* Agent Failed Beneficiary */}
      <AgentFailedBeneficiary />
    </div>
  );
};
