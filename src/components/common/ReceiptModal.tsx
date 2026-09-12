import React from "react";
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Order } from "../../types";
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

  if (!isOpen || !order) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(order.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Smart Data Hub Receipt\nRef: ${order.reference}\nItem: ${order.productName}\nBeneficiary: ${order.recipientPhone}\nAmount: GH₵${order.amount.toFixed(2)}\nStatus: ${order.status.toUpperCase()}\nTrack at: https://smartdatahub.com/#track`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Header */}
        <div className="p-6 bg-muted/40 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              SDH
            </div>
            <div>
              <h3 className="font-bold text-foreground tracking-tight">
                Smart Data Hub
              </h3>
              <p className="text-xs text-muted-foreground">
                Digital Services Delivery Receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5">
          {/* Status & Amount Hero */}
          <div className="text-center py-2 border-b border-border/80 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-2xl font-black text-foreground tracking-tight tabular-nums">
              GH₵ {order.amount.toFixed(2)}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {order.status === "delivered"
                  ? "Delivery Successful"
                  : "Processing Order"}
              </span>
              <SignalRail
                status={
                  order.status === "delivered" ? "delivered" : "processing"
                }
                size="sm"
              />
            </div>
          </div>

          {/* Key-Value Details */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Order Reference:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-foreground">
                  {order.reference}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground print:hidden"
                  title="Copy reference"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="text-foreground font-medium tabular-nums">
                {order.date}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Service Item:</span>
              <span className="font-semibold text-foreground">
                {order.productName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Network Provider:</span>
              <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-muted text-foreground border border-border">
                {order.network} Ghana
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">
                Beneficiary Handset:
              </span>
              <span className="font-mono font-medium text-foreground">
                {order.recipientPhone}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Payment Channel:</span>
              <span className="text-foreground capitalize">
                {order.paymentMethod.replace("_", " ")}
              </span>
            </div>

            {/* Voucher Reveal if applicable */}
            {order.voucherCode && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 my-2">
                <div className="flex justify-between text-[11px] text-amber-900 dark:text-amber-300 font-semibold">
                  <span>VOUCHER SERIAL:</span>
                  <span className="font-mono">{order.voucherSerial}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-900 dark:text-amber-300 font-semibold">
                  <span>VOUCHER PIN / CODE:</span>
                  <span className="font-mono text-sm tracking-wider font-bold">
                    {order.voucherCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Upstream Dispatch Timeline */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Delivery Signal Timeline
            </div>
            <div className="space-y-1.5">
              {order.deliveryTimeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-foreground">{item.step}</span>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
