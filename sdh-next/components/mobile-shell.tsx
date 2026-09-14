"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { FundModal, Sidebar, TITLES } from "@/components/app-shell";
import { I, Ic } from "@/components/icons";
import { NotificationBell } from "@/components/notifications";
import { AppRouter } from "@/components/router";
import { useStore } from "@/components/store";
import { PageLoader, Toasts } from "@/components/ui";

/* Smart Data Hub — MOBILE app shell
   Slide-in drawer (full role-based nav, reuses desktop <Sidebar/>),
   compact topbar, and a bottom quick-access bar with a center Buy sheet.
   Screens themselves are the platform's components, unchanged. */
const { useState: mShU, useEffect: mShE } = React;

/* bottom-bar quick access per role. `null` page = the center Buy FAB. */
const QUICK = {
  customer: [
    ["dashboard", "home", "Home"], ["wallet", "wallet", "Wallet"],
    [null, "plus", "Buy"],
    ["orders", "receipt", "Orders"], ["profile", "user", "Account"],
  ],
  reseller: [
    ["dashboard", "grid", "Home"], ["wallet", "wallet", "Wallet"],
    [null, "plus", "Buy"],
    ["store-orders", "receipt", "Orders"], ["profile", "user", "Account"],
  ],
  admin: [
    ["dashboard", "grid", "Overview"], ["orders", "list", "Orders"],
    ["withdrawals", "coins", "Payouts"], ["complaints", "flag", "Issues"],
    ["profile", "cog", "Settings"],
  ],
};

/* the center Buy sheet — fast paths into the most common purchase flows */
function BuySheet({ onClose }) {
  const { goApp } = useStore();
  const go = (page) => { goApp(page); onClose(); };
  const opts = [
    ["signal", "blue", "Buy data", "Bundles on every network", "buy-data"],
    ["phone", "teal", "Buy airtime", "Instant top-up", "buy-airtime"],
    ["plug", "blue", "Pay a bill", "Electricity, water, TV & more", "utilities"],
    ["ticket", "teal", "Results checker", "WAEC · BECE vouchers", "results-checker"],
  ];
  return (
    <div className="m-sheet-scrim" onClick={(e) => { if (e.target.classList.contains("m-sheet-scrim")) onClose(); }}>
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="grip"></div>
        <h3>What would you like to do?</h3>
        <p className="sub">Pick a quick action to get started.</p>
        {opts.map(([ic, c, t, s, page]) => (
          <button key={page} className="m-sheet-opt" onClick={() => go(page)}>
            <span className="ic" style={{ background: c === "blue" ? "var(--blue-050)" : "var(--teal-050)", color: c === "blue" ? "var(--blue)" : "var(--teal-ink)" }}><Ic name={ic} size={22} /></span>
            <span className="tx"><span className="t">{t}</span><span className="s">{s}</span></span>
            <I.chev size={18} stroke="var(--faint)" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileBottomNav({ onBuy }) {
  const { role, appPage, goApp } = useStore();
  const items = QUICK[role] || QUICK.reseller;
  return (
    <nav className="botnav">
      {items.map(([page, ic, label], i) => {
        if (page === null) {
          return (
            <button key="buy" className="bn bn-fab" onClick={onBuy} aria-label="Buy">
              <span className="fab"><I.plus size={26} stroke="#fff" sw={2.4} /></span>
              {label}
            </button>
          );
        }
        return (
          <button key={page} className={"bn" + (appPage === page ? " on" : "")} onClick={() => goApp(page)}>
            <Ic name={ic} size={23} />{label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileTopbar({ title, sub, showSub, onMenu, onFund }) {
  const { S, balance, credit } = useStore();
  return (
    <header className="topbar">
      <button className="iconbtn hamb" onClick={onMenu} aria-label="Menu"><I.menu size={22} /></button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="mtitle" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        {showSub && sub && <div className="msub">{sub}</div>}
      </div>
      <div className="right">
        <div className="wallet-pill">
          <div><div className="lbl">Wallet</div><div className="amt">{S.fmt(balance)}</div>{credit?.amount > 0 && <div className="lbl" style={{ color: "var(--teal)" }}>+{S.fmt(credit.amount)} credit</div>}</div>
          <button className="add" onClick={onFund} aria-label="Fund wallet"><I.plus size={16} stroke="#fff" /></button>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}

function MobileAppShell() {
  const { role, appPage } = useStore();
  const [drawer, setDrawer] = mShU(false);
  const [fundOpen, setFundOpen] = mShU(false);
  const [buyOpen, setBuyOpen] = mShU(false);
  const [loading, setLoading] = mShU(true);

  // brief loading state on every page change (simulates fetching)
  mShE(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 520); return () => clearTimeout(t); }, [appPage, role]);

  // tint the iOS status bar white while the dark drawer is open
  mShE(() => {
    document.documentElement.classList.toggle("m-drawer-open", drawer);
    return () => document.documentElement.classList.remove("m-drawer-open");
  }, [drawer]);

  // resolve page title/subtitle exactly like the desktop shell
  const t = TITLES[appPage];
  let title, sub;
  if (appPage === "dashboard") { [title, sub] = TITLES.dashboard[role]; }
  else if (Array.isArray(t)) { [title, sub] = t; }
  title = title || sub;

  const Page = AppRouter(appPage, role);

  return (
    <div className="m-app">
      <MobileTopbar title={title} sub={sub} showSub={appPage === "dashboard"} onMenu={() => setDrawer(true)} onFund={() => setFundOpen(true)} />
      <div className="m-scroll">
        <div className={"content" + (role === "admin" ? " wide" : "")}>
          {loading ? <PageLoader /> : <Page />}
        </div>
      </div>
      <MobileBottomNav onBuy={() => setBuyOpen(true)} />

      <div className={"m-drawer" + (drawer ? " open" : "")}>
        <div className="m-scrim" onClick={() => setDrawer(false)}></div>
        {drawer && <Sidebar onNav={() => setDrawer(false)} />}
      </div>

      {buyOpen && <BuySheet onClose={() => setBuyOpen(false)} />}
      {fundOpen && <FundModal onClose={() => setFundOpen(false)} />}
      <Toasts />
    </div>
  );
}

export { BuySheet, MobileAppShell, MobileBottomNav, MobileTopbar, QUICK };
