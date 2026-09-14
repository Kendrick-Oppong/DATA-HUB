"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { D } from "@/components/how-to";
import { I, Ic } from "@/components/icons";
import { DeliveryStatus, StoreHowToModal, StoreWhatsNewModal, TrackOrderModal } from "@/components/order-tracking";
import { useStore } from "@/components/store";
import { Field, Modal, NetBadge, Select } from "@/components/ui";

/* Smart Data Hub — public AGENT STOREFRONT (customer-facing, guest checkout)
   Sells what the agent offers: data, airtime, results checkers, AFA registration, utilities.
   Data and AIRTIME are really fulfilled (data via DataHub Ghana, airtime via Muviin)
   and paid through Paystack. Airtime sells at FACE VALUE with no agent margin — it's there
   because customers expect it on a store, not because it earns the agent anything. */
const { useState: sfU, useEffect: sfE } = React;

function Storefront() {
  const { S, store, promos, storeOrders, exitStore, publicMode, bundlesFor, checkers } = useStore();
  // Admin-published checker prices (via /api/pricing, which is public so guests get them
  // too). This used to read the S.checkerProducts catalog, whose placeholder prices have no
  // relationship to what's published — so the same voucher was one price in the app and
  // another on a store, and an agent's own markup was applied on top of a stale base.
  const checkerProducts = (checkers || []).filter(p => p.available !== false);
  // True while every utility is still flagged `comingSoon` in lib/data.ts — lets the section
  // and the link into it say so up front, instead of a customer discovering it card by card.
  const utilitiesAllSoon = S.UTILITY_ORDER.every(id => S.UTILITIES[id]?.comingSoon);
  const heroPromo = (promos || []).find(p => p.active && p.scope === "all");
  const [track, setTrack] = sfU(null);   // null | "" | orderId  (open Track modal)
  const [whatsNew, setWhatsNew] = sfU(false);
  const [howto, setHowto] = sfU(false);
  const [checkout, setCheckout] = sfU(null);
  const [payNotice, setPayNotice] = sfU("");   // banner after returning from Paystack
  const [afaNotice, setAfaNotice] = sfU(null); // banner after returning from an AFA payment
  const [view, setView] = sfU("home");   // home | <net> | checker | utilities | afa

  // Returned from Paystack after a real DATA purchase: the callback redirects to
  // /<handle>?storepay=success|pending|failed[&ref=SO-…]. On success open live tracking for
  // the new order; otherwise show a short notice. Then strip the query so a refresh is clean.
  sfE(() => {
    if (!publicMode) return;
    const q = new URLSearchParams(window.location.search);
    const sp = q.get("storepay");
    if (!sp) return;
    const ref = q.get("ref") || "";
    if (sp === "success") setTrack(ref || "");
    else if (sp === "pending") setPayNotice("Payment wasn’t completed — you weren’t charged. You can try again.");
    else setPayNotice("Payment didn’t go through. Please try again.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Same, for an AFA registration paid on this store: /<handle>?afapay=success[&ref=AFA-…].
  // There's nothing to track — it goes to our review queue — so we confirm and say what next.
  sfE(() => {
    if (!publicMode) return;
    const q = new URLSearchParams(window.location.search);
    const ap = q.get("afapay");
    if (!ap) return;
    const ref = q.get("ref") || "";
    if (ap === "success") setAfaNotice({ tone: "ok", text: `Registration submitted${ref ? ` · ${ref}` : ""}. It's now under review — we'll text you once it's approved.` });
    else if (ap === "pending") setAfaNotice({ tone: "warn", text: "Payment wasn’t completed — you weren’t charged. You can try again." });
    else setAfaNotice({ tone: "warn", text: "Payment didn’t go through. Please try again." });
    setView("afa");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
  const nets = ["mtn", "telecel", "atigo"].filter(n => store.nets[n]);
  // Every line this store sells, from the one shared builder (S.dataLinesOf) so the
  // storefront, My Store and the agent pricing page can't disagree about which lines exist.
  const dataLines = S.dataLinesOf(nets, store)
    .filter(l => bundlesFor(l.net, l.variant).length);   // hide a line with no published bundles
  const lineFor = (k) => dataLines.find(l => l.key === k);
  // Airtime follows the store's network toggles, but not its data-bundle publishing: a
  // network with no bundles can still sell credit.
  const airtimeNets = nets;
  const initials = store.name.split(" ").map(s => s[0]).slice(0, 2).join("");
  // The AFA fee is set by admins, not by this store — fetch the live one so the storefront
  // can never advertise a price different from what the server will actually charge.
  const [afaPrice, setAfaPrice] = sfU(S.afaInfo.suggested);
  sfE(() => {
    if (!store.handle) return;
    let alive = true;
    fetch(`/api/store/${encodeURIComponent(store.handle)}/afa`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d && typeof d.price === "number") setAfaPrice(d.price); })
      .catch(() => {});
    return () => { alive = false; };
  }, [store.handle]);
  const fromOf = (line) => { const bs = bundlesFor(line.net, line.variant); return Math.min(...bs.map(b => S.storeSellOf(store, line.priceKey, b))); };
  const delivered = (storeOrders || []).filter(o => o.status === "delivered").sort((a, b) => (b.deliveredAt || b.at) - (a.deliveredAt || a.at));
  const latest = delivered[0];
  const lastTime = latest ? S.timeOnly(latest.deliveredAt || latest.at) : null;
  const back = () => { setView("home"); };
  // Real contact links from the agent's own store settings.
  const waNum = (store.whatsapp || "").replace(/\D/g, "").replace(/^0/, "");
  const waLink = "https://wa.me/233" + waNum;
  const telLink = "tel:" + (store.whatsapp || "").replace(/\s/g, "");

  if (!store.open) {
    return (
      <div className="sf" style={{ "--st": store.theme }}>
        <StorefrontHeader store={store} initials={initials} onExit={publicMode ? null : exitStore} onTrack={() => setTrack("")} />
        <div className="sf-wrap"><div className="empty" style={{ padding: "80px 20px" }}><div className="ic"><I.clock size={28} /></div><h2 style={{ fontFamily: "var(--ff-display)", fontSize: 24 }}>Store is currently closed</h2><p style={{ marginTop: 8 }}>Please check back soon — or message us on WhatsApp.</p></div></div>
        {track !== null && <TrackOrderModal store={store} initialId={track} onClose={() => setTrack(null)} />}
      </div>
    );
  }

  return (
    <div className="sf" style={{ "--st": store.theme }}>
      <StorefrontHeader store={store} initials={initials} onExit={publicMode ? null : exitStore} onTrack={() => setTrack("")} />

      <div className="sf-wrap sf-shop-wrap">
        {payNotice && (
          <div className="sf-card-warn" style={{ marginBottom: 16 }}>
            <span className="ic"><I.info size={18} stroke="#F59E0B" /></span>
            <div style={{ flex: 1 }}><div className="t">Payment not completed</div><p>{payNotice}</p></div>
            <button className="sf-exit" style={{ color: "var(--muted)" }} onClick={() => setPayNotice("")}><I.x size={16} stroke="currentColor" /></button>
          </div>
        )}
        {view === "home" && latest && (
          <div className="sf-latest">
            <div className="sf-latest-h"><span className="live"></span>Latest {S.NETWORKS[latest.net].name} successful order</div>
            <DeliveryStatus order={latest} compact title={`${latest.pkg} — delivered`} />
          </div>
        )}

        <div className="sf-cols">
          <main className="sf-main">
            {view === "home" ? (
              <React.Fragment>
                <div className="sf-hero-card">
                  <div className="t"><h2>Buy data instantly</h2><p>Fast &amp; reliable — delivered to your phone in seconds</p></div>
                  <span className="ib"><I.bolt size={14} stroke="#fff" />Instant</span>
                </div>
                {heroPromo && <div className="sf-promo-strip"><I.tag size={15} stroke="var(--st)" />Use code <strong>{heroPromo.code}</strong> for {heroPromo.type === "percent" ? heroPromo.value + "% off" : S.fmt(heroPromo.value) + " off"} at checkout</div>}

                <div className="sf-rows-h"><span className="n">1</span>Tap a network</div>
                <div className="sf-rows">
                  {dataLines.map(line => (
                    <button className="sf-row2" key={line.key} style={{ "--net": S.NETWORKS[line.net].color }} onClick={() => setView(line.key)}>
                      <span className="ic"><NetBadge net={line.net} size={40} /></span>
                      <div className="m"><div className="t">{line.name} data</div><div className="s">{line.sub || `${bundlesFor(line.net, line.variant).length} bundles available`}</div></div>
                      <div className="fr"><span className="lbl">FROM</span><span className="v">{S.fmt(fromOf(line))}</span></div>
                      <span className="ch"><I.arrow size={18} stroke="currentColor" /></span>
                    </button>
                  ))}
                </div>

                <div className="sf-rows-h"><span className="n">2</span>More services</div>
                <div className="sf-rows">
                  {/* Airtime sells at face value — GH₵10 of credit costs GH₵10 — so unlike
                      data there's no "from" price to advertise and no agent margin in it. */}
                  {store.airtime !== false && airtimeNets.length > 0 && (
                    <button className="sf-row2" onClick={() => setView("airtime")}>
                      <span className="ic ic-tint"><I.phone size={20} stroke="var(--st)" /></span>
                      <div className="m"><div className="t">Airtime top-up</div><div className="s">{airtimeNets.map(n => S.NETWORKS[n].name).join(" · ")} · face value</div></div>
                      <span className="ch"><I.arrow size={18} stroke="currentColor" /></span>
                    </button>
                  )}
                  {store.utilities !== false && (
                    <button className="sf-row2" onClick={() => setView("utilities")}>
                      <span className="ic ic-tint"><I.receipt size={20} stroke="var(--st)" /></span>
                      <div className="m"><div className="t">Utilities &amp; bills{utilitiesAllSoon && <span className="sf-soon-tag">Coming soon</span>}</div><div className="s">Electricity, water, TV &amp; streaming</div></div>
                      <span className="ch"><I.arrow size={18} stroke="currentColor" /></span>
                    </button>
                  )}
                  {store.checker !== false && (
                    <button className="sf-row2" onClick={() => setView("checker")}>
                      <span className="ic ic-tint"><I.ticket size={20} stroke="var(--st)" /></span>
                      <div className="m"><div className="t">Results checkers</div><div className="s">BECE &amp; WASSCE · {checkerProducts.length} available</div></div>
                      <span className="ch"><I.arrow size={18} stroke="currentColor" /></span>
                    </button>
                  )}
                  {/* Always shown: AFA is a platform service with one admin-set price and no
                      agent commission, so it isn't a per-store product an agent opts out of. */}
                  <button className="sf-row2" onClick={() => setView("afa")}>
                    <span className="ic ic-tint"><I.idcard size={20} stroke="var(--st)" /></span>
                    <div className="m"><div className="t">MTN AFA registration</div><div className="s">Cheap voice &amp; SMS on registered numbers</div></div>
                    <div className="fr"><span className="lbl">FEE</span><span className="v">{S.fmt(afaPrice)}</span></div>
                    <span className="ch"><I.arrow size={18} stroke="currentColor" /></span>
                  </button>
                </div>

                <button className="sf-track-btn" onClick={() => setTrack("")}><I.search size={17} stroke="currentColor" />Track my order</button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <button className="sf-back" onClick={back}><I.back size={18} stroke="currentColor" />All services</button>

        {/* AIRTIME */}
        {view === "airtime" && <StoreAirtimePicker store={store} nets={airtimeNets} onBuy={setCheckout} />}

        {/* RESULTS CHECKER */}
        {view === "checker" && (
          <React.Fragment>
            <div className="sf-sec-h"><h2>Results checkers</h2><span className="cap">PIN &amp; serial delivered by SMS</span></div>
            <div className="sf-grid">
              {checkerProducts.map(p => {
                const q = S.agentQuote(store, "checker", { p });
                return (
                  <button className="sf-card" key={p.id} onClick={() => setCheckout({ kind: "checker", net: "mtn", product: p, price: q.sell, cost: p.cost, pkg: p.name })}>
                    <div className="ic-top"><I.ticket size={24} stroke="currentColor" /></div>
                    <div className="title">{p.name}</div>
                    <div className="sub">{p.body}</div>
                    <div className="sf-card-foot"><div className="pr">{S.fmt(q.sell)}</div><span className="go"><I.arrow size={17} stroke="currentColor" /></span></div>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        )}

        {/* AFA REGISTRATION */}
        {view === "afa" && (
          <div className="sf-afa">
            <div className="sf-afa-card">
              <div className="sf-afa-icon" style={{ background: store.theme }}><I.idcard size={30} stroke="#fff" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 20 }}>MTN AFA Registration</h3><span className="pill approved" style={{ fontSize: 11 }}>MTN</span></div>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>{S.afaInfo.blurb} <span style={{ color: "var(--ink)", fontWeight: 600 }}>{S.afaInfo.partner}</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  {S.afaInfo.packages.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", border: "1px solid var(--line)", borderRadius: 9, padding: "7px 11px", fontSize: 12.5 }}>
                      <strong style={{ fontFamily: "var(--ff-display)", flexShrink: 0 }}>{p.price}</strong>
                      <span className="muted" style={{ fontWeight: 600 }}>{p.what}</span>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Verification takes 1 to 3 working days. To buy a package afterwards, dial <strong style={{ color: "var(--ink)" }}>{S.afaInfo.ussd}</strong> on the registered number.</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24, color: store.theme }}>{S.fmt(afaPrice)}</div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>one-time</div>
              </div>
            </div>
            {afaNotice && (
              <div className="sf-card-warn" style={{ marginTop: 16, ...(afaNotice.tone === "ok" ? { background: "var(--teal-050)", borderColor: "rgba(14,158,146,.25)" } : {}) }}>
                <span className="ic"><I.info size={18} stroke={afaNotice.tone === "ok" ? "var(--teal-ink)" : "#F59E0B"} /></span>
                <div style={{ flex: 1 }}><div className="t">{afaNotice.tone === "ok" ? "Registration received" : "Payment not completed"}</div><p>{afaNotice.text}</p></div>
                <button className="sf-exit" style={{ color: "var(--muted)" }} onClick={() => setAfaNotice(null)}><I.x size={16} stroke="currentColor" /></button>
              </div>
            )}
            {/* The registration form itself, right on the store — no account needed, paid by
                mobile money. The fee is set by Smart Data Hub, not the agent. */}
            {afaNotice?.tone !== "ok" && <StoreAfaForm store={store} price={afaPrice} />}
          </div>
        )}

        {/* UTILITIES & BILLS */}
        {view === "utilities" && (
          <React.Fragment>
            <div className="sf-sec-h"><h2>Utilities &amp; bills</h2><span className="cap">{utilitiesAllSoon ? "Coming soon — not yet available to buy" : "Electricity, water, TV & streaming"}</span></div>
            <div className="sf-grid">
              {S.UTILITY_ORDER.map(id => {
                const u = S.UTILITIES[id];
                let from;
                if (u.amounts) from = S.agentQuote(store, "meter", { id, amount: u.amounts[0] }).sell;
                else if (u.kind === "package") from = Math.min(...u.packages.map(p => S.agentQuote(store, "dstv", { p }).sell));
                else from = Math.min(...u.plans.map(p => S.agentQuote(store, "stream", { p }).sell));
                // `comingSoon` is set per utility in lib/data.ts and is already honoured by
                // the in-app view (components/utilities.tsx). The storefront used to ignore
                // it, so a customer could "check out" a utility that has no provider behind
                // it and get a delivered confirmation for something nobody would ever send.
                // Inert card, no checkout — flip the flag in data.ts to bring one live on
                // both surfaces at once.
                const soon = !!u.comingSoon;
                return (
                  <button
                    className={"sf-card" + (soon ? " sf-card-soon" : "")}
                    key={id}
                    disabled={soon}
                    aria-disabled={soon}
                    style={{ "--net": S.NETWORKS[id].color, "--net-ink": S.NETWORKS[id].ink }}
                    onClick={() => { if (!soon) setCheckout({ kind: "utility", utility: u, net: id, price: from, pkg: u.name }); }}
                  >
                    <div className="ic-top" style={{ background: "transparent" }}><NetBadge net={id} size={44} /></div>
                    <div className="title">{u.short}</div>
                    <div className="sub">{u.tagline}</div>
                    <div className="sf-card-foot">
                      {soon
                        ? <span className="sf-soon">Coming soon</span>
                        : <React.Fragment><div className="pr"><span className="from">from</span>{S.fmt(from)}</div><span className="go"><I.arrow size={17} stroke="currentColor" /></span></React.Fragment>}
                    </div>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        )}

        {/* DATA (network / AT product lines) */}
        {lineFor(view) && (() => {
          const line = lineFor(view);
          const isBig = line.variant === "bigtime";
          return (
            <React.Fragment>
              <div className="sf-sec-h"><h2>{line.name} data bundles</h2><span className="cap">{isBig ? "Never expires · pay with MoMo" : "Delivered instantly · pay with MoMo"}</span></div>
              <div className="sf-grid">
                {bundlesFor(line.net, line.variant).map(b => {
                  const price = S.storeSellOf(store, line.priceKey, b);
                  const vd = S.validityOf(b);
                  const noExp = vd === "No expiry";
                  const pkg = S.pkgOf(b, line.net, line.variant);
                  return (
                    <button className="sf-card" key={b.id} style={{ "--net": S.NETWORKS[line.net].color, "--net-ink": S.NETWORKS[line.net].ink }} onClick={() => setCheckout({ kind: "data", net: line.net, variant: line.variant, priceKey: line.priceKey, bundle: b, price, pkg })}>
                      {b.tag && <span className="sf-tag">{b.tag}</span>}
                      <div className="gb">{b.gb}<small>GB</small></div>
                      <span className="vd">{noExp ? <React.Fragment><I.shield size={12} stroke="currentColor" />{vd}</React.Fragment> : <React.Fragment><I.clock size={12} stroke="currentColor" />{vd}</React.Fragment>}</span>
                      <div className="sf-card-foot"><div className="pr">{S.fmt(price)}</div><span className="go"><I.arrow size={17} stroke="currentColor" /></span></div>
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })()}
              </React.Fragment>
            )}
          </main>

          <aside className="sf-side">
            <div className="sf-card-warn"><span className="ic"><I.info size={18} stroke="#F59E0B" /></span><div><div className="t">Verify before you pay</div><p>Orders sent to the wrong number or network can’t be refunded. Double-check the phone number and network before you pay.</p></div></div>
            <div className="sf-side-card">
              <h4>Why buy from us?</h4>
              <div className="wb"><span className="ic" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}><I.checkc size={18} stroke="currentColor" /></span><div><div className="t">Guaranteed delivery</div><p>Data lands every time — or we refund you, no questions.</p></div></div>
              <div className="wb"><span className="ic" style={{ background: "color-mix(in srgb, var(--st) 16%, transparent)", color: "var(--st)" }}><I.bolt size={18} stroke="currentColor" /></span><div><div className="t">Fast delivery</div><p>Most orders delivered in 2–10 minutes, 24/7.</p></div></div>
              <div className="wb"><span className="ic" style={{ background: "var(--teal-050)", color: "var(--teal-ink)" }}><I.shield size={18} stroke="currentColor" /></span><div><div className="t">Secure payments</div><p>Encrypted, safe mobile-money checkout every time.</p></div></div>
            </div>
            <div className="sf-side-card">
              <h4>Get in touch</h4>
              <button className="btn btn-full" style={{ background: "#12A150", color: "#fff" }} onClick={() => window.open(waLink, "_blank")}><I.whatsapp size={18} stroke="#fff" />WhatsApp us</button>
              <a className="sf-contact" href={telLink}><I.phone size={16} stroke="currentColor" />{store.whatsapp}</a>
            </div>
          </aside>
        </div>
      </div>

      <footer className="sf-foot2">
        <div className="sf-wrap sf-foot-grid">
          <div className="fcol">
            <div className="powered"><img src={(window.__resources&&window.__resources.logoMark)||"assets/logo-mark.png"} alt="" /><strong>{store.name}</strong></div>
            <p>Report any order not received within 24 hours of purchase. Join our WhatsApp Channel for price drops and updates.</p>
          </div>
          <div className="fcol">
            <h4>Quick links</h4>
            <button onClick={back}>Home</button>
            <button onClick={() => setTrack("")}>Track order</button>
            <button onClick={() => setHowto(true)}>How to buy</button>
            <button onClick={() => setWhatsNew(true)}>What’s new</button>
            {store.waChannel && <a href={store.waChannel} target="_blank" rel="noopener noreferrer">WhatsApp Channel</a>}
          </div>
          <div className="fcol">
            <h4>Contact</h4>
            <a href={telLink}><I.phone size={14} stroke="currentColor" />{store.whatsapp}</a>
            <a href={waLink} target="_blank" rel="noopener noreferrer"><I.whatsapp size={14} stroke="currentColor" />WhatsApp us</a>
          </div>
        </div>
        <div className="sf-wrap sf-foot-base">
          <span>© 2026 {store.name}. Powered by Smart Data Hub.</span>
          {lastTime && <span>Last delivered order: today, {lastTime}</span>}
        </div>
      </footer>

      {checkout && <StoreCheckout item={checkout} store={store} onClose={() => setCheckout(null)} />}
      {track !== null && <TrackOrderModal store={store} initialId={track} onClose={() => setTrack(null)} />}
      {whatsNew && <StoreWhatsNewModal store={store} onClose={() => setWhatsNew(false)} />}
      {howto && <StoreHowToModal store={store} onClose={() => setHowto(false)} />}
    </div>
  );
}

// AFA numbers are captured in LOCAL form only — 0 followed by 9 digits, e.g. 0509379146.
// A +233 / 233 number is rejected with a clear hint rather than silently rewritten, because
// the number captured is submitted to MTN exactly as entered. Mirrors strictLocalGhPhone().
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
// Digits only, so a "+" can never be typed or pasted in.
const afaPhoneInput = (v) => String(v || "").replace(/\D/g, "").slice(0, 12);

// Mirrors validateGhanaCard() in lib/server/ghanaCard.ts for instant feedback. The server
// still decides — this only saves a wasted round trip and a Paystack redirect.
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

// AFA registration on a public storefront. A guest fills this in and pays the ADMIN-set fee
// by mobile money; the registration is created only once Paystack confirms, then reviewed by
// our team. The agent earns nothing on it and cannot change the price.
function StoreAfaForm({ store, price }) {
  const { S, toast } = useStore();
  const [name, setName] = sfU("");
  const [phone, setPhone] = sfU("");
  const [idNum, setIdNum] = sfU("");
  const [location, setLocation] = sfU("");
  const [dob, setDob] = sfU("");
  const [occ, setOcc] = sfU("");
  const [busy, setBusy] = sfU(false);

  const cardError = checkGhanaCard(idNum);
  const phoneError = checkAfaPhone(phone);
  const ok = name.trim() && afaPhoneOk(phone) && idNum.trim() && !cardError
    && location.trim() && dob.trim() && occ.trim() && !busy;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/store/${encodeURIComponent(store.handle)}/afa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), phone: phone.trim(), ghanaCard: idNum.trim(),
          location: location.trim(), occupation: occ.trim(), dob: dob.trim(),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast(d.error || "Could not start the registration", "info"); setBusy(false); return; }
      window.location.href = d.authorizationUrl;   // Paystack hosted checkout
    } catch (e) {
      toast("Could not start the registration. Please try again.", "info");
      setBusy(false);
    }
  };

  return (
    <div className="sf-card" style={{ marginTop: 16, padding: "18px 20px", border: "1px solid var(--line)", borderRadius: 16 }}>
      <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17 }}>Registration Form</div>
      <p className="muted" style={{ fontSize: 13, marginTop: 3, marginBottom: 14, lineHeight: 1.5 }}>
        Fill in the applicant's details exactly as they appear on the Ghana Card. Your registration is reviewed by our team, and you'll be notified by SMS once it's approved.
      </p>

      <Field label="Full Name *" icon="user" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Phone Number *" icon="phone" inputMode="numeric" placeholder="e.g., 0509379146" value={phone} onChange={(e) => setPhone(afaPhoneInput(e.target.value))} hint={phoneError} error={!!phoneError} />
      <Field label="Location *" icon="pin" placeholder="e.g., Accra, Kumasi" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Field label="Occupation *" icon="brief" placeholder="e.g., Teacher, Trader, Student" value={occ} onChange={(e) => setOcc(e.target.value)} />
      <Field label="Date of Birth *" icon="clock" inputMode="numeric" placeholder="dd/mm/yyyy" value={dob} onChange={(e) => setDob(e.target.value)} />
      <Field label="Ghana Card ID Number *" icon="idcard" placeholder="GHA-XXXXXXXXX-X" value={idNum} onChange={(e) => setIdNum(e.target.value)} hint={cardError} error={!!cardError} />

      <div className="summary" style={{ marginTop: 6 }}>
        <div className="row" style={{ borderBottom: "none" }}>
          <span className="k"><strong style={{ color: "var(--ink)" }}>Registration Fee</strong><br /><span className="muted" style={{ fontSize: 12.5 }}>One-time payment to complete your AFA registration</span></span>
          <span className="v" style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>{S.fmt(price)}</span>
        </div>
      </div>

      <button className="btn btn-full" disabled={!ok} style={{ background: store.theme, color: "#fff", padding: "12px 22px", marginTop: 12, opacity: ok ? 1 : .5 }} onClick={submit}>
        <I.idcard size={18} stroke="#fff" />{busy ? "Starting payment…" : "Register & pay " + S.fmt(price)}
      </button>
      <p className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
        Double-check every detail before paying — the registration fee is non-refundable.
      </p>
    </div>
  );
}

function StorefrontHeader({ store, initials, onExit, onTrack }) {
  const waLink = "https://wa.me/233" + (store.whatsapp || "").replace(/\D/g, "").replace(/^0/, "");
  return (
    <header className="sf-head" style={{ background: store.theme }}>
      <div className="sf-wrap sf-head-row">
        <div className="sf-brand">
          <div className="sf-logo">{store.logo ? <img src={store.logo} alt="" /> : initials}</div>
          <div><div className="nm">{store.name}</div><div className="hd">Powered by {store.name}</div></div>
        </div>
        <div className="sf-head-cta">
          {/* Only when there's somewhere to go back TO — i.e. the agent previewing their own
              store from inside the app. A guest on the public /<handle> store gets no Back
              button at all: it led out of the agent's shop to the Smart Data Hub homepage,
              which is the last place a store owner wants their customer sent. */}
          {onExit && <button className="wa-mini" onClick={onExit} title="Back to Smart Data Hub"><I.back size={18} stroke="#fff" /><span>Back</span></button>}
          <button className="wa-mini" onClick={onTrack} title="Track your order"><I.search size={18} stroke="#fff" /><span>Track order</span></button>
          {store.waChannel && <a className="wa-mini" href={store.waChannel} target="_blank" rel="noopener noreferrer" title="Join our WhatsApp Channel"><I.megaphone size={18} stroke="#fff" /><span>Channel</span></a>}
          <a className="wa-mini" href={waLink} target="_blank" rel="noopener noreferrer"><I.whatsapp size={18} stroke="#fff" /><span>WhatsApp</span></a>
        </div>
      </div>
      {store.announcement && <div className="sf-ann"><div className="sf-wrap" style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center" }}><I.megaphone size={16} stroke="#fff" /><span>{store.announcement}</span></div></div>}
    </header>
  );
}

// Airtime picker: choose a network and an amount. Deliberately plain — airtime has one
// price (the amount itself), so there is nothing to compare and no margin to display.
// MIN/MAX mirror Muviin's own GH₵1–500 limit, which the server re-checks before charging.
const AIRTIME_MIN = 1, AIRTIME_MAX = 500;
function StoreAirtimePicker({ store, nets, onBuy }) {
  const { S } = useStore();
  const [net, setNet] = sfU(nets[0] || "mtn");
  const [amount, setAmount] = sfU(5);
  const [custom, setCustom] = sfU("");

  const picked = custom !== "" ? Number(custom) : amount;
  const valid = Number.isFinite(picked) && picked >= AIRTIME_MIN && picked <= AIRTIME_MAX;

  return (
    <React.Fragment>
      <div className="sf-sec-h"><h2>Airtime top-up</h2><span className="cap">Sold at face value — no extra charge</span></div>

      <div className="sf-rows" style={{ marginBottom: 18 }}>
        {nets.map(n => (
          <button className={"sf-row2" + (net === n ? " on" : "")} key={n} style={{ "--net": S.NETWORKS[n].color, ...(net === n ? { borderColor: "var(--st)" } : {}) }} onClick={() => setNet(n)}>
            <span className="ic"><NetBadge net={n} size={40} /></span>
            <div className="m"><div className="t">{S.NETWORKS[n].name}</div><div className="s">Instant top-up</div></div>
            {net === n && <span className="ch"><I.check size={18} stroke="var(--st)" /></span>}
          </button>
        ))}
      </div>

      <div className="sf-sec-h" style={{ marginTop: 0 }}><h2 style={{ fontSize: 17 }}>Choose an amount</h2></div>
      <div className="sf-grid">
        {S.AIRTIME_PICKS.map(a => (
          <button className="sf-card" key={a} onClick={() => { setAmount(a); setCustom(""); }}
            style={picked === a && custom === "" ? { borderColor: "var(--st)" } : {}}>
            <div className="title" style={{ fontSize: 20 }}>{S.fmt(a)}</div>
            <div className="sub">airtime</div>
          </button>
        ))}
      </div>

      <div className="field" style={{ marginTop: 16, maxWidth: 320 }}>
        <label>Or enter another amount</label>
        <div className="control"><span className="pre">GH₵</span>
          <input inputMode="decimal" placeholder="e.g. 15" value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
        <div className="hint">Between {S.fmt(AIRTIME_MIN)} and {S.fmt(AIRTIME_MAX)}</div>
      </div>

      <button className="btn btn-pri btn-full" style={{ marginTop: 16, maxWidth: 320, opacity: valid ? 1 : .5 }} disabled={!valid}
        onClick={() => onBuy({ kind: "airtime", net, amount: picked, pkg: S.airtimePkg ? S.airtimePkg(picked) : `${S.fmt(picked)} airtime`, price: picked, cost: picked })}>
        <I.phone size={18} stroke="#fff" />Buy {S.fmt(valid ? picked : 0)} airtime
      </button>
    </React.Fragment>
  );
}

function StoreCheckout({ item, store, onClose }) {
  const { S, placeStoreOrder, completeStoreOrder, promos, redeemPromo, payStoreOrderMomo } = useStore();
  const [step, setStep] = sfU("form");   // form | momo | processing | done
  const [recipient, setRecipient] = sfU("");
  const [payPhone, setPayPhone] = sfU("");   // mobile-money number the customer pays FROM
  const [payErr, setPayErr] = sfU("");
  // MTN refused this recipient before and it isn't on the beneficiary list yet. Shown as a
  // dialog rather than the inline error, because the guest must change the number to proceed.
  const [benBlock, setBenBlock] = sfU(null);
  const [name, setName] = sfU("");
  const [prof, setProf] = sfU(S.afaInfo.professions[0]);
  const [qty, setQty] = sfU(1);
  const [momoNet, setMomoNet] = sfU(["mtn", "telecel", "atigo"].includes(item.net) ? item.net : "mtn");
  const [order, setOrder] = sfU(null);
  const [utilAmt, setUtilAmt] = sfU(item.utility && item.utility.amounts ? (item.utility.amounts[1] || item.utility.amounts[0]) : 0);
  const [utilSel, setUtilSel] = sfU(null);
  const [promoInput, setPromoInput] = sfU("");
  const [appliedPromo, setAppliedPromo] = sfU(null);
  const [promoErr, setPromoErr] = sfU("");
  // For DATA the server owns the discounted total (a code is capped at the agent's margin,
  // which a guest can't see), so we hold its answer rather than working it out here.
  const [serverQuote, setServerQuote] = sfU(null);
  // The authoritative price with NO discount code, fetched as soon as the checkout opens. The
  // storefront page can be minutes or hours old — an agent may have repriced since it loaded,
  // or the browser may be showing a cached copy — so the figure rendered locally from the
  // store config is only ever a starting guess. Quoting up front means the customer sees the
  // real price from the first screen instead of being stopped at the payment step.
  const [baseQuote, setBaseQuote] = sfU(null);
  // Set when the price moved while the customer was in the checkout. Phrased for a shopper,
  // shown calmly next to the total — never as a payment failure.
  const [priceNote, setPriceNote] = sfU("");
  const [promoBusy, setPromoBusy] = sfU(false);

  const isAfa = item.kind === "afa";
  const isChecker = item.kind === "checker";
  const isData = item.kind === "data";
  const isAirtime = item.kind === "airtime";
  const isUtil = item.kind === "utility";
  const u = item.utility;

  // central agent pricing for every kind → { sell, cost, comm }
  let q = { sell: 0, cost: 0, comm: 0 }, utilPkg = "";
  if (isUtil) {
    if (u.kind === "meter") { q = S.agentQuote(store, "meter", { id: item.net, amount: utilAmt }); utilPkg = `${S.fmt(utilAmt)} ${u.short}`; }
    else if (u.kind === "package") { const p = u.packages.find(x => x.id === utilSel); if (p) { q = S.agentQuote(store, "dstv", { p }); utilPkg = p.name; } }
    else { const p = u.plans.find(x => x.id === utilSel); if (p) { q = S.agentQuote(store, "stream", { p }); utilPkg = `${u.short} · ${p.name}`; } }
  } else if (isData) { q = S.agentQuote(store, "data", { net: item.net, priceKey: item.priceKey || item.net, b: item.bundle }); }
  else if (isChecker) { q = S.agentQuote(store, "checker", { p: item.product }); }
  // Airtime is face value on both sides — the guest pays the credit amount, the platform
  // buys it for the same, and the agent's margin is zero by design.
  else if (isAirtime) { q = { sell: item.amount, cost: item.amount, comm: 0 }; }
  // AFA no longer routes through this checkout (it has its own form + payment, see
  // StoreAfaForm). Kept correct rather than removed: the fee is the admin's price and the
  // agent's margin is always zero, so nothing here can imply a commission.
  else if (isAfa) { q = { sell: item.price, cost: item.price, comm: 0 }; }

  const lineQty = isChecker ? qty : 1;
  const total = +(q.sell * lineQty).toFixed(2);
  const wholesale = +(q.cost * lineQty).toFixed(2);
  const commission = +(total - wholesale).toFixed(2);

  // Discount codes. DATA is priced and charged by the server, so its code is validated there
  // too and we show exactly the total it returns — never a figure we worked out locally.
  // The simulated products have no server price, so they keep the local calculation.
  const scopeMatch = (p) => p.scope === "all" || (isData && p.scope === item.net);
  const findPromo = (code) => (promos || []).find(p => p.active && p.code === code.trim().toUpperCase() && (p.max === 0 || p.uses < p.max) && scopeMatch(p));
  // Ask the server what this bundle really costs (optionally with a code). Single source of
  // truth for the displayed total — /pay prices it exactly the same way, so what the customer
  // is shown here is what they are charged.
  const requote = async (code) => {
    const r = await fetch("/api/store/" + encodeURIComponent(store.handle) + "/quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        net: item.net, atProduct: item.variant || null,
        capacityGb: item.bundle ? item.bundle.gb : 0,
        ...(code ? { promoCode: code } : {}),
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not price this bundle.");
    return d;
  };

  // Price the bundle the moment the checkout opens, before the customer types anything.
  sfE(() => {
    if (!isData || !item.bundle) return;
    let live = true;
    (async () => {
      // Best-effort: if this can't reach the server the local figure still shows, and /pay
      // remains the backstop that stops a wrong amount ever being charged.
      try { const d = await requote(""); if (live) setBaseQuote(d); } catch (e) {}
    })();
    return () => { live = false; };
  }, [isData, item.net, item.variant, item.bundle && item.bundle.gb]);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) { setPromoErr(""); return; }
    if (!isData) {
      const p = findPromo(code);
      if (p) { setAppliedPromo(p); setPromoErr(""); }
      else { setAppliedPromo(null); setPromoErr("That code isn't valid for this item."); }
      return;
    }
    setPromoBusy(true);
    try {
      const r = await fetch("/api/store/" + encodeURIComponent(store.handle) + "/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ net: item.net, atProduct: item.variant || null, capacityGb: item.bundle.gb, promoCode: code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.code) { setAppliedPromo(null); setServerQuote(null); setPromoErr(d.error || "That code isn't valid for this item."); }
      else if (d.discount <= 0) { setAppliedPromo(null); setServerQuote(null); setPromoErr("That code can't be applied to this item."); }
      else { setAppliedPromo({ code: d.code, type: "fixed", value: d.discount }); setServerQuote(d); setPromoErr(""); }
    } catch (e) {
      setAppliedPromo(null); setServerQuote(null); setPromoErr("Couldn't check that code. Please try again.");
    } finally { setPromoBusy(false); }
  };
  const clearPromo = () => {
    setAppliedPromo(null); setServerQuote(null); setPromoInput(""); setPromoErr("");
    // Drop back to the undiscounted SERVER price rather than the local estimate.
    if (isData && item.bundle) requote("").then(setBaseQuote).catch(() => {});
  };
  // A code-bearing quote wins; otherwise the plain server quote; only then the local guess.
  const liveQuote = isData ? (serverQuote || baseQuote) : null;
  const discount = isData
    ? (liveQuote ? liveQuote.discount : 0)
    : (appliedPromo ? +(appliedPromo.type === "percent" ? total * appliedPromo.value / 100 : Math.min(appliedPromo.value, total)).toFixed(2) : 0);
  const payable = liveQuote ? liveQuote.payable : +(total - discount).toFixed(2);
  const payCommission = +(payable - wholesale).toFixed(2);

  const phoneOk = recipient.replace(/\D/g, "").length >= 9;
  const acctOk = isUtil
    ? (u.kind === "shared" ? (recipient.includes("@") || recipient.replace(/\D/g, "").length >= 9) : recipient.replace(/\D/g, "").length >= 6)
    : phoneOk;
  const formOk = isAfa ? (phoneOk && name.trim()) : isUtil ? (acctOk && q.sell > 0) : phoneOk;

  const noun = isAfa ? "registration" : isChecker ? "voucher" : isUtil ? "purchase" : isAirtime ? "airtime" : "data";
  const deliverNoun = isAfa ? "AFA registration" : isChecker ? "checker PIN & serial" : isUtil ? u.short.toLowerCase() : isAirtime ? "airtime" : "data";

  // DATA is fulfilled for real: charge the customer via Paystack (mobile money / card), then
  // the platform delivers through DataHub and credits the agent — see /api/store/[handle]/pay.
  // The browser is handed off to Paystack's hosted checkout; on return the storefront opens
  // live tracking (see the storepay handler in <Storefront>).
  const payData = async () => {
    setPayErr("");
    setPriceNote("");
    setStep("processing");
    try {
      await payStoreOrderMomo({
        handle: store.handle,
        // Airtime posts a face-value amount; data posts a bundle. Both are re-priced by the
        // server, which is what actually decides the charge.
        type: isAirtime ? "airtime" : "data",
        net: item.net,
        atProduct: isAirtime ? null : (item.variant || null),   // "ishare" | "bigtime" | null
        capacityGb: isAirtime ? 0 : item.bundle.gb,
        amount: isAirtime ? item.amount : undefined,
        recipient: recipient.replace(/\s/g, ""),
        payerPhone: (payPhone || recipient).replace(/\s/g, ""),
        payNetwork: momoNet,
        // The server re-validates this and charges the discounted total, so what we show
        // here is what actually gets taken. Airtime has no margin to discount.
        promoCode: isAirtime ? null : (appliedPromo ? appliedPromo.code : null),
        // The total this checkout actually displayed. The server prices independently and
        // refuses the order if its figure differs, so a guest is never sent to Paystack for
        // an amount they didn't approve.
        expectedCost: payable,
      });
      // success → window redirects to Paystack; this component unmounts.
    } catch (e) {
      if (e?.beneficiaryBlock) { setBenBlock(e.beneficiaryBlock); setPayErr(""); }
      else if (e?.cost) {
        // The price moved between this checkout opening and the customer paying. Nothing has
        // gone wrong and nothing was charged: re-price, show the new total, and let them
        // simply tap Pay again. Never surface the server's internal comparison wording.
        setPayErr("");
        setPriceNote(`This bundle is now ${S.fmt(e.cost)}. Your total has been updated.`);
        try {
          const d = await requote(appliedPromo ? appliedPromo.code : "");
          setServerQuote(appliedPromo ? d : null);
          setBaseQuote(appliedPromo ? null : d);
        } catch (err) {
          // Couldn't re-quote — fall back to the figure /pay just told us is correct.
          setServerQuote(null);
          setBaseQuote({ sell: e.cost, discount: 0, payable: e.cost });
          setAppliedPromo(null);
        }
      }
      else setPayErr(e?.message || "Could not start payment. Please try again.");
      setStep("momo");
    }
  };

  // Non-data products have no automated provider — keep the existing instant flow.
  const paySimulated = () => {
    setStep("processing");
    const label = isUtil ? utilPkg : (isChecker && qty > 1 ? `${qty} × ${item.pkg}` : item.pkg);
    if (appliedPromo) redeemPromo(appliedPromo.code);
    const o = placeStoreOrder({ net: item.net, pkg: label, price: payable, cost: wholesale, commission: payCommission, customer: recipient, payNet: momoNet });
    setOrder(o);
    setTimeout(() => { completeStoreOrder(o); setStep("done"); }, 1900);
  };

  // Data and airtime are both really fulfilled (DataHub and Muviin), so both
  // go through Paystack. The rest have no provider yet and keep the instant local flow.
  //
  // A `comingSoon` utility must never reach paySimulated(): that flow shows the customer a
  // delivered confirmation for something no provider will ever send. The cards are already
  // inert, so this only catches a checkout opened some other way — but it's the last line
  // between a customer and a false receipt, so it's checked here too.
  const pay = () => {
    if (isUtil && u?.comingSoon) { setPayErr(u.short + " isn't available to buy yet."); return; }
    if (isData || isAirtime) payData(); else paySimulated();
  };

  return (
    <Modal title={step === "done" ? "" : "Checkout"} onClose={onClose}>
      {step === "form" && (
        <React.Fragment>
          <div className="co-item">
            {isData || isUtil ? <NetBadge net={item.net} size={46} />
              : <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--teal-050)", color: "var(--teal-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={isAfa ? "idcard" : "ticket"} size={24} /></span>}
            <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 18 }}>{isUtil ? u.name : item.pkg}</div><div className="muted" style={{ fontSize: 13 }}>{isAfa ? "MTN · one-time" : isChecker ? "Instant PIN by SMS" : isUtil ? u.deliver : S.NETWORKS[item.net].name}</div></div>
            <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22, color: store.theme }}>{S.fmt(total > 0 ? total : q.sell)}</div>
          </div>

          {/* utility selection */}
          {isUtil && u.kind === "meter" && (
            <React.Fragment>
              <div className="field" style={{ marginBottom: 6 }}><label>Amount</label></div>
              <div className="amount-picks">{u.amounts.map(a => <button key={a} className={"ap" + (utilAmt === a ? " on" : "")} onClick={() => setUtilAmt(a)}>GH₵{a}</button>)}</div>
              <Field label="Or enter amount" pre="GH₵" inputMode="numeric" value={utilAmt || ""} onChange={(e) => setUtilAmt(Math.max(0, +e.target.value.replace(/\D/g, "") || 0))} placeholder="0" />
            </React.Fragment>
          )}
          {isUtil && (u.kind === "package" || u.kind === "shared") && (
            <div className="util-opts" style={{ marginTop: 4, marginBottom: 6 }}>
              {(u.packages || u.plans).map(p => {
                const sell = u.kind === "package" ? S.agentQuote(store, "dstv", { p }).sell : S.agentQuote(store, "stream", { p }).sell;
                return (
                <button key={p.id} className={"util-opt" + (utilSel === p.id ? " on" : "")} onClick={() => setUtilSel(p.id)}>
                  <div className="lft"><span className="rdot"></span><span className="onm">{p.name}</span>{p.tag && <span className="otag">{p.tag}</span>}</div>
                  <span className="opr">{S.fmt(sell)}</span>
                </button>
                );
              })}
            </div>
          )}

          {isChecker && (
            <div className="field"><label>Quantity</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><I.minus size={18} /></button>
                <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22, minWidth: 40, textAlign: "center" }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}><I.plus size={18} /></button>
              </div>
            </div>
          )}

          {isAfa && <Field label="Full name" icon="user" placeholder="e.g. Adwoa Mensah" value={name} onChange={(e) => setName(e.target.value)} />}
          {isAfa && (
            <Select label="Profession" value={prof} onChange={setProf} options={S.afaInfo.professions} />
          )}

          {isUtil ? (
            <Field label={u.idLabel} icon={u.kind === "shared" ? "mail" : "receipt"} placeholder={u.placeholder} value={recipient} onChange={(e) => setRecipient(e.target.value)} hint={recipient && !acctOk ? "Enter a valid " + u.idLabel.toLowerCase() : u.idHint} error={recipient && !acctOk} />
          ) : (
            <Field label={isAfa ? "MTN number to register" : isChecker ? "Phone to receive PIN (SMS)" : "Recipient phone number"} icon="phone" pre="+233" inputMode="tel" placeholder="24 000 0000" value={recipient} onChange={(e) => setRecipient(e.target.value)} hint={recipient && !phoneOk ? "Enter a valid Ghanaian number" : "The number that receives this " + noun} error={recipient && !phoneOk} />
          )}

          {!isAfa && <div className="sf-verify-note"><I.info size={15} stroke="#F59E0B" />Double-check the number &amp; network — orders sent to the wrong number can’t be refunded.</div>}

          {/* discount code */}
          {total > 0 && (
            <div className="sf-promo">
              {appliedPromo ? (
                <div className="applied" style={{ borderColor: store.theme }}>
                  <span className="tag" style={{ background: store.theme }}><I.tag size={13} stroke="#fff" /></span>
                  <div style={{ flex: 1 }}><div className="c">{appliedPromo.code} applied</div><div className="d">you save {S.fmt(discount)}</div></div>
                  <button onClick={clearPromo}><I.x size={16} /></button>
                </div>
              ) : (
                <div className="entry">
                  <input placeholder="Discount code" value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(""); }} />
                  <button className="btn btn-out" style={{ padding: "10px 16px" }} disabled={!promoInput.trim() || promoBusy} onClick={applyPromo}>{promoBusy ? "Checking…" : "Apply"}</button>
                </div>
              )}
              {promoErr && <div className="perr">{promoErr}</div>}
            </div>
          )}

          {total > 0 && (appliedPromo || (isChecker && qty > 1) || isUtil) && (
            <div className="summary">
              {appliedPromo && <div className="row"><span className="k">Subtotal</span><span className="v">{S.fmt(total)}</span></div>}
              {appliedPromo && <div className="row"><span className="k" style={{ color: store.theme }}>Discount ({appliedPromo.code})</span><span className="v" style={{ color: store.theme }}>−{S.fmt(discount)}</span></div>}
              <div className="total"><span className="muted" style={{ fontWeight: 600 }}>Total</span><span className="v">{S.fmt(payable)}</span></div>
            </div>
          )}

          <button className="btn btn-full" disabled={!formOk} style={{ background: store.theme, color: "#fff", opacity: formOk ? 1 : .5 }} onClick={() => setStep("momo")}>Continue to payment<I.arrow size={18} stroke="#fff" /></button>
        </React.Fragment>
      )}

      {step === "momo" && (
        <React.Fragment>
          <button className="iconbtn" style={{ marginBottom: 14 }} onClick={() => setStep("form")}><I.back size={20} /></button>
          <p className="muted" style={{ fontSize: 14 }}>Pay <strong style={{ color: "var(--ink)" }}>{S.fmt(payable)}</strong> with mobile money. Choose the wallet you'll pay from.</p>
          <div className="net-pick" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 12 }}>
            {["mtn", "telecel", "atigo"].map(n => <button key={n} className={"np" + (momoNet === n ? " on" : "")} onClick={() => setMomoNet(n)} style={{ padding: "14px 8px" }}><NetBadge net={n} size={40} /><div className="nm" style={{ fontSize: 12.5, marginTop: 6 }}>{S.NETWORKS[n].name}</div></button>)}
          </div>
          <Field label="Mobile money number" icon="phone" pre="+233" inputMode="tel" placeholder="24 000 0000" value={payPhone || recipient.replace(/^0/, "")} onChange={(e) => setPayPhone(e.target.value)} />
          {payErr && <div className="trk-err" style={{ marginTop: 4 }}>{payErr}</div>}
          {/* A price change is information, not an error — styled as a calm note so an agent's
              storefront never shows a shopper a red failure for something routine. */}
          {priceNote && (
            <div style={{ marginTop: 4, display: "flex", gap: 9, alignItems: "flex-start", background: "var(--blue-050)", border: "1px solid var(--blue-100)", borderRadius: 12, padding: "11px 13px" }}>
              <span style={{ color: "var(--blue-700)", flexShrink: 0, marginTop: 1 }}><I.info size={17} /></span>
              <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{priceNote}</span>
            </div>
          )}
          {/* Nothing was charged — the server refuses ahead of the Paystack handoff. */}
          {benBlock && (
            <Modal
              title={benBlock.title}
              onClose={() => setBenBlock(null)}
              wide={false}
              foot={<div className="mfoot"><button className="btn btn-ghost" onClick={() => setBenBlock(null)}>Close</button></div>}
            >
              <div style={{ background: "#FFF4E0", border: "1px solid rgba(185,121,28,.30)", borderRadius: 14, padding: "13px 15px" }}>
                <strong style={{ color: "#B9791C", display: "block", marginBottom: 6, fontSize: 13.5 }}>{benBlock.phone} is not a verified number</strong>
                {benBlock.body.map((line, i) => (
                  <span key={i} className="muted" style={{ display: "block", marginTop: i ? 8 : 0, fontSize: 13, lineHeight: 1.5 }}>{line}</span>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, margin: "12px 0 0" }}>
                You have not been charged. Please use a different number.
              </p>
            </Modal>
          )}
          <button className="btn btn-full" style={{ background: store.theme, color: "#fff" }} onClick={pay}><I.lock size={18} stroke="#fff" />Pay {S.fmt(payable)}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 12, fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}><I.shield size={15} />Secured by Smart Data Hub · licensed gateway</div>
        </React.Fragment>
      )}

      {step === "processing" && (
        (isData || isAirtime) ? (
          <div className="flow-result" style={{ padding: "20px 10px 10px" }}><div className="spin" style={{ borderTopColor: store.theme }}></div><h2>Redirecting to secure payment…</h2><p>Taking you to the mobile-money checkout. Approve the prompt to pay — your {deliverNoun} is delivered automatically once payment is confirmed.</p></div>
        ) : (
          <div className="flow-result" style={{ padding: "20px 10px 10px" }}><div className="spin" style={{ borderTopColor: store.theme }}></div><h2>Approve on your phone</h2><p>Confirm the mobile money prompt to complete payment. Your {deliverNoun} {isAfa ? "is processed" : "delivers"} instantly.</p></div>
        )
      )}

      {step === "done" && (
        <div className="flow-result" style={{ padding: "6px 2px 4px" }}>
          {isAfa ? (
            <React.Fragment>
              <div className="ok-ring"><I.check size={42} stroke="var(--ok)" sw={2.4} /></div>
              <h2>Registered!</h2>
              <p><strong>{recipient}</strong> registered for MTN AFA. PIN of activation sent by SMS.</p>
              <div className="card" style={{ textAlign: "left", marginTop: 18, background: "var(--bg)" }}>
                <div className="summary">
                  <div className="row"><span className="k">Order</span><span className="v mono" style={{ fontFamily: "ui-monospace,monospace" }}>{order?.id}</span></div>
                  <div className="row" style={{ borderBottom: "none" }}><span className="k">Paid</span><span className="v">{S.fmt(payable)}</span></div>
                </div>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ textAlign: "left" }}>
              <DeliveryStatus order={{ ...(order || {}), id: order?.id || "SO·—", net: item.net, pkg: isUtil ? utilPkg : item.pkg, customer: recipient, status: "delivered", at: order?.at || Date.now(), deliveredAt: Date.now() }} />
              <div className="summary" style={{ marginTop: 14 }}>
                <div className="row"><span className="k">Paid</span><span className="v">{S.fmt(payable)}</span></div>
                <div className="row" style={{ borderBottom: "none" }}><span className="k">Save your order no.</span><span className="v mono" style={{ fontFamily: "ui-monospace,monospace" }}>{order?.id}</span></div>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 8, textAlign: "center" }}>Keep your order number — track delivery anytime from “Track order”.</p>
            </div>
          )}
          <button className="btn btn-full" style={{ background: store.theme, color: "#fff", marginTop: 16 }} onClick={onClose}>Buy something else</button>
          <div className="powered" style={{ justifyContent: "center", marginTop: 14 }}><img src={(window.__resources&&window.__resources.logoMark)||"assets/logo-mark.png"} alt="" />Powered by <strong>Smart Data Hub</strong></div>
        </div>
      )}
    </Modal>
  );
}

export { StoreCheckout, Storefront, StorefrontHeader };
