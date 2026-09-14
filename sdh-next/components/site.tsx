"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { useStore } from "@/components/store";
import { Arc, Brand, NetBadge, Stars } from "@/components/ui";

/* Smart Data Hub — public marketing site (React) */
const { useState: sU } = React;

function SiteNav() {
  const { sitePage, navSite, setScreen, setAuthMode, user, goApp } = useStore();
  const [open, setOpen] = sU(false);
  const links = [
    ["home", "Home"], ["services", "Services"], ["reseller", "Agents"], ["faq", "FAQ"], ["about", "About"], ["contact", "Contact"],
  ];
  const buy = () => user ? goApp("buy-data") : (setAuthMode("signup"), setScreen("auth"));
  const signin = () => { setAuthMode("login"); setScreen("auth"); };
  return (
    <React.Fragment>
      <header className="nav scrolled">
        <div className="wrap">
          <Brand onClick={() => navSite("home")} />
          <nav className="nav-links">
            {links.map(([k, t]) => <a key={k} onClick={() => navSite(k)} style={{ color: sitePage === k ? "var(--ink)" : undefined, cursor: "pointer" }}>{t}</a>)}
          </nav>
          <div className="nav-cta">
            {user
              ? <a className="signin" onClick={() => goApp("dashboard")} style={{ cursor: "pointer" }}>Dashboard</a>
              : <a className="signin" onClick={signin} style={{ cursor: "pointer" }}>Sign in</a>}
            <a className="btn btn-pri" onClick={buy} style={{ cursor: "pointer" }}><I.bolt size={18} stroke="#fff" />Buy Data</a>
          </div>
          <button className="burger" onClick={() => setOpen(true)} aria-label="Menu"><I.menu size={22} stroke="#12243F" /></button>
        </div>
      </header>
      {open && (
        <div className="drawer open" onClick={(e) => { if (e.target.closest("[data-close]") || e.target.classList.contains("scrim")) setOpen(false); }}>
          <div className="scrim" data-close></div>
          <div className="panel">
            <button className="close" data-close aria-label="Close"><I.x size={20} stroke="#12243F" /></button>
            {links.map(([k, t]) => <a key={k} data-close onClick={() => { navSite(k); }}>{t}</a>)}
            <a className="btn btn-pri" style={{ marginTop: 10 }} onClick={() => { setOpen(false); buy(); }}>Buy Data</a>
            {user
              ? <a className="btn btn-out" onClick={() => { setOpen(false); goApp("dashboard"); }}>Dashboard</a>
              : <a className="btn btn-out" onClick={() => { setOpen(false); signin(); }}>Sign in</a>}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function SiteFooter() {
  const { S, navSite, setScreen, setAuthMode } = useStore();
  const go = (p) => navSite(p);
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Brand onClick={() => navSite("home")} />
            <p>{S.company.tagline}. Instant data, airtime &amp; digital services for every Ghanaian network, 24/7.</p>
            <a className="wa" href="#" onClick={(e) => e.preventDefault()}><I.megaphone size={20} stroke="#fff" />Join our WhatsApp Channel</a>
          </div>
          <div className="foot-col"><h4>Company</h4>
            <a onClick={() => go("about")}>About us</a><a onClick={() => go("reseller")}>Agent program</a><a onClick={() => go("compliance")}>Legal &amp; compliance</a><a onClick={() => go("contact")}>Contact</a>
          </div>
          <div className="foot-col"><h4>Services</h4>
            <a onClick={() => go("services")}>Buy data</a><a onClick={() => go("services")}>Buy airtime</a><a onClick={() => go("services")}>Digital subscriptions</a><a onClick={() => { setAuthMode("login"); setScreen("auth"); }}>Sign in</a>
          </div>
          <div className="foot-col"><h4>Support</h4>
            <a onClick={() => go("faq")}>FAQ &amp; refunds</a><a onClick={() => go("contact")}>WhatsApp us</a><a href={`mailto:${S.company.emails.support}`}>{S.company.emails.support}</a><a onClick={() => go("terms")}>Terms &amp; Conditions</a><a onClick={() => go("compliance")}>Legal &amp; compliance</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span className="cp">© 2026 Smart Data Hub · operating under Smart Pixels Ventures.</span>
          <div className="contacts">
            <a onClick={() => go("contact")} style={{ cursor: "pointer" }}><I.megaphone size={16} /> WhatsApp Channel</a>
            <a onClick={() => go("contact")} style={{ cursor: "pointer" }}><I.send size={16} /> Send us a message</a>
            <a href={`mailto:${S.company.emails.support}`}><I.mail size={16} /> {S.company.emails.support}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- HOME ---------------- */
function HomePage() {
  const { S, user, goApp, setScreen, setAuthMode, navSite } = useStore();
  const buy = () => user ? goApp("buy-data") : (setAuthMode("signup"), setScreen("auth"));
  return (
    <main>
      <section className="hero">
        <Arc style={{ top: -20, right: -40, width: 340 }} stroke="var(--teal-ink)" opacity={0.12} />
        <div className="wrap hero-grid">
          <div>
            <span className="badge-live"><span className="dot"></span> Live · 24/7 on MTN, Telecel &amp; AirtelTigo</span>
            <h1>Smart Data,<br /><span className="a">Seamless</span> Connection.</h1>
            <p className="sub">Affordable data bundles, airtime and digital subscriptions delivered to any Ghanaian number — instantly, securely, any time of day.</p>
            <div className="hero-cta">
              <a className="btn btn-pri" onClick={buy} style={{ cursor: "pointer" }}><I.bolt size={18} stroke="#fff" />Buy Data</a>
              <a className="btn btn-dark" onClick={() => navSite("reseller")} style={{ cursor: "pointer" }}>Become an Agent</a>
            </div>
            <div className="trust"><Stars /><strong>{S.company.stats.rating}</strong><span className="muted">· {S.company.stats.orders}+ orders delivered</span></div>
          </div>
          <HeroPhone />
        </div>
      </section>

      <section className="strip">
        <div className="wrap">
          <span className="lab">Works with every network</span>
          <div className="nets">
            {["mtn", "telecel", "atigo"].map(n => <span className="item" key={n}><NetBadge net={n} size={34} /> {S.NETWORKS[n].name}</span>)}
            <span className="item" style={{ color: "var(--blue-700)" }}><I.clock size={22} /> 24/7 delivery</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Why Smart Data Hub</span>
            <h2>Built for trust &amp; speed</h2>
            <p>The little things that make us the connection thousands of Ghanaians rely on every single day.</p>
          </div>
          <div className="feat-grid">
            {[["bolt", "Instant Delivery", "Bundles land in seconds, automatically — no agents, no waiting.", "blue"],
              ["clock", "24/7 Service", "Buy any time — day, night, weekend or holiday. We never sleep.", "teal"],
              ["tag", "Best Prices", "Low, transparent rates across every network. No hidden charges.", "blue"],
              ["shield", "Trusted &amp; Secure", "18,000+ orders delivered. Encrypted payments you can count on.", "teal"]].map(([ic, t, d, c], i) => (
              <div className="feat" key={i}>
                <div className="ic" style={{ background: c === "blue" ? "var(--blue-050)" : "var(--teal-050)", color: c === "blue" ? "var(--blue)" : "var(--teal-ink)" }}><Ic name={ic} size={26} /></div>
                <h3 dangerouslySetInnerHTML={{ __html: t }}></h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sec-head center"><span className="eyebrow" style={{ justifyContent: "center" }}>How it works</span><h2>Three taps to connected</h2><p>No app store, no paperwork, no agents. Just you and a number.</p></div>
          <div className="how-grid">
            {[["Pick network & bundle", "Choose MTN, Telecel or AirtelTigo, then the bundle that fits your pocket."],
              ["Enter the number", "Top up your own line or send to family and friends — anywhere in Ghana."],
              ["Pay & get it instantly", "Pay with your wallet or mobile money. Data lands in seconds, 24/7."]].map(([t, d], i) => (
              <div className="how" key={i}><div className="n">{i + 1}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="kente"></div>
        <Arc style={{ bottom: -40, left: -50, width: 300 }} stroke="var(--teal)" opacity={0.1} />
        <div className="wrap">
          <div className="stats-grid">
            {[[S.company.stats.orders + "+", "orders delivered"], [S.company.stats.rating, "average rating"], [S.company.stats.resellers, "active agents"], ["<30s", "average delivery"]].map(([b, s], i) => (
              <div className="stat" key={i}><div className="big">{b}</div><div className="small">{s}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head center"><span className="eyebrow" style={{ justifyContent: "center" }}>Loved across Ghana</span><h2>Don't just take our word for it</h2></div>
          <div className="tg">
            {[["Money leaves my MoMo and the data lands before I lock my phone. Fastest in Ghana, honestly.", "Ama O.", "Kumasi", "mtn"],
              ["I run a small kiosk and resell bundles all day. The margins and the speed keep my customers coming back.", "Kwesi B.", "Reseller · Tema", "telecel"],
              ["Tried it at midnight when my data finished. Delivered instantly. Now it's the only service I use.", "Efua A.", "Accra", "atigo"]].map(([q, nm, rl, net], i) => (
              <div className="tcard" key={i}><Stars /><p>“{q}”</p><div className="who"><NetBadge net={net} size={40} /><div className="meta"><div className="nm">{nm}</div><div className="rl">{rl}</div></div></div></div>
            ))}
          </div>
        </div>
      </section>

      <ResellerBand />
    </main>
  );
}

function HeroPhone() {
  const { S } = useStore();
  return (
    <div className="phone-wrap">
      <div className="float f1"><div className="ic" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}><I.check size={20} sw={2.2} /></div><div><div className="t">Delivered</div><div className="s">in under 30 seconds</div></div></div>
      <div className="float f2"><NetBadge net="mtn" size={38} /><div><div className="t">All networks</div><div className="s">MTN · Telecel · AT</div></div></div>
      <div className="phone">
        <div className="island"></div>
        <div className="screen">
          <div className="mini-bal">
            <div className="lbl">Wallet balance</div><div className="amt">GH₵248.50</div>
            <div className="mini-row"><div className="b">+ Fund</div><div className="b">Buy now</div></div>
          </div>
          <div className="mini-nets">{["mtn", "telecel", "atigo"].map(n => <div className="n" key={n}><NetBadge net={n} size={34} style={{ margin: "0 auto" }} /></div>)}</div>
          <div className="mini-card" style={{ marginBottom: 12 }}>
            <div className="between"><strong style={{ fontFamily: "var(--ff-display)", fontSize: 20 }}>5 GB</strong><span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, color: "var(--blue-700)" }}>GH₵23.00</span></div>
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4, fontWeight: 600 }}>30 days · Popular</div>
          </div>
          <div className="mini-card" style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--blue)", border: "none", color: "#fff" }}>
            <I.lock size={18} stroke="#fff" /><strong style={{ fontSize: 14.5 }}>Confirm &amp; pay GH₵23.00</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResellerBand() {
  const { S, setScreen, setAuthMode, navSite } = useStore();
  const apply = () => { setAuthMode("signup"); setScreen("auth"); };
  return (
    <section className="section" id="reseller">
      <div className="wrap">
        <div className="reband">
          <Arc style={{ top: -30, right: -30, width: 280 }} stroke="#fff" opacity={0.14} />
          <div className="reband-grid">
            <div>
              <span className="eyebrow light">Agent program</span>
              <h2 style={{ marginTop: 14 }}>Turn your phone into a business</h2>
              <p>Buy bundles at wholesale, sell at your own price, and keep the margin. Agents drive ~76% of our orders — built for kiosks, students and side hustlers across Ghana.</p>
              <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
                <a className="btn btn-teal" onClick={apply} style={{ cursor: "pointer" }}>Apply to become an agent</a>
                <a className="btn" onClick={() => navSite("reseller")} style={{ background: "rgba(255,255,255,.16)", color: "#fff", cursor: "pointer" }}>Learn more</a>
              </div>
            </div>
            <div className="tiers">
              {S.TIERS.map(t => (
                <div className={"tier" + (t.id === "pro" ? " hot" : "")} key={t.id}>
                  <div><div className="nm">{t.name}{t.id === "pro" ? " · Most popular" : ""}</div><div className="fee">{t.fee}</div></div>
                  <div className="mg" title="Share of the margin on each order">{Math.round(t.rate * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { HeroPhone, HomePage, ResellerBand, SiteFooter, SiteNav };
