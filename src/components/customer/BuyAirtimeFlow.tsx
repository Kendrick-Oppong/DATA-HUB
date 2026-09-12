import React, { useState } from 'react';
import { PhoneCall, Zap, CheckCircle2, ArrowRight, Loader2, Smartphone, ShieldCheck } from 'lucide-react';
import { TelecomNetwork, Order } from '../../types';
import { detectGhanaNetwork } from '../../mockData';
import { SignalRail } from '../common/SignalRail';

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
  const [network, setNetwork] = useState<TelecomNetwork>('MTN');
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'momo_mtn'>('wallet');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const quickAmounts = [5, 10, 20, 50, 100, 200];
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handlePhoneChange = (val: string) => {
    setRecipientPhone(val);
    if (val.length >= 3) {
      setNetwork(detectGhanaNetwork(val));
    }
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;
    if (paymentMethod === 'wallet' && walletBalance < finalAmount) {
      alert('Insufficient wallet balance. Please fund your wallet or select Mobile Money.');
      return;
    }

    setIsProcessing(true);

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
      setIsProcessing(false);
      onOrderCreated(newOrder);
      setCompletedOrder(newOrder);
    }, 1800);
  };

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

      {!completedOrder ? (
        <form onSubmit={handleRecharge} className="space-y-5">
          {/* Network Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              1. Select Carrier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    network === net
                      ? net === 'MTN'
                        ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-500/30'
                        : net === 'Telecel'
                        ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-500/30'
                        : 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30'
                      : 'border-border bg-muted/40 hover:bg-muted text-foreground'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. Choose Airtime Amount (GH₵)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    amount === amt && !customAmount
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  GH₵{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="Or enter custom amount in GH₵..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
            />
          </div>

          {/* Recipient Phone & Payment */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              3. Beneficiary Handset
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

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-muted-foreground">Total Airtime to Send:</span>
                <span className="text-xl font-black text-foreground tabular-nums">GH₵ {finalAmount.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing || finalAmount <= 0}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Recharge with {network}...</span>
                  </>
                ) : (
                  <>
                    <span>Recharge GH₵ {finalAmount.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-5 shadow-lg">
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
            <button
              onClick={() => onOpenReceipt(completedOrder)}
              className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
            >
              Receipt
            </button>
            <button
              onClick={() => setCompletedOrder(null)}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
            >
              Recharge Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
