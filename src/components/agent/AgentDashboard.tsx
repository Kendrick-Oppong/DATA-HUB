import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { AgentStoreConfig, Order } from '../../types';
import { SignalRail } from '../common/SignalRail';

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
  const [copiedLink, setCopiedLink] = useState(false);

  const storeUrl = `smartdatahub.com/store/${storeConfig.handle}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const storeOrders = orders.filter((o) => o.agentMargin !== undefined);
  const totalGmv = storeOrders.reduce((acc, o) => acc + o.amount, 0) + 1480.00;
  const todayProfit = storeOrders.reduce((acc, o) => acc + (o.agentMargin || 0), 0) + 142.50;

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
              Tier 2 Gold Merchant
            </span>
            <SignalRail status="online" size="sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {storeConfig.storeName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your storefront is <strong className="text-emerald-600 dark:text-emerald-400">Live & Selling</strong>. Orders auto-deliver through our core gateway.
          </p>

          {/* Store URL & Share Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono">
              <span className="text-muted-foreground">URL:</span>
              <span className="font-semibold text-foreground">{storeUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onOpenStorefront}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Storefront</span>
            </button>
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
            <span className="text-[11px] text-muted-foreground">MTN & Telecel Cash</span>
          </div>
          <button
            onClick={() => onNavigateTab('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
          >
            Withdraw to MoMo
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Profit</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            +GH₵ {todayProfit.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">From 38 customer orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Sales GMV</span>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            GH₵ {totalGmv.toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">+18.4% vs last month</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Health Score</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">
            96 / 100
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">WhatsApp & Prices verified</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Customers</span>
          <div className="text-2xl font-black text-foreground tabular-nums mt-1">
            145
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Available for Bulk SMS</p>
        </div>
      </div>

      {/* Quick Agent Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('my-store')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Customize Store</div>
          <div className="text-[10px] text-muted-foreground">Brand, colors, margins</div>
        </button>

        <button
          onClick={() => onNavigateTab('pricing')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Set Retail Prices</div>
          <div className="text-[10px] text-muted-foreground">Wholesale vs margins</div>
        </button>

        <button
          onClick={() => onNavigateTab('bulk-sms')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Send Bulk SMS</div>
          <div className="text-[10px] text-muted-foreground">Campaigns to buyers</div>
        </button>

        <button
          onClick={() => onNavigateTab('analytics')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Sales Analytics</div>
          <div className="text-[10px] text-muted-foreground">Charts & insights</div>
        </button>
      </div>

      {/* Recent Storefront Orders */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <div>
            <h2 className="font-extrabold text-base text-foreground">Storefront Customer Orders</h2>
            <p className="text-xs text-muted-foreground">Orders placed by customers through your public link.</p>
          </div>
          <button
            onClick={() => onNavigateTab('store-orders')}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {storeOrders.map((order) => (
            <div
              key={order.id}
              className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-muted/30 px-2 rounded-xl transition-colors text-xs"
            >
              <div>
                <div className="font-bold text-foreground">{order.productName}</div>
                <div className="text-muted-foreground">
                  Ref: <span className="font-mono">{order.reference}</span> • Customer: {order.recipientPhone}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-bold text-foreground tabular-nums">GH₵ {order.amount.toFixed(2)}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    +GH₵ {(order.agentMargin || 0).toFixed(2)} margin
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
