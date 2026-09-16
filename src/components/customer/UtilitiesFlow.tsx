import React, { useState } from "react";
import {
  Zap,
  Droplet,
  Tv,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Wallet,
  Smartphone,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Order } from "../../types";
import { SignalRail } from "../common/SignalRail";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";

interface UtilitiesFlowProps {
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const UtilitiesFlow: React.FC<UtilitiesFlowProps> = ({
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
}) => {
  const [step, setStep] = useState<
    "provider" | "account" | "amount" | "review" | "processing" | "success"
  >("provider");

  const [utilityType, setUtilityType] = useState<
    "ecg" | "gwcl" | "dstv" | "gotv"
  >("ecg");
  const [accountNumber, setAccountNumber] = useState<string>("P1049281928");
  const [amount, setAmount] = useState<string>("50");
  const [beneficiaryName, setBeneficiaryName] = useState<string>(
    "Kojo Mensah (Meter #P1049281928 - Accra West)",
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "momo_mtn" | "momo_telecel" | "momo_at"
  >("wallet");

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const steps = [
    { id: "provider", label: "Provider", icon: Zap },
    { id: "account", label: "Account", icon: CreditCard },
    { id: "amount", label: "Amount & Method", icon: Wallet },
    { id: "review", label: "Review", icon: CheckCircle2 },
  ];

  const utilities = [
    {
      id: "ecg",
      name: "ECG Electricity",
      category: "Power Prepaid",
      icon: Zap,
      label: "Prepaid Meter / Account Number",
      placeholder: "e.g. P1049281928",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      defaultAccount: "P1049281928",
      defaultBeneficiary: "Kojo Mensah (Meter #P1049281928 - Accra West)",
    },
    {
      id: "gwcl",
      name: "Ghana Water (GWCL)",
      category: "Water Utility",
      icon: Droplet,
      label: "GWCL Customer Account No",
      placeholder: "e.g. 8392019",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
      defaultAccount: "8392019",
      defaultBeneficiary: "Ama Serwaa (GWCL Acc #8392019)",
    },
    {
      id: "dstv",
      name: "DStv Ghana",
      category: "Pay TV Sub",
      icon: Tv,
      label: "Smartcard / IUC Number",
      placeholder: "e.g. 1029384756",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/30",
      defaultAccount: "1029384756",
      defaultBeneficiary: "Kwame Owusu (DStv Compact Plus)",
    },
    {
      id: "gotv",
      name: "GOtv Ghana",
      category: "Pay TV Sub",
      icon: Tv,
      label: "GOtv IUC Number",
      placeholder: "e.g. 2039485761",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      defaultAccount: "2039485761",
      defaultBeneficiary: "Abena Osei (GOtv Supa Max)",
    },
  ];

  const currentProvider =
    utilities.find((u) => u.id === utilityType) || utilities[0];

  const handleProviderSelect = (id: "ecg" | "gwcl" | "dstv" | "gotv") => {
    setUtilityType(id);
    const item = utilities.find((u) => u.id === id);
    if (item) {
      setAccountNumber(item.defaultAccount);
      setBeneficiaryName(item.defaultBeneficiary);
    }
  };

  const handleVerifyAccount = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setBeneficiaryName(currentProvider.defaultBeneficiary);
    }, 600);
  };

  const validateStep = (currentStep: string): boolean => {
    switch (currentStep) {
      case "provider":
        return !!utilityType;
      case "account":
        return accountNumber.trim().length >= 5;
      case "amount":
        const val = parseFloat(amount);
        return !isNaN(val) && val >= 5;
      case "review":
        const finalAmt = parseFloat(amount);
        return paymentMethod !== "wallet" || walletBalance >= finalAmt;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      if (step === "account")
        alert(
          "Please enter a valid meter or account number (at least 5 characters).",
        );
      if (step === "amount")
        alert("Please enter a valid amount of at least GH₵ 5.00.");
      if (step === "review")
        alert("Insufficient wallet balance. Please select Mobile Money.");
      return;
    }

    if (step === "provider") setStep("account");
    else if (step === "account") setStep("amount");
    else if (step === "amount") setStep("review");
  };

  const handleBack = () => {
    if (step === "account") setStep("provider");
    else if (step === "amount") setStep("account");
    else if (step === "review") setStep("amount");
  };

  const handleSubmit = () => {
    if (!validateStep("review")) return;
    const finalAmount = parseFloat(amount) || 0;

    setStep("processing");

    const ref = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomToken =
      utilityType === "ecg"
        ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined;

    const newOrder: Order = {
      id: `ord-ut-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: "Kojo Mensah",
      recipientPhone: "0244192834",
      network: "MTN",
      serviceType: "utility",
      productName: `${currentProvider.name} Payment`,
      amount: finalAmount,
      paymentMethod,
      status: "delivered",
      meterNumber: accountNumber,
      meterToken: randomToken,
      deliveryTimeline: [
        {
          step: "Order Authorized",
          timestamp: "10:00:01",
          status: "completed",
          note: `Paid via ${paymentMethod.replace("_", " ")}`,
        },
        {
          step: "Utility Provider Gateway",
          timestamp: "10:00:04",
          status: "completed",
          note: `${currentProvider.name} Direct Node`,
        },
        {
          step: "Bill Credited / Token Issued",
          timestamp: "10:00:09",
          status: "completed",
          note: randomToken ? "Token generated" : "Bill settled",
        },
      ],
    };

    setTimeout(() => {
      onOrderCreated(newOrder);
      setCompletedOrder(newOrder);
      setStep("success");
    }, 2200);
  };

  const handleCopyToken = () => {
    if (completedOrder?.meterToken) {
      navigator.clipboard.writeText(completedOrder.meterToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const parsedAmount = parseFloat(amount || "0");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <span>Utilities & Bill Payments</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant ECG power tokens, Ghana Water bills, and DStv / GOtv
            subscriptions.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="ECG/GWCL Gateway Live" />
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
                            ? "bg-primary text-primary-foreground font-bold shadow-md scale-105"
                            : isCompleted
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
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
                        className={`text-[11px] font-bold ${
                          isActive
                            ? "text-foreground font-extrabold"
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
                        className={`h-0.5 flex-1 rounded-full transition-all ${
                          isCompleted ? "bg-emerald-500" : "bg-muted"
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

      {/* ============ STEP 1: PROVIDER SELECTION ============ */}
      {step === "provider" && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Select Utility Provider</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Choose the electricity, water, or television service provider you
              wish to pay for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {utilities.map((item) => {
                const Icon = item.icon;
                const isSelected = utilityType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleProviderSelect(item.id as any)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-sm text-foreground">
                          {item.name}
                        </span>
                        {isSelected && (
                          <Badge
                            variant="default"
                            className="text-[10px] font-bold"
                          >
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleNext} className="px-6 font-bold text-xs">
                <span>Continue to Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 2: ACCOUNT / METER DETAILS ============ */}
      {step === "account" && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>Enter Account or Meter Details</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Provide your {currentProvider.label.toLowerCase()} to verify
              subscription status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentProvider.color}`}
              >
                <currentProvider.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {currentProvider.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {currentProvider.category}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="utility-account" className="font-bold">
                {currentProvider.label}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="utility-account"
                  type="text"
                  required
                  placeholder={currentProvider.placeholder}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setBeneficiaryName("");
                  }}
                  className="font-mono text-sm h-10 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerifyAccount}
                  className="h-10 px-4 font-bold text-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </Button>
              </div>
            </div>

            {beneficiaryName && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Verified Customer Record
                  </span>
                  <span className="text-[11px]">{beneficiaryName}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-5 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleNext}
                disabled={accountNumber.trim().length < 5}
                className="px-6 font-bold text-xs"
              >
                <span>Continue to Amount</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 3: AMOUNT & PAYMENT METHOD ============ */}
      {step === "amount" && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span>Bill Amount & Payment Source</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Specify how much you want to pay and choose your preferred funding
              source.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="utility-amount" className="font-bold">
                Payment Amount (GH₵)
              </Label>
              <Input
                id="utility-amount"
                type="number"
                min="5"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-base h-11 font-bold tabular-nums"
              />
              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["20", "50", "100", "200", "500"].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(preset)}
                    className="text-xs font-bold"
                  >
                    GH₵ {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-2">
              <Label className="font-bold block">Select Payment Method</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* SDH Wallet */}
                <div
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "wallet"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <Wallet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-foreground block">
                      SDH Wallet Balance
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      GH₵ {walletBalance.toFixed(2)} available
                    </span>
                    {walletBalance < parsedAmount && (
                      <span className="text-[10px] text-rose-500 font-bold block pt-0.5">
                        Insufficient balance
                      </span>
                    )}
                  </div>
                </div>

                {/* MTN MoMo */}
                <div
                  onClick={() => setPaymentMethod("momo_mtn")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "momo_mtn"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-foreground block">
                      MTN Mobile Money
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Direct prompt on 0244192834
                    </span>
                  </div>
                </div>

                {/* Telecel Cash */}
                <div
                  onClick={() => setPaymentMethod("momo_telecel")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "momo_telecel"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-foreground block">
                      Telecel Cash
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Direct prompt on 020XXXXXXX
                    </span>
                  </div>
                </div>

                {/* AT Money */}
                <div
                  onClick={() => setPaymentMethod("momo_at")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "momo_at"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-foreground block">
                      AT Money (AirtelTigo)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Direct prompt on 027XXXXXXX
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-5 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleNext}
                disabled={isNaN(parsedAmount) || parsedAmount < 5}
                className="px-6 font-bold text-xs"
              >
                <span>Review Order</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 4: REVIEW & CONFIRM ============ */}
      {step === "review" && (
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Review Bill Payment</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your utility details before authorizing transaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-bold text-foreground">
                  {currentProvider.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">
                  {currentProvider.label}:
                </span>
                <span className="font-mono font-bold text-foreground">
                  {accountNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Beneficiary Name:</span>
                <span className="font-bold text-foreground">
                  {beneficiaryName || "Verified Customer"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-bold text-foreground uppercase">
                  {paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-extrabold text-foreground">
                  Total Bill Amount:
                </span>
                <span className="text-2xl font-black text-foreground tabular-nums">
                  GH₵ {parsedAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {paymentMethod === "wallet" && walletBalance < parsedAmount && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Insufficient wallet balance (GH₵ {walletBalance.toFixed(2)}).
                  Please go back and choose Mobile Money.
                </span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-5 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  paymentMethod === "wallet" && walletBalance < parsedAmount
                }
                className="px-8 font-semibold text-xs"
              >
                <span>Pay Utility Bill (GH₵ {parsedAmount.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 5: PROCESSING ANIMATION ============ */}
      {step === "processing" && (
        <Card className="border-border shadow-md py-12 text-center">
          <CardContent className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Authorizing Utility Payment...
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Connecting to {currentProvider.name} Gateway. Generating token
                and settling account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ STEP 6: SUCCESS SCREEN ============ */}
      {step === "success" && completedOrder && (
        <Card className="border-border shadow-lg py-8 text-center">
          <CardContent className="space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-foreground">
                Bill Payment Successful!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ref:{" "}
                <strong className="font-mono text-foreground">
                  {completedOrder.reference}
                </strong>{" "}
                for meter/account{" "}
                <strong className="font-mono text-foreground">
                  {completedOrder.meterNumber}
                </strong>
                .
              </p>
            </div>

            {/* ECG Token Box */}
            {completedOrder.meterToken && (
              <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-900 dark:text-amber-300 block tracking-wider">
                  ECG Prepaid Recharge Token
                </span>
                <div className="font-mono text-lg font-black text-foreground tracking-widest tabular-nums">
                  {completedOrder.meterToken}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToken}
                  className="h-7 text-xs font-bold"
                >
                  {copiedToken ? (
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  {copiedToken ? "Copied" : "Copy 20-Digit Token"}
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenReceipt(completedOrder)}
                className="flex-1 font-bold text-xs"
              >
                View Receipt
              </Button>
              <Button
                onClick={() => {
                  setCompletedOrder(null);
                  setStep("provider");
                }}
                className="flex-1 font-bold text-xs"
              >
                Pay Another Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
