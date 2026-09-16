import React from "react";
import { Info, Layers } from "lucide-react";

interface TierProgressCardProps {
  currentTier: string;
  tierRate: number;
  nextTier?: string;
  progressPercent: number;
  currentScore: number;
  goalScore: number;
  storeProfit: number;
  commission: number;
  referrals: number;
  referralsExcluded: number;
  customers: number;
  referralCount: number;
  deliveredPercent: string;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({
  currentTier,
  tierRate,
  nextTier,
  progressPercent,
  currentScore,
  goalScore,
  storeProfit,
  commission,
  referrals,
  referralsExcluded,
  customers,
  referralCount,
  deliveredPercent,
}) => {
  const totalScore = storeProfit + commission + referrals;
  const storeProfitPct =
    totalScore > 0 ? Math.round((storeProfit / totalScore) * 100) : 0;
  const commissionPct =
    totalScore > 0 ? Math.round((commission / totalScore) * 100) : 0;
  const referralsPct =
    totalScore > 0 ? Math.round((referrals / totalScore) * 100) : 0;

  const formatCurrency = (val: number) => `GH₵ ${val.toFixed(2)}`;

  return (
    <div className="flex flex-col justify-between rounded-2xl  shadow-xs">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
          <Layers className="size-4" />
          Tier Progress & Rewards
        </h3>

        {/* Current Tier Info */}
        <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/80">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-base text-foreground">
              {currentTier}
            </div>
            {nextTier ? (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                Next: {nextTier} {Math.round(tierRate * 100)}%
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                Top tier
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round(tierRate * 100)}% of the margin on each order
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
              Current Score
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className="h-full rounded-lg bg-primary/75 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-bold text-foreground">
              {formatCurrency(currentScore)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
              Goal Score
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className="h-full rounded-lg bg-muted/60 transition-all duration-700"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-bold text-muted-foreground">
              {formatCurrency(goalScore)}
            </span>
          </div>
        </div>

        {/* Earnings Breakdown - Horizontal Bars */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
              Store profit
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className="h-full rounded-lg bg-emerald-600 transition-all duration-700"
                  style={{ width: `${storeProfitPct}%` }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(storeProfit)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
              Commission
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className="h-full rounded-lg bg-primary transition-all duration-700"
                  style={{ width: `${commissionPct}%` }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-bold text-primary">
              {formatCurrency(commission)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground">
              Referrals
            </span>
            <div className="relative flex-1">
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted/40">
                <div
                  className="h-full rounded-lg bg-teal-600 transition-all duration-700"
                  style={{ width: `${referralsPct}%` }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[10px] font-bold text-teal-600">
              {formatCurrency(referrals)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-6 pt-4 border-t border-border">
        <div>
          <div className="font-semibold text-base text-foreground">
            {customers}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground">
            customers
          </div>
        </div>
        <div>
          <div className="font-semibold text-base text-foreground">
            {referralCount}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground">
            referrals
          </div>
        </div>
        <div>
          <div className="font-semibold text-base text-emerald-600 dark:text-emerald-400">
            {deliveredPercent}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground">
            delivered
          </div>
        </div>
      </div>

      {/* Referral Ceiling Note */}
      {referralsExcluded > 0 && (
        <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {formatCurrency(referralsExcluded)} of referral earnings isn't
            counting toward your tier yet — at least 70% of tier progress has to
            come from real sales. Sell more and it starts counting.
          </span>
        </div>
      )}
    </div>
  );
};
