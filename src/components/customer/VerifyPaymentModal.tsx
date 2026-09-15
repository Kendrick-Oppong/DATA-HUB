import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ExternalLink,
  CreditCard,
  Phone,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
import { Order } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface VerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentVerified: (orderId: string, paystackRef: string) => void;
}

export const VerifyPaymentModal: React.FC<VerifyPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentVerified,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifiedRef, setVerifiedRef] = useState<string>("");

  if (!order) return null;

  const defaultPaystackRef =
    order.paystackReference ||
    `pstk_${order.reference.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`;

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate real Paystack gateway verification
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      setVerifiedRef(defaultPaystackRef);
      onPaymentVerified(order.id, defaultPaystackRef);
    }, 1200);
  };

  const handleClose = () => {
    if (!isVerifying) {
      onClose();
      // Reset state after dialog animation
      setTimeout(() => {
        setIsSuccess(false);
        setIsVerifying(false);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative shrink-0 border-b border-border bg-gradient-to-br from-emerald-500/15 via-card to-teal-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-emerald-500/10" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-teal-500/10" />

          <div className="relative flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <ShieldCheck className="size-6" />
            </div>

            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-extrabold tracking-tight text-foreground">
                Verify Paystack Payment
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs font-semibold text-muted-foreground">
                Order #{order.reference} · Paystack Gateway Status
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 p-5 sm:p-6">
          {!isSuccess ? (
            <>
              {/* Paystack Pending Info Notice */}
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">Pending Paystack Checkout</p>
                  <p className="text-[11px] text-muted-foreground">
                    This order is awaiting payment confirmation. If the customer
                    completed the Mobile Money prompt or Card debit on Paystack,
                    click verify below to validate the transaction reference and
                    initiate instant delivery.
                  </p>
                </div>
              </div>

              {/* Order Breakdown Box */}
              <div className="space-y-2.5 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-extrabold text-foreground">
                    {order.productName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Recipient Number</span>
                  <span className="font-mono font-bold text-foreground">
                    {order.recipientPhone} ({order.network})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Payment Gateway</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <span>Paystack Mobile Money / Card</span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
                  <span className="text-muted-foreground">Amount to Verify</span>
                  <span className="text-base font-black tabular-nums text-foreground">
                    GH₵ {order.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Gateway Transaction Reference Preview */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Paystack Reference
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground">
                    {defaultPaystackRef}
                  </span>
                </div>
              </div>

              {/* Verification Actions */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isVerifying}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Checking Paystack Gateway...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1.5 size-4" />
                      Verify Payment Now
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Success View */
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-sm animate-in zoom-in-95">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground">
                  Payment Verified Successfully!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transaction confirmed via Paystack. Order has been upgraded to{" "}
                  <strong className="text-amber-600 dark:text-amber-400">Processing</strong>{" "}
                  and sent for network dispatch.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified Reference</span>
                  <span className="font-mono font-bold text-foreground">
                    {verifiedRef}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gateway Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <Check className="size-3" />
                    Confirmed (200 OK)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated Order Status</span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                    Processing
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleClose}
                  className="w-full rounded-xl bg-primary text-xs font-bold"
                >
                  Done & View Order
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
