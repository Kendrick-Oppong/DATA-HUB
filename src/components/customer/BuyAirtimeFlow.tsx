import React, { useState } from 'react';
import { PhoneCall, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Smartphone } from 'lucide-react';
import { TelecomNetwork, Order } from '../../types';
import { detectGhanaNetwork } from '../../mockData';
import { SignalRail } from '../common/SignalRail';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface BuyAirtimeFlowProps {
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const BuyAirtimeFlow: React.FC<BuyAirtimeFlowProps> = ({
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
}) => {
  const [step, setStep] = useState<'network' | 'amount' | 'recipient' | 'review' | 'processing' | 'success'>('network');

  const [network, setNetwork] = useState<TelecomNetwork>('MTN');
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'momo_mtn'>('wallet');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const quickAmounts = [5, 10, 20, 50, 100, 200];
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const steps = [
    { id: 'network', label: 'Network', icon: PhoneCall },
    { id: 'amount', label: 'Amount', icon: CheckCircle2 },
    { id: 'recipient', label: 'Recipient', icon: Smartphone },
    { id: 'review', label: 'Review', icon: CheckCircle2 },
  ];

  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    if (val.length >= 3) {
      setNetwork(detectGhanaNetwork(val));
    }
  };

  const validateStep = (currentStep: string): boolean => {
    switch (currentStep) {
      case 'network':
        return !!network;
      case 'amount':
        return finalAmount > 0;
      case 'recipient':
        return recipientPhone.length >= 10;
      case 'review':
        return paymentMethod !== 'wallet' || walletBalance >= finalAmount;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      if (step === 'amount') alert('Please select or enter a valid amount.');
      if (step === 'recipient') alert('Please enter a valid 10-digit phone number.');
      if (step === 'review') alert('Insufficient wallet balance. Please choose Mobile Money.');
      return;
    }

    if (step === 'network') setStep('amount');
    else if (step === 'amount') setStep('recipient');
    else if (step === 'recipient') setStep('review');
  };

  const handleBack = () => {
    if (step === 'amount') setStep('network');
    else if (step === 'recipient') setStep('amount');
    else if (step === 'review') setStep('recipient');
  };

  const handleSubmit = () => {
    if (!validateStep('review')) return;

    setStep('processing');

    const ref = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `ord-air-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: 'Kojo Mensah',
      recipientPhone,
      network,
      serviceType: 'airtime',
      productName: `${network} Airtime GH₵${finalAmount.toFixed(2)}`,
      amount: finalAmount,
      paymentMethod,
      status: 'delivered',
      deliveryTimeline: [
        { step: 'Order Placed', timestamp: '10:00:01', status: 'completed' },
        { step: 'E-Load Dispatched', timestamp: '10:00:03', status: 'completed' },
        { step: 'Balance Credited', timestamp: '10:00:08', status: 'completed', note: `GH₵${finalAmount.toFixed(2)} recharge complete` }
      ]
    };

    setTimeout(() => {
      onOrderCreated(newOrder);
      setCompletedOrder(newOrder);
      setStep('success');
    }, 1800);
  };

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-amber-500" />
            <span>Buy Airtime Top-up</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant electronic credit to any Ghana SIM card with 0% transaction fee.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="E-Load Active" />
      </div>

      {/* Step Indicator */}
      {step !== 'processing' && step !== 'success' && (
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
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
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                          : isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-primary' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-6 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 'network' && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Carrier Network
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the mobile network for your airtime top-up.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-4 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    network === net
                      ? net === 'MTN'
                        ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-500/30 font-bold'
                        : net === 'Telecel'
                        ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-500/30 font-bold'
                        : 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 font-bold'
                      : 'border-border bg-muted/40 hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="text-sm font-extrabold">{net}</div>
                  <div className="text-[10px] mt-1 opacity-85">Instant EVD</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'amount' && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Choose Airtime Amount
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Select a quick amount or enter a custom value in Ghana Cedis.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    amount === amt && !customAmount
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  GH₵{amt}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount</Label>
              <Input
                id="custom-amount"
                type="number"
                min="1"
                max="1000"
                placeholder="Or enter custom amount in GH₵..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="tabular-nums"
              />
            </div>

            {finalAmount > 0 && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="text-xs text-muted-foreground">Selected Amount:</div>
                <div className="text-xl font-black text-foreground tabular-nums">
                  GH₵ {finalAmount.toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'recipient' && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Recipient Phone Number
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the 10-digit Ghana mobile number to receive the airtime.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-phone">Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="recipient-phone"
                  type="tel"
                  required
                  placeholder="e.g. 0244123456"
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10 tabular-nums"
                />
              </div>
              {recipientPhone.length >= 3 && (
                <p className="text-[11px] text-muted-foreground">
                  Detected Network: <Badge variant="outline" className="ml-1">{network}</Badge>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider">
                Review & Payment
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Verify your order details and choose payment method.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-bold text-foreground">{network} Ghana</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-foreground tabular-nums">GH₵ {finalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className=" font-bold text-foreground">{recipientPhone}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold">Payment Method</Label>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">SDH Wallet Balance</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      Available: GH₵ {walletBalance.toFixed(2)}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo_mtn')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod === 'momo_mtn'
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">Direct Mobile Money</div>
                    <div className="text-[11px] text-muted-foreground">USSD PIN Prompt</div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">Push to Phone</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'wallet' && walletBalance < finalAmount && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
                Insufficient wallet balance. Please choose Mobile Money or fund your wallet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="border-border shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Processing Airtime Recharge...</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Dispatching GH₵ {finalAmount.toFixed(2)} to {recipientPhone} via {network}.
              </p>
            </div>
            <SignalRail status="processing" size="md" className="justify-center" label="EVD Dispatching" />
          </CardContent>
        </Card>
      )}

      {step === 'success' && completedOrder && (
        <Card className="border-border shadow-xl">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Airtime Credited!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>GH₵ {completedOrder.amount.toFixed(2)}</strong> successfully dispatched to <strong>{completedOrder.recipientPhone}</strong>.
              </p>
            </div>
            <div className="flex gap-3 max-w-sm mx-auto">
              <Button
                variant="outline"
                onClick={() => onOpenReceipt(completedOrder)}
                className="flex-1"
              >
                Receipt
              </Button>
              <Button
                onClick={() => {
                  setStep('network');
                  setCompletedOrder(null);
                }}
                className="flex-1"
              >
                Recharge Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {step !== 'processing' && step !== 'success' && (
        <div className="flex gap-3">
          {step !== 'network' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step !== 'review' ? (
            <Button
              onClick={handleNext}
              className="flex-1 h-10"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 h-10"
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
