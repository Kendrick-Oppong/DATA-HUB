import React, { useState } from 'react';
import {
  Wifi,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  GraduationCap,
  Store,
  Users,
  MessageCircle,
  HelpCircle,
  Clock,
  Search,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Send,
  AlertCircle
} from 'lucide-react';
import { TelecomNetwork, DataBundle, Order, UserRole } from '../../types';
import { SignalRail } from '../common/SignalRail';
import { KeyRound, LogIn } from 'lucide-react';

interface PublicMarketingSiteProps {
  bundles: DataBundle[];
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onOpenOrderTracker?: (refOrPhone: string) => void;
  onApplyAgent?: () => void;
  orders: Order[];
  onNavigate?: (role: UserRole, tab: string) => void;
  onOpenReceipt?: (order: Order) => void;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'demo') => void;
  onOpenSecurityPins?: () => void;
}

export const PublicMarketingSite: React.FC<PublicMarketingSiteProps> = ({
  bundles,
  onStartPurchase,
  onOpenOrderTracker,
  onApplyAgent,
  orders,
  onNavigate,
  onOpenReceipt,
  onOpenAuth,
  onOpenSecurityPins,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>('MTN');
  const [selectedBundleId, setSelectedBundleId] = useState<string>('mtn-5gb');
  const [quickPhone, setQuickPhone] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'agent' | 'track' | 'faq' | 'about' | 'contact'>('home');
  const [searchTrackInput, setSearchTrackInput] = useState<string>('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);
  
  // Agent Calculator State
  const [calcDailyBundles, setCalcDailyBundles] = useState<number>(25);
  const [calcAvgMargin, setCalcAvgMargin] = useState<number>(3.50);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [contactCategory, setContactCategory] = useState<string>('Order Delivery Issue');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  const filteredBundles = bundles.filter((b) => b.network === selectedNetwork);
  const currentBundle = bundles.find((b) => b.id === selectedBundleId) || filteredBundles[0];

  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    } else if (onNavigate) {
      onNavigate('customer', 'buy-data');
    }
  };

  const handleApplyAgent = () => {
    if (onApplyAgent) {
      onApplyAgent();
    } else if (onNavigate) {
      onNavigate('agent', 'my-store');
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const cleaned = searchTrackInput.trim();
    const found = orders.find(
      (o) => o.reference.toLowerCase() === cleaned.toLowerCase() || o.recipientPhone.includes(cleaned)
    );
    setTrackedOrder(found || null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const faqs = [
    {
      q: 'How fast will my data bundle or airtime be delivered?',
      a: 'Over 98% of orders are delivered within 15 to 45 seconds of successful Mobile Money authorization. Our automated core switch directly connects to MTN EVD, Telecel Wholesale, and AT Direct Gateways.'
    },
    {
      q: 'Does Smart Data Hub support all Ghanaian networks?',
      a: 'Yes. We support MTN Ghana (including Turbonet & Non-Expiry), Telecel Ghana (Extra & Bossu), and AirtelTigo (Big Time & Sika Data) with instant automated delivery.'
    },
    {
      q: 'What happens if my Mobile Money is deducted but data is delayed?',
      a: 'Our smart reconciliation engine verifies every transaction. If upstream network delays exceed 5 minutes, our system either retries via an alternate priority route or automatically refunds the full amount to your wallet.'
    },
    {
      q: 'How can I become an Agent and start my own data business?',
      a: 'Click "Agent Program" in the menu! You get wholesale pricing, your own customizable public storefront (e.g. smartdatahub.com/store/your-name), real-time commission tracking, and instant MoMo withdrawals.'
    },
    {
      q: 'How do Result Checkers work?',
      a: 'You can purchase authentic WAEC WASSCE, BECE Placement, and Nov/Dec vouchers. The serial and PIN are revealed immediately on screen and sent to your phone via SMS, ready to check on waecdirect.org.'
    },
    {
      q: 'What is AFA Registration?',
      a: 'AFA (Agricultural Workers Association) registration qualifies individuals for subsidized telecom data tariffs (e.g. 10GB for ~GH₵35). We process national ID verification and tariff enrollment.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sub-nav for Public sections */}
      <div className="border-b border-border bg-card/60 sticky top-16 z-30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto py-2.5 text-xs font-semibold">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'home' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'services' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Services Directory
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'agent' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Agent Program</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold">Earn MoMo</span>
            </button>
            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'track' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Track Order
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'faq' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'about' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              About SDH
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'contact' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Support & Contact
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenSecurityPins && (
              <button
                onClick={onOpenSecurityPins}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-bold cursor-pointer"
                title="View Hardcoded PINs"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>PINs (0000)</span>
              </button>
            )}

            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('customer', 'overview')}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch App</span>
              </button>
            )}

            <div className="hidden xl:flex items-center gap-1.5 pl-2 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px]">99.8% Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: HOME PAGE */}
      {activeTab === 'home' && (
        <div>
          {/* Hero Section with Interactive Bundle Selector */}
          <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                
                {/* Left Hero Pitch */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                    <SignalRail status="online" size="sm" />
                    <span>Ghana's Trusted Digital Services & Telecom Hub</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                    Buy, sell, and deliver <span className="text-primary">data & digital services</span> with confidence.
                  </h1>

                  <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                    Instant delivery for <strong>MTN, Telecel, and AirtelTigo</strong> data bundles, airtime, WAEC vouchers, and AFA registration. Backed by real-time tracking and automated refunds.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => handleStartPurchase(selectedBundleId, selectedNetwork)}
                      className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                    >
                      <span>Buy Data Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab('agent')}
                      className="px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm hover:bg-muted transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-amber-500" />
                      <span>Start Your Data Store</span>
                    </button>
                  </div>

                  {/* Trust Proof Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/70 max-w-lg">
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">42s</div>
                      <div className="text-[11px] text-muted-foreground">Avg. Delivery Speed</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">99.8%</div>
                      <div className="text-[11px] text-muted-foreground">Gateway Uptime</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">GH₵ 0</div>
                      <div className="text-[11px] text-muted-foreground">Risk (Auto Refund)</div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Interactive Quick Buy Card */}
                <div className="lg:col-span-5">
                  <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h3 className="font-bold text-sm text-foreground">Quick Bundle Checkout</h3>
                      </div>
                      <SignalRail status="online" size="sm" label="Fast MoMo" />
                    </div>

                    {/* Network Selector Tabs */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Select Network
                      </label>
                      <div className="grid grid-cols-3 gap-2">
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
                              className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
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
                          );
                        })}
                      </div>
                    </div>

                    {/* Bundle Grid */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Select Data Package
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {filteredBundles.slice(0, 6).map((bundle) => {
                          const isSelected = selectedBundleId === bundle.id;
                          return (
                            <button
                              key={bundle.id}
                              type="button"
                              onClick={() => setSelectedBundleId(bundle.id)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                  : 'border-border bg-background hover:bg-muted'
                              }`}
                            >
                              <div className="text-xs font-extrabold text-foreground">{bundle.sizeLabel}</div>
                              <div className="text-[11px] font-semibold text-primary tabular-nums">
                                GH₵ {bundle.retailPrice.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate">{bundle.validity}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recipient Phone Input */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Recipient Ghana Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="e.g. 0244123456"
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring tabular-nums"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {selectedNetwork} network delivery will trigger instantly upon payment.
                      </p>
                    </div>

                    {/* Total & Submit Button */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-muted-foreground">Amount to Pay:</span>
                        <span className="text-lg font-black text-foreground tabular-nums">
                          GH₵ {currentBundle?.retailPrice.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartPurchase(selectedBundleId, selectedNetwork)}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Three Steps Explanation */}
          <section className="py-16 border-b border-border bg-card/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  How Smart Data Hub Delivers
                </h2>
                <p className="text-sm text-muted-foreground">
                  A seamless 60-second delivery workflow engineered for Ghanaian telecom networks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                    01
                  </div>
                  <h3 className="font-bold text-base text-foreground">Select Package & Phone</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pick your preferred telecom network and bundle size. Enter any active Ghana SIM number.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                    02
                  </div>
                  <h3 className="font-bold text-base text-foreground">Approve MoMo Prompt</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pay securely using MTN MoMo, Telecel Cash, AT Money, or your preloaded SDH Wallet balance.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                    03
                  </div>
                  <h3 className="font-bold text-base text-foreground">Instant Data Credited</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Our direct carrier gateway credits the beneficiary handset in seconds with official receipt and SMS.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Services Catalog Banner */}
          <section className="py-16 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                    Explore Digital Services
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Everything you need on one platform with unified tracking and payment.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>View All Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => onStartPurchase('mtn-5gb', 'MTN')}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Data Bundles</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    MTN, Telecel, AT bundles up to 100GB with non-expiry options.
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-primary">Buy from GH₵4.80 →</span>
                </div>

                <div
                  onClick={() => onStartPurchase('airtime', 'MTN')}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Airtime Top-up</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instant electronic top-up for all networks from GH₵1 to GH₵500.
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-amber-600">Recharge SIM →</span>
                </div>

                <div
                  onClick={() => onStartPurchase('waec-wassce', 'MTN')}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Results Checkers</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    WAEC WASSCE, BECE Placement, and University admission vouchers.
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-purple-600">Get Serial & PIN →</span>
                </div>

                <div
                  onClick={() => onStartPurchase('afa', 'MTN')}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">AFA Registration</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Farmer & Worker subsidized tariff enrollment with national ID.
                  </p>
                  <span className="inline-block mt-3 text-xs font-bold text-emerald-600">Register SIM →</span>
                </div>
              </div>
            </div>
          </section>

          {/* Agent Program Callout */}
          <section className="py-16 bg-gradient-to-r from-primary/10 via-card to-amber-500/10 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Turn Telecom Data into Daily Income</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Start your own branded data shop in 5 minutes
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get wholesale data rates, your personal store URL (<span className="font-mono text-primary">smartdatahub.com/store/your-name</span>), set your own selling margins, and withdraw profits directly to your Mobile Money wallet anytime.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground pt-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Zero setup fee</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Instant MoMo payouts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Automated delivery</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setActiveTab('agent')}
                    className="px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                  >
                    View Agent Benefits
                  </button>
                  <button
                    onClick={handleApplyAgent}
                    className="px-6 py-3.5 rounded-xl border border-border bg-muted/60 text-foreground font-bold text-sm hover:bg-muted transition-all cursor-pointer"
                  >
                    Apply as Agent
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: SERVICES DIRECTORY */}
      {activeTab === 'services' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Services Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse all digital services, current prices, network availability, and delivery guarantees.
            </p>
          </div>

          {/* Network Filter Bar */}
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-2">Filter Network:</span>
            {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((net) => (
              <button
                key={net}
                onClick={() => setSelectedNetwork(net)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedNetwork === net
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {net} Ghana
              </button>
            ))}
          </div>

          {/* Data Bundles Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              <span>{selectedNetwork} Ghana Data Packages</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBundles.map((b) => (
                <div key={b.id} className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{b.network}</span>
                      <h3 className="font-extrabold text-lg text-foreground">{b.sizeLabel}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {b.validity}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-baseline">
                    <div>
                      <span className="text-xs text-muted-foreground">Price: </span>
                      <span className="text-lg font-black text-foreground tabular-nums">GH₵ {b.retailPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => handleStartPurchase(b.id, b.network)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AGENT PROGRAM & CALCULATOR */}
      {activeTab === 'agent' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-bold">
              SDH Merchant & Reseller Program
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Start Your Own Telecom Resale Business
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Earn reliable daily margins by retailing mobile data bundles, exam vouchers, and utilities to friends, students, and your community.
            </p>
          </div>

          {/* Interactive Agent Earnings Calculator */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border gap-2">
              <div>
                <h3 className="text-lg font-bold text-foreground">Interactive Profit Calculator</h3>
                <p className="text-xs text-muted-foreground">Estimate your monthly profits based on sales volume and markup</p>
              </div>
              <SignalRail status="online" size="sm" label="Instant MoMo Payouts" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-muted-foreground">Estimated Bundles Sold per Day:</span>
                    <span className="text-foreground font-bold tabular-nums text-sm">{calcDailyBundles} bundles / day</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={calcDailyBundles}
                    onChange={(e) => setCalcDailyBundles(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-muted-foreground">Average Profit Margin per Bundle:</span>
                    <span className="text-foreground font-bold tabular-nums text-sm">GH₵ {calcAvgMargin.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.50"
                    value={calcAvgMargin}
                    onChange={(e) => setCalcAvgMargin(parseFloat(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Calculated Monthly Earnings Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-amber-500/10 border border-border space-y-4 flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Projected Monthly Commission
                </div>
                <div className="text-4xl font-black text-foreground tabular-nums">
                  GH₵ {(calcDailyBundles * calcAvgMargin * 30).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on <strong>{calcDailyBundles * 30} orders/month</strong> delivered automatically through your personal public storefront.
                </p>
                <button
                  onClick={handleApplyAgent}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                >
                  Apply to Become an Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUBLIC ORDER TRACKING */}
      {activeTab === 'track' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Track Any Order</h1>
            <p className="text-sm text-muted-foreground">
              Enter your order reference number or Ghana mobile phone to inspect live delivery status.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="e.g. SDH-GH-2026-94812 or 0244192834..."
                value={searchTrackInput}
                onChange={(e) => setSearchTrackInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              Track
            </button>
          </form>

          {trackSearched && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {trackedOrder ? (
                <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b border-border">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground">Order Ref: {trackedOrder.reference}</div>
                      <h3 className="text-lg font-extrabold text-foreground">{trackedOrder.productName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-foreground tabular-nums">GH₵ {trackedOrder.amount.toFixed(2)}</div>
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        {trackedOrder.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Signal Timeline */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase">Signal Dispatch Timeline</div>
                    <div className="space-y-2 border-l-2 border-primary/30 pl-3 py-1">
                      {trackedOrder.deliveryTimeline.map((step, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="font-semibold text-foreground flex justify-between">
                            <span>{step.step}</span>
                            <span className="text-muted-foreground tabular-nums">{step.timestamp}</span>
                          </div>
                          {step.note && <div className="text-[11px] text-muted-foreground">{step.note}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-card border border-border text-muted-foreground text-sm space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p>No active order found for "{searchTrackInput}".</p>
                  <p className="text-xs">Check that the reference is typed correctly or try searching with your phone number.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FAQ */}
      {activeTab === 'faq' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Frequently Asked Questions</h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about purchasing, delivery, and reselling on Smart Data Hub.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl bg-card border border-border overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex justify-between items-center font-bold text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-primary" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: ABOUT US */}
      {activeTab === 'about' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">About Smart Data Hub</h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Smart Data Hub (SDH) is Ghana's mission-driven digital commerce and telecom distribution network. We power connectivity for thousands of Ghanaian students, professionals, micro-enterprises, and telecom merchants across all 16 regions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">Carrier Level Direct</h3>
              <p className="text-xs text-muted-foreground">
                Automated core gateway integration with MTN Ghana, Telecel, and AT Ghana.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">BoG Regulated Rails</h3>
              <p className="text-xs text-muted-foreground">
                All Mobile Money flows are settled via authorized financial institutions with instant dispute resolution.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground">Local Customer Support</h3>
              <p className="text-xs text-muted-foreground">
                Dedicated Accra-based NOC support desk reachable 24/7 via WhatsApp and phone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUPPORT & CONTACT */}
      {activeTab === 'contact' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Contact & NOC Support</h1>
            <p className="text-sm text-muted-foreground">
              Have an issue with an order or payment? Our support engineers resolve tickets in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://wa.me/233244192834?text=Hello%20Smart%20Data%20Hub%20Support"
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-emerald-600 text-white flex items-center gap-3 hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-8 h-8" />
              <div>
                <div className="font-bold text-sm">WhatsApp Priority Desk</div>
                <div className="text-xs opacity-90">+233 24 419 2834 (Live)</div>
              </div>
            </a>

            <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <div className="font-bold text-sm text-foreground">Operating Hours</div>
                <div className="text-xs text-muted-foreground">24 Hours / 7 Days a week</div>
              </div>
            </div>
          </div>

          {/* Contact Ticket Form */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs">
            {contactSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Support Ticket Submitted!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Ticket <strong>TKT-SDH-{Math.floor(1000 + Math.random() * 9000)}</strong> has been opened. An NOC engineer will contact your phone shortly.
                </p>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-foreground">File a Support Request</h3>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Issue Category</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  >
                    <option>Order Delivery Delay</option>
                    <option>Mobile Money Debited but No Data</option>
                    <option>Failed Result Checker Voucher</option>
                    <option>Agent Onboarding / Payout Question</option>
                    <option>General Feedback</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Your Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0244192834"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your issue with order reference number..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Submit Support Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center">
                  SDH
                </div>
                <span className="font-extrabold text-sm text-foreground">Smart Data Hub</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ghana's trusted consumer fintech and telecom resale infrastructure. Instant automated delivery on all networks.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Quick Services</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => handleStartPurchase('mtn-5gb', 'MTN')} className="hover:text-primary cursor-pointer">Buy MTN Data</button></li>
                <li><button onClick={() => handleStartPurchase('telecel-10gb', 'Telecel')} className="hover:text-primary cursor-pointer">Buy Telecel Data</button></li>
                <li><button onClick={() => handleStartPurchase('at-5gb', 'AirtelTigo')} className="hover:text-primary cursor-pointer">Buy AT Big Time Data</button></li>
                <li><button onClick={() => onNavigate ? onNavigate('customer', 'results-checker') : handleStartPurchase('waec-wassce', 'MTN')} className="hover:text-primary cursor-pointer">WASSCE / BECE Checkers</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Company & Legal</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => setActiveTab('about')} className="hover:text-primary">About Smart Data Hub</button></li>
                <li><button onClick={() => setActiveTab('faq')} className="hover:text-primary">Frequently Asked Questions</button></li>
                <li><button onClick={() => setActiveTab('track')} className="hover:text-primary">Order Status Tracker</button></li>
                <li><button onClick={() => setActiveTab('contact')} className="hover:text-primary">Terms of Service & SLA</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Accra NOC Desk</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Airport Residential Area, Accra, Ghana.<br />
                Support: <span className="font-mono text-foreground font-semibold">+233 24 419 2834</span><br />
                Email: <span className="text-foreground">support@smartdatahub.com</span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
            <div>
              © 2026 Smart Data Hub Ghana. All rights reserved. Primary currency: GH₵.
            </div>
            <div className="flex items-center gap-4">
              <span>MTN MoMo</span>
              <span>Telecel Cash</span>
              <span>AT Money</span>
              <span>GhQR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
