"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { PseudoQR } from "@/components/store-builder";
import { Empty, Field, Modal, NetBadge, Select, useDecimalInput } from "@/components/ui";

/* Smart Data Hub — My Store extras: insights, promos, share-to-social kit */
const { useState: sxU } = React;

/* ============================================================
   STORE INSIGHTS — storefront analytics
   ============================================================ */
function Delta({ now, prev }) {
  const up = now >= prev;
  const pct = prev ? Math.round(Math.abs(now - prev) / prev * 100) : 0;
  return <span className="sx-delta" style={{ color: up ? "var(--ok)" : "var(--telecel)" }}><I.trend size={13} stroke={up ? "var(--ok)" : "var(--telecel)"} style={up ? {} : { transform: "scaleY(-1)" }} />{pct}%</span>;
}

function StoreInsights() {
  const { S, storeOrders } = useStore();
  const all = storeOrders || [];
  const delivered = all.filter(o => o.status === "delivered");
  const hasData = all.length > 0;
  if (!hasData) {
    return (
      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Store insights</h3><span className="muted" style={{ fontSize: 13 }}>Last 7 days</span></div>
        <Empty icon="chart" title="No insights yet" sub="Once customers start buying from your store, you'll see revenue, orders, best-sellers, busiest hours and repeat customers here." />
      </div>
    );
  }

  // All derived from REAL store orders — nothing simulated.
  const dayMs = S.DAY_MS;
  const d0 = S.dayStart();
  const last7 = d0 - 6 * dayMs, prev7 = d0 - 13 * dayMs;
  const sum = (arr, f) => arr.reduce((s, o) => s + f(o), 0);

  const rev7 = sum(delivered.filter(o => (o.at || 0) >= last7), o => o.price || 0);
  const revPrev = sum(delivered.filter(o => (o.at || 0) >= prev7 && (o.at || 0) < last7), o => o.price || 0);
  const ord7 = all.filter(o => (o.at || 0) >= last7).length;
  const ordPrev = all.filter(o => (o.at || 0) >= prev7 && (o.at || 0) < last7).length;
  const comm7 = sum(delivered.filter(o => (o.at || 0) >= last7), o => o.commission || 0);
  const commPrev = sum(delivered.filter(o => (o.at || 0) >= prev7 && (o.at || 0) < last7), o => o.commission || 0);

  const recCount = {};
  delivered.forEach(o => { const r = String(o.customer || "").replace(/\D/g, ""); if (r) recCount[r] = (recCount[r] || 0) + 1; });
  const totalCust = Object.keys(recCount).length;
  const repeatCustomers = Object.values(recCount).filter(n => n > 1).length;
  const newCustomers = totalCust - repeatCustomers;
  const repeatRate = totalCust ? repeatCustomers / totalCust : 0;
  const avgOrder = delivered.length ? sum(delivered, o => o.price || 0) / delivered.length : 0;

  const days = [...Array(7)].map((_, i) => { const ds = d0 - (6 - i) * dayMs, de = ds + dayMs; const dayO = all.filter(o => (o.at || 0) >= ds && (o.at || 0) < de); return { day: S.weekday(ds), orders: dayO.length, delivered: dayO.filter(o => o.status === "delivered").length }; });
  const maxV = Math.max(...days.map(d => d.orders), 1);

  const hourBuckets = [[0, "12–4a"], [4, "4–8a"], [8, "8–12p"], [12, "12–4p"], [16, "4–8p"], [20, "8–12a"]];
  const hourCounts = hourBuckets.map(([h, lbl]) => [lbl, delivered.filter(o => { const hr = S.hourOf(o.at); return hr >= h && hr < h + 4; }).length]);
  const hoursTotal = hourCounts.reduce((s, [, c]) => s + c, 0) || 1;

  const bmap = {};
  delivered.forEach(o => { const k = o.net + "|" + o.pkg; (bmap[k] = bmap[k] || { net: o.net, label: o.pkg, units: 0, revenue: 0 }); bmap[k].units++; bmap[k].revenue += o.price || 0; });
  const topProducts = Object.values(bmap).sort((a, b) => b.units - a.units).slice(0, 5);

  const tiles = [
    ["Revenue · 7 days", S.fmt0(rev7), rev7, revPrev, "trend", "var(--ok)", "var(--ok-bg)"],
    ["Orders · 7 days", ord7, ord7, ordPrev, "receipt", "var(--blue)", "var(--blue-050)"],
    ["Commission · 7 days", S.fmt0(comm7), comm7, commPrev, "coins", "var(--teal-ink)", "var(--teal-050)"],
    ["Customers", totalCust, totalCust, totalCust, "users", "var(--blue-700)", "var(--blue-050)"],
  ];

  return (
    <div className="card pad-lg" style={{ marginTop: 18 }}>
      <div className="card-h"><h3>Store insights</h3><span className="muted" style={{ fontSize: 13 }}>Last 7 days</span></div>

      <div className="sx-tiles">
        {tiles.map(([l, v, n, p, ic, col, bg], i) => (
          <div className="sx-tile" key={i}>
            <div className="lbl"><span className="ic" style={{ background: bg, color: col }}><Ic name={ic} size={16} /></span>{l}</div>
            <div className="v">{v}</div>
            <div className="d"><Delta now={n} prev={p} /><span className="muted">vs last week</span></div>
          </div>
        ))}
      </div>

      <div className="grid g-2 sx-peak-grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: 18, alignItems: "start", gap: 18 }}>
        {/* orders per day */}
        <div className="sx-block">
          <div className="sx-h"><span>Orders per day</span><span className="sx-legend"><span className="k1"></span>Orders<span className="k2"></span>Delivered</span></div>
          <div className="sx-bars">
            {days.map((d, i) => (
              <div className="sx-col" key={i} title={d.day + ": " + d.orders + " orders, " + d.delivered + " delivered"}>
                <div className="stack">
                  <span className="b1" style={{ height: Math.max(4, (d.orders / maxV) * 130) + "px" }}></span>
                  <span className="b2" style={{ height: Math.max(3, (d.delivered / maxV) * 130) + "px" }}></span>
                </div>
                <span className="x">{d.day[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* busiest hours */}
        <div className="sx-block">
          <div className="sx-h"><span>Busiest hours</span><span className="muted" style={{ fontSize: 12 }}>share of orders</span></div>
          <div className="sx-hours">
            {hourCounts.map(([lbl, v], i) => {
              const pct = Math.round(v / hoursTotal * 100);
              return (
                <div className="sx-hrow" key={i}>
                  <span className="hl">{lbl}</span>
                  <span className="ht"><span style={{ width: pct + "%" }}></span></span>
                  <span className="hv">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid g-2 sx-top-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18, alignItems: "start", gap: 18 }}>
        {/* top products */}
        <div className="sx-block">
          <div className="sx-h"><span>Best sellers</span><span className="muted" style={{ fontSize: 12 }}>units · revenue</span></div>
          {topProducts.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: "10px 2px" }}>No delivered sales yet.</p>
          ) : (
          <div className="sx-top">
            {topProducts.map((p, i) => (
              <div className="r" key={i}>
                <span className="rank">{i + 1}</span>
                <NetBadge net={p.net} size={28} />
                <span className="nm">{p.label}</span>
                <span className="u">{p.units}×</span>
                <span className="rev">{S.fmt0(p.revenue)}</span>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* repeat customers */}
        <div className="sx-block">
          <div className="sx-h"><span>Customers</span></div>
          <div className="sx-cust">
            <div className="ring" style={{ background: `conic-gradient(var(--blue) ${repeatRate * 360}deg, var(--teal) 0)` }}>
              <div className="hole"><div className="pc">{Math.round(repeatRate * 100)}%</div><div className="lb">repeat</div></div>
            </div>
            <div className="leg">
              <div><span className="d" style={{ background: "var(--blue)" }}></span>Repeat buyers<strong>{repeatCustomers}</strong></div>
              <div><span className="d" style={{ background: "var(--teal)" }}></span>One-time<strong>{newCustomers}</strong></div>
              <div><span className="d" style={{ background: "var(--faint)" }}></span>Avg. order<strong>{S.fmt(avgOrder)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROMOS — discount codes for the storefront
   ============================================================ */
function scopeLabel(S, scope) {
  if (scope === "all") return "All products";
  if (scope === "airtime") return "Airtime";
  return (S.NETWORKS[scope] && S.NETWORKS[scope].name + " data") || scope;
}

function PromosCard() {
  const { S, promos, togglePromo, deletePromo } = useStore();
  const [create, setCreate] = sxU(false);
  const live = promos.filter(p => p.active).length;

  return (
    <div className="card pad-lg" style={{ marginTop: 18 }}>
      <div className="card-h"><h3>Discount codes</h3><button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={() => setCreate(true)}><I.plus size={15} />New code</button></div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 14 }}>Create codes customers enter at checkout. <strong style={{ color: "var(--teal-ink)" }}>{live} active</strong> · the discount comes out of your commission, so price it with room to spare.</p>

      {promos.length === 0 ? (
        <div className="empty" style={{ padding: "26px 10px" }}><div className="ic"><I.tag size={24} /></div><p>No discount codes yet.</p></div>
      ) : (
        <div className="promo-list">
          {promos.map(p => (
            <div className={"promo" + (p.active ? "" : " off")} key={p.code}>
              <div className="pc-tag"><I.tag size={16} stroke={p.active ? "var(--blue)" : "var(--faint)"} /></div>
              <div className="pc-main">
                <div className="top"><span className="code">{p.code}</span><span className="off-amt">{p.type === "percent" ? p.value + "% off" : S.fmt(p.value) + " off"}</span></div>
                <div className="meta">{scopeLabel(S, p.scope)} · {p.uses}{p.max ? " / " + p.max : ""} used{p.expires ? " · " + (p.expires === "ended" ? "ended" : "ends " + p.expires) : " · no expiry"}</div>
              </div>
              <div className="pc-acts">
                <button className="cpy" onClick={() => { navigator.clipboard?.writeText(p.code); }} title="Copy code"><I.copy size={15} /></button>
                <label className="store-toggle" style={{ margin: 0 }} title={p.active ? "Active" : "Paused"}><input type="checkbox" checked={p.active} onChange={() => togglePromo(p.code)} /><span className="tk"></span></label>
                <button className="cpy" onClick={() => deletePromo(p.code)} title="Delete"><I.x size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {create && <CreatePromoModal onClose={() => setCreate(false)} />}
    </div>
  );
}

function CreatePromoModal({ onClose }) {
  const { S, addPromo } = useStore();
  const [code, setCode] = sxU("");
  const [type, setType] = sxU("percent");
  const [value, setValue] = sxU(10);
  const [scope, setScope] = sxU("all");
  const [max, setMax] = sxU("");
  const ok = code.trim().length >= 3 && value > 0;
  const scopes = [["all", "All products"], ["mtn", "MTN data"], ["telecel", "Telecel data"], ["atigo", "AT data"], ["airtime", "Airtime"]];
  return (
    <Modal title="New discount code" onClose={onClose}>
      <Field label="Code" icon="tag" placeholder="e.g. WEEKEND10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} hint="Customers type this at checkout — keep it short & memorable." />
      <div className="field"><label>Discount type</label>
        <div className="seg" style={{ margin: 0 }}>
          <button className={type === "percent" ? "on" : ""} onClick={() => setType("percent")}>Percent off</button>
          <button className={type === "fixed" ? "on" : ""} onClick={() => setType("fixed")}>Amount off</button>
        </div>
      </div>
      <Field label={type === "percent" ? "Percent off" : "Amount off"} pre={type === "percent" ? "%" : "GH₵"} {...useDecimalInput(value, (v) => setValue(Math.max(0, v)))} />
      <Select label="Applies to" value={scope} onChange={setScope} options={scopes} />
      <Field label="Usage limit (optional)" icon="users" inputMode="numeric" placeholder="Unlimited" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} hint="Leave blank for unlimited redemptions." />
      <button className="btn btn-pri btn-full" disabled={!ok} style={{ opacity: ok ? 1 : .5 }} onClick={() => { addPromo({ code, type, value, scope, max }); onClose(); }}><I.tag size={18} stroke="#fff" />Create code</button>
    </Modal>
  );
}

/* ============================================================
   SHARE KIT — flyers & status images for social
   ============================================================ */
function ShareKitModal({ store, onClose }) {
  const { S, toast, promos, bundlesFor } = useStore();
  const [fmt, setFmt] = sxU("status");   // status | square | flyer
  const initials = store.name.split(" ").map(s => s[0]).slice(0, 2).join("");
  const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://smartdatahubgh.com";
  const url = origin.replace(/^https?:\/\//, "") + "/" + store.handle;
  const fullUrl = origin + "/" + store.handle;
  const shortUrl = url;
  const livePromo = (promos || []).find(p => p.active);
  // a couple of headline deals from the agent's own prices
  const deals = ["mtn", "telecel", "atigo"].filter(n => store.nets[n]).slice(0, 3).map(n => {
    const bs = bundlesFor(n);                                  // admin-published list — can be any length
    const b = bs.find(x => x.id === "d5") || bs[3] || bs[0];
    return b ? { net: n, label: b.gb + "GB", price: S.storeSellOf(store, n, b) } : null;
  }).filter(Boolean);
  const caption = `🔥 ${store.name} — cheap data & airtime, delivered in seconds!\n${deals.map(d => `${S.NETWORKS[d.net].name} ${d.label} just ${S.fmt(d.price)}`).join(" · ")}\n${livePromo ? `Use code ${livePromo.code} for ${livePromo.type === "percent" ? livePromo.value + "% off" : S.fmt(livePromo.value) + " off"}! ` : ""}Order 24/7 👉 ${fullUrl}`;

  // Darken a hex colour for the background gradient.
  const shade = (hex, amt) => {
    const n = parseInt(String(hex).replace("#", ""), 16);
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
    return `rgb(${r},${g},${b})`;
  };

  // Render the selected format to a PNG on a canvas and download it — a real, shareable image.
  const downloadImage = () => {
    const sizes = { status: [1080, 1920], square: [1080, 1080], flyer: [1080, 1350] };
    const [W, H] = sizes[fmt] || sizes.status;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, store.theme); g.addColorStop(1, shade(store.theme, -46));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    const cx = W / 2;
    // store name
    ctx.fillStyle = "#fff"; ctx.font = `800 76px 'Poppins', sans-serif`;
    ctx.fillText(store.name.length > 20 ? store.name.slice(0, 19) + "…" : store.name, cx, H * 0.16);
    // headline
    ctx.font = `600 40px 'Plus Jakarta Sans', sans-serif`; ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillText(livePromo ? "Special offer — today only" : "Cheap data, delivered fast", cx, H * 0.16 + 66);
    // deals
    let y = H * 0.36;
    deals.forEach(d => {
      ctx.fillStyle = "rgba(255,255,255,.14)";
      const bw = W * 0.74, bx = cx - bw / 2, bh = 108;
      const r = 24; ctx.beginPath();
      ctx.moveTo(bx + r, y); ctx.arcTo(bx + bw, y, bx + bw, y + bh, r); ctx.arcTo(bx + bw, y + bh, bx, y + bh, r);
      ctx.arcTo(bx, y + bh, bx, y, r); ctx.arcTo(bx, y, bx + bw, y, r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = `700 46px 'Poppins', sans-serif`;
      ctx.fillText(`${S.NETWORKS[d.net].name} ${d.label}`, bx + 40, y + 68);
      ctx.textAlign = "right"; ctx.fillText(S.fmt(d.price), bx + bw - 40, y + 68);
      ctx.textAlign = "center";
      y += bh + 26;
    });
    // promo code
    if (livePromo) {
      ctx.fillStyle = "#fff"; ctx.font = `700 40px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(`Use code ${livePromo.code}`, cx, y + 40); y += 80;
    }
    // url
    ctx.fillStyle = "#fff"; ctx.font = `800 52px 'Poppins', sans-serif`;
    ctx.fillText(url, cx, H * 0.86);
    ctx.font = `500 34px 'Plus Jakarta Sans', sans-serif`; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText("Order 24/7 · instant delivery · pay with MoMo", cx, H * 0.86 + 52);
    ctx.font = `600 30px 'Plus Jakarta Sans', sans-serif`; ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.fillText("Powered by Smart Data Hub", cx, H * 0.95);

    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `${store.handle}-${fmt}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    toast("Image downloaded", "download");
  };

  return (
    <Modal title="Share kit" onClose={onClose} wide>
      <p className="muted" style={{ fontSize: 14, marginTop: -6 }}>Branded images & captions for WhatsApp status, posts and printable flyers — ready to share.</p>
      <div className="seg" style={{ margin: "14px 0 16px" }}>
        {[["status", "WhatsApp status"], ["square", "Social post"], ["flyer", "Printable flyer"]].map(([v, l]) => (
          <button key={v} className={fmt === v ? "on" : ""} onClick={() => setFmt(v)}>{l}</button>
        ))}
      </div>

      <div className="sharekit">
        {/* preview */}
        <div className="sk-stage">
          <div className={"sk-card sk-" + fmt} style={{ "--st": store.theme }}>
            <div className="sk-bg"></div>
            <div className="sk-inner">
              <div className="sk-brand">
                <div className="sk-logo">{store.logo ? <img src={store.logo} alt="" /> : initials}</div>
                <div className="sk-nm">{store.name}</div>
              </div>
              <div className="sk-head">{livePromo ? "Special offer" : "Cheap data, delivered fast"}</div>
              <div className="sk-deals">
                {deals.map(d => (
                  <div className="sk-deal" key={d.net}><NetBadge net={d.net} size={fmt === "flyer" ? 30 : 26} /><span className="dl">{d.label}</span><span className="dp">{S.fmt(d.price)}</span></div>
                ))}
              </div>
              {livePromo && <div className="sk-promo"><I.tag size={14} stroke="#fff" />Code <strong>{livePromo.code}</strong> · {livePromo.type === "percent" ? livePromo.value + "% off" : S.fmt(livePromo.value) + " off"}</div>}
              <div className="sk-foot">
                <div className="sk-qr"><PseudoQR seed={store.handle} size={fmt === "status" ? 78 : 64} /></div>
                <div className="sk-url"><div className="big">{shortUrl}</div><div className="sm">Order 24/7 · instant delivery · MoMo</div></div>
              </div>
              <div className="sk-pw"><img src={(window.__resources&&window.__resources.logoMark)||"assets/logo-mark.png"} alt="" />Powered by Smart Data Hub</div>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="sk-side">
          <button className="btn btn-pri btn-full" onClick={downloadImage}><I.download size={18} stroke="#fff" />Download image</button>
          <div className="sk-share-row">
            <button className="btn" style={{ flex: 1, background: "#12A150", color: "#fff" }} onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(caption), "_blank")}><I.whatsapp size={17} stroke="#fff" />WhatsApp</button>
          </div>

          <div className="sk-cap">
            <div className="lbl">Caption <button className="cpy" onClick={() => { navigator.clipboard?.writeText(caption); toast("Caption copied", "copy"); }}><I.copy size={13} />Copy</button></div>
            <textarea readOnly value={caption} rows={6}></textarea>
          </div>

          <div className="sk-link">
            <span className="u">{shortUrl}</span>
            <button className="cpy" onClick={() => { navigator.clipboard?.writeText("https://" + shortUrl); toast("Short link copied", "copy"); }}><I.copy size={14} />Copy link</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { CreatePromoModal, Delta, PromosCard, ShareKitModal, StoreInsights, scopeLabel };
