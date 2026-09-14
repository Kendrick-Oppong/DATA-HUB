"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { I, Ic } from "@/components/icons";
import { ResellerBand } from "@/components/site";
import { useStore } from "@/components/store";
import { Arc, Field } from "@/components/ui";

/* Smart Data Hub — secondary public pages */
const { useState: spU } = React;

function PageHero({ eyebrow, title, sub }) {
  const { navSite, user, goApp } = useStore();
  return (
    <section className="hero" style={{ padding: "40px 0 40px" }}>
      <Arc style={{ top: -20, right: -40, width: 300 }} stroke="var(--teal-ink)" opacity={0.1} />
      <div className="wrap">
        <div className="hero-back">
          <a onClick={() => navSite("home")} style={{ cursor: "pointer" }}><I.back size={16} />Back to home</a>
          {user && <a className="alt" onClick={() => goApp("dashboard")} style={{ cursor: "pointer" }}>Go to dashboard<I.arrow size={16} /></a>}
        </div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{ fontSize: "clamp(34px,4.4vw,52px)", marginTop: 16 }} dangerouslySetInnerHTML={{ __html: title }}></h1>
        {sub && <p className="sub" style={{ maxWidth: 620 }}>{sub}</p>}
      </div>
    </section>
  );
}

function AboutPage() {
  const { S } = useStore();
  return (
    <main>
      <PageHero eyebrow="Our story" title='Keeping Ghana <span style="color:var(--blue)">connected</span>, one bundle at a time'
        sub="Smart Data Hub is a proven, revenue-generating business — not a concept. Built from the ground up with no external funding." />
      <section className="section tight">
        <div className="wrap about-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 48, alignItems: "center" }}>
          <div className="about-story">
            <p className="muted" style={{ fontSize: 16.5, lineHeight: 1.65 }}>
              Smart Data Hub started in Accra with one belief: getting online should be instant, affordable and trustworthy. Operating under Smart Pixels Ventures, we deliver data, airtime and digital subscriptions to thousands of customers and resellers across every major network — 24 hours a day.
            </p>
            <p className="muted" style={{ fontSize: 16.5, lineHeight: 1.65, marginTop: 16 }}>
              We're now building our own proprietary platform — connected directly to upstream telecom sources — to deliver faster, capture more margin, and grow the agent network that already powers most of our orders.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 30 }}>
              {[[S.company.stats.gtv, "gross transaction value"], [S.company.stats.orders, "orders processed"], [S.company.stats.resellerShare, "of orders via agents"], [S.company.stats.completed, "completed orders"]].map(([b, s], i) => (
                <div className="card" key={i}><div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 30, color: "var(--blue)" }}>{b}</div><div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{s}</div></div>
              ))}
            </div>
          </div>
          <div className="about-side">
            <div className="card pad-lg">
              <span className="eyebrow">Vision</span>
              <p style={{ fontSize: 16, lineHeight: 1.55, marginTop: 12, fontWeight: 500 }}>To become Ghana's most trusted digital services platform, empowering individuals and businesses through affordable connectivity.</p>
            </div>
            <div className="card pad-lg" style={{ marginTop: 16 }}>
              <span className="eyebrow">Core values</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                {["Reliability", "Integrity", "Innovation", "Customer first", "Accessibility", "Excellence"].map(v => (
                  <div key={v} style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 15 }}><I.checkc size={20} stroke="var(--teal-ink)" />{v}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServicesPage() {
  const { user, goApp, setScreen, setAuthMode } = useStore();
  const start = (p) => user ? goApp(p) : (setAuthMode("signup"), setScreen("auth"));
  const services = [
    ["signal", "Data Bundles", "Affordable, instant data for MTN, Telecel & AirtelTigo. Flexible packages from 1GB to 100GB, available 24/7.", "buy-data", "Buy data"],
    ["phone", "Airtime Top-Up", "Instant airtime across all major networks at competitive rates. Top up yourself or any number in Ghana.", "buy-airtime", "Buy airtime"],
    ["gift", "Digital Subscriptions", "Streaming subscriptions, digital memberships and online service renewals — all in one wallet.", null, "Coming soon"],
    ["brief", "Business Solutions", "Bulk SMS, customer notifications and API integrations to help businesses communicate and engage.", null, "Talk to us"],
  ];
  return (
    <main>
      <PageHero eyebrow="What we do" title="Everything to stay connected" sub="One wallet, every network, delivered automatically — for individuals, agents and businesses." />
      <section className="section tight">
        <div className="wrap">
          <div className="grid g-2">
            {services.map(([ic, t, d, page, cta], i) => (
              <div className="card pad-lg" key={i} style={{ display: "flex", gap: 18 }}>
                <div className="ic" style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: i % 2 ? "var(--teal-050)" : "var(--blue-050)", color: i % 2 ? "var(--teal-ink)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={ic} size={28} /></div>
                <div>
                  <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 21 }}>{t}</h3>
                  <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 8 }}>{d}</p>
                  <a className={"btn " + (page ? "btn-ghost" : "btn-out")} style={{ marginTop: 16, padding: "11px 20px", fontSize: 14.5, cursor: page ? "pointer" : "default", opacity: page ? 1 : 0.7 }} onClick={() => page && start(page)}>{cta}{page && <I.arrow size={17} />}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ResellerPage() {
  const { S, setScreen, setAuthMode } = useStore();
  const apply = () => { setAuthMode("signup"); setScreen("auth"); };
  const benefits = [
    ["brief", "Your own online store", "Get a branded storefront on a link you can share — customers buy data &amp; airtime directly, no chatting required."],
    ["coins", "Wholesale pricing", "Buy every bundle below retail and keep the difference. Your margin, your price."],
    ["trend", "Real-time commissions", "Watch earnings tick up the instant an order delivers. Full transparency, always."],
    ["bolt", "Instant auto-delivery", "Your customers get data in seconds — so you never get embarrassed in front of them."],
    ["coins", "Fast payouts", "Request a withdrawal to mobile money and get paid quickly once approved."],
    ["chart", "Sales dashboard", "Track store visits, orders, top bundles and earnings trends from one clean dashboard."],
  ];
  return (
    <main>
      <PageHero eyebrow="Agent program" title="Turn your phone into a business" sub="The agent network drives roughly three-quarters of all our orders. It's the heart of Smart Data Hub — and it's built for you." />
      <section className="section tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g-3">
            {benefits.map(([ic, t, d], i) => (
              <div className="card" key={i}>
                <div className="ic" style={{ width: 50, height: 50, borderRadius: 15, background: "var(--blue-050)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={ic} size={24} /></div>
                <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 18, marginTop: 16 }}>{t}</h3>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 8 }}>{d}</p>
              </div>
            ))}
          </div>

          <div className="sec-head center" style={{ marginTop: 64 }}><span className="eyebrow" style={{ justifyContent: "center" }}>Commission tiers</span><h2>Earn more as you grow</h2><p>Start free. Climb the tiers on what you earn each month, and your share of the margin on every order rises with you.</p></div>
          <div className="grid g-3" style={{ marginTop: 40 }}>
            {S.TIERS.map(t => (
              <div className="card pad-lg" key={t.id} style={t.id === "pro" ? { border: "2px solid var(--blue)", boxShadow: "var(--sh-blue)" } : {}}>
                {t.id === "pro" && <span className="pill approved" style={{ marginBottom: 12 }}>Most popular</span>}
                <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 24 }}>{t.name}</h3>
                <div className="muted" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{t.fee}</div>
                <div style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 54, color: t.id === "pro" ? "var(--blue)" : "var(--ink)", marginTop: 18, letterSpacing: "-.02em" }}>{Math.round(t.rate * 100)}%</div>
                <div className="muted" style={{ fontSize: 13.5, fontWeight: 600 }}>of the margin on every order · {t.note}</div>
                <a className={"btn " + (t.id === "pro" ? "btn-pri" : "btn-out") + " btn-full"} onClick={apply} style={{ cursor: "pointer", marginTop: 22 }}>{"Get started"}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ResellerBand />
    </main>
  );
}

function FaqPage() {
  const [open, setOpen] = spU(0);
  const faqs = [
    ["How fast is delivery?", "Timely Delivery: We strive to ensure that your purchases are processed in a timely manner. Typically, you should expect delivery within 30 minutes to 24 hours. \nPotential Delays: In the event of a delay, we kindly request that you remain calm. Delays may occur due to Unstable Network, Technical challenges or other unforeseen circumstances."],
    ["What is the MTN AFA bundle and what do I get?", "AFA is an MTN association bundle. Once a number is registered, it unlocks heavily discounted AFA data and voice packages — including a large monthly allowance of free closed-user-group (CUG) minutes to call other AFA-registered MTN numbers, plus minutes to regular MTN and other networks. Registration is a one-time step done per number."],
    ["What do I need to register a number for AFA?", "Just the customer's details: full name, the MTN phone number, Ghana Card number, location and date of birth. Double-check every field before submitting — the registration fee is non-refundable, and your wallet is only charged once the submission succeeds."],
    ["After buying AFA, how do I subscribe to a bundle?", "Once a number is registered, the customer dials MTN's AFA short code on their own phone and follows the prompts to buy the discounted AFA voice or data bundle, paying with their MTN mobile money. Registration through us simply unlocks that access."],
    ["What happens if an order fails?", "We do not give refunds. The only exception is a charged order that is never delivered due to a verified system error — in that case the amount is automatically credited back to your wallet (not as cash) so you can retry. You can also contact support on WhatsApp."],
    ["Which SIM types can receive data bundles?", "Our data bundles are for regular customer SIM cards only. They do NOT work on Turbonet, Merchant, EVD, Broadband, blacklisted, roaming, inactive or incorrectly-submitted numbers. Data sent to these is treated as delivered and cannot be reversed or refunded — always confirm the number is correct and eligible before paying."],
    ["Do you offer refunds?", "No. Smart Data Hub operates a strict No Refund Policy — all payments are final once an order is submitted and the service is delivered. The only exception is a charged order that was never delivered due to a verified system error, which is credited back to your wallet automatically. Always double-check every detail before paying."],
    ["How do I fund my wallet?", "Add money to your wallet via mobile money (MTN, Telecel or AirtelTigo) through our licensed payment partner. Your balance updates the moment payment is confirmed."],
    ["Which networks do you support?", "All three major Ghanaian networks: MTN, Telecel and AirtelTigo — for both data bundles and airtime."],
    ["How do I confirm a bundle landed?", "The recipient can dial their network's balance code (for example *124# on MTN) to see the new allowance. In the app, the order will also show as “Delivered” in your order history within seconds."],
    ["Are AFA registrations and exam vouchers refundable?", "No. AFA registrations and examination vouchers are final once submitted or generated. Double-check every detail — name, date of birth, ID number and phone — before placing the order, because the fee cannot be refunded."],
    ["Can I open more than one account?", "No. Each user may hold one account only. Creating multiple accounts to abuse promotions, referrals, discounts, bonuses or system loopholes is prohibited and may lead to permanent suspension."],
    ["How do agent commissions work?", "Agents buy at wholesale rates and keep the full difference between that and whatever they charge their customer — that profit is entirely yours. On top of it you earn a monthly tier bonus: Hustler 0%, Grinder 5%, Boss 8%, Chairman 13%. The bonus percentage is worked out on our own margin, not on your resale price, so pricing higher never costs you bonus."],
    ["How do I get paid as a reseller?", "Request a withdrawal from your available balance to your mobile money number. An admin reviews and approves payouts, and funds are sent to your number."],
    ["Is my payment information safe?", "Yes. All traffic is encrypted over HTTPS, payments run through a licensed gateway, and we never store your mobile money PIN. Sensitive actions can require OTP verification."],
  ];
  return (
    <main>
      <PageHero eyebrow="FAQ & policies" title="Questions, answered honestly" sub="Trust is everything in this market. Here's exactly how we handle delivery, payments and our No Refund Policy." />
      <section className="section tight" style={{ paddingTop: 8 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          {faqs.map(([q, a], i) => (
            <div className="card" key={i} style={{ marginBottom: 12, cursor: "pointer", padding: "0 22px" }} onClick={() => setOpen(open === i ? -1 : i)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", gap: 16 }}>
                <strong style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17 }}>{q}</strong>
                <span style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--blue)", flexShrink: 0 }}><I.chevd size={20} stroke="var(--blue)" /></span>
              </div>
              {open === i && <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, paddingBottom: 22, marginTop: -4, whiteSpace: "pre-line" }}>{a}</p>}
            </div>
          ))}
          <div className="card pad-lg" style={{ background: "#FFF4E0", border: "1px solid rgba(185,121,28,.25)", marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
            <I.info size={30} stroke="#B9791C" />
            <div><strong style={{ fontSize: 16 }}>No Refund Policy</strong><p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>All payments are final. Please confirm every detail — number, network and amount — before you pay. The only exception is a charged order that was never delivered, which is credited back to your wallet automatically.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactPage() {
  const { S, toast } = useStore();
  const [sent, setSent] = spU(false);
  return (
    <main>
      <PageHero eyebrow="Get in touch" title="We're here, 24/7" sub="Join our WhatsApp Channel for deals and updates, or send us a message and we'll get back to you quickly." />
      <section className="section tight" style={{ paddingTop: 8 }}>
        <div className="wrap contact-grid" style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: 40, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <a className="wa" href="#" onClick={(e) => e.preventDefault()} style={{ alignSelf: "flex-start", background: "#12A150" }}><I.megaphone size={20} stroke="#fff" />Join our WhatsApp Channel</a>
            <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.65, maxWidth: "34ch" }}>The fastest way to stay in the loop — follow the channel for price drops, restocks and service updates. Prefer to write? Use the form and we'll reply by WhatsApp or email.</p>
            <a href={`mailto:${S.company.emails.support}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}><I.mail size={19} stroke="var(--muted)" />{S.company.emails.support}</a>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: "34ch", marginTop: -8 }}>Our support inbox — monitored during business hours. Codes and receipts arrive from {S.company.emails.noreply}; add it to your contacts so they don't land in spam.</p>
          </div>
          <div className="card pad-lg">
            {sent ? (
              <div className="flow-result" style={{ padding: "30px 10px" }}>
                <div className="ok-ring"><I.check size={40} stroke="var(--ok)" sw={2.4} /></div>
                <h2>Message sent</h2><p>Thanks for reaching out — we'll reply on WhatsApp or by email shortly.</p>
              </div>
            ) : (
              <React.Fragment>
                <h3 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 22 }}>Send us a message</h3>
                <Field label="Your name" icon="user" placeholder="Full name" />
                <Field label="Phone number" icon="phone" pre="+233" placeholder="24 000 0000" />
                <Field label="Email address" icon="mail" placeholder="you@example.com" />
                <div className="field"><label>Message</label><div className="control" style={{ height: "auto", padding: 14, alignItems: "flex-start" }}><textarea rows={4} placeholder="How can we help?" style={{ border: "none", outline: "none", background: "none", font: "inherit", width: "100%", resize: "vertical", color: "var(--ink)" }}></textarea></div></div>
                <button className="btn btn-pri btn-full" onClick={() => { setSent(true); toast("Message sent", "send"); }}>Send message<I.send size={18} stroke="#fff" /></button>
              </React.Fragment>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function CompliancePage() {
  const { S } = useStore();
  const regulators = [
    ["signal", "National Communications Authority (NCA)", "Telecom & electronic communications",
      "Data and airtime are electronic communications services regulated by the NCA under the Electronic Communications Act, 2008 (Act 775). Dealers and resellers must work within the type-approved networks and authorised dealership arrangements of MTN, Telecel and AirtelTigo.",
      ["Operate only through authorised network dealer / aggregator channels", "Use type-approved systems and shortcodes", "Honour SIM-registration (Ghana Card) rules for AFA & connections"]],
    ["fund", "Bank of Ghana (BoG)", "Payments — Act 987",
      "All payment processing falls under the Payment Systems and Services Act, 2019 (Act 987). Smart Data Hub does not hold customer funds as a bank — wallet top-ups and payouts run through a BoG-licensed Payment Service Provider (PSP) / mobile-money issuer. Electronic money is denominated in Ghana Cedis.",
      ["Settle all payments via a BoG-licensed PSP / EMI", "Never operate an unlicensed e-money or deposit business", "Keep wallet float reconciled with the PSP"]],
    ["shield", "Data Protection Commission (DPC)", "Privacy — Act 843",
      "Customer names, phone numbers and professions (e.g. AFA registration) are personal data under the Data Protection Act, 2012 (Act 843). The business registers with the DPC and holds a data-protection certificate — a prerequisite that also underpins PSP onboarding.",
      ["Register with the DPC & renew the certificate", "Collect only the data needed; keep it secure", "Process data lawfully, with consent and a clear privacy notice"]],
    ["lock", "Anti-Money Laundering (FIC)", "AML/KYC — Act 1044",
      "Under the Anti-Money Laundering Act, 2020 (Act 1044) and BoG/PSP rules, the platform applies Know-Your-Customer checks and monitors for suspicious activity. Phone-number verification (OTP) and Ghana Card-linked MoMo support customer due diligence.",
      ["Verify identity (OTP / Ghana Card-linked MoMo)", "Monitor & report suspicious transactions to the FIC", "Keep transaction records for the statutory period"]],
    ["receipt", "Ghana Revenue Authority (GRA)", "Tax & E-Levy",
      "The business registers for Income Tax and VAT under the Revenue Administration Act, 2016 (Act 915). The Electronic Transfer Levy (Act 1075) applies at 1.5% on electronic transfers — but payments to a GRA-registered merchant, and transfers among principal/agent/master-agent accounts, are excluded.",
      ["Register for VAT / Income Tax as a merchant", "Issue receipts; account for any applicable levies", "Agent ↔ principal float transfers are E-Levy-exempt"]],
    ["users", "Consumer protection & fair trade", "Customers & agents",
      "We commit to transparent pricing, honest marketing and prompt redress. We operate a No Refund Policy — all sales are final — and the only exception is a charged order that was never delivered, which is credited back to the wallet. Complaints are logged and tracked to resolution.",
      ["Show clear, all-in prices before payment", "Credit undelivered-but-charged orders back to wallet", "No misleading promotions or hidden charges"]],
  ];
  return (
    <main>
      <PageHero eyebrow="Legal & compliance" title='Operating <span style="color:var(--blue)">by the book</span> in Ghana'
        sub="Smart Data Hub operates within Ghana's telecom, payments, data-protection and tax laws. Here's the framework we work under — and what it means for customers and agents." />
      <section className="section tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="grid g-2" style={{ alignItems: "start" }}>
            {regulators.map(([ic, t, tag, body, points], i) => (
              <div className="card pad-lg" key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="ic" style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: i % 2 ? "var(--teal-050)" : "var(--blue-050)", color: i % 2 ? "var(--teal-ink)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic name={ic} size={24} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}><span className="eyebrow">{tag}</span><span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 17.5, lineHeight: 1.2 }}>{t}</span></div>
                </div>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6, marginTop: 14 }}>{body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                  {points.map((p, j) => <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, fontWeight: 600 }}><I.checkc size={18} stroke={i % 2 ? "var(--teal-ink)" : "var(--blue)"} style={{ flexShrink: 0, marginTop: 1 }} />{p}</div>)}
                </div>
              </div>
            ))}
          </div>

          {/* agent obligations */}
          <div className="card pad-lg" style={{ marginTop: 18, background: "var(--navy)", color: "#fff", position: "relative", overflow: "hidden" }}>
            <Arc style={{ top: -30, right: -20, width: 220 }} stroke="var(--teal)" opacity={0.12} />
            <span className="eyebrow light">For our agents</span>
            <h2 style={{ fontFamily: "var(--ff-display)", fontWeight: 600, fontSize: 26, color: "#fff", marginTop: 12 }}>Your responsibilities as an agent</h2>
            <div className="grid g-2" style={{ marginTop: 20, gap: 14 }}>
              {[["Register your business", "Keep a valid business registration and TIN once you trade at scale."],
                ["Protect customer data", "Never share or resell customers' numbers or details. Get consent for AFA registrations."],
                ["Price transparently", "Always show the full price before a customer pays. No hidden mark-ups at checkout."],
                ["Keep records", "Retain your order, payout and customer records — useful for tax and dispute resolution."]].map(([t, d], i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(88,254,238,.16)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                  <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{t}</div><div style={{ color: "rgba(255,255,255,.72)", fontSize: 13, marginTop: 2, lineHeight: 1.45 }}>{d}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "flex-start", background: "var(--bg)" }}>
            <I.info size={22} stroke="var(--faint)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>This page is a plain-language summary for transparency and does not constitute legal advice. Specific Act references (Act 775, Act 987, Act 843, Act 1044, Act 915, Act 1075) are provided for orientation only; licensing status and obligations are confirmed with the NCA, Bank of Ghana, the Data Protection Commission and the GRA. Last reviewed June 2026.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TermsPage() {
  const { S } = useStore();
  const SEC = [
    { t: "About Smart Data Hub", p: [
      "Smart Data Hub is a digital services platform operating under Smart Pixels Ventures. We provide convenient access to data bundles, airtime, utility payments, television subscriptions, streaming subscriptions, examination vouchers, and other digital products and services.",
      "Our mission is simple — “Smart Data, Seamless Connection.” We strive to provide affordable, reliable, and fast digital services to customers across Ghana."] },
    { t: "Services We Provide", p: ["Smart Data Hub currently offers:"],
      list: ["Data bundles for all major networks", "Airtime top-ups", "Netflix subscriptions", "Showmax subscriptions", "DSTV payments", "GOTV payments", "Electricity token purchases", "Water bill payments", "Examination vouchers", "Other digital services introduced from time to time"],
      after: ["We reserve the right to modify, add, suspend, or discontinue any service without prior notice."] },
    { t: "User Eligibility", p: ["To use our services, you must:"],
      list: ["Be at least 18 years old, or have permission from a parent or guardian", "Provide accurate information during registration and transactions", "Use the platform only for lawful purposes"] },
    { t: "Account Registration", p: ["Users may create one account only. You are responsible for:"],
      list: ["Keeping your login credentials secure", "Maintaining accurate account information", "All activities conducted through your account"],
      after: ["Creating multiple accounts to abuse promotions, referral programs, discounts, bonuses, or system loopholes is strictly prohibited and may result in permanent suspension."] },
    { t: "Orders and Payments", p: [
      "Smart Data Hub accepts payments through the supported channels displayed on the website, including Mobile Money, cards, bank transfers, and other approved methods.",
      "An order is considered successful once payment has been confirmed and the service has been delivered. Customers are responsible for verifying all information before submitting an order."] },
    { t: "Data Bundle Eligibility Policy", p: ["Our data bundles are designed for regular customer SIM cards only."],
      groups: [
        { label: "Supported SIM type", tone: "ok", items: ["Regular customer SIM cards"] },
        { label: "Unsupported SIM types — data does NOT support", tone: "bad", items: ["Turbonet SIM", "Merchant SIM", "EVD SIM", "Broadband SIM", "Blacklisted SIM", "Roaming SIM", "Inactive numbers", "Incorrectly submitted numbers"] },
      ],
      callout: { tone: "warn", title: "Important notice", text: "Any data transferred to the SIM categories listed above is considered delivered by the provider and cannot be reversed, recovered, transferred, exchanged, or refunded. Customers are solely responsible for ensuring the number entered is correct and eligible before completing a purchase." } },
    { t: "Airtime Purchases", p: ["Airtime purchases are usually processed instantly. Smart Data Hub is not responsible for losses resulting from:"],
      list: ["Incorrect phone numbers", "Customer input errors", "Network delays beyond our control"] },
    { t: "Streaming Subscription Services", p: ["Smart Data Hub may provide access to streaming services including Netflix and Showmax. Availability, pricing, account access, and features may change based on provider policies.", "Users must not:"],
      list: ["Abuse shared subscription arrangements", "Attempt unauthorized access", "Violate provider usage policies"] },
    { t: "Utility Payments", p: ["We provide utility payment services including electricity tokens, water bill payments, DSTV renewals, and GOTV renewals.", "Customers must verify account numbers, meter numbers, smartcard numbers, and decoder information before making payments. Smart Data Hub shall not be liable for customer errors."] },
    { t: "Examination Vouchers", p: ["All examination voucher sales are final once voucher details have been generated or delivered. Customers are responsible for confirming:"],
      list: ["Examination type", "Candidate details", "Quantity required"] },
    { t: "No Refund Policy", p: [
      "All payments made on Smart Data Hub are final. Once an order is submitted and the service is delivered, the amount paid cannot be refunded, reversed, exchanged or transferred — for any product or service on the platform.",
      "The only exception is a charged order that is never delivered due to a verified system or technical failure. In that single case the amount is returned to your Smart Data Hub wallet (not as cash) so you can try again."],
      groups: [
        { label: "No refund will be given where", tone: "bad", items: ["The wrong phone number, meter, smartcard or account number was entered", "The SIM is unsupported (Turbonet, Merchant, EVD, Broadband, blacklisted, roaming or inactive)", "You change your mind after delivery", "The information you provided was incorrect", "The service has already been delivered", "An AFA registration or examination voucher has been submitted or generated"] },
      ],
      after: ["Always double-check every detail before paying. By placing an order you accept this No Refund Policy."] },
    { t: "Referral Program", p: [
      "Users may participate in referral programs offered by Smart Data Hub. Referral rewards may be withheld, adjusted, or cancelled where fraud, abuse, self-referrals, or suspicious activity is detected.",
      "Smart Data Hub reserves the right to modify referral rewards at any time."] },
    { t: "Reseller Program", p: ["Smart Data Hub allows approved users to resell products and services."],
      groups: [
        { label: "Resellers must", tone: "ok", items: ["Conduct business ethically", "Provide accurate information to customers", "Avoid misleading representations"] },
        { label: "Resellers may not", tone: "bad", items: ["Impersonate Smart Data Hub", "Misuse company branding", "Engage in fraudulent activities"] },
      ] },
    { t: "Prohibited Activities", p: ["Users must not:"],
      list: ["Commit fraud", "Use stolen payment methods", "Launder money", "Exploit system vulnerabilities", "Attempt unauthorized access", "Abuse promotions", "Operate multiple customer accounts", "Interfere with platform operations"] },
    { t: "Suspension and Termination", p: ["We reserve the right to suspend or permanently terminate accounts involved in:"],
      list: ["Fraudulent activity", "Chargeback abuse", "Identity misrepresentation", "Violation of these Terms", "Multiple-account abuse"],
      after: ["No compensation shall be payable for suspended accounts resulting from policy violations."] },
    { t: "Service Availability", p: ["Although we strive to provide uninterrupted service, we cannot guarantee 100% uptime. Service interruptions may occur due to:"],
      list: ["Network provider issues", "Third-party API failures", "Maintenance activities", "Regulatory requirements", "Technical faults beyond our control"] },
    { t: "Limitation of Liability", p: ["Smart Data Hub acts as a platform facilitating digital service purchases. We shall not be liable for:"],
      list: ["Network outages", "Provider failures", "Delayed service delivery caused by third parties", "Losses resulting from incorrect information submitted by customers", "Indirect or consequential damages"],
      after: ["Our liability shall not exceed the value of the affected transaction."] },
    { t: "Privacy", p: ["We respect your privacy and are committed to protecting your information. Information collected may include:"],
      list: ["Name", "Phone number", "Email address", "Transaction records", "Device information"],
      after: ["Information is used solely for service delivery, customer support, security, and legal compliance."] },
    { t: "Changes to These Terms", p: ["Smart Data Hub may update these Terms & Conditions from time to time. Continued use of our services after updates constitutes acceptance of the revised Terms."] },
    { t: "Contact Us", p: ["For assistance, inquiries, complaints, or support, customers may contact Smart Data Hub through the contact information provided on our website.", "By using Smart Data Hub, you acknowledge that you have read, understood, and agreed to these Terms & Conditions."] },
  ];
  return (
    <main>
      <PageHero eyebrow="Legal" title="Terms &amp; Conditions"
        sub="By accessing our website, creating an account, or purchasing any of our products and services, you agree to be bound by these Terms & Conditions. If you do not agree with any part, please do not use our services." />
      <section className="section tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="legal-doc">
            <div className="legal-intro">
              <span className="legal-updated">Last updated · June 2026</span>
              <p>Welcome to Smart Data Hub. These Terms govern your use of our platform and services across Ghana. Please read them carefully — they explain how orders, our No Refund Policy, eligibility and your account work.</p>
            </div>
            {SEC.map((s, i) => (
              <section className="legal-sec" key={i}>
                <div className="lh"><span className="num">{String(i + 1).padStart(2, "0")}</span><h2>{s.t}</h2></div>
                {s.p && s.p.map((para, j) => <p key={j}>{para}</p>)}
                {s.list && <ul className="legal-list">{s.list.map((li, j) => <li key={j}>{li}</li>)}</ul>}
                {s.groups && (
                  <div className="legal-groups">
                    {s.groups.map((g, j) => (
                      <div className={"legal-group " + g.tone} key={j}>
                        <div className="lg-label">{g.label}</div>
                        <ul className="legal-list">{g.items.map((li, k) => <li key={k}>{li}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                )}
                {s.callout && (
                  <div className={"notice notice-" + s.callout.tone} style={{ marginTop: 16, background: s.callout.tone === "warn" ? "#FFF4E0" : "var(--blue-050)", border: "1px solid rgba(185,121,28,.3)", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{ color: "#B9791C", flexShrink: 0, marginTop: 1 }}><I.info size={19} /></span>
                    <div style={{ fontSize: 14, lineHeight: 1.55 }}>
                      <strong style={{ color: "#B9791C", display: "block", marginBottom: 3 }}>{s.callout.title}</strong>
                      <span className="muted">{s.callout.text}</span>
                    </div>
                  </div>
                )}
                {s.after && s.after.map((para, j) => <p key={"a" + j}>{para}</p>)}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export { AboutPage, CompliancePage, ContactPage, FaqPage, PageHero, ResellerPage, ServicesPage, TermsPage };
