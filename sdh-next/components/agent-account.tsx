"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { StorePrice } from "@/components/store-builder";
import { Arc, DataLoader, Empty, Field, Modal, NetBadge, Pill, Select } from "@/components/ui";

/* Smart Data Hub — Agent account: Pricing, Transactions, Complaints, What's New, Community */
const { useState: aacU } = React;

/* ---------------- PRICING (agent's own selling prices, by product & telco) ---------------- */
function AgentPricingPage() {
  const { S, store, setStorePrice, setStoreAfaPrice, setProductPrice, setUtilMarkup, toast, bundlesFor, afaPrice, refreshAfa, smsRate, checkers } = useStore();
  const [tab, setTab] = aacU("data");
  // MTN and AT each sell two independent LINES (Standard / Xpress, iShare / BigTime) that
  // price separately, exactly as they do on the admin Pricing page and in My Store — so the
  // picker is per LINE, not per network, and each line carries the priceKey its prices are
  // stored under ("atbig", "mtnx"). Without this, those lines' prices are unreachable here.
  const [line, setLine] = aacU("mtn");
  const tabs = [["data", "Data", "signal"], ["afa", "AFA", "idcard"], ["checker", "Results Checker", "ticket"], ["utilities", "Utilities", "plug"], ["sms", "SMS", "mail"]];

  const priceLines = S.dataLinesOf(["mtn", "telecel", "atigo"], store);
  const cur = priceLines.find(l => l.key === line) || priceLines[0];

  const applyMarkup = (pct) => {
    bundlesFor(cur.net, cur.variant).forEach(b => setStorePrice(cur.priceKey, "d" + b.gb, +(b.reseller * (1 + pct / 100)).toFixed(2)));
    toast("Applied +" + pct + "% on " + cur.name, "tag");
  };

  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.tag size={22} /></span>
        <div><strong style={{ fontSize: 15.5 }}>Set your own prices, per product &amp; per network</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Your <strong style={{ color: "var(--teal-ink)" }}>profit</strong> on each sale is your price minus the platform wholesale cost — credited automatically.</div></div>
      </div>

      <div className="ptabs">
        {tabs.map(([k, l, ic]) => <button key={k} className={"ptab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}><Ic name={ic} size={17} />{l}</button>)}
      </div>

      {tab === "data" && (
        <div className="card pad-lg">
          <div className="card-h" style={{ flexWrap: "wrap", gap: 12 }}>
            <h3>Data bundle prices</h3>
            <div className="price-net-row" style={{ margin: 0 }}>
              <div className="pn-scroll">
                {priceLines.map(l => <button key={l.key} className={"pn" + (cur.key === l.key ? " on" : "")} onClick={() => setLine(l.key)}><NetBadge net={l.net} size={20} />{l.name}</button>)}
              </div>
              <span className="markup-inline">{[8, 12, 18, 25].map(p => <button key={p} className="mk" onClick={() => applyMarkup(p)}>+{p}%</button>)}</span>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              {/* Two separate numbers, deliberately: "Your Profit" is the agent's own margin
                  from their own pricing and is entirely theirs; "Tier bonus" is what WE pay
                  on top, worked out on our margin so their pricing never changes it. */}
              <thead><tr><th>Bundle</th><th>Validity</th><th>Wholesale</th><th>Retail (cap)</th><th>Your price</th><th>Your Profit</th><th>Tier bonus</th></tr></thead>
              <tbody>
                {bundlesFor(cur.net, cur.variant).map(b => {
                  const price = S.storeSellOf(store, cur.priceKey, b);
                  const comm = +(price - b.reseller).toFixed(2);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 16 }}>{b.gb}GB</td>
                      <td className="muted">{S.validityOf(b)}</td>
                      <td className="muted">{S.fmt(b.reseller)}</td>
                      <td className="muted">{S.fmt(b.price)}</td>
                      <td><StorePrice value={price} floor={b.reseller} onChange={(v) => setStorePrice(cur.priceKey, "d" + b.gb, Math.max(v, b.reseller))} /></td>
                      <td className={"amt " + (comm >= 0 ? "amt-pos" : "")} style={comm < 0 ? { color: "var(--telecel)" } : {}}>{comm >= 0 ? "+" : ""}{S.fmt(comm)}</td>
                      <td className={"amt " + (b.tierBonus > 0 ? "amt-pos" : "")}>{b.tierBonus > 0 ? "+" + S.fmt(b.tierBonus) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "afa" && (() => {
        // `afaPrice` is the PLATFORM fee (admin-set, what you pay us). The agent sets their
        // own selling price on top and keeps the difference — floored at the fee server-side,
        // so a store can never sell below our cost.
        const myPrice = store.afaPrice ?? afaPrice;
        const profit = +(myPrice - afaPrice).toFixed(2);
        return (
        <div className="card pad-lg">
          <div className="card-h"><h3>AFA registration price</h3><NetBadge net="mtn" size={30} /></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 16 }}>MTN AFA is a one-time registration. Smart Data Hub sets the fee you pay us; you set what you charge on your store and keep the difference. Note that AFA earns <strong style={{ color: "var(--ink)" }}>no tier bonus and no other rewards</strong> — your own margin is the whole of it.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Service</th><th>Platform fee</th><th>Your store price</th><th>Your Profit</th><th>Tier bonus</th></tr></thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>MTN AFA registration</td>
                  <td className="muted">{S.fmt(afaPrice)}</td>
                  <td><StorePrice value={myPrice} floor={afaPrice} onChange={(v) => setStoreAfaPrice(v)} /></td>
                  <td className={"amt " + (profit > 0 ? "amt-pos" : "")}>{profit > 0 ? "+" + S.fmt(profit) : "—"}</td>
                  <td className="muted">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>AFA packages (for registered numbers)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {S.afaInfo.packages.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
                  <strong style={{ fontFamily: "var(--ff-display)", flexShrink: 0 }}>{p.price}</strong>
                  <span className="muted" style={{ fontWeight: 600 }}>{p.what}</span>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Bought by dialling <strong style={{ color: "var(--ink)" }}>{S.afaInfo.ussd}</strong> on the registered number. {S.afaInfo.partner}</p>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />Your store price can't go below the platform fee. Your profit is credited once our team approves the registration — the applicant is notified by SMS and email at each step.</p>
        </div>
        );
      })()}

      {tab === "checker" && (
        <div className="card pad-lg">
          <div className="card-h"><h3>Results checker prices</h3></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 14 }}>Set what you charge for each voucher. You pay the platform wholesale; the difference is your profit on every checker sold.</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Product</th><th>Exam body</th><th>Wholesale</th><th>Your price</th><th>Your Profit</th></tr></thead>
              <tbody>
                {/* Published prices, not the S.checkerProducts catalog: the agent's
                    wholesale and their floor have to be the real ones they're charged. */}
                {(checkers || []).filter(p => p.available !== false).map(p => {
                  const price = (store.checkerPrices && store.checkerPrices[p.id]) ?? p.retail;
                  const comm = +(price - p.cost).toFixed(2);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="pill approved" style={{ fontSize: 10.5 }}>{p.body}</span></td>
                      <td className="muted">{S.fmt(p.cost)}</td>
                      <td><StorePrice value={price} floor={p.cost} onChange={(v) => setProductPrice("checkerPrices", p.id, v)} /></td>
                      <td className={"amt " + (comm >= 0 ? "amt-pos" : "")} style={comm < 0 ? { color: "var(--telecel)" } : {}}>{comm >= 0 ? "+" : ""}{S.fmt(comm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "utilities" && (
        <div className="card pad-lg">
          <div className="card-h"><h3>Utilities &amp; bills pricing</h3></div>
          <Empty icon="plug" title="Coming soon" sub="Pricing for prepaid bills, DStv packages and streaming plans isn't available to set yet — check back soon." />
        </div>
      )}

      {tab === "sms" && (
        <div className="card pad-lg">
          <div className="card-h"><h3>Bulk SMS rate</h3></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -8, marginBottom: 16 }}>SMS is billed per page (160 characters) per recipient, charged from your wallet. Anything the network refuses is refunded straight away.</p>
          <div className="grid g-3">
            <div className="stat-tile"><div className="lbl">Rate per page</div><div className="v">{S.fmt(smsRate)}</div></div>
            <div className="stat-tile"><div className="lbl">1,000 recipients</div><div className="v" style={{ color: "var(--blue)" }}>{S.fmt(smsRate * 1000)}</div></div>
            <div className="stat-tile"><div className="lbl">Send from</div><div className="v" style={{ fontSize: 20 }}>Your sender ID</div></div>
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>Set by Smart Data Hub — bulk SMS earns no commission and can't be marked up. Compose and send under <strong style={{ color: "var(--ink)" }}>SMS</strong>.</p>
        </div>
      )}
    </React.Fragment>
  );
}

/* ---------------- TRANSACTION HISTORY (everything, merged) ---------------- */
function TransactionsPage() {
  const { S, ledger, commissions, withdrawals, toast, dataLoading } = useStore();
  const loading = dataLoading.wallet || dataLoading.withdrawals;
  const [filter, setFilter] = aacU("all");
  const meta = {
    topup: ["wallet", "var(--ok)", "var(--ok-bg)", "Wallet top-up"], purchase: ["bolt", "var(--blue)", "var(--blue-050)", "Purchase"],
    refund: ["refresh", "var(--ok)", "var(--ok-bg)", "Refund"], commission: ["coins", "var(--teal-ink)", "var(--teal-050)", "Your Profit"],
    withdrawal: ["download", "#B9791C", "#FFF4E0", "Withdrawal"],
  };
  const all = [
    ...ledger.map(e => ({ ...e, kind: e.type, amount: e.amount })),
    ...commissions.map(c => ({ id: c.id, kind: "commission", amount: c.amount, ref: c.orderId, note: "Profit · " + c.pkg, at: c.at })),
    ...withdrawals.map(w => ({ id: w.id, kind: "withdrawal", amount: -w.amount, ref: w.id, note: "Payout to " + w.payout, at: w.at })),
  ].sort((a, b) => b.at - a.at);
  const rows = filter === "all" ? all : filter === "in" ? all.filter(x => x.amount > 0) : all.filter(x => x.amount < 0);
  const totalIn = all.filter(x => x.amount > 0).reduce((s, x) => s + x.amount, 0);
  const totalOut = all.filter(x => x.amount < 0).reduce((s, x) => s + Math.abs(x.amount), 0);
  // Export the current (filtered) view to a CSV file the agent can open in Excel/Sheets.
  const exportCsv = () => {
    const head = ["Date", "Type", "Reference", "Note", "Amount (GHS)"];
    const esc = (c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`;
    const body = rows.map(e => [S.csvStamp(e.at), (meta[e.kind] && meta[e.kind][3]) || e.kind, e.ref || "", e.note || "", e.amount.toFixed(2)]);
    const csv = [head, ...body].map(r => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Exported ${rows.length} transaction${rows.length === 1 ? "" : "s"}`, "download");
  };
  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["Money in", S.fmt(totalIn), "trend", "var(--ok)", "var(--ok-bg)"], ["Money out", S.fmt(totalOut), "download", "var(--telecel)", "#FDE7E5"], ["Transactions", all.length, "list", "var(--blue)", "var(--blue-050)"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v" style={{ color: i === 2 ? "var(--ink)" : col }}>{v}</div></div>
        ))}
      </div>
      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 10 }}>
          <h3>Transaction history</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="seg" style={{ margin: 0, width: "auto" }}>{[["all", "All"], ["in", "Money in"], ["out", "Money out"]].map(([f, l]) => <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 14px" }} onClick={() => setFilter(f)}>{l}</button>)}</div>
            <button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={exportCsv}><I.download size={16} />Export</button>
          </div>
        </div>
        {loading ? (
          <DataLoader label="Loading transactions…" />
        ) : rows.length === 0 ? (
          <Empty icon="list" title="No transactions yet" sub="Your wallet top-ups, purchases, profit and payouts will appear here." />
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Transaction</th><th>Reference</th><th>Amount</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((e, i) => {
                const [ic, col, bg, lbl] = meta[e.kind] || ["receipt", "var(--muted)", "var(--bg)", e.kind];
                return (
                  <tr key={e.id + i}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 36, height: 36, borderRadius: 11, background: bg, color: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={ic} size={18} /></span><div><div style={{ fontWeight: 600 }}>{lbl}</div><div className="muted" style={{ fontSize: 12.5 }}>{e.note}</div></div></div></td>
                    <td className="mono">{e.ref}</td>
                    <td className={"amt " + (e.amount > 0 ? "amt-pos" : "amt-neg")}>{e.amount > 0 ? "+" : "−"}{S.fmt(Math.abs(e.amount))}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(e.at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </React.Fragment>
  );
}

/* ---------------- MY COMPLAINTS ---------------- */
function ComplaintsPage() {
  const { S, complaints, dataLoading, refreshComplaints, replyComplaint, markComplaintRead, user } = useStore();
  const [open, setOpen] = aacU(false);
  const [detail, setDetail] = aacU(null);
  React.useEffect(() => { if (user?.id) refreshComplaints(); }, []);
  const openDetail = (id) => { setDetail(id); markComplaintRead(id); };
  const detailC = detail ? complaints.find(c => c.id === detail) || detail : null;
  const counts = { open: complaints.filter(c => c.status === "open").length, review: complaints.filter(c => c.status === "in-review").length, resolved: complaints.filter(c => c.status === "resolved").length };
  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["Open", counts.open, "flag", "var(--telecel)", "#FDE7E5"], ["In review", counts.review, "clock", "#B9791C", "#FFF4E0"], ["Resolved", counts.resolved, "checkc", "var(--ok)", "var(--ok-bg)"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>
      <div className="card pad-lg">
        <div className="card-h"><h3>My complaints</h3><button className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 14 }} onClick={() => setOpen(true)}><I.plus size={16} stroke="#fff" />New complaint</button></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dataLoading.complaints && <DataLoader label="Loading your complaints…" />}
          {!dataLoading.complaints && complaints.length === 0 && <Empty icon="flag" title="No complaints" sub="If an order goes wrong, raise a complaint here and we'll help you sort it out." />}
          {complaints.map(c => {
            const st = c.status === "in-review" ? "processing" : c.status === "open" ? "failed" : "delivered";
            return (
              <div key={c.id} onClick={() => openDetail(c.id)} style={{ border: "1px solid " + (c.unread ? "var(--blue)" : "var(--line)"), borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {c.unread && <span title="New reply" style={{ width: 8, height: 8, borderRadius: 99, background: "var(--blue)", flexShrink: 0 }}></span>}
                  <strong style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>{c.subject}</strong>
                  <span className="pill approved" style={{ fontSize: 11 }}>{c.category}</span>
                  <Pill status={st}>{c.status === "in-review" ? "In review" : c.status}</Pill>
                  <span className="muted" style={{ fontSize: 12.5, marginLeft: "auto" }}>{S.ago(c.at)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <span className="mono" style={{ fontSize: 12 }}>{c.id}</span>
                  {c.ref !== "—" && <span className="muted" style={{ fontSize: 12.5 }}>· ref {c.ref}</span>}
                  <span className="muted" style={{ fontSize: 12.5 }}>· {c.msgs} message{c.msgs !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--muted)", display: "flex", gap: 8, alignItems: "flex-start" }}><I.info size={16} style={{ flexShrink: 0, marginTop: 2 }} />{c.last}</div>
              </div>
            );
          })}
        </div>
      </div>
      {open && <NewComplaintModal onClose={() => setOpen(false)} />}
      {detailC && <ComplaintThreadModal complaint={detailC} admin={false} onReply={replyComplaint} onStatus={async () => {}} onClose={() => setDetail(null)} />}
    </React.Fragment>
  );
}

function NewComplaintModal({ onClose, presetRef = "", presetSubject = "", presetCategory = "Delivery" }) {
  const { addComplaint, toast } = useStore();
  const [subject, setSubject] = aacU(presetSubject);
  const [cat, setCat] = aacU(presetCategory);
  const [ref, setRef] = aacU(presetRef);
  const [msg, setMsg] = aacU("");
  const [busy, setBusy] = aacU(false);
  const [err, setErr] = aacU("");
  const ok = subject.trim() && msg.trim();
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr("");
    try { await addComplaint({ subject: subject.trim(), ref, category: cat, message: msg.trim() }); onClose(); }
    catch (e) { setErr(e?.message || "Could not submit your complaint."); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Raise a complaint" onClose={onClose}>
      {presetRef && <div className="co-item" style={{ background: "var(--bg)" }}><span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.receipt size={20} /></span><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>About order {presetRef}</div><div className="muted" style={{ fontSize: 12.5 }}>We'll attach this complaint to that order.</div></div></div>}
      <Field label="Subject" icon="flag" placeholder="Brief summary of the issue" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <Select label="Category" value={cat} onChange={setCat} options={["Delivery", "Payment", "Payout", "Wallet", "Account", "Other"]} />
      <Field label="Order / reference (optional)" icon="receipt" placeholder="e.g. SO·2229" value={ref} onChange={(e) => setRef(e.target.value)} />
      <div className="field"><label>Describe the issue</label><div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}><textarea rows={4} placeholder="What happened?" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea></div></div>
      {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
      <button className="btn btn-pri btn-full" disabled={!ok || busy} style={{ opacity: (!ok || busy) ? .5 : 1 }} onClick={submit}><I.send size={18} stroke="#fff" />{busy ? "Submitting…" : "Submit complaint"}</button>
    </Modal>
  );
}

// Shared complaint thread — shows the message history and a reply box. Used by the agent
// (reply as the customer) and the admin support desk (reply as support + change status).
function ComplaintThreadModal({ complaint, onClose, onReply, onStatus, admin = false }) {
  const { S } = useStore();
  const [text, setText] = aacU("");
  const [busy, setBusy] = aacU(false);
  const [c, setC] = aacU(complaint);
  const msgs = c?.messages || [];
  const stPill = c.status === "in-review" ? "processing" : c.status === "open" ? "failed" : "delivered";

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try { const updated = await onReply(c.id, t); if (updated) setC(updated); setText(""); }
    catch (e) {} finally { setBusy(false); }
  };
  const changeStatus = async (status) => {
    setBusy(true);
    try { const updated = await onStatus(c.id, status); if (updated) setC(updated); }
    catch (e) {} finally { setBusy(false); }
  };

  return (
    <Modal title="" onClose={onClose} wide>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <strong style={{ fontFamily: "var(--ff-display)", fontSize: 18 }}>{c.subject}</strong>
        <span className="pill approved" style={{ fontSize: 11 }}>{c.category}</span>
        <Pill status={stPill}>{c.status === "in-review" ? "In review" : c.status}</Pill>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 12 }}>{c.id}</span>
        {c.ref && c.ref !== "—" && <span className="muted" style={{ fontSize: 12.5 }}>· ref {c.ref}</span>}
        {admin && <span className="muted" style={{ fontSize: 12.5 }}>· from {c.user}</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", padding: "2px 2px 4px", marginBottom: 14 }}>
        {msgs.map((m, i) => {
          const mine = admin ? m.from === "support" : m.from === "user";
          return (
            <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ padding: "10px 13px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.5, background: mine ? "var(--blue)" : "var(--bg)", color: mine ? "#fff" : "var(--ink)", border: mine ? "none" : "1px solid var(--line)", whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 3, textAlign: mine ? "right" : "left" }}>{m.from === "support" ? "Support" : (admin ? c.user : "You")} · {S.ago(m.at)}</div>
            </div>
          );
        })}
      </div>

      {c.status !== "resolved" ? (
        <div className="control" style={{ height: "auto", padding: 12, alignItems: "flex-start", marginBottom: 10 }}>
          <textarea rows={2} placeholder={admin ? "Reply to the customer…" : "Add a message…"} value={text} onChange={(e) => setText(e.target.value)} style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea>
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "8px 0 12px" }}>This complaint is resolved.{!admin && " Reply to reopen it."}</div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 14, flex: 1, opacity: (!text.trim() || busy) ? .5 : 1 }} disabled={!text.trim() || busy} onClick={send}><I.send size={16} stroke="#fff" />{busy ? "Sending…" : "Send"}</button>
        {admin && c.status !== "resolved" && <button className="btn btn-out" style={{ padding: "10px 16px", fontSize: 14 }} disabled={busy} onClick={() => changeStatus("resolved")}><I.check size={15} />Mark resolved</button>}
        {admin && c.status === "resolved" && <button className="btn btn-out" style={{ padding: "10px 16px", fontSize: 14 }} disabled={busy} onClick={() => changeStatus("in-review")}>Reopen</button>}
      </div>
    </Modal>
  );
}

/* ---------------- WHAT'S NEW ---------------- */
function WhatsNewPage() {
  const { S, role } = useStore();
  const isCustomer = role === "customer";
  const feed = isCustomer ? S.customerChangelog : S.changelog;
  const tagColor = { New: ["var(--teal-ink)", "var(--teal-050)"], Improved: ["var(--blue-700)", "var(--blue-050)"], Fixed: ["#B9791C", "#FFF4E0"] };
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card pad-lg" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-700))", color: "#fff", marginBottom: 18, position: "relative", overflow: "hidden" }}>
        <Arc style={{ top: -30, right: -20, width: 200 }} stroke="#fff" opacity={0.14} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><I.sparkle size={26} stroke="var(--teal)" /><h3 style={{ color: "#fff", fontSize: 20 }}>What's new at Smart Data Hub</h3></div>
        <p style={{ color: "rgba(255,255,255,.85)", fontSize: 14.5, marginTop: 8 }}>{isCustomer ? "The latest improvements to your Smart Data Hub experience — newest first." : "Product updates, new features and fixes — newest first."}</p>
      </div>
      <div className="wn-feed">
        {feed.map((c, i) => {
          const [col, bg] = tagColor[c.tag] || ["var(--muted)", "var(--bg)"];
          return (
            <div className="wn-item" key={i}>
              <div className="wn-rail"><span className="wn-dot" style={{ background: col }}></span></div>
              <div className="wn-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="wn-tag" style={{ color: col, background: bg }}>{c.tag}</span><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.date}</span></div>
                <h4 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17, marginTop: 10 }}>{c.title}</h4>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>{c.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- JOIN COMMUNITY ---------------- */
function CommunityPage() {
  const { S, toast } = useStore();
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="sec-head" style={{ textAlign: "left", marginBottom: 22 }}>
        <h2 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 26 }}>Join the agent community</h2>
        <p className="muted" style={{ fontSize: 15.5, marginTop: 8, maxWidth: 56 + "ch" }}>Connect with thousands of Smart Data Hub agents. Get price alerts, selling tips, downtime notices and direct support.</p>
      </div>
      <div className="grid g-2">
        {S.community.map(c => (
          <div className="card pad-lg" key={c.id} style={{ display: "flex", flexDirection: "column" }}>
            <div className="ic" style={{ width: 54, height: 54, borderRadius: 16, background: c.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={c.icon} size={26} stroke="#fff" /></div>
            <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 19, marginTop: 16 }}>{c.name}</h3>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6, flex: 1 }}>{c.desc}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" style={{ background: c.color, color: "#fff", padding: "10px 18px", fontSize: 14 }} onClick={() => c.link ? window.open(c.link, "_blank") : toast("Opening " + c.name + "…", c.icon)}>Join now<I.arrow size={16} stroke="#fff" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { AgentPricingPage, CommunityPage, ComplaintsPage, ComplaintThreadModal, NewComplaintModal, TransactionsPage, WhatsNewPage };
