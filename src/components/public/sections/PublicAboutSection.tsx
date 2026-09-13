import React from "react";
import {
  Building2,
  MapPin,
  Radio,
  Zap,
  Users,
  ShieldCheck,
  MessageCircle,
  Store,
  ArrowRight,
} from "lucide-react";
import { TelecomNetwork } from "../../../types";
import { Button } from "../../ui/button";

interface PublicAboutSectionProps {
  selectedBundleId: string;
  selectedNetwork: TelecomNetwork;
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onApplyAgent: () => void;
}

export const PublicAboutSection: React.FC<PublicAboutSectionProps> = ({
  selectedBundleId,
  selectedNetwork,
  onStartPurchase,
  onApplyAgent,
}) => {
  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.10),transparent)]" />
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-6">
            <Building2 className="size-3.5" />
            About Smart Data Hub
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            Ghana's
            <br />
            <span className="text-primary">digital service</span>
            <br />
            backbone.
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Smart Data Hub (SDH) is Ghana's mission-driven digital commerce
            and telecom distribution network — powering connectivity for
            thousands of students, professionals, and merchants across all
            16 regions with direct carrier-level access.
          </p>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-b border-border bg-gradient-to-r from-primary/8 via-card to-amber-500/8">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "16", label: "Regions covered", icon: MapPin },
              { value: "3", label: "Carrier gateways", icon: Radio },
              { value: "99.8%", label: "SLA uptime", icon: Zap },
              { value: "24/7", label: "NOC support desk", icon: Users },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="size-5 mx-auto mb-2" />
                <p className="text-3xl font-black tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission + pillars */}
      <section className="max-w-[95%] mx-auto px-4 sm:px-6 py-14 w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase text-primary tracking-widest">
              Our mission
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
              Fast, fair, and frictionless access to digital services — for
              every Ghanaian.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We built SDH because buying data in Ghana felt unnecessarily
              hard. Long waits, failed transactions, and no transparency. We
              connected directly to carrier EVD and MoMo gateways to fix
              that — 42 seconds from payment to delivery, with automated
              refund protection on every order.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For agents and resellers, we built a full merchant platform:
              branded storefronts, live commission dashboards, and instant
              MoMo payouts — turning everyday connections into a real income
              stream.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Radio,
                color: "text-primary",
                bg: "bg-primary/10",
                title: "Carrier Level Direct",
                desc: "Automated core gateway integration with MTN Ghana, Telecel, and AT Ghana for sub-minute delivery.",
              },
              {
                icon: ShieldCheck,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
                title: "BoG Regulated Rails",
                desc: "All Mobile Money flows settled via authorized financial institutions with instant dispute resolution.",
              },
              {
                icon: MessageCircle,
                color: "text-amber-600",
                bg: "bg-amber-500/10",
                title: "Local NOC Support",
                desc: "Accra-based network operations desk reachable 24/7 via WhatsApp and phone — a real person, always.",
              },
              {
                icon: Store,
                color: "text-purple-600",
                bg: "bg-purple-500/10",
                title: "Agent Merchant Program",
                desc: "Free branded storefronts, wholesale pricing, and instant MoMo payouts for Ghana's data resellers.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${item.bg} mb-3`}
                >
                  <item.icon className={`size-5 ${item.color}`} />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border border-border p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              Ready to get started?
            </h3>
            <p className="text-sm text-muted-foreground">
              Buy data in seconds, or open your own branded data store —
              both are one click away.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
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
              onClick={onApplyAgent}
            >
              Become an agent
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
