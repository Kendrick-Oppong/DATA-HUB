import React from 'react';
import {
  Wallet,
  Wifi,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Order, Transaction, TelecomNetwork } from '../../types';
import { SignalRail } from '../common/SignalRail';

interface CustomerDashboardProps {
  walletBalance: number;
  onOpenFundWallet: () => void;
  onNavigateTab: (tab: string) => void;
  orders: Order[];
  transactions: Transaction[];
  onOpenReceipt: (order: Order) => void;
  onRepeatOrder: (order: Order) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  walletBalance,
  onOpenFundWallet,
  onNavigateTab,
  orders,
  transactions,
  onOpenReceipt,
  onRepeatOrder,
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'processing');
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border border-border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-primary tracking-wider">Customer Portal</span>
            <SignalRail status="online" size="sm" label="Carrier Gateways 99.8%" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Akwaaba, Kojo!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Buy data, airtime, and WAEC vouchers with confidence and instant delivery.
          </p>
        </div>

        {/* Wallet Balance Hero Card */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Available Balance
            </span>
            <span className="text-2xl font-black text-foreground tabular-nums">
              GH₵ {walletBalance.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onOpenFundWallet}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            + Top-up
          </button>
        </div>
      </div>

      {/* Pending Dispatch Warning (if any) */}
      {pendingOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <SignalRail status="processing" size="sm" />
            <div>
              <span className="font-bold">Active Delivery: </span>
              <span>
                Order {pendingOrders[0].reference} ({pendingOrders[0].productName}) is in active upstream queue.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-amber-800 dark:text-amber-300 font-bold hover:underline"
          >
            Track →
          </button>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateTab('buy-data')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Wifi className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Buy Data</div>
          <div className="text-[10px] text-muted-foreground">MTN, Telecel, AT</div>
        </button>

        <button
          onClick={() => onNavigateTab('buy-airtime')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Buy Airtime</div>
          <div className="text-[10px] text-muted-foreground">Instant E-Load</div>
        </button>

        <button
          onClick={() => onNavigateTab('results-checker')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Result Checkers</div>
          <div className="text-[10px] text-muted-foreground">WAEC & BECE PIN</div>
        </button>

        <button
          onClick={() => onNavigateTab('afa')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">AFA Registration</div>
          <div className="text-[10px] text-muted-foreground">Discount Tariffs</div>
        </button>

        <button
          onClick={() => onNavigateTab('utilities')}
          className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div className="font-bold text-xs text-foreground">Pay Bills</div>
          <div className="text-[10px] text-muted-foreground">ECG, Water, TV</div>
        </button>
      </div>

      {/* Recent Orders with Delivery Timeline */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <div>
            <h2 className="font-extrabold text-base text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">Click any record to inspect the delivery signal or print receipt.</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  order.network === 'MTN'
                    ? 'bg-amber-400 text-amber-950'
                    : order.network === 'Telecel'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {order.network.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-foreground truncate">{order.productName}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="font-mono">{order.recipientPhone}</span>
                    <span>•</span>
                    <span className="tabular-nums">{order.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-xs font-black text-foreground tabular-nums">GH₵ {order.amount.toFixed(2)}</div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-300'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                    <SignalRail status={order.status === 'delivered' ? 'delivered' : 'processing'} size="sm" />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenReceipt(order)}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    Receipt
                  </button>
                  <button
                    onClick={() => onRepeatOrder(order)}
                    title="Repeat this purchase"
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
