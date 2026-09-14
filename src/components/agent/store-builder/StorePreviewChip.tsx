import React from "react";
import {
  BadgeCheck,
  Star,
  Sparkles,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { AgentStoreConfig } from "../../../types";

interface StorePreviewChipProps {
  store: AgentStoreConfig;
}

export const StorePreviewChip: React.FC<StorePreviewChipProps> = ({
  store,
}) => {
  const initials = store.storeName
    ? store.storeName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  const themeColor = store.themeColor || "#2563eb";

  return (
    <div className="store-preview relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-md transition-all p-5 sm:p-6 space-y-4">
      {/* Radiant Ambient Gradient Matching Storefront Header */}
      <div
        className="absolute top-0 inset-x-0 h-28 pointer-events-none transition-all"
        style={{
          background: `linear-gradient(135deg, ${themeColor}35 0%, rgba(245, 158, 11, 0.22) 50%, ${themeColor}18 100%)`,
        }}
      />
      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
      <div
        className="absolute -bottom-10 -left-10 size-32 rounded-full pointer-events-none"
        style={{ background: `${themeColor}15`, filter: "blur(24px)" }}
      />

      {/* Top Floating Mini-Nav for Storefront Preview */}
      <div className="relative flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500/80" />
          <span className="size-2.5 rounded-full bg-emerald-500/80" />
          <span className="size-2.5 rounded-full bg-primary/80" />
          <span className="ml-1 text-[11px] font-bold text-muted-foreground">
            store/{store.handle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
            <BadgeCheck className="size-3" />
            <span>Verified Reseller</span>
          </span>
        </div>
      </div>

      {/* Main Storefront Hero Header Preview */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Logo / Branded Avatar */}
          <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black text-xl flex items-center justify-center shadow-md ring-4 ring-card shrink-0 overflow-hidden">
            {store.storeLogo ? (
              <img
                src={store.storeLogo}
                alt="logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Name & Tagline */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                {store.storeName}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {store.tagline ||
                "Authorized telecom data reseller in Ghana. Non-expiry bundles."}
            </p>
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-semibold mt-1">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="size-3.5 fill-amber-400" />
                <span className="tabular-nums">4.98</span>
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ⚡ 15-45s SLA Delivery
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Agent CTA Preview */}
        <div className="shrink-0 w-full sm:w-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs">
            <MessageCircle className="size-3.5" />
            <span>WhatsApp Agent</span>
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      {store.announcement && (
        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
          <Sparkles className="size-3.5 text-amber-500 shrink-0" />
          <span className="line-clamp-1">{store.announcement}</span>
        </div>
      )}

      {/* Quick SLA Trust Badges */}
      <div className="relative grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
        <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
          <div className="text-xs font-black text-foreground">Non-Expiry</div>
          <div className="text-[10px] text-muted-foreground">
            Lifetime Validity
          </div>
        </div>
        <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
          <div className="text-xs font-black text-foreground">
            Direct Carrier EVD
          </div>
          <div className="text-[10px] text-muted-foreground">
            Automated Switch
          </div>
        </div>
        <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
          <div className="text-xs font-black text-foreground">
            100% Guaranteed
          </div>
          <div className="text-[10px] text-muted-foreground">
            Instant MoMo Rails
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePreviewChip;
