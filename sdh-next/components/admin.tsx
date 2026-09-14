"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { DataLoader, NetBadge, Pill, useDecimalInput } from "@/components/ui";
import { isInFlight } from "@/lib/orderStatus";

/* Smart Data Hub — ADMIN panel */
const { useState: adU } = React;

function AdminDashboard() {
  const { S, goApp } = useStore();
  const { rows: orders, loaded } = useAdminFeed("/api/admin/orders", "orders");
  const { agents } = useSalesReport();

  const dayStart = S.dayStart();
  const today = orders.filter(o => o.at >= dayStart);
  const revenueToday = today.filter(o => o.status === "delivered").reduce((s, o) => s + (o.amount || 0), 0);
  const settled = orders.filter(o => o.status === "delivered" || o.status === "failed" || o.status === "refunded");
  const deliveredRate = settled.length ? orders.filter(o => o.status === "delivered").length / settled.length : 0;
  const pendingPayouts = orders.filter(o => isInFlight(o.status)).length;  // waiting + processing
  const activeAgents = agents.filter(a => a.orders > 0).length;
  const viaAgents = orders.length ? Math.round(orders.filter(o => o.role === "storefront" || o.role === "reseller").length / orders.length * 100) : 0;

  const tiles = [
    ["Revenue today", S.fmt(revenueToday), "trend", "var(--ok)", "var(--ok-bg)", `${today.length} order${today.length === 1 ? "" : "s"} today`],
    ["Orders today", today.length, "receipt", "var(--blue)", "var(--blue-050)", "since midnight"],
    ["Delivered rate", settled.length ? Math.round(deliveredRate * 1000) / 10 + "%" : "—", "checkc", "var(--teal-ink)", "var(--teal-050)", settled.length ? `${settled.length} settled` : "no data yet"],
    ["In flight", pendingPayouts, "clock", "#B9791C", "#FFF4E0", "waiting or processing"],
  ];
  const failing = orders.filter(o => o.status === "failed" || o.status === "refunded");

  // Real network mix (share of orders per network).
  const nets = ["mtn", "telecel", "atigo"];
  const netCounts = nets.map(n => orders.filter(o => o.net === n).length);
  const netTotal = netCounts.reduce((s, n) => s + n, 0);

  return (
    <React.Fragment>
      <div className="grid g-4">
        {tiles.map(([l, v, ic, col, bg, d], i) => (
          <div className="stat-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div>
            <div className="v">{v}</div>
            <div className="d flat">{d}</div>
          </div>
        ))}
      </div>

      {failing.length > 0 && (
        <div className="card pad-lg" style={{ marginTop: 18, borderColor: "rgba(226,35,26,.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: "#FDE7E5", color: "var(--telecel)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.info size={22} /></span>
            <div style={{ flex: 1 }}><strong style={{ fontSize: 15.5 }}>{failing.length} order{failing.length > 1 ? "s" : ""} failed &amp; auto-refunded</strong><div className="muted" style={{ fontSize: 13.5 }}>The provider rejected these — the buyers were refunded automatically.</div></div>
            <button className="btn btn-pri" style={{ padding: "11px 20px", fontSize: 14 }} onClick={() => goApp("orders")}>Review</button>
          </div>
        </div>
      )}

      <div className="grid g-2 admin-dash-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginTop: 18, alignItems: "start" }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Live order feed</h3><span className="link" onClick={() => goApp("orders")}>Order monitor</span></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Order</th><th>User</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "right" }}>When</th></tr></thead>
              <tbody>{orders.slice(0, 7).map((o, i) => (
                <tr key={o.id + i}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><NetBadge net={o.net} size={30} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 13 }}>{o.pkg}</div><div className="mono muted" style={{ fontSize: 11.5 }}>{o.id}</div></div></div></td>
                  <td><div style={{ fontSize: 13, fontWeight: 600 }}>{o.user}</div><SourceTag role={o.role} /></td>
                  <td className="amt" style={{ textAlign: "right" }}>{S.fmt(o.amount)}</td>
                  <td style={{ textAlign: "center" }}><StatusPill status={o.status} /></td>
                  <td className="muted" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{o.at ? S.ago(o.at) : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
            {!loaded && <DataLoader label="Loading orders…" />}
            {loaded && orders.length === 0 && <div className="empty" style={{ padding: "34px 10px" }}><div className="ic"><I.list size={26} /></div><p>No orders yet.</p></div>}
          </div>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>Network mix</h3></div>
          {netTotal === 0 ? (
            <div className="empty" style={{ padding: "26px 10px" }}><div className="ic"><I.chart size={24} /></div><p style={{ fontSize: 13 }}>No orders yet — the split by network appears here once orders come in.</p></div>
          ) : nets.map((n, i) => {
            const p = Math.round(netCounts[i] / netTotal * 100);
            return (
              <div key={n} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}><div className="netcell"><NetBadge net={n} size={28} /><span style={{ fontSize: 14 }}>{S.NETWORKS[n].name}</span></div><strong>{p}%</strong></div>
                <div className="tier-track" style={{ height: 9, marginTop: 0 }}><div className="fill" style={{ width: p + "%", background: S.NETWORKS[n].color }}></div></div>
              </div>
            );
          })}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{activeAgents}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>active agents</div></div>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{netTotal ? viaAgents + "%" : "—"}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>via agents</div></div>
          </div>
        </div>
      </div>

      <AdminReferrals />
    </React.Fragment>
  );
}

/* ---------------- REFERRAL PROGRAMME (dashboard summary) ----------------
   A snapshot on the admin overview: who's pulling people in, how many of those signups have
   had a first order delivered (which is what triggers the reward), and what the programme
   has paid out. The full breakdown lives on the Referrals & Tiers page (AdminIncentives).
   Live from /api/admin/referrals. */
function AdminReferrals() {
  const { S, goApp } = useStore();
  const [data, setData] = adU({ totals: { signups: 0, qualified: 0, pending: 0, creditPaid: 0, referrers: 0 }, leaderboard: [], recent: [] });
  const [loaded, setLoaded] = adU(false);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/referrals", { credentials: "include" });
      if (r.ok) { const d = await r.json().catch(() => ({})); if (d && d.totals) setData(d); }
    } catch (e) {} finally { setLoaded(true); }
  }, []);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 15000);
    const onVis = () => load();
    window.addEventListener("focus", onVis);
    return () => { clearInterval(iv); window.removeEventListener("focus", onVis); };
  }, [load]);

  const t = data.totals;
  const conv = t.signups ? Math.round(t.qualified / t.signups * 1000) / 10 : 0;
  const tiles = [
    ["Referred signups", t.signups, "gift", "var(--teal-ink)", "var(--teal-050)", `${t.referrers} ${t.referrers === 1 ? "person is" : "people are"} referring`],
    ["Rewards paid", t.qualified, "checkc", "var(--ok)", "var(--ok-bg)", t.signups ? `${conv}% converted` : "none yet"],
    ["Awaiting first delivery", t.pending, "clock", "#B9791C", "#FFF4E0", "bonus not paid yet"],
    ["Referral credit paid", S.fmt(t.creditPaid), "coins", "var(--blue)", "var(--blue-050)", "across both sides"],
  ];

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginTop: 18 }}>
        {tiles.map(([l, v, ic, col, bg, d], i) => (
          <div className="stat-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div>
            <div className="v" style={{ color: col }}>{v}</div>
            <div className="d flat">{d}</div>
          </div>
        ))}
      </div>

      <div className="grid g-2 admin-referrals-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginTop: 18, alignItems: "start" }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Top referrers</h3><span className="link" onClick={() => goApp("users")}>All users</span></div>
          {!loaded ? <DataLoader label="Loading referrals…" /> : data.leaderboard.length === 0 ? (
            <div className="empty" style={{ padding: "34px 10px" }}><div className="ic"><I.gift size={26} /></div><p>No referrals yet — they'll appear as soon as someone signs up with an agent's code.</p></div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Referrer</th><th>Code</th><th style={{ textAlign: "center" }}>Signups</th><th style={{ textAlign: "center" }}>Funded</th><th style={{ textAlign: "right" }}>Earned</th></tr></thead>
                <tbody>{data.leaderboard.slice(0, 8).map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div><div className="muted" style={{ fontSize: 12 }}>{r.phone || (r.role === "reseller" ? "Agent" : r.role)}</div></td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{r.code}</td>
                    <td style={{ textAlign: "center" }}>{r.signups}</td>
                    <td style={{ textAlign: "center", color: r.qualified ? "var(--ok)" : "var(--muted)", fontWeight: 600 }}>{r.qualified}</td>
                    <td className="amt amt-pos" style={{ textAlign: "right" }}>{S.fmt(r.earned)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card pad-lg">
          <div className="card-h"><h3>Latest referrals</h3></div>
          {!loaded ? <DataLoader label="Loading…" /> : data.recent.length === 0 ? (
            <div className="empty" style={{ padding: "26px 10px" }}><div className="ic"><I.users size={24} /></div><p style={{ fontSize: 13 }}>Nobody has joined through a referral link yet.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {data.recent.slice(0, 6).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: r.status === "qualified" ? "var(--ok-bg)" : "var(--bg)", color: r.status === "qualified" ? "var(--ok)" : "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={r.status === "qualified" ? "checkc" : "clock"} size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>via {r.referrer} · <span className="mono">{r.code}</span></div>
                  </div>
                  <span className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{S.ago(r.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

// Fetch + live-refresh an admin feed (matches the app-wide 15s / on-focus refresh feel).
function useAdminFeed(url, key) {
  const [rows, setRows] = adU([]);
  const [loaded, setLoaded] = adU(false);
  const load = React.useCallback(async () => {
    try {
      const r = await fetch(url, { credentials: "include" });
      if (r.ok) { const d = await r.json().catch(() => ({})); setRows(Array.isArray(d[key]) ? d[key] : []); }
    } catch (e) {} finally { setLoaded(true); }
  }, [url, key]);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 15000);
    const onVis = () => load();
    window.addEventListener("focus", onVis);
    return () => { clearInterval(iv); window.removeEventListener("focus", onVis); };
  }, [load]);
  return { rows, loaded, reload: load };
}

function SourceTag({ role }) {
  if (role === "storefront") return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "var(--teal-ink)", background: "var(--teal-050)" }}>Storefront</span>;
  if (role === "reseller") return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "var(--blue-700)", background: "var(--blue-050)" }}>Agent</span>;
  return <span className="muted" style={{ fontSize: 12, textTransform: "capitalize" }}>Customer</span>;
}

function AdminOrders() {
  const { S } = useStore();
  const { rows: orders, loaded } = useAdminFeed("/api/admin/orders", "orders");
  const [filter, setFilter] = adU("all");
  const rows = filter === "all" ? orders : orders.filter(o => filter === "failed" ? (o.status === "failed" || o.status === "refunded") : o.status === filter);

  const counts = {
    all: orders.length,
    // Waiting and Processing are listed SEPARATELY here (unlike the customer's Orders page):
    // a pile-up in Waiting means the provider accepted orders and never started them, which
    // is exactly what an admin needs to spot.
    pending: orders.filter(o => o.status === "pending").length,
    waiting: orders.filter(o => o.status === "waiting").length,
    processing: orders.filter(o => o.status === "processing").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    failed: orders.filter(o => o.status === "failed" || o.status === "refunded").length,
  };

  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
        <div><h3>Order monitor</h3><div className="muted" style={{ fontSize: 13 }}>Every order on the platform — customer &amp; agent buys and storefront sales.</div></div>
        <div className="seg" style={{ margin: 0, width: "auto" }}>
          {[["all", "All"], ["pending", "Unpaid"], ["waiting", "Waiting"], ["processing", "Processing"], ["delivered", "Delivered"], ["failed", "Failed"]].map(([f, l]) => <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(f)}>{l}{counts[f] > 0 ? ` (${counts[f]})` : ""}</button>)}
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Order</th><th>User</th><th>Type</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "right" }}>When</th></tr></thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id + i}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}><NetBadge net={o.net} size={34} /><div style={{ minWidth: 0 }}><div className="mono" style={{ fontSize: 12.5 }}>{o.id}</div><div className="muted" style={{ fontSize: 12 }}>{o.pkg} · → {o.recipient}</div></div></div></td>
                <td><div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.user}</div><SourceTag role={o.role} /></td>
                <td className="muted" style={{ textTransform: "capitalize" }}>{o.type}<div className="muted" style={{ fontSize: 11.5 }}>{o.source}</div></td>
                <td className="amt" style={{ textAlign: "right", fontWeight: 600 }}>{S.fmt(o.amount)}</td>
                <td style={{ textAlign: "center" }}><StatusPill status={o.status} /></td>
                <td className="muted" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{o.at ? S.ago(o.at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loaded && <DataLoader label="Loading orders…" />}
        {loaded && rows.length === 0 && <div className="empty" style={{ padding: "40px 10px" }}><div className="ic"><I.list size={26} /></div><p>{orders.length === 0 ? "No orders yet. Every customer, agent and storefront order will appear here." : "No orders match this filter."}</p></div>}
      </div>
    </div>
  );
}

function AdminPayouts() {
  const { S, toast } = useStore();
  const { rows: wds, loaded, reload } = useAdminFeed("/api/admin/withdrawals", "withdrawals");
  const [busy, setBusy] = adU("");
  const [filter, setFilter] = adU("requested");   // requested | paid | failed | all
  const [q, setQ] = adU("");
  const [from, setFrom] = adU("");                 // YYYY-MM-DD inclusive
  const [to, setTo] = adU("");                     // YYYY-MM-DD inclusive

  const requested = wds.filter(w => w.status === "requested");
  const paid = wds.filter(w => w.status === "paid");
  const totalRequested = requested.reduce((s, w) => s + w.amount, 0);
  const totalPaid = paid.reduce((s, w) => s + w.amount, 0);

  const term = q.trim().toLowerCase();
  const fromMs = from ? new Date(from + "T00:00:00Z").getTime() : null;
  const toMs = to ? new Date(to + "T23:59:59.999Z").getTime() : null;
  const rows = wds.filter(w => {
    const st = filter === "all" ? true : filter === "failed" ? (w.status === "failed" || w.status === "rejected") : w.status === filter;
    const match = !term || (w.user || "").toLowerCase().includes(term) || String(w.number || "").includes(term) || (w.id || "").toLowerCase().includes(term);
    const inRange = (fromMs == null || (w.at || 0) >= fromMs) && (toMs == null || (w.at || 0) <= toMs);
    return st && match && inRange;
  });
  const filters = [["requested", "Pending"], ["paid", "Paid"], ["failed", "Failed"], ["all", "All"]];

  // The pending payouts within the current date range — what "Pay all in view" / export target.
  const rowsRequested = rows.filter(w => w.status === "requested");
  const rangeActive = !!(from || to);

  // Export the current view — a payout run sheet (reference, agent, MoMo, amount, status).
  const exportCsv = () => {
    const head = ["Reference", "Agent", "Network", "MoMo number", "Amount (GHS)", "Status", "Requested"];
    const esc = (c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;
    const body = rows.map(w => [w.id, w.user, (w.network || "").toUpperCase(), w.number, (w.amount || 0).toFixed(2), w.status, S.csvStamp(w.at), w.updatedAt ? S.csvStamp(w.updatedAt) : ""]);
    const csv = [head, ...body].map(r => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payouts-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Exported ${rows.length} payout${rows.length === 1 ? "" : "s"}`, "download");
  };

  const act = async (reference, action, label) => {
    if (busy) return;
    setBusy(reference + action);
    try {
      const r = await fetch("/api/admin/withdrawals", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not update the payout.", "info");
      else { toast(label, "check"); await reload(); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(""); }
  };

  // Pay every pending request, or — when a date range / search is narrowing the view — only
  // the pending ones currently in view (so you can run "everything requested before Friday").
  const scoped = rangeActive || !!term;
  const payAll = async () => {
    const targets = scoped ? rowsRequested : requested;
    if (busy || targets.length === 0) return;
    setBusy("payAll");
    try {
      const body = scoped ? { action: "payAll", references: targets.map(w => w.id) } : { action: "payAll" };
      const r = await fetch("/api/admin/withdrawals", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not process payouts.", "info");
      else { toast(`${d.paid || 0} payout${d.paid === 1 ? "" : "s"} sent${d.failed ? `, ${d.failed} failed` : ""}`, "coins"); await reload(); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(""); }
  };

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <StatPill label="Pending requests" value={S.fmt(totalRequested)} ic="clock" col="#B9791C" bg="#FFF4E0" />
        <StatPill label="Paid out" value={S.fmt(totalPaid)} ic="coins" col="var(--ok)" bg="var(--ok-bg)" />
        <StatPill label="Payouts" value={wds.length} ic="download" col="var(--blue-700)" bg="var(--blue-050)" />
        <StatPill label="Failed / rejected" value={wds.filter(w => w.status === "failed" || w.status === "rejected").length} ic="refresh" col="var(--telecel)" bg="rgba(226,35,26,.09)" />
      </div>
      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <div><h3>Payout requests</h3><div className="muted" style={{ fontSize: 13 }}>Agents request payouts; the amount is held from their wallet. Send them manually and mark paid, or pay via Paystack (single or all at once).</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pill requested">{requested.length} pending</span>
            {(scoped ? rowsRequested.length : requested.length) > 0 && <button className="btn btn-pri" style={{ padding: "9px 16px", fontSize: 13.5 }} disabled={busy === "payAll"} onClick={payAll}><I.coins size={15} stroke="#fff" />{busy === "payAll" ? "Sending…" : scoped ? `Pay ${rowsRequested.length} in view` : "Pay all pending"}</button>}
          </div>
        </div>
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10, borderTop: "none", paddingTop: 0 }}>
          <div className="seg" style={{ margin: 0, width: "auto" }}>
            {filters.map(([k, l]) => <button key={k} className={filter === k ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(k)}>{l}{k === "requested" && requested.length ? ` (${requested.length})` : ""}</button>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" style={{ height: 40, padding: "0 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--surface)", color: "var(--ink)", font: "inherit", fontSize: 13 }} />
              <span className="muted" style={{ fontSize: 13 }}>–</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" style={{ height: 40, padding: "0 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--surface)", color: "var(--ink)", font: "inherit", fontSize: 13 }} />
              {rangeActive && <button className="btn btn-ghost" style={{ padding: "8px 10px", fontSize: 12.5 }} onClick={() => { setFrom(""); setTo(""); }}><I.x size={14} />Clear</button>}
            </div>
            <div className="field" style={{ margin: 0 }}><div className="control" style={{ height: 40 }}><I.search size={17} /><input placeholder="Search agent, number or ref" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 13.5 }} /></div></div>
            <button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} disabled={rows.length === 0} onClick={exportCsv}><I.download size={16} />Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Reference</th><th>Agent</th><th style={{ textAlign: "right" }}>Amount</th><th>Payout to</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "right" }}>When</th><th></th></tr></thead>
            <tbody>
              {rows.map(w => {
                const b = busy.startsWith(w.id);
                return (
                  <tr key={w.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{w.id}</td>
                    <td style={{ fontWeight: 600 }}>{w.user}</td>
                    <td className="amt" style={{ textAlign: "right" }}>{S.fmt(w.amount)}</td>
                    <td className="muted">{w.network ? w.network.toUpperCase() + " · " : ""}{w.number}</td>
                    <td style={{ textAlign: "center" }}><StatusPill status={w.status} />{w.reason && <div className="muted" style={{ fontSize: 11 }}>{w.reason}</div>}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{w.at ? S.ago(w.at) : "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      {w.status === "requested" ? (
                        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button className="btn btn-out" style={{ padding: "7px 11px", fontSize: 12.5 }} disabled={b} onClick={() => act(w.id, "reject", "Payout rejected — agent refunded")}>Reject</button>
                          <button className="btn btn-out" style={{ padding: "7px 11px", fontSize: 12.5 }} disabled={b} onClick={() => act(w.id, "markPaid", "Marked as paid")}>Mark paid</button>
                          <button className="btn btn-pri" style={{ padding: "7px 12px", fontSize: 12.5 }} disabled={b} onClick={() => act(w.id, "pay", "Payout sent to mobile money")}><I.coins size={14} stroke="#fff" />Pay</button>
                        </div>
                      ) : <span className="muted" style={{ fontSize: 12.5 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loaded && <DataLoader label="Loading payouts…" />}
          {loaded && wds.length === 0 && <div className="empty" style={{ padding: "40px 10px" }}><div className="ic"><I.download size={26} /></div><p>No payout requests yet. Agent withdrawal requests appear here for you to process.</p></div>}
          {loaded && wds.length > 0 && rows.length === 0 && <div className="empty" style={{ padding: "34px 10px" }}><div className="ic"><I.search size={24} /></div><p>No payouts match this view.</p></div>}
        </div>
      </div>
    </React.Fragment>
  );
}

function AdminUsers() {
  const { S, user, toast } = useStore();
  const [q, setQ] = adU("");
  const [users, setUsers] = adU([]);
  const [busy, setBusy] = adU("");
  const [loaded, setLoaded] = adU(false);

  const load = React.useCallback(async (query) => {
    try {
      const r = await fetch("/api/admin/users" + (query ? "?q=" + encodeURIComponent(query) : ""), { credentials: "include" });
      if (r.ok) { const d = await r.json().catch(() => ({})); setUsers(d.users || []); }
    } catch (e) {}
    finally { setLoaded(true); }
  }, []);
  React.useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t); }, [q, load]);

  const changeRole = async (u, role) => {
    setBusy(u.id);
    try {
      const r = await fetch("/api/admin/users", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, role }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not update role.", "info");
      else { toast(role === "admin" ? "Admin access granted" : "Role updated", "check"); load(q); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(""); }
  };

  const agentAction = async (u, action) => {
    setBusy(u.id);
    try {
      const r = await fetch("/api/admin/users", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not update.", "info");
      else { toast(action === "approveAgent" ? "Agent approved — they've been notified" : "Agent application declined", "check"); load(q); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(""); }
  };

  const roleColor = (r) => r === "admin" ? "var(--telecel)" : r === "reseller" ? "var(--blue-700)" : "var(--muted)";
  const pendingAgents = users.filter(u => u.agentStatus === "pending").length;
  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div><h3>Users</h3><div className="muted" style={{ fontSize: 13 }}>Approve agent applications, promote customers to agents, and manage admin access.</div></div>{pendingAgents > 0 && <span className="pill requested">{pendingAgents} agent{pendingAgents === 1 ? "" : "s"} pending</span>}</div>
        <div className="field" style={{ margin: 0 }}><div className="control" style={{ height: 42 }}><I.search size={18} /><input placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} /></div></div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>User</th><th>Contact</th><th>Role</th><th>Joined</th><th style={{ textAlign: "center" }}>Agent</th><th style={{ textAlign: "right" }}>Admin access</th></tr></thead>
          <tbody>
            {users.map(u => {
              const isSelf = user && u.id === user.id;
              const isAdmin = u.role === "admin";
              const st = u.agentStatus || "none";
              return (
                <tr key={u.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--blue-050)", color: "var(--blue-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14 }}>{(u.name || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}</span><div><div style={{ fontWeight: 600 }}>{u.name || "—"}{isSelf && <span className="muted" style={{ fontWeight: 600, fontSize: 12 }}> · you</span>}</div><div className="muted" style={{ fontSize: 12.5 }}>{u.business || (u.role === "reseller" ? "Agent" : u.role === "admin" ? "Administrator" : "Customer")}</div></div></div></td>
                  <td className="muted" style={{ fontSize: 13 }}>{u.email || "—"}<div className="mono" style={{ fontSize: 12 }}>{u.phone || ""}</div></td>
                  <td style={{ textTransform: "capitalize", fontWeight: 600, color: roleColor(u.role) }}>{u.role}</td>
                  <td className="muted">{u.createdAt ? S.ago(u.createdAt) : "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    {isAdmin ? (
                      <span className="muted" style={{ fontSize: 12.5 }}>—</span>
                    ) : u.role === "reseller" ? (
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, color: "var(--ok)", background: "var(--ok-bg)" }}>Agent</span>
                    ) : st === "pending" ? (
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "center" }}>
                        <button className="btn btn-out" style={{ padding: "6px 10px", fontSize: 12.5 }} disabled={busy === u.id} onClick={() => agentAction(u, "rejectAgent")}>Decline</button>
                        <button className="btn btn-pri" style={{ padding: "6px 11px", fontSize: 12.5 }} disabled={busy === u.id} onClick={() => agentAction(u, "approveAgent")}><I.check size={13} stroke="#fff" />Approve</button>
                      </div>
                    ) : (
                      <button className="btn btn-out" style={{ padding: "6px 11px", fontSize: 12.5 }} disabled={busy === u.id} onClick={() => agentAction(u, "approveAgent")}>{st === "rejected" ? "Make agent" : "Make agent"}</button>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {isSelf ? (
                      <span className="muted" style={{ fontSize: 12.5 }}>—</span>
                    ) : isAdmin ? (
                      <button className="btn btn-out" style={{ padding: "8px 12px", fontSize: 13, color: "var(--telecel)", borderColor: "rgba(226,35,26,.3)" }} disabled={busy === u.id} onClick={() => changeRole(u, u.business ? "reseller" : "customer")}>Remove admin</button>
                    ) : (
                      <button className="btn btn-pri" style={{ padding: "8px 14px", fontSize: 13 }} disabled={busy === u.id} onClick={() => changeRole(u, "admin")}><I.shield size={15} stroke="#fff" />Make admin</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loaded && <DataLoader label="Loading users…" />}
        {loaded && users.length === 0 && <div className="empty" style={{ padding: "36px 10px" }}><div className="ic"><I.users size={26} /></div><p>{q ? "No users match your search." : "No users yet."}</p></div>}
      </div>
    </div>
  );
}

// Backend-persisted data pricing editor. Per network, with the networks that sell more than
// one LINE split out (MTN Standard/Xpress, AT iShare/BigTime), per-bundle validity (or
// "No expiry"), editable retail/wholesale/commission, and Publish → saves to
// /api/admin/pricing (the source of truth for every real charge).
function DataPricingEditor() {
  const { S, toast } = useStore();
  const [pricing, setPricing] = adU(null);
  const [net, setNet] = adU("mtn");
  // The selected line, remembered per network so switching MTN → AT → MTN keeps your place.
  const [lines, setLines] = adU({ mtn: "standard", atigo: "ishare" });
  const lineSet = S.PRODUCTS_BY_NET[net] || null;   // null for single-line networks (Telecel)
  const line = lineSet ? lines[net] : null;
  const setLine = (v) => setLines(l => ({ ...l, [net]: v }));
  const [busy, setBusy] = adU(false);
  const [dirty, setDirty] = adU(false);
  const [loaded, setLoaded] = adU(false);
  const round2 = (n) => Math.round(n * 100) / 100;

  React.useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/admin/pricing", { credentials: "include" }); if (r.ok) { const d = await r.json().catch(() => ({})); if (d.pricing) setPricing(d.pricing); } }
      catch (e) {} finally { setLoaded(true); }
    })();
  }, []);

  const key = S.pricingKeyOf(net, line);
  const rows = (pricing && pricing[key]) || [];

  const patchRow = (id, updater) => { setPricing(p => ({ ...p, [key]: p[key].map(b => b.id === id ? updater(b) : b) })); setDirty(true); };
  const setField = (id, field, v) => patchRow(id, b => {
    if (field === "days") return { ...b, days: v, noExpiry: false };
    if (field === "commission") return { ...b, retail: round2((b.wholesale || 0) + v) };   // commission drives retail
    return { ...b, [field]: v };
  });
  // Every bundle has a validity: a day count, or never-expires. There is no third "no validity" mode.
  const validityMode = (b) => b.noExpiry ? "noexpiry" : "days";
  const setValidityMode = (id, mode) => patchRow(id, b =>
    mode === "noexpiry" ? { ...b, noExpiry: true, days: 0 } : { ...b, noExpiry: false, days: b.days || 30 });
  const addRow = () => { setPricing(p => ({ ...p, [key]: [...(p[key] || []), { id: "b" + Date.now(), gb: 0, days: key === "atigo_bigtime" ? 0 : 30, noExpiry: key === "atigo_bigtime", retail: 0, wholesale: 0 }] })); setDirty(true); };
  const removeRow = (id) => { setPricing(p => ({ ...p, [key]: p[key].filter(b => b.id !== id) })); setDirty(true); };

  // ---- Upstream vendor reference (editable; keeps our wholesale in sync) ----
  // Every data line is fulfilled by DataHub Ghana — see lib/server/providers/data.ts.
  const vendorName = "DataHub";
  const vendorRows = (pricing && pricing.vendor && pricing.vendor[key]) || [];
  const setVendor = (updater) => { setPricing(p => ({ ...p, vendor: { ...(p.vendor || {}), [key]: updater((p.vendor && p.vendor[key]) || []) } })); setDirty(true); };
  const setVField = (id, field, val) => setVendor(arr => arr.map(v => v.id !== id ? v : (field === "noExpiry" ? { ...v, noExpiry: !v.noExpiry, days: !v.noExpiry ? 0 : (v.days || 90) } : { ...v, [field]: val })));
  const addVendor = () => setVendor(arr => [...arr, { id: "v" + Date.now(), gb: 0, days: 90, noExpiry: false, price: 0 }]);
  const removeVendor = (id) => setVendor(arr => arr.filter(v => v.id !== id));
  const applyVendor = (v) => {
    setPricing(p => {
      const arr = [...(p[key] || [])];
      const idx = arr.findIndex(b => b.gb === v.gb);
      if (idx >= 0) arr[idx] = { ...arr[idx], wholesale: v.price, days: v.noExpiry ? 0 : v.days, noExpiry: v.noExpiry };
      else arr.push({ id: "d" + v.gb + "-" + Date.now(), gb: v.gb, days: v.noExpiry ? 0 : v.days, noExpiry: v.noExpiry, retail: round2(v.price * 1.1), wholesale: v.price });
      return { ...p, [key]: arr };
    });
    setDirty(true);
    toast(`${v.gb}GB · ${S.fmt(v.price)} applied to wholesale`, "check");
  };

  const publish = async () => {
    // A bundle on "Days" must carry a real day count — 0 days would be saved as never-expires.
    const bad = ["mtn", "mtn_xpress", "telecel", "atigo_ishare", "atigo_bigtime"]
      .flatMap(k => (pricing[k] || []).map(b => ({ k, b })))
      .find(({ b }) => !b.noExpiry && !(b.days > 0));
    if (bad) {
      const LINE = { mtn: "MTN", mtn_xpress: "MTN Xpress", telecel: "Telecel", atigo_ishare: "AT iShare", atigo_bigtime: "AT BigTime" };
      toast(`Set a validity for the ${LINE[bad.k]} ${bad.b.gb}GB bundle — days, or ∞ for no expiry.`, "info");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/pricing", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pricing }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not publish.", "info");
      else { setPricing(d.pricing); setDirty(false); toast("Prices published — live everywhere", "check"); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(false); }
  };

  if (!loaded || !pricing) return <div className="card pad-lg"><DataLoader label="Loading prices…" /></div>;

  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 12 }}>
        <div><h3>Data bundle pricing</h3><div className="muted" style={{ fontSize: 13 }}>Wholesale is your {vendorName} cost — DataHub has no price API, so you manage it here. Edit retail, wholesale or commission — they stay consistent.</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && <span className="pill requested" style={{ fontSize: 11 }}>Unpublished</span>}
          <button className="btn btn-pri" style={{ padding: "9px 16px", fontSize: 13.5 }} disabled={busy || !dirty} onClick={publish}>{busy ? "Publishing…" : "Publish changes"}</button>
        </div>
      </div>

      <div className="price-net-row" style={{ margin: "0 0 10px" }}>
        {["mtn", "telecel", "atigo"].map(n => <button key={n} className={"pn" + (net === n ? " on" : "")} onClick={() => setNet(n)}><NetBadge net={n} size={20} />{S.NETWORKS[n].name}</button>)}
      </div>
      {lineSet && (
        <div className="seg" style={{ margin: "0 0 10px", width: "auto", display: "inline-flex" }}>
          {(Object.values(lineSet) as any[]).map(p => <button key={p.id} className={line === p.id ? "on" : ""} style={{ padding: "7px 14px" }} onClick={() => setLine(p.id)}>{p.name}</button>)}
        </div>
      )}

      <div className="grid g-2 price-grid">
        {/* our editable pricing */}
        <div style={{ order: 2 }}>
          <div className="tbl-wrap">
            <table className="tbl pricing-tbl">
              <thead><tr><th>Bundle</th><th>Validity</th><th>Retail</th><th>Wholesale</th><th>Commission</th><th></th></tr></thead>
              <tbody>
                {rows.map(b => {
                  const comm = round2((b.retail || 0) - (b.wholesale || 0));
                  const vm = validityMode(b);
                  return (
                    <tr key={b.id}>
                      <td><PriceEdit value={b.gb} pre={null} suf="GB" width={44} decimals={0} onChange={(v) => setField(b.id, "gb", v)} /></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                          <div className="seg vm-seg" style={{ margin: 0, display: "inline-flex", padding: 2, flexShrink: 0 }}>
                            {[["days", "Days"], ["noexpiry", "∞"]].map(([m, l]) => <button key={m} className={vm === m ? "on" : ""} style={{ padding: "4px 9px", fontSize: 12, flex: "0 0 auto" }} onClick={() => setValidityMode(b.id, m)} title={m === "noexpiry" ? "Never expires" : "Days"}>{l}</button>)}
                          </div>
                          {vm === "days" && <PriceEdit value={b.days} pre={null} suf="d" width={30} decimals={0} onChange={(v) => setField(b.id, "days", v)} />}
                        </div>
                      </td>
                      <td><PriceEdit value={b.retail} onChange={(v) => setField(b.id, "retail", v)} /></td>
                      <td><PriceEdit value={b.wholesale} onChange={(v) => setField(b.id, "wholesale", v)} /></td>
                      <td><div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}><PriceEdit value={comm} onChange={(v) => setField(b.id, "commission", v)} />{comm < 0 && <span className="amt amt-neg" style={{ fontSize: 11 }}>below wholesale</span>}</div></td>
                      <td style={{ textAlign: "right" }}><button className="iconbtn" title="Remove bundle" style={{ color: "var(--telecel)" }} onClick={() => removeRow(b.id)}><I.x size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="empty" style={{ padding: "24px 10px" }}><p>No bundles for this line yet — add one below.</p></div>}
          </div>
          <button className="btn btn-out" style={{ marginTop: 12, padding: "9px 15px", fontSize: 13.5 }} onClick={addRow}><I.plus size={15} />Add bundle</button>
        </div>

        {/* Upstream vendor reference — editable */}
        <div className="hn-panel" style={{ order: 1 }}>
          <div className="hn-head">
            <div style={{ minWidth: 0 }}><strong style={{ fontSize: 14 }}>{vendorName} options</strong><div className="muted">Vendor reference for {lineSet ? `${S.NETWORKS[net].name} ${lineSet[line].name}` : S.NETWORKS[net].name}. Tap → to set wholesale.</div></div>
            <button className="iconbtn" title="Add reference" onClick={addVendor}><I.plus size={15} /></button>
          </div>
          <div className="hn-list">
            {vendorRows.map(v => (
              <div className="hn-row" key={v.id}>
                <PriceEdit cls="pe-sm" value={v.gb} pre={null} suf="GB" width={26} decimals={0} onChange={(val) => setVField(v.id, "gb", val)} />
                {v.noExpiry
                  ? <button className="hn-inf" title="Never expires — tap for a day count" onClick={() => setVField(v.id, "noExpiry")}>∞</button>
                  : <div className="hn-val"><PriceEdit cls="pe-sm" value={v.days} pre={null} suf="d" width={22} decimals={0} onChange={(val) => setVField(v.id, "days", val)} /><button className="hn-inf" title="Never expires" onClick={() => setVField(v.id, "noExpiry")}>∞</button></div>}
                <PriceEdit cls="pe-sm" value={v.price} width={34} onChange={(val) => setVField(v.id, "price", val)} />
                <div className="hn-acts">
                  <button className="iconbtn hn-apply" title="Use this price as wholesale" onClick={() => applyVendor(v)}><I.arrow size={14} stroke="currentColor" /></button>
                  <button className="iconbtn hn-del" title="Remove" onClick={() => removeVendor(v.id)}><I.x size={13} /></button>
                </div>
              </div>
            ))}
            {vendorRows.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No vendor bundles — add from {vendorName}.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Backend-persisted result-checker pricing. Publishing here changes what is really charged
// (lib/server/checkerPricing.ts prices every purchase from the same store). `supplier` is
// what Muviin charges us, shown read-only so the true platform margin is visible.
function CheckerPricingEditor() {
  const { S, toast } = useStore();
  const [rows, setRows] = adU(null);
  const [busy, setBusy] = adU(false);
  const [dirty, setDirty] = adU(false);
  const [loaded, setLoaded] = adU(false);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/pricing", { credentials: "include" });
        if (r.ok) { const d = await r.json().catch(() => ({})); if (Array.isArray(d.checkers)) setRows(d.checkers); }
      } catch (e) {} finally { setLoaded(true); }
    })();
  }, []);

  const setField = (id, field, v) => { setRows(rs => rs.map(p => p.id === id ? { ...p, [field]: v } : p)); setDirty(true); };

  const publish = async () => {
    const bad = rows.find(p => p.cost < p.supplier);
    if (bad) { toast(`${bad.name} sells to agents below the ${S.fmt(bad.supplier)} it costs us.`, "info"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/pricing", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkers: rows }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not publish.", "info");
      else { if (Array.isArray(d.checkers)) setRows(d.checkers); setDirty(false); toast("Checker prices published — live everywhere", "check"); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(false); }
  };

  if (!loaded || !rows) return <div className="card pad-lg"><DataLoader label="Loading checker prices…" /></div>;

  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 12 }}>
        <div><h3>Results checker pricing</h3><div className="muted" style={{ fontSize: 13 }}>Supplier is what Muviin charges us per voucher. Your margin is what an agent pays minus that; the agent earns retail minus their price. Only WASSCE and BECE can be supplied.</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && <span className="pill requested" style={{ fontSize: 11 }}>Unpublished</span>}
          <button className="btn btn-pri" style={{ padding: "9px 16px", fontSize: 13.5 }} disabled={busy || !dirty} onClick={publish}>{busy ? "Publishing…" : "Publish changes"}</button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Product</th><th>Exam body</th><th>Supplier cost</th><th>Agent pays</th><th>Retail price</th><th>Platform margin</th><th>Agent commission</th></tr></thead>
          <tbody>
            {rows.map(p => {
              const plat = Math.round((p.cost - p.supplier) * 100) / 100;
              const agent = Math.round(Math.max(0, p.retail - p.cost) * 100) / 100;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><span className="pill approved" style={{ fontSize: 10.5 }}>{p.body}</span></td>
                  <td><PriceEdit value={p.supplier} onChange={(v) => setField(p.id, "supplier", v)} /></td>
                  <td><PriceEdit value={p.cost} onChange={(v) => setField(p.id, "cost", v)} /></td>
                  <td><PriceEdit value={p.retail} onChange={(v) => setField(p.id, "retail", v)} /></td>
                  <td className={"amt " + (plat > 0 ? "amt-pos" : "")} style={plat <= 0 ? { color: "var(--telecel)" } : {}}>{plat > 0 ? "+" : ""}{S.fmt(plat)}</td>
                  <td className="amt amt-pos">+{S.fmt(agent)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 12, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />Update the supplier figure whenever Muviin changes theirs, so the margin shown here stays true.</p>
    </div>
  );
}

// A labelled money field. The hook lives in HERE, not inlined into a parent's JSX: every
// editor on this page returns a loader before its data arrives, and a hook called after
// that early return runs on some renders and not others — which is exactly the
// "rendered more hooks than during the previous render" crash. Same reason PriceEdit and
// StorePrice exist.
function RateField({ label, hint, value, onChange, pre = "GH₵", decimals = 4 }) {
  const input = useDecimalInput(value, onChange, { decimals });
  return (
    <div className="field">
      <label>{label}</label>
      <div className="control"><span className="pre">{pre}</span><input {...input} /></div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

// Bulk SMS is priced per PAGE per RECIPIENT — the same way Arkesel bills us — so the money
// that matters is the rate, and the row of worked examples underneath is what makes it
// legible (nobody can read a margin off GH₵0.055 at a glance).
function SmsPricingEditor() {
  const { S, toast } = useStore();
  const [sms, setSms] = adU(null);
  const [busy, setBusy] = adU(false);
  const [dirty, setDirty] = adU(false);
  const [loaded, setLoaded] = adU(false);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/pricing", { credentials: "include" });
        if (r.ok) { const d = await r.json().catch(() => ({})); if (d.sms) setSms(d.sms); }
      } catch (e) {} finally { setLoaded(true); }
    })();
  }, []);

  const setField = (field, v) => { setSms(s => ({ ...s, [field]: v })); setDirty(true); };

  const publish = async () => {
    // A zero markup isn't invalid — it's selling at cost — but it's almost always a slip,
    // so it's worth one confirmation rather than a silent publish.
    if (!(sms.markup > 0) && !confirm("A markup of GH₵0 means SMS sells at cost and earns no profit. Publish anyway?")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/pricing", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sms }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) toast(d.error || "Could not publish.", "info");
      else { if (d.sms) setSms(d.sms); setDirty(false); toast("SMS rates published — live everywhere", "check"); }
    } catch (e) { toast("Something went wrong.", "info"); }
    finally { setBusy(false); }
  };

  if (!loaded || !sms) return <div className="card pad-lg"><DataLoader label="Loading SMS rates…" /></div>;

  // The sell rate is DERIVED — supplier + markup — so it can't drift out of step with the
  // profit the markup promises. Rounded to 4dp exactly as the server does.
  const round4 = (n) => Math.round(n * 10000) / 10000;
  const sellRate = round4((sms.supplier || 0) + (sms.markup || 0));
  const per1000 = (rate) => S.fmt(rate * 1000);

  return (
    <div className="card pad-lg">
      <div className="card-h" style={{ flexWrap: "wrap", gap: 12 }}>
        <div><h3>Bulk SMS pricing</h3><div className="muted" style={{ fontSize: 13 }}>Charged per page (160 characters) per recipient — the same way Arkesel bills us. You set what Arkesel costs us and how much to add on top; the price senders pay follows from the two.</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && <span className="pill requested" style={{ fontSize: 11 }}>Unpublished</span>}
          <button className="btn btn-pri" style={{ padding: "9px 16px", fontSize: 13.5 }} disabled={busy || !dirty} onClick={publish}>{busy ? "Publishing…" : "Publish changes"}</button>
        </div>
      </div>

      {/* Four decimals, not two: SMS rates live in fractions of a pesewa, and rounding a
          GH₵0.03 markup to the nearest cent would change it by a third. */}
      <div className="grid g-3" style={{ maxWidth: 720, marginBottom: 18 }}>
        <RateField label="Supplier cost (Arkesel)" hint="Per page, from your Arkesel invoice" value={sms.supplier} onChange={(v) => setField("supplier", v)} />
        <RateField label="Our markup" hint="Added on top — this is the profit" value={sms.markup} onChange={(v) => setField("markup", v)} />
        <div className="stat-tile"><div className="lbl">Sender pays / page</div><div className="v">{S.fmt(sellRate)}</div></div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Campaign size</th><th>Costs us</th><th>Sender pays</th><th>Our profit</th></tr></thead>
          <tbody>
            {[["1 page × 1 recipient", 1], ["1 page × 1,000 recipients", 1000], ["2 pages × 1,000 recipients", 2000]].map(([label, units]) => (
              <tr key={label}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td className="amt">{S.fmt(sms.supplier * units)}</td>
                <td className="amt">{S.fmt(sellRate * units)}</td>
                <td className={"amt " + (sms.markup > 0 ? "amt-pos" : "")} style={sms.markup <= 0 ? { color: "var(--telecel)" } : {}}>{sms.markup > 0 ? "+" : ""}{S.fmt(sms.markup * units)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 12, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />A message over 160 characters bills as two pages, and one containing an emoji or a curly quote drops to 70 characters a page. Recipients the network refuses are refunded automatically. Update the supplier cost whenever Arkesel changes theirs — the markup then keeps earning exactly what it says.</p>
    </div>
  );
}

function AdminPricing() {
  const { S, adminPrices, setAdminPrice, checkers, updateChecker, toast, afaPrice, refreshAfa } = useStore();
  const [tab, setTab] = React.useState("data");
  const [net, setNet] = React.useState("mtn");
  const tabs = [["data", "Data", "signal"], ["afa", "AFA", "idcard"], ["checker", "Results Checker", "ticket"], ["utilities", "Utilities", "plug"], ["sms", "SMS", "mail"]];

  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.sliders size={22} /></span>
        <div style={{ flex: 1 }}><strong style={{ fontSize: 15.5 }}>Platform price management</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Set wholesale &amp; retail per product and network. Agent commission = retail − wholesale. Data prices are live — Publish applies them everywhere (customer buy &amp; agent stores).</div></div>
      </div>

      <div className="ptabs">
        {tabs.map(([k, l, ic]) => <button key={k} className={"ptab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}><Ic name={ic} size={17} />{l}</button>)}
      </div>

      {tab === "data" && <DataPricingEditor />}

      {tab === "afa" && (
        <div className="card pad-lg">
          <div className="card-h"><h3>AFA registration pricing</h3><NetBadge net="mtn" size={30} /></div>
          {/* The fee is set on Manage → AFA, next to the applications it applies to, so there
              is exactly ONE place it can be changed. No agent rate: AFA earns no commission. */}
          <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 16 }}>AFA has a single price that everyone pays — agents can't mark it up and earn no commission on it. Set it on <strong style={{ color: "var(--ink)" }}>Manage → AFA</strong>, where you also review and approve registrations.</p>
          <div className="stat-tile" style={{ maxWidth: 260 }}><div className="lbl">Current registration fee</div><div className="v">{S.fmt(afaPrice)}</div></div>
        </div>
      )}

      {tab === "checker" && <CheckerPricingEditor />}

      {tab === "utilities" && (
        <div className="card pad-lg">
          <div className="card-h"><h3>Utilities &amp; bills</h3></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 14 }}>Electricity, water &amp; DStv sell at provider-set face values — the platform controls the agent commission rate. Streaming accounts carry a fixed wholesale cost.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Service</th><th>Type</th><th>Customer price</th><th>Agent commission</th></tr></thead>
              <tbody>
                {S.UTILITY_ORDER.map(id => {
                  const u = S.UTILITIES[id];
                  let priceLabel, commLabel;
                  if (u.kind === "meter") { priceLabel = "from " + S.fmt(u.amounts[0]); commLabel = Math.round(u.rate * 1000) / 10 + "% per top-up"; }
                  else if (u.kind === "package") { priceLabel = "from " + S.fmt(Math.min(...u.packages.map(p => p.price))); commLabel = Math.round(u.rate * 1000) / 10 + "% per renewal"; }
                  else { priceLabel = "from " + S.fmt(Math.min(...u.plans.map(p => p.price))); commLabel = "from +" + S.fmt(u.plans[0].price - u.plans[0].cost) + " / plan"; }
                  return (
                    <tr key={id}>
                      <td><div className="netcell"><NetBadge net={id} size={30} /><span style={{ fontWeight: 600 }}>{u.short}</span></div></td>
                      <td className="muted" style={{ textTransform: "capitalize" }}>{u.type}</td>
                      <td className="amt">{priceLabel}</td>
                      <td className="amt amt-pos">{commLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "sms" && <SmsPricingEditor />}
    </React.Fragment>
  );
}

// `decimals` is 2 for money; pass 0 for whole-number fields like GB or a day count.
function PriceEdit({ value, onChange, pre = "GH₵", suf = null, width = 56, cls = "", decimals = 2 }) {
  const input = useDecimalInput(value, onChange, { decimals });
  return (
    <div className={cls} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid var(--line-2)", borderRadius: 11, padding: "6px 10px", background: "var(--surface)", minWidth: 0 }}>
      {pre && <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 13 }}>{pre}</span>}
      <input {...input} style={{ border: "none", outline: "none", width, fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14.5, color: "var(--ink)", background: "none" }} />
      {suf && <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 13 }}>{suf}</span>}
    </div>
  );
}

// Shared: pull the cross-agent sales report once, keep it fresh (matches the app-wide 15s
// live-refresh feel), and expose loading state.
function useSalesReport() {
  const [data, setData] = adU({ agents: [], orders: [] });
  const [loaded, setLoaded] = adU(false);
  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/sales", { credentials: "include" });
      if (r.ok) { const d = await r.json().catch(() => ({})); setData({ agents: d.agents || [], orders: d.orders || [] }); }
    } catch (e) {} finally { setLoaded(true); }
  }, []);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 15000);
    const onVis = () => load();
    window.addEventListener("focus", onVis);
    return () => { clearInterval(iv); window.removeEventListener("focus", onVis); };
  }, [load]);
  return { ...data, loaded, reload: load };
}

function StatPill({ label, value, ic, col, bg }) {
  return (
    <div className="stat-tile">
      <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

const AGENT_INITIALS = (n) => (n || "?").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
function StatusPill({ status }) {
  const map = {
    delivered: ["Delivered", "var(--ok)", "var(--ok-bg)"],
    paid: ["Paid", "var(--ok)", "var(--ok-bg)"],
    requested: ["Pending", "#B9791C", "#FFF4E0"],
    // pending = captured, payment not confirmed yet (nothing sent to any provider);
    // waiting = provider accepted it but hasn't started; processing = actively sending.
    pending: ["Pending payment", "var(--muted)", "var(--bg)"],
    waiting: ["Waiting", "var(--blue-700)", "var(--blue-050)"],
    processing: ["Processing", "#B9791C", "#FFF4E0"],
    failed: ["Failed", "var(--telecel)", "rgba(226,35,26,.09)"],
    rejected: ["Rejected", "var(--telecel)", "rgba(226,35,26,.09)"],
    refunded: ["Refunded", "var(--muted)", "var(--bg)"],
  };
  const [txt, col, bg] = map[status] || [status, "var(--muted)", "var(--bg)"];
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, color: col, background: bg }}>{txt}</span>;
}

// ---- All Agents — every agent's storefront sales & performance ----
function AdminAgents() {
  const { S } = useStore();
  const { agents, loaded } = useSalesReport();
  const [q, setQ] = adU("");

  const term = q.trim().toLowerCase();
  const rows = term
    ? agents.filter(a => (a.name || "").toLowerCase().includes(term) || (a.business || "").toLowerCase().includes(term) || (a.handle || "").toLowerCase().includes(term))
    : agents;

  const withSales = agents.filter(a => a.orders > 0).length;
  const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0);
  const totalCommission = agents.reduce((s, a) => s + a.commission, 0);

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <StatPill label="Total agents" value={agents.length} ic="users" col="var(--blue-700)" bg="var(--blue-050)" />
        <StatPill label="Selling agents" value={withSales} ic="chart" col="var(--teal-ink)" bg="var(--teal-050)" />
        <StatPill label="Store revenue" value={S.fmt(totalRevenue)} ic="coins" col="var(--ink)" bg="var(--bg)" />
        <StatPill label="Commission paid" value={S.fmt(totalCommission)} ic="trend" col="var(--ok)" bg="var(--ok-bg)" />
      </div>

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <div><h3>All agents</h3><div className="muted" style={{ fontSize: 13 }}>How every agent's storefront is selling. Ranked by commission earned.</div></div>
          <div className="field" style={{ margin: 0 }}><div className="control" style={{ height: 42 }}><I.search size={18} /><input placeholder="Search agent, business or store link" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} /></div></div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Agent</th><th>Store</th><th style={{ textAlign: "center" }}>Orders</th><th style={{ textAlign: "right" }}>Revenue</th><th style={{ textAlign: "right" }}>Commission</th><th style={{ textAlign: "right" }}>Pending</th><th style={{ textAlign: "right" }}>Last sale</th></tr></thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--blue-050)", color: "var(--blue-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14 }}>{AGENT_INITIALS(a.name)}</span><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{a.business || "Agent"}</div></div></div></td>
                  <td className="muted" style={{ fontSize: 13 }}>{a.handle ? <span className="mono">/{a.handle}</span> : "—"}</td>
                  <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700 }}>{a.orders}</span>{a.orders > 0 && <div className="muted" style={{ fontSize: 11.5 }}>{a.delivered} delivered{a.processing ? ` · ${a.processing} pending` : ""}</div>}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{S.fmt(a.revenue)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--ok)" }}>{S.fmt(a.commission)}</td>
                  <td style={{ textAlign: "right", color: a.pendingCommission > 0 ? "#B9791C" : "var(--faint)" }}>{a.pendingCommission > 0 ? S.fmt(a.pendingCommission) : "—"}</td>
                  <td style={{ textAlign: "right" }} className="muted">{a.lastSaleAt ? S.ago(a.lastSaleAt) : "No sales yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loaded && <DataLoader label="Loading agents…" />}
        {loaded && rows.length === 0 && <div className="empty" style={{ padding: "36px 10px" }}><div className="ic"><I.users size={26} /></div><p>{term ? "No agents match your search." : "No agents yet."}</p></div>}
        </div>
      </div>
    </React.Fragment>
  );
}

// ---- Commissions — every commission-earning storefront sale across the platform ----
function AdminCommissions() {
  const { S } = useStore();
  const { orders, loaded } = useSalesReport();
  const [filter, setFilter] = adU("all"); // all | delivered | processing | failed

  const monthStart = S.monthStart();
  const earned = orders.filter(o => o.status === "delivered");
  const totalEarned = earned.reduce((s, o) => s + o.commission, 0);
  const thisMonth = earned.filter(o => (o.deliveredAt || o.at) >= monthStart).reduce((s, o) => s + o.commission, 0);
  // Commission is "pending" for the whole time an order is in flight — waiting or processing.
  const pending = orders.filter(o => isInFlight(o.status)).reduce((s, o) => s + o.commission, 0);

  const filters = [["all", "All"], ["delivered", "Earned"], ["processing", "Pending"], ["failed", "Failed"]];
  const rows = orders.filter(o => filter === "all" ? true : filter === "failed" ? (o.status === "failed" || o.status === "refunded") : filter === "processing" ? isInFlight(o.status) : o.status === filter);

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <StatPill label="Commission earned" value={S.fmt(totalEarned)} ic="coins" col="var(--ok)" bg="var(--ok-bg)" />
        <StatPill label="This month" value={S.fmt(thisMonth)} ic="trend" col="var(--blue-700)" bg="var(--blue-050)" />
        <StatPill label="Pending" value={S.fmt(pending)} ic="clock" col="#B9791C" bg="#FFF4E0" />
        <StatPill label="Sales" value={earned.length} ic="list" col="var(--ink)" bg="var(--bg)" />
      </div>

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <div><h3>Commissions</h3><div className="muted" style={{ fontSize: 13 }}>Every storefront sale and the commission the agent earned on it.</div></div>
          <div className="seg" style={{ display: "inline-flex", gap: 4, background: "var(--bg)", padding: 4, borderRadius: 10 }}>
            {filters.map(([k, l]) => <button key={k} className={"seg-b" + (filter === k ? " on" : "")} onClick={() => setFilter(k)} style={{ padding: "7px 13px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: filter === k ? "var(--surface)" : "transparent", color: filter === k ? "var(--ink)" : "var(--muted)" }}>{l}</button>)}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Agent</th><th>Bundle</th><th>Customer</th><th style={{ textAlign: "right" }}>Sale</th><th style={{ textAlign: "right" }}>Commission</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "right" }}>When</th></tr></thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--blue-050)", color: "var(--blue-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 12.5 }}>{AGENT_INITIALS(o.agentName)}</span><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.agentName}</div>{o.handle && <div className="muted mono" style={{ fontSize: 11.5 }}>/{o.handle}</div>}</div></div></td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><NetBadge net={o.net} size={26} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{o.pkg}</span></div></td>
                  <td className="muted mono" style={{ fontSize: 12.5 }}>{o.customer}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{S.fmt(o.sell)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: o.status === "delivered" ? "var(--ok)" : "var(--muted)" }}>{o.status === "delivered" ? "+" : ""}{S.fmt(o.commission)}</td>
                  <td style={{ textAlign: "center" }}><StatusPill status={o.status} /></td>
                  <td style={{ textAlign: "right" }} className="muted">{o.at ? S.ago(o.at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loaded && <DataLoader label="Loading commissions…" />}
        {loaded && rows.length === 0 && <div className="empty" style={{ padding: "36px 10px" }}><div className="ic"><I.coins size={26} /></div><p>{orders.length === 0 ? "No storefront sales yet. Commissions appear here as agents make sales." : "No sales match this filter."}</p></div>}
        </div>
      </div>
    </React.Fragment>
  );
}

// ---- Transactions — every wallet movement across the whole platform ----
function AdminTransactions() {
  const { S, toast } = useStore();
  const { rows: txs, loaded } = useAdminFeed("/api/admin/transactions", "transactions");
  const [filter, setFilter] = adU("all"); // all | in | out
  const meta = {
    topup: ["wallet", "var(--ok)", "var(--ok-bg)", "Wallet top-up"],
    purchase: ["bolt", "var(--blue)", "var(--blue-050)", "Purchase"],
    refund: ["refresh", "var(--ok)", "var(--ok-bg)", "Refund"],
    commission: ["coins", "var(--teal-ink)", "var(--teal-050)", "Commission"],
    withdrawal: ["download", "#B9791C", "#FFF4E0", "Withdrawal / payout"],
    external: ["receipt", "var(--muted)", "var(--bg)", "External"],
  };
  const rows = filter === "all" ? txs : filter === "in" ? txs.filter(x => x.amount > 0) : txs.filter(x => x.amount < 0);
  const totalIn = txs.filter(x => x.amount > 0).reduce((s, x) => s + x.amount, 0);
  const totalOut = txs.filter(x => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);

  const exportCsv = () => {
    const head = ["Date", "User", "Role", "Type", "Reference", "Note", "Amount (GHS)"];
    const esc = (c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;
    const body = rows.map(e => [S.csvStamp(e.at), e.user, e.role, (meta[e.type] && meta[e.type][3]) || e.type, e.ref || "", e.note || "", (e.amount || 0).toFixed(2)]);
    const csv = [head, ...body].map(r => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `platform-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Exported ${rows.length} transaction${rows.length === 1 ? "" : "s"}`, "download");
  };

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <StatPill label="Money in" value={S.fmt(totalIn)} ic="trend" col="var(--ok)" bg="var(--ok-bg)" />
        <StatPill label="Money out" value={S.fmt(totalOut)} ic="download" col="var(--telecel)" bg="#FDE7E5" />
        <StatPill label="Net position" value={S.fmt(totalIn - totalOut)} ic="coins" col="var(--ink)" bg="var(--bg)" />
        <StatPill label="Transactions" value={txs.length} ic="list" col="var(--blue-700)" bg="var(--blue-050)" />
      </div>
      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <div><h3>Transactions</h3><div className="muted" style={{ fontSize: 13 }}>Every wallet movement platform-wide — top-ups, purchases, refunds, commissions &amp; payouts.</div></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="seg" style={{ margin: 0, width: "auto" }}>{[["all", "All"], ["in", "Money in"], ["out", "Money out"]].map(([f, l]) => <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(f)}>{l}</button>)}</div>
            <button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={exportCsv}><I.download size={16} />Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Transaction</th><th>User</th><th>Reference</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>When</th></tr></thead>
            <tbody>
              {rows.map((e, i) => {
                const [ic, col, bg, lbl] = meta[e.type] || ["receipt", "var(--muted)", "var(--bg)", e.type];
                return (
                  <tr key={e.id + i}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 36, height: 36, borderRadius: 11, background: bg, color: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={ic} size={18} /></span><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{lbl}</div><div className="muted" style={{ fontSize: 12.5 }}>{e.note}</div></div></div></td>
                    <td><div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.user}</div><SourceTag role={e.role} /></td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{e.ref || "—"}</td>
                    <td className={"amt " + (e.amount > 0 ? "amt-pos" : "amt-neg")} style={{ textAlign: "right" }}>{e.amount > 0 ? "+" : "−"}{S.fmt(Math.abs(e.amount))}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap", textAlign: "right" }}>{e.at ? S.ago(e.at) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loaded && <DataLoader label="Loading transactions…" />}
        {loaded && rows.length === 0 && <div className="empty" style={{ padding: "40px 10px" }}><div className="ic"><I.list size={26} /></div><p>{txs.length === 0 ? "No transactions yet. Wallet top-ups, purchases, commissions and payouts appear here." : "No transactions match this filter."}</p></div>}
        </div>
      </div>
    </React.Fragment>
  );
}

export { AdminDashboard, AdminIncentives, AdminOrders, AdminPayouts, AdminPricing, AdminUsers, AdminAgents, AdminCommissions, AdminTransactions, PriceEdit };

// ---- Referrals & Tiers — everything the incentive programme pays out ----
// Reads /api/admin/referrals, which returns the §3 referral report plus the §1/§2/§4
// incentive report. Figures come from the wallet ledgers, so this shows money that actually
// moved rather than a recalculation that could drift from it.
function useIncentiveReport() {
  const [data, setData] = adU(null);
  const [loaded, setLoaded] = adU(false);
  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/referrals", { credentials: "include" });
      if (r.ok) setData(await r.json().catch(() => null));
    } catch (e) {} finally { setLoaded(true); }
  }, []);
  React.useEffect(() => {
    load();
    const iv = setInterval(() => { if (typeof document === "undefined" || document.visibilityState === "visible") load(); }, 20000);
    const onVis = () => load();
    window.addEventListener("focus", onVis);
    return () => { clearInterval(iv); window.removeEventListener("focus", onVis); };
  }, [load]);
  return { data, loaded };
}

function AdminIncentives() {
  const { S } = useStore();
  const { data, loaded } = useIncentiveReport();
  const [tab, setTab] = adU("tiers");

  if (!loaded) return <div className="card pad-lg"><DataLoader label="Loading incentive report…" /></div>;
  if (!data) return <div className="card pad-lg"><div className="empty" style={{ padding: "36px 10px" }}><p>Couldn't load the incentive report.</p></div></div>;

  const inc = data.incentives || { rules: {}, totals: {}, tierCounts: [], agents: [] };
  const rules = inc.rules || {};
  const t = inc.totals || {};
  const totals = data.totals || {};
  const pct = (n) => Math.round((n || 0) * 100);

  const tabs = [["tiers", "Tiers & bonuses", "coins"], ["agents", "By agent", "users"], ["referrals", "Referrals", "gift"], ["rules", "Rules", "sliders"]];

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        <StatPill label="Incentive spend · this month" value={S.fmt(t.incentiveSpendMonth || 0)} ic="coins" col="var(--blue-700)" bg="var(--blue-050)" />
        <StatPill label="Tier bonuses · this month" value={S.fmt(t.tierBonusMonth || 0)} ic="trend" col="var(--ok)" bg="var(--ok-bg)" />
        <StatPill label="Referral credit · this month" value={S.fmt(t.referralCreditMonth || 0)} ic="gift" col="var(--teal-ink)" bg="var(--teal-050)" />
        <StatPill label="Credit outstanding" value={S.fmt(t.outstandingCredit || 0)} ic="clock" col="#B9791C" bg="#FFF4E0" />
      </div>

      <div className="ptabs">
        {tabs.map(([k, l, ic]) => <button key={k} className={"ptab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}><Ic name={ic} size={17} />{l}</button>)}
      </div>

      {tab === "tiers" && (
        <React.Fragment>
          <div className="card pad-lg" style={{ marginBottom: 18 }}>
            <div className="card-h"><div><h3>Tier bonus</h3><div className="muted" style={{ fontSize: 13 }}>Each tier pays its percentage <strong>of our own margin</strong> on an order (wholesale − vendor price) — never of the agent's retail price or of what the customer paid. Paid into the agent's wallet once the order is delivered.</div></div></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Tier</th><th>Monthly blended earnings</th><th>Bonus on margin</th><th>On a GH₵4.20 margin</th><th>Agents</th></tr></thead>
                <tbody>
                  {(inc.tierCounts || []).map((row, i, arr) => {
                    const next = arr[i + 1];
                    const band = next ? `${S.fmt0(row.min)} – ${S.fmt0(next.min)}` : `${S.fmt0(row.min)}+`;
                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td className="muted">{band}</td>
                        <td><span className="pill approved" style={{ fontSize: 11 }}>{pct(row.rate)}%</span></td>
                        <td className="amt amt-pos">+{S.fmt(Math.round(4.2 * row.rate * 100) / 100)}</td>
                        <td style={{ fontWeight: 600 }}>{row.agents}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />A bonus can never exceed the margin it comes from, so an order can't be sold at a loss however the rates are set.</p>
          </div>

          <div className="grid g-3">
            <div className="card pad-lg"><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>TIER BONUSES PAID</div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 30, marginTop: 6 }}>{S.fmt(t.tierBonusLifetime || 0)}</div><div className="muted" style={{ fontSize: 13 }}>all time · {S.fmt(t.tierBonusMonth || 0)} this month</div></div>
            <div className="card pad-lg"><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>RECRUITMENT OVERRIDES</div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 30, marginTop: 6 }}>{S.fmt(t.overrideLifetime || 0)}</div><div className="muted" style={{ fontSize: 13 }}>all time · {S.fmt(t.overrideMonth || 0)} this month</div></div>
            <div className="card pad-lg"><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>AGENT STORE PROFIT</div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 30, marginTop: 6 }}>{S.fmt(t.storeProfitMonth || 0)}</div><div className="muted" style={{ fontSize: 13 }}>this month</div></div>
          </div>
        </React.Fragment>
      )}

      {tab === "agents" && (
        <div className="card pad-lg">
          <div className="card-h"><div><h3>Agents by tier</h3><div className="muted" style={{ fontSize: 13 }}>Blended monthly earnings and the tier each agent currently sits on. "Held back" is referral earnings that don't count toward the tier because at least 70% of progress must come from real sales.</div></div></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Agent</th><th>Tier</th><th>Store profit</th><th>Commission</th><th>Referrals counted</th><th>Held back</th><th>Tier score</th><th>To next tier</th><th>Credit</th></tr></thead>
              <tbody>
                {(inc.agents || []).map(a => (
                  <tr key={a.id}>
                    <td><div style={{ fontWeight: 600 }}>{a.business || a.name}</div><div className="muted" style={{ fontSize: 12 }}>{a.phone || "—"}</div></td>
                    <td><span className="pill approved" style={{ fontSize: 10.5 }}>{a.tier} · {pct(a.tierRate)}%</span></td>
                    <td className="muted">{S.fmt(a.storeProfit)}</td>
                    <td className="muted">{S.fmt(a.commission)}</td>
                    <td className="muted">{S.fmt(a.referralsCounted)}</td>
                    <td>{a.referralsExcluded > 0 ? <span className="amt" style={{ color: "#B9791C" }}>{S.fmt(a.referralsExcluded)}</span> : <span className="muted">—</span>}</td>
                    <td style={{ fontWeight: 600 }}>{S.fmt(a.tierScore)}</td>
                    <td className="muted">{a.nextTier ? `${S.fmt(a.toNextTier)} → ${a.nextTier}` : "Top tier"}</td>
                    <td className="muted">{a.creditBalance > 0 ? S.fmt(a.creditBalance) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(inc.agents || []).length === 0 && <div className="empty" style={{ padding: "30px 10px" }}><p>No agents have earned yet this month.</p></div>}
        </div>
      )}

      {tab === "referrals" && (
        <React.Fragment>
          <div className="grid g-4" style={{ marginBottom: 18 }}>
            <StatPill label="Signups via a code" value={totals.signups || 0} ic="users" col="var(--blue-700)" bg="var(--blue-050)" />
            <StatPill label="Paid out" value={totals.qualified || 0} ic="check" col="var(--ok)" bg="var(--ok-bg)" />
            <StatPill label="Awaiting first delivery" value={totals.pending || 0} ic="clock" col="#B9791C" bg="#FFF4E0" />
            <StatPill label="Credit issued" value={S.fmt(totals.creditPaid || 0)} ic="gift" col="var(--teal-ink)" bg="var(--teal-050)" />
          </div>

          <div className="card pad-lg" style={{ marginBottom: 18 }}>
            <div className="card-h"><div><h3>Top referrers</h3><div className="muted" style={{ fontSize: 13 }}>Who is bringing people in, and what they've been paid.</div></div></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Referrer</th><th>Code</th><th>Signups</th><th>Paid</th><th>Earned</th><th>Last</th></tr></thead>
                <tbody>
                  {(data.leaderboard || []).map(r => (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight: 600 }}>{r.name}</div><div className="muted" style={{ fontSize: 12 }}>{r.phone || "—"}</div></td>
                      <td><span className="mono" style={{ fontFamily: "ui-monospace,monospace", fontSize: 12.5 }}>{r.code || "—"}</span></td>
                      <td>{r.signups}</td>
                      <td>{r.qualified}</td>
                      <td className="amt amt-pos">+{S.fmt(r.earned)}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{r.lastAt ? S.shortStamp(r.lastAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(data.leaderboard || []).length === 0 && <div className="empty" style={{ padding: "30px 10px" }}><p>Nobody has referred anyone yet.</p></div>}
          </div>

          <div className="card pad-lg">
            <div className="card-h"><div><h3>Recent referrals</h3><div className="muted" style={{ fontSize: 13 }}>Rewards are paid when the new customer's first order is delivered — never on signup.</div></div></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>New customer</th><th>Referred by</th><th>Code</th><th>Status</th><th>Reward</th><th>Joined</th></tr></thead>
                <tbody>
                  {(data.recent || []).map(r => (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight: 600 }}>{r.name}</div><div className="muted" style={{ fontSize: 12 }}>{r.phone || "—"}</div></td>
                      <td className="muted">{r.referrer}</td>
                      <td><span style={{ fontFamily: "ui-monospace,monospace", fontSize: 12.5 }}>{r.code}</span></td>
                      <td>{r.status === "qualified"
                        ? <span className="pill approved" style={{ fontSize: 10.5 }}>Paid</span>
                        : <span className="pill requested" style={{ fontSize: 10.5 }}>Awaiting delivery</span>}</td>
                      <td className="muted">{r.status === "qualified" ? S.fmt(r.reward) : "—"}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{S.shortStamp(r.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(data.recent || []).length === 0 && <div className="empty" style={{ padding: "30px 10px" }}><p>No referrals yet.</p></div>}
          </div>
        </React.Fragment>
      )}

      {tab === "rules" && (
        <div className="card pad-lg">
          <div className="card-h"><div><h3>Programme rules</h3><div className="muted" style={{ fontSize: 13 }}>The live values every payout is calculated from. These come from the server, so what's shown here is what's actually being applied.</div></div></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                <tr><td style={{ fontWeight: 600 }}>Tier bonus base</td><td>Platform margin on each order — retail price minus wholesale cost. Never the retail price.</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Real-sales safeguard</td><td>At least {pct(rules.realSalesFloor)}% of an agent's blended monthly total must come from store profit and commission. Referral earnings above that don't count toward their tier.</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Referral reward</td><td>{S.fmt(rules.referrerReward || 0)} to the referrer, {S.fmt(rules.referredReward || 0)} to the new customer. Paid only once the new customer's first order is <strong>delivered</strong>.</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Reward type</td><td>Wallet credit — spendable on any product, not withdrawable or cashable, expires after {rules.creditExpiryDays} days.</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Referral cap</td><td>Maximum {rules.referralMonthlyCap} paid referrals per person per month. One reward per phone number, ever.</td></tr>
                <tr><td style={{ fontWeight: 600 }}>Recruitment override</td><td>{pct(rules.overrideRate)}% of a recruited agent's <strong>commission</strong> (never their sales value), for their first 60 days or until GH₵500 of commission. One level only, capped at {S.fmt(rules.overrideMonthlyCap || 0)} per recruiter per month.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
