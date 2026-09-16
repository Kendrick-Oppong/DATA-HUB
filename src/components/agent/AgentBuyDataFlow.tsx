import React, { useState, useEffect } from "react";
import {
  Wifi,
  Smartphone,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  TelecomNetwork,
  DataBundle,
  Order,
  VerificationStatus,
} from "../../types";
import { detectGhanaNetwork } from "../../mockData";
import {
  verifyPhoneNumber,
  normalizePhoneNumber,
} from "../../mockVerificationData";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";

interface AgentBuyDataFlowProps {
  bundles: DataBundle[];
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  initialBundleId?: string;
  initialNetwork?: TelecomNetwork;
}

export const AgentBuyDataFlow: React.FC<AgentBuyDataFlowProps> = ({
  bundles,
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
  initialBundleId,
  initialNetwork = "MTN",
}) => {
  const [step, setStep] = useState<
    "network" | "recipient" | "bundle" | "review" | "processing" | "success"
  >("network");

  const [selectedNetwork, setSelectedNetwork] =
    useState<TelecomNetwork>(initialNetwork);
  const [mtnTier, setMtnTier] = useState<"standard" | "xpress">(() => {
    if (initialBundleId && initialBundleId.includes("xpress")) return "xpress";
    return "standard";
  });
  const [atTier, setAtTier] = useState<"ishare" | "bigtime">(() => {
    if (initialBundleId && initialBundleId.includes("bigtime")) return "bigtime";
    return "ishare";
  });
  const [selectedBundleId, setSelectedBundleId] = useState<string>(() => {
    if (initialBundleId) return initialBundleId;
    if (initialNetwork === "MTN") {
      return (
        bundles.find(
          (b) => b.network === "MTN" && (b.tier || "standard") === "standard",
        )?.id || "mtn-5gb"
      );
    }
    if (initialNetwork === "AirtelTigo") {
      return (
        bundles.find(
          (b) => b.network === "AirtelTigo" && (b.tier || "ishare") === "ishare",
        )?.id || "at-ishare-5gb"
      );
    }
    return (
      bundles.find((b) => b.network === initialNetwork)?.id || "telecel-5gb"
    );
  });
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "momo_mtn" | "momo_telecel" | "momo_at"
  >("wallet");
  const [inputMode, setInputMode] = useState<"cards" | "text" | "bulk">(
    "cards",
  );
  const [bulkNumbersText, setBulkNumbersText] = useState<string>("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Verification state
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>("");

  useEffect(() => {
    if (initialNetwork) {
      setSelectedNetwork(initialNetwork);
    }
    if (initialBundleId) {
      setSelectedBundleId(initialBundleId);
      if (initialBundleId.includes("xpress")) {
        setMtnTier("xpress");
      } else if (initialBundleId.includes("mtn")) {
        setMtnTier("standard");
      }
      if (initialBundleId.includes("bigtime")) {
        setAtTier("bigtime");
      } else if (initialBundleId.includes("ishare")) {
        setAtTier("ishare");
      }
    }
  }, [initialBundleId, initialNetwork]);

  const handleTierChange = (newTier: "standard" | "xpress") => {
    setMtnTier(newTier);
    const curSize = currentBundle?.sizeGb;
    const match =
      bundles.find(
        (b) =>
          b.network === "MTN" &&
          (b.tier || "standard") === newTier &&
          b.sizeGb === curSize,
      ) ||
      bundles.find(
        (b) => b.network === "MTN" && (b.tier || "standard") === newTier,
      );
    if (match) {
      setSelectedBundleId(match.id);
    }
  };

  const handleAtTierChange = (newTier: "ishare" | "bigtime") => {
    setAtTier(newTier);
    const curSize = currentBundle?.sizeGb;
    const match =
      bundles.find(
        (b) =>
          b.network === "AirtelTigo" &&
          (b.tier || "ishare") === newTier &&
          b.sizeGb === curSize,
      ) ||
      bundles.find(
        (b) => b.network === "AirtelTigo" && (b.tier || "ishare") === newTier,
      );
    if (match) {
      setSelectedBundleId(match.id);
    }
  };

  const steps = [
    { id: "network", label: "Network", icon: Wifi },
    { id: "recipient", label: "Recipient", icon: Smartphone },
    { id: "bundle", label: "Bundle", icon: CheckCircle2 },
    { id: "review", label: "Review", icon: CheckCircle2 },
  ];

  const filteredBundles = bundles.filter((b) => {
    if (b.network !== selectedNetwork) return false;
    if (selectedNetwork === "MTN") {
      return (b.tier || "standard") === mtnTier;
    }
    if (selectedNetwork === "AirtelTigo") {
      return (b.tier || "ishare") === atTier;
    }
    return true; // Telecel: no tier option, regular picker
  });
  const currentBundle =
    filteredBundles.find((b) => b.id === selectedBundleId) ||
    filteredBundles[0] ||
    bundles.find((b) => b.network === selectedNetwork) ||
    bundles[0];

  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    if (val.length >= 3) {
      const detected = detectGhanaNetwork(val);
      if (detected !== selectedNetwork) {
        setSelectedNetwork(detected);
        let match: DataBundle | undefined;
        if (detected === "MTN") {
          match = bundles.find(
            (b) =>
              b.network === "MTN" &&
              (b.tier || "standard") === mtnTier,
          );
        } else if (detected === "AirtelTigo") {
          match = bundles.find(
            (b) =>
              b.network === "AirtelTigo" &&
              (b.tier || "ishare") === atTier,
          );
        } else {
          match = bundles.find((b) => b.network === detected);
        }
        if (match) setSelectedBundleId(match.id);
      }
    }
  };

  // Automatic verification for MTN recipients
  useEffect(() => {
    if (selectedNetwork === "MTN" && recipientPhone.length >= 10) {
      setIsVerifying(true);
      setVerificationStatus(null);
      setVerificationMessage("");

      // Simulate verification delay
      setTimeout(() => {
        const verification = verifyPhoneNumber(recipientPhone);
        setVerificationStatus(verification.status);
        setVerificationMessage(verification.explanation);
        setIsVerifying(false);
      }, 800);
    } else if (selectedNetwork !== "MTN") {
      // Reset verification for non-MTN networks
      setVerificationStatus(null);
      setVerificationMessage("");
    }
  }, [recipientPhone, selectedNetwork]);

  const validateStep = (currentStep: string): boolean => {
    switch (currentStep) {
      case "network":
        return !!selectedNetwork;
      case "bundle":
        return !!selectedBundleId;
      case "recipient":
        return (
          recipientPhone.length >= 10 &&
          (selectedNetwork !== "MTN" || verificationStatus === "verified")
        );
      case "review":
        return (
          paymentMethod !== "wallet" ||
          walletBalance >= currentBundle.retailPrice
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      if (step === "network") alert("Please select a network.");
      if (step === "recipient")
        alert("Please enter a valid 10-digit phone number.");
      if (step === "bundle") alert("Please select a data bundle.");
      if (step === "review")
        alert("Insufficient wallet balance. Please choose Mobile Money.");
      return;
    }

    if (step === "network") setStep("recipient");
    else if (step === "recipient") setStep("bundle");
    else if (step === "bundle") setStep("review");
  };

  const handleBack = () => {
    if (step === "recipient") setStep("network");
    else if (step === "bundle") setStep("recipient");
    else if (step === "review") setStep("bundle");
  };

  const handleSubmit = () => {
    if (!validateStep("review")) return;

    setStep("processing");

    const newRef = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      reference: newRef,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: "Kojo Mensah",
      recipientPhone,
      network: selectedNetwork,
      serviceType: "data",
      productName: currentBundle.name,
      amount: currentBundle.retailPrice,
      paymentMethod,
      status: "delivered",
      agentMargin: Number(
        (currentBundle.retailPrice - currentBundle.wholesalePrice).toFixed(2),
      ),
      deliveryTimeline: [
        {
          step: "Order Authorized",
          timestamp: "10:00:01",
          status: "completed",
          note: `Paid via ${paymentMethod.replace("_", " ")}${
            selectedNetwork === "MTN"
              ? ` · ${mtnTier === "xpress" ? "Xpress Priority Queue" : "Standard Queue"}`
              : selectedNetwork === "AirtelTigo"
              ? ` · ${atTier === "bigtime" ? "BigTime Non-Expiry" : "iShare Instant"}`
              : ""
          }`,
        },
        {
          step: "Core Gateway Dispatch",
          timestamp: "10:00:05",
          status: "completed",
          note: `${selectedNetwork} Carrier Node (${
            selectedNetwork === "MTN"
              ? mtnTier === "xpress"
                ? "Fast-Track Priority Queue"
                : "Standard EVD"
              : selectedNetwork === "AirtelTigo"
              ? atTier === "bigtime"
                ? "BigTime Non-Expiry Rail"
                : "iShare Instant Gateway"
              : "Direct Telecel Switch"
          })`,
        },
        {
          step: "Network Acknowledged",
          timestamp: "10:00:12",
          status: "completed",
          note: "EVD Batch Accepted",
        },
        {
          step: "Delivered to Beneficiary",
          timestamp: "10:00:19",
          status: "completed",
          note: "Customer balance credited",
        },
      ],
    };

    setTimeout(() => {
      onOrderCreated(newOrder);
      setCreatedOrder(newOrder);
      setStep("success");
    }, 2400);
  };

  const handleCopyRef = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Wifi className="w-6 h-6 text-primary" />
            <span>Buy Data Bundle</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Non-expiry and high-speed data for MTN, Telecel, and AirtelTigo.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="Gateways Live" />
      </div>

      {/* Step Indicator */}
      {step !== "processing" && step !== "success" && (
        <Card className="border-border shadow-xs p-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = currentStepIndex === idx;
                const isCompleted = currentStepIndex > idx;
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                            : isCompleted
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mb-6 ${
                          isCompleted ? "bg-emerald-500" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {step === "network" && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Select Telecom Carrier
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the mobile network for your data bundle.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(["MTN", "Telecel", "AirtelTigo"] as TelecomNetwork[]).map(
                (net) => {
                  const isSelected = selectedNetwork === net;
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => {
                        setSelectedNetwork(net);
                        let first: DataBundle | undefined;
                        if (net === "MTN") {
                          first = bundles.find(
                            (b) =>
                              b.network === "MTN" &&
                              (b.tier || "standard") === mtnTier,
                          );
                        } else if (net === "AirtelTigo") {
                          first = bundles.find(
                            (b) =>
                              b.network === "AirtelTigo" &&
                              (b.tier || "ishare") === atTier,
                          );
                        } else {
                          first = bundles.find((b) => b.network === net);
                        }
                        if (first) setSelectedBundleId(first.id);
                      }}
                      className={`py-4 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? net === "MTN"
                            ? "bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-500/30 font-bold"
                            : net === "Telecel"
                              ? "bg-red-600 text-white border-red-700 ring-2 ring-red-500/30 font-bold"
                              : "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 font-bold"
                          : "border-border bg-muted/40 hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="text-sm font-extrabold">{net}</div>
                      <div className="text-[10px] mt-1 opacity-85">
                        Instant EVD
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {/* MTN Delivery Option (Standard vs Xpress) */}
            {selectedNetwork === "MTN" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    MTN Delivery Option
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Select delivery priority
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTierChange("standard")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      mtnTier === "standard"
                        ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500" />
                        Standard
                      </div>
                      {mtnTier === "standard" && (
                        <Check className="size-4 text-amber-600 dark:text-amber-400 stroke-3" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Regular MTN bundles · standard validity
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTierChange("xpress")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      mtnTier === "xpress"
                        ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                        Xpress
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-500 text-amber-950">
                          Priority
                        </span>
                      </div>
                      {mtnTier === "xpress" && (
                        <Check className="size-4 text-amber-600 dark:text-amber-400 stroke-3" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Express delivery · priority queue
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* AirtelTigo / AT Option (iShare vs BigTime) */}
            {selectedNetwork === "AirtelTigo" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    AT Data Option
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Select bundle category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAtTierChange("ishare")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      atTier === "ishare"
                        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/25 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-blue-500" />
                        iShare
                      </div>
                      {atTier === "ishare" && (
                        <Check className="size-4 text-blue-600 dark:text-blue-400 stroke-3" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instant delivery · standard validity
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAtTierChange("bigtime")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      atTier === "bigtime"
                        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/25 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-blue-500" />
                        BigTime
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-300">
                          No Expiry
                        </span>
                      </div>
                      {atTier === "bigtime" && (
                        <Check className="size-4 text-blue-600 dark:text-blue-400 stroke-3" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bulk data · never expires
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Order Dispatch & Verification Notice Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs">
              <div className="flex items-center gap-3">
                <SignalRail status="processing" size="sm" />

                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-foreground">Airtime Debt Notice: </span>
                    <span>
                      Settle unpaid credit/airtime loans first; orders cannot be delivered to numbers with outstanding carrier balances.
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Verify Before Payment: </span>
                    <span>
                      Double-check recipient phone number and carrier network. Orders sent to wrong numbers cannot be refunded.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "bundle" && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Choose Data Bundle
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a data package for {selectedNetwork}
                  {selectedNetwork === "MTN" && ` (${mtnTier === "xpress" ? "Xpress Priority" : "Standard"})`}
                  {selectedNetwork === "AirtelTigo" && ` (${atTier === "bigtime" ? "BigTime Non-Expiry" : "iShare Instant"})`}.
                </p>
              </div>
              <Badge variant="outline" className="text-xs !bg-background">
                {filteredBundles.length} packages
              </Badge>
            </div>

            {/* MTN Tier Switcher */}
            {selectedNetwork === "MTN" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 rounded-2xl bg-muted/40 border border-border">
                <button
                  type="button"
                  onClick={() => handleTierChange("standard")}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    mtnTier === "standard"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Standard
                    </div>
                    {mtnTier === "standard" && (
                      <span className="text-[10px] font-semibold text-primary">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Regular MTN bundles · standard validity
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTierChange("xpress")}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    mtnTier === "xpress"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                      Xpress
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                        Priority Queue
                      </span>
                    </div>
                    {mtnTier === "xpress" && (
                      <span className="text-[10px] font-semibold text-primary">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Express delivery · priority queue
                  </p>
                </button>
              </div>
            )}

            {/* AirtelTigo / AT Tier Switcher */}
            {selectedNetwork === "AirtelTigo" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 rounded-2xl bg-muted/40 border border-border">
                <button
                  type="button"
                  onClick={() => handleAtTierChange("ishare")}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    atTier === "ishare"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500" />
                      iShare
                    </div>
                    {atTier === "ishare" && (
                      <span className="text-[10px] font-semibold text-primary">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Instant delivery · standard validity
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAtTierChange("bigtime")}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    atTier === "bigtime"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="size-2 rounded-full bg-blue-500" />
                      BigTime
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-300">
                        No Expiry
                      </span>
                    </div>
                    {atTier === "bigtime" && (
                      <span className="text-[10px] font-semibold text-primary">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Bulk data · never expires
                  </p>
                </button>
              </div>
            )}

            {/* Input Mode Switcher */}
            <div className="flex items-center p-1 rounded-full bg-muted border border-border text-xs font-semibold w-fit">
              <button
                onClick={() => setInputMode("cards")}
                className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  inputMode === "cards"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Card View
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  inputMode === "text"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Quick Text
              </button>
              <button
                onClick={() => setInputMode("bulk")}
                className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                  inputMode === "bulk"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulk
              </button>
            </div>

            {inputMode === "cards" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredBundles.map((b) => {
                  const isSelected = selectedBundleId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBundleId(b.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                          : "border-border bg-background hover:bg-muted/60"
                      }`}
                    >
                      {b.tier === "xpress" ? (
                        <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Xpress
                        </span>
                      ) : b.tier === "bigtime" ? (
                        <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                          Never Expires
                        </span>
                      ) : b.tier === "ishare" ? (
                        <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                          iShare
                        </span>
                      ) : b.isPopular ? (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300">
                          Popular
                        </span>
                      ) : null}
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {b.sizeLabel}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {b.validity}
                        </div>
                      </div>
                      <div className="pt-3 mt-2 border-t border-border/80 flex justify-between items-baseline">
                        <span className="text-xs font-black text-primary tabular-nums">
                          GH₵ {b.retailPrice.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : inputMode === "text" ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Quick select by bundle size:
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredBundles.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBundleId(b.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        selectedBundleId === b.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {b.sizeLabel} - GH₵{b.retailPrice.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="bulk-numbers">
                  Paste multiple phone numbers (comma or newline separated):
                </Label>
                <Textarea
                  id="bulk-numbers"
                  rows={3}
                  placeholder="0244192834, 0558291034, 0209182391"
                  value={bulkNumbersText}
                  onChange={(e) => setBulkNumbersText(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "recipient" && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Recipient & Payment
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the recipient's phone number and choose payment method.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-phone">Recipient Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="recipient-phone"
                  type="tel"
                  required
                  placeholder="e.g. 0244123456"
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`pl-10 tabular-nums ${
                    selectedNetwork === "MTN" && recipientPhone.length >= 10
                      ? verificationStatus === "verified"
                        ? "border-emerald-500 focus-visible:ring-emerald-500/30"
                        : verificationStatus === "unverified"
                          ? "border-rose-500 focus-visible:ring-rose-500/30"
                          : isVerifying
                            ? "border-amber-500 focus-visible:ring-amber-500/30"
                            : ""
                      : ""
                  }`}
                />
              </div>
              {recipientPhone.length >= 3 && (
                <p className="text-[11px] text-muted-foreground">
                  Detected Network:{" "}
                  <Badge variant="outline" className="ml-1 !bg-background">
                    {selectedNetwork}
                  </Badge>
                </p>
              )}
            </div>

            {/* MTN Verification Status */}
            {selectedNetwork === "MTN" && recipientPhone.length >= 10 && (
              <div className="space-y-2">
                {isVerifying ? (
                  <Alert className="border-amber-500/20 bg-amber-500/5">
                    <Loader2 className="size-4 text-amber-600 dark:text-amber-400 animate-spin" />
                    <AlertDescription className="text-xs">
                      Verifying recipient number...
                    </AlertDescription>
                  </Alert>
                ) : verificationStatus === "verified" ? (
                  <Alert className="border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertDescription className="text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Verified
                      </span>{" "}
                      - This number is eligible to receive MTN bundles.
                    </AlertDescription>
                  </Alert>
                ) : verificationStatus === "unverified" ? (
                  <Alert className="border-rose-500/20 bg-rose-500/">
                    <XCircle className="size-4 text-rose-600 dark:text-rose-400" />
                    <AlertDescription className="text-xs font-medium">
                      <span className="font-semibold text-rose-700 dark:text-rose-400">
                        Unverified
                      </span>{" "}
                      - {verificationMessage}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-xs font-bold">
                Payment Method: <span>{paymentMethod}</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod === "wallet"
                      ? "bg-primary/60 text-primary-foreground border-primary shadow-xs"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      SDH Wallet Balance
                    </div>
                    <div className="text-[11px] text-foreground tabular-nums">
                      Available: GH₵ {walletBalance.toFixed(2)}
                    </div>
                  </div>
                  <span className="text-xs font-bold">Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      selectedNetwork === "MTN"
                        ? "momo_mtn"
                        : selectedNetwork === "Telecel"
                          ? "momo_telecel"
                          : "momo_at",
                    )
                  }
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod !== "wallet"
                      ? "bg-primary/60 text-primary-foreground border-primary shadow-xs"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Direct Mobile Money
                    </div>
                    <div className="text-[11px] text-foreground">
                      USSD PIN Prompt
                    </div>
                  </div>
                  <span className="text-xs font-bold">Push</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Review Your Order
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Verify all details before completing your purchase.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">
                  Network:
                </span>
                <span className="font-bold text-foreground">
                  {selectedNetwork} Ghana
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">
                  Bundle:
                </span>
                <span className="font-bold text-foreground">
                  {currentBundle.name}
                </span>
              </div>
              {selectedNetwork === "MTN" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">
                    Delivery Option:
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {mtnTier === "xpress" ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Xpress (Priority Queue)
                      </span>
                    ) : (
                      "Standard Validity"
                    )}
                  </span>
                </div>
              )}
              {selectedNetwork === "AirtelTigo" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">
                    Bundle Option:
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {atTier === "bigtime" ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                        BigTime (Bulk · Never Expires)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                        iShare (Instant Delivery)
                      </span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">
                  Validity:
                </span>
                <span className="font-bold text-foreground">
                  {currentBundle.validity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">
                  Recipient:
                </span>
                <span className=" font-bold text-foreground">
                  {recipientPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">
                  Payment:
                </span>
                <span className="font-bold text-foreground capitalize">
                  {paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-extrabold text-sm">
                <span>Total:</span>
                <span className="text-primary tabular-nums">
                  GH₵ {currentBundle.retailPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {paymentMethod === "wallet" &&
              walletBalance < currentBundle.retailPrice && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
                  Insufficient wallet balance. Please choose Mobile Money or
                  fund your wallet.
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Connecting to {selectedNetwork} Core Switch...
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Dispatching {currentBundle.name} to{" "}
                <strong>{recipientPhone}</strong>.
              </p>
            </div>
            <SignalRail
              status="processing"
              size="md"
              className="justify-center"
              label="EVD Dispatching"
            />
          </CardContent>
        </Card>
      )}

      {step === "success" && createdOrder && (
        <Card className="border-border shadow-xl">
          <CardContent className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">
                Data Delivered Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>{createdOrder.productName}</strong> has been credited to{" "}
                <span className=" text-foreground font-semibold">
                  {createdOrder.recipientPhone}
                </span>
                .
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Reference:</span>
                <div className="flex items-center gap-1.5">
                  <span className=" font-bold text-foreground">
                    {createdOrder.reference}
                  </span>
                  <button
                    onClick={handleCopyRef}
                    className="p-1 hover:bg-muted rounded text-muted-foreground"
                  >
                    {copiedRef ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-foreground tabular-nums">
                  GH₵ {createdOrder.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Credited & SMS Sent
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenReceipt(createdOrder)}
                className="flex-1"
              >
                View Receipt
              </Button>
              <Button
                onClick={() => {
                  setStep("network");
                  setCreatedOrder(null);
                }}
                className="flex-1"
              >
                Buy Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {step !== "processing" && step !== "success" && (
        <div className="flex gap-3">
          {step !== "network" && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step !== "review" ? (
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={
                step === "recipient" &&
                selectedNetwork === "MTN" &&
                verificationStatus !== "verified"
              }
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                selectedNetwork === "MTN" && verificationStatus !== "verified"
              }
            >
              Complete Purchase
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
