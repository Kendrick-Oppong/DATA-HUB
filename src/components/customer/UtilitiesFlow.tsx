import React, { useState } from 'react';
import { Zap, CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Droplet, Tv, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { SignalRail } from '../common/SignalRail';

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
  const [utilityType, setUtilityType] = useState<'ecg' | 'gwcl' | 'dstv' | 'gotv'>('ecg');
  const [accountNumber, setAccountNumber] = useState<string>('P1049281928');
  const [amount, setAmount] = useState<string>('50');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Mensah Residence (Validated)');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const utilities = [
    { id: 'ecg', name: 'ECG Electricity', icon: Zap, label: 'Prepaid Meter / Account' },
    { id: 'gwcl', name: 'Ghana Water (GWCL)', icon: Droplet, label: 'Customer Account No' },
    { id: 'dstv', name: 'DStv Ghana', icon: Tv, label: 'Smartcard / IUC Number' },
    { id: 'gotv', name: 'GOtv Ghana', icon: Tv, label: 'IUC Number' },
  ];

  const handleVerifyAccount = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setBeneficiaryName(
        utilityType === 'ecg'
          ? 'Kojo Mensah (Meter #P1049281928 - Accra West)'
          : utilityType === 'gwcl'
          ? 'Ama Serwaa (GWCL Acc #8392019)'
          : 'Kwame Owusu (DStv Compact Plus)'
      );
    }, 600);
  };

  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount) || 0;
    if (finalAmount <= 0) return;
    if (walletBalance < finalAmount) {
      alert('Insufficient wallet balance. Please top up your wallet.');
      return;
    }

    const ref = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomToken = utilityType === 'ecg'
      ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      : undefined;

    const newOrder: Order = {
      id: `ord-ut-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: 'Kojo Mensah',
      recipientPhone: '0244192834',
      network: 'MTN',
      serviceType: 'utility',
      productName: `${utilities.find((u) => u.id === utilityType)?.name} Payment`,
      amount: finalAmount,
      paymentMethod: 'wallet',
      status: 'delivered',
      meterNumber: accountNumber,
      meterToken: randomToken,
      deliveryTimeline: [
        { step: 'Order Placed', timestamp: '10:00:01', status: 'completed' },
        { step: 'Utility Provider Billed', timestamp: '10:00:04', status: 'completed' },
        { step: 'Token Generated', timestamp: '10:00:09', status: 'completed' }
      ]
    };

    onOrderCreated(newOrder);
    setCompletedOrder(newOrder);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <span>Utilities & Bill Payments</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant ECG power tokens, Ghana Water bills, and DStv / GOtv subscriptions.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="ECG/GWCL Gateway" />
      </div>

      {!completedOrder ? (
        <form onSubmit={handlePayBill} className="space-y-5">
          {/* Provider Selector */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              1. Select Utility Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {utilities.map((item) => {
                const Icon = item.icon;
                const isSelected = utilityType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUtilityType(item.id as any);
                      setBeneficiaryName('');
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30 text-foreground font-bold'
                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-xs font-semibold">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meter / Account Details */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. Account & Meter Number
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. Meter / Smartcard number..."
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setBeneficiaryName('');
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyAccount}
                className="px-4 py-2.5 rounded-xl border border-border bg-muted/60 text-xs font-bold hover:bg-muted cursor-pointer"
              >
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {beneficiaryName && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Verified Account: <strong>{beneficiaryName}</strong>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Payment Amount (GH₵)
              </label>
              <input
                type="number"
                min="5"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-center">
              <div>
                <span className="text-xs text-muted-foreground">Total Bill Due:</span>
                <div className="text-xl font-black text-foreground tabular-nums">
                  GH₵ {parseFloat(amount || '0').toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Pay Utility Bill</span>
                <ArrowRight className="w-4 h-4" />
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
            <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ref: <strong>{completedOrder.reference}</strong> for <strong>{completedOrder.meterNumber}</strong>.
            </p>
          </div>

          {completedOrder.meterToken && (
            <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-1 max-w-sm mx-auto">
              <span className="text-[10px] font-bold uppercase text-amber-900 dark:text-amber-300 block">
                ECG Recharge Token
              </span>
              <div className="font-mono text-base font-extrabold text-foreground tracking-wider">
                {completedOrder.meterToken}
              </div>
            </div>
          )}

          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={() => onOpenReceipt(completedOrder)}
              className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
            >
              View Receipt
            </button>
            <button
              onClick={() => setCompletedOrder(null)}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
            >
              Pay Another Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
