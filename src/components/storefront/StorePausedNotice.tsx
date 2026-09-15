import React from "react";
import {
  AlertCircle,
  MessageCircle,
  Phone,
  Power,
  ShieldCheck,
  Clock,
  ExternalLink,
  Store,
  Radio,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AgentStoreConfig } from "../../types";

interface StorePausedNoticeProps {
  store: AgentStoreConfig;
  onGoLive?: () => void;
  onSwitchToSDH?: () => void;
}

export const StorePausedNotice: React.FC<StorePausedNoticeProps> = ({
  store,
  onGoLive,
  onSwitchToSDH,
}) => {
  const openWhatsApp = () => {
    const phone = store.whatsappNumber.replace(/^0/, "");
    const text = encodeURIComponent(
      `Hello ${store.storeName}, I am visiting your store but noticed it is currently paused. When will data purchases be back online?`,
    );
    window.open(`https://wa.me/233${phone}?text=${text}`, "_blank");
  };

  const openCall = () => {
    if (store.phone) {
      window.location.href = `tel:${store.phone}`;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      {/* Main Paused Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-card p-8 sm:p-12 shadow-xl text-center space-y-6">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Icon & Status Pill */}
        <div className="relative mx-auto flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-900 dark:text-amber-300 flex items-center justify-center ring-8 ring-amber-500/10 shadow-md">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Scheduled Maintenance Mode</span>
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2 max-w-xl mx-auto relative">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Storefront is Currently Paused
          </h2>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed text-left space-y-1.5 mt-4">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Catalog & Inventory Synchronization</span>
            </div>
            <p>
              The store administrator has temporarily locked new order
              placements while wholesale allocations and carrier switch routes
              are being updated. All previously completed recharges remain
              active and unaffected.
            </p>
          </div>
        </div>

        {/* Direct Contact Options for Shoppers */}
        <div className="pt-2 border-t border-border/80 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Need Instant Data? Contact {store.storeName} Directly
          </span>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto">
            <Button
              type="button"
              onClick={openWhatsApp}
              className="w-full sm:w-auto flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Agent</span>
            </Button>

            {store.phone && (
              <Button
                type="button"
                variant="outline"
                onClick={openCall}
                className="w-full sm:w-auto h-11 rounded-xl border-border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span>Call ({store.phone})</span>
              </Button>
            )}
          </div>

          {store.whatsappChannelUrl && (
            <div className="pt-2">
              <a
                href={store.whatsappChannelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Join {store.storeName} VIP WhatsApp Updates Channel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Trust & SDH Infrastructure Rail */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-center justify-between text-xs text-muted-foreground shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Smart Data Hub Automated EVD Switch Monitoring</span>
        </div>
        {onSwitchToSDH && (
          <button
            onClick={onSwitchToSDH}
            className="text-primary font-bold hover:underline cursor-pointer"
          >
            Visit Smart Data Hub Ghana
          </button>
        )}
      </div>
    </div>
  );
};
