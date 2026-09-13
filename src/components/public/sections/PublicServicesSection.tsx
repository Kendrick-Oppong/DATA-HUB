import React from "react";
import {
  Wifi,
  ArrowRight,
  Store,
  PhoneCall,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { TelecomNetwork, DataBundle } from "../../../types";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { NETWORK_ACCENT } from "../constants";
import { PublicTabType } from "./PublicHomeSection";

interface PublicServicesSectionProps {
  selectedNetwork: TelecomNetwork;
  selectedBundleId: string;
  onSelectNetwork: (network: TelecomNetwork) => void;
  bundles: DataBundle[];
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
}

export const PublicServicesSection: React.FC<PublicServicesSectionProps> = ({
  selectedNetwork,
  selectedBundleId,
  onSelectNetwork,
  bundles,
  onStartPurchase,
  onNavigatePublicTab,
}) => {
  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);
  const accent = NETWORK_ACCENT[selectedNetwork];

  const networks: TelecomNetwork[] = ["MTN", "Telecel", "AirtelTigo"];

  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-background border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_50%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Wifi className="size-3.5" />
                Ghana's live service rail
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Every service.
                <br />
                <span className="text-primary">One platform.</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                Browse live packages from all three Ghana carriers. Pick a
                bundle, approve your MoMo prompt, and data lands on the
                recipient's SIM in under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="font-semibold"
                  onClick={() =>
                    handleStartPurchase(selectedBundleId, selectedNetwork)
                  }
                >
                  Buy data now <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                  onClick={() => onNavigatePublicTab("agent")}
                >
                  <Store className="size-4 text-amber-500" /> Become an agent
                </Button>
              </div>
            </div>

            {/* Live network card */}
            <div className="rounded-3xl border border-border bg-card shadow-2xl shadow-primary/8 overflow-hidden">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary tracking-wider">
                    Carrier status
                  </p>
                  <h2 className="mt-0.5 text-lg font-black text-foreground">
                    Live network feed
                  </h2>
                </div>
                <SignalRail status="online" size="sm" label="All live" />
              </div>
              <div className="p-6 space-y-4">
                {(
                  [
                    {
                      network: "MTN",
                      color:
                        "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400",
                      dot: "bg-yellow-400",
                      ping: "42s",
                      status: "Operational",
                    },
                    {
                      network: "Telecel",
                      color: "bg-red-500/10 text-red-600 dark:text-red-400",
                      dot: "bg-red-500",
                      ping: "38s",
                      status: "Operational",
                    },
                    {
                      network: "AirtelTigo",
                      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      dot: "bg-blue-500",
                      ping: "51s",
                      status: "Operational",
                    },
                  ] as const
                ).map((n) => (
                  <div
                    key={n.network}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex size-8 items-center justify-center rounded-lg text-[10px] font-black ${n.color}`}
                      >
                        {n.network === "AirtelTigo"
                          ? "AT"
                          : n.network.slice(0, 3)}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {n.network}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {n.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${n.dot} animate-pulse`}
                      />
                      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                        {n.ping}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full font-semibold h-11 mt-2"
                  onClick={() =>
                    handleStartPurchase(selectedBundleId, selectedNetwork)
                  }
                >
                  Buy a bundle <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network selector + bundle grid */}
      <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Choose a network
            </p>
            <h2 className="mt-1 text-2xl font-black text-foreground">
              {selectedNetwork} Ghana packages
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1.5">
            {networks.map((net) => {
              const a = NETWORK_ACCENT[net];
              const isActive = selectedNetwork === net;
              return (
                <Button
                  key={net}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectNetwork(net)}
                  className={`rounded-full px-4 font-bold hover:bg-transparent ${
                    isActive
                      ? `${a.bg} ${a.text} shadow-sm`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`size-2.5 rounded-full ${a.solid}`} />
                  {net === "AirtelTigo" ? "AT Ghana" : `${net} Ghana`}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBundles.map((b, index) => (
            <div
              key={b.id}
              className={`group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                index === 0
                  ? `${accent.border} shadow-lg shadow-primary/10`
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`h-1 w-full ${accent.solid}`} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                      {b.network} · data bundle
                    </p>
                    <h3 className="mt-2 text-4xl font-black tracking-tight text-foreground">
                      {b.sizeLabel}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.validity}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-1.5 rounded-xl bg-muted/40 px-3 py-2.5">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-black text-white ${accent.solid}`}
                  >
                    {accent.short}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[8px] font-black text-primary-foreground">
                    SDH
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <SignalRail status="online" size="xs" bars={4} />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-2xl font-black tabular-nums text-foreground">
                    GH₵ {b.retailPrice.toFixed(2)}
                  </p>
                  <Button
                    className="font-bold rounded-full"
                    onClick={() => handleStartPurchase(b.id, b.network)}
                  >
                    Buy now <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other services */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-5">
            Other services on Smart Data Hub
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {[
              {
                icon: PhoneCall,
                color: "text-amber-600",
                bg: "bg-amber-500/10",
                label: "Airtime Top-up",
                desc: "Instant electronic recharge GH₵1–500 on all networks",
                cta: "Recharge SIM",
              },
              {
                icon: GraduationCap,
                color: "text-purple-600",
                bg: "bg-purple-500/10",
                label: "Results Checkers",
                desc: "WAEC WASSCE, BECE Placement, and University vouchers",
                cta: "Buy voucher",
              },
              {
                icon: ShieldCheck,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
                label: "AFA Registration",
                desc: "Farmer & Worker subsidized tariff enrollment",
                cta: "Register SIM",
              },
            ].map((svc) => (
              <Button
                key={svc.label}
                variant="outline"
                onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
                className="h-auto cursor-pointer group items-start justify-start gap-4 rounded-2xl p-5 text-left bg-card hover:bg-card hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-2xl ${svc.bg} shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <svc.icon className={`size-5 ${svc.color}`} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-sm text-foreground">
                    {svc.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {svc.desc}
                  </p>
                  <span
                    className={`inline-block mt-2 text-xs font-bold ${svc.color}`}
                  >
                    {svc.cta} →
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
