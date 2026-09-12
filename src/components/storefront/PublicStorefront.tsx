import React, { useState } from 'react';
import {
  Store,
  Wifi,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { AgentStoreConfig, DataBundle, TelecomNetwork, Order } from '../../types';
import { detectGhanaNetwork } from '../../mockData';
import { SignalRail } from '../common/SignalRail';

interface PublicStorefrontProps {
  storeConfig: AgentStoreConfig;
  bundles: DataBundle[];
  onOrderCreated: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  onSwitchToSDH: () => void;
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  storeConfig,
  bundles,
  onOrderCreated,
  onOpenReceipt,
  onSwitchToSDH,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>('MTN');
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    bundles.find((b) => b.network === 'MTN')?.id || 'mtn-5gb'
  );
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Telecel' | 'AT'>('MTN');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);

  // Compute retail price based on agent's markup
  const getAgentPrice = (b: DataBundle) => {
    return Number((b.wholesalePrice * (1 + storeConfig.marginMarkupPercent / 100)).toFixed(2));
  };

  const currentBundle = bundles.find((b) => b.id === selectedBundleId) || filteredBundles[0];
  const finalPrice = currentBundle ? getAgentPrice(currentBundle) : 0;
  const agentMargin = currentBundle ? Number((finalPrice - currentBundle.wholesalePrice).toFixed(2)) : 0;

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

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || recipientPhone.length < 10) {
      alert('Please provide a valid 10-digit Ghana mobile number.');
      return;
    }

    setIsCheckingOut(true);

    const ref = `KT-GH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: `ord-st-${Date.now()}`,
      reference: ref,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: 'Storefront Buyer',
      recipientPhone,
      network: selectedNetwork,
      serviceType: 'data',
      productName: `${currentBundle.name} (${storeConfig.storeName})`,
      amount: finalPrice,
      paymentMethod: 'momo_mtn',
      status: 'delivered',
      agentMargin,
      deliveryTimeline: [
        { step: 'Order Placed on Reseller Store', timestamp: '10:00:01', status: 'completed' },
        { step: 'MoMo Payment Received', timestamp: '10:00:04', status: 'completed' },
        { step: 'SDH EVD Gateway Dispatched', timestamp: '10:00:09', status: 'completed' },
        { step: 'Data Balance Credited', timestamp: '10:00:15', status: 'completed', note: 'Beneficiary credited' }
      ]
    };

    setTimeout(() => {
      setIsCheckingOut(false);
      onOrderCreated(newOrder);
      setCompletedOrder(newOrder);
    }, 2000);
  };

  const openWhatsAppHelp = () => {
    const text = encodeURIComponent(`Hello ${storeConfig.storeName}, I have a question regarding data on your store.`);
    window.open(`https://wa.me/233${storeConfig.whatsappNumber.replace(/^0/, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Store Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-primary/10 border border-border shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 font-black text-lg flex items-center justify-center shadow-xs">
              KT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {storeConfig.storeName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  Verified Agent
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{storeConfig.tagline}</p>
            </div>
          </div>

          <button
            onClick={openWhatsAppHelp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>

        {storeConfig.announcement && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-950 dark:text-amber-200 text-xs font-medium">
            📢 {storeConfig.announcement}
          </div>
        )}
      </div>

      {!completedOrder ? (
        <form onSubmit={handlePurchase} className="space-y-6">
          {/* Network Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Select Telecom Network
              </label>
              <SignalRail status="online" size="sm" label="Delivery Gateway Online" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => {
                    setSelectedNetwork(net);
                    const first = bundles.find((b) => b.network === net);
                    if (first) setSelectedBundleId(first.id);
                  }}
                  className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedNetwork === net
                      ? net === 'MTN'
                        ? 'bg-amber-400 text-amber-950 border-amber-500 font-extrabold ring-2 ring-amber-500/30'
                        : net === 'Telecel'
                        ? 'bg-red-600 text-white border-red-700 font-extrabold ring-2 ring-red-500/30'
                        : 'bg-blue-600 text-white border-blue-700 font-extrabold ring-2 ring-blue-500/30'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="text-sm font-extrabold">{net}</div>
                  <div className="text-[10px] opacity-80">Non-Expiry</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bundle Selection */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. Choose Data Package
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredBundles.map((b) => {
                const isSelected = selectedBundleId === b.id;
                const price = getAgentPrice(b);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBundleId(b.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs'
                        : 'border-border bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <div className="text-base font-extrabold text-foreground">{b.sizeLabel} Data</div>
                      <div className="text-[11px] text-muted-foreground">{b.validity}</div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-border flex justify-between items-baseline">
                      <span className="text-sm font-black text-primary tabular-nums">GH₵ {price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient Phone & MoMo */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              3. Beneficiary Ghana Mobile Number
            </label>

            <div className="relative">
              <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                required
                placeholder="e.g. 0244192834"
                value={recipientPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden font-mono tabular-nums"
              />
            </div>

            <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Order Total:</span>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  GH₵ {finalPrice.toFixed(2)}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing MoMo Push...</span>
                  </>
                ) : (
                  <>
                    <span>Pay with Mobile Money (GH₵ {finalPrice.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Recharge Complete!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Data package dispatched to <strong>{completedOrder.recipientPhone}</strong> via {storeConfig.storeName}.
            </p>
          </div>

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
              Buy Another
            </button>
          </div>
        </div>
      )}

      {/* Powered by Smart Data Hub Footer */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Powered by <strong>Smart Data Hub Ghana</strong></span>
        </div>
        <button
          onClick={onSwitchToSDH}
          className="text-primary font-bold hover:underline cursor-pointer"
        >
          Create your own Reseller Storefront →
        </button>
      </div>
    </div>
  );
};
