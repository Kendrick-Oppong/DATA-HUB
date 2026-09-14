import React, { useState, useMemo } from 'react';
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
  Check,
  Sparkles,
  Star,
  BadgeCheck,
  Clock,
  ArrowLeft,
  Tag,
  CreditCard,
  Lock,
  ExternalLink,
  Info,
  Radio,
  Share2
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
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>(storeConfig.defaultNetwork || 'MTN');
  const [selectedBundleId, setSelectedBundleId] = useState<string>(() => {
    const match = bundles.find((b) => b.network === (storeConfig.defaultNetwork || 'MTN'));
    return match ? match.id : (bundles[0]?.id || 'mtn-5gb');
  });
  const [recipientPhone, setRecipientPhone] = useState<string>('0244192834');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Telecel' | 'AT'>('MTN');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string>('');
  const [promoSuccess, setPromoSuccess] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [copiedRef, setCopiedRef] = useState(false);

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'authorizing' | 'dispatching' | 'completed'>('form');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Filter bundles by network
  const networkBundles = useMemo(() => {
    return bundles.filter((b) => b.network === selectedNetwork);
  }, [bundles, selectedNetwork]);

  // Filter by size
  const filteredBundles = useMemo(() => {
    return networkBundles.filter((b) => {
      const gb = parseFloat(b.sizeLabel.replace(/[^0-9.]/g, '')) || 0;
      if (sizeFilter === 'small') return gb < 5;
      if (sizeFilter === 'medium') return gb >= 5 && gb <= 20;
      if (sizeFilter === 'large') return gb > 20;
      return true;
    });
  }, [networkBundles, sizeFilter]);

  // Compute retail price with agent markup or custom prices
  const getAgentPrice = (b: DataBundle) => {
    if (storeConfig.customPrices && storeConfig.customPrices[b.id]) {
      return storeConfig.customPrices[b.id];
    }
    const markup = storeConfig.marginMarkupPercent || 8;
    return Number((b.wholesalePrice * (1 + markup / 100)).toFixed(2));
  };

  const currentBundle = bundles.find((b) => b.id === selectedBundleId) || networkBundles[0] || bundles[0];
  const baseRetailPrice = currentBundle ? getAgentPrice(currentBundle) : 0;
  
  // Calculate discount if promo applied
  const discountAmount = appliedDiscount ? Number(((baseRetailPrice * appliedDiscount.percent) / 100).toFixed(2)) : 0;
  const finalPrice = Math.max(0, Number((baseRetailPrice - discountAmount).toFixed(2)));
  const agentMargin = currentBundle ? Math.max(0, Number((finalPrice - currentBundle.wholesalePrice).toFixed(2))) : 0;

  // Auto-detect carrier when phone number is typed
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setRecipientPhone(clean);
    if (clean.length >= 3) {
      const detected = detectGhanaNetwork(clean);
      if (detected !== selectedNetwork) {
        setSelectedNetwork(detected);
        setMomoProvider(detected === 'AirtelTigo' ? 'AT' : detected as 'MTN' | 'Telecel');
        const match = bundles.find((b) => b.network === detected);
        if (match) setSelectedBundleId(match.id);
      }
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    // Check store promo codes or fallback promo codes
    const found = storeConfig.promoCodes?.find((p) => p.code.toUpperCase() === code && p.active);
    if (found) {
      setAppliedDiscount({ code: found.code, percent: found.discountPercent });
      setPromoSuccess(`Promo applied! ${found.discountPercent}% discount activated.`);
    } else if (code === 'DATA5' || code === 'SAVE5') {
      setAppliedDiscount({ code, percent: 5 });
      setPromoSuccess('Promo applied! 5% discount activated.');
    } else if (code === 'GHANA10' || code === 'WELCOME10') {
      setAppliedDiscount({ code, percent: 10 });
      setPromoSuccess('Promo applied! 10% discount activated.');
    } else {
      setPromoError('Invalid or expired promo code.');
    }
  };

  const handleStartCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || recipientPhone.length < 10) {
      alert('Please provide a valid 10-digit Ghana mobile number (e.g. 0244192834).');
      return;
    }

    setCheckoutStep('authorizing');
    setDispatchProgress(25);

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
      paymentMethod: momoProvider === 'MTN' ? 'momo_mtn' : momoProvider === 'Telecel' ? 'momo_telecel' : 'momo_at',
      status: 'delivered',
      agentMargin,
      deliveryTimeline: [
        { step: 'Order Placed on Reseller Store', timestamp: '10:00:01', status: 'completed' },
        { step: 'MoMo Payment Received', timestamp: '10:00:04', status: 'completed' },
        { step: 'SDH EVD Gateway Dispatched', timestamp: '10:00:09', status: 'completed' },
        { step: 'Data Balance Credited', timestamp: '10:00:15', status: 'completed', note: 'Beneficiary credited' }
      ]
    };

    // Stage 1: MoMo USSD Prompt push
    setTimeout(() => {
      setCheckoutStep('dispatching');
      setDispatchProgress(70);

      // Stage 2: Carrier Switch EVD Dispatch
      setTimeout(() => {
        setDispatchProgress(100);
        setCheckoutStep('completed');
        onOrderCreated(newOrder);
        setCompletedOrder(newOrder);
      }, 1500);
    }, 1500);
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const openWhatsAppHelp = () => {
    const text = encodeURIComponent(
      `Hello ${storeConfig.storeName}, I have a question about purchasing data from your store.`
    );
    window.open(`https://wa.me/233${storeConfig.whatsappNumber.replace(/^0/, '')}?text=${text}`, '_blank');
  };

  const shareStore = () => {
    if (navigator.share) {
      navigator.share({
        title: storeConfig.storeName,
        text: `Buy instant non-expiry data on ${storeConfig.storeName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Storefront link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Floating Mini-Nav for Storefront */}
      <div className="flex items-center justify-between px-2 text-xs">
        <button
          onClick={onSwitchToSDH}
          className="inline-flex items-center gap-1.5 font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Smart Data Hub Network</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={shareStore}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs"
          >
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:inline">Share Store</span>
          </button>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Carrier Gateways 100% Online</span>
          </div>
        </div>
      </div>

      {/* Hero Storefront Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg"
        style={storeConfig.themeColor ? {
          borderColor: `${storeConfig.themeColor}35`,
          boxShadow: `0 12px 36px -12px ${storeConfig.themeColor}20`,
        } : undefined}
      >
        {/* Subtle Ambient Background Gradient */}
        <div
          className="absolute top-0 inset-x-0 h-32 pointer-events-none transition-all"
          style={{
            background: storeConfig.themeColor
              ? `linear-gradient(135deg, ${storeConfig.themeColor}35 0%, rgba(245, 158, 11, 0.22) 50%, ${storeConfig.themeColor}18 100%)`
              : "linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(245, 158, 11, 0.20) 50%, rgba(37, 99, 235, 0.15) 100%)",
          }}
        />
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
        <div
          className="absolute -bottom-10 -left-10 size-36 rounded-full pointer-events-none"
          style={{
            background: storeConfig.themeColor ? `${storeConfig.themeColor}15` : "rgba(37, 99, 235, 0.12)",
            filter: "blur(28px)",
          }}
        />
        
        <div className="relative p-6 sm:p-8 pt-10 sm:pt-12 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-card shrink-0">
                {storeConfig.storeName.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {storeConfig.storeName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified Reseller
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-xl">
                  {storeConfig.tagline || 'Authorized telecom data reseller in Ghana. Non-expiry bundles with instant dispatch.'}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold mt-1.5">
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.98 (3,400+ satisfied buyers)</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono">⚡ 15-45s SLA Delivery</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={openWhatsAppHelp}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Agent</span>
              </button>
            </div>
          </div>

          {/* Announcement Bar */}
          {storeConfig.announcement && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{storeConfig.announcement}</span>
            </div>
          )}

          {/* Quick SLA Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
            <div className="p-2 rounded-xl bg-muted/40">
              <div className="text-xs font-black text-foreground">Non-Expiry</div>
              <div className="text-[10px] text-muted-foreground">Lifetime Validity</div>
            </div>
            <div className="p-2 rounded-xl bg-muted/40">
              <div className="text-xs font-black text-foreground">Direct Carrier EVD</div>
              <div className="text-[10px] text-muted-foreground">Automated Switch</div>
            </div>
            <div className="p-2 rounded-xl bg-muted/40">
              <div className="text-xs font-black text-foreground">100% Guaranteed</div>
              <div className="text-[10px] text-muted-foreground">Instant MoMo Rails</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Purchasing Shell */}
      {checkoutStep === 'form' && (
        <form onSubmit={handleStartCheckout} className="space-y-6">
          {/* STEP 1: Select Telecom Network */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">Step 1 of 3</span>
                <h2 className="text-base font-extrabold text-foreground">Select Telecom Carrier</h2>
              </div>
              <SignalRail status="online" size="sm" label="Gateway Connected" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* MTN Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedNetwork('MTN');
                  setMomoProvider('MTN');
                  const first = bundles.find((b) => b.network === 'MTN');
                  if (first) setSelectedBundleId(first.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedNetwork === 'MTN'
                    ? 'bg-amber-400/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-border/80 bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                    MTN
                  </div>
                  {selectedNetwork === 'MTN' && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-foreground">MTN Ghana</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Turbonet & Non-Expiry</div>
                <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Latency: 28ms • 99.9%
                </div>
              </button>

              {/* Telecel Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedNetwork('Telecel');
                  setMomoProvider('Telecel');
                  const first = bundles.find((b) => b.network === 'Telecel');
                  if (first) setSelectedBundleId(first.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedNetwork === 'Telecel'
                    ? 'bg-red-500/10 border-red-500 ring-2 ring-red-500/30'
                    : 'border-border/80 bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    TC
                  </div>
                  {selectedNetwork === 'Telecel' && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-foreground">Telecel Ghana</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Extra & Non-Expiry</div>
                <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Latency: 32ms • 99.8%
                </div>
              </button>

              {/* AirtelTigo (AT) Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedNetwork('AirtelTigo');
                  setMomoProvider('AT');
                  const first = bundles.find((b) => b.network === 'AirtelTigo');
                  if (first) setSelectedBundleId(first.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedNetwork === 'AirtelTigo'
                    ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-border/80 bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    AT
                  </div>
                  {selectedNetwork === 'AirtelTigo' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-foreground">AT (AirtelTigo)</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Big Time Non-Expiry</div>
                <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Latency: 34ms • 99.7%
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Choose Data Package */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">Step 2 of 3</span>
                <h2 className="text-base font-extrabold text-foreground">
                  Choose {selectedNetwork === 'AirtelTigo' ? 'AT' : selectedNetwork} Package
                </h2>
              </div>

              {/* Size filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 text-xs">
                {(['all', 'small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSizeFilter(sz)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      sizeFilter === sz ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sz === 'all' ? 'All' : sz === 'small' ? '<5GB' : sz === 'medium' ? '5-20GB' : '20GB+'}
                  </button>
                ))}
              </div>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredBundles.map((b) => {
                const isSelected = selectedBundleId === b.id;
                const price = getAgentPrice(b);
                const gigabytes = parseFloat(b.sizeLabel.replace(/[^0-9.]/g, '')) || 1;
                const pricePerGb = (price / gigabytes).toFixed(2);

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBundleId(b.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]'
                        : 'border-border/80 bg-background hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    {b.isPopular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shadow-xs">
                        Popular
                      </span>
                    )}

                    <div>
                      <div className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {b.sizeLabel}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {b.validity}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        ~GH₵ {pricePerGb}/GB
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/60 flex items-baseline justify-between">
                      <span className="text-base font-black text-foreground tabular-nums">
                        GH₵ {price.toFixed(2)}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Beneficiary & Checkout */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-primary">Step 3 of 3</span>
              <h2 className="text-base font-extrabold text-foreground">Beneficiary & MoMo Checkout</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Data is delivered directly to this Ghana number via carrier EVD switch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Phone Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Recipient Phone Number</span>
                  <span className="text-[11px] text-muted-foreground">Auto-detects Carrier</span>
                </label>

                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="024XXXXXXX"
                    value={recipientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm font-mono tabular-nums focus:ring-2 focus:ring-primary focus:border-primary outline-hidden"
                  />
                  <div className="absolute right-2.5 top-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-foreground border border-border">
                      {selectedNetwork}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">Quick test:</span>
                  <button
                    type="button"
                    onClick={() => handlePhoneChange('0244192834')}
                    className="text-[11px] font-mono font-bold text-primary hover:underline cursor-pointer"
                  >
                    0244192834 (MTN)
                  </button>
                  <span className="text-muted-foreground text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => handlePhoneChange('0208123456')}
                    className="text-[11px] font-mono font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    0208123456 (Telecel)
                  </button>
                </div>
              </div>

              {/* Payment Channel Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Mobile Money Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMomoProvider('MTN')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      momoProvider === 'MTN'
                        ? 'border-amber-500 bg-amber-400/15 text-amber-950 dark:text-amber-300 ring-1 ring-amber-500'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMomoProvider('Telecel')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      momoProvider === 'Telecel'
                        ? 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    Telecel Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setMomoProvider('AT')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      momoProvider === 'AT'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    AT Money
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Secured by Bank of Ghana MoMo Gateway Standards</span>
                </div>
              </div>
            </div>

            {/* Promo Code Strip */}
            <div className="pt-2 border-t border-border/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. WELCOME10)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="h-8 px-3 rounded-lg border border-input bg-background text-xs font-mono uppercase focus:ring-1 focus:ring-primary outline-hidden w-48"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="h-8 px-3 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-xs cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {appliedDiscount && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Code {appliedDiscount.code} applied ({appliedDiscount.percent}% off)
                  </span>
                )}
              </div>
              {promoError && <p className="text-xs text-destructive font-medium mt-1">{promoError}</p>}
              {promoSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{promoSuccess}</p>}
            </div>

            {/* Order Breakdown Summary & Checkout Action */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Selected Bundle:</span>
                <span className="font-bold text-foreground">{currentBundle.name} ({currentBundle.validity})</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Target Carrier:</span>
                <span className="font-bold text-foreground">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Beneficiary Handset:</span>
                <span className="font-mono font-bold text-foreground">{recipientPhone || 'Not entered'}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount ({appliedDiscount.percent}%):</span>
                  <span>- GH₵ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Network Delivery Surcharge:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE (GH₵ 0.00)</span>
              </div>

              <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">Total Payable</span>
                  <div className="text-3xl font-black text-foreground tabular-nums">
                    GH₵ {finalPrice.toFixed(2)}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2.5 shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Authorize MoMo Push (GH₵ {finalPrice.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Checkout In-Flight Simulation Screen */}
      {(checkoutStep === 'authorizing' || checkoutStep === 'dispatching') && (
        <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border/80 shadow-2xl text-center space-y-6 animate-in fade-in-50">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-foreground">
              {checkoutStep === 'authorizing'
                ? 'Pushing Mobile Money Prompt...'
                : 'Routing Carrier Direct EVD...'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {checkoutStep === 'authorizing'
                ? `Please approve the GH₵ ${finalPrice.toFixed(2)} prompt sent to ${recipientPhone} on your handset.`
                : `Handshake verified! Crediting ${currentBundle.sizeLabel} data on the ${selectedNetwork} core switch.`}
            </p>
          </div>

          {/* Visual Step Pipeline */}
          <div className="max-w-md mx-auto space-y-2 text-left bg-muted/40 p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>MoMo Payment Gateway Authenticated</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${checkoutStep === 'dispatching' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>Carrier HLR/IN Switch Handshake</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${dispatchProgress === 100 ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
              <span>Beneficiary SIM Balance Credited</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${dispatchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Completed State: Award Winning Digital Confirmation */}
      {checkoutStep === 'completed' && completedOrder && (
        <div className="p-8 sm:p-12 rounded-3xl bg-card border border-emerald-500/30 shadow-2xl text-center space-y-6 animate-in fade-in-50 zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Dispatched & Credited
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground">
              Recharge Successful!
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              <strong>{currentBundle.sizeLabel} Non-Expiry Data</strong> has been dispatched to{' '}
              <strong className="font-mono text-foreground">{completedOrder.recipientPhone}</strong> via {storeConfig.storeName}.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Reference:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-foreground">
                <span>{completedOrder.reference}</span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(completedOrder.reference)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Copy Reference"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Carrier Switch:</span>
              <span className="font-bold text-foreground">{completedOrder.network} Core EVD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-black text-foreground tabular-nums">GH₵ {completedOrder.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="font-mono text-foreground">{completedOrder.date}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onOpenReceipt(completedOrder)}
              className="flex-1 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-bold text-xs hover:bg-muted transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              <span>View Official Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCheckoutStep('form');
                setCompletedOrder(null);
                setDispatchProgress(0);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy Another Package</span>
            </button>
          </div>
        </div>
      )}

      {/* Powered by Smart Data Hub Footer */}
      <div className="p-5 rounded-3xl bg-card border border-border/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-[10px]">
            SDH
          </div>
          <span>
            Powered by <strong>Smart Data Hub Ghana</strong> Telecom Infrastructure
          </span>
        </div>
        <button
          type="button"
          onClick={onSwitchToSDH}
          className="text-primary font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Launch your own branded Storefront</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PublicStorefront;
