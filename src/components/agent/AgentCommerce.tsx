import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Send,
  ShieldCheck,
  Clock,
  Sparkles,
  Sliders,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  AgentStoreConfig,
  DataBundle,
  Order,
  Transaction,
  TelecomNetwork,
} from "../../types";
import { VerificationScreen } from "./VerificationScreen";
import { AgentOrdersView } from "./AgentOrdersView";
import { AgentBulkSms } from "./AgentBulkSms";
import { AgentAnalyticsEarnings } from "./AgentAnalyticsEarnings";
import { AgentTransactionsWallet } from "./AgentTransactionsWallet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface AgentCommerceProps {
  view:
    | "store-orders"
    | "pricing"
    | "analytics"
    | "earnings"
    | "bulk-sms"
    | "withdraw"
    | "wallet"
    | "transactions"
    | "verify";
  storeConfig: AgentStoreConfig;
  bundles: DataBundle[];
  orders: Order[];
  commissionBalance: number;
  walletBalance?: number;
  transactions?: Transaction[];
  onOpenFundWallet?: () => void;
  onWithdrawSuccess: (amount: number, reference: string) => void;
  onUpdateBundlePrice?: (bundleId: string, customPrice: number) => void;
  onUpdateOrders?: (orders: Order[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AgentCommerce: React.FC<AgentCommerceProps> = ({
  view,
  storeConfig,
  bundles,
  orders,
  commissionBalance,
  walletBalance = 395.5,
  transactions = [],
  onOpenFundWallet = () => {},
  onWithdrawSuccess,
  onUpdateBundlePrice,
  onUpdateOrders,
  onNavigateTab,
}) => {
  // Pricing State
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      bundles.forEach((b) => {
        initial[b.id] = Number(
          (
            b.wholesalePrice *
            (1 + storeConfig.marginMarkupPercent / 100)
          ).toFixed(2)
        );
      });
      return initial;
    }
  );

  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomPrices((prev) => ({ ...prev, [id]: num }));
    if (onUpdateBundlePrice) {
      onUpdateBundlePrice(id, num);
    }
  };

  return (
    <div>
      {/* VERIFICATION SCREEN */}
      {view === "verify" && <VerificationScreen />}

      {/* STORE ORDERS VIEW */}
      {view === "store-orders" && (
        <AgentOrdersView
          orders={orders}
          storeConfig={storeConfig}
          onUpdateOrders={onUpdateOrders}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: WHOLESALE VS RETAIL PRICING & MARGINS */}
      {view === "pricing" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <DollarSign className="size-6 text-primary" />
                <span>Wholesale vs. Retail Pricing Editor</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure custom storefront retail prices. Every sale automatically credits the net margin difference to your earnings.
              </p>
            </div>
            {onNavigateTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("analytics")}
                className="h-9 gap-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <TrendingUp className="size-3.5 text-emerald-600" />
                <span>View Analytics</span>
              </Button>
            )}
          </div>

          <Card className="rounded-3xl border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground">
                Data Bundle Wholesale Margins
              </CardTitle>
              <CardDescription className="text-xs">
                Prices update in real time on your public storefront URL
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Network &amp; Bundle Size</th>
                      <th className="py-3 px-3 text-right">Wholesale Cost (SDH)</th>
                      <th className="py-3 px-3 text-right">Recommended Retail</th>
                      <th className="py-3 px-3 text-right">Your Store Price</th>
                      <th className="py-3 px-4 text-right">Profit / Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bundles.map((b) => {
                      const price = customPrices[b.id] ?? b.retailPrice;
                      const profit = Math.max(0, price - b.wholesalePrice);
                      const marginPercent = b.wholesalePrice > 0
                        ? ((profit / b.wholesalePrice) * 100).toFixed(1)
                        : "0.0";

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  b.network === "MTN"
                                    ? "bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-400/40"
                                    : b.network === "Telecel"
                                    ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                                    : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40"
                                }`}
                              >
                                {b.network}
                              </Badge>
                              <span>
                                {b.name} ({b.validity})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-muted-foreground font-semibold tabular-nums">
                            GH₵ {b.wholesalePrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-muted-foreground font-semibold tabular-nums">
                            GH₵ {b.retailPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <span className="text-[11px] font-bold text-muted-foreground">GH₵</span>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={price}
                                onChange={(e) =>
                                  handlePriceChange(b.id, e.target.value)
                                }
                                className="w-24 h-8 px-2 rounded-lg text-right text-xs font-bold tabular-nums"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +GH₵ {profit.toFixed(2)}{" "}
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              ({marginPercent}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONSOLIDATED VIEW: ANALYTICS & EARNINGS */}
      {(view === "analytics" || view === "earnings") && (
        <AgentAnalyticsEarnings
          orders={orders}
          bundles={bundles}
          commissionBalance={commissionBalance}
          onWithdrawSuccess={onWithdrawSuccess}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* CONSOLIDATED VIEW: TRANSACTIONS, WALLET & WITHDRAWALS */}
      {(view === "transactions" || view === "wallet" || view === "withdraw") && (
        <AgentTransactionsWallet
          walletBalance={walletBalance}
          commissionBalance={commissionBalance}
          transactions={transactions}
          onOpenFundWallet={onOpenFundWallet}
          onWithdrawSuccess={onWithdrawSuccess}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: BULK SMS CAMPAIGNS */}
      {view === "bulk-sms" && <AgentBulkSms />}
    </div>
  );
};
