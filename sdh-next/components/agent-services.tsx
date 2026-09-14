"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc, CountUp, DataLoader, Empty, Field, Modal, NetBadge, Pill, useDecimalInput, Select } from "@/components/ui";
import { isInFlight } from "@/lib/orderStatus";

/* Smart Data Hub — Agent services: Results Checker, Bulk SMS, API */
const { useState: asvU } = React;

/* ---------------- RESULTS CHECKER ---------------- */
function ResultsCheckerPage() {
  const { S, role, user, checkers } = useStore();
  const isAgent = role === "reseller";
  const [buy, setBuy] = asvU(null);
  const [voucher, setVoucher] = asvU(null);
  const [orders, setOrders] = asvU([]);
  // Only WASSCE & BECE are fulfillable (Muviin) — hide the rest so nothing unsellable shows.
  //
  // From `checkers` (admin-published, via /api/pricing), NOT the S.checkerProducts catalog.
  // Reading the catalog meant this page quoted its hardcoded placeholder prices while the
  // server charged the published ones — the same product priced differently here, on a
  // storefront, and on the receipt.
  const products = (checkers || []).filter(p => ["wassce", "bece"].includes(p.id));

  const loadOrders = React.useCallback(async () => {
    if (!user?.id) return;
    try { const r = await fetch("/api/checkers", { credentials: "include" }); if (r.ok) { const d = await r.json().catch(() => ({})); if (Array.isArray(d.orders)) setOrders(d.orders); } } catch (e) {}
  }, [user]);
  React.useEffect(() => { loadOrders(); }, [loadOrders]);
  // Live: refresh while any order is awaiting its PIN.
  React.useEffect(() => {
    if (!user?.id || !orders.some(o => isInFlight(o.status))) return;
    const t = setInterval(loadOrders, 12000);
    return () => clearInterval(t);
  }, [orders, user, loadOrders]);

  const delivered = orders.filter(o => o.status === "delivered");
  const earned = delivered.reduce((s, o) => s + (o.commission || 0), 0);
  const stats = isAgent
    ? [["Vouchers sold", delivered.reduce((s, o) => s + (o.qty || 1), 0), "ticket"], ["Commission earned", S.fmt(earned), "coins"], ["Products", products.length, "doc"]]
    : [["Checker types", products.length, "ticket"], ["Delivered", delivered.length, "checkc"], ["By SMS", "PIN + serial", "doc"]];
  return (
    <React.Fragment>
      {!isAgent && (
        <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, background: "var(--teal-050)", border: "1px solid rgba(14,158,146,.2)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--teal-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.ticket size={24} stroke="#fff" /></span>
          <div><strong style={{ fontSize: 15.5 }}>Check your exam results in seconds</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Buy a WAEC or placement checker — your PIN &amp; serial arrive instantly by SMS.</div></div>
        </div>
      )}
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {stats.map(([l, v, ic], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>

      <div className="card pad-lg">
        <div className="card-h"><h3>{isAgent ? "Results checker vouchers" : "Buy a results checker"}</h3><span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Instant PIN &amp; serial</span></div>
        <div className="grid g-2">
          {products.map(p => {
            const comm = +(p.retail - p.cost).toFixed(2);
            return (
              <div className="card checker-card" key={p.id} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="ic" style={{ width: 54, height: 54, borderRadius: 15, flexShrink: 0, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.ticket size={26} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><strong style={{ fontFamily: "var(--ff-display)", fontSize: 17 }}>{p.name}</strong><span className="pill approved" style={{ fontSize: 10.5 }}>{p.body}</span></div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{p.blurb}</div>
                  <div className="ck-meta" style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                    <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 18, color: "var(--blue-700)" }}>{S.fmt(p.retail)}</span>
                    {isAgent && <span className="rs" style={{ color: "var(--teal-ink)", fontWeight: 700, fontSize: 12.5 }}>+{S.fmt(comm)} commission</span>}
                    {isAgent && <span className="muted ck-stock" style={{ fontSize: 12, marginLeft: "auto" }}>{p.stock} in stock</span>}
                  </div>
                </div>
                <button className="btn btn-pri checker-cta" style={{ padding: "10px 16px", fontSize: 14 }} onClick={() => setBuy(p)}>{isAgent ? "Sell" : "Buy"}</button>
              </div>
            );
          })}
        </div>
      </div>

      {orders.length > 0 && (
        <div className="card pad-lg" style={{ marginTop: 18 }}>
          <div className="card-h"><h3>{isAgent ? "Recent voucher sales" : "My checker orders"}</h3></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Reference</th><th>Product</th><th>Send to</th><th>Voucher</th><th>Total</th>{isAgent && <th>Commission</th>}<th>Status</th><th>When</th></tr></thead>
              <tbody>
                {orders.map(o => {
                  const st = o.status === "delivered" ? "delivered" : o.status === "processing" ? "processing" : "failed";
                  return (
                    <tr key={o.id}>
                      <td className="mono" style={{ fontSize: 12 }}>{o.id}</td>
                      <td style={{ fontWeight: 600 }}>{o.product}{o.qty > 1 ? " ×" + o.qty : ""}</td>
                      <td className="mono" style={{ fontSize: 12.5 }}>{o.recipient}</td>
                      <td>{o.status === "delivered" && o.pin ? <button className="btn btn-out" style={{ padding: "5px 11px", fontSize: 12.5 }} onClick={() => setVoucher(o)}><I.ticket size={13} />View &amp; copy</button> : <span className="muted" style={{ fontSize: 12.5 }}>{o.status === "processing" ? "Awaiting PIN…" : "—"}</span>}</td>
                      <td className="amt">{S.fmt(o.cost)}</td>
                      {isAgent && <td className="amt amt-pos">{o.commission > 0 ? "+" + S.fmt(o.commission) : "—"}</td>}
                      <td><Pill status={st}>{o.status}</Pill></td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(o.at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {buy && <CheckerBuyModal product={buy} isAgent={isAgent} ownPhone={user?.phone} onClose={() => setBuy(null)} />}
      {voucher && <CheckerVoucherModal order={voucher} onClose={() => setVoucher(null)} />}
    </React.Fragment>
  );
}

// Shows a delivered checker's serial + PIN prominently, each with a one-tap copy button —
// so the buyer can grab the values on the site (not only from the SMS).
function CheckerVoucherModal({ order, onClose }) {
  const { toast } = useStore();
  const [copied, setCopied] = asvU("");
  const copy = (key, label, val) => {
    try { navigator.clipboard?.writeText(String(val)); } catch (e) {}
    setCopied(key); toast(label + " copied", "copy");
    setTimeout(() => setCopied(c => (c === key ? "" : c)), 1600);
  };
  const rows = [["serial", "Serial number", order.serial], ["pin", "PIN", order.pin]];
  return (
    <Modal title="Your result checker" onClose={onClose}>
      <div className="co-item" style={{ background: "var(--bg)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.ticket size={22} /></span>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17 }}>{order.product}{order.qty > 1 ? " ×" + order.qty : ""}</div><div className="muted" style={{ fontSize: 12.5 }}>Order {order.id}</div></div>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "12px 0 14px" }}>Use these on the WAEC checker portal. Tap a value to copy it. Keep it safe — checkers allow a limited number of uses.</p>
      {rows.map(([key, label, val]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>{label}</div>
          <button onClick={() => copy(key, label, val)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, border: "1.5px solid var(--line-2)", borderRadius: 12, padding: "13px 15px", background: "var(--surface)", cursor: "pointer", textAlign: "left" }}>
            <span className="mono" style={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 700, letterSpacing: ".5px", color: "var(--ink)", overflowWrap: "anywhere" }}>{val}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: copied === key ? "var(--ok)" : "var(--blue-700)", flexShrink: 0 }}>{copied === key ? <><I.check size={15} stroke="var(--ok)" sw={3} />Copied</> : <><I.copy size={15} stroke="currentColor" />Copy</>}</span>
          </button>
        </div>
      ))}
      <button className="btn btn-out btn-full" style={{ marginTop: 4 }} onClick={() => copy("both", "Voucher", `${order.product}\nSerial: ${order.serial}\nPIN: ${order.pin}`)}><I.copy size={16} />Copy both</button>
      <button className="btn btn-pri btn-full" style={{ marginTop: 10 }} onClick={onClose}>Done</button>
    </Modal>
  );
}

function CheckerBuyModal({ product, isAgent, ownPhone, onClose }) {
  const { S, balance, toast, buyChecker } = useStore();
  const [qty, setQty] = asvU(1);
  const [phone, setPhone] = asvU(isAgent ? "" : (ownPhone || "").replace(/^0/, ""));
  const [done, setDone] = asvU(false);
  const [busy, setBusy] = asvU(false);
  const [err, setErr] = asvU("");
  // What this account pays per voucher, straight from the server (/api/pricing → `unit`).
  // NOT re-derived from `isAgent` here: the client's role and the session cookie the charge
  // is priced from are different sources, and `cost` isn't even sent to unprivileged
  // callers — so working it out here quoted one price and charged another.
  const unit = Number(product.unit ?? (isAgent ? product.cost : product.retail));
  const total = +(unit * qty).toFixed(2);
  // Until the published prices land, `product` is the catalog placeholder — fine to lay the
  // modal out with, never safe to charge from.
  const priceReady = !!product.live && unit > 0;
  const ok = phone.replace(/\D/g, "").length >= 9;
  const verb = isAgent ? "Sell" : "Buy";
  const buy = async () => {
    if (!ok || busy) return;
    if (!priceReady) { setErr("Still loading today's prices — one moment."); return; }
    setBusy(true); setErr("");
    // `expectedCost` is the total this screen displayed — the server refuses the order if
    // what it prices differs, so the wallet is never debited for an unquoted amount.
    try { await buyChecker({ productId: product.id, recipient: phone, qty, expectedCost: total }); setDone(true); toast(isAgent ? "Voucher ordered" : "Checker ordered", "ticket"); }
    catch (e) { setErr(e?.message || "Could not place the order."); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={done ? "" : verb + " · " + product.name} onClose={onClose}>
      {done ? (
        <div className="flow-result" style={{ padding: "6px 10px" }}>
          <div className="ok-ring"><I.clock size={40} stroke="var(--teal-ink)" sw={2.2} /></div>
          <h2>Order placed</h2><p>{qty} × {product.name} — the serial &amp; PIN will be sent by SMS to <strong>{phone}</strong> shortly. Track it under {isAgent ? "your voucher sales" : "My orders"}.</p>
          <button className="btn btn-pri btn-full" style={{ marginTop: 18 }} onClick={onClose}>Done</button>
        </div>
      ) : (
        <React.Fragment>
          <div className="co-item"><div className="ic" style={{ width: 46, height: 46, borderRadius: 13, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.ticket size={24} /></div><div style={{ flex: 1 }}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17 }}>{product.name}</div><div className="muted" style={{ fontSize: 13 }}>{S.fmt(unit)} each</div></div></div>
          <div className="field"><label>Quantity</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><I.minus size={18} /></button>
              <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22, minWidth: 40, textAlign: "center" }}>{qty}</span>
              <button className="qty-btn" onClick={() => setQty(qty + 1)}><I.plus size={18} /></button>
            </div>
          </div>
          <Field label={isAgent ? "Customer phone (receives PIN by SMS)" : "Your phone (receives PIN by SMS)"} icon="phone" pre="+233" inputMode="tel" placeholder="24 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="summary"><div className="total"><span className="muted" style={{ fontWeight: 600 }}>Pay from wallet</span><span className="v">{priceReady ? S.fmt(total) : "—"}</span></div></div>
          {!priceReady && <div className="margin-note"><I.info size={18} />Loading today's prices…</div>}
          {balance < total && <div className="margin-note" style={{ background: "#FDE7E5", borderColor: "rgba(226,35,26,.2)", color: "var(--telecel)" }}><I.info size={18} />Low wallet balance · {S.fmt(balance)}. Top up to continue.</div>}
          {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
          <button className="btn btn-pri btn-full" disabled={!ok || balance < total || busy || !priceReady} style={{ opacity: (ok && balance >= total && !busy && priceReady) ? 1 : .5 }} onClick={buy}><I.lock size={18} stroke="#fff" />{busy ? "Placing…" : `${verb} for ${S.fmt(total)}`}</button>
        </React.Fragment>
      )}
    </Modal>
  );
}

/* ---------------- BULK SMS ---------------- */
// Billable pages for a message, mirroring lib/server/smsPricing.ts so the cost shown while
// typing is the cost that will actually be charged. The server still prices independently —
// this is only the preview.
const GSM7_SET =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";
function smsPageCount(text) {
  const t = String(text || "");
  if (!t.length) return 0;
  let septets = 0, gsm = true;
  for (const ch of t) {
    if (GSM7_EXT.includes(ch)) { septets += 2; continue; }
    if (!GSM7_SET.includes(ch)) { gsm = false; break; }
    septets += 1;
  }
  // A single non-GSM character (an emoji, a curly quote) pushes the whole message to UCS-2,
  // where a page holds 70 characters instead of 160 — worth showing before they send.
  if (!gsm) return t.length <= 70 ? 1 : Math.ceil(t.length / 67);
  return septets <= 160 ? 1 : Math.ceil(septets / 153);
}

function SmsPage() {
  const { refreshSms } = useStore();
  const [tab, setTab] = asvU("send");
  // Sender IDs and campaigns are never cached locally, so pull them whenever the page opens.
  React.useEffect(() => { refreshSms(); }, [refreshSms]);
  return (
    <React.Fragment>
      <div className="seg" style={{ maxWidth: 380, marginTop: 0, marginBottom: 18 }}>
        {[["send", "Send SMS"], ["history", "History"], ["sender", "Sender IDs"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "send" && <SmsCompose />}
      {tab === "history" && <SmsHistory />}
      {tab === "sender" && <SenderIds />}
    </React.Fragment>
  );
}

function SmsHistory() {
  const { S, smsCampaigns, dataLoading } = useStore();
  return (
    <div className="card pad-lg">
      <div className="card-h"><h3>SMS history</h3></div>
      {dataLoading.sms ? <DataLoader label="Loading your campaigns…" /> : smsCampaigns.length === 0 ? (
        <Empty icon="mail" title="No campaigns yet" sub="Send your first bulk SMS and it'll show up here with what it cost and how many went out." />
      ) : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Campaign</th><th>Sender ID</th><th>Recipients</th><th>Message</th><th>Cost</th><th>Status</th><th>When</th></tr></thead>
          <tbody>{smsCampaigns.map(s => (
            <tr key={s.id}>
              <td className="mono">{s.id}</td>
              <td style={{ fontWeight: 600 }}>{s.sender}</td>
              {/* Sent vs requested — a partial campaign has to show both, since the
                  difference is exactly what was refunded. */}
              <td className="amt">{s.sent}{s.failed > 0 ? <span className="muted"> / {s.recipients}</span> : null}</td>
              <td className="muted" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.message}</td>
              <td className="amt">{S.fmt(s.cost)}</td>
              <td><Pill status={s.status === "sent" ? "delivered" : s.status === "partial" ? "requested" : "failed"}>{s.status}</Pill></td>
              <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(s.at)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function SmsCompose() {
  const { S, senderIds, smsRate, sendBulkSms, toast, storeOrders, store } = useStore();
  const approved = senderIds.filter(s => s.status === "approved");
  const [sender, setSender] = asvU("");
  const [recipients, setRecipients] = asvU("");
  const [msg, setMsg] = asvU("");
  const [busy, setBusy] = asvU(false);
  const [err, setErr] = asvU("");

  // The agent's own customers, from their real storefront orders. Same definition the
  // Customers page uses (S.customersFrom), so the counts here match what they see there.
  const customers = React.useMemo(() => S.customersFrom(storeOrders), [storeOrders]);
  const activeCustomers = customers.filter(c => c.active);
  const inactiveCustomers = customers.filter(c => !c.active);

  // The agent's own storefront URL, substituted into a template's [Agent Store Link] on
  // insert. Doing it here rather than leaving the placeholder for them to replace by hand is
  // the whole point: a template sent with the literal "[Agent Store Link]" still costs full
  // price per recipient and sends every one of them nowhere.
  const storeLink = React.useMemo(() => {
    const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://www.sdhghana.com";
    return store?.handle ? origin + "/" + store.handle : "";
  }, [store?.handle]);

  const applyTemplate = (t) => {
    if (t.body.includes(S.STORE_LINK_TOKEN) && !storeLink) {
      // No handle yet — inserting would send customers a broken link.
      toast("Set your store link first, under My Store", "info");
      return;
    }
    setMsg(storeLink ? t.body.split(S.STORE_LINK_TOKEN).join(storeLink) : t.body);
  };

  // Load a list into the box, replacing whatever is there. Replacing rather than appending
  // is deliberate: these lists overlap (All contains both others), and appending would
  // silently double up numbers the agent is about to pay to message.
  const useList = (list, label) => {
    if (!list.length) { toast(`No ${label} yet`, "info"); return; }
    setRecipients(list.map(c => c.phone).join("\n"));
    toast(`${list.length} ${list.length === 1 ? "number" : "numbers"} loaded`, "users");
  };

  // Default to the first sender the account can actually use, once they've loaded.
  React.useEffect(() => { if (!sender && approved.length) setSender(approved[0].id); }, [approved, sender]);

  // Count recipients the way the server will: normalize, drop what isn't a Ghanaian number,
  // and dedupe — so the quoted price matches the charge even if a number is listed twice.
  const parsed = React.useMemo(() => {
    const seen = new Set(); let invalid = 0;
    for (const raw of String(recipients).split(/[\s,;]+/)) {
      if (!raw.trim()) continue;
      const d = raw.replace(/\D/g, "");
      let core = null;
      if (d.length === 12 && d.startsWith("233")) core = d.slice(3);
      else if (d.length === 10 && d.startsWith("0")) core = d.slice(1);
      else if (d.length === 9) core = d;
      if (core && /^\d{9}$/.test(core)) seen.add("233" + core); else invalid++;
    }
    return { count: seen.size, invalid };
  }, [recipients]);

  const count = parsed.count;
  const pages = smsPageCount(msg);
  const cost = +(count * pages * smsRate).toFixed(2);
  const ready = count > 0 && !!msg.trim() && !!sender && !busy;

  const send = async () => {
    setBusy(true); setErr("");
    try {
      const { campaign, skipped } = await sendBulkSms({ sender, recipients, message: msg });
      if (campaign.failed > 0) {
        toast(`${campaign.sent} of ${campaign.recipients} sent — the rest were refunded`, "info");
      } else {
        toast(`SMS sent to ${campaign.sent} recipient${campaign.sent === 1 ? "" : "s"}`, "send");
      }
      if (skipped) toast(`${skipped} entr${skipped === 1 ? "y wasn't" : "ies weren't"} a valid number and ${skipped === 1 ? "was" : "were"} skipped`, "info");
      setRecipients(""); setMsg("");
    } catch (e) {
      setErr(e.message || "Could not send the campaign.");
    } finally { setBusy(false); }
  };

  return (
    <div className="grid g-2 sms-compose-grid" style={{ gridTemplateColumns: "1.3fr .7fr", alignItems: "start" }}>
      <div className="card pad-lg">
        <div className="card-h"><h3>Compose message</h3></div>
        <Select label="Sender ID" value={sender} onChange={setSender} options={approved.map(s => s.id)} />
        <div className="field" style={{ marginBottom: 4 }}>
          <label>Customer list</label>
          {/* One tap fills the box below. Counts are live, so an agent knows what a send
              will cost them before they load it. */}
          <div className="sms-lists">
            <button type="button" className="sms-list" onClick={() => useList(customers, "customers")}>
              <span className="t">All customers</span><span className="n">{customers.length}</span>
            </button>
            <button type="button" className="sms-list" onClick={() => useList(activeCustomers, "active customers")}>
              <span className="t">Active</span><span className="n">{activeCustomers.length}</span>
              <span className="s">Bought in the last {S.CUSTOMER_ACTIVE_DAYS} days</span>
            </button>
            <button type="button" className="sms-list" onClick={() => useList(inactiveCustomers, "inactive customers")}>
              <span className="t">Inactive</span><span className="n">{inactiveCustomers.length}</span>
              <span className="s">No order in {S.CUSTOMER_ACTIVE_DAYS} days</span>
            </button>
          </div>
          {recipients && <button type="button" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12.5, marginTop: 8 }} onClick={() => setRecipients("")}><I.x size={14} stroke="currentColor" />Clear recipients</button>}
        </div>
        <div className="field"><label>Recipients</label><div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}><textarea rows={3} placeholder="Paste numbers separated by commas or new lines — or pick a customer list above" value={recipients} onChange={(e) => setRecipients(e.target.value)} style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea></div><div className="hint">{count} valid recipient{count !== 1 ? "s" : ""} detected</div></div>
        <div className="field" style={{ marginBottom: 4 }}>
          <label>Templates</label>
          {/* A template fills the box and stays fully editable — it's a head start, not a
              fixed send. Picking one never sends anything on its own. */}
          <div className="sms-tpls">
            {S.smsTemplates.map(t => (
              <button type="button" key={t.id} className={"sms-tpl" + (msg.trim() === t.body.split(S.STORE_LINK_TOKEN).join(storeLink).trim() ? " on" : "")} onClick={() => applyTemplate(t)} title={t.body}>{t.name}</button>
            ))}
            {msg && <button type="button" className="sms-tpl clear" onClick={() => setMsg("")}><I.x size={13} stroke="currentColor" />Clear</button>}
          </div>
        </div>
        <div className="field"><label>Message</label><div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}><textarea rows={4} placeholder="Type your message, or pick a template above…" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea></div><div className="hint">{msg.length} chars · {pages} page{pages !== 1 ? "s" : ""}</div></div>
      </div>
      <div className="card pad-lg summary">
        <div className="card-h"><h3>Summary</h3></div>
        <div className="summary">
          <div className="row"><span className="k">Recipients</span><span className="v">{count}</span></div>
          <div className="row"><span className="k">Pages each</span><span className="v">{pages}</span></div>
          <div className="row"><span className="k">Rate</span><span className="v">{S.fmt(smsRate)} / page</span></div>
        </div>
        <div className="total"><span className="muted" style={{ fontWeight: 600 }}>Total cost</span><span className="v">{S.fmt(cost)}</span></div>
        {err && <div className="wd-otp-err" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="btn btn-pri btn-full" disabled={!ready} style={{ opacity: ready ? 1 : .5 }} onClick={send}><I.send size={18} stroke="#fff" />{busy ? "Sending…" : `Send to ${count}`}</button>
        <div className="margin-note"><I.info size={18} />Charged from your wallet. Anything the network refuses is refunded straight away.</div>
      </div>
    </div>
  );
}

function SenderIds() {
  const { S, senderIds, requestSenderId, dataLoading } = useStore();
  // The shared sender everyone can send under until their own name is approved. Named from
  // the server's list rather than hard-coded, so changing it doesn't leave stale copy here.
  const shared = senderIds.find(s => s.platform);
  const [name, setName] = asvU("");
  const [busy, setBusy] = asvU(false);
  const [err, setErr] = asvU("");

  const submit = async () => {
    setBusy(true); setErr("");
    try { await requestSenderId(name); setName(""); }
    catch (e) { setErr(e.message || "Could not request that sender ID."); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid g-2 sender-ids-grid" style={{ gridTemplateColumns: "1.3fr .7fr", alignItems: "start" }}>
      <div className="card pad-lg">
        <div className="card-h"><h3>Your sender IDs</h3></div>
        {dataLoading.sms ? <DataLoader label="Loading sender IDs…" /> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Sender ID</th><th>Status</th><th>Requested</th></tr></thead>
            <tbody>{senderIds.map(s => (
              <tr key={s.ref}>
                <td style={{ fontFamily: "var(--ff-display)", fontWeight: 600 }}>{s.id}{s.platform ? <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}> · shared</span> : null}</td>
                <td><Pill status={s.status === "approved" ? "delivered" : s.status === "rejected" ? "failed" : "requested"}>{s.status}</Pill>{s.status === "rejected" && s.note ? <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{s.note}</div> : null}</td>
                <td className="muted">{s.platform ? "—" : S.ago(s.at)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
      <div className="card pad-lg">
        <div className="card-h"><h3>Register new</h3></div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 8 }}>3–11 characters. We register it with the networks for you — approval usually takes a few hours. Until then, send with the shared {shared ? shared.id : "platform"} sender.</p>
        <Field label="Sender ID" icon="brief" placeholder="e.g. KWESIDATA" value={name} onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 11))} hint={name.length + "/11"} />
        {err && <div className="wd-otp-err" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="btn btn-pri btn-full" disabled={name.trim().length < 3 || busy} style={{ opacity: name.trim().length < 3 || busy ? .5 : 1 }} onClick={submit}>{busy ? "Submitting…" : "Request approval"}</button>
      </div>
    </div>
  );
}

/* ---------------- API ---------------- */
function ApiPage() {
  const { S, toast } = useStore();
  const a = S.apiInfo;
  const [show, setShow] = asvU(false);
  const masked = a.key.slice(0, 12) + "••••••••" + a.key.slice(-4);
  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["API calls this month", a.callsMonth.toLocaleString(), "chart"], ["Success rate", Math.round(a.successRate * 1000) / 10 + "%", "checkc"], ["Endpoints", a.endpoints.length, "doc"]].map(([l, v, ic], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>
      <div className="grid g-2" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Your API key</h3><span className="pill delivered">Live</span></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 12 }}>Use this secret key to authenticate requests. Keep it private — treat it like a password.</p>
          <div className="ref-box"><span className="code" style={{ fontSize: 13.5 }}>{show ? a.key : masked}</span>
            <button className="btn btn-out" style={{ padding: "9px 13px", fontSize: 13 }} onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
            <button className="btn btn-pri" style={{ padding: "9px 13px", fontSize: 13 }} onClick={() => { navigator.clipboard?.writeText(a.key); toast("API key copied", "copy"); }}><I.copy size={15} stroke="#fff" /></button>
          </div>
          <div className="field" style={{ marginTop: 16 }}><label>Base URL</label><div className="control"><I.signal size={18} /><input readOnly value={a.base} style={{ fontFamily: "ui-monospace,monospace", fontSize: 13.5 }} /></div></div>
          <button className="btn btn-out" style={{ marginTop: 14 }} onClick={() => toast("New key generated — update your apps", "refresh")}><I.refresh size={16} />Regenerate key</button>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>Endpoints</h3><span className="link" onClick={() => toast("Opening API docs…", "doc")}>Full docs</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {a.endpoints.map(([m, path, desc], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 12 }}>
                <span className="api-method" data-m={m}>{m}</span>
                <div style={{ minWidth: 0 }}><div style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, fontWeight: 600 }}>{path}</div><div className="muted" style={{ fontSize: 12.5 }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------------- MTN AFA REGISTRATION ---------------- */
function AfaPage() {
  const { S, afaRegs, role, user, afaPrice, refreshAfa } = useStore();
  const isAgent = role === "reseller";
  const [open, setOpen] = asvU(false);
  const a = S.afaInfo;
  // Registrations are server-backed and reviewed by admins, so load the real list on open.
  React.useEffect(() => { if (user?.id) refreshAfa(); }, [user?.id]);
  const approved = (afaRegs || []).filter(r => r.status === "approved");
  const pending = (afaRegs || []).filter(r => r.status === "pending");
  const rejected = (afaRegs || []).filter(r => r.status === "rejected");
  // No "earned" tile: AFA pays no commission.
  const agentStats = [["Approved", approved.length, "idcard", "var(--blue)"], ["Under review", pending.length, "clock", "#B9791C"], ["Not approved", rejected.length, "x", "var(--telecel)"], ["Fee per registration", S.fmt(afaPrice), "coins", "var(--ink)"]];
  return (
    <React.Fragment>
      <div className="earn-hero" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, background: "linear-gradient(135deg, #F5A800, #C97A00 75%)" }}>
        <Arc style={{ bottom: -40, right: 40, width: 240 }} stroke="#fff" opacity={0.14} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <span className="tier-badge" style={{ background: "rgba(0,0,0,.14)", borderColor: "rgba(0,0,0,.18)" }}><NetBadge net="mtn" size={20} />MTN AFA · Affordable Access For All</span>
          {isAgent ? (
            <React.Fragment>
              <div className="lbl" style={{ color: "rgba(255,255,255,.9)" }}>AFA registrations approved</div>
              <div className="big"><CountUp value={approved.length} /></div>
              <div className="sub" style={{ color: "rgba(255,255,255,.9)" }}>Register MTN numbers for the AFA bundle — reviewed by our team</div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="lbl" style={{ color: "rgba(255,255,255,.9)", marginTop: 22 }}>Unlock cheaper data on MTN</div>
              <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: "clamp(26px,3.4vw,34px)", color: "#fff", marginTop: 4, lineHeight: 1.1 }}>Register your number<br />for the AFA bundle</div>
              <div className="sub" style={{ color: "rgba(255,255,255,.9)" }}>One-time {S.fmt(afaPrice)} · then buy discounted AFA bundles</div>
            </React.Fragment>
          )}
        </div>
        <div className="acts" style={{ position: "relative", zIndex: 2, marginTop: 0 }}>
          <button className="btn" style={{ background: "#fff", color: "#9A5A00" }} onClick={() => setOpen(true)}><I.plus size={18} stroke="#9A5A00" />{isAgent ? "Register a number" : "Register my number"}</button>
        </div>
      </div>

      {isAgent && (
        <div className="grid g-4" style={{ marginTop: 18 }}>
          {agentStats.map(([l, v, ic, col], i) => (
            <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><Ic name={ic} size={17} /></span>{l}</div><div className="v" style={{ color: col }}>{v}</div></div>
          ))}
        </div>
      )}

      <div className="grid g-2 afa-grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginTop: 18, alignItems: "start" }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>{isAgent ? "Your AFA registrations" : "My AFA registrations"}</h3><button className="btn btn-pri" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={() => setOpen(true)}><I.plus size={15} stroke="#fff" />New</button></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Reference</th><th>{isAgent ? "Applicant" : "Number"}</th><th>Occupation</th><th>Ghana Card</th><th>Paid</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {(afaRegs || []).map(r => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td><div style={{ fontWeight: 600 }}>{r.name}</div><div className="mono">{r.phone}</div></td>
                    <td className="muted" style={{ fontSize: 13 }}>{r.occupation || r.profession}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{r.ghanaCard}</td>
                    <td className="amt">{S.fmt(r.amount ?? r.price)}</td>
                    <td><Pill status={r.status === "approved" ? "active" : r.status === "rejected" ? "failed" : "pending"}>{r.status === "approved" ? "Approved" : r.status === "rejected" ? "Not approved" : "Under review"}</Pill></td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(r.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(afaRegs || []).length === 0 && <div className="empty"><div className="ic"><I.idcard size={28} /></div><p>{isAgent ? "No AFA registrations yet — register a customer's number to get started." : "No AFA registration yet — register your number to unlock discounted bundles."}</p></div>}
          </div>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>About AFA</h3></div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{a.blurb} <span style={{ color: "var(--ink)", fontWeight: 600 }}>{a.partner}</span></p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {a.steps.map(([t, d], i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>AFA packages (registered numbers)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {a.packages.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>
                  <strong style={{ fontFamily: "var(--ff-display)", flexShrink: 0 }}>{p.price}</strong>
                  <span className="muted" style={{ fontWeight: 600 }}>{p.what}</span>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12, display: "flex", gap: 7 }}><I.info size={15} style={{ flexShrink: 0 }} />To purchase a package, dial <strong style={{ color: "var(--ink)" }}>{a.ussd}</strong> on the registered number.</p>
          </div>
        </div>
      </div>

      {open && <AfaRegisterModal isAgent={isAgent} ownPhone={user?.phone} ownName={user?.name} onClose={() => setOpen(false)} />}
    </React.Fragment>
  );
}

// AFA numbers are captured in LOCAL form only — 0 followed by 9 digits, e.g. 0509379146.
// A +233 / 233 number is rejected with a clear hint rather than silently rewritten: the
// number captured is submitted to MTN as-is, so quietly reformatting it is how a mistyped
// entry becomes a registration on the wrong line. Mirrors strictLocalGhPhone() on the server.
function checkAfaPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("233")) return "Enter it in local form starting with 0 — e.g. 0509379146 (not +233).";
  if (!d.startsWith("0")) return "Must start with 0 — e.g. 0509379146.";
  if (d.length < 10) return "Too short — 10 digits starting with 0.";
  if (d.length > 10) return "Too long — 10 digits starting with 0.";
  return null;
}
const afaPhoneOk = (raw) => /^0\d{9}$/.test(String(raw || "").replace(/\D/g, ""));
// Digits only, so a "+" can never be typed or pasted in. Capped at 12 so a pasted
// +233… number is still long enough to recognise and explain.
const afaPhoneInput = (v) => String(v || "").replace(/\D/g, "").slice(0, 12);

// Mirrors validateGhanaCard() in lib/server/ghanaCard.ts so the applicant gets instant
// feedback. The SERVER decides — this is only here to stop a wasted round trip.
function checkGhanaCard(raw) {
  const input = String(raw || "").replace(/\s+/g, "").toUpperCase();
  if (!input) return null;
  const body = input.startsWith("GHA") ? input.slice(3) : input;
  if (/[^0-9-]/.test(body)) return "Should look like GHA-123456789-0.";
  const digits = body.replace(/\D/g, "");
  if (digits.length < 10) return "Too short — GHA followed by 10 digits.";
  if (digits.length > 10) return "Too long — GHA followed by 10 digits.";
  const nine = digits.slice(0, 9);
  if (/^(\d)\1{8}$/.test(nine)) return "That isn't a valid Ghana Card number.";
  let asc = true, desc = true;
  for (let i = 1; i < nine.length; i++) {
    const p = +nine[i - 1], c = +nine[i];
    if (c !== (p + 1) % 10) asc = false;
    if (c !== (p + 9) % 10) desc = false;
  }
  if (asc || desc) return "That isn't a valid Ghana Card number.";
  return null;
}

function AfaRegisterModal({ isAgent, ownPhone, ownName, onClose }) {
  // AFA is admin-priced and commission-free, so there is no price field and nothing to earn
  // here — the applicant (or the agent registering them) simply pays the platform price.
  const { S, balance, registerAfa, afaPrice, toast } = useStore();
  const a = S.afaInfo;
  const [name, setName] = asvU(isAgent ? "" : (ownName || ""));
  // Local form, complete with its leading 0 — no "+233" prefix on this field.
  const [phone, setPhone] = asvU(isAgent ? "" : afaPhoneInput(ownPhone?.local || ownPhone || ""));
  const [idNum, setIdNum] = asvU("");
  const [location, setLocation] = asvU("");
  const [dob, setDob] = asvU("");
  const [occ, setOcc] = asvU("");
  const [busy, setBusy] = asvU(false);
  const cardError = checkGhanaCard(idNum);
  const phoneError = checkAfaPhone(phone);
  const price = afaPrice;
  const filled = name.trim() && afaPhoneOk(phone) && idNum.trim() && !cardError && location.trim() && dob.trim() && occ.trim();
  const ok = filled && balance >= price && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      await registerAfa({
        name: name.trim(),
        phone: phone.trim(),
        ghanaCard: idNum.trim(),
        location: location.trim(),
        occupation: occ.trim(),
        dob: dob.trim(),
      });
      onClose();
    } catch (e) {
      toast(e.message || "Could not submit the registration", "info");
    }
    setBusy(false);
  };
  return (
    <Modal title={isAgent ? "Register a number for AFA" : "Register my number for AFA"} onClose={onClose}>
      <div className="co-item afa-banner">
        <NetBadge net="mtn" size={44} />
        <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 16 }}>MTN AFA registration</div><div className="muted" style={{ fontSize: 12.5 }}>One-time · unlocks discounted AFA bundles</div></div>
      </div>

      <div style={{ margin: "6px 0 2px" }}>
        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 16 }}>Applicant Details</div>
        <p className="muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 1.45 }}>Fill the form carefully. Your wallet will be charged only when submission succeeds.</p>
      </div>

      <Field label="Full Name *" icon="user" placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Phone Number *" icon="phone" inputMode="numeric" placeholder="e.g. 0509379146" value={phone} onChange={(e) => setPhone(afaPhoneInput(e.target.value))} hint={phoneError} error={!!phoneError} />
      <Field label="Ghana Card Number *" icon="idcard" placeholder="GHA-000000000-0" value={idNum} onChange={(e) => setIdNum(e.target.value)} hint={cardError} error={!!cardError} />
      <Field label="Location *" icon="pin" placeholder="e.g. Tafo, Kumasi" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Field label="Date of Birth *" icon="clock" placeholder="dd/mm/yyyy" inputMode="numeric" value={dob} onChange={(e) => setDob(e.target.value)} />
      <Field label="Occupation *" icon="brief" placeholder="e.g. Student, Teacher, Business Owner" value={occ} onChange={(e) => setOcc(e.target.value)} />
      {/* One admin-set fee for everyone — an agent pays exactly what a customer pays and
          earns nothing on it, so there's no price to set and no commission to show. */}
      <div className="summary"><div className="total"><span className="muted" style={{ fontWeight: 600 }}>Registration fee</span><span className="v">{S.fmt(price)}</span></div></div>
      {balance < price && <div className="margin-note" style={{ background: "#FDE7E5", borderColor: "rgba(226,35,26,.2)", color: "var(--telecel)", fontSize: 12.5 }}><I.info size={12.5} />Low wallet balance · {S.fmt(balance)}. Top up to continue.</div>}
      <div className="notice notice-warn" style={{ background: "#FFF4E0", border: "1px solid rgba(185,121,28,.3)", borderRadius: 14, padding: "13px 15px", display: "flex", gap: 11, alignItems: "flex-start", margin: "16px 0 4px" }}>
        <span style={{ color: "#B9791C", flexShrink: 0, marginTop: 1 }}><I.info size={19} /></span>
        <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
          <strong style={{ color: "#B9791C", display: "block", marginBottom: 2 }}>Important notice — No refunds</strong>
          <span className="muted">Please double-check all information (name, date of birth, ID number, phone) before placing your order. Once submitted, the fee cannot be refunded.</span>
        </div>
      </div>
      <button className="btn btn-pri btn-full" disabled={!ok} style={{ opacity: ok ? 1 : .5 }} onClick={submit}><I.idcard size={18} stroke="#fff" />{busy ? "Submitting…" : "Register & pay " + S.fmt(price)}</button>
    </Modal>
  );
}

export { AfaPage, AfaRegisterModal, ApiPage, CheckerBuyModal, ResultsCheckerPage, SenderIds, SmsCompose, SmsHistory, SmsPage };
