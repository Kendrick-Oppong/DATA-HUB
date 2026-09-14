import React from "react";
import { Coins, TrendingUp, Gift, Users, Clock, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  const storeProfitPct = totalScore > 0 ? Math.round((storeProfit / totalScore) * 100) : 0;
  const commissionPct = totalScore > 0 ? Math.round((commission / totalScore) * 100) : 0;
  const referralsPct = totalScore > 0 ? Math.round((referrals / totalScore) * 100) : 0;

  const formatCurrency = (val: number) => `GH₵ ${val.toFixed(2)}`;

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-extrabold text-foreground">
          Tier Progress
        </CardTitle>
        {nextTier ? (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            Next: {nextTier} {Math.round(tierRate * 100)}%
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
            Top tier
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tier & Rate */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-base text-foreground">{currentTier}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round(tierRate * 100)}% of the margin on each order
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs font-semibold">
            <span>{formatCurrency(currentScore)} this month</span>
            <span className="text-muted-foreground">
              {nextTier ? `Goal ${formatCurrency(goalScore)}` : "Top tier"}
            </span>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-foreground">Store profit</span>
              <span className="ml-auto font-mono text-xs font-semibold text-foreground">
                {formatCurrency(storeProfit)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${storeProfitPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Commission</span>
              <span className="ml-auto font-mono text-xs font-semibold text-foreground">
                {formatCurrency(commission)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${commissionPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-semibold text-foreground">Referrals</span>
              <span className="ml-auto font-mono text-xs font-semibold text-foreground">
                {formatCurrency(referrals)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full"
                style={{ width: `${referralsPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 pt-3 border-t border-border">
          <div>
            <div className="font-semibold text-base text-foreground">{customers}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">customers</div>
          </div>
          <div>
            <div className="font-semibold text-base text-foreground">{referralCount}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">referrals</div>
          </div>
          <div>
            <div className="font-semibold text-base text-emerald-600 dark:text-emerald-400">
              {deliveredPercent}
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground">delivered</div>
          </div>
        </div>

        {/* Referral Ceiling Note */}
        {referralsExcluded > 0 && (
          <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              {formatCurrency(referralsExcluded)} of referral earnings isn't counting
              toward your tier yet — at least 70% of tier progress has to come from real
              sales. Sell more and it starts counting.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
