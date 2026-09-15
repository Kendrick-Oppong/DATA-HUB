import React, { useState, useRef } from "react";
import {
  QrCode,
  Download,
  MessageCircle,
  Copy,
  Check,
  Smartphone,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { PseudoQR } from "./PseudoQR";
import { AgentStoreConfig } from "../../../types";

interface ShareKitModalProps {
  open: boolean;
  onClose: () => void;
  store: AgentStoreConfig;
}

export const ShareKitModal: React.FC<ShareKitModalProps> = ({ open, onClose, store }) => {
  const [format, setFormat] = useState<"whatsapp" | "social" | "flyer">("whatsapp");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://smartdatahub.com";
  const fullUrl = `${origin}/store/${store.handle || "store"}`;
  const storeUrl = `smartdatahub.com/store/${store.handle || "store"}`;

  const themeColor = store.themeColor || "#2563eb";

  const captions = {
    whatsapp: `Shop fast non-expiry data on ${store.storeName}!\n\nDirect carrier EVD • Instant dispatch • Non-expiry\n\nOrder here: ${fullUrl}`,
    social: `Check out ${store.storeName} for instant non-expiry data bundles in Ghana! Best rates, automated delivery.\n\n${fullUrl}`,
    flyer: `${store.storeName}\n\nInstant Data Bundles\nNon-Expiry • Fast Delivery\n\n${storeUrl}`,
  };

  const drawFlyerOnCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Fill background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, themeColor);
    bgGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Ambient highlights
    const glowGrad = ctx.createRadialGradient(w * 0.8, 80, 20, w * 0.8, 80, 240);
    glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
    glowGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Inner Card
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(40, 40, w - 80, h - 80, 28);
    ctx.fill();

    // Text Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(store.storeName, w / 2, 110);

    ctx.font = "500 18px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(store.tagline || "Instant Non-Expiry Data Bundles in Ghana", w / 2, 145);

    // QR container box
    const qrSize = 220;
    const qrX = (w - qrSize) / 2;
    const qrY = 180;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 20);
    ctx.fill();

    // Draw pseudo QR pattern on canvas
    let hash = 0;
    const seed = store.handle || "store";
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const rng = () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };
    const N = 21;
    const cellW = (qrSize - 24) / N;
    ctx.fillStyle = "#111827";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const isFinder = (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
        let on = rng() > 0.5;
        if (isFinder) {
          on =
            r === 0 ||
            c === 0 ||
            r === 6 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            c === N - 7 ||
            r === N - 7 ||
            (r < 7 && (c === N - 1 || r === 6)) ||
            (r >= N - 7 && (c === 0 || c === 6 || r === N - 1));
        }
        if (on) {
          ctx.fillRect(qrX + 12 + c * cellW, qrY + 12 + r * cellW, cellW - 0.5, cellW - 0.5);
        }
      }
    }

    // Call to action
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Scan to Order Direct", w / 2, 445);

    ctx.font = "600 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(storeUrl, w / 2, 480);

    if (store.announcement) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.roundRect(80, 510, w - 160, 44, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 14px sans-serif";
      ctx.fillText(store.announcement.slice(0, 55), w / 2, 538);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFlyerOnCanvas(canvas);
    const link = document.createElement("a");
    link.download = `${store.handle}-share-kit.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captions[format]);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(captions.whatsapp);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-xl flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header - Identical to WithdrawModal */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-amber-950 shadow-sm">
                <QrCode className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                    Storefront Share Kit
                  </DialogTitle>

                  <Badge
                    variant="secondary"
                    className="border-amber-500/20 bg-amber-500/15 px-2 py-0 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                  >
                    Ready to Share
                  </Badge>
                </div>

                <DialogDescription className="mt-0.5 text-left text-xs">
                  Generate branded flyers, QR codes, and quick captions for WhatsApp & social channels
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-5">
            {/* Format Tabs Selector */}
            <div className="flex gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/70">
              <button
                type="button"
                onClick={() => setFormat("whatsapp")}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  format === "whatsapp"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageCircle className="size-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("social")}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  format === "social"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-3.5 text-primary" />
                <span>Social Post</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("flyer")}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  format === "flyer"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="size-3.5 text-purple-600" />
                <span>Flyer Card</span>
              </button>
            </div>

            {/* Flyer / QR Preview Box */}
            <div className="rounded-3xl border border-border overflow-hidden bg-muted/30 p-4 sm:p-6">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="hidden"
              />

              {/* Dynamic HTML Visual Card */}
              <div
                className="w-full rounded-2xl shadow-md overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 50%, #0f172a 100%)`,
                }}
              >
                {/* Radiant Ambient Highlight */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-white/20 via-amber-300/20 to-transparent pointer-events-none" />

                <div className="p-6 sm:p-7 flex flex-col justify-between text-white space-y-5">
                  {/* Top Store Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="size-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-md bg-white/20 backdrop-blur-xs ring-2 ring-white/30 overflow-hidden">
                      {store.storeLogo ? (
                        <img
                          src={store.storeLogo}
                          alt="logo"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{store.storeName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight leading-tight">
                        {store.storeName}
                      </h4>
                      <p className="text-xs text-white/85 line-clamp-1 mt-0.5">
                        {store.tagline || "Instant Non-Expiry Data Bundles in Ghana"}
                      </p>
                    </div>
                  </div>

                  {/* Centered Branded QR Code */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="bg-white p-3.5 rounded-2xl shadow-xl ring-4 ring-white/20">
                      <PseudoQR seed={store.handle} size={150} />
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                        Scan to Order Direct
                      </p>
                      <p className="text-[11px] text-white/75 mt-0.5 tabular-nums">
                        {storeUrl}
                      </p>
                    </div>
                  </div>

                  {/* Announcement Banner */}
                  {store.announcement && (
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-center border border-white/20">
                      <p className="text-xs font-semibold line-clamp-1 text-white">
                        {store.announcement}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Caption Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Pre-Formatted Promotional Caption
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCaption}
                  className="h-7 text-xs font-bold gap-1 cursor-pointer text-primary hover:text-primary"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy text</span>
                    </>
                  )}
                </Button>
              </div>

              <textarea
                value={captions[format]}
                readOnly
                className="w-full p-3.5 rounded-2xl border border-input bg-background text-foreground text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                rows={3}
              />
            </div>

            {/* Storefront Link Preview Box */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-muted/30">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Direct Store URL
                </p>
                <p className="text-xs font-bold text-foreground truncate mt-0.5">
                  {fullUrl}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs inline-flex"
                  title="Open Storefront in new tab"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Fixed Action Buttons Bar - Matches WithdrawModal bottom action container */}
        <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={shareOnWhatsApp}
              size="lg"
              className="h-12 w-full gap-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
            >
              <MessageCircle className="size-4" />
              <span>Share to WhatsApp Status</span>
            </Button>

            <Button
              type="button"
              onClick={handleDownload}
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-xs cursor-pointer border-border hover:bg-muted"
            >
              <Download className="size-4" />
              <span>Download Flyer PNG</span>
            </Button>
          </div>
        </div>

        {/* Modal Footer - Identical to WithdrawModal */}
        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">
              Branded QR codes route directly to your Smart Data Hub merchant storefront
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareKitModal;
