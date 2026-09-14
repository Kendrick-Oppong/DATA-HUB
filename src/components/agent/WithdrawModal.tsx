import React, { useState } from "react";
import {
  ArrowDownLeft,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  MessageSquare,
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
import { ScrollArea } from "../ui/scroll-area";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, reference: string) => void;
  commissionBalance: number;
}

type MomoProvider = "MTN" | "Telecel" | "AirtelTigo";

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  commissionBalance,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>("50");
  const [momoProvider, setMomoProvider] = useState<MomoProvider>("MTN");
  const [momoPhone, setMomoPhone] = useState<string>("");
  const [momoName, setMomoName] = useState<string>("");
  const [withdrawStep, setWithdrawStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [withdrawSuccessInfo, setWithdrawSuccessInfo] = useState<{
    ref: string;
    amount: number;
  } | null>(null);

  const quickAmounts = [50, 100, 200, 500];
  const finalAmount = parseFloat(withdrawAmount) || 0;

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 5 || finalAmount > commissionBalance) {
      alert(
        "Invalid withdrawal amount. Minimum is GH₵5 and cannot exceed your available balance.",
      );
      return;
    }

    setIsWithdrawing(true);
    // Simulate sending OTP
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawStep(2);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    const ref = `WDR-GH-${Math.floor(10000 + Math.random() * 90000)}`;

    setTimeout(() => {
      setIsVerifyingOtp(false);
      onSuccess(finalAmount, ref);
      setWithdrawSuccessInfo({ ref, amount: finalAmount });
      setWithdrawStep(3);
    }, 1500);
  };

  const handleResetWithdrawal = () => {
    setWithdrawStep(1);
    setWithdrawSuccessInfo(null);
    setOtpCode("");
    setWithdrawAmount("50");
    setMomoPhone("");
    setMomoName("");
    onClose();
  };

  const formatCurrency = (val: number) => `GH₵ ${val.toFixed(2)}`;

  const momoProviders: {
    id: MomoProvider;
    name: string;
    logoText: string;
    logoBg: string;
    logoColor: string;
    activeBorder: string;
    activeRing: string;
    activeBg: string;
  }[] = [
    {
      id: "MTN",
      name: "MTN Mobile Money",
      logoText: "MTN",
      logoBg: "bg-amber-400",
      logoColor: "text-amber-950",
      activeBorder: "border-amber-500",
      activeRing: "ring-amber-500/30",
      activeBg: "bg-amber-500/10",
    },
    {
      id: "Telecel",
      name: "Telecel Cash",
      logoText: "TC",
      logoBg: "bg-red-600",
      logoColor: "text-white",
      activeBorder: "border-red-500",
      activeRing: "ring-red-500/30",
      activeBg: "bg-red-500/10",
    },
    {
      id: "AirtelTigo",
      name: "AirtelTigo Money",
      logoText: "AT",
      logoBg: "bg-blue-600",
      logoColor: "text-white",
      activeBorder: "border-blue-500",
      activeRing: "ring-blue-500/30",
      activeBg: "bg-blue-500/10",
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleResetWithdrawal()}
    >
      <DialogContent className="flex h-[90vh] max-h-[90vh] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-card to-amber-500/10 p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5" />
          <div className="absolute -bottom-16 left-1/3 size-40 rounded-full bg-amber-500/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-amber-950 shadow-sm">
                <ArrowDownLeft className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-left text-base font-extrabold tracking-tight">
                    Withdraw Commissions
                  </DialogTitle>

                  <Badge
                    variant="secondary"
                    className="border-amber-500/20 bg-amber-500/15 px-2 py-0 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                  >
                    Instant Payout
                  </Badge>
                </div>

                <DialogDescription className="mt-0.5 text-left text-xs">
                  Available Balance:{" "}
                  <strong className="font-bold text-foreground">
                    {formatCurrency(commissionBalance)}
                  </strong>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* STEP 1: WITHDRAWAL FORM */}
            {withdrawStep === 1 && (
              <form onSubmit={handleExecuteWithdrawal} className="space-y-5">
                {/* Balance Overview Card */}
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <Sparkles className="size-4" />
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Available to Withdraw
                      </p>

                      <p className="text-sm font-extrabold text-foreground">
                        {formatCurrency(commissionBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      Ready
                    </Badge>
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Amount (GH₵)
                  </Label>

                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((amt) => {
                      const isSelected = withdrawAmount === amt.toString();

                      return (
                        <Button
                          key={amt}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => setWithdrawAmount(amt.toString())}
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
                    <Button
                      type="button"
                      variant={
                        withdrawAmount === commissionBalance.toString()
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setWithdrawAmount(commissionBalance.toString())
                      }
                      className={`h-10 text-xs font-bold transition-all ${
                        withdrawAmount === commissionBalance.toString()
                          ? "shadow-sm ring-2 ring-primary/20"
                          : "hover:bg-muted/70"
                      }`}
                    >
                      All
                    </Button>
                  </div>

                  {/* Custom Amount Input */}
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-muted-foreground">
                      GH₵
                    </div>

                    <Input
                      type="number"
                      min="5"
                      max={commissionBalance}
                      step="1"
                      placeholder="Or enter custom amount..."
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="h-11 pl-12 text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Mobile Money Network */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mobile Money Network
                  </Label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {momoProviders.map((provider) => {
                      const isSelected = momoProvider === provider.id;

                      return (
                        <Button
                          key={provider.id}
                          type="button"
                          variant="outline"
                          onClick={() => setMomoProvider(provider.id)}
                          className={`flex h-auto flex-col items-center justify-center rounded-lg p-3 text-center whitespace-normal transition-all ${
                            isSelected
                              ? `${provider.activeBorder} ${provider.activeBg} ring-2 ${provider.activeRing} font-bold shadow-xs`
                              : "border-border/80 hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className={`flex size-7 items-center justify-center rounded-full text-[11px] font-black shadow-xs ${provider.logoBg} ${provider.logoColor}`}
                          >
                            {provider.logoText}
                          </div>

                          <span className="mt-1.5 line-clamp-1 text-xs font-bold text-foreground">
                            {provider.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Money Number */}
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
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="e.g. 0244123456"
                      className="h-11 pl-10 text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Beneficiary Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Name on Mobile Money Account
                  </Label>

                  <Input
                    type="text"
                    required
                    value={momoName}
                    onChange={(e) => setMomoName(e.target.value)}
                    placeholder="e.g. Ama Mensah"
                    className="h-11 text-sm font-semibold"
                  />
                </div>

                {/* Withdrawal Schedule Note */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 text-xs">
                  <p className="font-semibold">Withdrawal Schedule:</p>
                  <p className="mt-1">
                    Withdrawals are processed on weekdays after 11 AM, following
                    our payment partner&apos;s settlement schedule. Requests
                    made on weekends or after the daily cutoff are processed the
                    next business day.
                  </p>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

                  <p className="text-[12px] font-medium leading-relaxed text-muted-foreground">
                    We’ll email you a 6-digit code to verify withdrawals before
                    funds are transferred.
                  </p>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {withdrawStep === 2 && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-5 px-2 py-6 text-center"
              >
                <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/20 opacity-30" />
                  <MessageSquare className="size-9" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-foreground">
                    Enter OTP Code
                  </h3>

                  <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
                    A 6-digit code has been sent to your email. Enter it below
                    to confirm your withdrawal of{" "}
                    <strong className="font-bold text-primary">
                      {formatCurrency(finalAmount)}
                    </strong>
                    .
                  </p>
                </div>

                <div>
                  <Label className="block font-semibold text-muted-foreground mb-1 text-center">
                    OTP Code
                  </Label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-center text-2xl font-bold tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetWithdrawal}
                    className="flex-1 py-3 rounded-xl border border-border bg-muted text-foreground font-bold text-xs hover:bg-muted/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Withdrawal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {withdrawStep === 3 && withdrawSuccessInfo && (
              <div className="space-y-5 px-2 py-5 text-center">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-foreground">
                    Commission Paid Out!
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(withdrawSuccessInfo.amount)}
                    </strong>{" "}
                    has been transferred to your {momoProvider} wallet (Ref:{" "}
                    <strong>{withdrawSuccessInfo.ref}</strong>).
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Action Button */}
        {withdrawStep === 1 && (
          <div className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
            <Button
              type="submit"
              form="withdrawal-form"
              disabled={
                isWithdrawing ||
                finalAmount < 5 ||
                finalAmount > commissionBalance ||
                !momoPhone ||
                !momoName
              }
              size="lg"
              className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md"
              onClick={handleExecuteWithdrawal}
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <span>Continue to OTP Verification</span>
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

export default WithdrawModal;
