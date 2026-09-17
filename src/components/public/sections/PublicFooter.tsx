import React, { useCallback } from "react";
import {
  CheckCircle2,
  MessageCircle,
  Zap,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { TelecomNetwork, UserRole, AppTheme } from "../../../types";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { getLogoForTheme } from "../../../lib/themes";
import type { PublicTabType } from "./PublicHomeSection";
import {
  FOOTER_BRAND,
  FOOTER_COLUMNS,
  FOOTER_NOC,
  FOOTER_COPYRIGHT,
  FOOTER_PAYMENT_BADGES,
  type FooterAction,
} from "../constants";

interface PublicFooterProps {
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
  onNavigate?: (role: UserRole, tab: string) => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
  theme?: AppTheme;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onStartPurchase,
  onNavigatePublicTab,
  onNavigate,
  onNavigateToLegal,
  theme = "light",
}) => {
  const resolveClick = useCallback(
    (action: FooterAction) => () => {
      switch (action.type) {
        case "purchase":
          onStartPurchase?.(action.bundleId, action.network);
          return;
        case "public":
          onNavigatePublicTab(action.tab);
          return;
        case "legal":
          if (onNavigateToLegal) {
            onNavigateToLegal(action.page);
            return;
          }
          if (typeof window !== "undefined") {
            window.location.href =
              action.page === "terms" ? "/terms" : "/privacy";
          }
          return;
        case "role":
          if (onNavigate) {
            onNavigate(action.role, action.tab);
            return;
          }
          if (action.fallbackPublic) {
            onNavigatePublicTab(action.fallbackPublic);
            return;
          }
          if (action.fallbackPurchase) {
            onStartPurchase?.(
              action.fallbackPurchase.bundleId,
              action.fallbackPurchase.network,
            );
          }
          return;
      }
    },
    [onStartPurchase, onNavigatePublicTab, onNavigate],
  );

  return (
    <footer className="mt-auto border-t border-border bg-card/60 py-12">
      <div className="sm:max-w-[95%] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top grid with 5 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Live Status */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 items-center justify-center p-1 ">
                <img
                  src={getLogoForTheme(theme)}
                  alt="Smart Data Hub Logo"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <span className="font-black text-base text-foreground tracking-tight">
                {FOOTER_BRAND.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {FOOTER_BRAND.tagline}
            </p>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <SignalRail status="online" size="xs" />
              <span>{FOOTER_BRAND.uptimeBadge}</span>
            </div>
          </div>

          {/* Cols 2–4: Loop over FOOTER_COLUMNS */}
          {FOOTER_COLUMNS.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.key}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${col.iconColor}`} />
                  {col.title}
                </h4>
                <ul className="space-y-1.5 text-xs">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Button
                        variant="link"
                        onClick={resolveClick(item.action)}
                        className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                      >
                        {item.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Col 5: NOC Desk & Direct Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary" />
              {FOOTER_NOC.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {FOOTER_NOC.address}
              <br />
              Support:{" "}
              <span className="font-mono text-foreground font-semibold">
                {FOOTER_NOC.phone}
              </span>
              <br />
              Email: <span className="text-foreground">{FOOTER_NOC.email}</span>
            </p>

            <Button
              render={
                <a
                  href={FOOTER_NOC.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              size="sm"
              className="w-fit gap-2 font-bold text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <MessageCircle className="size-3.5" />
              {FOOTER_NOC.whatsapp.label}
              <ArrowUpRight className="size-3 ml-auto" />
            </Button>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Compliance, MoMo Badges */}
        <div className="pt-6 border-t border-border/70 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
            <p>{FOOTER_COPYRIGHT}</p>
            <div className="flex items-center gap-3 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToLegal) onNavigateToLegal("terms");
                  else window.location.href = "/terms";
                }}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToLegal) onNavigateToLegal("privacy");
                  else window.location.href = "/privacy";
                }}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {FOOTER_PAYMENT_BADGES.map((badge) => (
              <Badge
                key={badge.label}
                variant="outline"
                className="text-[10px] font-bold bg-muted/40"
              >
                <CheckCircle2 className={`size-3 ${badge.dotColor} mr-1`} />
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
