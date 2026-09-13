import React from "react";
import {
  Wifi,
  Zap,
  ArrowRight,
  Store,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TelecomNetwork, DataBundle } from "../../../types";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";

export type PublicTabType =
  | "home"
  | "services"
  | "agent"
  | "track"
  | "faq"
  | "about"
  | "contact";

interface PublicHomeSectionProps {
  selectedNetwork: TelecomNetwork;
  selectedBundleId: string;
  onSelectNetwork: (network: TelecomNetwork) => void;
  onSelectBundleId: (bundleId: string) => void;
  bundles: DataBundle[];
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
  onApplyAgent: () => void;
}

export const PublicHomeSection: React.FC<PublicHomeSectionProps> = ({
  selectedNetwork,
  selectedBundleId,
  onSelectNetwork,
  onSelectBundleId,
  bundles,
  onStartPurchase,
  onNavigatePublicTab,
  onApplyAgent,
}) => {
  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    }
  };

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] border-l border-primary/10 bg-primary/[0.025] lg:block" />
        <div className="max-w-[95%] mx-auto px-4 py-10 sm:px-6 md:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div className="relative z-10 space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Wifi className="size-3.5" />
                Ghana's live service rail
              </div>
              <div className="max-w-3xl space-y-5">
                <h1 className="text-4xl font-black leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
                  Everything you need, delivered instantly
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Buy data, airtime, exam vouchers, and digital services
                  across Ghana's networks. One trusted rail, live tracking,
                  and delivery in seconds.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="font-semibold"
                  onClick={() =>
                    handleStartPurchase(selectedBundleId, selectedNetwork)
                  }
                >
                  Buy data now
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                  onClick={() => onNavigatePublicTab("agent")}
                >
                  <Store className="size-4 text-amber-500" />
                  Open a data store
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/70 pt-5">
                <div>
                  <div className="text-2xl font-black tabular-nums text-foreground">
                    42s
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    average delivery
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black tabular-nums text-foreground">
                    99.8%
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    gateway uptime
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <SignalRail status="online" size="sm" />
                  <span>All major networks live</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card shadow-2xl shadow-primary/10">
                <div className="flex items-start justify-between border-b border-border/70 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <Zap className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Live routing console
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Direct carrier dispatch across Ghana
                      </p>
                    </div>
                  </div>
                  <Badge className="gap-1.5">Operational</Badge>
                </div>
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Dispatch time
                      </p>
                      <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                        42s
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        faster than the usual wait
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Core uptime
                      </p>
                      <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                        99.8%
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        gateway health today
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                      <span>Delivery path</span>
                      <span className="text-emerald-600">Clear route</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-background text-xs font-black text-foreground">
                        {selectedNetwork === "AirtelTigo"
                          ? "AT"
                          : selectedNetwork === "Telecel"
                            ? "TC"
                            : "MTN"}
                      </div>
                      <div className="h-px flex-1 bg-primary/40" />
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-[10px] font-black text-primary-foreground">
                        SDH
                      </div>
                      <div className="h-px flex-1 bg-primary/40" />
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <SignalRail status="online" size="xs" />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                      <span>{selectedNetwork} EVD</span>
                      <span>SDH Core</span>
                      <span>Recipient</span>
                    </div>
                  </div>
                  <div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        ["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]
                      ).map((network) => (
                        <Button
                          key={network}
                          variant={
                            selectedNetwork === network
                              ? "default"
                              : "outline"
                          }
                          className="font-semibold h-10"
                          onClick={() => {
                            onSelectNetwork(network);
                            const nextBundle = bundles.find(
                              (bundle) => bundle.network === network,
                            );
                            if (nextBundle) onSelectBundleId(nextBundle.id);
                          }}
                        >
                          {network === "AirtelTigo" ? "AT" : network}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border bg-card/40">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              How Smart Data Hub Delivers
            </h2>
            <p className="text-sm text-muted-foreground">
              A seamless 60-second delivery workflow engineered for Ghanaian
              telecom networks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                  01
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Select Package & Phone
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pick your preferred telecom network and bundle size. Enter
                  any active Ghana SIM number.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                  02
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Approve MoMo Prompt
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pay securely using MTN MoMo, Telecel Cash, AT Money, or
                  your preloaded SDH Wallet balance.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                  03
                </div>
                <h3 className="font-bold text-base text-foreground">
                  Instant Data Credited
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our direct carrier gateway credits the beneficiary handset
                  in seconds with official receipt and SMS.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Explore Digital Services
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything you need on one platform with unified tracking
                and payment.
              </p>
            </div>
            <Button
              variant="link"
              className="font-bold text-primary px-0"
              onClick={() => onNavigatePublicTab("services")}
            >
              View All Services
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <Button
              variant="outline"
              onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
              className="h-auto cursor-pointer group rounded-2xl p-0 text-left align-top bg-card shadow-xs transition-all hover:border-primary/50 hover:bg-card"
            >
              <CardContent className="p-5 w-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Wifi className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  Data Bundles
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  MTN, Telecel, AT bundles up to 100GB with non-expiry
                  options.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-primary">
                  Buy from GH₵4.80 →
                </span>
              </CardContent>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartPurchase("airtime", "MTN")}
              className="h-auto cursor-pointer group rounded-2xl p-0 text-left align-top bg-card shadow-xs transition-all hover:border-primary/50 hover:bg-card"
            >
              <CardContent className="p-5 w-full">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  Airtime Top-up
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Instant electronic top-up for all networks from GH₵1 to
                  GH₵500.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-amber-600">
                  Recharge SIM →
                </span>
              </CardContent>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartPurchase("waec-wassce", "MTN")}
              className="h-auto cursor-pointer group rounded-2xl p-0 text-left align-top bg-card shadow-xs transition-all hover:border-primary/50 hover:bg-card"
            >
              <CardContent className="p-5 w-full">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  Results Checkers
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  WAEC WASSCE, BECE Placement, and University admission
                  vouchers.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-purple-600">
                  Get Serial & PIN →
                </span>
              </CardContent>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartPurchase("afa", "MTN")}
              className="h-auto cursor-pointer group rounded-2xl p-0 text-left align-top bg-card shadow-xs transition-all hover:border-primary/50 hover:bg-card"
            >
              <CardContent className="p-5 w-full">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  AFA Registration
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Farmer & Worker subsidized tariff enrollment with national
                  ID.
                </p>
                <span className="inline-block mt-3 text-xs font-bold text-emerald-600">
                  Register SIM →
                </span>
              </CardContent>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border-b border-border">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6">
          <Card className="p-8 sm:p-12 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <Badge
                  variant="secondary"
                  className="bg-amber-500/15 text-amber-900 dark:text-amber-300 gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Turn Telecom Data into Daily Income
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Start your own branded data shop in 5 minutes
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get wholesale data rates, your personal store URL (
                  <span className="font-mono text-primary">
                    smartdatahub.com/store/your-name
                  </span>
                  ), set your own selling margins, and withdraw profits
                  directly to your Mobile Money wallet anytime.
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground pt-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Zero setup fee</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Instant MoMo payouts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Automated delivery</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="font-semibold"
                  onClick={() => onNavigatePublicTab("agent")}
                >
                  View Agent Benefits
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                  onClick={onApplyAgent}
                >
                  Apply as Agent
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};
