"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { NewComplaintModal } from "@/components/agent-account";
import { BuyFlow } from "@/components/buy";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { DataLoader, Modal, NetBadge, Pill } from "@/components/ui";
import { isInFlight, isOpen, statusLabel } from "@/lib/orderStatus";

/* Smart Data Hub — Agent: unified orders (storefront + direct sales) + detail */
const { useState: aoU } = React;

// normalize a direct personal order (from BuyFlow / utilities / AFA / checker) into the store-order shape
function normalizeDirect(o) {
  return {
    ...o,
    price: +((o.cost || 0) + (o.commission || 0)).toFixed(2),
    customer: o.recipient || o.customer || "—",
    customerName: "Direct sale",
    via: "agent-direct",
    pay: o.pay || "Wallet",
    momoRef: o.momoRef || "—",
  };
}

function sourceCell(o) {
  if (o.via === "agent-direct") return <span className="pill withdrawn" style={{ fontSize: 11 }}>Direct sale</span>;
  if (o.via === "direct") return <span className="muted" style={{ fontSize: 13 }}>Storefront</span>;
  return <span className="pill approved" style={{ fontSize: 11 }}>{o.via}</span>;
}

function StoreOrdersPage() {
  const { S, storeOrders, orders, dataLoading } = useStore();
  const loading = dataLoading.storeOrders || dataLoading.orders;
  const [filter, setFilter] = aoU("all");
  const [src, setSrc] = aoU("all");
  const [q, setQ] = aoU("");
  const [openId, setOpenId] = aoU(null);

  // merge storefront orders + the agent's own direct sales into one list
  const all = React.useMemo(
    () => [...storeOrders, ...orders.map(normalizeDirect)].sort((a, b) => b.at - a.at),
    [storeOrders, orders]
  );

  const counts = {
    all: all.length,
    delivered: all.filter(o => o.status === "delivered").length,
    processing: all.filter(o => isOpen(o.status)).length,  // unpaid + waiting + processing
    failed: all.filter(o => o.status === "failed" || o.status === "refunded").length,
  };
  const srcCounts = {
    all: all.length,
    storefront: all.filter(o => o.via !== "agent-direct").length,
    direct: all.filter(o => o.via === "agent-direct").length,
  };

  let rows = all;
  if (src === "storefront") rows = rows.filter(o => o.via !== "agent-direct");
  else if (src === "direct") rows = rows.filter(o => o.via === "agent-direct");
  if (filter === "failed") rows = rows.filter(o => o.status === "failed" || o.status === "refunded");
  // "Pending" groups every unsettled sale — the row's pill still shows which stage it's at.
  else if (filter === "processing") rows = rows.filter(o => isOpen(o.status));
  else if (filter !== "all") rows = rows.filter(o => o.status === filter);
  if (q.trim()) { const k = q.toLowerCase(); rows = rows.filter(o => String(o.customer).includes(k) || o.id.toLowerCase().includes(k) || (o.customerName || "").toLowerCase().includes(k) || o.pkg.toLowerCase().includes(k)); }

  const revenue = all.filter(o => o.status === "delivered").reduce((s, o) => s + o.price, 0);
  const earned = all.filter(o => o.status === "delivered").reduce((s, o) => s + o.commission, 0);
  const order = all.find(o => o.id === openId);

  return (
    <React.Fragment>
      <div className="grid g-4" style={{ marginBottom: 18 }}>
        {[["All orders", all.length, "receipt", "var(--blue)", "var(--blue-050)"],
          ["Revenue (delivered)", S.fmt(revenue), "trend", "var(--ok)", "var(--ok-bg)"],
          ["Commission earned", S.fmt(earned), "coins", "var(--teal-ink)", "var(--teal-050)"],
          ["Needs attention", counts.failed, "info", "var(--telecel)", "#FDE7E5"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div><div className="v" style={{ color: i ? col : "var(--ink)" }}>{v}</div></div>
        ))}
      </div>

      <div className="card pad-lg">
        <div className="card-h" style={{ flexWrap: "wrap", gap: 12 }}>
          <h3>All orders</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="field" style={{ margin: 0 }}><div className="control" style={{ height: 42 }}><I.search size={18} /><input placeholder="Search number, name or order" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} /></div></div>
            <div className="seg" style={{ margin: 0, width: "auto" }}>
              {[["all", "All sources"], ["storefront", "Storefront"], ["direct", "Direct"]].map(([f, lbl]) => (
                <button key={f} className={src === f ? "on" : ""} style={{ padding: "8px 13px" }} onClick={() => setSrc(f)}>{lbl} <span style={{ opacity: .65 }}>{srcCounts[f]}</span></button>
              ))}
            </div>
            <div className="seg" style={{ margin: 0, width: "auto" }}>
              {[["all", "All"], ["delivered", "Delivered"], ["processing", "Pending"], ["failed", "Issues"]].map(([f, lbl]) => (
                <button key={f} className={filter === f ? "on" : ""} style={{ padding: "8px 13px" }} onClick={() => setFilter(f)}>{lbl} <span style={{ opacity: .65 }}>{counts[f]}</span></button>
              ))}
            </div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Source</th><th>Paid</th><th>Commission</th><th>Status</th><th>When</th><th></th></tr></thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setOpenId(o.id)}>
                  <td><div className="netcell"><NetBadge net={o.net} /><div><div>{o.pkg}</div><div className="mono o-ref">{o.id}</div></div></div></td>
                  <td><div style={{ fontWeight: 600 }}>{o.customerName || "—"}</div><div className="mono">{o.customer}</div></td>
                  <td className="o-src">{sourceCell(o)}</td>
                  <td className="amt">{S.fmt(o.price)}</td>
                  <td className="amt amt-pos">{o.commission > 0 ? "+" + S.fmt(o.commission) : "—"}</td>
                  <td><Pill status={o.status}>{statusLabel(o.status)}</Pill></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(o.at)}</td>
                  <td><span className="muted" style={{ display: "inline-flex" }}><I.chev size={16} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <DataLoader label="Loading store orders…" />}
          {!loading && rows.length === 0 && <div className="empty"><div className="ic"><I.receipt size={28} /></div><p>No matching orders.</p></div>}
        </div>
      </div>

      {order && <OrderDetail order={order} onClose={() => setOpenId(null)} />}
    </React.Fragment>
  );
}

function OrderDetail({ order, onClose }) {
  const { S, retryStoreOrder, refundStoreOrder, toast } = useStore();
  // Pass the whole order — the timeline reads the real sentAt / processingAt / deliveredAt
  // instants off it rather than estimating them from `at`.
  const steps = S.orderTimeline(order);
  const isDirect = order.via === "agent-direct";
  const prov = S.NETWORKS[order.net];
  const subtitle = order.type
    ? order.type.charAt(0).toUpperCase() + order.type.slice(1)
    : (/airtime/i.test(order.pkg) ? "Airtime" : "Data bundle");
  const hasRef = order.momoRef && order.momoRef !== "—";

  // ---- Report a beneficiary problem, straight from the order ----
  // The agent is already looking at the number that failed, so this posts it in one tap
  // rather than sending them to the dashboard form to retype it. The report now carries the
  // order reference too, which the dashboard form can't supply.
  //
  // Offered on MTN DATA orders that haven't delivered: beneficiary lists are an MTN data
  // thing, and an order that already landed has nothing to report.
  const recipientDigits = String(order.customer || "").replace(/\D/g, "");
  const isAirtime = /airtime/i.test(order.pkg) || order.type === "airtime";
  const canReport =
    order.net === "mtn" && !isAirtime && order.status !== "delivered" && /^0\d{9}$/.test(recipientDigits);
  const [reporting, setReporting] = aoU(false);
  const [reported, setReported] = aoU(false);
  const reportBeneficiary = async () => {
    if (reporting || reported) return;
    setReporting(true);
    try {
      const r = await fetch("/api/failed-beneficiaries", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: recipientDigits, orderRef: order.id, net: order.net }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not send the number", "info"); setReporting(false); return; }
      setReported(true);
      toast("Number sent to Admin", "check");
    } catch (e) { toast("Could not send the number", "info"); }
    setReporting(false);
  };
  return (
    <Modal title={"Order " + order.id} onClose={onClose}>
      <div className="od-head">
        <NetBadge net={order.net} size={50} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 20 }}>{order.pkg}</div>
          <div className="muted" style={{ fontSize: 13.5 }}>{(prov ? prov.name : "") + " · " + subtitle}</div>
        </div>
        <Pill status={order.status}>{statusLabel(order.status)}</Pill>
      </div>

      <div className="od-timeline">
        {steps.map((s, i) => (
          <div className={"od-step" + (s.done ? " done" : "") + (s.active ? " active" : "") + (s.bad ? " bad" : "")} key={i}>
            <span className="dot">{s.done && !s.bad ? <I.check size={12} stroke="#fff" sw={3} /> : s.bad ? <I.x size={12} stroke="#fff" sw={3} /> : ""}</span>
            <div className="ln">
              <div className="lb">{s.label}</div>
              {s.at && <div className="tm">{S.timeOnly(s.at)} · {S.ago(s.at)}</div>}
              {s.active && <div className="tm">In progress…</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="od-rows">
        <div className="r"><span className="k">Recipient</span><span className="v mono">{order.customer}</span></div>
        <div className="r"><span className="k">Source</span><span className="v">{isDirect ? "Direct sale (you)" : order.via === "direct" ? "Your storefront" : order.via}</span></div>
        <div className="r"><span className="k">{isDirect ? "Paid from wallet" : "Paid by customer"}</span><span className="v">{S.fmt(order.price)} · {order.pay}</span></div>
        {hasRef && <div className="r"><span className="k">Payment ref</span><span className="v mono">{order.momoRef}</span></div>}
        <div className="r"><span className="k">Wholesale cost</span><span className="v">{S.fmt(order.cost)}</span></div>
        <div className="r"><span className="k">Your commission</span><span className="v" style={{ color: order.status === "refunded" ? "var(--muted)" : "var(--ok)" }}>{order.status === "refunded" ? "—" : "+" + S.fmt(order.commission)}</span></div>
        {order.override > 0 && <div className="r"><span className="k">Override to you</span><span className="v" style={{ color: "var(--blue-700)" }}>+{S.fmt(order.override)}</span></div>}
      </div>

      <div className="od-actions">
        {(order.status === "failed" && !isDirect) && <button className="btn btn-pri" style={{ flex: 1 }} onClick={() => { retryStoreOrder(order.id); onClose(); }}><I.refresh size={17} stroke="#fff" />Re-push order</button>}
        {(order.status === "failed" && !isDirect) && <button className="btn btn-out" style={{ flex: 1 }} onClick={() => { refundStoreOrder(order.id); onClose(); }}>Refund customer</button>}
        {(isInFlight(order.status) && !isDirect) && <button className="btn btn-out" style={{ flex: 1 }} onClick={() => { retryStoreOrder(order.id); onClose(); }}>Force deliver</button>}
        <button className={"btn " + (order.status === "delivered" || order.status === "refunded" ? "btn-pri" : "btn-ghost")} style={{ margin: "0 auto" }} onClick={() => window.open("https://wa.me/233" + String(order.customer || "").replace(/\D/g, "").replace(/^0/, ""), "_blank")}><I.whatsapp size={17} stroke={order.status === "delivered" || order.status === "refunded" ? "#fff" : "var(--blue)"} />Message customer</button>
      </div>

      {canReport && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <button
            className="btn btn-out btn-full"
            disabled={reporting || reported}
            style={{ opacity: reporting || reported ? .6 : 1, color: reported ? "var(--ok)" : "#B9791C" }}
            onClick={reportBeneficiary}
          >
            {reported
              ? <React.Fragment><I.checkc size={17} stroke="var(--ok)" />Sent to Admin</React.Fragment>
              : <React.Fragment><I.flag size={17} stroke="currentColor" />{reporting ? "Sending…" : "Report beneficiary problem"}</React.Fragment>}
          </button>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 7, textAlign: "center", lineHeight: 1.45 }}>
            {reported
              ? `${recipientDigits} is with our team — we'll add it to MTN's beneficiary list.`
              : `If MTN refused this order because ${recipientDigits} isn't on the beneficiary list, send it to us and we'll add it upstream.`}
          </div>
        </div>
      )}
    </Modal>
  );
}

export { OrderDetail, StoreOrdersPage, normalizeDirect, sourceCell };
