import React, { useState } from 'react';
import { GraduationCap, CheckCircle2, Copy, Check, Eye, EyeOff, Download, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { ResultCheckerProduct, Order } from '../../types';
import { SignalRail } from '../common/SignalRail';

interface ResultsCheckerFlowProps {
  checkers: ResultCheckerProduct[];
  walletBalance: number;
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const ResultsCheckerFlow: React.FC<ResultsCheckerFlowProps> = ({
  checkers,
  walletBalance,
  onOrderCreated,
  onOpenReceipt,
}) => {
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>(checkers[0]?.id || 'waec-wassce');
  const [quantity, setQuantity] = useState<number>(1);
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [purchasedOrder, setPurchasedOrder] = useState<Order | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const currentChecker = checkers.find((c) => c.id === selectedCheckerId) || checkers[0];
  const totalPrice = Number((currentChecker.price * quantity).toFixed(2));

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletBalance < totalPrice) {
      alert('Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    const ref = `SDH-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomSerial = `W26-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-chk-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: 'Kojo Mensah',
      recipientPhone,
      network: 'MTN',
      serviceType: 'checker',
      productName: `${currentChecker.title} (${quantity}x)`,
      amount: totalPrice,
      paymentMethod: 'wallet',
      status: 'delivered',
      voucherSerial: randomSerial,
      voucherCode: randomPin,
      deliveryTimeline: [
        { step: 'Order Placed', timestamp: '10:00:01', status: 'completed' },
        { step: 'Voucher Allocated', timestamp: '10:00:03', status: 'completed', note: 'Authentic WAEC stock' },
        { step: 'SMS Dispatched', timestamp: '10:00:06', status: 'completed', note: `Sent to ${recipientPhone}` }
      ]
    };

    onOrderCreated(newOrder);
    setPurchasedOrder(newOrder);
  };

  const handleCopyVoucher = () => {
    if (!purchasedOrder) return;
    const text = `Smart Data Hub Voucher\n${purchasedOrder.productName}\nSerial: ${purchasedOrder.voucherSerial}\nPIN: ${purchasedOrder.voucherCode}\nCheck on: https://ghana.waecdirect.org`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <span>Results Checkers & Admission Vouchers</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instant delivery of authentic WAEC, BECE Placement, and University application scratch codes.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="WAEC Server Sync" />
      </div>

      {!purchasedOrder ? (
        <form onSubmit={handlePurchase} className="space-y-6">
          {/* Voucher Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checkers.map((item) => {
              const isSelected = selectedCheckerId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCheckerId(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                        {item.examBody}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.stockCount} in stock
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Unit Price:</span>
                    <span className="text-base font-black text-foreground tabular-nums">
                      GH₵ {item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quantity & Phone Input */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Number of Vouchers
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 5, 10].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        quantity === qty
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/60 text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {qty}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Phone for Instant SMS Copy
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
                  placeholder="e.g. 0244192834"
                />
              </div>
            </div>

            {/* Total and Buy Action */}
            <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Total Voucher Price:</span>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  GH₵ {totalPrice.toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Pay & Reveal Voucher</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Masked Voucher Card Result */
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-bold text-base text-foreground">Voucher Purchased & Verified</h3>
                <p className="text-xs text-muted-foreground">Order Ref: {purchasedOrder.reference}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
              Ready for WAEC
            </span>
          </div>

          {/* Sealed Security Scratch Card UI */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-muted/60 to-purple-500/15 border border-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Authentic E-Voucher Card
              </span>
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted flex items-center gap-1.5 cursor-pointer"
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{revealed ? 'Mask Code' : 'Reveal PIN'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Serial Number:</span>
                <span className="font-mono text-base font-extrabold text-foreground tabular-nums">
                  {purchasedOrder.voucherSerial}
                </span>
              </div>

              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Voucher PIN:</span>
                <span className="font-mono text-base font-extrabold text-primary tracking-wider tabular-nums">
                  {revealed ? purchasedOrder.voucherCode : '•••• - •••• - ••••'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyVoucher}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Serial & PIN'}</span>
            </button>

            <a
              href="https://ghana.waecdirect.org"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Check on WAEC Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => {
                setPurchasedOrder(null);
                setRevealed(false);
              }}
              className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 cursor-pointer"
            >
              Buy Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
