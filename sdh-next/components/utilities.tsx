"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I } from "@/components/icons";
import { useStore } from "@/components/store";
import { Field, Modal, NetBadge } from "@/components/ui";

/* Smart Data Hub — Utilities & Bills (ECG, Water, DStv, Netflix, Prime Video)
   Customers buy; agents earn commission. Flows through wallet + orders + commissions. */
const { useState: utU } = React;

function UtilitiesPage() {
  const { S, role } = useStore();
  const [active, setActive] = utU(null);
  const isAgent = role === "reseller";

  const fromPrice = (u) => {
    if (u.amounts) return u.amounts[0];
    const arr = (u.packages || u.plans).map(x => x.price);
    return Math.min(...arr);
  };

  return (
    <React.Fragment>
      <div className="card pad-lg" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.plug size={22} /></span>
        <div><strong style={{ fontSize: 15.5 }}>Pay bills &amp; buy subscriptions in one place</strong><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Electricity, water, DStv and streaming — paid from your wallet, delivered instantly{isAgent ? ". You earn commission on every sale." : "."}</div></div>
      </div>

      <div className="util-grid">
        {S.UTILITY_ORDER.map(id => {
          const u = S.UTILITIES[id];
          return (
            <button
              className={"util-card" + (u.comingSoon ? " util-card-soon" : "")}
              key={id}
              disabled={u.comingSoon}
              onClick={() => { if (!u.comingSoon) setActive(id); }}
            >
              <div className="util-top">
                <NetBadge net={id} size={50} />
                {isAgent && !u.comingSoon && <span className="util-comm">earn commission</span>}
              </div>
              <div className="util-name">{u.name}</div>
              <div className="util-tag">{u.tagline}</div>
              <div className="util-foot">
                <span className="from">from <strong>{S.fmt(fromPrice(u))}</strong></span>
                {u.comingSoon
                  ? <span className="go go-soon">Coming soon!</span>
                  : <span className="go">Buy <I.arrow size={16} /></span>}
              </div>
            </button>
          );
        })}
      </div>

      {active && <UtilityFlow id={active} onClose={() => setActive(null)} />}
    </React.Fragment>
  );
}

function UtilityFlow({ id, onClose }) {
  const { S, role, balance, placeOrder, completeOrder, toast, goApp, user } = useStore();
  const u = S.UTILITIES[id];
  const isAgent = role === "reseller";

  const [sel, setSel] = utU(null);          // package/plan id, or null
  const [amount, setAmount] = utU(u.amounts ? u.amounts[1] || u.amounts[0] : 0);
  const [acct, setAcct] = utU("");
  const [step, setStep] = utU("form");      // form | processing | done
  const [order, setOrder] = utU(null);

  // resolve price + label
  let price = 0, pkgLabel = "";
  if (u.kind === "meter") { price = amount; pkgLabel = `${S.fmt(amount)} ${u.short}`; }
  else if (u.kind === "package") { const p = u.packages.find(x => x.id === sel); if (p) { price = p.price; pkgLabel = p.name; } }
  else if (u.kind === "shared") { const p = u.plans.find(x => x.id === sel); if (p) { price = p.price; pkgLabel = `${u.short} · ${p.name}`; } }

  // commission (agents only)
  let commission = 0;
  if (isAgent && price > 0) {
    if (u.kind === "shared") { const p = u.plans.find(x => x.id === sel); commission = p ? +(p.price - p.cost).toFixed(2) : 0; }
    else commission = +(price * u.rate).toFixed(2);
  }
  const cost = isAgent ? +(price - commission).toFixed(2) : price;

  const acctOk = u.kind === "shared"
    ? (acct.includes("@") || acct.replace(/\D/g, "").length >= 9)
    : acct.replace(/\D/g, "").length >= 6;
  const canPay = price > 0 && acctOk;

  const pay = () => {
    if (!canPay) return;
    if (balance < cost) { toast("Insufficient wallet balance — fund your wallet", "wallet"); return; }
    const o = placeOrder({ net: id, type: u.type, pkg: pkgLabel, recipient: acct, cost, commission });
    setOrder(o);
    setStep("processing");
    setTimeout(() => { completeOrder(o); setStep("done"); }, 1900);
  };

  const title = step === "done" ? "" : u.name;

  return (
    <Modal title={title} onClose={onClose}>
      {step === "form" && (
        <React.Fragment>
          <div className="co-item">
            <NetBadge net={id} size={46} />
            <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 16 }}>{u.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{u.deliver}</div></div>
          </div>

          {/* selection */}
          {u.kind === "meter" && (
            <React.Fragment>
              <div className="field" style={{ marginTop: 4 }}><label>Amount</label></div>
              <div className="amount-picks">
                {u.amounts.map(a => <button key={a} className={"ap" + (amount === a ? " on" : "")} onClick={() => setAmount(a)}>GH₵{a}</button>)}
              </div>
              <Field label="Or enter amount" pre="GH₵" inputMode="numeric" value={amount || ""} onChange={(e) => setAmount(Math.max(0, +e.target.value.replace(/\D/g, "") || 0))} placeholder="0" />
            </React.Fragment>
          )}

          {u.kind === "package" && (
            <div className="util-opts" style={{ marginTop: 6 }}>
              {u.packages.map(p => (
                <button key={p.id} className={"util-opt" + (sel === p.id ? " on" : "")} onClick={() => setSel(p.id)}>
                  <div className="lft"><span className="rdot"></span><span className="onm">{p.name}</span>{p.tag && <span className="otag">{p.tag}</span>}</div>
                  <span className="opr">{S.fmt(p.price)}</span>
                </button>
              ))}
            </div>
          )}

          {u.kind === "shared" && (
            <div className="util-opts" style={{ marginTop: 6 }}>
              {u.plans.map(p => (
                <button key={p.id} className={"util-opt" + (sel === p.id ? " on" : "")} onClick={() => setSel(p.id)}>
                  <div className="lft"><span className="rdot"></span><span className="onm">{p.name}</span>{p.tag && <span className="otag">{p.tag}</span>}</div>
                  <div style={{ textAlign: "right" }}><div className="opr">{S.fmt(p.price)}</div>{isAgent && <div className="ocomm">+{S.fmt(p.price - p.cost)}</div>}</div>
                </button>
              ))}
            </div>
          )}

          <Field label={u.idLabel} icon={u.kind === "shared" ? "mail" : "receipt"} placeholder={u.placeholder} value={acct} onChange={(e) => setAcct(e.target.value)} hint={acct && !acctOk ? "Enter a valid " + u.idLabel.toLowerCase() : u.idHint} error={acct && !acctOk} />

          {/* summary */}
          {price > 0 && (
            <div className="summary" style={{ marginTop: 4 }}>
              {isAgent && <div className="row"><span className="k">Customer price</span><span className="v">{S.fmt(price)}</span></div>}
              {isAgent && commission > 0 && <div className="row"><span className="k">Your commission</span><span className="v" style={{ color: "var(--ok)" }}>+{S.fmt(commission)}</span></div>}
              <div className="total"><span className="muted" style={{ fontWeight: 600 }}>{isAgent ? "Pay from wallet" : "Total"}</span><span className="v">{S.fmt(cost)}</span></div>
            </div>
          )}
          {price > 0 && balance < cost && <div className="margin-note" style={{ background: "#FDE7E5", borderColor: "rgba(226,35,26,.2)", color: "var(--telecel)" }}><I.info size={18} />Low balance · {S.fmt(balance)}. Fund your wallet to continue.</div>}

          <button className="btn btn-pri btn-full" disabled={!canPay} style={{ opacity: canPay ? 1 : .5 }} onClick={pay}><I.lock size={18} stroke="#fff" />{price > 0 ? "Pay " + S.fmt(cost) : "Select an option"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 12, fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}><I.shield size={15} />Instant delivery · auto-refund if it fails</div>
        </React.Fragment>
      )}

      {step === "processing" && (
        <div className="flow-result" style={{ padding: "16px 10px 6px" }}><div className="spin"></div><h2>Processing…</h2><p>{u.deliver}. This usually takes a few seconds.</p></div>
      )}

      {step === "done" && (
        <div className="flow-result" style={{ padding: "10px 10px 6px" }}>
          <div className="ok-ring"><I.check size={42} stroke="var(--ok)" sw={2.4} /></div>
          <h2>{u.kind === "shared" ? "Account ready!" : u.kind === "package" ? "Activated!" : "Successful!"}</h2>
          <p>{pkgLabel} · {u.kind === "shared" ? "login details sent to " : "for "}<strong>{acct}</strong>.</p>
          <div className="card" style={{ textAlign: "left", marginTop: 16, background: "var(--bg)" }}>
            <div className="summary">
              <div className="row"><span className="k">Order</span><span className="v mono" style={{ fontFamily: "ui-monospace,monospace" }}>{order?.id}</span></div>
              <div className="row"><span className="k">Paid from wallet</span><span className="v">{S.fmt(cost)}</span></div>
              {commission > 0 && <div className="row"><span className="k">Commission earned</span><span className="v" style={{ color: "var(--ok)" }}>+{S.fmt(commission)}</span></div>}
              <div className="row" style={{ borderBottom: "none" }}><span className="k">{u.kind === "meter" && id === "ecg" ? "Token" : "Reference"}</span><span className="v mono" style={{ fontFamily: "ui-monospace,monospace" }}>{id === "ecg" ? (Math.random().toString().slice(2, 6) + " " + Math.random().toString().slice(2, 6) + " " + Math.random().toString().slice(2, 6)) : order?.id}</span></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button className="btn btn-pri" style={{ flex: 1 }} onClick={onClose}>Done</button>
            <button className="btn btn-out" style={{ flex: 1 }} onClick={() => { onClose(); goApp("orders"); }}>View orders</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export { UtilitiesPage, UtilityFlow };
