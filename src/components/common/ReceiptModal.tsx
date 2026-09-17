import React from "react";
import {
  Printer,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  CreditCard,
  PackageCheck,
  Clock3,
  ShieldCheck,
  Share2,
  ReceiptText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Order } from "../../types";
import { getLogoFromDOM } from "../../lib/themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { SignalRail } from "./SignalRail";

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRef = async () => {
    if (!order) return;

    try {
      await navigator.clipboard.writeText(order.reference);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!order) return;

    const text = encodeURIComponent(
      `Smart Data Hub Receipt\n\nRef: ${order.reference}\nItem: ${order.productName}\nBeneficiary: ${order.recipientPhone}\nAmount: GH₵${order.amount.toFixed(2)}\nStatus: ${order.status.toUpperCase()}\nTrack at: https://smartdatahub.com/#track`,
    );

    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (!order) return null;

  const isDelivered = order.status === "delivered";
  const isProcessing = order.status === "processing";
  const isWaiting = order.status === "waiting";
  const isPending =
    order.status === "pending" || order.status === "pending_payment";

  const statusLabel = isDelivered
    ? "Payment & delivery successful"
    : isProcessing
      ? "Order is being processed"
      : isWaiting
        ? "Queued for network dispatch"
        : isPending
          ? "Awaiting Paystack verification"
          : "Order requires attention";

  const statusClass = isDelivered
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : isProcessing
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : isWaiting
        ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
        : isPending
          ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400";

  const statusDotClass = isDelivered
    ? "bg-emerald-500"
    : isProcessing
      ? "bg-amber-500"
      : isWaiting
        ? "bg-sky-500"
        : isPending
          ? "bg-purple-500"
          : "bg-red-500";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="
      flex
      h-[90vh]
      max-h-[90vh]
      flex-col
      gap-0
      overflow-hidden
      rounded-3xl
      border
      border-border
      bg-card
      p-0
      shadow-2xl
      sm:max-w-2xl
      print:h-auto
      print:max-h-none
      print:overflow-visible
      print:border-none
      print:shadow-none
    "
      >
        {/* Header */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 shrink-0 items-center justify-center p-1  ">
                <img src={getLogoFromDOM()} alt="Smart Data Hub Logo" className="h-9 w-auto object-contain" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                  Smart Data Hub
                </DialogTitle>

                <DialogDescription className="mt-0.5 text-left text-xs">
                  Digital Services Receipt
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable receipt body */}
        <ScrollArea
          className="
        min-h-0
        flex-1
        overflow-hidden
        print:overflow-visible
      "
        >
          <div className="min-w-0 p-5 sm:p-6">
            {/* EVERYTHING FROM YOUR RECEIPT BODY GOES HERE */}

            {/* Success Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="absolute -right-8 -top-8 size-24 rounded-full bg-emerald-500/5" />

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isDelivered ? (
                    <CheckCircle2 className="size-8" />
                  ) : (
                    <Clock3 className="size-7" />
                  )}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {isDelivered ? "Transaction complete" : "Order status"}
                </p>

                <p className="mt-1 text-3xl font-black tracking-tight text-foreground tabular-nums">
                  GH₵ {order.amount.toFixed(2)}
                </p>

                <div
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${statusClass}`}
                >
                  <span className={`size-1.5 rounded-full ${statusDotClass}`} />
                  {statusLabel}
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Order reference
                  </p>

                  <p className="mt-1 truncate  text-sm font-bold tracking-wide text-foreground">
                    {order.reference}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRef}
                  className="h-8 shrink-0 gap-1.5 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Order Details */}
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PackageCheck className="size-3.5" />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Order details
                  </h3>

                  <p className="text-[10px] text-muted-foreground">
                    Service and delivery information
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                <ReceiptRow label="Service" value={order.productName} strong />

                <ReceiptRow
                  label="Network"
                  value={`${order.network} Ghana`}
                  badge
                />

                <ReceiptRow
                  label="Beneficiary"
                  value={order.recipientPhone}
                  mono
                />

                <ReceiptRow label="Date & time" value={order.date} tabular />
              </div>
            </section>

            {/* Payment */}
            <section className="mt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <CreditCard className="size-3.5" />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-foreground">Payment</h3>

                  <p className="text-[10px] text-muted-foreground">
                    Transaction and payment channel
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">
                      Payment channel
                    </p>

                    <p className="mt-1 text-xs font-semibold capitalize text-foreground">
                      {order.paymentMethod.replace("_", " ")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-muted-foreground">
                      Amount paid
                    </p>

                    <p className="mt-1 text-base font-black tabular-nums text-foreground">
                      GH₵ {order.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Voucher */}
            {order.voucherCode && (
              <section className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <ShieldCheck className="size-3.5" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Voucher credentials
                    </h3>

                    <p className="text-[10px] text-muted-foreground">
                      Keep these details secure
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="relative space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Voucher serial
                      </p>

                      <p className="mt-1  text-sm font-bold tracking-wide text-foreground">
                        {order.voucherSerial}
                      </p>
                    </div>

                    <Separator className="bg-amber-500/20" />

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Voucher PIN / code
                      </p>

                      <p className="mt-1 break-all  text-lg font-black tracking-[0.15em] text-foreground">
                        {order.voucherCode}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Delivery Timeline */}
            {(order.deliveryTimeline || []).length > 0 && (
              <section className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="size-3.5" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Delivery timeline
                    </h3>

                    <p className="text-[10px] text-muted-foreground">
                      Upstream delivery activity
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="space-y-1">
                    {(order.deliveryTimeline || []).map((item, idx) => {
                      const isCompleted = item.status === "completed";
                      const isCurrent = item.status === "current";
                      const isPending = item.status === "pending";
                      const isFailed = item.status === "failed";
                      const isLast =
                        idx === (order.deliveryTimeline || []).length - 1;
                      return (
                        <div key={idx} className="flex gap-3">
                          {/* Left: connector + dot */}
                          <div className="flex flex-col items-center shrink-0 w-6">
                            <div
                              className={`relative flex size-6 items-center justify-center rounded-full border-2 shrink-0 transition-all ${isCompleted
                                ? "bg-primary border-primary text-primary-foreground"
                                : isCurrent
                                  ? "bg-background border-primary text-primary"
                                  : isFailed
                                    ? "bg-red-500/10 border-red-500 text-red-500"
                                    : "bg-muted border-border text-muted-foreground"
                                }`}
                            >
                              {isCurrent && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                              )}
                              {isCompleted ? (
                                <Check className="size-3" />
                              ) : isCurrent ? (
                                <span className="size-1.5 rounded-full bg-primary" />
                              ) : isFailed ? (
                                <span className="text-[9px] font-black">✕</span>
                              ) : (
                                <span className="text-[9px] font-black">
                                  {idx + 1}
                                </span>
                              )}
                            </div>
                            {!isLast && (
                              <div
                                className={`w-0.5 flex-1 my-1 min-h-5 ${isCompleted ? "bg-primary" : "bg-border"
                                  }`}
                              />
                            )}
                          </div>
                          {/* Right: content */}
                          <div
                            className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p
                                className={`text-xs font-bold ${isCompleted
                                  ? "text-foreground"
                                  : isCurrent
                                    ? "text-primary"
                                    : isFailed
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                  }`}
                              >
                                {item.step}
                                {isCurrent && (
                                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-600 dark:text-amber-400">
                                    <span className="size-1 rounded-full bg-amber-500 animate-pulse" />
                                    In progress
                                  </span>
                                )}
                              </p>
                              <span
                                className={`text-[9px] font-semibold text-muted-foreground tabular-nums ${isPending ? "italic" : ""
                                  }`}
                              >
                                {item.timestamp}
                              </span>
                            </div>
                            {item.note && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Note */}
            <div className="mt-5 space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Receipt Information
              </span>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

                  <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                    Keep this receipt. Your order reference can be used to track
                    this transaction or request support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer stays fixed */}
        <DialogFooter className="shrink-0 border-t border-border bg-muted/40 p-0 print:hidden">
          <div className="flex items-center gap-2 px-6 py-4 pb-6 w-full">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1 text-xs font-bold gap-1.5 h-9 cursor-pointer"
              >
                Close
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="flex-1 text-xs font-bold gap-1.5 h-9 cursor-pointer"
              >
                <Share2 className="size-3.5" />
                Share
              </Button>

              <Button
                size="sm"
                onClick={handlePrint}
                className="flex-1 text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                <Printer className="size-3.5" />
                Print
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ReceiptRowProps {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
  tabular?: boolean;
  badge?: boolean;
}

const ReceiptRow: React.FC<ReceiptRowProps> = ({
  label,
  value,
  strong,
  mono,
  tabular,
  badge,
}) => {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0  font-medium text-muted-foreground">
        {label}
      </span>

      {badge ? (
        <Badge
          variant="outline"
          className="bg-primary text-[10px] font-semibold"
        >
          {value}
        </Badge>
      ) : (
        <span
          className={[
            "text-right text-xs text-foreground",
            strong ? "font-bold" : "font-medium",
            tabular ? "tabular-nums" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value}
        </span>
      )}
    </div>
  );
};
