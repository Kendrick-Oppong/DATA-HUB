import React, { useState } from "react";
import { Gift, Copy, Clock, CheckCircle2, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface ReferralUser {
  id: string;
  name: string;
  status: "qualified" | "pending";
  reward: number;
  at: number;
}

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
  referralCode: string;
  reward: number;
  referredReward: number;
  referrals: ReferralUser[];
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  open,
  onClose,
  referralCode,
  reward,
  referredReward,
  referrals,
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

  const handleWhatsAppShare = () => {
    const message = `Join Smart Data Hub with my link — you get GH₵${referredReward.toFixed(2)} off your first order: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const formatCurrency = (val: number) => `GH₵ ${val.toFixed(2)}`;
  const formatAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Gift className="size-5" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                Refer & Earn
              </DialogTitle>

              <DialogDescription className="mt-0.5 text-left text-xs">
                Share your link and earn commission on every referral
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
          <div className="p-5 pb-0 space-y-3 shrink-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share your link. When their first order is delivered you get{" "}
              {formatCurrency(reward)} credit and they get{" "}
              {formatCurrency(referredReward)} towards their next order. Credit
              is spendable on anything on the platform, expires after 60 days,
              and can't be withdrawn.
            </p>

            {/* Referral Link Box */}
            <div className="flex items-center gap-2 p-3 rounded-full bg-muted border border-border">
              <span className="text-xs font-semibold text-foreground flex-1 truncate">
                {link}
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

            {/* WhatsApp Share */}
            <Button
              onClick={handleWhatsAppShare}
              disabled={!referralCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share on WhatsApp
            </Button>

            <Separator />

            {/* Referred Users List Header */}
            <h3 className="text-sm font-bold text-foreground">
              Who joined with your code
            </h3>
          </div>

          {/* Scrollable Referrals List */}
          <ScrollArea className="min-h-0 flex-1 overflow-hidden px-5 sm:px-6 pb-5 sm:pb-6">
            {referrals.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No one yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Share your link — everyone who signs up with it shows up
                    here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 mt-3">
                {referrals.map((user) => (
                  <Card key={user.id} className="border-border p-2 mx-1">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0">
                          {user.status === "qualified" ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground">
                            {user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.status === "qualified"
                              ? `Delivered · you earned ${formatCurrency(user.reward)}`
                              : "Signed up · waiting for their first delivery"}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatAgo(user.at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
          <Button
            onClick={onClose}
            size="lg"
            className="h-10 w-full  cursor-pointer text-sm font-bold shadow-sm"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
