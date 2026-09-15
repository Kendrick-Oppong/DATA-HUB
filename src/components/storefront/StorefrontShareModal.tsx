import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  ExternalLink,
  Tag,
  Sparkles,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AgentStoreConfig } from "../../types";
import { PseudoQR } from "../agent/store-builder/PseudoQR";

interface StorefrontShareModalProps {
  open: boolean;
  onClose: () => void;
  store: AgentStoreConfig;
}

export const StorefrontShareModal: React.FC<StorefrontShareModalProps> = ({
  open,
  onClose,
  store,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://smartdatahub.com";
  const sharePath = `/store/${store.handle || "store"}`;
  const fullUrl = `${origin}${sharePath}`;

  const shareText = `Buy instant non-expiry data on ${store.storeName}! Direct carrier EVD on MTN, Telecel & AT. Order online here: ${fullUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: store.storeName,
          text: `Buy instant non-expiry data on ${store.storeName}`,
          url: fullUrl,
        });
      } catch {
        // user dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const openWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const activePromoCodes = store.promoCodes?.filter((p) => p.active) || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/80 bg-card rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-amber-500/15 via-primary/10 to-transparent border-b border-border/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
              style={{ background: store.themeColor || "#2563eb" }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Share {store.storeName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Share this storefront link or QR code with customers and friends.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Direct Store URL Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Storefront URL</span>
              <span className="text-[10px] text-muted-foreground">Always Live</span>
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border">
              <span className="text-xs font-semibold text-foreground px-2 truncate flex-1 tabular-nums">
                {fullUrl}
              </span>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="h-8 px-3 rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                style={{ background: store.themeColor || undefined }}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-4 rounded-2xl border border-border/80 bg-background/50 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2.5 bg-white rounded-xl shadow-xs border border-border shrink-0">
              <PseudoQR
                seed={fullUrl}
                size={110}
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-foreground">
                <QrCode className="w-4 h-4 text-primary" />
                <span>Instant Mobile Scan</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Customers can point their phone camera at this QR code to open {store.storeName} and order data instantly.
              </p>
              <Badge variant="outline" className="text-[10px] font-semibold border-border">
                <Smartphone className="w-3 h-3 mr-1 text-emerald-500" />
                Works with any smartphone camera
              </Badge>
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={openWhatsApp}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleNativeShare}
              className="w-full h-10 rounded-xl border-border hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-primary" />
              <span>Share via Device</span>
            </Button>
          </div>

          {/* Active Promo Codes Shoutout if available */}
          {activePromoCodes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Customer Promo Codes Available</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                Tell your customers to use code{" "}
                <strong className="font-black underline">
                  {activePromoCodes[0].code}
                </strong>{" "}
                at checkout for {activePromoCodes[0].discountPercent}% off!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
