"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc } from "@/components/ui";

/* Smart Data Hub — HOW-TO / guides page (agent + customer help)
   Step-by-step tutorials with simple inline-SVG diagrams. Dark-mode native. */
const { useState: htU } = React;

/* ---- small inline diagrams (token-coloured, no external assets) ---- */
const D = {
  buy: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <g className="n">
        <rect x="10" y="26" width="58" height="44" rx="9" />
        <rect x="22" y="34" width="34" height="6" rx="3" className="f" />
        <rect x="22" y="46" width="24" height="6" rx="3" className="f" />
      </g>
      <path className="ar" d="M76 48h36" /><path className="ar" d="M104 43l8 5-8 5" />
      <g className="acc">
        <rect x="122" y="22" width="72" height="52" rx="10" />
        <circle cx="140" cy="40" r="7" /><rect x="134" y="54" width="48" height="6" rx="3" className="f2" />
      </g>
      <path className="ar" d="M202 48h36" /><path className="ar" d="M230 43l8 5-8 5" />
      <g className="ok">
        <circle cx="280" cy="48" r="24" />
        <path d="M269 48l8 8 14-16" className="ck" />
      </g>
    </svg>
  ),
  wallet: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <g className="acc"><rect x="14" y="30" width="74" height="40" rx="9" /><text x="51" y="55" className="tx">MoMo</text></g>
      <path className="ar" d="M96 50h44" /><path className="ar" d="M132 45l8 5-8 5" />
      <g className="n"><rect x="150" y="22" width="86" height="56" rx="11" /><rect x="164" y="34" width="34" height="7" rx="3" className="f" /><text x="164" y="62" className="tx big">GH₵</text></g>
      <path className="ar" d="M244 50h30" /><path className="ar" d="M266 45l8 5-8 5" />
      <g className="ok"><circle cx="296" cy="50" r="16" /><path d="M289 50l5 5 9-10" className="ck" /></g>
    </svg>
  ),
  store: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <g className="n"><rect x="92" y="14" width="136" height="68" rx="12" /><path d="M92 30h136" /><circle cx="104" cy="22" r="2.4" className="dot" /><circle cx="112" cy="22" r="2.4" className="dot" /></g>
      <g className="acc"><rect x="104" y="40" width="46" height="30" rx="7" /><rect x="170" y="40" width="46" height="30" rx="7" /></g>
      <g className="n2"><rect x="112" y="48" width="14" height="14" rx="4" /><rect x="178" y="48" width="14" height="14" rx="4" /></g>
    </svg>
  ),
  team: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <g className="acc"><circle cx="160" cy="26" r="15" /><path d="M160 26m-6 2a6 6 0 0 0 12 0" className="f2" /></g>
      <path className="ar" d="M160 42v6M160 48L86 68M160 48l74 20M160 48v18" />
      <g className="n">
        <circle cx="78" cy="74" r="13" /><circle cx="160" cy="74" r="13" /><circle cx="242" cy="74" r="13" />
      </g>
    </svg>
  ),
  track: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <line x1="40" y1="48" x2="280" y2="48" className="rail" />
      <g className="ok"><circle cx="40" cy="48" r="11" /><path d="M34 48l4 4 8-9" className="ck" /></g>
      <g className="ok"><circle cx="160" cy="48" r="11" /><path d="M154 48l4 4 8-9" className="ck" /></g>
      <g className="acc"><circle cx="280" cy="48" r="13" /><circle cx="280" cy="48" r="4" className="pulse" /></g>
      <text x="40" y="76" className="tx sm">Paid</text>
      <text x="160" y="76" className="tx sm">Sent</text>
      <text x="280" y="76" className="tx sm">Delivering</text>
    </svg>
  ),
  payout: () => (
    <svg viewBox="0 0 320 96" className="ht-svg" role="img">
      <g className="acc"><rect x="14" y="28" width="86" height="44" rx="10" /><text x="57" y="48" className="tx sm">Earnings</text><text x="57" y="64" className="tx big">GH₵</text></g>
      <path className="ar" d="M108 50h44" /><path className="ar" d="M144 45l8 5-8 5" />
      <g className="n"><rect x="162" y="32" width="64" height="36" rx="9" /><text x="194" y="54" className="tx sm">Withdraw</text></g>
      <path className="ar" d="M234 50h28" /><path className="ar" d="M256 45l8 5-8 5" />
      <g className="ok"><rect x="272" y="34" width="34" height="32" rx="8" /><path d="M280 50l5 5 9-10" className="ck" /></g>
    </svg>
  ),
};

const GUIDES = [
  { id: "buy", icon: "signal", diagram: "buy", title: "Buy data or airtime", sub: "Send a bundle to any number in seconds",
    steps: ["Open Buy data (or Buy airtime) and choose the network — MTN, Telecel or AT.",
      "For AT, pick iShare for instant standard bundles or BigTime for data that never expires.",
      "Pick a bundle, enter the recipient's phone number and double-check it.",
      "Pay from your wallet — the bundle is delivered automatically, usually in under a minute."] },
  { id: "wallet", icon: "wallet", diagram: "wallet", title: "Fund your wallet", sub: "Top up by MoMo to buy and resell",
    steps: ["Tap Fund (or open Wallet) and enter the amount you want to add.",
      "Choose your mobile-money network and approve the prompt on your phone.",
      "Your balance updates the moment payment is confirmed — every top-up shows a reference on its receipt."] },
  { id: "store", icon: "cart", diagram: "store", title: "Set up your online store", sub: "A branded link customers can buy from",
    steps: ["Go to My Store and add your store name, logo and a short sdh.gh link.",
      "Under Show in store, switch on the networks and services you want to sell (including AT BigTime).",
      "Set your price for each bundle — your commission is the difference from wholesale, paid to you automatically.",
      "Share your store link on WhatsApp status, your bio or a printable flyer from the Share kit."] },
  { id: "track", icon: "search", diagram: "track", title: "Track an order", sub: "Follow delivery from paid to delivered",
    steps: ["On any store, tap Track order and enter the order number or the phone you bought for.",
      "The live status card shows each step — payment received, sent to the network, delivered.",
      "If an order can't be delivered, it's automatically refunded — you'll see that on the timeline too."] },
  { id: "payout", icon: "coins", diagram: "payout", title: "Get paid", sub: "Move your earnings to MoMo or bank",
    steps: ["Your commission builds up under Earnings as your orders deliver.",
      "Open Withdraw, enter an amount and choose your payout destination.",
      "Approved withdrawals are sent to your mobile-money or bank account — track each one's status on the page."] },
];

function HowToPage() {
  const { role } = useStore();
  const isCustomer = role === "customer";
  const guides = isCustomer ? GUIDES.filter(g => ["buy", "wallet", "track"].includes(g.id)) : GUIDES;
  const [open, setOpen] = htU(guides[0] ? guides[0].id : "buy");
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card pad-lg ht-hero">
        <Arc style={{ top: -30, right: -20, width: 200 }} stroke="#fff" opacity={0.14} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><I.doc size={24} stroke="#fff" /><h3 style={{ color: "#fff", fontSize: 20 }}>How to use Smart Data Hub</h3></div>
        <p style={{ color: "rgba(255,255,255,.85)", fontSize: 14.5, marginTop: 8 }}>{isCustomer ? "Quick step-by-step guides for buying, paying and tracking your orders. Tap a guide to expand it." : "Quick step-by-step guides for everything in your account and store. Tap a guide to expand it."}</p>
      </div>

      <div className="ht-list">
        {guides.map(g => {
          const isOpen = open === g.id;
          const Diagram = D[g.diagram];
          return (
            <div className={"ht-guide" + (isOpen ? " open" : "")} key={g.id}>
              <button className="ht-head" onClick={() => setOpen(isOpen ? null : g.id)}>
                <span className="ht-ic"><Ic name={g.icon} size={20} /></span>
                <span className="ht-meta"><span className="ht-title">{g.title}</span><span className="ht-sub">{g.sub}</span></span>
                <span className="ht-chev"><I.chev size={18} stroke="currentColor" /></span>
              </button>
              {isOpen && (
                <div className="ht-body">
                  <div className="ht-diagram"><Diagram /></div>
                  <ol className="ht-steps">
                    {g.steps.map((s, i) => <li key={i}><span className="ht-num">{i + 1}</span><span>{s}</span></li>)}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="ht-foot">
        <I.whatsapp size={18} stroke="#12A150" />
        <div><div className="t">Still need a hand?</div><p className="muted">Reach our team on the WhatsApp Channel or raise a ticket from My Complaints.</p></div>
      </div>
    </div>
  );
}

// order-tracking.tsx reads window.HTDiagrams — preserve that legacy bridge.
if (typeof window !== "undefined") (window as any).HTDiagrams = D;

export { D, GUIDES, HowToPage };
