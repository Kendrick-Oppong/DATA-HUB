import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, Smartphone, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { TelecomNetwork } from '../../types';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, channel: string, fee: number) => void;
  currentBalance: number;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'telecel' | 'at' | 'card'>('mtn');
  const [momoNumber, setMomoNumber] = useState<string>('0244192834');
  const [step, setStep] = useState<'form' | 'prompt' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickAmounts = [20, 50, 100, 200, 500];
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const fee = paymentMethod === 'card' ? Number((finalAmount * 0.015).toFixed(2)) : Number((finalAmount * 0.008).toFixed(2));
  const totalDeduction = Number((finalAmount + fee).toFixed(2));

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;
    setIsSubmitting(true);
    setStep('prompt');

    // Simulate MoMo USSD prompt push to phone
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
      onSuccess(
        finalAmount,
        paymentMethod === 'card'
          ? 'Debit Card (Paystack/Visa)'
          : `${paymentMethod.toUpperCase()} Mobile Money (${momoNumber})`,
        fee
      );
    }, 2800);
  };

  const handleReset = () => {
    setStep('form');
    setCustomAmount('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>Fund SDH Wallet</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Instant Credit</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current Available Balance: <strong className="text-foreground tabular-nums">GH₵ {currentBalance.toFixed(2)}</strong>
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleStartPayment} className="space-y-5">
              {/* Quick Amounts */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Select Top-up Amount (GH₵)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-1 text-sm font-semibold rounded-xl border text-center transition-all ${
                        amount === amt && !customAmount
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-muted border-border text-foreground'
                      }`}
                    >
                      GH₵{amt}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5">
                  <input
                    type="number"
                    min="5"
                    step="1"
                    placeholder="Or enter custom amount in GH₵..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Payment Channel */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mtn')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'mtn'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-300 ring-2 ring-amber-500/30'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-bold text-xs flex items-center justify-center shadow-xs">
                      MTN
                    </div>
                    <span className="text-xs font-medium">MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telecel')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'telecel'
                        ? 'border-red-500 bg-red-500/10 text-red-950 dark:text-red-300 ring-2 ring-red-500/30'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      TC
                    </div>
                    <span className="text-xs font-medium">Telecel Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('at')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'at'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-950 dark:text-blue-300 ring-2 ring-blue-500/30'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      AT
                    </div>
                    <span className="text-xs font-medium">AT Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    <CreditCard className="w-7 h-7 text-primary" />
                    <span className="text-xs font-medium">Visa / GhQR</span>
                  </button>
                </div>
              </div>

              {/* MoMo Number */}
              {paymentMethod !== 'card' && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Mobile Money Wallet Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="e.g. 0244123456"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Prompt will be pushed directly to this subscriber handset for PIN approval.
                  </p>
                </div>
              )}

              {/* Fee & Breakdown Box */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Top-up Credit Amount</span>
                  <span className="font-semibold text-foreground tabular-nums">GH₵ {finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee (0.8%)</span>
                  <span className="tabular-nums">GH₵ {fee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                  <span>Total Payable from MoMo</span>
                  <span className="text-primary tabular-nums">GH₵ {totalDeduction.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={finalAmount <= 0}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>Authorize GH₵ {totalDeduction.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'prompt' && (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">USSD Prompt Pushed to Handset</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Please check your phone screen on <strong>{momoNumber}</strong> and enter your 4-digit PIN to approve <strong>GH₵ {totalDeduction.toFixed(2)}</strong>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs inline-block">
                Auto-confirming network gateway webhook...
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground">Wallet Funded Successfully!</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>GH₵ {finalAmount.toFixed(2)}</strong> has been credited to your available balance.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs space-y-1 text-left max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Balance:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    GH₵ {(currentBalance + finalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="text-foreground">{paymentMethod.toUpperCase()} MoMo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-foreground">SDH-WF-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
              >
                Done & Continue
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Security Badge */}
        <div className="px-6 py-3 bg-muted/40 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Secured by Bank of Ghana Regulated Telecom Payment Switch</span>
        </div>
      </div>
    </div>
  );
};
