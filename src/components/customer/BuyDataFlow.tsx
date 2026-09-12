import React, { useState } from 'react';
import {
  Wifi,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { TelecomNetwork, DataBundle, Order } from '../../types';
import { detectGhanaNetwork } from '../../mockData';
import { SignalRail } from '../common/SignalRail';

interface BuyDataFlowProps {
  bundles: DataBundle[];
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  initialBundleId?: string;
  initialNetwork?: TelecomNetwork;
}

export const BuyDataFlow: React.FC<BuyDataFlowProps> = ({
  bundles,
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
  initialBundleId,
  initialNetwork = 'MTN',
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>(initialNetwork);
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    initialBundleId || bundles.find((b) => b.network === initialNetwork)?.id || 'mtn-5gb'
  );
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'momo_mtn' | 'momo_telecel' | 'momo_at'>('wallet');
  const [inputMode, setInputMode] = useState<'cards' | 'text' | 'bulk'>('cards');
  const [bulkNumbersText, setBulkNumbersText] = useState<string>('');
  
  // Checkout State
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);
  const currentBundle = bundles.find((b) => b.id === selectedBundleId) || filteredBundles[0];

  // Auto-detect network from phone
  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    if (val.length >= 3) {
      const detected = detectGhanaNetwork(val);
      if (detected !== selectedNetwork) {
        setSelectedNetwork(detected);
        const match = bundles.find((b) => b.network === detected);
        if (match) setSelectedBundleId(match.id);
      }
    }
  };

  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || recipientPhone.length < 10) {
      alert('Please enter a valid 10-digit Ghana phone number (e.g. 0244123456).');
      return;
    }
    setStep('confirm');
  };

  const handleExecutePayment = () => {
    if (paymentMethod === 'wallet' && walletBalance < currentBundle.retailPrice) {
      alert('Insufficient wallet balance. Please top up or choose Direct Mobile Money payment.');
      return;
    }

    setStep('processing');

    const newRef = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      reference: newRef,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: 'Kojo Mensah',
      recipientPhone,
      network: selectedNetwork,
      serviceType: 'data',
      productName: currentBundle.name,
      amount: currentBundle.retailPrice,
      paymentMethod,
      status: 'delivered',
      agentMargin: Number((currentBundle.retailPrice - currentBundle.wholesalePrice).toFixed(2)),
      deliveryTimeline: [
        { step: 'Order Authorized', timestamp: '10:00:01', status: 'completed', note: `Paid via ${paymentMethod.replace('_', ' ')}` },
        { step: 'Core Gateway Dispatch', timestamp: '10:00:05', status: 'completed', note: `${selectedNetwork} Carrier Node` },
        { step: 'Network Acknowledged', timestamp: '10:00:12', status: 'completed', note: 'EVD Batch Accepted' },
        { step: 'Delivered to Beneficiary', timestamp: '10:00:19', status: 'completed', note: 'Customer balance credited' }
      ]
    };

    setTimeout(() => {
      onOrderCreated(newOrder);
      setCreatedOrder(newOrder);
      setStep('success');
    }, 2400);
  };

  const handleCopyRef = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator Header */}
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

        {/* Input Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-muted border border-border text-xs font-semibold">
          <button
            onClick={() => setInputMode('cards')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              inputMode === 'cards' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              inputMode === 'text' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick Text
          </button>
          <button
            onClick={() => setInputMode('bulk')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              inputMode === 'bulk' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Excel / Bulk
          </button>
        </div>
      </div>

      {step === 'select' && (
        <form onSubmit={handleStartCheckout} className="space-y-6">
          {/* 1. Network Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step 1: Choose Telecom Carrier
              </label>
              <SignalRail status="online" size="sm" label="Gateways Live" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((net) => {
                const isSelected = selectedNetwork === net;
                return (
                  <button
                    key={net}
                    type="button"
                    onClick={() => {
                      setSelectedNetwork(net);
                      const first = bundles.find((b) => b.network === net);
                      if (first) setSelectedBundleId(first.id);
                    }}
                    className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? net === 'MTN'
                          ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-500/30 font-bold'
                          : net === 'Telecel'
                          ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-500/30 font-bold'
                          : 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 font-bold'
                        : 'border-border bg-muted/40 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{net}</span>
                    <span className="text-[10px] opacity-85">Instant EVD</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Bundle Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step 2: Choose Data Size for {selectedNetwork}
              </label>
              <span className="text-xs text-muted-foreground">{filteredBundles.length} packages available</span>
            </div>

            {inputMode === 'cards' ? (
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
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs'
                          : 'border-border bg-background hover:bg-muted/60'
                      }`}
                    >
                      {b.isPopular && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300">
                          Popular
                        </span>
                      )}
                      <div>
                        <div className="text-base font-extrabold text-foreground">{b.sizeLabel}</div>
                        <div className="text-[11px] text-muted-foreground">{b.validity}</div>
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
            ) : inputMode === 'text' ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick select by bundle size:</p>
                <div className="flex flex-wrap gap-2">
                  {filteredBundles.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBundleId(b.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        selectedBundleId === b.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      {b.sizeLabel} - GH₵{b.retailPrice.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Paste multiple phone numbers (comma or newline separated):
                </label>
                <textarea
                  rows={3}
                  placeholder="0244192834, 0558291034, 0209182391"
                  value={bulkNumbersText}
                  onChange={(e) => setBulkNumbersText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs"
                />
              </div>
            )}
          </div>

          {/* 3. Beneficiary Phone & Payment Method */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Step 3: Recipient & Payment
            </label>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Recipient Ghana Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0244123456"
                  value={recipientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Carrier auto-detected: <strong className="text-foreground">{selectedNetwork}</strong>
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Choose Payment Source
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
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
                  <span className="text-xs font-bold text-primary">Instant (0s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod(selectedNetwork === 'MTN' ? 'momo_mtn' : selectedNetwork === 'Telecel' ? 'momo_telecel' : 'momo_at')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    paymentMethod !== 'wallet'
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">Direct Mobile Money</div>
                    <div className="text-[11px] text-muted-foreground">USSD PIN Prompt on SIM</div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">Push to Phone</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Review & Checkout Summary */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Order Summary:</div>
              <div className="text-base font-extrabold text-foreground">
                {currentBundle.name} ({currentBundle.validity})
              </div>
              <div className="text-xs text-muted-foreground">
                Recipient: <span className="font-mono text-foreground font-semibold">{recipientPhone}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Payable:</div>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  GH₵ {currentBundle.retailPrice.toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Review & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* CONFIRMATION STEP */}
      {step === 'confirm' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-lg space-y-6 max-w-lg mx-auto">
          <div className="text-center pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Confirm Data Recharge</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify beneficiary and carrier before dispatching to network gateway.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Carrier Network:</span>
              <span className="font-bold text-foreground">{selectedNetwork} Ghana</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Package:</span>
              <span className="font-bold text-foreground">{currentBundle.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Beneficiary Handset:</span>
              <span className="font-mono font-bold text-foreground">{recipientPhone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Payment Channel:</span>
              <span className="font-bold text-foreground capitalize">{paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-2 font-extrabold text-sm text-foreground">
              <span>Total Deduction:</span>
              <span className="text-primary tabular-nums">GH₵ {currentBundle.retailPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-semibold text-xs cursor-pointer"
            >
              Back & Modify
            </button>
            <button
              type="button"
              onClick={handleExecutePayment}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Confirm & Pay GH₵ {currentBundle.retailPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING STEP */}
      {step === 'processing' && (
        <div className="p-8 rounded-2xl bg-card border border-border shadow-lg text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Connecting to {selectedNetwork} Core Switch...</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dispatching bundle to <strong>{recipientPhone}</strong>. Waiting for carrier acknowledgement.
            </p>
          </div>
          <SignalRail status="processing" size="md" className="justify-center" label="EVD Dispatching" />
        </div>
      )}

      {/* SUCCESS STEP */}
      {step === 'success' && createdOrder && (
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xl space-y-6 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">Data Delivered Successfully!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>{createdOrder.productName}</strong> has been credited to <span className="font-mono text-foreground font-semibold">{createdOrder.recipientPhone}</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Reference:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-foreground">{createdOrder.reference}</span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-foreground tabular-nums">GH₵ {createdOrder.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Credited & SMS Sent</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onOpenReceipt(createdOrder)}
              className="flex-1 py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-semibold text-xs cursor-pointer"
            >
              View Official Receipt
            </button>
            <button
              onClick={() => {
                setStep('select');
                setCreatedOrder(null);
              }}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
            >
              Buy Another Bundle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
