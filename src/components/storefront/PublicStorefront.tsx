import React, { useState, useMemo, useEffect } from "react";
import {
  Store,
  Wifi,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Star,
  BadgeCheck,
  Clock,
  ArrowLeft,
  Tag,
  CreditCard,
  Lock,
  ExternalLink,
  Info,
  Radio,
  Share2,
  Layers,
  GraduationCap,
  PhoneCall,
  UserCheck,
  Mail,
  User,
} from "lucide-react";
import {
  AgentStoreConfig,
  DataBundle,
  TelecomNetwork,
  Order,
  UserRole,
} from "../../types";
import { detectGhanaNetwork, INITIAL_CHECKERS } from "../../mockData";
import { SignalRail } from "../common/SignalRail";
import { StorefrontNavbar } from "./StorefrontNavbar";
import { StorefrontShareModal } from "./StorefrontShareModal";
import { StorePausedNotice } from "./StorePausedNotice";
import { PublicFooter } from "../public/sections/PublicFooter";

interface PublicStorefrontProps {
  storeConfig: AgentStoreConfig;
  bundles: DataBundle[];
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  onSwitchToSDH: () => void;
  onUpdateStoreConfig?: (newConfig: AgentStoreConfig) => void;
  onNavigatePublicTab?: (tab: any) => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  storeConfig,
  bundles,
  onOrderCreated,
  onOpenReceipt,
  onSwitchToSDH,
  onUpdateStoreConfig,
  onNavigatePublicTab = () => {},
  onNavigateToLegal = () => {},
}) => {
  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Active Service Tab (Data Bundles vs Airtime vs Checkers vs AFA)
  const [activeService, setActiveService] = useState<
    "data" | "airtime" | "checker" | "afa"
  >("data");

  // Determine enabled networks from storeConfig
  const availableNetworks: TelecomNetwork[] = useMemo(() => {
    const raw = storeConfig.enabledNetworks || ["MTN", "Telecel", "AirtelTigo"];
    const filtered = raw.filter((n) =>
      ["MTN", "Telecel", "AirtelTigo"].includes(n as any),
    ) as TelecomNetwork[];
    return filtered.length > 0 ? filtered : ["MTN", "Telecel", "AirtelTigo"];
  }, [storeConfig.enabledNetworks]);

  // Network selection state (guarantee it is one of the enabled networks)
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>(() => {
    if (
      storeConfig.defaultNetwork &&
      availableNetworks.includes(storeConfig.defaultNetwork)
    ) {
      return storeConfig.defaultNetwork;
    }
    return availableNetworks[0] || "MTN";
  });

  // Auto-switch selectedNetwork if enabled networks update and current is no longer enabled
  useEffect(() => {
    if (!availableNetworks.includes(selectedNetwork)) {
      setSelectedNetwork(availableNetworks[0] || "MTN");
    }
  }, [availableNetworks, selectedNetwork]);

  const [selectedBundleId, setSelectedBundleId] = useState<string>(() => {
    const match = bundles.find((b) => b.network === selectedNetwork);
    return match ? match.id : bundles[0]?.id || "mtn-5gb";
  });

  // Result Checker Selection (if checkers enabled)
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>(
    INITIAL_CHECKERS[0]?.id || "waec-wassce",
  );

  // Airtime Amount (if airtime enabled)
  const [airtimeAmount, setAirtimeAmount] = useState<number>(10);

  // Customer Checkout Form Inputs
  const [recipientPhone, setRecipientPhone] = useState<string>("0244192834");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [momoProvider, setMomoProvider] = useState<"MTN" | "Telecel" | "AT">(
    "MTN",
  );
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "card">("momo");
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string>("");
  const [promoSuccess, setPromoSuccess] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<
    "all" | "small" | "medium" | "large"
  >("all");
  const [copiedRef, setCopiedRef] = useState(false);

  // Checkout Execution State
  const [checkoutStep, setCheckoutStep] = useState<
    "form" | "authorizing" | "dispatching" | "completed"
  >("form");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Filter bundles for selected network
  const networkBundles = useMemo(() => {
    return bundles.filter((b) => b.network === selectedNetwork);
  }, [bundles, selectedNetwork]);

  // Filter by size
  const filteredBundles = useMemo(() => {
    return networkBundles.filter((b) => {
      const gb = parseFloat(b.sizeLabel.replace(/[^0-9.]/g, "")) || 0;
      if (sizeFilter === "small") return gb < 5;
      if (sizeFilter === "medium") return gb >= 5 && gb <= 20;
      if (sizeFilter === "large") return gb > 20;
      return true;
    });
  }, [networkBundles, sizeFilter]);

  // Compute retail price with agent custom price or margin markup percent
  const getAgentPrice = (b: DataBundle) => {
    if (storeConfig.customPrices && storeConfig.customPrices[b.id]) {
      return storeConfig.customPrices[b.id];
    }
    const markup =
      typeof storeConfig.marginMarkupPercent === "number"
        ? storeConfig.marginMarkupPercent
        : 8;
    return Number((b.wholesalePrice * (1 + markup / 100)).toFixed(2));
  };

  const currentBundle =
    bundles.find((b) => b.id === selectedBundleId) ||
    networkBundles[0] ||
    bundles[0];

  const currentChecker =
    INITIAL_CHECKERS.find((c) => c.id === selectedCheckerId) ||
    INITIAL_CHECKERS[0];

  // Base price according to active service
  const baseRetailPrice = useMemo(() => {
    if (activeService === "data") {
      return currentBundle ? getAgentPrice(currentBundle) : 0;
    }
    if (activeService === "airtime") {
      return airtimeAmount;
    }
    if (activeService === "checker") {
      return currentChecker ? currentChecker.price : 24.0;
    }
    if (activeService === "afa") {
      return 25.0; // Standard AFA registration processing fee
    }
    return 0;
  }, [
    activeService,
    currentBundle,
    airtimeAmount,
    currentChecker,
    storeConfig,
  ]);

  // Calculate discount if promo code applied
  const discountAmount = appliedDiscount
    ? Number(((baseRetailPrice * appliedDiscount.percent) / 100).toFixed(2))
    : 0;

  const finalPrice = Math.max(
    0,
    Number((baseRetailPrice - discountAmount).toFixed(2)),
  );

  const agentMargin = useMemo(() => {
    if (activeService === "data" && currentBundle) {
      return Math.max(
        0,
        Number((finalPrice - currentBundle.wholesalePrice).toFixed(2)),
      );
    }
    if (activeService === "airtime") {
      return Number((airtimeAmount * 0.04).toFixed(2)); // 4% airtime margin
    }
    if (activeService === "checker") {
      return 3.5; // Fixed GH₵ 3.50 margin per checker voucher
    }
    if (activeService === "afa") {
      return 10.0; // Agent commission for AFA farmer registration
    }
    return 0;
  }, [activeService, finalPrice, currentBundle, airtimeAmount]);

  // Phone input carrier auto-detection
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setRecipientPhone(clean);
    if (clean.length >= 3) {
      const detected = detectGhanaNetwork(clean);
      if (
        detected !== selectedNetwork &&
        availableNetworks.includes(detected)
      ) {
        setSelectedNetwork(detected);
        setMomoProvider(
          detected === "AirtelTigo" ? "AT" : (detected as "MTN" | "Telecel"),
        );
        const match = bundles.find((b) => b.network === detected);
        if (match) setSelectedBundleId(match.id);
      }
    }
  };

  // Promo Code Validation
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    // Check store promo codes or platform fallback codes
    const found = storeConfig.promoCodes?.find(
      (p) => p.code.toUpperCase() === code && p.active,
    );
    if (found) {
      setAppliedDiscount({
        code: found.code,
        percent: found.discountPercent || 10,
      });
      setPromoSuccess(
        `Promo applied! ${found.discountPercent}% discount activated.`,
      );
    } else if (code === "DATA5" || code === "SAVE5") {
      setAppliedDiscount({ code, percent: 5 });
      setPromoSuccess("Promo applied! 5% discount activated.");
    } else if (code === "GHANA10" || code === "WELCOME10") {
      setAppliedDiscount({ code, percent: 10 });
      setPromoSuccess("Promo applied! 10% discount activated.");
    } else {
      setPromoError("Invalid or expired promo code for this store.");
    }
  };

  // Start Checkout Dispatch
  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || recipientPhone.length < 10) {
      alert(
        "Please provide a valid 10-digit Ghana mobile number (e.g. 0244192834).",
      );
      return;
    }

    if (storeConfig.allowGuestCheckout === false && !customerName.trim()) {
      alert("Please provide your full name as required by this merchant.");
      return;
    }

    setCheckoutStep("authorizing");
    setDispatchProgress(25);

    const ref = `KT-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let productName = `${currentBundle.name} (${storeConfig.storeName})`;
    let serviceType: any = "data";

    if (activeService === "airtime") {
      productName = `${selectedNetwork} GH₵ ${airtimeAmount} Airtime Top-Up`;
      serviceType = "airtime";
    } else if (activeService === "checker") {
      productName = `${currentChecker.title} Voucher`;
      serviceType = "checker";
    } else if (activeService === "afa") {
      productName = "AFA Ministry Farmers Registration Service";
      serviceType = "afa";
    }

    const newOrder: Order = {
      id: `ord-st-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: customerName.trim() || "Storefront Buyer",
      recipientPhone,
      network: selectedNetwork,
      serviceType,
      productName,
      amount: finalPrice,
      paymentMethod:
        momoProvider === "MTN"
          ? "momo_mtn"
          : momoProvider === "Telecel"
            ? "momo_telecel"
            : "momo_at",
      status: "delivered",
      agentMargin,
      deliveryTimeline: [
        {
          step: `Order Placed on ${storeConfig.storeName}`,
          timestamp: "10:00:01",
          status: "completed",
        },
        {
          step: `${momoProvider} MoMo Payment Received`,
          timestamp: "10:00:04",
          status: "completed",
        },
        {
          step: "SDH Core Gateway EVD Dispatched",
          timestamp: "10:00:09",
          status: "completed",
        },
        {
          step: "Beneficiary Balance Credited",
          timestamp: "10:00:15",
          status: "completed",
          note: "Direct switch handshake verified",
        },
      ],
    };

    // Stage 1: MoMo Prompt push
    setTimeout(() => {
      setCheckoutStep("dispatching");
      setDispatchProgress(70);

      // Stage 2: Carrier Core EVD Dispatch
      setTimeout(() => {
        setDispatchProgress(100);
        setCheckoutStep("completed");
        onOrderCreated(newOrder);
        setCompletedOrder(newOrder);
      }, 1500);
    }, 1500);
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const openWhatsAppHelp = () => {
    const phone = storeConfig.whatsappNumber.replace(/^0/, "");
    const text = encodeURIComponent(
      `Hello ${storeConfig.storeName}, I have a question about purchasing data from your storefront.`,
    );
    window.open(`https://wa.me/233${phone}?text=${text}`, "_blank");
  };

  const themeColor = storeConfig.themeColor || "#2563eb";
  const isPaused =
    storeConfig.status === "paused" || storeConfig.status === "draft";

  // Check which services are enabled
  const hasAirtime = !!storeConfig.enabledServices?.airtime;
  const hasChecker = !!storeConfig.enabledServices?.checker;
  const hasAfa = !!storeConfig.enabledServices?.afa;
  const hasMultipleServices = hasAirtime || hasChecker || hasAfa;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* 1. CUSTOM TOP STOREFRONT NAVBAR */}
      <StorefrontNavbar
        store={storeConfig}
        onOpenShare={() => setIsShareModalOpen(true)}
        onSwitchToSDH={onSwitchToSDH}
      />

      {/* 2. MAIN STOREFRONT CONTENT CONTAINER */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* IF STORE IS PAUSED: RENDER HIGH-CRAFT PAUSED NOTICE */}
        {isPaused ? (
          <StorePausedNotice
            store={storeConfig}
            onGoLive={
              onUpdateStoreConfig
                ? () =>
                    onUpdateStoreConfig({
                      ...storeConfig,
                      status: "published",
                    })
                : undefined
            }
            onSwitchToSDH={onSwitchToSDH}
          />
        ) : (
          <>
            {/* HERO STOREFRONT BANNER */}
            <div
              className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg"
              style={{
                borderColor: storeConfig.themeColor
                  ? `${storeConfig.themeColor}35`
                  : undefined,
              }}
            >
              {/* Subtle Ambient Background Gradient */}
              <div
                className="absolute top-0 inset-x-0 h-36 pointer-events-none transition-all"
                style={{
                  background: storeConfig.themeColor
                    ? `linear-gradient(135deg, ${storeConfig.themeColor}35 0%, rgba(245, 158, 11, 0.22) 50%, ${storeConfig.themeColor}18 100%)`
                    : "linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(245, 158, 11, 0.20) 50%, rgba(37, 99, 235, 0.15) 100%)",
                }}
              />
              <div className="absolute -top-12 -right-12 size-48 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
              <div
                className="absolute -bottom-10 -left-10 size-40 rounded-full pointer-events-none"
                style={{
                  background: storeConfig.themeColor
                    ? `${storeConfig.themeColor}15`
                    : "rgba(37, 99, 235, 0.12)",
                  filter: "blur(28px)",
                }}
              />

              <div className="relative p-6 sm:p-8 pt-10 sm:pt-12 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {storeConfig.storeLogo ? (
                      <img
                        src={storeConfig.storeLogo}
                        alt={storeConfig.storeName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md ring-4 ring-card shrink-0 border border-border"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl flex items-center justify-center text-white shadow-md ring-4 ring-card shrink-0"
                        style={{ background: themeColor }}
                      >
                        {storeConfig.storeName
                          ? storeConfig.storeName.slice(0, 2).toUpperCase()
                          : "ST"}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                          {storeConfig.storeName}
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified Reseller
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
                        {storeConfig.tagline ||
                          "Authorized telecom data reseller in Ghana."}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-semibold mt-2">
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>4.98 (3,400+ satisfied buyers)</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ⚡ 15-45s SLA Instant Delivery
                        </span>
                        {storeConfig.phone && (
                          <>
                            <span>•</span>
                            <a
                              href={`tel:${storeConfig.phone}`}
                              className="hover:underline flex items-center gap-1"
                            >
                              <PhoneCall className="w-3 h-3 text-primary" />
                              <span>{storeConfig.phone}</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Announcement Bar (if set in Store Builder) */}
                {storeConfig.announcement && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-xs font-medium flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{storeConfig.announcement}</span>
                  </div>
                )}

                {/* WhatsApp VIP Channel Link */}
                {storeConfig.whatsappChannelUrl && (
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Join {storeConfig.storeName} VIP Broadcast Channel for
                        Flash Deals
                      </span>
                    </div>
                    <a
                      href={storeConfig.whatsappChannelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Quick SLA Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
                  <div className="p-2 rounded-xl bg-muted/40">
                    <div className="text-xs font-black text-foreground">
                      Affordable Packages
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Great Value
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/40">
                    <div className="text-xs font-black text-foreground">
                      Direct Carrier EVD
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Automated Switch
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/40">
                    <div className="text-xs font-black text-foreground">
                      100% Guaranteed
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Reliable Service
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SERVICE SELECTOR TABS (Only shown if merchant enabled Airtime, Checker, or AFA) */}
            {hasMultipleServices && (
              <div className="p-1.5 rounded-2xl bg-muted/70 border border-border flex flex-wrap gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveService("data")}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                    activeService === "data"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Wifi className="w-4 h-4 text-primary" />
                  <span>Data Bundles</span>
                </button>

                {hasAirtime && (
                  <button
                    type="button"
                    onClick={() => setActiveService("airtime")}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                      activeService === "airtime"
                        ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Airtime Recharge</span>
                  </button>
                )}

                {hasChecker && (
                  <button
                    type="button"
                    onClick={() => setActiveService("checker")}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                      activeService === "checker"
                        ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    <span>Result Checkers</span>
                  </button>
                )}

                {hasAfa && (
                  <button
                    type="button"
                    onClick={() => setActiveService("afa")}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                      activeService === "afa"
                        ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <span>AFA Farmer Registration</span>
                  </button>
                )}
              </div>
            )}

            {/* MAIN PURCHASING SHELL */}
            {checkoutStep === "form" && (
              <form onSubmit={handleStartCheckout} className="space-y-6">
                {/* STEP 1: Select Telecom Network (Filtered by storeConfig.enabledNetworks) */}
                <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Step 1 of 3
                      </span>
                      <h2 className="text-base font-extrabold text-foreground">
                        Select Telecom Carrier
                      </h2>
                    </div>
                    <SignalRail
                      status="online"
                      size="sm"
                      label="Gateway Connected"
                    />
                  </div>

                  <div
                    className={`grid gap-3 ${
                      availableNetworks.length === 1
                        ? "grid-cols-1 max-w-sm"
                        : availableNetworks.length === 2
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-3"
                    }`}
                  >
                    {/* MTN Card (if enabled) */}
                    {availableNetworks.includes("MTN") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNetwork("MTN");
                          setMomoProvider("MTN");
                          const first = bundles.find(
                            (b) => b.network === "MTN",
                          );
                          if (first) setSelectedBundleId(first.id);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedNetwork === "MTN"
                            ? "bg-amber-400/10 border-amber-500 ring-2 ring-amber-500/30"
                            : "border-border/80 bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                            MTN
                          </div>
                          {selectedNetwork === "MTN" && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-sm text-foreground">
                          MTN Ghana
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Turbonet & Non-Expiry
                        </div>
                        <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ● Latency: 28ms • 99.9%
                        </div>
                      </button>
                    )}

                    {/* Telecel Card (if enabled) */}
                    {availableNetworks.includes("Telecel") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNetwork("Telecel");
                          setMomoProvider("Telecel");
                          const first = bundles.find(
                            (b) => b.network === "Telecel",
                          );
                          if (first) setSelectedBundleId(first.id);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedNetwork === "Telecel"
                            ? "bg-red-500/10 border-red-500 ring-2 ring-red-500/30"
                            : "border-border/80 bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            TC
                          </div>
                          {selectedNetwork === "Telecel" && (
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-sm text-foreground">
                          Telecel Ghana
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Extra & Non-Expiry
                        </div>
                        <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ● Latency: 32ms • 99.8%
                        </div>
                      </button>
                    )}

                    {/* AirtelTigo Card (if enabled) */}
                    {availableNetworks.includes("AirtelTigo") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNetwork("AirtelTigo");
                          setMomoProvider("AT");
                          const first = bundles.find(
                            (b) => b.network === "AirtelTigo",
                          );
                          if (first) setSelectedBundleId(first.id);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          selectedNetwork === "AirtelTigo"
                            ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30"
                            : "border-border/80 bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            AT
                          </div>
                          {selectedNetwork === "AirtelTigo" && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-sm text-foreground">
                          AT (AirtelTigo)
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Big Time Non-Expiry
                        </div>
                        <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ● Latency: 34ms • 99.7%
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* STEP 2: Choose Product Package according to activeService */}
                {activeService === "data" && (
                  <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-primary">
                          Step 2 of 3
                        </span>
                        <h2 className="text-base font-extrabold text-foreground">
                          Choose{" "}
                          {selectedNetwork === "AirtelTigo"
                            ? "AT"
                            : selectedNetwork}{" "}
                          Data Bundle
                        </h2>
                      </div>

                      {/* Size filter tabs */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 text-xs">
                        {(["all", "small", "medium", "large"] as const).map(
                          (sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setSizeFilter(sz)}
                              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                                sizeFilter === sz
                                  ? "bg-card text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {sz === "all"
                                ? "All"
                                : sz === "small"
                                  ? "<5GB"
                                  : sz === "medium"
                                    ? "5-20GB"
                                    : "20GB+"}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Packages Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredBundles.map((b) => {
                        const isSelected = selectedBundleId === b.id;
                        const price = getAgentPrice(b);
                        const gigabytes =
                          parseFloat(b.sizeLabel.replace(/[^0-9.]/g, "")) || 1;
                        const pricePerGb = (price / gigabytes).toFixed(2);

                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBundleId(b.id)}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]"
                                : "border-border/80 bg-background hover:border-border hover:bg-muted/30"
                            }`}
                          >
                            {b.isPopular && (
                              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-xs">
                                Popular
                              </span>
                            )}

                            <div>
                              <div className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                                {b.sizeLabel}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                {b.validity}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                ~GH₵ {pricePerGb}/GB
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-border/60 flex items-baseline justify-between">
                              <span className="text-base font-black text-foreground tabular-nums">
                                GH₵ {price.toFixed(2)}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Airtime Selection if activeService === "airtime" */}
                {activeService === "airtime" && (
                  <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Step 2 of 3
                      </span>
                      <h2 className="text-base font-extrabold text-foreground">
                        Select Airtime Amount
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {[5, 10, 20, 50, 100, 200].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAirtimeAmount(amt)}
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            airtimeAmount === amt
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-background border-border hover:bg-muted text-foreground"
                          }`}
                        >
                          GH₵ {amt}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-foreground">
                        Or Custom Airtime (GH₵)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={airtimeAmount}
                        onChange={(e) =>
                          setAirtimeAmount(Number(e.target.value) || 5)
                        }
                        className="w-full sm:w-48 px-3 py-2 rounded-xl border border-input bg-background text-sm font-bold tabular-nums"
                      />
                    </div>
                  </div>
                )}

                {/* Result Checker Selection if activeService === "checker" */}
                {activeService === "checker" && (
                  <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Step 2 of 3
                      </span>
                      <h2 className="text-base font-extrabold text-foreground">
                        Select Result Placement / Examination Checker
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {INITIAL_CHECKERS.map((c) => {
                        const isSelected = selectedCheckerId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCheckerId(c.id)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-border bg-background hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-sm text-foreground">
                                {c.title}
                              </span>
                              <span className="font-black text-sm text-foreground tabular-nums">
                                GH₵ {c.price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {c.description}
                            </p>
                            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              ● Instant SMS Serial & PIN Delivery
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: Beneficiary & Checkout */}
                <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Step 3 of 3
                    </span>
                    <h2 className="text-base font-extrabold text-foreground">
                      Beneficiary & MoMo Checkout
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct automated delivery via {storeConfig.storeName} core
                      EVD gateway.
                    </p>
                  </div>

                  {/* Customer Information (if allowGuestCheckout is false) */}
                  {storeConfig.allowGuestCheckout === false && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                      <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-amber-600" />
                        <span>
                          Customer Identification Required by Merchant
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground">
                            Your Full Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Kwame Mensah"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs focus:ring-1 focus:ring-primary outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground">
                            Email Address (For e-Receipt)
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type="email"
                              placeholder="kwame@example.com"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs focus:ring-1 focus:ring-primary outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Recipient Phone Number</span>
                      </label>

                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="024XXXXXXX"
                          value={recipientPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm tabular-nums focus:ring-2 focus:ring-primary focus:border-primary outline-hidden"
                        />
                        <div className="absolute right-2.5 top-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-foreground border border-border">
                            {selectedNetwork}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-muted-foreground">
                          Quick test:
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePhoneChange("0244192834")}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          0244192834 (MTN)
                        </button>
                        <span className="text-muted-foreground text-xs">•</span>
                        <button
                          type="button"
                          onClick={() => handlePhoneChange("0208123456")}
                          className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          0208123456 (Telecel)
                        </button>
                      </div>
                    </div>

                    {/* Payment Channel Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground">
                        Mobile Money Provider
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setMomoProvider("MTN")}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            momoProvider === "MTN"
                              ? "border-amber-500 bg-amber-400/15 text-amber-950 dark:text-amber-300 ring-1 ring-amber-500"
                              : "border-border bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          MTN MoMo
                        </button>
                        <button
                          type="button"
                          onClick={() => setMomoProvider("Telecel")}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            momoProvider === "Telecel"
                              ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500"
                              : "border-border bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          Telecel Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setMomoProvider("AT")}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                            momoProvider === "AT"
                              ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                              : "border-border bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          AT Money
                        </button>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Secured by Bank of Ghana MoMo Gateway Rails</span>
                      </div>
                    </div>
                  </div>

                  {/* Promo Code Strip */}
                  <div className="space-y-2 pt-4 border-t border-border/60">
                    <label className="text-xs font-bold text-foreground">
                      Promo Code
                    </label>

                    <div className="flex w-full items-end gap-2 sm:w-1/2">
                      <div className="relative min-w-0 flex-1">
                        <Tag className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />

                        <input
                          type="text"
                          placeholder="Promo Code"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm tabular-nums focus:ring-2 focus:ring-primary focus:border-primary outline-hidden"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="h-10 shrink-0 px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Order Breakdown Summary & Checkout Action */}
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-semibold">Selected Product:</span>
                      <span className="font-bold text-foreground">
                        {activeService === "data"
                          ? `${currentBundle.name} (${currentBundle.validity})`
                          : activeService === "airtime"
                            ? `${selectedNetwork} GH₵ ${airtimeAmount} Airtime`
                            : currentChecker.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-semibold">Target Carrier:</span>
                      <span className="font-bold text-foreground">
                        {selectedNetwork}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-semibold">
                        Beneficiary Handset:
                      </span>
                      <span className="font-bold text-foreground">
                        {recipientPhone || "Not entered"}
                      </span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="font-semibold">
                          Discount ({appliedDiscount.percent}%):
                        </span>
                        <span>- GH₵ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-semibold">
                        Network Delivery Surcharge:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        FREE (GH₵ 0.00)
                      </span>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                          Total Payable
                        </span>
                        <div className="text-3xl font-black text-foreground tabular-nums">
                          GH₵ {finalPrice.toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer hover:opacity-90"
                        style={{ background: themeColor }}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>
                          Authorize MoMo Push (GH₵ {finalPrice.toFixed(2)})
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Checkout In-Flight Simulation Screen */}
            {(checkoutStep === "authorizing" ||
              checkoutStep === "dispatching") && (
              <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in-50">
                <div className="relative w-20 h-20 mx-auto">
                  <div
                    className="w-20 h-20 rounded-full border-4 border-t-transparent animate-spin"
                    style={{
                      borderColor: `${themeColor}30`,
                      borderTopColor: themeColor,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-black text-foreground">
                    {checkoutStep === "authorizing"
                      ? "Pushing Mobile Money Prompt..."
                      : "Routing Carrier Direct EVD..."}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {checkoutStep === "authorizing"
                      ? `Please approve the GH₵ ${finalPrice.toFixed(2)} prompt sent to ${recipientPhone} on your handset.`
                      : `Handshake verified! Crediting data on the ${selectedNetwork} core switch.`}
                  </p>
                </div>

                {/* Visual Step Pipeline */}
                <div className="max-w-md mx-auto space-y-2 text-left bg-muted/40 p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>MoMo Payment Gateway Authenticated</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${checkoutStep === "dispatching" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
                    />
                    <span>Carrier HLR/IN Switch Handshake</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${dispatchProgress === 100 ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                    />
                    <span>Beneficiary SIM Balance Credited</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${dispatchProgress}%`,
                      background: themeColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Completed State: Digital Receipt & Confirmation */}
            {checkoutStep === "completed" && completedOrder && (
              <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Dispatched & Credited
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                    Recharge Successful!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    <strong>{completedOrder.productName}</strong> has been
                    dispatched to{" "}
                    <strong className="text-foreground">
                      {completedOrder.recipientPhone}
                    </strong>{" "}
                    via {storeConfig.storeName}.
                  </p>
                </div>

                {/* Order Details Card */}
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">
                      Transaction Reference:
                    </span>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <span>{completedOrder.reference}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyReference(completedOrder.reference)
                        }
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedRef ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">
                      Carrier Switch:
                    </span>
                    <span className="font-bold text-foreground">
                      {completedOrder.network} Core EVD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Amount Paid:</span>
                    <span className="font-black text-foreground tabular-nums">
                      GH₵ {completedOrder.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Timestamp:</span>
                    <span className="text-foreground">
                      {completedOrder.date}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(completedOrder)}
                    className="flex-1 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-bold text-xs hover:bg-muted transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <span>View Official Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep("form");
                      setCompletedOrder(null);
                      setDispatchProgress(0);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-90"
                    style={{ background: themeColor }}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Buy Another Package</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. STOREFRONT SHARE KIT DIALOG MODAL */}
      <StorefrontShareModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        store={storeConfig}
      />

      {/* 4. OFFICIAL PUBLIC FOOTER WITH SDH ECOSYSTEM ATTRIBUTION & TELECOM BADGES */}
      <PublicFooter
        onNavigatePublicTab={onNavigatePublicTab}
        onNavigateToLegal={onNavigateToLegal}
      />
    </div>
  );
};

export default PublicStorefront;
