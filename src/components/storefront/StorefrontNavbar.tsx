import React, { useState } from "react";
import {
  Share2,
  MessageCircle,
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  Zap,
  Phone,
  Radio,
  ExternalLink,
  Menu,
  X,
  Store,
  Layers,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SignalRail } from "../common/SignalRail";
import { AgentStoreConfig } from "../../types";

interface StorefrontNavbarProps {
  store: AgentStoreConfig;
  onOpenShare: () => void;
  onSwitchToSDH: () => void;
  onScrollToPackages?: () => void;
}

export const StorefrontNavbar: React.FC<StorefrontNavbarProps> = ({
  store,
  onOpenShare,
  onSwitchToSDH,
  onScrollToPackages,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const themeColor = store.themeColor || "#2563eb";
  const isLive = store.status === "published";

  const openWhatsApp = () => {
    const phone = store.whatsappNumber.replace(/^0/, "");
    const text = encodeURIComponent(
      `Hello ${store.storeName}, I am browsing your store and need assistance.`,
    );
    window.open(`https://wa.me/233${phone}?text=${text}`, "_blank");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Store Brand & Identity */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {store.storeLogo ? (
            <img
              src={store.storeLogo}
              alt={store.storeName}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-border shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-sm shrink-0"
              style={{ background: themeColor }}
            >
              {store.storeName
                ? store.storeName.slice(0, 2).toUpperCase()
                : "ST"}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                {store.storeName}
              </h1>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate mt-0.5">
              <span className="hidden md:inline truncate">
                {store.tagline || "Instant Data Bundles"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live SLA Pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-muted/50 border border-border/80 text-xs">
          <SignalRail status={isLive ? "online" : "offline"} size="xs" />
          <span className="font-bold text-foreground">
            {isLive
              ? "Telecom Gateways 100% Online"
              : "Scheduled Maintenance Mode"}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Share Store Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenShare}
            className="h-9 px-3 rounded-xl border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Share Store</span>
          </Button>

          {/* WhatsApp Agent Quick Chat */}
          <Button
            type="button"
            size="sm"
            onClick={openWhatsApp}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>

          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-md p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <span className="text-xs font-bold text-muted-foreground">
              Store Navigation
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLive
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-amber-500/15 text-amber-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLive ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {isLive ? "Accepting Orders" : "Store Paused"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenShare();
              }}
              className="w-full justify-center h-10 rounded-xl font-bold text-xs"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
              <span>Share Link</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                openWhatsApp();
              }}
              className="w-full justify-center h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>WhatsApp</span>
            </Button>
          </div>

          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Call Merchant ({store.phone})</span>
            </a>
          )}

          {store.whatsappChannelUrl && (
            <a
              href={store.whatsappChannelUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Join VIP WhatsApp Channel</span>
            </a>
          )}

          <div className="pt-2 border-t border-border/80">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSwitchToSDH();
              }}
              className="w-full py-2 text-center text-xs font-bold text-primary hover:underline"
            >
              ← Back to Smart Data Hub Main Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
