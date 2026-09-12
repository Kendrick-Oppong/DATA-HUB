import React, { useEffect, useState } from "react";
import {
  Wifi,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  GraduationCap,
  Store,
  Users,
  MessageCircle,
  HelpCircle,
  Clock,
  Search,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Send,
  AlertCircle,
} from "lucide-react";
import { TelecomNetwork, DataBundle, Order, UserRole } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KeyRound, LogIn } from "lucide-react";

interface PublicMarketingSiteProps {
  bundles: DataBundle[];
  activeTab?:
    | "home"
    | "services"
    | "agent"
    | "track"
    | "faq"
    | "about"
    | "contact";
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onOpenOrderTracker?: (refOrPhone: string) => void;
  onApplyAgent?: () => void;
  orders: Order[];
  onNavigate?: (role: UserRole, tab: string) => void;
  onOpenReceipt?: (order: Order) => void;
  onOpenAuth?: (mode?: "signin" | "signup" | "demo") => void;
  onOpenSecurityPins?: () => void;
}

export const PublicMarketingSite: React.FC<PublicMarketingSiteProps> = ({
  bundles,
  activeTab: routeTab = "home",
  onStartPurchase,
  onOpenOrderTracker,
  onApplyAgent,
  orders,
  onNavigate,
  onOpenReceipt,
  onOpenAuth,
  onOpenSecurityPins,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>("MTN");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("mtn-5gb");
  const [quickPhone, setQuickPhone] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "home" | "services" | "agent" | "track" | "faq" | "about" | "contact"
  >("home");
  const [searchTrackInput, setSearchTrackInput] = useState<string>("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Agent Calculator State
  const [calcDailyBundles, setCalcDailyBundles] = useState<number>(25);
  const [calcAvgMargin, setCalcAvgMargin] = useState<number>(3.5);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [contactCategory, setContactCategory] = useState<string>(
    "Order Delivery Issue",
  );
  const [contactMessage, setContactMessage] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);
  const currentBundle =
    bundles.find((b) => b.id === selectedBundleId) || filteredBundles[0];

  const navigatePublicTab = (tab: typeof activeTab) => {
    if (onNavigate) {
      onNavigate("public", tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    } else if (onNavigate) {
      onNavigate("customer", "buy-data");
    }
  };

  const handleApplyAgent = () => {
    if (onApplyAgent) {
      onApplyAgent();
    } else if (onNavigate) {
      onNavigate("agent", "my-store");
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const cleaned = searchTrackInput.trim();
    const found = orders.find(
      (o) =>
        o.reference.toLowerCase() === cleaned.toLowerCase() ||
        o.recipientPhone.includes(cleaned),
    );
    setTrackedOrder(found || null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const faqs = [
    {
      q: "How fast will my data bundle or airtime be delivered?",
      a: "Over 98% of orders are delivered within 15 to 45 seconds of successful Mobile Money authorization. Our automated core switch directly connects to MTN EVD, Telecel Wholesale, and AT Direct Gateways.",
    },
    {
      q: "Does Smart Data Hub support all Ghanaian networks?",
      a: "Yes. We support MTN Ghana (including Turbonet & Non-Expiry), Telecel Ghana (Extra & Bossu), and AirtelTigo (Big Time & Sika Data) with instant automated delivery.",
    },
    {
      q: "What happens if my Mobile Money is deducted but data is delayed?",
      a: "Our smart reconciliation engine verifies every transaction. If upstream network delays exceed 5 minutes, our system either retries via an alternate priority route or automatically refunds the full amount to your wallet.",
    },
    {
      q: "How can I become an Agent and start my own data business?",
      a: 'Click "Agent Program" in the menu! You get wholesale pricing, your own customizable public storefront (e.g. smartdatahub.com/store/your-name), real-time commission tracking, and instant MoMo withdrawals.',
    },
    {
      q: "How do Result Checkers work?",
      a: "You can purchase authentic WAEC WASSCE, BECE Placement, and Nov/Dec vouchers. The serial and PIN are revealed immediately on screen and sent to your phone via SMS, ready to check on waecdirect.org.",
    },
    {
      q: "What is AFA Registration?",
      a: "AFA (Agricultural Workers Association) registration qualifies individuals for subsidized telecom data tariffs (e.g. 10GB for ~GH₵35). We process national ID verification and tariff enrollment.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* TAB 1: HOME PAGE */}
      {activeTab === "home" && (
        <div>
          {/* Hero Section with Live Telecom Routing Console */}
          <section className="relative isolate overflow-hidden border-b border-border bg-background">
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] border-l border-primary/10 bg-primary/[0.025] lg:block" />
            <div className="max-w-[95%] mx-auto px-4 py-10 sm:px-6 md:py-16 lg:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                <div className="relative z-10 space-y-7">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase text-muted-foreground">
                    <span className="inline-flex items-center gap-2 text-primary">                      Ghana's digital service rail
                    </span>
                    <span className="h-px w-8 bg-border" />
                    <span>Live since 2026</span>
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
                    <button
                      onClick={() =>
                        handleStartPurchase(selectedBundleId, selectedNetwork)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 cursor-pointer"
                    >
                      Buy data now
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      onClick={() => navigatePublicTab("agent")}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-muted cursor-pointer"
                    >
                      <Store className="size-4 text-amber-500" />
                      Open a data store
                    </button>
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

                {/* Live routing console */}
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
                      <Badge className="gap-1.5"> Operational</Badge>
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
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Clear route
                          </span>
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
                            <SignalRail status="online" size="sm" />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                          <span>{selectedNetwork} EVD</span>
                          <span>SDH Core</span>
                          <span>Recipient</span>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground">
                            Choose a network
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Popular: {currentBundle?.sizeLabel || "5 GB"}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            ["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]
                          ).map((network) => (
                            <button
                              key={network}
                              onClick={() => {
                                setSelectedNetwork(network);
                                const nextBundle = bundles.find(
                                  (bundle) => bundle.network === network,
                                );
                                if (nextBundle)
                                  setSelectedBundleId(nextBundle.id);
                              }}
                              className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors cursor-pointer ${selectedNetwork === network ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                            >
                              {network === "AirtelTigo" ? "AT" : network}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        className="w-full font-bold h-11"
                        onClick={() =>
                          onNavigate
                            ? onNavigate("customer", "buy-data")
                            : handleStartPurchase(
                                selectedBundleId,
                                selectedNetwork,
                              )
                        }
                      >
                        Continue with {currentBundle?.sizeLabel || "data"}{" "}
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Three Steps Explanation */}
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
                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
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
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                    02
                  </div>
                  <h3 className="font-bold text-base text-foreground">
                    Approve MoMo Prompt
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pay securely using MTN MoMo, Telecel Cash, AT Money, or your
                    preloaded SDH Wallet balance.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
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
                </div>
              </div>
            </div>
          </section>

          {/* Supported Services Catalog Banner */}
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
                <button
                  onClick={() => navigatePublicTab("services")}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>View All Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => onStartPurchase("mtn-5gb", "MTN")}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
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
                </div>

                <div
                  onClick={() => onStartPurchase("airtime", "MTN")}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
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
                </div>

                <div
                  onClick={() => onStartPurchase("waec-wassce", "MTN")}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
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
                </div>

                <div
                  onClick={() => onStartPurchase("afa", "MTN")}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
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
                </div>
              </div>
            </div>
          </section>

          {/* Agent Program Callout */}
          <section className="py-16 bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border-b border-border">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6">
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Turn Telecom Data into Daily Income</span>
                  </div>
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
                  <button
                    onClick={() => navigatePublicTab("agent")}
                    className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                  >
                    View Agent Benefits
                  </button>
                  <button
                    onClick={handleApplyAgent}
                    className="px-6 py-3.5 rounded-xl border border-border bg-muted/60 text-foreground font-bold text-sm hover:bg-muted transition-all cursor-pointer"
                  >
                    Apply as Agent
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: SERVICES DIRECTORY */}
      {activeTab === "services" && (
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10 space-y-10">
          <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <Wifi className="size-4" />
                Service rail / 01
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.98] text-foreground sm:text-6xl">
                Everything you need, routed from one place.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Compare live Ghana network bundles, choose a package, and send
                it directly to any active SIM.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[25rem]">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Networks
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">03</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  live now
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Dispatch
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">42s</p>
                <p className="text-[11px] text-muted-foreground">average</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-border bg-card p-4 sm:col-span-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Delivery promise
                </p>
                <p className="mt-2 text-sm font-bold text-foreground">
                  Automatic refund protection
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  Choose a network
                </p>
                <h2 className="mt-1 text-xl font-black text-foreground">
                  {selectedNetwork} Ghana packages
                </h2>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
                {(["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]).map(
                  (net) => (
                    <button
                      key={net}
                      onClick={() => setSelectedNetwork(net)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${selectedNetwork === net ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      {net === "AirtelTigo" ? "AT Ghana" : `${net} Ghana`}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBundles.map((b, index) => (
                <div
                  key={b.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"}`}
                >
                  {index === 0 && (
                    <div className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">
                      Popular route
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        {b.network} / data
                      </p>
                      <h3 className="mt-2 text-3xl font-black text-foreground">
                        {b.sizeLabel}
                      </h3>
                    </div>
                    <SignalRail status="online" size="sm" />
                  </div>
                  <div className="mt-8 flex items-end justify-between gap-4 border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Valid for
                      </p>
                      <p className="mt-1 text-sm font-bold text-foreground">
                        {b.validity}
                      </p>
                      <p className="mt-2 text-xl font-black tabular-nums text-foreground">
                        GH₵ {b.retailPrice.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartPurchase(b.id, b.network)}
                      className="rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                    >
                      Buy package{" "}
                      <ArrowRight className="ml-1 inline size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: AGENT PROGRAM & CALCULATOR */}
      {activeTab === "agent" && (
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10 space-y-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-primary/10 p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[28px] border-amber-500/10" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="size-3.5" /> Merchant program / 02
                </div>
                <h1 className="text-4xl font-black leading-[0.98] text-foreground sm:text-6xl">
                  Turn everyday connections into daily income.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  Sell data, vouchers, and utilities from your own branded
                  storefront with wholesale rates and instant MoMo payouts.
                </p>
              </div>
              <button
                onClick={handleApplyAgent}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 cursor-pointer"
              >
                Open my data store <ArrowRight className="size-4" />
              </button>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Setup fee
              </p>
              <p className="mt-2 text-2xl font-black text-foreground">GH₵ 0</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                start selling today
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Payout speed
              </p>
              <p className="mt-2 text-2xl font-black text-foreground">
                Instant
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                to your MoMo wallet
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Storefront
              </p>
              <p className="mt-2 text-2xl font-black text-foreground">
                Your brand
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                your own public URL
              </p>
            </div>
          </div>

          <section className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-7">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">
                    Plan your margin
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-foreground">
                    Profit calculator
                  </h2>
                </div>
                <SignalRail status="online" size="sm" label="MoMo live" />
              </div>
              <div className="space-y-7">
                <div>
                  <div className="mb-3 flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      Bundles sold per day
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                      {calcDailyBundles}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={calcDailyBundles}
                    onChange={(e) =>
                      setCalcDailyBundles(parseInt(e.target.value))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>5 bundles</span>
                    <span>200 bundles</span>
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      Average margin per bundle
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                      GH₵ {calcAvgMargin.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.50"
                    value={calcAvgMargin}
                    onChange={(e) =>
                      setCalcAvgMargin(parseFloat(e.target.value))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                  />
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>GH₵ 1.00</span>
                    <span>GH₵ 10.00</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase text-primary-foreground/70">
                  Projected monthly commission
                </p>
                <p className="mt-4 text-5xl font-black tabular-nums">
                  GH₵{" "}
                  {(calcDailyBundles * calcAvgMargin * 30).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2 },
                  )}
                </p>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
                  At {calcDailyBundles * 30} orders per month, your storefront
                  could turn a reliable local customer base into predictable
                  income.
                </p>
              </div>
              <button
                onClick={handleApplyAgent}
                className="mt-8 rounded-xl bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-background/90 cursor-pointer"
              >
                Apply to become an agent{" "}
                <ArrowRight className="ml-1 inline size-4" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: PUBLIC ORDER TRACKING */}
      {activeTab === "track" && (
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-10 space-y-10">
          <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <Search className="size-4" /> Delivery control / 03
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.98] text-foreground sm:text-6xl">
                Know where your order is, every second.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Use your order reference or Ghana mobile number to inspect the
                live dispatch trail.
              </p>
            </div>
            <div className="rounded-2xl rounded-2xl border border-border bg-card p-4 sm:w-64">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Tracking rail online
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">
                Orders are monitored from payment to delivery.
              </p>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  Find an order
                </p>
                <h2 className="mt-1 text-2xl font-black text-foreground">
                  Enter your details
                </h2>
              </div>
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground">
                  Reference or phone number
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="SDH-GH-2026-94812"
                    value={searchTrackInput}
                    onChange={(e) => setSearchTrackInput(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                >
                  Inspect delivery status{" "}
                  <ArrowRight className="ml-1 inline size-4" />
                </button>
              </form>
              <div className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                <p className="font-bold text-foreground">
                  Where to find your reference
                </p>
                <p className="mt-1">
                  It is shown on your receipt and sent after a successful Mobile
                  Money payment.
                </p>
              </div>
            </div>

            <div className="min-h-[20rem] rounded-3xl border border-border bg-muted/30 p-6 sm:p-8">
              {!trackSearched ? (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <SignalRail status="online" size="md" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-foreground">
                    Your live dispatch trail appears here.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Search an order to see its route through the SDH core and
                    carrier gateway.
                  </p>
                </div>
              ) : trackedOrder ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        {trackedOrder.reference}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-foreground">
                        {trackedOrder.productName}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {trackedOrder.network} / {trackedOrder.recipientPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black tabular-nums text-foreground">
                        GH₵ {trackedOrder.amount.toFixed(2)}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                        {trackedOrder.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Signal dispatch timeline
                      </p>
                      <SignalRail status="online" size="sm" label="Live" />
                    </div>
                    <div className="space-y-4 border-l-2 border-primary/30 pl-5">
                      {trackedOrder.deliveryTimeline.map((step, idx) => (
                        <div key={idx} className="relative text-sm">
                          <span className="absolute -left-[1.65rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-muted/80" />
                          <div className="flex flex-wrap justify-between gap-2 font-bold text-foreground">
                            <span>{step.step}</span>
                            <span className="text-xs font-normal tabular-nums text-muted-foreground">
                              {step.timestamp}
                            </span>
                          </div>
                          {step.note && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {step.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                  <AlertCircle className="size-10 text-amber-500" />
                  <h3 className="mt-4 text-lg font-black text-foreground">
                    No matching order found.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Check the reference spelling or try the phone number used at
                    checkout.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: FAQ */}
      {activeTab === "faq" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about purchasing, delivery, and
              reselling on Smart Data Hub.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex justify-between items-center font-bold text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: ABOUT US */}
      {activeTab === "about" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              About Smart Data Hub
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Smart Data Hub (SDH) is Ghana's mission-driven digital commerce
              and telecom distribution network. We power connectivity for
              thousands of Ghanaian students, professionals, micro-enterprises,
              and telecom merchants across all 16 regions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">
                Carrier Level Direct
              </h3>
              <p className="text-xs text-muted-foreground">
                Automated core gateway integration with MTN Ghana, Telecel, and
                AT Ghana.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">BoG Regulated Rails</h3>
              <p className="text-xs text-muted-foreground">
                All Mobile Money flows are settled via authorized financial
                institutions with instant dispute resolution.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">
                Local Customer Support
              </h3>
              <p className="text-xs text-muted-foreground">
                Dedicated Accra-based NOC support desk reachable 24/7 via
                WhatsApp and phone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUPPORT & CONTACT */}
      {activeTab === "contact" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Contact & NOC Support
            </h1>
            <p className="text-sm text-muted-foreground">
              Have an issue with an order or payment? Our support engineers
              resolve tickets in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Support"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-emerald-600 text-white flex items-center gap-3 hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-8 h-8" />
              <div>
                <div className="font-bold text-sm">WhatsApp Priority Desk</div>
                <div className="text-xs opacity-90">
                  +233 24 419 2834 (Live)
                </div>
              </div>
            </a>

            <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <div className="font-bold text-sm text-foreground">
                  Operating Hours
                </div>
                <div className="text-xs text-muted-foreground">
                  24 Hours / 7 Days a week
                </div>
              </div>
            </div>
          </div>

          {/* Contact Ticket Form */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs">
            {contactSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">
                  Support Ticket Submitted!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Ticket{" "}
                  <strong>
                    TKT-SDH-{Math.floor(1000 + Math.random() * 9000)}
                  </strong>{" "}
                  has been opened. An NOC engineer will contact your phone
                  shortly.
                </p>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-foreground">
                  File a Support Request
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Issue Category
                  </label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  >
                    <option>Order Delivery Delay</option>
                    <option>Mobile Money Debited but No Data</option>
                    <option>Failed Result Checker Voucher</option>
                    <option>Agent Onboarding / Payout Question</option>
                    <option>General Feedback</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Your Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0244192834"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your issue with order reference number..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Submit Support Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-10">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center">
                  SDH
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  Smart Data Hub
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ghana's trusted consumer fintech and telecom resale
                infrastructure. Instant automated delivery on all networks.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Quick Services
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <button
                    onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy MTN Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleStartPurchase("telecel-10gb", "Telecel")
                    }
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy Telecel Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleStartPurchase("at-5gb", "AirtelTigo")}
                    className="hover:text-primary cursor-pointer"
                  >
                    Buy AT Big Time Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onNavigate
                        ? onNavigate("customer", "results-checker")
                        : handleStartPurchase("waec-wassce", "MTN")
                    }
                    className="hover:text-primary cursor-pointer"
                  >
                    WASSCE / BECE Checkers
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Company & Legal
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <button
                    onClick={() => navigatePublicTab("about")}
                    className="hover:text-primary"
                  >
                    About Smart Data Hub
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("faq")}
                    className="hover:text-primary"
                  >
                    Frequently Asked Questions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("track")}
                    className="hover:text-primary"
                  >
                    Order Status Tracker
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigatePublicTab("contact")}
                    className="hover:text-primary"
                  >
                    Terms of Service & SLA
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                Accra NOC Desk
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Airport Residential Area, Accra, Ghana.
                <br />
                Support:{" "}
                <span className="font-mono text-foreground font-semibold">
                  +233 24 419 2834
                </span>
                <br />
                Email:{" "}
                <span className="text-foreground">
                  support@smartdatahub.com
                </span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
            <div>
              © 2026 Smart Data Hub Ghana. All rights reserved. Primary
              currency: GH₵.
            </div>
            <div className="flex items-center gap-4">
              <span>MTN MoMo</span>
              <span>Telecel Cash</span>
              <span>AT Money</span>
              <span>GhQR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
