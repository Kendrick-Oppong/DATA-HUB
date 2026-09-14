"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc, CountUp, DataLoader, Empty, Field, Kente, Modal, NetBadge, Pill } from "@/components/ui";
import { AgentFailedBeneficiary } from "@/components/failed-beneficiaries";
import { isSettled } from "@/lib/orderStatus";

/* Smart Data Hub — RESELLER / AGENT area (the showpiece) */
const { useState: reU, useEffect: reE } = React;

function BarChart({ data, fmt }) {
  const max = Math.max(...data.map(d => d.value));
  const peak = data.reduce((a, b) => b.value > a.value ? b : a, data[0]);
  return (
    <div className="bars">
      {data.map(d => (
        <div className={"col" + (d === peak ? " peak" : "")} key={d.day}>
          <div className="vl">{fmt ? fmt(d.value) : d.value}</div>
          <div className="bar" style={{ height: (d.value / max * 100) + "%" }}></div>
          <div className="dl">{d.day}</div>
        </div>
      ))}
    </div>
  );
}

// klikgain-style "Complete your store setup" checklist. Renders on the agent dashboard
// while any step is outstanding, then hides itself so the dashboard is unchanged once done.
function StoreSetupChecklist() {
  const { S, store, storeOrders, goApp, toast } = useStore();
  const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://smartdatahubgh.com";
  const fullUrl = origin + "/" + store.handle;
  const pricesCustomised = JSON.stringify(store.prices) !== JSON.stringify(S.defaultStore.prices);
  const hasWhatsApp = !!(store.whatsapp && store.whatsapp.replace(/\D/g, "").length >= 9);
  // The step's own CTA is just "Copy link" — clicking it is the action the checklist is
  // asking for, so that alone ticks the step (an actual sale, once it happens, keeps it
  // ticked too). Persisted per store handle so a refresh doesn't un-tick it.
  const copiedKey = "sdh_store_link_copied_" + (store.handle || "");
  const [linkCopied, setLinkCopied] = reU(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(copiedKey) === "1"; } catch (e) { return false; }
  });
  const steps = [
    { done: !!store.logo, title: "Add your store logo", desc: "Show your brand on your storefront instead of your initials.", cta: "Add logo", act: () => goApp("my-store") },
    { done: pricesCustomised, title: "Set your prices", desc: "Customise your markup — your commission is the difference on every sale.", cta: "Set prices", act: () => goApp("my-store") },
    { done: hasWhatsApp, title: "Add WhatsApp support", desc: "Let customers reach you for help with their orders.", cta: "Add number", act: () => goApp("my-store") },
    { done: (storeOrders && storeOrders.length > 0) || linkCopied, title: "Share your store & get your first sale", desc: "Copy your store link and share it on WhatsApp, status or flyers.", cta: "Copy link", act: () => {
        navigator.clipboard?.writeText(fullUrl);
        toast("Store link copied", "copy");
        setLinkCopied(true);
        try { localStorage.setItem(copiedKey, "1"); } catch (e) {}
      } },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round(doneCount / steps.length * 100);
  if (doneCount === steps.length) return null;

  return (
    <div className="card pad-lg" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="ic" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I.brief size={20} stroke="currentColor" /></span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3 style={{ fontSize: 18 }}>Complete your store setup</h3>
          <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{doneCount} of {steps.length} steps done</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 120, height: 7, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "var(--teal)", borderRadius: 99, transition: "width .3s" }}></div></div>
          <span style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: 14, color: "var(--teal-ink)" }}>{pct}%</span>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 12, background: s.done ? "var(--bg)" : "var(--surface)", opacity: s.done ? 0.7 : 1 }}>
            <span style={{ flexShrink: 0 }}>
              {s.done
                ? <I.checkc size={22} stroke="var(--ok)" />
                : <span style={{ width: 22, height: 22, borderRadius: 99, border: "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: 12, color: "var(--muted)" }}>{i + 1}</span>}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, textDecoration: s.done ? "line-through" : "none" }}>{s.title}</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{s.desc}</div>
            </div>
            {!s.done && <button className="btn btn-out" style={{ padding: "8px 14px", fontSize: 13, flexShrink: 0 }} onClick={s.act}>{s.cta}<I.arrow size={15} stroke="currentColor" /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResellerDashboard() {
  const { S, earnings, earnBreakdown, orders, storeOrders, commissions, referral, refreshReferrals, user, goApp } = useStore();
  const [wd, setWd] = reU(false);
  const [ref, setRef] = reU(false);
  reE(() => { if (user?.id) refreshReferrals(); }, [user?.id]);

  // ---- tier: earned from real money this month ----
  // The score is everything the agent earned in this calendar month — storefront profit,
  // commission on their own sales, and referral bonuses — so all three routes to earning
  // move them up the tiers.
  const score = earnBreakdown.total;
  const { tier, next: nextTier } = S.tierFor(score);
  const goal = nextTier ? nextTier.min : tier.min;
  const pct = nextTier ? Math.min(100, Math.round(score / (goal || 1) * 100)) : 100;
  // Referrals show what COUNTS toward the tier. Spec §2 holds back anything above the 30%
  // ceiling, so the bar can't promise a tier the backend won't grant.
  const parts = [
    ["Store profit", earnBreakdown.storeProfit, "brief", "var(--teal-ink)"],
    ["Commission", earnBreakdown.commission, "coins", "var(--blue)"],
    ["Referrals", earnBreakdown.referralsCounted, "gift", "var(--teal)"],
  ];
  const heldBack = earnBreakdown.referralsExcluded || 0;

  // ---- real activity derived from live orders (buys) + store sales ----
  const valueOf = (o) => o.price ?? o.cost ?? 0;
  const combined = [...(storeOrders || []), ...(orders || [])];
  const monthStart = S.monthStart();
  const ordersMonth = combined.filter(o => (o.at || 0) >= monthStart).length;
  const customers = new Set((storeOrders || []).map(o => String(o.customer || "").replace(/\D/g, "")).filter(Boolean)).size;
  const salesTotal = (storeOrders || []).filter(o => o.status === "delivered").length;

  // Real 7-day "value moved" (delivered orders), for the bar chart.
  const dayMs = S.DAY_MS;
  const today0 = S.dayStart();
  const delivered = combined.filter(o => o.status === "delivered");
  const salesWeek = [...Array(7)].map((_, i) => {
    const ds = today0 - (6 - i) * dayMs, de = ds + dayMs;
    const day = delivered.filter(o => (o.at || 0) >= ds && (o.at || 0) < de);
    return { day: S.weekday(ds), value: day.reduce((s, o) => s + valueOf(o), 0), orders: day.length };
  });

  // Real commissions come from delivered store sales (credited to the wallet server-side).
  const recentCommissions = (storeOrders || [])
    .filter(o => o.commission > 0 && o.status === "delivered")
    .map(o => ({ id: "C-" + o.id, orderId: o.id, net: o.net, pkg: o.pkg, amount: o.commission, at: o.deliveredAt || o.at }))
    .sort((a, b) => b.at - a.at);

  return (
    <React.Fragment>
      <StoreSetupChecklist />
      <div className="earn-hero" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Kente style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Arc style={{ bottom: -50, right: 40, width: 280 }} stroke="#fff" opacity={0.12} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <span className="tier-badge"><I.coins size={16} stroke="var(--teal)" />{tier.name} agent · {Math.round(tier.rate * 100)}% of margin</span>
          <div className="lbl">Available to withdraw</div>
          <div className="big"><CountUp value={earnings.available} /></div>
          <div className="sub">Commission earnings, ready to pay out to mobile money</div>
        </div>
        <div className="acts" style={{ position: "relative", zIndex: 2, marginTop: 0 }}>
          <button className="btn btn-teal" onClick={() => setWd(true)}><I.download size={18} />Withdraw</button>
          <button className="btn" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }} onClick={() => goApp("my-store")}><I.brief size={18} stroke="#fff" />My Store</button>
          <button className="btn" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }} onClick={() => setRef(true)}><I.share size={18} stroke="#fff" />Refer</button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginTop: 18 }}>
        {[["This month", S.fmt(earnings.thisMonth), "trend", "var(--blue)", "var(--blue-050)"],
          ["Lifetime earned", S.fmt(earnings.lifetime), "chart", "var(--ink)", "var(--bg)"],
          ["Pending", S.fmt(earnings.pending), "clock", "#B9791C", "#FFF4E0"],
          ["Orders this month", ordersMonth, "receipt", "var(--teal-ink)", "var(--teal-050)"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div>
            <div className="v" style={{ color: col }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid g-2 reseller-sales-grid" style={{ gridTemplateColumns: "1.4fr .9fr", marginTop: 18 }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Sales this week</h3><span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>GH₵ value moved</span></div>
          <BarChart data={salesWeek} fmt={(v) => S.fmt0(v)} />
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>Tier progress</h3></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{tier.name}</div><div className="muted" style={{ fontSize: 13 }}>{Math.round(tier.rate * 100)}% of the margin on each order</div></div>
            {nextTier ? <span className="pill approved">Next: {nextTier.name} {Math.round(nextTier.rate * 100)}%</span> : <span className="pill">Top tier</span>}
          </div>
          <div className="tier-track"><div className="fill" style={{ width: pct + "%" }}></div></div>
          <div className="tier-row"><span>{S.fmt(score)} this month</span><span className="muted">{nextTier ? <>Goal {S.fmt0(goal)}</> : "Top tier"}</span></div>

          {/* What the score is made of — store profit + commission + referral bonuses. */}
          <div className="tier-parts">
            {parts.map(([label, value, ic, col]) => (
              <div className="tp" key={label}>
                <span className="ic" style={{ color: col }}><Ic name={ic} size={16} /></span>
                <span className="l">{label}</span>
                <span className="v" style={value > 0 ? { color: col } : {}}>{S.fmt(value)}</span>
                <span className="bar"><i style={{ width: (score > 0 ? Math.round(value / score * 100) : 0) + "%", background: col }} /></span>
              </div>
            ))}
          </div>

          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 14 }}>{nextTier ? <>Earn {S.fmt0(goal)} a month across store profit, commission and referrals to unlock <strong style={{ color: "var(--ink)" }}>{nextTier.name}</strong> — and take {Math.round(nextTier.rate * 100)}% of the margin on every order.</> : <>You've reached the top tier — {Math.round(tier.rate * 100)}% of the margin on every order.</>}</p>
          {heldBack > 0 && <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 8 }}><I.info size={14} style={{ verticalAlign: "-2px" }} /> {S.fmt(heldBack)} of referral earnings isn't counting toward your tier yet — at least 70% of tier progress has to come from real sales. Sell more and it starts counting.</p>}
          <div style={{ display: "flex", gap: 18, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{customers}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>customers</div></div>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22, color: referral.qualified > 0 ? "var(--teal-ink)" : undefined }}>{referral.signedUp}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>referrals</div></div>
            <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22, color: "var(--ok)" }}>{(() => { const done = orders.filter(o => o.status === "delivered").length; const settled = orders.filter(o => isSettled(o.status)).length; return settled ? (Math.round(done / settled * 1000) / 10) + "%" : "—"; })()}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>delivered</div></div>
          </div>
        </div>
      </div>

      <div className="grid g-2 reseller-commissions-grid" style={{ gridTemplateColumns: "1.4fr .9fr", marginTop: 18 }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Recent commissions</h3>{recentCommissions.length > 0 && <span className="link" onClick={() => goApp("commissions")}>View all</span>}</div>
          {recentCommissions.length === 0 ? (
            <Empty icon="coins" title="No commissions yet" sub="Your profit on every sale you make will show up here." />
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Bundle</th><th>Order</th><th>Commission</th><th>When</th></tr></thead>
                <tbody>
                  {recentCommissions.slice(0, 5).map(c => (
                    <tr key={c.id}>
                      <td><div className="netcell"><NetBadge net={c.net} /><span>{c.pkg}</span></div></td>
                      <td className="mono">{c.orderId}</td>
                      <td className="amt amt-pos">+{S.fmt(c.amount)}</td>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(c.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ReferralCard onOpen={() => setRef(true)} />
      </div>

      {/* Report a number MTN refused as a beneficiary — goes straight to the admin tracker. */}
      <AgentFailedBeneficiary />

      {wd && <WithdrawModal onClose={() => setWd(false)} />}
      {ref && <ReferralModal onClose={() => setRef(false)} />}
    </React.Fragment>
  );
}

// The agent's real referral link. The code itself is minted server-side at signup and
// arrives with /api/referrals — never derived in the browser, so it's always the one the
// backend will match at sign-up.
function refLink(code) {
  const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://smartdatahubgh.com";
  return origin.replace(/^https?:\/\//, "") + "/?ref=" + code;
}

function ReferralCard({ onOpen }) {
  const { S, toast, referral, user } = useStore();
  const code = referral.code || user?.refCode || "";
  const reward = referral.reward ?? 3;
  const theirReward = referral.referredReward ?? 2;
  const link = refLink(code);
  return (
    <div className="card pad-lg" style={{ background: "linear-gradient(150deg, var(--navy), #0b1a30)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <Arc style={{ top: -30, right: -30, width: 200 }} stroke="var(--teal)" opacity={0.14} />
      <div className="card-h"><h3 style={{ color: "#fff" }}>Refer &amp; earn</h3><I.gift size={22} stroke="var(--teal)" /></div>
      <p style={{ color: "rgba(255,255,255,.82)", fontSize: 14, lineHeight: 1.55 }}>Share your code. Once their <strong style={{ color: "var(--teal)" }}>first order is delivered</strong>, you get {S.fmt0(reward)} credit and they get {S.fmt0(theirReward)} off their next one.</p>
      <div className="ref-box" style={{ marginTop: 16, background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.2)" }}>
        <span className="code" style={{ color: "#fff" }}>{code || "…"}</span>
        <button className="btn btn-teal" style={{ padding: "10px 16px", fontSize: 13.5 }} disabled={!code} onClick={() => { navigator.clipboard?.writeText("https://" + link); toast("Referral link copied", "copy"); }}><I.copy size={16} stroke="var(--navy)" />Copy</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24, color: "var(--teal)" }}>{referral.signedUp}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.66)", fontWeight: 600 }}>signed up</div></div>
        <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24, color: "var(--teal)" }}>{referral.qualified}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.66)", fontWeight: 600 }}>funded</div></div>
        <div><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24, color: "var(--teal)" }}>{S.fmt0(referral.credit)}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.66)", fontWeight: 600 }}>earned</div></div>
      </div>
      {referral.pending > 0 && (
        <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid rgba(255,255,255,.14)", fontSize: 12.5, color: "rgba(255,255,255,.7)", display: "flex", gap: 8, alignItems: "center" }}>
          <I.clock size={15} stroke="var(--teal)" />{referral.pending} waiting on their first delivery
        </div>
      )}
      <button className="btn btn-full" style={{ marginTop: 16, background: "rgba(255,255,255,.14)", color: "#fff" }} onClick={onOpen}><I.share size={17} stroke="#fff" />Share &amp; see who joined</button>
    </div>
  );
}

function ReferralModal({ onClose }) {
  const { S, toast, referral, user } = useStore();
  const code = referral.code || user?.refCode || "";
  const reward = referral.reward ?? 3;
  const theirReward = referral.referredReward ?? 2;
  const link = refLink(code);
  const rows = referral.referrals || [];
  return (
    <Modal title="Refer &amp; earn" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6 }}>Share your link. When their first order is delivered you get {S.fmt0(reward)} credit and they get {S.fmt0(theirReward)} towards their next order. Credit is spendable on anything on the platform, expires after 60 days, and can't be withdrawn. Up to 10 paid referrals a month.</p>
      <div className="ref-box" style={{ marginTop: 16 }}>
        <span className="code">{link}</span>
        <button className="btn btn-pri" style={{ padding: "10px 16px", fontSize: 13.5 }} disabled={!code} onClick={() => { navigator.clipboard?.writeText("https://" + link); toast("Link copied", "copy"); }}>Copy</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="btn btn-full" style={{ background: "#12A150", color: "#fff" }} disabled={!code} onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(`Join Smart Data Hub with my link — you get ${S.fmt0(theirReward)} off your first order: https://${link}`), "_blank")}><I.whatsapp size={18} stroke="#fff" />Share on WhatsApp</button>
      </div>

      <div className="section-title" style={{ marginTop: 22, marginBottom: 10 }}>Who joined with your code</div>
      {rows.length === 0 ? (
        <Empty icon="gift" title="No one yet" sub="Share your link — everyone who signs up with it shows up here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {rows.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: r.status === "qualified" ? "var(--ok-bg)" : "var(--bg)", color: r.status === "qualified" ? "var(--ok)" : "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic name={r.status === "qualified" ? "checkc" : "clock"} size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{r.status === "qualified" ? `Delivered · you earned ${S.fmt0(r.reward)}` : "Signed up · waiting for their first delivery"}</div>
              </div>
              <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{S.ago(r.at)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// When payouts actually run. Shown before an agent commits AND on the requested-payout
// confirmation, so the answer to "where's my money?" is on screen both times.
function WithdrawScheduleNote() {
  return (
    <div className="wd-when-note">
      <I.clock size={15} stroke="currentColor" />
      <span>Withdrawals are processed on <strong>weekdays after 11am</strong>, following our payment partner's settlement schedule. Requests made on weekends or after our daily cutoff are processed the next business day.</span>
    </div>
  );
}

function WithdrawModal({ onClose }) {
  const { S, balance, withdrawStart, withdrawConfirm, toast, user } = useStore();
  const [step, setStep] = reU("form");      // form | verify | done
  const [amt, setAmt] = reU(Math.floor(balance));
  const [network, setNetwork] = reU("mtn");
  const [payout, setPayout] = reU("");
  // The name the payout number is registered to. Prefilled from the account, but editable:
  // an agent's MoMo is often in a different name (a spouse's line, a business vs personal
  // name), and this is what's shown on the payout record.
  const [momoName, setMomoName] = reU(String(user?.business || user?.name || ""));
  const [code, setCode] = reU("");
  const [err, setErr] = reU("");
  const [busy, setBusy] = reU(false);
  const [sentTo, setSentTo] = reU("");
  const [result, setResult] = reU(null);
  const tooMuch = amt > balance;
  const phoneOk = payout.replace(/\D/g, "").length >= 9;
  const nameOk = momoName.trim().length >= 2;
  const ok = amt >= 10 && !tooMuch && phoneOk && nameOk;

  const start = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr("");
    try {
      const d = await withdrawStart({ amount: amt, momoNumber: payout, network, momoName: momoName.trim() });
      setSentTo(d.sentTo || "your email"); setCode(""); setStep("verify");
    } catch (e) { setErr(e.message || "Could not start the withdrawal."); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    if (code.length < 4 || busy) return;
    setBusy(true); setErr("");
    try {
      const d = await withdrawConfirm({ otp: code });
      setResult(d.withdrawal); setStep("done");
      toast(d.withdrawal?.status === "paid" ? "Payout sent to your mobile money" : "Payout requested — you'll be paid out soon", "coins");
    } catch (e) { setErr(e.message || "Could not complete the withdrawal."); }
    finally { setBusy(false); }
  };

  if (step === "done") {
    const paid = result?.status === "paid";
    return (
      <Modal title="" onClose={onClose}>
        <div className="flow-result" style={{ padding: "6px 2px 4px" }}>
          <div className="ok-ring"><I.check size={42} stroke="var(--ok)" sw={2.4} /></div>
          <h2>{paid ? "Payout sent" : "Payout requested"}</h2>
          <p>{paid
            ? <><strong>{S.fmt(result?.amount)}</strong> is on its way to <strong>{result?.payout}</strong>.</>
            : <>Your request for <strong>{S.fmt(result?.amount)}</strong> to <strong>{result?.payout}</strong> is in. The amount is held from your wallet and will be paid out on the next payout run — you'll see it marked Paid.</>}</p>
          {!paid && <WithdrawScheduleNote />}
          <button className="btn btn-pri btn-full" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
        </div>
      </Modal>
    );
  }

  if (step === "verify") {
    return (
      <Modal title="Confirm your withdrawal" onClose={onClose}>
        <div className="wd-sec-head"><span className="ic"><I.lock size={20} stroke="var(--teal-ink)" /></span><p>For your security, enter the code we emailed to <strong>{sentTo}</strong> to authorize this payout.</p></div>
        <div className="wd-summary">
          <div className="row"><span>Amount</span><strong>{S.fmt(amt)}</strong></div>
          <div className="row"><span>Payout to</span><strong className="mono">{payout} · {S.NETWORKS[network].name}</strong></div>
          <div className="row"><span>Name on MoMo</span><strong>{momoName}</strong></div>
        </div>
        <label className="wd-otp-lbl">Confirmation code</label>
        <input className="wd-otp" inputMode="numeric" maxLength={4} value={code} autoFocus
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }}
          placeholder="••••" />
        {err && <div className="wd-otp-err">{err}</div>}
        <div className="wd-demo"><I.info size={13} stroke="currentColor" />Didn't get it? Check your spam, or <button onClick={start} disabled={busy}>resend</button>.</div>
        <button className="btn btn-pri btn-full" disabled={code.length < 4 || busy} style={{ opacity: (code.length < 4 || busy) ? .5 : 1, marginTop: 4 }} onClick={confirm}><I.shield size={18} stroke="#fff" />{busy ? "Sending payout…" : "Confirm & pay out"}</button>
        <button className="btn btn-out btn-full" style={{ marginTop: 10 }} disabled={busy} onClick={() => { setStep("form"); setErr(""); }}>Back</button>
      </Modal>
    );
  }

  return (
    <Modal title="Withdraw from wallet" onClose={onClose}>
      <p className="muted" style={{ fontSize: 14, marginTop: -6 }}>Wallet balance: <strong style={{ color: "var(--teal-ink)" }}>{S.fmt(balance)}</strong>. Cash out to your mobile money via secure payout.</p>
      <Field label="Amount" pre="GH₵" inputMode="numeric" value={amt} onChange={(e) => setAmt(Math.max(0, +e.target.value.replace(/\D/g, "") || 0))} hint={tooMuch ? "More than your wallet balance" : amt < 10 ? "Minimum withdrawal is GH₵10" : null} error={tooMuch || amt < 10} />
      <div className="amount-picks" style={{ marginTop: 12 }}>
        {[50, 100, Math.floor(balance)].map((p, i) => <button key={i} className={"ap" + (amt === p ? " on" : "")} disabled={p < 10} onClick={() => setAmt(p)}>{i === 2 ? "All" : "GH₵" + p}</button>)}
      </div>
      <div className="field" style={{ marginBottom: 6 }}><label>Mobile money network</label></div>
      <div className="net-pick" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {["mtn", "telecel", "atigo"].map(n => <button key={n} className={"np" + (network === n ? " on" : "")} onClick={() => setNetwork(n)} style={{ padding: "12px 8px" }}><NetBadge net={n} size={34} /><div className="nm" style={{ fontSize: 12.5, marginTop: 6 }}>{S.NETWORKS[n].name}</div></button>)}
      </div>
      <Field label="Mobile money number" icon="phone" pre="+233" inputMode="tel" value={payout.replace(/^0/, "")} onChange={(e) => setPayout("0" + e.target.value.replace(/\D/g, ""))} placeholder="24 000 0000" hint={payout && !phoneOk ? "Enter a valid mobile money number" : "The number that receives the money"} error={payout && !phoneOk} />
      <Field label="Name on mobile money" icon="user" placeholder="e.g. Ama Mensah" value={momoName} onChange={(e) => setMomoName(e.target.value)} hint={momoName && !nameOk ? "Enter the full name on the account" : "Must match the name this number is registered to"} error={!!momoName && !nameOk} />
      {err && <div className="wd-otp-err" style={{ marginTop: 4 }}>{err}</div>}
      <WithdrawScheduleNote />
      <div className="wd-sec-note"><I.shield size={15} stroke="var(--teal-ink)" />We'll email you a code to confirm before any money moves.</div>
      <button className="btn btn-pri btn-full" disabled={!ok || busy} style={{ opacity: (!ok || busy) ? .5 : 1 }} onClick={start}><I.lock size={17} stroke="#fff" />{busy ? "Sending code…" : "Continue securely"}</button>
    </Modal>
  );
}

function CommissionsPage() {
  const { S, earnings, dataLoading, storeOrders } = useStore();

  // Real commissions: delivered store sales, credited to the wallet server-side.
  const commissions = (storeOrders || [])
    .filter(o => o.commission > 0 && o.status === "delivered")
    .map(o => ({ id: "C-" + o.id, orderId: o.id, net: o.net, pkg: o.pkg, amount: o.commission, at: o.deliveredAt || o.at }))
    .sort((a, b) => b.at - a.at);

  // Monthly profit trend (last 6 calendar months) — derived from real delivered commissions.
  const months = [...Array(6)].map((_, i) => {
    const start = S.monthsAgo(5 - i);
    const end = S.monthsAgo(4 - i);
    const value = commissions.filter(c => c.at >= start && c.at < end).reduce((s, c) => s + c.amount, 0);
    return { day: S.monthLabel(start), value: Math.round(value) };
  });
  const lastMonth = months[months.length - 2].value;
  const growth = lastMonth ? Math.round((earnings.thisMonth - lastMonth) / lastMonth * 100) : 0;
  const up = growth >= 0;

  // where the profit comes from — group by network
  const byNet = {};
  commissions.forEach(c => { byNet[c.net] = (byNet[c.net] || 0) + c.amount; });
  const nets = Object.entries(byNet).sort((a, b) => b[1] - a[1]);
  const netTotal = nets.reduce((s, n) => s + n[1], 0) || 1;
  const avg = commissions.length ? netTotal / commissions.length : 0;

  return (
    <React.Fragment>
      {/* profit hero with growth */}
      <div className="earn-hero" style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Kente style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Arc style={{ bottom: -50, right: 30, width: 260 }} stroke="#fff" opacity={0.12} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="lbl">Your profit available to withdraw</div>
          <div className="big"><CountUp value={earnings.available} /></div>
          <div className="sub">Earned automatically on every order — your price minus the platform wholesale cost</div>
        </div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "right" }}>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>This month</div>
          <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 30, color: "#fff", marginTop: 2 }}>{S.fmt(earnings.thisMonth)}</div>
          <span className="growth-chip" style={{ background: up ? "rgba(14,158,146,.22)" : "rgba(226,35,26,.22)", color: up ? "var(--teal)" : "#ff9b94" }}>
            <I.trend size={15} stroke={up ? "var(--teal)" : "#ff9b94"} />{up ? "+" : ""}{growth}% vs last month
          </span>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 18 }}>
        {[["Available", earnings.available, "coins", "var(--teal-ink)", "var(--teal-050)"], ["Lifetime profit", earnings.lifetime, "chart", "var(--ink)", "var(--bg)"], ["Avg. per order", avg, "receipt", "var(--blue)", "var(--blue-050)"], ["Pending", earnings.pending, "clock", "#B9791C", "#FFF4E0"]].map(([l, v, ic, col, bg], i) => (
          <div className="stat-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={17} /></span>{l}</div>
            <div className="v" style={{ color: col }}>{S.fmt(v)}</div>
          </div>
        ))}
      </div>

      <div className="grid g-2 reseller-profit-grid" style={{ gridTemplateColumns: "1.4fr .9fr", marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="card-h"><h3>Profit trend</h3><span className={"growth-chip sm " + (up ? "pos" : "neg")}><I.trend size={14} />{up ? "+" : ""}{growth}% MoM</span></div>
          <BarChart data={months} fmt={(v) => S.fmt0(v)} />
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 14 }}>You earned <strong style={{ color: "var(--ink)" }}>{S.fmt(earnings.thisMonth)}</strong> in profit this month{up ? <> — <strong style={{ color: "var(--teal-ink)" }}>{growth}% more</strong> than last month. Keep it up!</> : "."}</p>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>Where your profit comes from</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
            {nets.map(([net, amt]) => {
              const pct = Math.round(amt / netTotal * 100);
              return (
                <div key={net}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                    <NetBadge net={net} size={28} />
                    <strong style={{ fontSize: 14 }}>{S.NETWORKS[net].name}</strong>
                    <span className="muted" style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13.5 }}>{S.fmt(amt)}</span>
                    <span className="muted" style={{ fontSize: 12.5, width: 38, textAlign: "right" }}>{pct}%</span>
                  </div>
                  <div className="profit-track"><div className="fill" style={{ width: pct + "%", background: S.NETWORKS[net].color }}></div></div>
                </div>
              );
            })}
            {!nets.length && <p className="muted" style={{ fontSize: 13.5 }}>No profit recorded yet — make your first sale to see the breakdown.</p>}
          </div>
        </div>
      </div>

      <div className="card pad-lg">
        <div className="card-h"><h3>Your profit ledger</h3></div>
        {dataLoading.storeOrders ? (
          <DataLoader label="Loading your profit…" />
        ) : commissions.length === 0 ? (
          <Empty icon="coins" title="No profit yet" sub="Every sale you make earns you the difference between your price and wholesale — it'll be listed here." />
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Bundle</th><th>Order</th><th>Status</th><th>Your Profit</th><th>When</th></tr></thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id}>
                  <td><div className="netcell"><NetBadge net={c.net} /><span>{c.pkg}</span></div></td>
                  <td className="mono">{c.orderId}</td>
                  <td><Pill status={c.status} /></td>
                  <td className="amt amt-pos">+{S.fmt(c.amount)}</td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(c.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </React.Fragment>
  );
}

function WithdrawalsPage() {
  const { S, balance, withdrawals, refreshWithdrawals, dataLoading } = useStore();
  const [wd, setWd] = reU(false);
  React.useEffect(() => { refreshWithdrawals(); }, [refreshWithdrawals]);
  const stMap = { paid: "delivered", requested: "processing", processing: "processing", failed: "failed", rejected: "failed" };
  const stLabel = { paid: "Paid", requested: "Pending", processing: "Processing", failed: "Failed", rejected: "Rejected" };
  return (
    <React.Fragment>
      <div className="grid g-2 reseller-withdrawals-grid" style={{ gridTemplateColumns: "1fr 1.6fr", marginBottom: 18 }}>
        <div className="earn-hero" style={{ background: "linear-gradient(135deg, var(--teal-ink), #0bbf9f)" }}>
          <div className="lbl" style={{ marginTop: 8 }}>Wallet balance</div>
          <div className="big" style={{ fontSize: 44 }}>{S.fmt(balance)}</div>
          <div className="acts"><button className="btn" style={{ background: "#fff", color: "var(--teal-ink)", opacity: balance < 10 ? .6 : 1 }} disabled={balance < 10} onClick={() => setWd(true)}><I.download size={18} stroke="var(--teal-ink)" />Withdraw to MoMo</button></div>
        </div>
        <div className="card pad-lg">
          <div className="card-h"><h3>How payouts work</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["1", "Enter amount & MoMo number", "Choose how much to cash out from your wallet and the mobile money number to receive it."], ["2", "Confirm with an emailed code", "We email a one-time code to authorize the payout — so only you can move your money."], ["3", "Money hits your MoMo", "The payout is sent to your mobile money on the next weekday payout run — see the timing note below."]].map(([n, t, d]) => (
              <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--navy)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, flexShrink: 0 }}>{n}</span>
                <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div><div className="muted" style={{ fontSize: 13 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <WithdrawScheduleNote />
        </div>
      </div>

      <div className="card pad-lg">
        <div className="card-h"><h3>Withdrawal history</h3></div>
        {dataLoading.withdrawals ? (
          <DataLoader label="Loading payouts…" />
        ) : withdrawals.length === 0 ? (
          <Empty icon="download" title="No withdrawals yet" sub="Cash out your wallet to mobile money and your payouts will appear here." />
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Reference</th><th>Amount</th><th>Payout to</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td className="mono">{String(w.id).slice(-8)}</td>
                  <td className="amt">{S.fmt(w.amount)}</td>
                  <td className="muted">{w.payout}{w.network && S.NETWORKS[w.network] ? " · " + S.NETWORKS[w.network].name : ""}</td>
                  <td><Pill status={stMap[w.status] || w.status}>{stLabel[w.status] || w.status}</Pill></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(w.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
      {wd && <WithdrawModal onClose={() => setWd(false)} />}
    </React.Fragment>
  );
}

function CustomersPage() {
  const { S, storeOrders } = useStore();
  const [q, setQ] = reU("");
  // Built from the agent's real storefront orders, via the shared helper — Bulk SMS builds
  // its recipient lists from the same one, so "your customers" means the same thing on both
  // screens. Duplicating it here is how the two would quietly drift apart.
  const all = S.customersFrom(storeOrders);
  const customers = q.trim() ? all.filter(c => (c.name + " " + c.phone).toLowerCase().includes(q.trim().toLowerCase())) : all;
  const total = all.length;
  const repeatRate = total ? Math.round(all.filter(c => c.orders > 1).length / total * 100) : 0;
  const totalOrders = all.reduce((s, c) => s + c.orders, 0);
  const avg = totalOrders ? all.reduce((s, c) => s + c.spent, 0) / totalOrders : 0;
  return (
    <React.Fragment>
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        {[["Total customers", String(total), "users"], ["Repeat rate", total ? repeatRate + "%" : "—", "refresh"], ["Avg. order", totalOrders ? S.fmt(avg) : "—", "receipt"]].map(([l, v, ic], i) => (
          <div className="stat-tile" key={i}><div className="lbl"><span className="ic" style={{ background: "var(--blue-050)", color: "var(--blue)" }}><Ic name={ic} size={17} /></span>{l}</div><div className="v">{v}</div></div>
        ))}
      </div>
      <div className="card pad-lg">
        <div className="card-h"><h3>Your customers</h3>{total > 0 && <div className="field" style={{ margin: 0 }}><div className="control" style={{ height: 42 }}><I.search size={18} /><input placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} /></div></div>}</div>
        {total === 0 ? (
          <Empty icon="users" title="No customers yet" sub="When people buy through your store link, they'll be listed here with their order history." />
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Network</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--blue-050)", color: "var(--blue-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14 }}>{c.name.split(" ").map(s => s[0]).join("").slice(0, 2)}</span><div><div style={{ fontWeight: 600 }}>{c.name}</div><div className="mono">{c.phone}</div></div></div></td>
                  <td><NetBadge net={c.net} /></td>
                  <td className="amt">{c.orders}</td>
                  <td className="amt">{S.fmt(c.spent)}</td>
                  <td className="muted">{S.ago(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </React.Fragment>
  );
}

export { BarChart, CommissionsPage, CustomersPage, ReferralCard, ReferralModal, ResellerDashboard, WithdrawModal, WithdrawalsPage };
