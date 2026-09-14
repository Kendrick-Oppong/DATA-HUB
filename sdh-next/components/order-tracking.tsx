"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Modal, NetBadge } from "@/components/ui";
import { isInFlight, isOpen } from "@/lib/orderStatus";

/* Smart Data Hub — live order tracking (storefront, customer-facing)
   DeliveryStatus: the live status card + timeline (matches the green "successful order" card)
   TrackOrderModal: look up an order by ID or phone and watch it deliver live */
const { useState: otU, useEffect: otE } = React;

function otElapsed(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function DeliveryStatus({ order, compact, title: titleProp }) {
  const { S } = useStore();
  const net = S.NETWORKS[order.net] || S.NETWORKS.mtn;
  const isData = /GB/.test(order.pkg);
  const delivered = order.status === "delivered";
  const failed = order.status === "failed";
  const refunded = order.status === "refunded";
  const unpaid = order.status === "pending";        // captured, payment not confirmed yet
  const waiting = order.status === "waiting";       // provider took it, hasn't started
  const pending = isOpen(order.status);             // unpaid, waiting OR actively processing

  // live ticking elapsed timer while pending
  const [, force] = otU(0);
  otE(() => {
    if (!pending) return;
    const t = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [pending]);

  // Every time shown here is a real server-recorded instant. A stage we have no timestamp
  // for shows no time at all — an invented "delivered 3 minutes later" would be a lie on a
  // page customers use to check exactly when their bundle landed.
  const placedAt = order.at;
  const sentAt = order.sentAt || null;             // handed to the provider
  const processingAt = order.processingAt || null; // provider reported it started sending
  const deliveredAt = delivered ? (order.deliveredAt || null) : null;
  const failedAt = order.failedAt || null;
  const refundedAt = order.refundedAt || null;
  const tookLabel = S.took(placedAt, deliveredAt);
  const elapsedSecs = Math.max(0, Math.floor((Date.now() - placedAt) / 1000));

  const steps = [
    // Nothing is confirmed until the payment is: an unpaid order shows this step still open.
    { lbl: unpaid ? "Waiting for your payment…" : "Payment received", at: unpaid ? null : placedAt, done: !unpaid, active: unpaid },
    // "Sent to <network>" is complete once the provider has moved past the queue — while the
    // order is still Waiting it has been accepted but not yet handed to the network.
    { lbl: "Sent to " + net.name, at: unpaid ? null : sentAt, done: !waiting && !unpaid },
  ];
  // The provider's own "started sending" milestone, shown once it has actually reported it.
  if (processingAt && !waiting && !unpaid) steps.push({ lbl: net.name + " started sending", at: processingAt, done: true });
  if (delivered) steps.push({ lbl: "Delivered to recipient", at: deliveredAt, done: true });
  else if (unpaid) steps.push({ lbl: "Delivery starts once payment clears", at: null, done: false });
  else if (waiting) steps.push({ lbl: "Waiting in queue…", at: null, active: true });
  else if (pending) steps.push({ lbl: "Delivering…", at: null, active: true });
  else if (failed) steps.push({ lbl: net.name + " rejected the request", at: failedAt, bad: true });
  else if (refunded) { steps.push({ lbl: "Delivery failed", at: failedAt, bad: true }); steps.push({ lbl: "Auto-refunded", at: refundedAt, done: true }); }

  const variant = delivered ? "ok" : pending ? "pending" : "bad";
  const title = titleProp || (delivered ? "Order delivered successfully" : unpaid ? "Waiting for your payment" : waiting ? "Your order is in the queue" : pending ? "Delivering your order" : refunded ? "Refunded — delivery failed" : "Delivery needs a retry");

  return (
    <div className="trk">
      <div className={"trk-card " + variant}>
        <div className="th">
          {delivered ? <I.check size={18} stroke="#34C172" sw={2.6} /> : pending ? <span className="trk-spin"></span> : <I.info size={18} stroke="var(--telecel)" />}
          {title}
        </div>
        {!compact && (
          <div className="trk-sum">
            <NetBadge net={order.net} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pk">{order.pkg}</div>
              <div className="to">to <strong>{order.customer}</strong></div>
            </div>
            <div className="mono trk-id">{order.id}</div>
          </div>
        )}
        <div className="trk-times">
          Placed at <strong>{S.stamp(placedAt)}</strong>
          {deliveredAt && <React.Fragment>, delivered at <strong>{S.stamp(deliveredAt)}</strong></React.Fragment>}
        </div>
        {delivered && tookLabel && <div className="trk-took">Took {tookLabel}</div>}
        {pending && <div className="trk-took">Elapsed {otElapsed(elapsedSecs)} · usually delivers in under a minute</div>}
        {pending && <div className="trk-prog"><span></span></div>}
        {!failed && !refunded && <div className="trk-eta"><I.clock size={13} stroke="#F59E0B" />Est. delivery: Less than 10 mins</div>}
      </div>

      {!compact && (
      <div className="trk-steps">
        {steps.map((s, i) => (
          <div key={i} className={"trk-step" + (s.done ? " done" : "") + (s.active ? " active" : "") + (s.bad ? " bad" : "")}>
            <span className="dot">
              {s.done ? <I.check size={14} stroke="#fff" sw={3} /> : s.bad ? <I.x size={14} stroke="#fff" sw={3} /> : s.active ? <span className="ad"></span> : null}
            </span>
            <div><div className="lbl">{s.lbl}</div><div className="tm">{s.at ? S.timeOnly(s.at) : s.active ? "in progress…" : "—"}</div></div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

function TrackOrderModal({ store, onClose, initialId }) {
  const { S, storeOrders, trackStoreOrder } = useStore();
  const [q, setQ] = otU(initialId || "");
  const [order, setOrder] = otU(null);
  const [err, setErr] = otU("");
  const [loading, setLoading] = otU(false);

  const lookup = async (raw) => {
    const v = (raw || "").trim();
    if (!v) { setErr("Enter your order number or phone."); setOrder(null); return; }
    setErr(""); setLoading(true);
    // What did they type? A Ghanaian number is 9–12 digits and almost all digits; an order
    // number carries letters and is short. Deciding here means one box serves both, and the
    // phone case now reaches the BACKEND — it used to search only the local list, which is
    // the agent's own sales and is empty for the guest who actually needs this.
    const digits = v.replace(/\D/g, "");
    const looksLikePhone = digits.length >= 9 && digits.length / v.replace(/\s/g, "").length > 0.8;
    try {
      const o = await trackStoreOrder(v, store && store.handle, looksLikePhone ? "phone" : "ref");
      if (o) { setOrder(o); setLoading(false); return; }
    } catch (e) { /* fall through: try it the other way, then the local list */ }
    // Ambiguous input (a short all-digit order number, say) — try the other lookup before
    // telling the customer we have nothing.
    try {
      const o = await trackStoreOrder(v, store && store.handle, looksLikePhone ? "ref" : "phone");
      if (o) { setOrder(o); setLoading(false); return; }
    } catch (e) { /* fall through to local search */ }
    const lv = v.toLowerCase();
    let o = (storeOrders || []).find(x => x.id.toLowerCase() === lv || x.id.toLowerCase().replace(/[^a-z0-9]/g, "").endsWith(lv.replace(/[^a-z0-9]/g, "")));
    if (!o && digits.length >= 6) {
      const matches = (storeOrders || []).filter(x => (x.customer || "").replace(/\D/g, "").includes(digits));
      o = matches.sort((a, b) => b.at - a.at)[0];
    }
    setLoading(false);
    if (o) { setOrder(o); setErr(""); } else { setOrder(null); setErr("No order found. Check the number and try again."); }
  };

  // auto-search a passed-in id once
  otE(() => { if (initialId) lookup(initialId); }, []);

  // live: poll the backend for a real (SO-…) order that's still processing.
  otE(() => {
    if (!order || !isInFlight(order.status) || !/^SO-/.test(order.id || "")) return;
    const t = setInterval(async () => {
      try { const o = await trackStoreOrder(order.id, store && store.handle); if (o) setOrder(o); } catch (e) {}
    }, 5000);
    return () => clearInterval(t);
  }, [order && order.id, order && order.status]);

  return (
    <Modal title="Track your order" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6 }}>Enter your order number or the phone number you bought for to see live delivery status.</p>
      <div className="trk-find">
        <input placeholder="Order no. (SO-…) or phone number" value={q} onChange={(e) => { setQ(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") lookup(q); }} />
        <button className="btn" style={{ background: store.theme, color: "#fff", padding: "11px 18px" }} onClick={() => lookup(q)} disabled={loading}>{loading ? "…" : "Track"}</button>
      </div>
      {err && <div className="trk-err">{err}</div>}
      {order && <div style={{ marginTop: 16 }}><DeliveryStatus order={order} /></div>}
      {!order && !err && (
        <div className="empty" style={{ padding: "26px 10px" }}><div className="ic"><I.search size={24} /></div><p style={{ fontSize: 13.5 }}>Your order number is on your receipt and the confirmation we sent you. No receipt? Enter the phone number you bought for instead.</p></div>
      )}
    </Modal>
  );
}

function StoreWhatsNewModal({ store, onClose }) {
  const { S } = useStore();
  const tagClass = (t) => t === "New" ? "cwn-new" : t === "Improved" ? "cwn-imp" : "cwn-fix";
  return (
    <Modal title="What’s new" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6, marginBottom: 16 }}>The latest improvements to your shopping experience.</p>
      <div className="cwn-list">
        {S.customerChangelog.map((c, i) => (
          <div className="cwn-item" key={i}>
            <div className="cwn-top"><span className={"cwn-tag " + tagClass(c.tag)}>{c.tag}</span><span className="cwn-date">{c.date}</span></div>
            <div className="cwn-title">{c.title}</div>
            <p className="cwn-body">{c.body}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function StoreHowToModal({ store, onClose }) {
  const D = window.HTDiagrams || {};
  const guides = [
    { id: "buy", icon: "signal", diagram: "buy", title: "Buy data or airtime", sub: "Sent to any number in seconds",
      steps: ["Pick a network — MTN, Telecel or AT (choose iShare for instant data or BigTime for data that never expires).",
        "Tap a bundle, enter the recipient's phone number and double-check it.",
        "Pay with mobile money — your bundle is delivered automatically, usually in under a minute."] },
    { id: "pay", icon: "wallet", diagram: "wallet", title: "Pay with mobile money", sub: "MTN MoMo, Telecel Cash or AT Money",
      steps: ["At checkout, choose the mobile-money network you're paying from.",
        "Enter your number and approve the prompt on your phone.",
        "Once payment is confirmed your order is sent right away — no account needed."] },
    { id: "promo", icon: "tag", diagram: "buy", title: "Use a discount code", sub: "Save on your order",
      steps: ["Got a promo code from this store? Start your purchase as normal.",
        "Enter the code in the discount box at checkout.",
        "The saving is applied instantly before you pay."] },
    { id: "track", icon: "search", diagram: "track", title: "Track your order", sub: "Follow it from paid to delivered",
      steps: ["Tap “Track order” at the top of the store.",
        "Enter your order number or the phone you bought for.",
        "Watch the live status — and if anything fails to deliver, you're automatically refunded."] },
  ];
  const [open, setOpen] = otU("buy");
  return (
    <Modal title="How to buy" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6, marginBottom: 16 }}>Quick guides to buying, paying and tracking — tap one to expand.</p>
      <div className="ht-list">
        {guides.map(g => {
          const isOpen = open === g.id;
          const Diagram = D[g.diagram];
          return (
            <div className={"ht-guide" + (isOpen ? " open" : "")} key={g.id}>
              <button className="ht-head" onClick={() => setOpen(isOpen ? null : g.id)}>
                <span className="ht-ic" style={{ background: "color-mix(in srgb, " + store.theme + " 16%, transparent)", color: store.theme }}><Ic name={g.icon} size={20} /></span>
                <span className="ht-meta"><span className="ht-title">{g.title}</span><span className="ht-sub">{g.sub}</span></span>
                <span className="ht-chev"><I.chev size={18} stroke="currentColor" /></span>
              </button>
              {isOpen && (
                <div className="ht-body">
                  {Diagram && <div className="ht-diagram" style={{ "--st": store.theme }}><Diagram /></div>}
                  <ol className="ht-steps">
                    {g.steps.map((s, i) => <li key={i}><span className="ht-num" style={{ background: "color-mix(in srgb, " + store.theme + " 16%, transparent)", color: store.theme }}>{i + 1}</span><span>{s}</span></li>)}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export { DeliveryStatus, StoreHowToModal, StoreWhatsNewModal, TrackOrderModal, otElapsed };
