import React, { useState } from "react";
import {
  Wallet,
  Smartphone,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, channel: string, fee: number) => void;
  currentBalance: number;
}

type PaymentChannel = "mtn" | "telecel" | "at" | "card";

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentChannel>("mtn");
  const [momoNumber, setMomoNumber] = useState<string>("0244192834");
  const [step, setStep] = useState<"form" | "prompt" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [generatedRef, setGeneratedRef] = useState<string>("");

  const quickAmounts = [20, 50, 100, 200, 500];

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const feeRate = paymentMethod === "card" ? 0.015 : 0.008;
  const feeRateLabel = paymentMethod === "card" ? "1.5%" : "0.8%";

  const fee = Number((finalAmount * feeRate).toFixed(2));
  const totalDeduction = Number((finalAmount + fee).toFixed(2));

  const handleStartPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (finalAmount < 5) return;

    setIsSubmitting(true);
    setStep("prompt");

    const newRef = `SDH-WF-${Math.floor(100000 + Math.random() * 900000)}`;

    setGeneratedRef(newRef);

    // Simulate MoMo USSD prompt push to subscriber handset
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("success");

      onSuccess(
        finalAmount,
        paymentMethod === "card"
          ? "Debit Card (Paystack/Visa)"
          : `${paymentMethod.toUpperCase()} Mobile Money (${momoNumber})`,
        fee,
      );
    }, 2800);
  };

  const handleReset = () => {
    setStep("form");
    setCustomAmount("");
    setIsSubmitting(false);
    setCopiedRef(false);
    setGeneratedRef("");
    onClose();
  };

  const handleCopyRef = async () => {
    if (!generatedRef) return;

    try {
      await navigator.clipboard.writeText(generatedRef);
      setCopiedRef(true);

      setTimeout(() => {
        setCopiedRef(false);
      }, 2000);
    } catch {
      setCopiedRef(false);
    }
  };

  const paymentChannels: {
    id: PaymentChannel;
    name: string;
    sub: string;
    logoText: string;
    logoBg: string;
    logoColor: string;
    activeBorder: string;
    activeRing: string;
    activeBg: string;
  }[] = [
    {
      id: "mtn",
      name: "MTN MoMo",
      sub: "Instant Push",
      logoText: "MTN",
      logoBg: "bg-amber-400",
      logoColor: "text-amber-950",
      activeBorder: "border-amber-500",
      activeRing: "ring-amber-500/30",
      activeBg: "bg-amber-500/10",
    },
    {
      id: "telecel",
      name: "Telecel Cash",
      sub: "Instant Push",
      logoText: "TC",
      logoBg: "bg-red-600",
      logoColor: "text-white",
      activeBorder: "border-red-500",
      activeRing: "ring-red-500/30",
      activeBg: "bg-red-500/10",
    },
    {
      id: "at",
      name: "AT Money",
      sub: "AirtelTigo",
      logoText: "AT",
      logoBg: "bg-blue-600",
      logoColor: "text-white",
      activeBorder: "border-blue-500",
      activeRing: "ring-blue-500/30",
      activeBg: "bg-blue-500/10",
    },
    {
      id: "card",
      name: "Debit Card",
      sub: "Visa / GhQR",
      logoText: "CARD",
      logoBg: "bg-primary",
      logoColor: "text-primary-foreground",
      activeBorder: "border-primary",
      activeRing: "ring-primary/30",
      activeBg: "bg-primary/10",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Wallet className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                    Fund SDH Wallet
                  </DialogTitle>

                  <Badge
                    variant="secondary"
                    className="border-primary/20 bg-primary/15 px-2 py-0 text-[10px] font-bold text-primary"
                  >
                    Instant Credit
                  </Badge>
                </div>

                <DialogDescription className="mt-0.5 text-left text-xs">
                  Available Balance:{" "}
                  <strong className="font-bold tabular-nums text-foreground">
                    GH₵ {currentBalance.toFixed(2)}
                  </strong>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* STEP 1: FORM */}
            {step === "form" && (
              <form
                id="fund-wallet-form"
                onSubmit={handleStartPayment}
                className="space-y-5"
              >
                {/* Balance Overview Card */}
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="size-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Current Float & Balance
                      </p>

                      <p className="text-sm font-extrabold tabular-nums text-foreground">
                        GH₵ {currentBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      Gateway Ready
                    </Badge>
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Top-Up Amount (GH₵)
                    </Label>

                    <span className="text-[11px] text-muted-foreground">
                      Min: GH₵ 5.00
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((amt) => {
                      const isSelected = amount === amt && !customAmount;

                      return (
                        <Button
                          key={amt}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setAmount(amt);
                            setCustomAmount("");
                          }}
                          className={`h-10 text-xs font-bold transition-all ${
                            isSelected
                              ? "shadow-sm ring-2 ring-primary/20"
                              : "hover:bg-muted/70"
                          }`}
                        >
                          GH₵{amt}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-muted-foreground">
                      GH₵
                    </div>

                    <Input
                      type="number"
                      min="5"
                      step="1"
                      placeholder="Or enter custom amount (e.g. 75)..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="h-11 pl-12 text-sm font-semibold tabular-nums"
                    />
                  </div>
                </div>

                {/* Payment Channels */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Method
                  </Label>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {paymentChannels.map((channel) => {
                      const isSelected = paymentMethod === channel.id;

                      return (
                        <Button
                          key={channel.id}
                          type="button"
                          variant="outline"
                          onClick={() => setPaymentMethod(channel.id)}
                          className={`flex h-auto flex-col items-center justify-center rounded-lg p-3 text-center whitespace-normal transition-all ${
                            isSelected
                              ? `${channel.activeBorder} ${channel.activeBg} ring-2 ${channel.activeRing} font-bold shadow-xs`
                              : "border-border/80 hover:bg-muted/50"
                          }`}
                        >
                          {channel.id === "card" ? (
                            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                              <CreditCard className="size-4" />
                            </div>
                          ) : (
                            <div
                              className={`flex size-7 items-center justify-center rounded-full text-[11px] font-black shadow-xs ${channel.logoBg} ${channel.logoColor}`}
                            >
                              {channel.logoText}
                            </div>
                          )}

                          <span className="mt-1.5 line-clamp-1 text-xs font-bold text-foreground">
                            {channel.name}
                          </span>

                          <span className="text-[10px] text-muted-foreground">
                            {channel.sub}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Money Handset Number */}
                {paymentMethod !== "card" ? (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="momo-input"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Mobile Money Wallet Number
                    </Label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                        <Smartphone className="size-4" />
                      </div>

                      <Input
                        id="momo-input"
                        type="tel"
                        required
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        placeholder="e.g. 0244123456"
                        className="h-11 pl-10 text-sm font-semibold tabular-nums"
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      A USSD payment prompt will be pushed directly to this
                      subscriber handset for 4-digit PIN confirmation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CreditCard className="size-4 text-primary" />
                      <span>Card Checkout (Paystack / Visa / Mastercard)</span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      You will be securely redirected to complete 3D-Secure
                      authentication with your Ghana local or international bank
                      card.
                    </p>
                  </div>
                )}

                {/* Fee & Calculation Summary Card */}
                <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Top-up Credit Amount</span>

                    <span className="font-semibold tabular-nums text-foreground">
                      GH₵ {finalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Processing Fee ({feeRateLabel})</span>

                    <span className="font-medium tabular-nums text-muted-foreground">
                      GH₵ {fee.toFixed(2)}
                    </span>
                  </div>

                  <Separator className="my-1.5" />

                  <div className="flex items-baseline justify-between text-sm font-bold text-foreground">
                    <span>Total Deducted</span>

                    <span className="text-base font-extrabold tabular-nums text-primary">
                      GH₵ {totalDeduction.toFixed(2)}
                    </span>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: USSD PROMPT PUSH */}
            {step === "prompt" && (
              <div className="space-y-5 px-2 py-6 text-center">
                <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/20 opacity-30" />
                  <Loader2 className="size-9 animate-spin text-primary" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-extrabold text-foreground">
                    USSD Prompt Pushed to Handset
                  </h4>

                  <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Please check your phone screen on{" "}
                    <strong className="text-foreground">{momoNumber}</strong>{" "}
                    and enter your 4-digit PIN to authorize payment of{" "}
                    <strong className="font-bold text-primary">
                      GH₵ {totalDeduction.toFixed(2)}
                    </strong>
                    .
                  </p>
                </div>

                <div className="mx-auto max-w-sm space-y-1 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Awaiting Bank & Carrier Confirmation</span>
                  </div>

                  <p className="text-[11px] opacity-90">
                    Listening for webhook callback from{" "}
                    {paymentMethod.toUpperCase()} gateway...
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSubmitting(false);
                      setStep("form");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel & Change Details
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === "success" && (
              <div className="space-y-5 px-2 py-5 text-center">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-extrabold text-foreground">
                    Wallet Funded Successfully!
                  </h4>

                  <p className="text-xs text-muted-foreground">
                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                      GH₵ {finalAmount.toFixed(2)}
                    </strong>{" "}
                    has been instantly credited to your available balance.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="mx-auto max-w-md space-y-2.5 rounded-2xl border border-border bg-muted/40 p-4 text-left text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      New Available Balance:
                    </span>

                    <span className="text-sm font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                      GH₵ {(currentBalance + finalAmount).toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Channel:</span>

                    <span className="font-semibold text-foreground">
                      {paymentMethod === "card"
                        ? "Debit Card (Visa/Paystack)"
                        : `${paymentMethod.toUpperCase()} Mobile Money`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fee Paid:</span>

                    <span className="font-semibold tabular-nums text-foreground">
                      GH₵ {fee.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reference:</span>

                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>{generatedRef}</span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleCopyRef}
                        className="size-6 text-muted-foreground hover:text-foreground"
                        aria-label="Copy reference"
                      >
                        {copiedRef ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleReset}
                  size="lg"
                  className="h-12 w-full cursor-pointer rounded-xl text-sm font-bold shadow-sm"
                >
                  Done & Return to Dashboard
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Action Button */}
        {step === "form" && (
          <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
            <Button
              type="submit"
              form="fund-wallet-form"
              disabled={finalAmount < 5 || isSubmitting}
              size="lg"
              className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span>Authorize GH₵ {totalDeduction.toFixed(2)}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Modal Footer */}
        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border bg-muted/30 px-5 py-3 sm:justify-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

            <span className="text-[11px]">
              Secured by Bank of Ghana Regulated Telecom Payment Switch
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FundWalletModal;
