"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { FundModal } from "@/components/app-shell";
import { I, Ic } from "@/components/icons";
import { OrderStatusModal } from "@/components/order-status";
import { useStore } from "@/components/store";
import { Arc, CountUp, DataLoader, Field, Kente, Modal, NetBadge, Pill } from "@/components/ui";
import { isOpen, statusLabel } from "@/lib/orderStatus";

/* Smart Data Hub — customer pages + shared wallet/orders/profile */
const { useState: cuU, useEffect: cuE } = React;

// Change-password dialog — verifies the current password server-side.
function ChangePasswordModal({ onClose }) {
  const { changePassword, toast } = useStore();
  const [cur, setCur] = cuU("");
  const [next, setNext] = cuU("");
  const [conf, setConf] = cuU("");
  const [err, setErr] = cuU("");
  const [busy, setBusy] = cuU(false);
  const submit = async () => {
    if (next.length < 4) return setErr("New password must be at least 4 characters.");
    if (next !== conf) return setErr("New passwords don't match.");
    setErr(""); setBusy(true);
    try { await changePassword(cur, next); toast("Password updated", "check"); onClose(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Modal title="Change password" onClose={onClose}
      foot={<div className="mfoot"><button className="btn btn-out" onClick={onClose}>Cancel</button><button className="btn btn-pri" onClick={submit} disabled={busy} style={busy ? { opacity: .7 } : undefined}>{busy ? "Updating…" : "Update password"}</button></div>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Current password" icon="lock" reveal placeholder="Enter current password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <Field label="New password" icon="lock" reveal placeholder="At least 4 characters" value={next} onChange={(e) => setNext(e.target.value)} />
        <Field label="Confirm new password" icon="lock" reveal placeholder="Re-enter new password" value={conf} onChange={(e) => setConf(e.target.value)} />
        {err && <div className="hint err" style={{ textAlign: "center" }}>{err}</div>}
      </div>
    </Modal>
  );
}

function OrderRow({ o }) {
  const { S } = useStore();
  return (
    <tr>
      <td><div className="netcell"><NetBadge net={o.net} /><div><div>{o.pkg}</div><div className="mono">{o.recipient}</div></div></div></td>
      <td style={{ textTransform: "capitalize" }} className="muted">{o.type}</td>
      <td className="amt amt-neg">{S.fmt(o.cost)}</td>
      <td><Pill status={o.status} /></td>
      <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(o.at)}</td>
    </tr>);

}

function CustomerDashboard() {
  const { S, balance, orders, goApp } = useStore();
  const [fund, setFund] = cuU(false);
  const qa = [
  ["signal", "Buy data", "All networks", "blue", "buy-data"],
  ["phone", "Buy airtime", "Instant top-up", "teal", "buy-airtime"],
  ["ticket", "Results Checker", "WAEC · BECE · placement", "blue", "results-checker"],
  ["idcard", "AFA Registration", "Cheaper MTN data", "teal", "afa"],
  ["fund", "Fund wallet", "Via mobile money", "blue", null],
  ["receipt", "My orders", "Track delivery", "teal", "orders"]];

  return (
    <React.Fragment>
      <div className="earn-hero" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Kente style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Arc style={{ bottom: -40, right: 40, width: 260 }} stroke="#fff" opacity={0.12} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="lbl" style={{ marginTop: 8 }}>Wallet balance</div>
          <div className="big"><CountUp value={balance} /></div>
          <div className="sub">Spendable balance · funds your data &amp; airtime purchases</div>
        </div>
        <div className="acts" style={{ position: "relative", zIndex: 2, marginTop: 0 }}>
          <button className="btn btn-teal" onClick={() => setFund(true)}><I.plus size={18} />Fund wallet</button>
          <button className="btn" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }} onClick={() => goApp("buy-data")}><I.bolt size={18} stroke="#fff" />Buy data</button>
        </div>
      </div>

      <BecomeAgentCard />

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Quick actions</h3></div>
        <div className="qa-grid">
          {qa.map(([ic, t, s, c, page], i) =>
          <button className="qa" key={i} onClick={() => page ? goApp(page) : setFund(true)}>
              <div className="ic" style={{ background: c === "blue" ? "var(--blue-050)" : "var(--teal-050)", color: c === "blue" ? "var(--blue)" : "var(--teal-ink)" }}><Ic name={ic} size={22} /></div>
              <div className="t" style={{ color: "rgb(255, 255, 255)" }}>{t}</div><div className="s">{s}</div>
            </button>
          )}
        </div>
      </div>

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Recent orders</h3><span className="link" onClick={() => goApp("orders")}>View all</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Type</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
            <tbody>{orders.slice(0, 5).map((o) => <OrderRow key={o.id} o={o} />)}</tbody>
          </table>
        </div>
      </div>
      {fund && <FundModal onClose={() => setFund(false)} />}
    </React.Fragment>);

}

// Lets a customer apply to become an agent (admin approval required). Shows the application
// state — apply, under review, or reapply after a rejection. Hidden for agents/admins.
function BecomeAgentCard() {
  const { user } = useStore();
  const [open, setOpen] = cuU(false);
  if (!user || user.role !== "customer") return null;
  const status = user.agentStatus || "none";

  if (status === "pending") {
    return (
      <div className="card pad-lg" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, background: "#FFF4E0", border: "1px solid rgba(185,121,28,.28)" }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, background: "#B9791C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.clock size={22} stroke="#fff" /></span>
        <div style={{ flex: 1 }}><strong style={{ fontSize: 15.5 }}>Agent application under review</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>We're reviewing your request to become an agent. You'll get an SMS &amp; email the moment it's approved.</div></div>
      </div>
    );
  }
  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, background: "var(--teal-050)", border: "1px solid rgba(14,158,146,.2)" }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--teal-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.brief size={22} stroke="#fff" /></span>
        <div style={{ flex: 1 }}><strong style={{ fontSize: 15.5 }}>{status === "rejected" ? "Reapply to become an agent" : "Become an agent & earn"}</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Open your own online store, set your prices and earn commission on every sale.{status === "rejected" ? " Your previous application wasn't approved — you can apply again." : ""}</div></div>
        <button className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 14, flexShrink: 0 }} onClick={() => setOpen(true)}><I.brief size={16} stroke="#fff" />{status === "rejected" ? "Reapply" : "Become an agent"}</button>
      </div>
      {open && <BecomeAgentModal onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
}

function BecomeAgentModal({ onClose }) {
  const { requestAgent, toast, user } = useStore();
  const [biz, setBiz] = cuU(user?.business || "");
  const [busy, setBusy] = cuU(false);
  const [err, setErr] = cuU("");
  const submit = async () => {
    if (!biz.trim() || busy) return;
    setBusy(true); setErr("");
    try { await requestAgent(biz.trim()); toast("Application submitted — we'll review it shortly", "check"); onClose(); }
    catch (e) { setErr(e?.message || "Could not submit your application."); setBusy(false); }
  };
  return (
    <Modal title="Become an agent" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6, marginBottom: 14 }}>Agents get an online store, set their own prices and earn commission on every data, airtime and voucher sale. An admin reviews each application — you'll be notified by SMS &amp; email once approved.</p>
      <Field label="Business / store name" icon="brief" placeholder="e.g. Kwesi Data Hub" value={biz} onChange={(e) => setBiz(e.target.value)} />
      {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
      <button className="btn btn-pri btn-full" disabled={!biz.trim() || busy} style={{ opacity: (!biz.trim() || busy) ? .5 : 1, marginTop: 4 }} onClick={submit}><I.send size={18} stroke="#fff" />{busy ? "Submitting…" : "Submit application"}</button>
    </Modal>
  );
}

function WalletPage() {
  const { S, balance, ledger, role, earnings, refreshWallet, user, dataLoading } = useStore();
  const [fund, setFund] = cuU(false);
  // Keep the balance & history live whenever the wallet is opened.
  cuE(() => { if (user?.id) refreshWallet(); }, []);
  const typeMeta = {
    topup: ["wallet", "var(--ok)", "var(--ok-bg)"], purchase: ["bolt", "var(--blue)", "var(--blue-050)"],
    refund: ["refresh", "var(--ok)", "var(--ok-bg)"]
  };
  return (
    <React.Fragment>
      <div className={"grid " + (role === "reseller" ? "g-2" : "")} style={{ marginBottom: 18 }}>
        <div className="earn-hero">
          <Kente style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
          <div className="lbl" style={{ marginTop: 8 }}>Wallet balance</div>
          <div className="big"><CountUp value={balance} /></div>
          <div className="sub">Use this to buy data &amp; airtime. Funded via mobile money.</div>
          <div className="acts"><button className="btn btn-teal" onClick={() => setFund(true)}><I.plus size={18} />Fund wallet</button></div>
        </div>
        {role === "reseller" &&
        <div className="card pad-lg" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="lbl" style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Commission available</div>
            <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 40, color: "var(--teal-ink)", marginTop: 8 }}>{S.fmt(earnings.available)}</div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Withdrawable to mobile money — separate from your spendable wallet.</div>
          </div>
        }
      </div>
      <div className="card pad-lg">
        <div className="card-h"><h3>Transaction history</h3></div>
        <div className="tbl-wrap">
          {dataLoading.wallet && <DataLoader label="Loading your wallet…" />}
          {!dataLoading.wallet && (
          <table className="tbl">
            <thead><tr><th>Transaction</th><th>Reference</th><th>Amount</th><th>When</th></tr></thead>
            <tbody>
              {ledger.length === 0 && (
                <tr><td colSpan={4}><div className="muted" style={{ textAlign: "center", padding: "34px 0" }}>No transactions yet — fund your wallet to get started.</div></td></tr>
              )}
              {ledger.map((e) => {
                const [ic, col, bg] = typeMeta[e.type] || ["receipt", "var(--muted)", "var(--bg)"];
                return (
                  <tr key={e.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 36, height: 36, borderRadius: 11, background: bg, color: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={ic} size={18} /></span><div><div style={{ fontWeight: 600, textTransform: "capitalize" }}>{e.type}</div><div className="muted" style={{ fontSize: 12.5 }}>{e.note}</div></div></div></td>
                    <td className="mono">{e.ref}</td>
                    <td className={"amt " + (e.amount > 0 ? "amt-pos" : "amt-neg")}>{e.amount > 0 ? "+" : "−"}{S.fmt(Math.abs(e.amount))}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(e.at)}</td>
                  </tr>);

              })}
            </tbody>
          </table>
          )}
        </div>
      </div>
      {fund && <FundModal onClose={() => setFund(false)} />}
    </React.Fragment>);

}

function OrdersPage() {
  const { S, orders, refreshOrders, user, dataLoading } = useStore();
  cuE(() => { if (user?.id) refreshOrders(); }, []);
  const [filter, setFilter] = cuU("all");
  const [report, setReport] = cuU(null);
  const [refreshing, setRefreshing] = cuU(false);
  // The "In progress" chip covers every unsettled state — awaiting payment, waiting and
  // processing. What a customer wants to filter on is "is it still coming?"; the row's own
  // pill says exactly which stage it's at.
  const filtered = filter === "all" ? orders
    : filter === "open" ? orders.filter((o) => isOpen(o.status))
    : orders.filter((o) => o.status === filter);
  const counts = { all: orders.length, delivered: orders.filter((o) => o.status === "delivered").length, open: orders.filter((o) => isOpen(o.status)).length, failed: orders.filter((o) => o.status === "failed").length };

  const doRefresh = async () => {
    if (refreshing || !user?.id) return;
    setRefreshing(true);
    try { await refreshOrders(); } finally { setRefreshing(false); }
  };

  // Live status: while any order is still processing, re-pull from the server every
  // 10s so webhook-driven delivery/failure updates appear without a manual refresh.
  cuE(() => {
    // Includes orders still awaiting payment, so one flips from Pending to Waiting on screen
    // the moment its payment confirms. Refreshing the list costs no provider calls — the
    // server only reconciles orders a provider actually holds.
    if (!user?.id || !orders.some((o) => isOpen(o.status))) return;
    const t = setInterval(() => { refreshOrders(); }, 10000);
    return () => clearInterval(t);
  }, [orders, user]);

  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
        <h3>Order history</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {counts.open > 0 && <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--blue)" }}>{counts.open} in progress…</span>}
          <button className="btn btn-out" style={{ padding: "7px 12px", fontSize: 12.5, opacity: refreshing ? .6 : 1 }} onClick={doRefresh} disabled={refreshing}><I.refresh size={14} />{refreshing ? "Refreshing…" : "Refresh"}</button>
        </div>
      </div>
      <div className="card-h" style={{ flexWrap: "wrap", borderTop: "none", paddingTop: 0 }}>
        <div className="seg" style={{ margin: 0, width: "auto" }}>
          {[["all", "All"], ["delivered", "Delivered"], ["open", "In progress"], ["failed", "Failed"]].map(([f, lbl]) =>
          <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(f)}>{lbl} {counts[f] ? <span className="seg-count" style={{ opacity: .7 }}>· {counts[f]}</span> : ""}</button>
          )}
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Order</th><th>Ref</th><th>Type</th><th>Amount</th><th>Status</th><th>When</th><th></th></tr></thead>
          <tbody>
            {filtered.map((o) =>
            <tr key={o.id}>
                <td><div className="netcell"><NetBadge net={o.net} /><div><div>{o.pkg}</div><div className="mono">{o.recipient}</div></div></div></td>
                <td className="mono">{o.id}</td>
                <td className="muted" style={{ textTransform: "capitalize" }}>{o.type}</td>
                <td className="amt amt-neg">{S.fmt(o.cost)}</td>
                <td><Pill status={o.status}>{statusLabel(o.status)}</Pill></td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(o.at)}</td>
                <td><button className="btn btn-out" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => setReport(o)}><I.info size={14} />Status</button></td>
              </tr>
            )}
          </tbody>
        </table>
        {dataLoading.orders && <DataLoader label="Loading your orders…" />}
        {!dataLoading.orders && filtered.length === 0 && <div className="empty"><div className="ic"><I.receipt size={28} /></div><p>No {filter} orders yet.</p></div>}
      </div>
      {report && <OrderStatusModal order={report} onClose={() => setReport(null)} />}
    </div>);

}

function ProfilePage() {
  const { S, user, role, toast, logout, navSite, setScreen, updateProfile, store, goApp } = useStore();
  const initials = (user?.name || "Kwesi Boateng").split(" ").map((s) => s[0]).slice(0, 2).join("");
  const [name, setName] = cuU(user?.name || "");
  const [email, setEmail] = cuU(user?.email || "");
  const [biz, setBiz] = cuU(user?.business || "");
  const [busy, setBusy] = cuU(false);
  const [notif, setNotif] = cuU(user?.notif || { orders: true, lowbal: true, promos: false });
  const [pwOpen, setPwOpen] = cuU(false);
  const [avBusy, setAvBusy] = cuU(false);
  const avatarRef = React.useRef(null);

  // Profile picture: read the chosen image as a data URL and persist it via the profile API.
  const pickAvatar = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 600 * 1024) return toast("Image too large — keep it under 600KB", "info");
    const reader = new FileReader();
    reader.onload = async () => {
      setAvBusy(true);
      try { await updateProfile({ avatar: reader.result }); toast("Profile picture updated", "check"); }
      catch (err) { toast(err.message || "Couldn't save your picture", "info"); }
      finally { setAvBusy(false); }
    };
    reader.readAsDataURL(file);
  };
  const removeAvatar = async () => {
    setAvBusy(true);
    try { await updateProfile({ avatar: null }); toast("Profile picture removed", "check"); }
    catch (err) { toast(err.message || "Couldn't update your picture", "info"); }
    finally { setAvBusy(false); }
  };

  const saveProfile = async () => {
    if (!name.trim()) return toast("Please enter your name", "info");
    setBusy(true);
    try {
      const patch = { name: name.trim(), email: email.trim() };
      if (role === "reseller") patch.business = biz.trim();
      await updateProfile(patch);
      toast("Profile saved", "check");
    } catch (e) { toast(e.message, "info"); }
    finally { setBusy(false); }
  };

  // Persist notification prefs on toggle; optimistic with revert on failure.
  const toggleNotif = async (key) => {
    const prev = notif;
    const nextNotif = { ...notif, [key]: !notif[key] };
    setNotif(nextNotif);
    try { await updateProfile({ notif: nextNotif }); }
    catch (e) { setNotif(prev); toast(e.message, "info"); }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card pad-lg">
        <div className="prof-head">
          <button type="button" onClick={() => !avBusy && avatarRef.current && avatarRef.current.click()} title="Change profile picture" style={{ position: "relative", padding: 0, border: "none", background: "none", cursor: avBusy ? "default" : "pointer", borderRadius: "50%", flexShrink: 0 }}>
            <div className="av" style={user?.avatar ? { overflow: "hidden", padding: 0 } : {}}>{user?.avatar ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}</div>
            <span style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%", background: "var(--blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--surface)" }}>{avBusy ? <span className="spin" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <I.image size={13} stroke="#fff" />}</span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24 }}>{user?.name || "Kwesi Boateng"}</div>
            <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{user?.phone || "0240 021 899"} · <span style={{ textTransform: "capitalize", color: "var(--blue-700)", fontWeight: 600 }}>{role === "reseller" ? "Agent" : role}</span></div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn btn-out" style={{ padding: "7px 13px", fontSize: 13 }} onClick={() => avatarRef.current && avatarRef.current.click()} disabled={avBusy}><I.image size={15} />{user?.avatar ? "Change photo" : "Upload photo"}</button>
              {user?.avatar && <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={removeAvatar} disabled={avBusy}>Remove</button>}
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} style={{ display: "none" }} />
        </div>
        <div className="grid g-2" style={{ marginTop: 24 }}>
          <Field label="Full name" icon="user" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Field label="Phone number" icon="phone" pre="+233" value={(user?.phone || "").replace(/^0/, "")} disabled readOnly hint="Verified — contact support to change" />
          <Field label="Email (optional)" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          {role === "reseller" && <Field label="Business / store name" icon="brief" value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Your store name" />}
        </div>
        <button className="btn btn-pri" style={{ marginTop: 20, ...(busy ? { opacity: .7 } : {}) }} onClick={saveProfile} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </div>

      {role === "reseller" && store && (() => {
        const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://smartdatahubgh.com";
        const host = origin.replace(/^https?:\/\//, "");
        const url = host + "/" + store.handle;
        const fullUrl = origin + "/" + store.handle;
        return (
          <div className="card pad-lg" style={{ marginTop: 18 }}>
            <div className="card-h"><h3>Your shop link</h3></div>
            <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 14 }}>Share this link so customers can buy data &amp; airtime from your store — no app needed.</p>
            <div className="store-url"><I.signal size={16} stroke="var(--blue)" /><span className="u">{url}</span>
              <button className="cpy" onClick={() => { navigator.clipboard?.writeText(fullUrl); toast("Store link copied", "copy"); }}><I.copy size={15} />Copy</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 13.5 }} href={fullUrl} target="_blank" rel="noopener noreferrer"><I.arrow size={16} stroke="#fff" />Open store</a>
              <button className="btn" style={{ padding: "10px 16px", fontSize: 13.5, background: "#12A150", color: "#fff" }} onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(`Shop data & airtime at my store — ${store.name}: ${fullUrl}`), "_blank")}><I.whatsapp size={16} stroke="#fff" />Share</button>
              <button className="btn btn-out" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => goApp("my-store")}><I.brief size={15} />Edit store</button>
            </div>
          </div>
        );
      })()}

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Security</h3></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["lock", "Change password", "Set a new password for your account"], ["shield", "Two-factor / OTP", "Required for withdrawals & sensitive actions"], ["phone", "Verified phone", user?.phone || "0240 021 899"]].map(([ic, t, s], i) =>
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={ic} size={20} /></span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div><div className="muted" style={{ fontSize: 12.5 }}>{s}</div></div>
              {i === 0 && <button className="btn btn-out" style={{ padding: "9px 16px", fontSize: 13.5 }} onClick={() => setPwOpen(true)}>Update</button>}
              {i === 1 && <span className="pill delivered">Enabled</span>}
              {i === 2 && <span className="pill delivered">Verified</span>}
            </div>
          )}
        </div>
      </div>

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Notifications</h3></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["receipt", "Order updates", "Delivery & status alerts", "orders"],
          ["bell", "Wallet & low balance", "Warn me before I run out", "lowbal"],
          ["gift", "Promotions & tips", "Occasional offers and product news", "promos"]].map(([ic, t, s, key]) =>
          <div key={key} className="set-row" style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--line)", borderRadius: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={ic} size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div><div className="muted" style={{ fontSize: 12.5 }}>{s}</div></div>
              <label className="store-toggle" style={{ margin: 0 }}><input type="checkbox" checked={!!notif[key]} onChange={() => toggleNotif(key)} /><span className="tk"></span></label>
            </div>
          )}
        </div>
      </div>

      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Support &amp; legal</h3></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[["whatsapp", "Help & live chat", "Reach us on WhatsApp", null],
          ["info", "Help centre", "Guides & FAQs", "faq"],
          ["shield", "Terms & privacy", "How we handle your data", "terms"],
          ["star", "Rate Smart Data Hub", "Tell us how we're doing", null]].map(([ic, t, s, page], i) =>
          <div key={i} className="set-row" onClick={() => page ? (setScreen("site"), navSite(page)) : toast(t, "info")} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--line)", borderRadius: 14, cursor: "pointer" }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={ic} size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div><div className="muted" style={{ fontSize: 12.5 }}>{s}</div></div>
              <I.chev size={18} stroke="var(--faint)" />
            </div>
          )}
        </div>
        <button className="btn btn-out btn-full" style={{ marginTop: 16, color: "var(--telecel)", borderColor: "rgba(226,35,26,.3)" }} onClick={logout}><I.logout size={18} stroke="var(--telecel)" />Sign out</button>
        <div className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 14 }}>Smart Data Hub · v2.4.0</div>
      </div>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>);

}

export { CustomerDashboard, OrderRow, OrdersPage, ProfilePage, WalletPage };
