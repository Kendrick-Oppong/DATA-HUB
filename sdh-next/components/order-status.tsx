"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I } from "@/components/icons";
import { useStore } from "@/components/store";
import { Modal, NetBadge, Select } from "@/components/ui";
import { isOpen } from "@/lib/orderStatus";

/* Smart Data Hub — Order Status & Report Issue modal (customer + agent)
   Simulates a telco/aggregator balance-enquiry API + delivery status + complaint filing.
   NOTE: balance figures here are MOCKED. In production each field maps to an
   aggregator balance-enquiry endpoint response (see comments below). */
const { useState: osU, useEffect: osE } = React;

// deterministic pseudo-random from a string so a given order always shows the same balance
function seedFrom(str) {
  let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
}

function OrderStatusModal({ order, onClose }) {
  const { S, addComplaint, toast } = useStore();
  const [mode, setMode] = osU("status");      // status | report
  const [checking, setChecking] = osU(true);
  const [cat, setCat] = osU("Not delivered");
  const [msg, setMsg] = osU("");

  const net = order.net;
  const prov = S.NETWORKS[net] || {};
  const phone = order.recipient || order.customer || "—";
  const isData = order.type === "data" || /\dGB/.test(order.pkg);
  const isAirtime = order.type === "airtime" || /airtime/i.test(order.pkg);
  const canCheckBalance = ["mtn", "telecel", "atigo"].includes(net) && (isData || isAirtime);
  const ref = order.momoRef && order.momoRef !== "—" ? order.momoRef : ("RORD_" + (1781000000 + Math.floor(seedFrom(order.id)() * 9999999)));
  const paid = order.price != null ? order.price : order.cost;

  // simulate the aggregator balance-enquiry API call
  osE(() => {
    if (!canCheckBalance) { setChecking(false); return; }
    setChecking(true);
    const t = setTimeout(() => setChecking(false), 1100);
    return () => clearTimeout(t);
  }, [order.id]);

  // ---- MOCKED balance (prod: GET {aggregator}/balance?msisdn=… ) ----
  const rnd = seedFrom(order.id + "bal");
  const gbMatch = order.pkg.match(/(\d+)\s*GB/i);
  const baseGb = gbMatch ? +gbMatch[1] : 0;
  const usedMb = Math.floor(rnd() * 1024);                 // a little consumed
  const dataBal = `${baseGb} GB & ${(1024 - usedMb).toFixed(0)} MB`;
  const mainAcct = +(rnd() * 3).toFixed(2);
  // Expiry is derived from the bundle's REAL validity, counted from when it was actually
  // delivered (not when it was ordered). A no-expiry bundle never shows a date.
  const daysMatch = order.pkg && order.pkg.match(/(\d+)\s*day/i);
  const noExpiry = !!(order.pkg && /no expiry|never expires|bigtime/i.test(order.pkg));
  const validFrom = order.deliveredAt || order.at;
  const exp = noExpiry ? "No expiry"
    : daysMatch ? S.dateOnly(validFrom + (+daysMatch[1]) * S.DAY_MS)
    : null;

  const delivered = order.status === "delivered";
  const failed = order.status === "failed" || order.status === "refunded";
  // Anything not yet settled — awaiting payment, waiting or processing. Must NOT fall through
  // to the "delivered" branch below, which would tell the customer it arrived.
  const processing = isOpen(order.status);

  const submit = () => {
    addComplaint({ subject: cat + " · " + order.pkg, ref: order.id, category: "Delivery", message: msg.trim() });
    onClose();
  };

  return (
    <Modal title={<span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><I.flag size={20} stroke="var(--accent, #C97A00)" />Report Order Issue</span>} onClose={onClose}>
      <div className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 14, fontWeight: 600 }}>Order {order.id}</div>

      {mode === "status" && (
        <React.Fragment>
          {/* order details */}
          <div className="os-card">
            <div className="os-head"><I.info size={18} stroke="var(--blue)" />Order Details</div>
            <div className="os-grid">
              <div><span className="k">Placed</span><span className="v">{S.stamp(order.at)}</span></div>
              {/* The three provider milestones, each shown only when the server actually
                  recorded it — an order that never reached a stage shows no row for it. */}
              {order.sentAt && <div><span className="k">Sent to provider</span><span className="v">{S.stamp(order.sentAt)}</span></div>}
              {order.processingAt && <div><span className="k">Sending started</span><span className="v">{S.stamp(order.processingAt)}</span></div>}
              {order.deliveredAt && <div><span className="k">Delivered</span><span className="v">{S.stamp(order.deliveredAt)}{S.took(order.at, order.deliveredAt) ? ` · took ${S.took(order.at, order.deliveredAt)}` : ""}</span></div>}
              {!order.deliveredAt && order.failedAt && <div><span className="k">Failed</span><span className="v">{S.stamp(order.failedAt)}</span></div>}
              {order.refundedAt && <div><span className="k">Refunded</span><span className="v">{S.stamp(order.refundedAt)}</span></div>}
              <div><span className="k">Phone</span><span className="v">{phone}</span></div>
              <div><span className="k">Item</span><span className="v">{order.pkg}</span></div>
              <div><span className="k">Network</span><span className="v" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><NetBadge net={net} size={22} />{prov.name}</span></div>
              <div><span className="k">Source</span><span className="v" style={{ color: order.via === "agent-direct" ? "var(--blue-700)" : order.via && order.via !== "direct" ? "var(--blue-700)" : "var(--ink)" }}>{order.via === "agent-direct" ? "Direct sale" : order.via && order.via !== "direct" ? order.via : order.via === "direct" ? "Storefront" : "Direct"}</span></div>
              <div><span className="k">Payment Ref</span><span className="v mono">{ref}</span></div>
            </div>
          </div>

          {/* live balance check */}
          {canCheckBalance && (
            <div className="os-card">
              <div className="os-head" style={{ justifyContent: "space-between" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><I.checkc size={18} stroke="var(--ok)" />Current {prov.name} Balance</span>
                {!checking && <button className="os-refresh" onClick={() => { setChecking(true); setTimeout(() => setChecking(false), 1000); }}><I.refresh size={14} />Re-check</button>}
              </div>
              {checking ? (
                <div className="os-checking"><span className="spin-sm"></span>Querying {prov.name} via secure API…</div>
              ) : (
                <div className="os-bal">
                  {isData && <div className="b"><span className="bl">Current data balance</span><span className="bv">{dataBal}</span>{exp && <span className="be">{exp === "No expiry" ? exp : "Exp: " + exp}</span>}</div>}
                  <div className="b"><span className="bl">Main account</span><span className="bv">{S.fmt(mainAcct)}</span><span className="be">Airtime</span></div>
                </div>
              )}
            </div>
          )}

          {/* status note */}
          <div className={"os-note " + (failed ? "bad" : processing ? "warn" : "ok")}>
            <I.info size={18} />
            <div>
              <strong>{delivered ? "This purchase was successfully delivered" : processing ? "This purchase is still processing" : "This purchase failed during processing"}</strong>
              <p>{delivered
                ? `Our records show this ${prov.name || "order"} purchase was delivered successfully. Complaints can only be filed for purchases that failed during processing.`
                : processing
                ? "Delivery is being confirmed with the provider. This usually completes within a few minutes — please check again shortly before reporting."
                : "This order failed and was auto-refunded. If the value did not reach the recipient, you can report it below for manual review."}</p>
              {delivered && <p className="tip">TIP: Always use the official {prov.name} app to check your balance and data usage.</p>}
            </div>
          </div>

          <div className="od-actions">
            {failed && <button className="btn btn-pri" style={{ flex: 1 }} onClick={() => setMode("report")}><I.flag size={17} stroke="#fff" />Report an issue</button>}
            <button className="btn btn-out" style={{ flex: !failed ? 1 : "0 0 auto" }} onClick={onClose}>Close</button>
          </div>
        </React.Fragment>
      )}

      {mode === "report" && (
        <React.Fragment>
          <button className="iconbtn" style={{ marginBottom: 14 }} onClick={() => setMode("status")}><I.back size={20} /></button>
          <div className="os-card" style={{ marginTop: 0 }}>
            <div className="os-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div><span className="k">Order</span><span className="v mono">{order.id}</span></div>
              <div><span className="k">Item</span><span className="v">{order.pkg}</span></div>
              <div><span className="k">Phone</span><span className="v">{phone}</span></div>
              <div><span className="k">Paid</span><span className="v">{S.fmt(paid)}</span></div>
            </div>
          </div>
          <Select label="What went wrong?" value={cat} onChange={setCat} options={["Not delivered", "Wrong amount delivered", "Sent to wrong number", "Delivered but not received", "Charged twice", "Other"]} />
          <div className="field"><label>Details</label><div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}><textarea rows={4} placeholder="Tell us exactly what happened so we can resolve it fast…" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea></div></div>
          <div className="os-note ok" style={{ marginTop: 4 }}><I.shield size={18} /><div><strong>How this is handled</strong><p>Our team checks the provider's batch logs against your payment reference. Verified failures are refunded to your wallet — usually within a few hours.</p></div></div>
          <button className="btn btn-pri btn-full" disabled={!msg.trim()} style={{ opacity: msg.trim() ? 1 : .5 }} onClick={submit}><I.send size={18} stroke="#fff" />Submit complaint</button>
        </React.Fragment>
      )}
    </Modal>
  );
}

export { OrderStatusModal, seedFrom };
