"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I } from "@/components/icons";
import { useStore } from "@/components/store";
import { Field, Modal, NetBadge } from "@/components/ui";
import { isInFlight, statusLabel } from "@/lib/orderStatus";

/* Smart Data Hub — shared buy flow (data + airtime), wallet-paid, live delivery */
const { useState: bU } = React;

function Notice({ tone = "warn", title, children }) {
  const tones = {
    danger: { bg: "#FDE7E5", bd: "rgba(226,35,26,.25)", col: "var(--telecel)" },
    warn:   { bg: "#FFF4E0", bd: "rgba(185,121,28,.30)", col: "#B9791C" },
    info:   { bg: "var(--blue-050)", bd: "var(--blue-100)", col: "var(--blue-700)" },
  };
  const t = tones[tone] || tones.warn;
  return (
    <div className={"notice notice-" + tone} style={{ background: t.bg, border: "1px solid " + t.bd, borderRadius: 14, padding: "13px 15px", display: "flex", gap: 11, alignItems: "flex-start" }}>
      <span style={{ color: t.col, flexShrink: 0, marginTop: 1 }}><I.info size={19} /></span>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <strong style={{ color: t.col, display: "block", marginBottom: 3, fontSize: 13.5 }}>{title}</strong>
        <span className="muted">{children}</span>
      </div>
    </div>
  );
}

function BuyFlow({ type }) {
  const { S, role, balance, buyData, buyAirtime, payOrderMomo, fetchOrderStatus, toast, goApp, user, bundlesFor, tierInfo } = useStore();
  const isReseller = role === "reseller";
  const isData = type === "data";

  const [net, setNet] = bU("mtn");
  // The product LINE within the chosen network. MTN and AT each sell two; Telecel sells one,
  // so the picker only appears for the networks that have lines. Kept per-network so
  // switching MTN → AT → MTN doesn't lose the line you'd picked.
  const [atType, setAtType] = bU("ishare");     // AT: ishare | bigtime
  const [mtnType, setMtnType] = bU("standard"); // MTN: standard | xpress
  const [bundleId, setBundleId] = bU(null);
  const [airAmt, setAirAmt] = bU(0);
  const [recipient, setRecipient] = bU("");
  const [payVia, setPayVia] = bU("wallet");  // wallet | momo
  const [result, setResult] = bU("idle");   // idle | processing | done
  // Set when the server refuses the order because the recipient is an MTN number that is not
  // on the beneficiary list yet. Rendered as a blocking caution rather than a toast: the
  // buyer has to change the number, so it must not be dismissible by looking away.
  const [benBlock, setBenBlock] = bU(null);
  const [lastOrder, setLastOrder] = bU(null);

  const tierName = tierInfo?.name || "";
  const isAT = net === "atigo";
  const isMTN = net === "mtn";
  // Which line list to show, and which line is selected in it.
  const lines = S.PRODUCTS_BY_NET[net] || null;
  const variant = isAT ? atType : isMTN ? mtnType : undefined;
  const setVariant = isAT ? setAtType : setMtnType;
  const bundles = bundlesFor(net, variant);
  const bundle = bundles.find(b => b.id === bundleId);
  const validity = (b) => S.validityOf(b);

  // pricing
  //
  // `commission` is the agent's OWN margin (retail − wholesale) — still used for the order
  // record, but no longer shown as what they earn from us. The platform's tier bonus comes
  // from the server on each bundle (`tierBonus`), worked out on OUR margin, so an agent
  // pricing higher never changes it. See the 31 Jul 2026 tier bonus correction.
  //
  // `cost` — the amount actually charged — comes from the server on the bundle, NOT from
  // `isReseller` here. The client's role and the session cookie the charge is priced from
  // are two different sources and could disagree, which is how the buy screen ended up
  // quoting one price while Paystack took another.
  let retail = 0, cost = 0, commission = 0, tierBonus = 0, pkgLabel = "";
  let priceReady = false;
  if (isData && bundle) {
    retail = bundle.price;
    cost = Number(bundle.cost ?? 0);
    commission = isReseller ? +(retail - bundle.reseller).toFixed(2) : 0;
    tierBonus = isReseller ? +(bundle.tierBonus || 0) : 0;
    pkgLabel = S.pkgOf(bundle, net, variant);
    // Only a bundle carrying live published pricing may be charged for. Without it the
    // catalog's placeholder numbers would be shown and a different amount taken.
    priceReady = !!bundle.live && cost > 0;
  } else if (!isData && airAmt) {
    // Mirrors priceAirtime() on the server: airtime is FACE VALUE for everyone. There's no
    // agent discount and no commission — Muviin settles ours separately — so an agent pays
    // exactly what a customer pays. Face value needs no published pricing to be trusted.
    retail = airAmt;
    cost = airAmt;
    commission = 0;
    pkgLabel = `${S.fmt(airAmt)} airtime`;
    priceReady = true;
  }

  const recipientOk = recipient.replace(/\D/g, "").length >= 9;
  const canPay = cost > 0 && recipientOk && priceReady;

  // Follow an in-flight order in the background and update the confirmation card in place.
  // The buyer is already looking at their receipt, so this costs them nothing — it just
  // flips "Processing" to "Delivered" if it lands while they're still on the screen.
  //
  // Every poll makes the server ask the provider, so it backs off instead of hammering at a
  // fixed interval, and the token guard stops it writing to a screen the buyer has left.
  const pollRef = React.useRef(0);
  React.useEffect(() => () => { pollRef.current++; }, []);
  const settle = async (id) => {
    const token = ++pollRef.current;
    const deadline = Date.now() + 120000;
    let wait = 2000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, wait));
      if (pollRef.current !== token) return;
      let o;
      try { o = await fetchOrderStatus(id); } catch (e) { return; }
      if (pollRef.current !== token) return;
      setLastOrder(o);
      // Keep polling through BOTH in-flight stages (waiting → processing); stop only once
      // the order has actually settled.
      if (!isInFlight(o.status)) {
        if (o.status === "failed") toast("Delivery failed — you've been refunded", "refresh");
        return;
      }
      wait = Math.min(Math.round(wait * 1.5), 10000);
    }
  };

  const pay = async () => {
    if (cost <= 0) return;
    if (!priceReady) { toast("Still loading today's prices — one moment", "info"); return; }
    if (!recipientOk) { toast("Enter the recipient's number to continue", "phone"); return; }

    // A signed-in user with a chosen product buys for real — data through DataHub, airtime
    // through Muviin. Both are priced and fulfilled server-side.
    const isReal = !!user?.id && (isData ? !!bundle : airAmt > 0);

    // Pay with mobile money — direct, no wallet needed.
    if (payVia === "momo") {
      if (isReal) {
        setResult("processing");
        try {
          await payOrderMomo(isData
            ? { type: "data", net, atProduct: bundle.atProduct, capacityGb: bundle.gb, recipient, expectedCost: cost }
            : { type: "airtime", net, amount: airAmt, recipient, expectedCost: cost });
          return; // redirecting to Paystack
        } catch (e) {
          setResult("idle");
          if (e.beneficiaryBlock) setBenBlock(e.beneficiaryBlock);
          else toast(e.message || "Could not start payment", "info");
        }
        return;
      }
      // Not signed in — nothing to charge against.
      toast("Please sign in to buy.", "info");
      return;
    }

    // Pay from wallet balance.
    if (balance < cost) { toast("Insufficient wallet balance — fund your wallet", "wallet"); return; }

    if (isReal) {
      setResult("processing");
      try {
        const order = isData
          ? await buyData({ net, atProduct: bundle.atProduct, capacityGb: bundle.gb, pkg: pkgLabel, recipient, cost, commission })
          : await buyAirtime({ net, amount: airAmt, recipient });
        // Show the receipt the moment the order exists. The money has moved and the provider
        // has accepted it, so there's nothing left for the buyer to wait on — the card
        // renders its own "Processing" state and settle() updates it in place. This used to
        // block on up to 12 polls before showing anything, which is where the minute went.
        setLastOrder(order);
        setResult("done");
        if (isInFlight(order.status)) settle(order.id);
      } catch (e) {
        setResult("idle");
        if (e.beneficiaryBlock) setBenBlock(e.beneficiaryBlock);
        else toast(e.message || "Could not place the order", "info");
      }
      return;
    }

    toast("Please sign in to buy.", "info");
  };

  // Bumping the token drops any background poll from the previous order.
  const reset = () => { pollRef.current++; setResult("idle"); setBundleId(null); setAirAmt(0); setRecipient(""); };

  if (result === "processing") {
    return <div className="card pad-lg"><div className="flow-result"><div className="spin"></div><h2>Delivering to {recipient}…</h2><p>Sending {pkgLabel} on {S.NETWORKS[net].name} via the upstream provider. This usually takes a few seconds.</p></div></div>;
  }
  if (result === "done") {
    const delivered = lastOrder?.status === "delivered";
    // A background poll can land a failure while this card is open, so it renders that too
    // rather than only the happy and in-flight cases. The refund is already done server-side.
    const failed = lastOrder?.status === "failed";
    return (
      <div className="card pad-lg" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="flow-result">
          {delivered
            ? <div className="ok-ring"><I.check size={42} stroke="var(--ok)" sw={2.4} /></div>
            : failed
              ? <div className="ok-ring" style={{ background: "#FDE7E5", borderColor: "rgba(226,35,26,.25)" }}><I.x size={40} stroke="var(--telecel)" sw={2.4} /></div>
              : <div className="ok-ring" style={{ background: "var(--blue-050)", borderColor: "var(--blue-100)" }}><I.clock size={40} stroke="var(--blue)" sw={2.2} /></div>}
          <h2>{delivered ? "Delivered!" : failed ? "Not delivered" : "Order placed"}</h2>
          <p>
            {delivered
              ? <React.Fragment>{pkgLabel} sent to <strong>{recipient}</strong> on {S.NETWORKS[net].name}.</React.Fragment>
              : failed
                ? <React.Fragment>{pkgLabel} could not be delivered to <strong>{recipient}</strong> on {S.NETWORKS[net].name}. You've been refunded in full — your wallet balance is back to normal and you can try again.</React.Fragment>
                : <React.Fragment>{pkgLabel} to <strong>{recipient}</strong> on {S.NETWORKS[net].name} is processing — it usually arrives within a few minutes. We'll text the recipient once it's delivered, and you can track it in Orders.</React.Fragment>}
          </p>
          <div className="card" style={{ textAlign: "left", marginTop: 22, background: "var(--bg)" }}>
            <div className="summary">
              <div className="row"><span className="k">Order</span><span className="v mono" style={{ fontFamily: "ui-monospace,monospace" }}>{lastOrder.id}</span></div>
              <div className="row"><span className="k">Status</span><span className="v" style={{ color: delivered ? "var(--ok)" : failed ? "var(--telecel)" : "var(--blue)", fontWeight: 700 }}>{delivered ? "Delivered" : failed ? "Refunded" : statusLabel(lastOrder.status)}</span></div>
              <div className="row"><span className="k">{payVia === "momo" ? "Paid with mobile money" : "Paid from wallet"}</span><span className="v">{S.fmt(cost)}</span></div>
              {commission > 0 && <div className="row"><span className="k">Commission earned</span><span className="v" style={{ color: "var(--ok)" }}>+{S.fmt(commission)}</span></div>}
              <div className="row" style={{ borderBottom: "none" }}><span className="k">New wallet balance</span><span className="v">{S.fmt(balance)}</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <button className="btn btn-pri" style={{ flex: 1 }} onClick={reset}>Buy another</button>
            <button className="btn btn-out" style={{ flex: 1 }} onClick={() => goApp("orders")}>View orders</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="card">
          <div className="card-h"><h3>1 · Choose network</h3></div>
          <div className="net-pick">
            {["mtn", "telecel", "atigo"].map(n => (
              <button key={n} className={"np" + (net === n ? " on" : "")} onClick={() => { setNet(n); setBundleId(null); }}>
                <NetBadge net={n} size={52} /><div className="nm">{S.NETWORKS[n].name}</div>
              </button>
            ))}
          </div>
        </div>

        <Notice tone="warn" title="Airtime / Credit Debt Notice">If you have unpaid credit or airtime debts, please settle them before placing new orders. Data cannot be delivered to numbers with outstanding balances.</Notice>

        <div className="card">
          <div className="card-h"><h3>2 · {isData ? "Pick a bundle" : "Choose amount"}</h3>{isReseller && <span className="pill approved">Agent pricing</span>}</div>
          {isData && lines && (
            <React.Fragment>
              <div className="seg" style={{ marginTop: 0, marginBottom: 4 }}>
                {Object.values(lines).map(p => (
                  <button key={p.id} className={variant === p.id ? "on" : ""} onClick={() => { setVariant(p.id); setBundleId(null); }}>{p.name}</button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 14px", lineHeight: 1.45 }}>{(lines[variant] || {}).blurb}</p>
            </React.Fragment>
          )}
          {isData ? (
            <div className="bundle-list">
              {bundles.map(b => (
                <button key={b.id} className={"bundle" + (bundleId === b.id ? " on" : "")} onClick={() => setBundleId(b.id)}>
                  {b.tag && <span className="tag">{b.tag}</span>}
                  <div><div className="gb">{b.gb}GB</div><div className="vd">{validity(b)}</div></div>
                  <div style={{ textAlign: "right" }}>
                    {/* Server-resolved charge for this account — same figure the summary
                        and the payment use, so the list can't quote a different price. */}
                    <div className="pr">{S.fmt(b.cost ?? (isReseller ? b.reseller : b.price))}</div>
                    {/* The tier bonus, not the agent's own margin (31 Jul 2026 §4). What they
                        charge their customer is theirs and needs no line here. */}
                    {isReseller && b.tierBonus > 0 && <div className="rs">+{S.fmt(b.tierBonus)} tier bonus</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <React.Fragment>
              <div className="amount-picks">
                {S.AIRTIME_PICKS.map(p => <button key={p} className={"ap" + (airAmt === p ? " on" : "")} onClick={() => setAirAmt(p)}>GH₵{p}</button>)}
              </div>
              <Field label="Or enter amount" pre="GH₵" inputMode="numeric" value={airAmt || ""} onChange={(e) => setAirAmt(Math.max(0, +e.target.value.replace(/\D/g, "") || 0))} placeholder="0" />
            </React.Fragment>
          )}
        </div>

        <Notice tone="danger" title="Verify before you pay">Orders to the wrong number or network can't be refunded. Double-check the phone number and network before paying.</Notice>

        <div className="card">
          <div className="card-h"><h3>3 · Recipient number</h3></div>
          <Field icon="phone" pre="+233" inputMode="tel" placeholder="24 000 0000" value={recipient} onChange={(e) => setRecipient(e.target.value)} hint={recipient && !recipientOk ? "Enter a valid Ghanaian number" : null} error={recipient && !recipientOk} />
          <button className="btn btn-ghost" style={{ marginTop: 12, padding: "10px 18px", fontSize: 14 }} onClick={() => setRecipient((user?.phone || "0240 021 899").replace(/^0/, ""))}><I.user size={17} />Buy for my own number</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Notice tone="info" title="Not delivered? Report within 24 hours">Report any order not received within 24 hours of purchase, otherwise we can't help. Contact support to join our WhatsApp Channel for live updates.</Notice>
        <BuySummary {...{ net, isData, pkgLabel, cost, retail, commission, tierBonus, tierName, isReseller, recipient, recipientOk, canPay, priceReady, balance, payVia, setPayVia, pay }} />
      </div>

      {/* MTN refused this number before and it hasn't been added upstream yet. Nothing was
          charged — the server stops ahead of the wallet debit / Paystack handoff. */}
      {benBlock && (
        <Modal
          title={benBlock.title}
          onClose={() => setBenBlock(null)}
          wide={false}
          foot={<div className="mfoot"><button className="btn btn-ghost" onClick={() => setBenBlock(null)}>Close</button></div>}
        >
          <Notice tone="warn" title={`${benBlock.phone} is not a verified number`}>
            {benBlock.body.map((line, i) => (
              <span key={i} style={{ display: "block", marginTop: i ? 8 : 0 }}>{line}</span>
            ))}
          </Notice>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, margin: "12px 0 0" }}>
            You have not been charged. Try a different number, or place this order again once the
            number has been verified.
          </p>
        </Modal>
      )}
    </div>
  );
}

function BuySummary({ net, isData, pkgLabel, cost, retail, commission, tierBonus, tierName, isReseller, recipient, canPay, priceReady, balance, payVia, setPayVia, pay }) {
  const { S } = useStore();
  const low = payVia === "wallet" && cost > 0 && balance < cost;
  // Enabled once a bundle is chosen. Wallet is blocked only when it's short of funds;
  // mobile money never needs a balance. Recipient is validated on click (with a toast)
  // so the button is never a dead end. `priceReady` is false while today's published
  // prices are still loading — charging then would take an amount this screen never showed.
  const payDisabled = cost <= 0 || low || !priceReady;
  return (
    <div className="card pad-lg summary">
      <div className="card-h"><h3>Order summary</h3></div>
      {pkgLabel ? (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <NetBadge net={net} size={44} />
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 18 }}>{pkgLabel}</div><div className="muted" style={{ fontSize: 13 }}>{S.NETWORKS[net].name}{recipient ? " · " + recipient : ""}</div></div>
          </div>
          <div className="summary">
            {isReseller && isData && <div className="row"><span className="k">Retail price</span><span className="v" style={{ textDecoration: "line-through", color: "var(--faint)" }}>{S.fmt(retail)}</span></div>}
            <div className="row"><span className="k">{isReseller ? "Your wholesale cost" : "Price"}</span><span className="v">{S.fmt(cost)}</span></div>
            {/* §4: show the TIER BONUS, not the agent's own margin. What they charge their
                customer is entirely theirs and needs no line here; this is the amount the
                platform adds on top, worked out on our margin. */}
            {isReseller && tierBonus > 0 && <div className="row"><span className="k">Tier bonus{tierName ? " · " + tierName : ""}</span><span className="v" style={{ color: "var(--ok)" }}>+{S.fmt(tierBonus)}</span></div>}
          </div>
          <div className="total"><span className="muted" style={{ fontWeight: 600 }}>Amount to pay</span><span className="v">{priceReady ? S.fmt(cost) : "—"}</span></div>
          {!priceReady && <div className="margin-note"><I.info size={18} />Loading today's prices…</div>}
          {/* Stated as conditional on delivery, because that's when it's actually paid. */}
          {isReseller && tierBonus > 0 && <div className="margin-note"><I.coins size={18} />You will earn {S.fmt(tierBonus)} if this order is delivered successfully</div>}

          <div className="pay-choice">
            <div className="pc-label">Pay with</div>
            <button type="button" className={"pc-opt" + (payVia === "wallet" ? " on" : "")} onClick={() => setPayVia("wallet")}>
              <span className="pc-ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><I.wallet size={20} /></span>
              <span className="pc-tx"><span className="pc-t">Wallet balance</span><span className="pc-s">{S.fmt(balance)} available</span></span>
              <span className="pc-rd">{payVia === "wallet" && <I.check size={13} stroke="#fff" sw={3} />}</span>
            </button>
            <button type="button" className={"pc-opt" + (payVia === "momo" ? " on" : "")} onClick={() => setPayVia("momo")}>
              <span className="pc-ic" style={{ background: "var(--teal-050)", color: "var(--teal-ink)" }}><I.fund size={20} /></span>
              <span className="pc-tx"><span className="pc-t">Mobile Money</span><span className="pc-s">Pay via MTN, Telecel or AT</span></span>
              <span className="pc-rd">{payVia === "momo" && <I.check size={13} stroke="#fff" sw={3} />}</span>
            </button>
          </div>

          {low && <div className="margin-note" style={{ background: "#FDE7E5", borderColor: "rgba(226,35,26,.2)", color: "var(--telecel)" }}><I.info size={18} />Low balance · {S.fmt(balance)}. Fund your wallet or switch to Mobile Money.</div>}
          <button className="btn btn-pri btn-full" disabled={payDisabled} style={{ opacity: payDisabled ? 0.5 : 1 }} onClick={pay}><I.lock size={18} stroke="#fff" />{payVia === "momo" ? "Pay " + S.fmt(cost) + " with mobile money" : "Confirm & pay " + S.fmt(cost)}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 14, fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}><I.shield size={15} />Delivered instantly · auto-refund if it fails</div>
        </React.Fragment>
      ) : (
        <div className="empty" style={{ padding: "30px 10px" }}><div className="ic"><I.signal size={28} /></div><p style={{ fontSize: 14 }}>{isData ? "Pick a network and bundle to see your order" : "Choose a network and amount to continue"}</p></div>
      )}
    </div>
  );
}

// Defined inline in the original Object.assign(window, …) registration.
const BuyDataPage = () => <BuyFlow type="data" />;
const BuyAirtimePage = () => <BuyFlow type="airtime" />;

export { BuyAirtimePage, BuyDataPage, BuyFlow, BuySummary, Notice };
