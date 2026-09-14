import React, { useState } from "react";
import { Gift, Copy, Share2, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface ReferralCardProps {
  referralCode: string;
  signedUp: number;
  qualified: number;
  earned: number;
  pending: number;
  reward: number;
  referredReward: number;
  onOpenModal: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  referralCode,
  signedUp,
  qualified,
  earned,
  pending,
  reward,
  referredReward,
  onOpenModal,
}) => {
  const [copied, setCopied] = useState(false);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://smartdatahubgh.com";
  const link = `${origin}/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number) => `GH₵ ${val.toFixed(2)}`;

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-600" />
          Refer & earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Share your code. Once their{" "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            first order is delivered
          </strong>
          , you get {formatCurrency(reward)} credit and they get{" "}
          {formatCurrency(referredReward)} off their next one.
        </p>

        {/* Referral Code Box */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
          <span className="text-sm font-semibold text-foreground flex-1 truncate">
            {referralCode || "…"}
          </span>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!referralCode}
            className="text-xs font-bold px-3"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between pt-2">
          <div>
            <div className="font-semibold text-xl text-emerald-600 dark:text-emerald-400">
              {signedUp}
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              signed up
            </div>
          </div>
          <div>
            <div className="font-semibold text-xl text-emerald-600 dark:text-emerald-400">
              {qualified}
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              funded
            </div>
          </div>
          <div>
            <div className="font-semibold text-xl text-emerald-600 dark:text-emerald-400">
              {formatCurrency(earned)}
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              earned
            </div>
          </div>
        </div>

        {/* Pending Notice */}
        {pending > 0 && (
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground border-t border-border">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{pending} waiting on their first delivery</span>
          </div>
        )}

        {/* Share Button */}
        <Button
          onClick={onOpenModal}
          variant="outline"
          className="w-full text-xs font-bold"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share & see who joined
        </Button>
      </CardContent>
    </Card>
  );
};
