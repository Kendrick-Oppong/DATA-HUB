import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Eye,
  Sliders,
  Sparkles,
  Smartphone,
  Save,
  Layers,
  AlertCircle
} from 'lucide-react';
import { AgentStoreConfig, DataBundle, TelecomNetwork } from '../../types';
import { SignalRail } from '../common/SignalRail';

interface MyStoreBuilderProps {
  storeConfig: AgentStoreConfig;
  onUpdateStoreConfig: (newConfig: AgentStoreConfig) => void;
  onOpenStorefront: () => void;
  bundles: DataBundle[];
}

export const MyStoreBuilder: React.FC<MyStoreBuilderProps> = ({
  storeConfig,
  onUpdateStoreConfig,
  onOpenStorefront,
  bundles,
}) => {
  const [config, setConfig] = useState<AgentStoreConfig>(storeConfig);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewNetwork, setPreviewNetwork] = useState<TelecomNetwork>('MTN');

  const storeUrl = `smartdatahub.com/store/${config.handle}`;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateStoreConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const previewBundles = bundles.filter((b) => b.network === previewNetwork);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            <span>My Storefront Builder</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your brand identity, retail markup, WhatsApp desk, and publish your public store.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </span>
          )}
          <button
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* 3-Column Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1 (Left): Settings & Identity (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>1. Store Identity</span>
            </h3>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Store Display Name</label>
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Store Handle (URL Slug)</label>
              <div className="flex items-center rounded-xl border border-input bg-background px-3 py-2 text-muted-foreground">
                <span>/store/</span>
                <input
                  type="text"
                  value={config.handle}
                  onChange={(e) => setConfig({ ...config, handle: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full bg-transparent text-foreground font-mono focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Tagline</label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Broadcast Announcement Banner</label>
              <input
                type="text"
                value={config.announcement}
                onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">WhatsApp Customer Support Number</label>
              <input
                type="tel"
                value={config.whatsappNumber}
                onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-foreground font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Pricing & Margins Card */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>2. Retail Markup Margin</span>
            </h3>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-muted-foreground">Store Markup Percentage:</span>
                <span className="text-primary font-bold tabular-nums">+{config.marginMarkupPercent}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={config.marginMarkupPercent}
                onChange={(e) => setConfig({ ...config, marginMarkupPercent: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Automatically calculates retail prices on top of wholesale cost.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (Center): Live Storefront Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Live Storefront Preview</span>
            </span>
            <button
              onClick={onOpenStorefront}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Screen</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Phone / Tablet Style Card Preview Container */}
          <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Mock Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/15 via-card to-amber-500/10 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                    KT
                  </div>
                  <span className="font-extrabold text-xs text-foreground">{config.storeName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                  Verified Agent
                </span>
              </div>

              {config.announcement && (
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 text-[10px] font-semibold">
                  {config.announcement}
                </div>
              )}
            </div>

            {/* Mock Store Network Tabs */}
            <div className="p-3 bg-muted/40 border-b border-border flex gap-1">
              {(['MTN', 'Telecel', 'AirtelTigo'] as TelecomNetwork[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPreviewNetwork(n)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                    previewNetwork === n
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Mock Bundle List with Agent Prices */}
            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {previewBundles.map((b) => {
                const markupPrice = Number((b.wholesalePrice * (1 + config.marginMarkupPercent / 100)).toFixed(2));
                return (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl border border-border bg-background flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground">{b.sizeLabel} Data</div>
                      <div className="text-[10px] text-muted-foreground">{b.validity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-primary tabular-nums">GH₵ {markupPrice.toFixed(2)}</div>
                      <button className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold mt-1">
                        Buy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mock WhatsApp Bar */}
            <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Order questions?</span>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp ({config.whatsappNumber})</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3 (Right): Publish & Share Checklist (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">3. Storefront Status</h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, status: 'published' })}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                  config.status === 'published'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/30'
                    : 'border-border bg-muted/30 text-foreground'
                }`}
              >
                <span>Live & Published</span>
                {config.status === 'published' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </button>

              <button
                type="button"
                onClick={() => setConfig({ ...config, status: 'paused' })}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                  config.status === 'paused'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold'
                    : 'border-border bg-muted/30 text-foreground'
                }`}
              >
                <span>Paused (Maintenance)</span>
                {config.status === 'paused' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </button>
            </div>

            {/* Checklist */}
            <div className="pt-3 border-t border-border space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Readiness Checklist
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Store Name Configured</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Wholesale Margins Applied</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Carrier Core Gateways Linked</span>
                </div>
              </div>
            </div>

            {/* Share & QR Kit */}
            <div className="pt-3 border-t border-border space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Store Share Kit
              </span>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-muted flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Store Link'}</span>
              </button>

              <button
                onClick={() => {
                  const text = encodeURIComponent(`Buy fast, non-expiry data on Kofi Telecom! Visit: https://${storeUrl}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share to WhatsApp Status</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
