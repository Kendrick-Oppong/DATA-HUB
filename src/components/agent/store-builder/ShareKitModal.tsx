import React, { useState, useRef } from "react";
import { X, Download, MessageCircle, Copy, Smartphone, Image as ImageIcon } from "lucide-react";
import { PseudoQR } from "./PseudoQR";
import { AgentStoreConfig } from "../../../types";

interface ShareKitModalProps {
  open: boolean;
  onClose: () => void;
  store: AgentStoreConfig;
}

export const ShareKitModal: React.FC<ShareKitModalProps> = ({ open, onClose, store }) => {
  const [format, setFormat] = useState<"whatsapp" | "social" | "flyer">("whatsapp");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeUrl = `smartdatahub.com/store/${store.handle}`;
  const fullUrl = `https://${storeUrl}`;

  const captions = {
    whatsapp: `🔥 Shop fast data on ${store.storeName}!\n\nNon-expiry bundles • Instant delivery\n\n👉 ${fullUrl}`,
    social: `Check out ${store.storeName} for instant non-expiry data bundles! Fast delivery, great prices.\n\n${fullUrl}`,
    flyer: `${store.storeName}\n\nInstant Data Bundles\nNon-Expiry • Fast Delivery\n\n${storeUrl}`,
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${store.handle}-share-kit.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captions[format]);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(captions.whatsapp);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-extrabold text-foreground">Share kit</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setFormat("whatsapp")}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                format === "whatsapp"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp status</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("social")}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                format === "social"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Social post</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat("flyer")}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                format === "flyer"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Printable flyer</span>
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-border overflow-hidden bg-muted/30 p-8">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-auto rounded-xl shadow-lg"
              style={{ display: "none" }}
            />
            
            {/* HTML Preview */}
            <div
              className="w-full aspect-[4/3] rounded-xl shadow-lg overflow-hidden"
              style={{ background: store.themeColor }}
            >
              <div className="p-8 h-full flex flex-col justify-between text-white">
                {/* Top */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    {store.storeLogo ? (
                      <img src={store.storeLogo} alt="logo" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      store.storeName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{store.storeName}</h2>
                    <p className="text-sm opacity-90">{store.tagline || "Instant Data Bundles"}</p>
                  </div>
                </div>

                {/* Middle - QR Code */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-2xl">
                    <PseudoQR seed={store.handle} size={200} />
                  </div>
                </div>

                {/* Bottom */}
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium opacity-90">Scan to shop</p>
                    <p className="text-xs opacity-75">{storeUrl}</p>
                  </div>
                  {store.announcement && (
                    <div className="p-3 rounded-xl bg-white/20 text-center">
                      <p className="text-sm font-bold">{store.announcement}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Caption</label>
            <textarea
              value={captions[format]}
              readOnly
              className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs font-mono resize-none"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-3 rounded-xl bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCaption}
              className="px-4 py-3 rounded-xl bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy caption</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-xl bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
