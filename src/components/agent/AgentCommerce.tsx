import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Smartphone,
  Check,
  RotateCcw,
  Loader2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Sliders,
  Filter,
  Search,
  MessageSquare,
} from "lucide-react";
import {
  AgentStoreConfig,
  DataBundle,
  Order,
  TelecomNetwork,
} from "../../types";
import { VerificationScreen } from "./VerificationScreen";
import { AgentOrdersView } from "./AgentOrdersView";
import { AgentBulkSms } from "./AgentBulkSms";

interface AgentCommerceProps {
  view:
  | "store-orders"
  | "pricing"
  | "analytics"
  | "bulk-sms"
  | "withdraw"
  | "verify";
  storeConfig: AgentStoreConfig;
  bundles: DataBundle[];
  orders: Order[];
  commissionBalance: number;
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
  onWithdrawSuccess,
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
          ).toFixed(2),
        );
      });
      return initial;
    },
  );

  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomPrices((prev) => ({ ...prev, [id]: num }));
  };

  // Withdraw Commissions State
  const [withdrawAmount, setWithdrawAmount] = useState<string>("50");
  const [momoProvider, setMomoProvider] = useState<"MTN" | "Telecel">("MTN");
  const [momoPhone, setMomoPhone] = useState<string>("0244192834");
  const [momoName, setMomoName] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawSuccessInfo, setWithdrawSuccessInfo] = useState<{
    ref: string;
    amount: number;
  } | null>(null);
  const [withdrawStep, setWithdrawStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount) || 0;
    if (amount <= 0 || amount > commissionBalance) {
      alert(
        "Invalid withdrawal amount. It cannot exceed your available commission balance.",
      );
      return;
    }

    setIsWithdrawing(true);
    // Simulate sending OTP
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawStep(2);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    const amount = parseFloat(withdrawAmount) || 0;
    const ref = `WDR-GH-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(() => {
      setIsVerifyingOtp(false);
      onWithdrawSuccess(amount, ref);
      setWithdrawSuccessInfo({ ref, amount });
      setWithdrawStep(3);
    }, 1500);
  };

  const handleResetWithdrawal = () => {
    setWithdrawStep(1);
    setWithdrawSuccessInfo(null);
    setOtpCode("");
    setWithdrawAmount("50");
  };

  return (
    <div>
      {/* Verification Screen */}
      {view === "verify" && <VerificationScreen />}

      {/* Store Orders View */}
      {view === "store-orders" && (
        <AgentOrdersView
          orders={orders}
          storeConfig={storeConfig}
          onUpdateOrders={onUpdateOrders}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* VIEW: PRICING & MARGINS */}
      {view === "pricing" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-500" />
                <span>Wholesale vs. Retail Pricing Editor</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set custom prices for your storefront customers. You earn the
                difference instantly on each purchase.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                    <th className="pb-2">Network & Size</th>
                    <th className="pb-2 text-right">Wholesale Cost (SDH)</th>
                    <th className="pb-2 text-right">Suggested Retail</th>
                    <th className="pb-2 text-right">Your Store Price (GH₵)</th>
                    <th className="pb-2 text-right">Profit / Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bundles.map((b) => {
                    const price = customPrices[b.id] ?? b.retailPrice;
                    const profit = Math.max(0, price - b.wholesalePrice);
                    const marginPercent = (
                      (profit / b.wholesalePrice) *
                      100
                    ).toFixed(1);

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 font-semibold text-foreground">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${b.network === "MTN"
                                ? "bg-amber-400"
                                : b.network === "Telecel"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                              }`}
                          />
                          {b.name} ({b.validity})
                        </td>
                        <td className="py-3 text-right font-mono text-muted-foreground tabular-nums">
                          GH₵ {b.wholesalePrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono text-muted-foreground tabular-nums">
                          GH₵ {b.retailPrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            step="0.5"
                            value={price}
                            onChange={(e) =>
                              handlePriceChange(b.id, e.target.value)
                            }
                            className="w-24 px-2 py-1 rounded-lg border border-input bg-background text-foreground font-mono text-right text-xs font-bold"
                          />
                        </td>
                        <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +GH₵ {profit.toFixed(2)} ({marginPercent}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SALES ANALYTICS */}
      {view === "analytics" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span>Sales & Performance Analytics</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live metrics on customer volume, bundle popularity, and telecom
              network distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Revenue Trend (SVG Chart) */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground">
                  7-Day Sales Volume (GH₵)
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +24.8% vs last week
                </span>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 px-2">
                {[
                  { day: "Mon", val: 180, profit: 24 },
                  { day: "Tue", val: 240, profit: 36 },
                  { day: "Wed", val: 310, profit: 45 },
                  { day: "Thu", val: 280, profit: 40 },
                  { day: "Fri", val: 450, profit: 68 },
                  { day: "Sat", val: 520, profit: 82 },
                  { day: "Sun", val: 380, profit: 54 },
                ].map((bar, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                      GH₵{bar.val}
                    </span>
                    <div
                      style={{ height: `${(bar.val / 550) * 100}%` }}
                      className="w-full max-w-[36px] bg-primary rounded-t-lg transition-all hover:bg-primary/80 relative group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap transition-opacity pointer-events-none">
                        Profit: GH₵{bar.profit}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Telecom Carrier Share */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground">
                Network Sales Breakdown
              </h3>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-foreground">MTN Ghana (68%)</span>
                    <span className="font-mono text-muted-foreground">
                      GH₵ 2,140.00
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: "68%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-foreground">Telecel Ghana (22%)</span>
                    <span className="font-mono text-muted-foreground">
                      GH₵ 690.00
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: "22%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-foreground">AirtelTigo AT (10%)</span>
                    <span className="font-mono text-muted-foreground">
                      GH₵ 310.00
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: "10%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BULK SMS CAMPAIGNS */}
      {view === "bulk-sms" && <AgentBulkSms />}

      {/* VIEW: WITHDRAW COMMISSIONS */}
      {view === "withdraw" && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-amber-500" />
              <span>Withdraw Commissions to Mobile Money</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Payout is transferred instantly to your MTN MoMo or Telecel Cash
              wallet with 0% fee.
            </p>
          </div>

          {/* Withdrawal Schedule Note */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-xs">
            <p className="font-semibold">Withdrawal Schedule:</p>
            <p className="mt-1">
              Withdrawals are processed instantly during business hours (8 AM -
              8 PM GMT). Requests outside these hours are queued and processed
              at 8 AM the next business day.
            </p>
          </div>

          {/* Step 1: Withdrawal Form */}
          {withdrawStep === 1 && (
            <form
              onSubmit={handleExecuteWithdrawal}
              className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-xs"
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200">
                <span className="text-[10px] uppercase font-bold tracking-wider block">
                  Available to Withdraw
                </span>
                <span className="text-2xl font-black tabular-nums">
                  GH₵ {commissionBalance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Select MoMo Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMomoProvider("MTN")}
                    className={`py-2.5 rounded-xl border font-bold cursor-pointer ${momoProvider === "MTN"
                        ? "bg-amber-400 text-amber-950 border-amber-500"
                        : "bg-muted/40 text-foreground border-border"
                      }`}
                  >
                    MTN Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setMomoProvider("Telecel")}
                    className={`py-2.5 rounded-xl border font-bold cursor-pointer ${momoProvider === "Telecel"
                        ? "bg-red-600 text-white border-red-700"
                        : "bg-muted/40 text-foreground border-border"
                      }`}
                  >
                    Telecel Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Beneficiary Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  required
                  value={momoName}
                  onChange={(e) => setMomoName(e.target.value)}
                  placeholder="Full name on the MoMo account"
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Withdrawal Amount (GH₵)
                </label>
                <input
                  type="number"
                  min="5"
                  max={commissionBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums text-sm font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || commissionBalance < 5}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to OTP Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {withdrawStep === 2 && (
            <form
              onSubmit={handleVerifyOtp}
              className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-xs"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Enter OTP Code
                </h3>
                <p className="text-muted-foreground">
                  A 6-digit code has been sent to your email. Enter it below to
                  confirm your withdrawal of GH₵{" "}
                  {parseFloat(withdrawAmount || "0").toFixed(2)}.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1 text-center">
                  OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className="w-full p-3 rounded-xl border border-input bg-background text-foreground font-mono text-center text-2xl font-bold tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetWithdrawal}
                  className="flex-1 py-3 rounded-xl border border-border bg-muted text-foreground font-bold text-xs hover:bg-muted/80 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Withdrawal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {withdrawStep === 3 && withdrawSuccessInfo && (
            <div className="p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Commission Paid Out!
              </h3>
              <p className="text-xs text-muted-foreground">
                <strong>GH₵ {withdrawSuccessInfo.amount.toFixed(2)}</strong> has
                been transferred to your {momoProvider} wallet (Ref:{" "}
                <strong>{withdrawSuccessInfo.ref}</strong>).
              </p>
              <button
                onClick={handleResetWithdrawal}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
