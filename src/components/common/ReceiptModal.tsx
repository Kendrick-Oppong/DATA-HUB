import React from "react";
import { Printer, CheckCircle2, Copy, Check } from "lucide-react";
import { Order } from "../../types";
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

  const handleCopyRef = () => {
    if (order) {
      navigator.clipboard.writeText(order.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (order) {
      const text = encodeURIComponent(
        `Smart Data Hub Receipt\nRef: ${order.reference}\nItem: ${order.productName}\nBeneficiary: ${order.recipientPhone}\nAmount: GH₵${order.amount.toFixed(2)}\nStatus: ${order.status.toUpperCase()}\nTrack at: https://smartdatahub.com/#track`,
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden print:border-none print:shadow-none">
        {/* Receipt Header */}
        <DialogHeader className="p-6 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              SDH
            </div>
            <div className="flex-1">
              <DialogTitle className="font-bold text-foreground tracking-tight text-left">
                Smart Data Hub
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-left">
                Digital Services Delivery Receipt
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
              <Badge variant="outline" className="text-[11px]">
                {order.network} Ghana
              </Badge>
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
                    <p className="text-foreground">{item.step}</p>
                    <p className="text-muted-foreground text-[10px] tabular-nums font-semibold">
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 bg-muted/30 border-t border-border flex-col sm:flex-row gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>
          <Button onClick={onClose} size="sm">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
