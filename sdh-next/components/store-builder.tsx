"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I } from "@/components/icons";
import { useStore } from "@/components/store";
import { PromosCard, ShareKitModal, StoreInsights } from "@/components/store-extras";
import { Empty, Field, NetBadge, Pill, useDecimalInput } from "@/components/ui";

/* Smart Data Hub — Agent "My Store" builder */
const { useState: stbU } = React;

// Live autosave indicator — everything you change in My Store saves on its own; this shows
// the moment it's saving and confirms when it's saved.
function SaveStatus({ state }) {
  if (state !== "saving" && state !== "saved") return null;
  const saving = state === "saving";
  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
        padding: "6px 11px", borderRadius: 999, whiteSpace: "nowrap",
        color: saving ? "var(--muted)" : "var(--ok)",
        background: saving ? "var(--bg)" : "var(--ok-bg)",
        border: "1px solid " + (saving ? "var(--line)" : "var(--ok)"),
        transition: "all .2s ease",
      }}
    >
      {saving
        ? <><span className="spin" style={{ width: 12, height: 12, borderWidth: 2 }} />Saving…</>
        : <><I.check size={13} stroke="var(--ok)" sw={3} />Saved</>}
    </span>
  );
}

function PseudoQR({ seed = "store", size = 132 }) {
  // deterministic grid of squares that reads as a QR (no external libs)
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const N = 21, cells = [];
  const rng = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
  for (let i = 0; i < N * N; i++) cells.push(rng() > 0.5);
  const finder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  return (
    <div style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, background: "#fff", padding: 6, borderRadius: 10, border: "1px solid var(--line)" }}>
      {cells.map((on, i) => {
        const r = Math.floor(i / N), c = i % N;
        const f = finder(r, c);
        const ring = f && ((r % 6 === 0 || c % 6 === 0) || (r > 1 && r < 5 && c > 1 && c < 5 && (r < N - 7 ? c < 5 : true)));
        const fill = f ? ((r === 0 || c === 0 || r === 6 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4) || (c === N - 7) || (r === N - 7)) ) : on;
        return <div key={i} style={{ background: fill ? "var(--navy)" : "transparent" }}></div>;
      })}
    </div>
  );
}

function StoreBuilderPage() {
  const { S, store, storeOrders, updateStore, setStorePrice, toggleStoreNet, previewStore, toast, earnings, goApp, storeSaveState, bundlesFor } = useStore();
  const [kit, setKit] = stbU(false);
  const [priceNet, setPriceNet] = stbU("mtn");
  const [pnOpen, setPnOpen] = stbU(false);
  // Real, shareable storefront link built from the live origin (works wherever the app
  // is deployed). Display strips the protocol; copy/open use the full URL.
  const origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "https://smartdatahubgh.com";
  const host = origin.replace(/^https?:\/\//, "");
  const url = host + "/" + store.handle;
  const fullUrl = origin + "/" + store.handle;
  const shareOnWhatsApp = () => {
    const msg = `Shop data & airtime at my store — ${store.name}: ${fullUrl}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };
  const liveCommission = storeOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.commission, 0);
  const storeCustomers = new Set(storeOrders.map(o => String(o.customer || "").replace(/\D/g, "")).filter(Boolean)).size;

  // One shared builder for the line list (S.dataLinesOf) — the storefront and the agent
  // pricing page use the same one, so a line can never appear in the shop but be unpriceable
  // here. MTN Xpress and AT BigTime are the two optional lines; the chips below toggle them.
  const priceLines = S.dataLinesOf(["mtn", "telecel", "atigo"], store);
  const curLine = priceLines.find(l => l.key === priceNet) || priceLines[0];

  const applyMarkup = (pct) => {
    bundlesFor(curLine.net, curLine.variant).forEach(b => setStorePrice(curLine.priceKey, "d" + b.gb, +(b.reseller * (1 + pct / 100)).toFixed(2)));
    toast("Applied +" + pct + "% on " + curLine.name, "tag");
  };

  return (
    <React.Fragment>
      {/* status / share */}
      <div className="card pad-lg store-status">
        <div className="ss-left">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className="store-dot" style={{ background: store.open ? "var(--ok)" : "var(--faint)" }}></span>
            <h3 style={{ fontSize: 20 }}>{store.name}</h3>
            <span className={"pill " + (store.open ? "delivered" : "")} style={store.open ? {} : { background: "var(--bg)", color: "var(--muted)" }}>{store.open ? "Live" : "Offline"}</span>
          </div>
          <div className="store-url"><I.signal size={16} stroke="var(--blue)" /><span className="u">{url}</span>
            <button className="cpy" onClick={() => { navigator.clipboard?.writeText(fullUrl); toast("Store link copied", "copy"); }}><I.copy size={15} />Copy</button>
          </div>
          <div className="store-share">
            <button className="btn btn-pri" style={{ padding: "11px 18px", fontSize: 14 }} onClick={previewStore}><I.arrow size={17} stroke="#fff" />Open my store</button>
            <button className="btn" style={{ padding: "11px 18px", fontSize: 14, background: "#12A150", color: "#fff" }} onClick={shareOnWhatsApp}><I.whatsapp size={17} stroke="#fff" />Share</button>
            {store.waChannel && <button className="btn btn-out" style={{ padding: "11px 18px", fontSize: 14 }} onClick={() => window.open(store.waChannel, "_blank")}><I.megaphone size={16} />Channel</button>}
            <button className="btn btn-out" style={{ padding: "11px 18px", fontSize: 14 }} onClick={() => setKit(true)}><I.share size={16} />Share kit</button>
            <label className="store-toggle"><input type="checkbox" checked={store.open} onChange={(e) => updateStore({ open: e.target.checked })} /><span className="tk"></span>Store {store.open ? "open" : "closed"}</label>
            <SaveStatus state={storeSaveState} />
          </div>
        </div>
        <div className="ss-stats">
          {[["Customers", storeCustomers], ["Store orders", storeOrders.length], ["Store commission", S.fmt(liveCommission)]].map(([l, v], i) => (
            <div className="m" key={i}><div className="l">{l}</div><div className="n">{v}</div></div>
          ))}
        </div>
      </div>

      <div className="grid g-2 store-builder-grid" style={{ gridTemplateColumns: "1fr 1.1fr", marginTop: 18, alignItems: "start" }}>
        {/* branding */}
        <div className="card pad-lg">
          <div className="card-h"><h3>Storefront branding</h3></div>
          <StorePreviewChip store={store} />
          <LogoUpload store={store} updateStore={updateStore} toast={toast} />
          <Field label="Store name" icon="brief" value={store.name} onChange={(e) => updateStore({ name: e.target.value })} />
          <div className="field"><label>Store link</label><div className="control"><span className="pre" style={{ fontSize: 13.5 }}>{host}/</span><input value={store.handle} onChange={(e) => updateStore({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></div><div className="hint">Your customers visit {url}</div></div>
          <Field label="Tagline" value={store.tagline} onChange={(e) => updateStore({ tagline: e.target.value })} />
          <div className="field"><label>Announcement banner</label><div className="control" style={{ height: "auto", padding: "10px 14px", alignItems: "flex-start" }}><span style={{ color: "var(--faint)", marginTop: 2 }}><I.megaphone size={18} /></span><input value={store.announcement || ""} placeholder="e.g. Weekend special — free 1GB on orders over 10GB" onChange={(e) => updateStore({ announcement: e.target.value })} /></div><div className="hint">Shows as a ribbon at the top of your store. Leave blank to hide.</div></div>
          <Field label="WhatsApp support" icon="whatsapp" pre="+233" value={store.whatsapp.replace(/^0/, "")} onChange={(e) => updateStore({ whatsapp: "0" + e.target.value.replace(/\D/g, "") })} />
          <div className="field"><label>Store colour</label>
            <div className="swatches">
              {S.STORE_THEMES.map(c => <button key={c} className={"sw" + (store.theme === c ? " on" : "")} style={{ background: c }} onClick={() => updateStore({ theme: c })} aria-label={c}>{store.theme === c && <I.check size={16} stroke="#fff" sw={3} />}</button>)}
            </div>
          </div>
        </div>

        {/* products & pricing */}
        <div className="card pad-lg">
          <div className="card-h"><h3>Products &amp; your prices</h3></div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 14 }}>Set the price your customers pay. Your <strong style={{ color: "var(--teal-ink)" }}>commission</strong> is the difference between your price and the wholesale cost — paid to you automatically on every sale.</p>

          <div className="store-nets">
            <div className="snet-group">
              <span className="lbl">Data networks</span>
              <div className="snet-chips">
                {["mtn", "telecel", "atigo"].map(n => (
                  <button key={n} className={"chip" + (store.nets[n] ? " on" : "")} onClick={() => toggleStoreNet(n)}><NetBadge net={n} size={22} />{n === "atigo" ? "AT iShare" : S.NETWORKS[n].name}{store.nets[n] && <I.check size={14} stroke="var(--ok)" sw={3} />}</button>
                ))}
                <button className={"chip" + (store.bigtime !== false ? " on" : "")} onClick={() => updateStore({ bigtime: store.bigtime === false })}><NetBadge net="atigo" size={22} />AT BigTime{store.bigtime !== false && <I.check size={14} stroke="var(--ok)" sw={3} />}</button>
                {/* MTN Xpress is opt-IN (BigTime is opt-out): it's a separate, pricier line,
                    so a store only lists it once the agent has chosen to sell it. */}
                <button className={"chip" + (store.xpress === true ? " on" : "")} onClick={() => updateStore({ xpress: store.xpress !== true })}><NetBadge net="mtn" size={22} />MTN Xpress{store.xpress === true && <I.check size={14} stroke="var(--ok)" sw={3} />}</button>
              </div>
            </div>
            <div className="snet-group">
              <span className="lbl">Other services</span>
              <div className="snet-chips">
                {/* Airtime sells at face value on every store — the customer pays the credit
                    amount and the agent earns nothing on it. It's here because shoppers
                    expect it, so it can be switched off if an agent would rather not. */}
                <button className={"chip" + (store.airtime !== false ? " on" : "")} onClick={() => updateStore({ airtime: store.airtime === false })} title="Sold at face value — you earn no commission on airtime"><I.phone size={16} />Airtime{store.airtime !== false && <I.check size={14} stroke="var(--ok)" sw={3} />}</button>
                <button className={"chip" + (store.checker !== false ? " on" : "")} onClick={() => updateStore({ checker: store.checker === false })}><I.ticket size={16} />Results Checker{store.checker !== false && <I.check size={14} stroke="var(--ok)" sw={3} />}</button>
                {/* AFA is a platform service, not an agent product — one admin-set price, no
                    commission — so it appears on every store and can't be switched off. */}
                <button className="chip on" disabled title="AFA registration appears on every store" style={{ cursor: "default" }}><I.idcard size={16} />AFA<I.check size={14} stroke="var(--ok)" sw={3} /></button>
              </div>
            </div>
          </div>

          <div className="price-net-row">
            <span className="lbl">Prices for</span>
            <div className="pn-dd">
              <button className={"pn-dd-btn" + (pnOpen ? " open" : "")} onClick={() => setPnOpen(o => !o)}>
                <NetBadge net={curLine.net} size={20} />{curLine.name}
                <I.chevd size={16} stroke="currentColor" />
              </button>
              {pnOpen && (
                <React.Fragment>
                  <div className="pn-dd-scrim" onClick={() => setPnOpen(false)}></div>
                  <div className="pn-dd-menu">
                    {priceLines.map(l => (
                      <button key={l.key} className={"pn-dd-item" + (priceNet === l.key ? " on" : "")} onClick={() => { setPriceNet(l.key); setPnOpen(false); }}>
                        <NetBadge net={l.net} size={20} />{l.name}{priceNet === l.key && <I.check size={15} stroke="var(--ok)" sw={3} />}
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              )}
            </div>
            <span className="markup-inline">
              <span className="mk-lbl">Quick markup</span>
              {[8, 12, 18, 25].map(p => <button key={p} className="mk" onClick={() => applyMarkup(p)}>+{p}%</button>)}
            </span>
          </div>

          <div className="tbl-wrap" style={{ marginTop: 8 }}>
            <table className="tbl">
              {/* "Your profit" is the agent's own margin on their own price — not a commission
                  we pay them, which is what this column used to imply. "Tier bonus" is the
                  platform payout, worked out on OUR margin, so raising a price never moves it. */}
              <thead><tr><th>Bundle</th><th>Wholesale</th><th>Your price</th><th>Your profit</th><th>Tier bonus</th></tr></thead>
              <tbody>
                {bundlesFor(curLine.net, curLine.variant).map(b => {
                  const price = S.storeSellOf(store, curLine.priceKey, b);
                  const comm = +(price - b.reseller).toFixed(2);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 15 }}>{b.gb}GB<span className="muted" style={{ fontWeight: 600, fontSize: 12, marginLeft: 6 }}>{S.validityOf(b, true)}</span></td>
                      <td className="muted">{S.fmt(b.reseller)}</td>
                      <td><StorePrice value={price} floor={b.reseller} onChange={(v) => setStorePrice(curLine.priceKey, "d" + b.gb, Math.max(v, b.reseller))} /></td>
                      <td className={"amt " + (comm >= 0 ? "amt-pos" : "")} style={comm < 0 ? { color: "var(--telecel)" } : {}}>{comm >= 0 ? "+" : ""}{S.fmt(comm)}</td>
                      <td className={"amt " + (b.tierBonus > 0 ? "amt-pos" : "")}>{b.tierBonus > 0 ? "+" + S.fmt(b.tierBonus) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}><I.info size={15} />Full price controls for every product live on the <span className="link" onClick={() => goApp("pricing")} style={{ cursor: "pointer" }}>Pricing page →</span></div>
        </div>
      </div>

      {/* insights */}
      <StoreInsights />

      {/* discount codes */}
      <PromosCard />

      {/* links & sharing */}
      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Links &amp; sharing</h3></div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: -10, marginBottom: 16 }}>A short, branded link and your social handles make your store easy to share on status, bios and flyers.</p>
        <div className="field"><label>WhatsApp Channel link</label><div className="control"><span style={{ color: "var(--faint)" }}><I.megaphone size={18} /></span><input value={store.waChannel || ""} placeholder="https://whatsapp.com/channel/…" onChange={(e) => updateStore({ waChannel: e.target.value })} /></div><div className="hint">Broadcast deals &amp; restocks. Shows a “Join channel” button on your store.</div></div>
      </div>

      {/* store orders */}
      <div className="card pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>Recent store orders</h3>{storeOrders.length > 0 && <span className="link" onClick={() => goApp("store-orders")}>Manage all orders</span>}</div>
        {storeOrders.length === 0 ? (
          <Empty icon="receipt" title="No store orders yet" sub="When a customer buys through your store link, their order shows up here." />
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>They paid</th><th>Your commission</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {storeOrders.slice(0, 5).map(o => (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => goApp("store-orders")}>
                  <td><div className="netcell"><NetBadge net={o.net} /><div><div>{o.pkg}</div><div className="mono">{o.id}</div></div></div></td>
                  <td className="mono">{o.customer}</td>
                  <td className="amt">{S.fmt(o.price)}</td>
                  <td className="amt amt-pos">+{S.fmt(o.commission)}</td>
                  <td><Pill status={o.status} /></td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{S.ago(o.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {kit && <ShareKitModal store={store} onClose={() => setKit(false)} />}
    </React.Fragment>
  );
}

function StorePrice({ value, onChange, floor }) {
  const below = floor != null && value < floor;
  const clamp = () => { if (floor != null && value < floor) onChange(+floor.toFixed(2)); };
  // The raw text is held while typing so a decimal point survives; clamping to the cost floor
  // still runs on blur, after the draft is released.
  const input = useDecimalInput(value, onChange, { onBlur: clamp });
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1.5px solid " + (below ? "var(--telecel)" : "var(--line-2)"), borderRadius: 11, padding: "6px 10px", background: "var(--surface)" }} title={below ? "Below your cost — will snap to the floor" : undefined}>
      <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 12.5 }}>GH₵</span>
      <input {...input} style={{ border: "none", outline: "none", width: 52, fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 14, color: below ? "var(--telecel)" : "var(--blue-700)", background: "none" }} />
    </div>
  );
}

function StorePreviewChip({ store }) {
  const initials = store.name.split(" ").map(s => s[0]).slice(0, 2).join("");
  return (
    <div className="store-preview" style={{ background: store.theme }}>
      <div className="sp-bar"><span></span><span></span><span></span></div>
      {store.announcement && <div className="sp-ann"><I.megaphone size={13} stroke="#fff" />{store.announcement}</div>}
      <div className="sp-body">
        <div className="sp-logo" style={{ color: store.theme, overflow: "hidden", padding: store.logo ? 0 : undefined }}>{store.logo ? <img src={store.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}</div>
        <div className="sp-name">{store.name}</div>
        <div className="sp-tag">{store.tagline}</div>
      </div>
    </div>
  );
}

function LogoUpload({ store, updateStore, toast }) {
  const inputRef = React.useRef(null);
  const pick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast("Logo too large — keep it under 1.5MB", "info"); return; }
    const reader = new FileReader();
    reader.onload = () => { updateStore({ logo: reader.result }); toast("Logo updated", "check"); };
    reader.readAsDataURL(file);
  };
  return (
    <div className="field">
      <label>Store logo</label>
      <div className="logo-upload">
        <div className="logo-thumb" style={{ background: store.logo ? "var(--surface)" : store.theme }}>
          {store.logo ? <img src={store.logo} alt="logo" /> : <I.image size={22} stroke="#fff" />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-out" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={() => inputRef.current && inputRef.current.click()}><I.image size={16} />{store.logo ? "Replace" : "Upload logo"}</button>
            {store.logo && <button className="btn btn-ghost" style={{ padding: "9px 15px", fontSize: 13.5 }} onClick={() => updateStore({ logo: null })}>Remove</button>}
          </div>
          <div className="hint" style={{ margin: 0 }}>Square PNG or JPG, under 1.5MB. Falls back to your initials.</div>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} style={{ display: "none" }} />
      </div>
    </div>
  );
}

export { LogoUpload, PseudoQR, StoreBuilderPage, StorePreviewChip, StorePrice };
