"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { NotificationBell } from "@/components/notifications";
import { AppRouter } from "@/components/router";
import { useStore } from "@/components/store";
import { Brand, Field, Modal, NetBadge, PageLoader, Toasts } from "@/components/ui";

/* Smart Data Hub — logged-in app shell (sidebar, topbar, role switch) */
const { useState: shU, useEffect: shE } = React;

const NAV = {
  customer: [
    { group: "Menu", items: [
      ["dashboard", "home", "Home"], ["buy-data", "signal", "Buy data"], ["buy-airtime", "phone", "Buy airtime"],
      ["results-checker", "ticket", "Results Checker"], ["afa", "idcard", "AFA Registration"], ["utilities", "plug", "Utilities & Bills"],
      ["wallet", "wallet", "Wallet"], ["orders", "receipt", "Orders"], ["notifications", "bell", "Notifications"], ["complaints", "flag", "My Complaints"], ["how-to", "doc", "How-to Guides"], ["whats-new", "sparkle", "What's New"], ["profile", "user", "Profile"],
    ] },
  ],
  reseller: [
    { group: "Overview", items: [
      ["dashboard", "grid", "Dashboard"], ["my-store", "brief", "My Store"],
    ] },
    { group: "Sell", items: [
      ["store-orders", "receipt", "Orders"], ["buy-data", "signal", "Buy data"], ["buy-airtime", "phone", "Buy airtime"], ["afa", "idcard", "AFA Registration"], ["results-checker", "ticket", "Results Checker"], ["utilities", "plug", "Utilities & Bills"], ["sms", "mail", "Bulk SMS"],
    ] },
    { group: "Earnings", items: [
      ["analytics", "chart", "Analytics"], ["commissions", "coins", "Earnings"], ["withdrawals", "download", "Withdraw"], ["pricing", "tag", "Pricing"],
    ] },
    { group: "Account", items: [
      ["wallet", "wallet", "Wallet"], ["transactions", "list", "Transactions"], ["customers", "user", "Customers"], ["notifications", "bell", "Notifications"], ["complaints", "flag", "My Complaints"], ["how-to", "doc", "How-to Guides"], ["profile", "cog", "Settings"], ["whats-new", "sparkle", "What's New"], ["community", "whatsapp", "Join Community"],
    ] },
  ],
  admin: [
    { group: "Operations", items: [
      ["dashboard", "grid", "Overview"], ["orders", "list", "Order monitor"], ["transactions", "receipt", "Transactions"], ["commissions", "coins", "Commissions"], ["withdrawals", "download", "Payouts"], ["complaints", "flag", "Complaints"],
    ] },
    { group: "Services", items: [
      ["afa", "idcard", "AFA"], ["checkers", "ticket", "Result Checkers"], ["sms", "mail", "SMS / Sender IDs"],
    ] },
    { group: "Manage", items: [
      ["failed-beneficiaries", "flag", "Beneficiary tracker"], ["agents", "brief", "All Agents"], ["users", "users", "Users"], ["referrals", "gift", "Referrals & Tiers"], ["notifications", "bell", "Notifications"], ["pricing", "sliders", "Pricing"], ["profile", "cog", "Settings"],
    ] },
  ],
};

const TITLES = {
  dashboard: { customer: ["Welcome back", "Your wallet & quick actions"], reseller: ["Agent dashboard", "Your earnings at a glance"], admin: ["Operations overview", "Live platform health"] },
  "buy-data": [null, "Buy data bundle"], "buy-airtime": [null, "Buy airtime"],
  "failed-beneficiaries": ["Beneficiary Tracker", "Numbers MTN refused — add them upstream, then verify"],
  wallet: [null, "Wallet & transactions"], orders: [null, "Orders & history"], profile: [null, "Profile & settings"],
  commissions: [null, "Earnings & profit"], withdrawals: [null, "Withdrawals & payouts"], customers: [null, "Your customers"],
  analytics: ["Analytics", "Your sales & profit insights"],
  users: [null, "User management"],
  agents: ["All Agents", "Every agent's sales & performance"],
  referrals: ["Referrals & Tiers", "Tier bonuses, referrals & recruitment overrides"],
  "my-store": ["My Store", "Build & manage your online store"],
  "store-orders": ["Orders", "Track & manage every customer order"],
  "results-checker": ["Results Checker", "Sell exam checker vouchers"],
  afa: ["AFA Registration", "Register MTN numbers for the AFA bundle"],
  utilities: ["Utilities & Bills", "Electricity, water, TV & streaming"],
  "pricing": ["Pricing", "Set prices by product & network"],
  sms: { customer: ["Bulk SMS", "Send bulk SMS to your customers"], reseller: ["Bulk SMS", "Send bulk SMS to your customers"], admin: ["SMS & Sender IDs", "Approve sender IDs & watch SMS credit"] },
  api: ["Developer API", "Integrate Smart Data Hub into your own apps"],
  transactions: [null, "All your money movements"],
  complaints: ["My Complaints", "Raise & track support issues"],
  notifications: ["Notifications", "Your alerts & announcements"],
  "whats-new": ["What's New", "Latest updates & features"],
  "how-to": ["How-to Guides", "Step-by-step tutorials"],
  community: [null, "Join the agent community"],
  checkers: ["Result Checkers", "Manage checker products & stock"],
};

function RoleSwitcher() {
  const { role, user, switchRole } = useStore();
  // Admins switch Admin/Agent/Customer; approved agents switch Agent/Customer. A plain
  // customer has nothing to switch to.
  const account = user?.role;
  const isAdmin = account === "admin";
  const canSwitch = account === "admin" || account === "reseller";
  const [open, setOpen] = shU(false);
  const initials = (user?.name || "").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() || "SDH";
  const label = (r) => r === "reseller" ? "Agent" : r === "admin" ? "Admin" : "Customer";

  const chip = (
    <div className="role-chip" style={{ width: "100%", textAlign: "left" }}>
      <div className="av" style={user?.avatar ? { overflow: "hidden", padding: 0 } : {}}>{user?.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="nm" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "My account"}</div>
        <div className="rl">{canSwitch ? `Viewing as ${label(role)}` : label(role)}</div>
      </div>
      {canSwitch && <I.chevd size={15} style={{ flexShrink: 0, opacity: .7, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />}
    </div>
  );

  if (!canSwitch) return chip;

  const opts = isAdmin
    ? [["admin", "Admin panel", "shield"], ["reseller", "Agent view", "brief"], ["customer", "Customer view", "user"]]
    : [["reseller", "Agent view", "brief"], ["customer", "Customer view", "user"]];
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", border: "none", background: "none", padding: 0, margin: 0, cursor: "pointer" }} aria-haspopup="menu" aria-expanded={open}>
        {chip}
      </button>
      {open && (
        <div role="menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 41, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 6, boxShadow: "0 14px 34px rgba(0,0,0,.38)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", padding: "6px 10px 5px", textTransform: "uppercase", letterSpacing: ".4px" }}>Switch view</div>
          {opts.map(([r, txt, ic]) => (
            <button key={r} role="menuitem" onClick={() => { switchRole(r); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, border: "none", cursor: "pointer", font: "inherit", fontSize: 13.5, fontWeight: 600, color: "var(--ink)", background: role === r ? "var(--bg)" : "transparent" }}>
              <Ic name={ic} size={17} />
              <span style={{ flex: 1, textAlign: "left" }}>{txt}</span>
              {role === r && <I.check size={15} stroke="var(--ok)" sw={3} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ onNav }) {
  const { role, appPage, goApp, logout, navBadges } = useStore();
  const groups = NAV[role];
  const activeGroup = (groups.find(g => g.items.some(it => it[0] === appPage)) || groups[0] || {}).group;
  const [openG, setOpenG] = shU(() => ({ [activeGroup]: true }));
  const toggleG = (g) => setOpenG(o => ({ ...o, [g]: !o[g] }));
  return (
    <aside className="side">
      <Brand light />
      <RoleSwitcher />
      <nav>
        {groups.map((grp, gi) => {
          const isOpen = openG[grp.group] ?? false;
          const hasActive = grp.items.some(it => it[0] === appPage);
          return (
            <div className={"nav-sec" + (isOpen ? " open" : "")} key={gi}>
              <button className={"nav-group" + (hasActive && !isOpen ? " has-active" : "")} onClick={() => toggleG(grp.group)} aria-expanded={isOpen}>
                <span>{grp.group}</span>
                <I.chevd size={15} className="nav-caret" />
              </button>
              <div className="nav-items">
                <div className="nav-items-inner">
                  {grp.items.map(([page, ic, label, badge]) => {
                    const b = (navBadges && navBadges[page]) || badge;
                    return (
                      <button key={page} className={"nl" + (appPage === page ? " on" : "")} onClick={() => { goApp(page); onNav && onNav(); }}>
                        <Ic name={ic} size={20} />{label}{b ? <span className="badge">{b}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="foot">
        <button className="logout" onClick={logout}><I.logout size={20} />Sign out</button>
      </div>
    </aside>
  );
}

function BottomNav() {
  const { role, appPage, goApp, navBadges } = useStore();
  const items = NAV[role].flatMap(g => g.items).slice(0, 5);
  return (
    <nav className="botnav">
      {items.map(([page, ic, label]) => {
        const b = navBadges && navBadges[page];
        return (
          <button key={page} className={"bn" + (appPage === page ? " on" : "")} onClick={() => goApp(page)} style={{ position: "relative" }}>
            <Ic name={ic} size={22} />{label}
            {b ? <span style={{ position: "absolute", top: 2, right: "50%", marginRight: -24, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "var(--telecel)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{b}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

function AppShell() {
  const { role, appPage, balance, credit, goApp, S, fundWallet, toast } = useStore();
  const [drawer, setDrawer] = shU(false);
  const [fundOpen, setFundOpen] = shU(false);
  const [loading, setLoading] = shU(true);

  // brief loading state on every page change (simulates fetching)
  shE(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 520); return () => clearTimeout(t); }, [appPage, role]);

  const t = TITLES[appPage];
  let title, sub;
  if (appPage === "dashboard") { [title, sub] = TITLES.dashboard[role]; }
  else if (Array.isArray(t)) { [title, sub] = t; }
  title = title || sub;

  const Page = AppRouter(appPage, role);

  return (
    <div className={"app" + (drawer ? " drawer-open" : "")} onClick={(e) => { if (drawer && e.target.classList.contains("app")) setDrawer(false); }}>
      <Sidebar onNav={() => setDrawer(false)} />
      <div className="main">
        <header className="topbar">
          <button className="iconbtn hamb" onClick={() => setDrawer(true)}><I.menu size={22} /></button>
          <div>
            <div className="mtitle">{title}</div>
            {appPage === "dashboard" && <div className="msub">{sub}</div>}
          </div>
          <div className="right">
            <div className="wallet-pill">
              <div><div className="lbl">Wallet</div><div className="amt">{S.fmt(balance)}</div>{credit?.amount > 0 && <div className="lbl" style={{ color: "var(--teal)" }} title="Referral credit — spendable on any product, not withdrawable">+{S.fmt(credit.amount)} credit</div>}</div>
              <button className="add" onClick={() => setFundOpen(true)} aria-label="Fund wallet"><I.plus size={18} stroke="#fff" /></button>
            </div>
            <NotificationBell />
          </div>
        </header>
        <div className={"content" + (role === "admin" ? " wide" : "")}>
          {loading ? <PageLoader /> : <Page />}
        </div>
      </div>
      <BottomNav />
      {fundOpen && <FundModal onClose={() => setFundOpen(false)} />}
      <Toasts />
    </div>
  );
}

function FundModal({ onClose }) {
  const { fundWallet, toast, S } = useStore();
  const [amt, setAmt] = shU(50);
  const [busy, setBusy] = shU(false);
  const picks = [20, 50, 100, 200, 500];
  const confirm = async () => {
    if (!amt || busy) return;
    setBusy(true);
    try {
      const r = await fundWallet(amt);
      // Demo top-up credits instantly and returns "demo" → just close. The real path
      // returns "redirect" and the browser navigates away to Paystack.
      if (r === "demo") onClose();
    } catch (e) {
      toast(e.message || "Could not start payment.", "info");
      setBusy(false);
    }
  };
  return (
    <Modal title="Fund your wallet" onClose={onClose}>
      {busy ? (
        <div className="flow-result"><div className="spin"></div><h2>Opening secure checkout…</h2><p>Redirecting you to Paystack to pay with mobile money, card or bank. Your balance updates the moment payment is confirmed.</p></div>
      ) : (
        <React.Fragment>
          <p className="muted" style={{ fontSize: 14, marginTop: -6, marginBottom: 14 }}>Add money with mobile money, card or bank — secured by Paystack. Your balance updates the moment payment is confirmed.</p>
          <div className="field"><label>Amount</label></div>
          <div className="amount-picks">{picks.map(p => <button key={p} className={"ap" + (amt === p ? " on" : "")} onClick={() => setAmt(p)}>{p}</button>)}</div>
          <Field label="Or enter amount" pre="GH₵" inputMode="numeric" value={amt} onChange={(e) => setAmt(Math.max(0, +e.target.value.replace(/\D/g, "") || 0))} />
          <button className="btn btn-pri btn-full" onClick={confirm} disabled={!amt}><I.lock size={18} stroke="#fff" />Continue · Pay {S.fmt(amt)}</button>
        </React.Fragment>
      )}
    </Modal>
  );
}

export { AppShell, BottomNav, FundModal, NAV, RoleSwitcher, Sidebar, TITLES };
