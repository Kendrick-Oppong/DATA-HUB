"use client";
/* eslint-disable */
// @ts-nocheck
// Ported from platform/data.js — the SDH data model as an ES module.
// Also assigns window.SDH so legacy direct reads (e.g. NetBadge) keep working.
/* ============================================================
   Smart Data Hub — platform data model (plain JS, window.SDH)
   Money is modelled as a ledger; balances derive from entries.
   ============================================================ */
export const SDH: any = (function () {
  const NETWORKS = {
    mtn:    { id: "mtn",    name: "MTN",        short: "MTN", color: "#FFCC00", ink: "#3A2E00", css: "logo-mtn" },
    telecel:{ id: "telecel",name: "Telecel",    short: "TEL", color: "#E2231A", ink: "#ffffff", css: "logo-telecel" },
    atigo:  { id: "atigo",  name: "AT",          short: "AT",  color: "#0A4FA0", ink: "#ffffff", css: "logo-atigo" },
    // utility / bill providers — share the NetBadge + order pipeline
    ecg:    { id: "ecg",    name: "ECG",         short: "ECG", color: "#13477E", ink: "#ffffff", css: "logo-ecg" },
    water:  { id: "water",  name: "Ghana Water", short: "GWL", color: "#1488C2", ink: "#ffffff", css: "logo-water" },
    dstv:   { id: "dstv",   name: "DStv",        short: "DStv",color: "#00A0DF", ink: "#08243B", css: "logo-dstv" },
    netflix:{ id: "netflix",name: "Netflix",     short: "N",   color: "#E50914", ink: "#ffffff", css: "logo-netflix" },
    prime:  { id: "prime",  name: "Prime Video", short: "PV",  color: "#1F2A44", ink: "#1CB8EC", css: "logo-prime" },
  };

  // Base data bundles (shared shape; price varies slightly per network below)
  const DATA_BUNDLES = [
    { id: "d1",  gb: 1,   days: 30, price: 5.50,   reseller: 5.00 },
    { id: "d2",  gb: 2,   days: 30, price: 10.50,  reseller: 9.60,  tag: "" },
    { id: "d3",  gb: 3,   days: 30, price: 15.00,  reseller: 13.80 },
    { id: "d5",  gb: 5,   days: 30, price: 23.00,  reseller: 21.20, tag: "Popular" },
    { id: "d10", gb: 10,  days: 30, price: 43.00,  reseller: 39.50, tag: "Best value" },
    { id: "d15", gb: 15,  days: 30, price: 62.00,  reseller: 57.00 },
    { id: "d20", gb: 20,  days: 30, price: 80.00,  reseller: 73.50 },
    { id: "d50", gb: 50,  days: 90, price: 180.00, reseller: 166.00 },
    { id: "d100",gb: 100, days: 90, price: 330.00, reseller: 305.00 },
  ];

  // tiny per-network price nudges so it feels real
  const NET_ADJ = { mtn: 0, telecel: -0.4, atigo: 0.3 };
  // Two networks sell data as more than one PRODUCT LINE, and each line prices and fulfils
  // independently:
  //   MTN  Standard — the ordinary MTN bundle
  //        Xpress   — express delivery (costs more upstream)
  //   AT   iShare   — instant delivery, standard 30/90-day validity
  //        BigTime  — bulk data that does NOT expire (small premium for the convenience)
  // Telecel has a single line. Mirrors lib/server/providers/lines.ts, which is the
  // authoritative copy — this one only drives what's on screen.
  const AT_PRODUCTS = {
    ishare:  { id: "ishare",  name: "iShare",  blurb: "Instant delivery · standard validity" },
    bigtime: { id: "bigtime", name: "BigTime", blurb: "Bulk data · never expires" },
  };
  const MTN_PRODUCTS = {
    standard: { id: "standard", name: "Standard", blurb: "Regular MTN bundles · standard validity" },
    xpress:   { id: "xpress",   name: "Xpress",   blurb: "Express delivery · priority queue" },
  };
  // The lines a network sells, or null when it only has one.
  const PRODUCTS_BY_NET = { mtn: MTN_PRODUCTS, atigo: AT_PRODUCTS };
  // Coerce a variant into a line this network actually sells (null for single-line networks).
  const lineOf = (net, variant) => {
    if (net === "mtn") return variant === "xpress" ? "xpress" : "standard";
    if (net === "atigo") return variant === "bigtime" ? "bigtime" : "ishare";
    return null;
  };
  // (net, variant) → the key its ADMIN-PUBLISHED prices live under. Mirrors pricingKeyOf()
  // in lib/server/pricingStore.ts.
  const pricingKeyOf = (net, variant) =>
    net === "mtn" ? (variant === "xpress" ? "mtn_xpress" : "mtn")
    : net === "atigo" ? (variant === "bigtime" ? "atigo_bigtime" : "atigo_ishare")
    : net;
  // (net, variant) → the key an AGENT'S OWN prices live under in their store config. Short
  // legacy keys, already written into every store doc — mirrors storePriceKeyOf() in
  // lib/server/pricing.ts.
  const storePriceKeyOf = (net, variant) =>
    net === "mtn" && variant === "xpress" ? "mtnx"
    : net === "atigo" && variant === "bigtime" ? "atbig"
    : net;

  // Premiums applied to the SEED catalog only — real prices come from admin-published
  // pricing. Kept in step with lib/server/pricingStore.ts.
  const BIGTIME_PREMIUM = 0.08;
  const XPRESS_PREMIUM = 0.06;
  function bundlesFor(net, variant) {
    const a = NET_ADJ[net] || 0;
    const big = net === "atigo" && variant === "bigtime";
    const rate = big ? BIGTIME_PREMIUM : (net === "mtn" && variant === "xpress" ? XPRESS_PREMIUM : 0);
    return DATA_BUNDLES.map(b => {
      const prem = rate ? +(b.price * rate).toFixed(2) : 0;
      return {
        ...b,
        days: big ? 0 : b.days,                              // 0 => "No expiry"
        atProduct: lineOf(net, variant),
        price: Math.max(0, +(b.price + a + prem).toFixed(2)),
        reseller: Math.max(0, +(b.reseller + a + prem).toFixed(2)),
      };
    });
  }

  // Every sellable data LINE across the given networks, in display order. One shared builder
  // so the storefront, My Store and the agent pricing page can never disagree about which
  // lines exist or which key their prices are saved under.
  //
  // `store` gates the two OPTIONAL lines: AT BigTime is on unless switched off, MTN Xpress is
  // off until switched on (it's newer and priced separately, so agents opt in).
  function dataLinesOf(nets, store) {
    const st = store || {};
    return (nets || []).flatMap(n => {
      if (n === "mtn") {
        const ls = [{ key: "mtn", net: "mtn", variant: "standard", name: "MTN", sub: null, priceKey: "mtn" }];
        if (st.xpress === true) ls.push({ key: "mtnx", net: "mtn", variant: "xpress", name: "MTN Xpress", sub: "Express delivery", priceKey: "mtnx" });
        return ls;
      }
      if (n === "atigo") {
        const ls = [{ key: "atigo", net: "atigo", variant: "ishare", name: "AT iShare", sub: "Instant delivery", priceKey: "atigo" }];
        if (st.bigtime !== false) ls.push({ key: "atbig", net: "atigo", variant: "bigtime", name: "AT BigTime", sub: "Never expires", priceKey: "atbig" });
        return ls;
      }
      return [{ key: n, net: n, variant: null, name: (NETWORKS[n] || {}).name || n, sub: null, priceKey: n }];
    });
  }

  // Validity label for a data bundle — mirrors labelFor() in lib/server/pricing.ts so what a
  // customer sees matches the package name on the real order. Every bundle has a validity:
  // either a day count or "No expiry" (days:0). `short` gives the compact form for dense tables.
  const validityOf = (b, short) => {
    if (!b) return "";
    if (b.noExpiry || !b.days) return "No expiry";
    return b.days + (short ? "d" : " days");
  };
  // Full package label, e.g. "5GB · 30 days" / "10GB BigTime · No expiry" / "5GB Xpress ·
  // 30 days". Only a line that ISN'T the network's default gets named — mirrors labelFor()
  // in lib/server/pricing.ts, which names the package on the real order.
  const pkgOf = (b, net, variant) => {
    const named = net === "atigo" ? (variant === "bigtime" ? "BigTime" : "iShare")
      : net === "mtn" && variant === "xpress" ? "Xpress"
      : null;
    const base = named ? `${b.gb}GB ${named}` : `${b.gb}GB`;
    return `${base} · ${validityOf(b)}`;
  };

  const AIRTIME_PICKS = [2, 5, 10, 20, 50, 100];

  // Tiers, per the SDH Incentive Logic spec §1.3. MUST stay in step with lib/server/tiers.ts,
  // which is the authoritative copy the payouts are calculated from — this one only drives
  // what's on screen.
  //
  // `rate` is the bonus on the PLATFORM'S OWN MARGIN of an order (wholesale − vendor price),
  // NEVER on the agent's retail price or on what the customer paid — see the 31 Jul 2026
  // "Tier Bonus Formula, Updated" correction.
  // `min` is the monthly blended earnings needed to sit on the tier (§2:
  // store profit + commission + referral earnings, with referrals capped by the 70% real-
  // sales safeguard). Tiers are earned by volume, not bought.
  // Ids stay stable — they're written into delivered orders and ledger notes, so renaming
  // them would orphan that history. Only the display names changed.
  const TIERS = [
    { id: "starter", name: "Hustler",  fee: "GH₵0 – 800 / month",       rate: 0,    note: "Everyone starts here", min: 0 },
    { id: "silver",  name: "Grinder",  fee: "GH₵800 – 2,500 / month",   rate: 0.05, note: "Building momentum",    min: 800 },
    { id: "gold",    name: "Boss",     fee: "GH₵2,500 – 6,000 / month", rate: 0.08, note: "Consistent sellers",   min: 2500 },
    { id: "pro",     name: "Chairman", fee: "GH₵6,000+ / month",        rate: 0.13, note: "Top performers",       min: 6000 },
  ];

  // The tier a monthly score lands on, and the one above it (null at the top).
  const tierFor = (score) => {
    let i = 0;
    for (let k = 0; k < TIERS.length; k++) if (score >= TIERS[k].min) i = k;
    return { tier: TIERS[i], next: TIERS[i + 1] || null };
  };

  // §2 safeguard, mirrored from lib/server/tiers.ts so the progress bar can't promise a tier
  // the backend won't grant: referral earnings only count while real sales (store profit +
  // commission) are at least 70% of the blended total.
  const REAL_SALES_FLOOR = 0.7;
  const blendedEarnings = (storeProfit, commission, referrals) => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const sp = r2(Math.max(0, storeProfit || 0)), co = r2(Math.max(0, commission || 0)), rf = r2(Math.max(0, referrals || 0));
    const realSales = r2(sp + co);
    // Ceiling rounds DOWN so real sales are never left a hair under the 70% floor.
    const cap = realSales > 0 ? Math.floor((realSales / REAL_SALES_FLOOR) * 100) / 100 : 0;
    const total = r2(Math.min(realSales + rf, cap));
    const referralsCounted = r2(Math.max(0, total - realSales));
    return { storeProfit: sp, commission: co, referrals: rf, referralsCounted,
             referralsExcluded: r2(rf - referralsCounted), realSales, total, earned: r2(realSales + rf) };
  };

  // §1: what a tier pays on one order. The base is the MARGIN, never the retail price.
  const tierBonusOnMargin = (margin, rate) => {
    const m = Math.round((Number(margin) || 0) * 100) / 100;
    if (!(m > 0)) return 0;
    return Math.max(0, Math.min(Math.round(m * (Number(rate) || 0) * 100) / 100, m));
  };

  // ---- seed WALLET ledger (spendable money only): topup | purchase | refund ----
  const now = Date.now();
  const H = 3600e3, D = 24 * H;
  const seedLedger = [];

  // ---- seed COMMISSIONS (earnings, withdrawable separately from wallet) ----
  const seedCommissions = [];

  const seedOrders = [];

  const seedWithdrawals = [];

  // 7-day sales sparkline for the reseller (GH₵ value moved)
  const salesWeek = [
    { day: "Mon", value: 0, orders: 0 },
    { day: "Tue", value: 0, orders: 0 },
    { day: "Wed", value: 0, orders: 0 },
    { day: "Thu", value: 0, orders: 0 },
    { day: "Fri", value: 0, orders: 0 },
    { day: "Sat", value: 0, orders: 0 },
    { day: "Sun", value: 0, orders: 0 },
  ];

  // New agents start with a clean slate — real figures come from live orders/commissions.
  const resellerStats = {
    tier: "starter",
    rate: 0.08,
    available: 0,          // available to withdraw
    pending: 0,            // commission on processing orders
    thisMonth: 0,          // commission earned this calendar month
    lifetime: 0,           // lifetime commission
    ordersMonth: 0,
    customers: 0,
    referrals: 0,
    refCode: "",           // derived per-user in the UI
    monthGoal: 800,        // blended monthly earnings needed for the next tier (Grinder)
  };

  // ---- AGENT ONLINE STORE ----
  // theme swatches an agent can pick for their storefront
  const STORE_THEMES = ["#2F87FC", "#0E9E92", "#175BC4", "#7A3BEC", "#E8830C", "#12243F"];

  // Default store config a NEW agent starts from. Branding fields are blank so nothing
  // fake is shown — they're prefilled from the agent's own account on first load (see
  // store.tsx), and the agent edits them in My Store. `prices` = the agent's selling
  // price per bundle id; commission per sale = sellingPrice − wholesale(reseller) cost.
  const defaultStore = {
    handle: "",
    name: "My Data Store",
    tagline: "Cheap data & airtime, delivered to your phone in seconds.",
    theme: "#2F87FC",
    whatsapp: "",
    logo: null,                                        // data-URL of an uploaded logo (falls back to initials)
    shortSlug: "",                                     // branded short link → sdh.gh/<slug>
    customDomain: "",                                  // optional own domain (e.g. mystore.com) — verified by DNS
    waChannel: "",                                     // WhatsApp Channel (broadcast) link
    announcement: "",                                  // banner shown on the store
    open: true,
    promos: [],                                        // agent's discount codes (validated server-side at checkout)
    airtime: true,                                     // face value, no agent commission — agents can hide it
    checker: true,
    afa: true,
    nets: { mtn: true, telecel: true, atigo: true },
    // Optional product LINES. AT BigTime is opt-OUT (absent/true → listed); MTN Xpress is
    // opt-IN (must be exactly true) because it's a separate, pricier line an agent chooses
    // to sell. Read by S.dataLinesOf().
    xpress: false,
    prices: {
      mtn:     { d1: 6.00, d2: 11.50, d3: 16.50, d5: 25.00, d10: 46.00, d15: 65.00, d20: 84.00, d50: 188.00, d100: 338.00 },
      telecel: { d1: 5.50, d2: 10.50, d3: 15.50, d5: 23.50, d10: 43.50, d15: 62.00, d20: 80.00, d50: 182.00, d100: 330.00 },
      atigo:   { d1: 6.50, d2: 12.00, d3: 17.00, d5: 26.00, d10: 47.00, d15: 66.00, d20: 85.00, d50: 190.00, d100: 340.00 },
    },
    // (no afaPrice — AFA is priced by admins only and earns an agent nothing, so a store
    //  carries no AFA price of its own. See lib/server/afaPricing.ts.)
    checkerPrices: { wassce: 17.50, bece: 16.00, novdec: 18.00, cssps: 20.00 },
    dstvPrices: { padi: 80, yanga: 125, confam: 220, compact: 360, compactplus: 610, premium: 970 },
    streamPrices: { n1s1m: 35, n2s1m: 55, n1s3m: 95, nfull: 120, p1p1m: 25, p1p3m: 65, pfull: 90 },
    utilMarkup: { ecg: 2, water: 1.5 },                // % service margin on prepaid bills
  };

  // central agent pricing: returns { sell, cost, comm } for any product kind.
  // `sell` = what the customer pays, `cost` = agent wholesale, `comm` = agent commission.
  function agentQuote(store, kind, ctx) {
    store = store || {};
    const r2 = (n) => +(+n).toFixed(2);
    let sell, cost;
    switch (kind) {
      // Floored at wholesale to match priceStoreData() in lib/server/pricing.ts, which
      // charges wholesale for anything an agent has priced below it. If this copy didn't
      // floor too, the storefront would quote one price and the checkout would bill another.
      case "data":    sell = storePriceOf(store, ctx.priceKey || ctx.net, ctx.b.id, ctx.b.gb); if (sell == null) sell = ctx.b.price; cost = ctx.b.reseller; if (ctx.b.wholesale != null) sell = Math.max(sell, ctx.b.wholesale); break;
      // AFA: one admin-set price, charged to everyone, with NO agent margin. sell === cost
      // so comm is always 0 — an agent cannot mark it up or earn from a registration.
      case "afa":     sell = ctx.price; cost = ctx.price; break;
      case "checker": sell = (store.checkerPrices && store.checkerPrices[ctx.p.id]) ?? ctx.p.retail; cost = ctx.p.cost; break;
      case "dstv":    sell = (store.dstvPrices && store.dstvPrices[ctx.p.id]) ?? ctx.p.price; cost = r2(ctx.p.price * 0.975); break;
      case "stream":  sell = (store.streamPrices && store.streamPrices[ctx.p.id]) ?? ctx.p.price; cost = ctx.p.cost; break;
      case "meter":   { const mk = ((store.utilMarkup && store.utilMarkup[ctx.id]) ?? 0) / 100; cost = r2(ctx.amount); sell = r2(ctx.amount * (1 + mk)); break; }
      default: sell = 0; cost = 0;
    }
    return { sell: r2(sell), cost: r2(cost), comm: r2(sell - cost) };
  }

  // The price an agent has saved for one bundle, or null if they haven't set one.
  //
  // THIS MUST STAY IDENTICAL TO resolveStorePrice() in lib/server/pricing.ts. This copy draws
  // the storefront; that one decides the charge. If they resolve different keys, a customer is
  // shown one figure and billed another — which is exactly what used to happen here: this side
  // keyed only on the live bundle id while the server keyed only on "d"+gb.
  //
  // Two key generations exist in the wild, tried in a fixed order:
  //   1. the published bundle's id ("d1-1787432805465") — what My Store writes today
  //   2. the capacity-derived id ("d1") — older stores
  // Each nested-per-line first, then the legacy flat shape. `gb` may be undefined for the
  // non-data product families that also call this, and those simply fall through on key 2.
  function storePriceOf(store, net, id, gb) {
    const p = store && store.prices;
    if (!p) return null;
    const per = p[net];
    const keys = [id, gb == null ? null : "d" + gb].filter(Boolean);
    for (const k of keys) if (per && per[k] != null) return per[k];   // nested per-telco
    for (const k of keys) if (p[k] != null) return p[k];              // legacy flat
    return null;
  }

  // What a customer will actually be charged for one bundle on this store: the agent's own
  // price, falling back to platform retail when they haven't set one, floored at the
  // wholesale the platform pays. Every price shown to a shopper — and every price shown to
  // the agent while they set them — goes through here, so a below-cost figure can never be
  // advertised at one number and charged at another. Mirrors priceStoreData() on the server.
  function storeSellOf(store, priceKey, b) {
    const saved = storePriceOf(store, priceKey, b.id, b.gb);
    const sell = saved == null ? b.price : saved;
    // `wholesale` is only sent to agents and admins — a shopper is never told an agent's
    // cost. On a guest storefront it is absent and there is nothing to do here: those prices
    // arrive already floored from publicView(). Flooring against `reseller` instead would be
    // wrong, because for a guest it falls back to RETAIL.
    return b.wholesale == null ? sell : Math.max(sell, b.wholesale);
  }

  const storeOrdersSeed = [];

  // status timeline templates for the order detail view
  // Order timeline. Takes the ORDER, not just (status, at), because every time it shows is a
  // real server-recorded instant:
  //   at           payment received
  //   sentAt       we handed it to the provider (DataHub / Muviin)
  //   processingAt the provider reported it started sending
  //   deliveredAt  the provider confirmed delivery
  // A stage we have no timestamp for shows no time at all. This used to synthesise them
  // (at + 4s "sent", at + 12s "delivered"), which put invented times on every receipt —
  // times an agent would quote to a customer in a dispute.
  //
  // Still accepts the old (status, at) call shape so nothing breaks on a stale caller.
  const orderTimeline = (order, atArg) => {
    const o = (order && typeof order === "object") ? order : { status: order, at: atArg };
    const status = o.status, at = o.at;
    const unpaid = status === "pending";  // captured, payment not confirmed yet
    const sentAt = o.sentAt || null, processingAt = o.processingAt || null;
    const deliveredAt = o.deliveredAt || null, failedAt = o.failedAt || null, refundedAt = o.refundedAt || null;
    const base = [
      { key: "paid", label: unpaid ? "Waiting for payment…" : "Payment received", at: unpaid ? null : at, done: !unpaid },
      { key: "sent", label: "Sent to provider", at: unpaid ? null : sentAt, done: !unpaid },
    ];
    // "Started sending" is its own stage once the provider has reported it — that's the
    // second of the three provider milestones and it has its own recorded time.
    if (processingAt && status !== "waiting") base.push({ key: "processing", label: "Provider started sending", at: processingAt, done: true });

    if (status === "delivered") base.push({ key: "delivered", label: "Delivered to customer", at: deliveredAt, done: true });
    else if (status === "pending") base.push({ key: "pending", label: "Delivery starts once payment clears", at: null, done: false, active: true });
    else if (status === "waiting") base.push({ key: "waiting", label: "Waiting in queue…", at: null, done: false, active: true });
    else if (status === "processing") base.push({ key: "delivering", label: "Delivering…", at: null, done: false, active: true });
    else if (status === "failed") base.push({ key: "failed", label: "Provider rejected — retry needed", at: failedAt, done: true, bad: true });
    else if (status === "refunded") { base.push({ key: "failed", label: "Delivery failed", at: failedAt, done: true, bad: true }); base.push({ key: "refunded", label: "Auto-refunded to customer", at: refundedAt, done: true }); }
    return base;
  };

  // ---- Bulk SMS templates ----
  // Starting points an agent can insert and then edit — the message is always editable after
  // picking one, so a template is a head start, never a fixed send.
  //
  // PROVISIONAL: replace the bodies below with the approved wordings. Keep each under 160
  // characters so it stays a single billable page (see smsPageCount), and keep them GSM-7 —
  // a curly quote or emoji drops the whole message to 70 characters per page and doubles the
  // cost of every send.
  // `[Agent Store Link]` is substituted with the agent's own storefront URL when a template
  // is inserted (see SmsCompose) — they never paste their link by hand.
  //
  // Apostrophes here are deliberately ASCII ('), not curly (\u2019). One curly quote drops the
  // whole message from GSM-7 to UCS-2, where a page holds 70 characters instead of 160 — which
  // doubles the cost of every recipient. Keep it that way when editing.
  const STORE_LINK_TOKEN = "[Agent Store Link]";
  const smsTemplates = [
    { id: "promo", name: "Promo", body: "PROMO\n\nGet great data packages at competitive prices with fast delivery. Order now from your trusted agent.\n\nShop now: [Agent Store Link]" },
    { id: "missyou", name: "We miss you", body: "WE MISS YOU\n\nIt's been a while since your last order. Come back and enjoy great data packages, competitive prices and fast delivery.\n\nOrder now: [Agent Store Link]" },
    { id: "were-back", name: "We're back", body: "WE'RE BACK\n\nWe're back and ready to serve you with fast and reliable deliveries. Thank you for staying with us.\n\nPlace your order now: [Agent Store Link]" },
    { id: "need-data", name: "Need data?", body: "NEED DATA?\n\nGet your data bundles quickly and at great prices. Place your order today and enjoy fast delivery.\n\nShop now: [Agent Store Link]" },
    { id: "restock", name: "Bundles back in stock", body: "Data bundles are available again. Send us a message to order and we'll deliver straight to your number. Thank you for buying from us." },
    { id: "pricedrop", name: "Price drop", body: "Good news - our data prices have dropped. Message us for the new rates and order today while they last." },
    { id: "winback", name: "We miss you (short)", body: "It's been a while! We've still got fast, reliable data bundles at great prices. Message us anytime to order." },
    { id: "thanks", name: "Thank you", body: "Thank you for your order. We appreciate your business - message us anytime you need data or airtime." },
    { id: "hours", name: "Opening hours", body: "We are open and ready to serve you today. Message us to order your data bundle and get it delivered in seconds." },
  ];

  // ---- Customers, derived from the agent's real storefront orders ----
  // One entry per phone number that has bought from this store. Lives here rather than in a
  // page component because two screens need the SAME definition: the Customers page and the
  // Bulk SMS recipient lists. Two copies of "who is a customer" would eventually disagree,
  // and the SMS one costs real money per number.
  //
  // ACTIVE = bought within the last 30 days. Anything older is INACTIVE — the people worth
  // sending a win-back message to.
  const CUSTOMER_ACTIVE_DAYS = 30;
  const customersFrom = (storeOrders) => {
    const byPhone: Record<string, any> = {};
    (storeOrders || []).forEach(o => {
      const key = o.customer;
      if (!key) return;
      const c = byPhone[key] || (byPhone[key] = { name: o.customerName || "Customer", phone: key, net: o.net, orders: 0, spent: 0, last: o.at });
      c.orders += 1;
      c.spent += (o.price || 0);
      if (o.at > c.last) { c.last = o.at; c.net = o.net; }
    });
    const cutoff = Date.now() - CUSTOMER_ACTIVE_DAYS * DAY_MS;
    return Object.values(byPhone)
      .map(c => ({ ...c, active: c.last >= cutoff }))
      .sort((a, b) => b.spent - a.spent);
  };

  const storeStats = { visitsToday: 0, visits7d: 0, ordersTotal: 0, conversion: 0, storeCommissionMonth: 0 };

  // ---- STORE INSIGHTS (agent storefront analytics) ----
  const storeInsights = {
    revenue7d: 0, revenuePrev7d: 0,
    visits7d: 0, visitsPrev7d: 0,
    orders7d: 0, ordersPrev7d: 0,
    conversion: 0, conversionPrev: 0,
    newCustomers: 0, repeatCustomers: 0, repeatRate: 0,
    avgOrder: 0,
    days: [
      { day: "Mon", visits: 0, orders: 0, revenue: 0 },
      { day: "Tue", visits: 0, orders: 0, revenue: 0 },
      { day: "Wed", visits: 0, orders: 0, revenue: 0 },
      { day: "Thu", visits: 0, orders: 0, revenue: 0 },
      { day: "Fri", visits: 0, orders: 0, revenue: 0 },
      { day: "Sat", visits: 0, orders: 0, revenue: 0 },
      { day: "Sun", visits: 0, orders: 0, revenue: 0 },
    ],
    hours: [ ["12–4a", 0], ["4–8a", 0], ["8–12p", 0], ["12–4p", 0], ["4–8p", 0], ["8–12a", 0] ],
    topProducts: [],
    sources: [],
  };

  // ---- DISCOUNT CODES / PROMOS (agent-created, used on their storefront) ----
  // type: "percent" (value = %) | "fixed" (value = GH₵ off).  scope: "all" | net id
  // max 0 = unlimited uses.  expires null = no expiry.
  const promosSeed = [];

  // ---- admin seed ----
  const adminOrders = [];

  const adminWithdrawals = [];

  const adminUsers = [];

  const adminStats = { revenueToday: 0, ordersToday: 0, deliveredRate: 0, pendingPayouts: 0, activeResellers: 0 };

  // ---- RESULTS CHECKER vouchers (Ghana exam checkers) ----
  const checkerProducts = [
    { id: "wassce", name: "WASSCE Checker", body: "WAEC", retail: 17.50, cost: 15.50, stock: 240, blurb: "WASSCE results checker PIN & serial" },
    { id: "bece",   name: "BECE Checker",   body: "WAEC", retail: 16.00, cost: 14.20, stock: 188, blurb: "BECE results checker PIN & serial" },
    // Muviin supplies WASSCE and BECE only, so these two can't be fulfilled and aren't offered.
    { id: "novdec", name: "Nov/Dec Checker",body: "WAEC", retail: 18.00, cost: 16.00, stock: 96,  blurb: "GCE Nov/Dec results checker", available: false },
    { id: "cssps",  name: "School Placement",body: "CSSPS",retail: 20.00, cost: 18.00, stock: 134, available: false, blurb: "SHS placement checker (CSSPS)" },
  ];
  const checkerSales = [];

  // ---- BULK SMS ----
  const senderIds = [];
  const smsHistory = [];
  const smsRate = 0.03; // per page (160 chars) per recipient

  // ---- COMPLAINTS / support tickets ----
  const complaintsSeed = [];

  // ---- API access ----
  const apiInfo = {
    key: "sdh_live_4f8c21a9e7b6d3c0",
    base: "https://api.smartdatahubgh.com/v1",
    callsMonth: 4120, successRate: 0.991,
    endpoints: [
      ["POST", "/orders/data", "Buy a data bundle for any number"],
      ["POST", "/orders/airtime", "Send airtime to a number"],
      ["GET",  "/balance", "Check your wallet balance"],
      ["GET",  "/orders/{id}", "Look up an order & its status"],
      ["POST", "/webhooks", "Register a delivery callback URL"],
    ],
  };

  // ---- What's new / changelog ----
  const changelog = [
    { date: "30 Aug 2026", tag: "Improved", title: "Bulk SMS now sends from OrderRef", body: "Campaigns you send with the shared sender ID now arrive as OrderRef instead of SDH Ghana, so your promotions no longer look like they came from us. Sender IDs you registered yourself are unchanged." },
    { date: "26 Aug 2026", tag: "Improved", title: "Support now has its own inbox", body: "Replies from our support team now come from support@sdhghana.com, so you can just hit reply and reach a real person. Codes, receipts and order updates still arrive from noreply@sdhghana.com. Add both to your contacts so nothing lands in spam." },
    { date: "26 Aug 2026", tag: "Fixed", title: "Store prices can no longer fall below your cost", body: "If a bundle on your store was priced under what the platform charges you for it \u2014 a mistyped 2 instead of 12, say \u2014 customers were being charged that lower price. Your store now sells at your wholesale cost as the minimum, and the price box under My Store snaps back up if you type anything below it, so a slip can never sell a bundle at a loss." },
    { date: "22 Aug 2026", tag: "New", title: "MTN numbers are checked before you pay", body: "If an MTN number has been refused before and isn't on the beneficiary list yet, the order now stops before any money moves and shows a clear caution. No charge, no refund to wait for. Once the number is verified, orders to it go through as normal." },
    { date: "22 Aug 2026", tag: "New", title: "MTN Xpress bundles", body: "MTN data now comes in two lines: Standard and Xpress, delivered on a priority queue. Both are priced separately on the Pricing page, and you can switch MTN Xpress on for your store from My Store — it stays off until you do." },
    { date: "22 Aug 2026", tag: "Improved", title: "Faster, steadier data delivery", body: "Data for every network is now delivered through a new supplier. Orders are confirmed back to us the moment their status changes, so your customers see Delivered sooner and stuck orders are rarer." },
    { date: "15 Aug 2026", tag: "Improved", title: "No more Back button on your store", body: "Your public storefront no longer shows a Back button in the header — it used to send your customers to the Smart Data Hub homepage. They now stay in your shop. You still get one when you preview your own store from the app." },
    { date: "15 Aug 2026", tag: "Improved", title: "When your withdrawal is paid out", body: "Withdrawals are processed on weekdays after 11am, following our payment partner's settlement schedule. Requests made on weekends or after our daily cutoff are processed the next business day. You'll now see this on the withdrawal screen and on your payouts page, so you know when to expect the money." },
    { date: "15 Aug 2026", tag: "New", title: "Confirm the name on your mobile money", body: "Withdrawals now ask for the name your payout number is registered to. It's prefilled from your account and you can change it — useful if you cash out to a number in someone else's name. You'll see it on the confirmation screen before you approve, so a wrong destination is caught before any money moves." },
    { date: "15 Aug 2026", tag: "Fixed", title: "Real delivery times on every order", body: "Your order timeline now shows three recorded times: when we sent it to the provider, when the provider started sending, and when it was delivered. These are actual recorded moments — before, the middle times were estimated from when the order was placed, so what you quoted a customer could be wrong." },
    { date: "15 Aug 2026", tag: "Fixed", title: "Utilities show as coming soon on your store", body: "Electricity, water, DStv and streaming were listed on storefronts as if customers could buy them. They now show as Coming soon and can't be checked out — the same as in your app. Your customers won't be given a confirmation for something that can't be delivered yet." },
    { date: "15 Aug 2026", tag: "New", title: "Message your customers in one tap", body: "Bulk SMS can now load your customer list for you — All customers, Active (bought in the last 30 days) or Inactive (no order in 30 days), each showing how many numbers it holds before you load it. There are also ready-made templates — Promo, We miss you, We're back and Need data? — and your own store link is filled in automatically. Every template stays editable before you send." },
    { date: "15 Aug 2026", tag: "New", title: "Report beneficiary numbers in bulk", body: "Collected a batch of numbers MTN refused? Paste them all into Beneficiary problem at once — separated by commas, spaces or new lines. You'll see how many are valid before you send, and any that are mistyped are flagged instead of silently dropped." },
    { date: "15 Aug 2026", tag: "New", title: "Report a beneficiary problem from the order itself", body: "Open any MTN data order that hasn't delivered and you'll find a Report beneficiary problem button. One tap sends that number to our team with the order reference attached — no retyping. Reporting from your dashboard still works too." },
    { date: "15 Aug 2026", tag: "Improved", title: "Reporting a beneficiary problem is one step", body: "Sending us a number that MTN refused now just needs the number — no customer name, no picking an error from a list. Fewer taps, same result." },
    { date: "15 Aug 2026", tag: "Fixed", title: "Results checker prices now match everywhere", body: "The results checker was showing one price on the checker page, another on storefronts, and charging a third. All three now come from the published price list, so your wholesale, your set price and your profit are the real figures." },
    { date: "15 Aug 2026", tag: "Improved", title: "Shorter order numbers", body: "Order numbers are now short enough to read out or type — like SO-K7M2XQ instead of the long string of digits. Older orders keep the number they were given, and both still work when you look one up." },
    { date: "15 Aug 2026", tag: "Fixed", title: "The price you see is the price you pay", body: "In some cases the buy screen showed one price while mobile money charged a different one. The amount now comes straight from our live price list, and an order won't go through at all if it doesn't match what you were shown — so what's on the Amount to pay line is exactly what leaves your account." },
    { date: "15 Aug 2026", tag: "Improved", title: "Emails now come from Smart Data Hub", body: "Your verification codes, receipts and order updates now arrive from noreply@sdhghana.com instead of a personal Gmail address. Add it to your contacts so codes don't land in spam. Replies go to our support inbox as usual." },
    { date: "12 Aug 2026", tag: "Improved", title: "See exactly where your order is", body: "Orders now show Waiting while the network has your order in the queue, and Processing once it's actually being sent. Before, everything simply said Processing until it landed. Your order page and the tracking timeline both update on their own as it moves along." },
    { date: "12 Aug 2026", tag: "Fixed", title: "Your order appears the moment you go to pay", body: "Orders now show up in your list as soon as you're taken to the payment page, marked Pending until your payment clears. If a payment ever goes through without reaching us, there's still an order — with its own number — to point at instead of nothing at all." },
    { date: "06 Aug 2026", tag: "Fixed", title: "Store orders that took payment but never arrived", body: "Orders placed on an agent's store since 31 July were charged but never delivered. That's fixed — store orders now go through properly again. We've also made sure that if anything ever goes wrong while an order is being processed, the customer's money is returned to their mobile money automatically instead of being held." },
    { date: "06 Aug 2026", tag: "New", title: "Sell airtime on your store", body: "Your store can now sell airtime alongside data. Customers pick a network and an amount, pay by mobile money, and the credit lands on their phone straight away. Airtime sells at face value — the same price everywhere — so there's no commission on it, and you can switch it off under My Store if you'd rather not offer it." },
    { date: "06 Aug 2026", tag: "Improved", title: "Your store opens in its own tab", body: "Tapping Open my store now opens your live storefront in a new browser tab, so you see exactly what your customers see while your dashboard stays open behind it." },
    { date: "06 Aug 2026", tag: "New", title: "Bulk SMS is back — and it really sends", body: "Message your customers straight from the app. Paste your numbers, type your message, and see exactly what it will cost before you send. It's charged from your wallet per page per recipient, and any number the network refuses is refunded to you automatically. Find it under Bulk SMS." },
    { date: "06 Aug 2026", tag: "New", title: "Send under your own business name", body: "Your messages can show up as your own name on your customers' phones instead of ours. Request a sender ID under Bulk SMS → Sender IDs — up to 11 characters — and we'll register it with the networks for you. Approval usually takes a few hours, and you can send with the shared Smart Data Hub sender in the meantime." },
    { date: "03 Aug 2026", tag: "New", title: "Report a beneficiary problem in one tap", body: "When an MTN order fails because the number isn't on the beneficiary list, you can send it to us straight from your dashboard — number, customer name and the error you saw. Our team adds it upstream and clears it. Orders that fail this way are now also picked up automatically, so nothing gets lost." },
    { date: "03 Aug 2026", tag: "New", title: "Set your own AFA price and keep the profit", body: "You can now set what you charge for MTN AFA registration on your store, from Pricing → AFA. You keep everything above the platform fee, paid into your wallet once our team approves the registration. AFA doesn't earn a tier bonus or any other reward — your own margin is the whole of it — and your price can't be set below the platform fee." },
    { date: "03 Aug 2026", tag: "Improved", title: "Meet your new tiers — Hustler, Grinder, Boss, Chairman", body: "The agent tiers have new names: Hustler (0%), Grinder (5%), Boss (8%) and Chairman (13%). The earnings needed for each one are unchanged, and you keep climbing on your blended monthly earnings — store profit, commission and referrals combined." },
    { date: "03 Aug 2026", tag: "Fixed", title: "Tier bonus is now worked out correctly", body: "Your tier bonus is calculated on our own margin, not on your resale price — so setting higher prices never changes it, and the amount you see on the buy screen is what you'll be paid. The screen now shows that exact bonus, confirmed once the order is delivered, instead of your own margin." },
    { date: "03 Aug 2026", tag: "Improved", title: "Accurate AFA details", body: "The About AFA information now reflects what AFA actually gives you — discounted voice and SMS packages bought by dialling *1848#, not data bundles — and states honestly that MTN verification takes 1 to 3 working days. AFA is brought to you by MTN in partnership with Prepeez Limited." },
    { date: "03 Aug 2026", tag: "New", title: "AFA registration on every agent store", body: "Customers can now register for MTN AFA straight from an agent's store — no account needed, pay by mobile money. Every registration is reviewed by our team, and the applicant gets an SMS and email when it's submitted and again once it's approved." },
    { date: "03 Aug 2026", tag: "Improved", title: "One AFA price, checked Ghana Card", body: "AFA registration now costs the same everywhere, set by Smart Data Hub. Ghana Card numbers are checked as you type, and a card that's already registered with us can't be used twice. Phone numbers are entered in local form — 10 digits starting with 0, like 0509379146." },
    { date: "02 Aug 2026", tag: "New", title: "Join our WhatsApp channel while you wait", body: "Applied to become an agent? Your confirmation text and email now include a link to our WhatsApp channel, so you can follow price drops, restocks and tips while your application is being reviewed." },
    { date: "02 Aug 2026", tag: "Improved", title: "Tidier delivery texts", body: "Our SMS messages no longer repeat our name inside the message — the sender already shows as SDH Ghana. You get straight to the important part: what was sent, the number, and your PIN or reference." },
    { date: "02 Aug 2026", tag: "New", title: "Email receipts for every delivery", body: "As soon as an order is confirmed delivered, we email you a receipt showing what was sent, the number it went to, the order reference and what you paid. The recipient still gets their delivery text as usual. Receipts go to the email address on your account." },
    { date: "02 Aug 2026", tag: "Improved", title: "Buying is a lot faster", body: "Your receipt now appears as soon as the order is placed instead of holding you on a loading screen until delivery confirms — that wait could stretch past a minute. The status updates to Delivered on the spot when it lands, and if anything fails you'll see the refund right there." },
    { date: "02 Aug 2026", tag: "Fixed", title: "Airtime top-ups are going through again", body: "Sending airtime was failing with an error message instead of delivering. That's fixed — top-ups reach the number as normal. Each top-up can be between GH₵1 and GH₵500, and anything outside that is now flagged before you pay rather than after." },
    { date: "02 Aug 2026", tag: "Fixed", title: "Result checker orders no longer fail by mistake", body: "Some WASSCE and BECE checker orders were being marked failed and refunded even though the purchase had actually gone through. Orders now settle correctly, so a successful purchase stays in your history and reaches you instead of being reversed." },
    { date: "31 Jul 2026", tag: "Fixed", title: "Prices can now include pesewas", body: "Setting a price with a decimal — GH₵5.50, GH₵0.75 — works properly. The decimal point used to disappear as you typed it, so prices could only be whole cedis. Applies everywhere you set a price: your store prices, AFA, checkers and the admin pricing pages." },
    { date: "31 Jul 2026", tag: "Improved", title: "Notifications open in a quick pop-up", body: "Tapping the bell now shows your latest notifications in a small window instead of taking you to a whole new page. Open one to jump straight to it, mark everything read, or tap View all to see your full history." },
    { date: "31 Jul 2026", tag: "Improved", title: "Admins land in the admin panel", body: "Signing in with an admin account now takes you straight to the admin dashboard instead of the agent view. You can still switch to the Agent or Customer view any time from the account menu, and it stays on whichever you picked." },
    { date: "31 Jul 2026", tag: "New", title: "Recruit other agents and earn an override", body: "Bring another agent onto the platform and you'll earn 2% of the commission they make for their first 60 days (up to GH₵500 of their earnings), capped at GH₵50 a month. One level only — simple and transparent." },
    { date: "31 Jul 2026", tag: "Improved", title: "New tiers — and your bonus is now paid on every order", body: "Four tiers now: Starter, Silver (5%), Gold (8%) and Pro (13%), based on what you earn each month. Your tier percentage is paid on the margin of each order you sell, and it lands in your wallet automatically once the order is delivered." },
    { date: "31 Jul 2026", tag: "Improved", title: "Refer & earn has changed", body: "You now get GH₵3 and your friend gets GH₵2 off their next order — paid once their first order is actually delivered, not just when they sign up. Referral credit is spendable on anything, lasts 60 days, and you can earn on up to 10 referrals a month." },
    { date: "30 Jul 2026", tag: "New", title: "Airtime top-ups are live", body: "Send airtime to any MTN, Telecel or AT number for real — pay from your wallet or with mobile money and the credit lands on the number in seconds. Airtime is face value, the same price for everyone, and if a top-up can't be sent you're refunded automatically." },
    { date: "30 Jul 2026", tag: "Fixed", title: "Accurate times on every order and transaction", body: "Orders now record exactly when they were placed, delivered, failed and refunded — and receipts, order tracking, your history and CSV exports all show those real times in Ghana time, whatever device you're on. Delivery times are no longer estimated, and a bundle's expiry date is worked out from its actual validity." },
    { date: "30 Jul 2026", tag: "New", title: "Refer & earn — for real", body: "Your referral code is now live. Share your link and see exactly who joined and what you've earned. (Rewards were updated on 31 Jul — see the newer entry.)" },
    { date: "30 Jul 2026", tag: "Improved", title: "Tier progress now counts everything you earn", body: "Your tier is worked out from all three ways you earn in a month — profit from your store, commission on your sales and referral bonuses — with a breakdown showing what each one contributed. Hit the monthly goal and you move up a tier automatically." },
    { date: "30 Jul 2026", tag: "New", title: "Your notifications, all in one place", body: "Tap the bell at the top of any page to see everything that's happened on your account — data delivered, wallet top-ups, refunds, store sales, payouts and replies from support. A badge shows how many are new, and you can mark them read or clear them. Announcements from our team land here too." },
    { date: "29 Jul 2026", tag: "Improved", title: "Always up-to-date bundles & prices", body: "Data bundles, prices and validity now update everywhere the moment we change them — so the bundle list you see in the app and on your store is always the current one, and your commission is calculated on the same prices." },
    { date: "26 Jul 2026", tag: "New", title: "Become an agent — right from your account", body: "Any customer can now apply to become an agent from their dashboard. Once our team approves you, you unlock your agent store, wholesale prices and commission — and you can switch between your Agent and Customer views anytime. You're notified by SMS and email at every step." },
    { date: "25 Jul 2026", tag: "New", title: "Buy WASSCE & BECE result checkers", body: "Result checkers are now live — buy a WASSCE or BECE checker and pay from your wallet. Your serial and PIN are sent by SMS and also show up under your orders. Fast, reliable delivery." },
    { date: "25 Jul 2026", tag: "Improved", title: "Get notified when support replies", body: "When our team replies to your complaint, you'll get an email — and a badge appears on the Complaints menu so you never miss a response. Open the complaint to see the reply and the badge clears." },
    { date: "25 Jul 2026", tag: "New", title: "Raise & track support complaints", body: "Something went wrong with an order? Open a complaint from the Complaints page and chat with our support team in a live thread — you'll see replies and the status (open, in review, resolved) update in real time, no email needed." },
    { date: "23 Jul 2026", tag: "New", title: "Customers can buy from your store — and you get paid", body: "Your storefront is now fully live for data. Customers pay by mobile money and their bundle is delivered automatically, while your profit is added to your wallet on every sale. Just share your store link and start earning." },
    { date: "22 Jul 2026", tag: "New", title: "Add a profile picture", body: "You can now upload a profile picture from your Settings page — it shows on your account and across the app. Your shop link is now on your Settings page too, ready to copy or share in a tap." },
    { date: "21 Jul 2026", tag: "New", title: "Your own shareable store link", body: "Every agent now has a live store at your own web link — just smartdatahubgh.com/your-store-name. Share it on WhatsApp, status or flyers and customers can buy your data directly. Set it up from My Store, then tap Share." },
    { date: "20 Jul 2026", tag: "New", title: "Delivery confirmation by SMS", body: "As soon as a data bundle is sent, the recipient now gets a text message confirming the bundle, network and order reference — so they know it's on the way." },
    { date: "19 Jul 2026", tag: "Improved", title: "Verification codes now come by email", body: "Sign-up and password-reset codes are now sent to your email, so you get them right away instead of waiting on SMS. Check your inbox (and spam folder) for your 4-digit code." },
    { date: "19 Jul 2026", tag: "New", title: "Pay for data with mobile money", body: "Buying data? You can now pay directly with mobile money at checkout — no need to fund your wallet first. Your bundle is delivered the moment your payment clears, and you're automatically refunded to your wallet if it can't be delivered." },
    { date: "19 Jul 2026", tag: "Improved", title: "Smoother wallet funding", body: "Funding your wallet now opens a secure Paystack checkout so you can pay with mobile money, card or bank. Paying from your wallet balance also works reliably whenever you have enough funds." },
    { date: "13 Jul 2026", tag: "Improved", title: "Your wallet is now live", body: "Your wallet balance and transaction history are saved to your account and update in real time as you top up and buy — always accurate, on every device you sign in from." },
    { date: "13 Jul 2026", tag: "Improved", title: "Manage your profile & security", body: "Your profile page now fully works — update your name and email, change your password, and pick which notifications you receive. Changes are saved to your account straight away." },
    { date: "13 Jul 2026", tag: "Improved", title: "Resend your verification code", body: "Didn't get your code? You can now resend it right from the verification screen, with a short countdown so you know when it's ready to try again — handy if your SMS is slow to arrive." },
    { date: "16 Jul 2026", tag: "New", title: "Fund your wallet by card or mobile money", body: "Top up your wallet instantly through a secure checkout — pay with any bank card or mobile money, and your balance updates the moment your payment clears." },
    { date: "11 Jul 2026", tag: "Improved", title: "Secure accounts with SMS verification", body: "Creating an account now confirms your phone number with a one-time code sent by SMS, and your sign-in is protected by a secure session — so you stay safely signed in across visits." },
    { date: "22 Jun 2026", tag: "Improved", title: "Clearer, safer sign-up", body: "Creating an account now asks you to confirm your password with a live “passwords match” check, and an eye icon in the box lets you show or hide what you typed." },
    { date: "22 Jun 2026", tag: "Improved", title: "Safer payouts, your way", body: "Withdrawals now ask for a one-time SMS code before they're submitted. You can also switch on auto-approve so verified payouts up to a limit you set are sent instantly — no admin wait." },
    { date: "22 Jun 2026", tag: "New", title: "AT iShare & BigTime, side by side", body: "AT data now shows as two clear lines — iShare for instant standard bundles and BigTime for bulk data that never expires. Price each one separately in My Store." },
    { date: "22 Jun 2026", tag: "New", title: "How-to Guides", body: "A new How-to Guides page walks you through buying, funding your wallet, setting up your store, tracking orders and getting paid — each with a simple diagram." },
    { date: "22 Jun 2026", tag: "New", title: "Track your order, live", body: "Customers can now follow their order from payment to delivery in real time — a live status card shows when it was placed, when it arrived and how long it took. Look for “Track order” on any store." },
    { date: "22 Jun 2026", tag: "Improved", title: "A fresh look for your store", body: "Storefronts got a cleaner, bolder redesign — a brighter hero, network-coloured bundle cards and tidier sections that make your deals pop and load fast on any phone." },
    { date: "21 Jun 2026", tag: "New", title: "Store insights", body: "My Store now shows visits, orders, revenue, your best-selling bundles, busiest hours and where your customers come from — all for the last 7 days." },
    { date: "21 Jun 2026", tag: "New", title: "Discount codes", body: "Create your own promo codes (percent or cash off) for your storefront. Customers enter them at checkout and the saving comes out of your margin." },
    { date: "21 Jun 2026", tag: "New", title: "Share kit for your store", body: "Generate ready-to-post WhatsApp status images, social posts and printable flyers branded with your store, deals and QR — plus a copy-ready caption." },
    { date: "21 Jun 2026", tag: "New", title: "Bring your own domain", body: "Point your own web address (like yourname.com) at your store, with a free SSL certificate once it's verified." },
    { date: "20 Jun 2026", tag: "New", title: "Smoother page loading", body: "Switching between pages now shows a quick loading placeholder while your content gets ready — across both the app and the website." },
    { date: "20 Jun 2026", tag: "New", title: "Animated app launch", body: "Opening the app now greets you with a short branded splash — the Smart Data Hub mark with a signal pulse — before your screen loads." },
    { date: "20 Jun 2026", tag: "New", title: "Agents add a business name", body: "Choosing Become an agent at sign-up now asks for your business or store name, and you can open the full Terms & Conditions straight from the agreement checkbox." },
    { date: "20 Jun 2026", tag: "New", title: "Remember me & Terms checkbox", body: "Sign-in now has a Remember me option, and creating an account asks you to tick that you accept the Terms & Conditions first." },
    { date: "20 Jun 2026", tag: "Improved", title: "Cleaner sign-up on mobile", body: "On the phone, the sign-up form now shows one field per line with right-sized text, so everything's easy to read and fill in." },
    { date: "20 Jun 2026", tag: "Improved", title: "A warmer welcome", body: "The sign-in and sign-up screens got a friendlier look — a softer card, a warm welcome badge and a more personable feel." },
    { date: "20 Jun 2026", tag: "Improved", title: "Simpler way to reach us", body: "The contact page now leads with our WhatsApp Channel and a quick message form — now with an email field so we can reply your way." },
    { date: "20 Jun 2026", tag: "New", title: "AT iShare & BigTime bundles", body: "Pick AT (AirtelTigo) for data and choose between iShare for instant delivery or BigTime bundles that never expire." },
    { date: "20 Jun 2026", tag: "New", title: "More ways to brand your store", body: "Upload your own store logo, claim a short sdh.gh link, add your WhatsApp Channel and post an announcement banner — all from My Store." },
    { date: "20 Jun 2026", tag: "Improved", title: "One polished dark look", body: "Smart Data Hub now runs in a single, refined dark theme across the app and the website — easier on the eyes, day or night." },
    { date: "20 Jun 2026", tag: "Fixed", title: "Always a way back home", body: "You can now return to the homepage or your dashboard from the sign-in, sign-up and legal pages in one tap." },
    { date: "19 Jun 2026", tag: "New", title: "Smart Data Hub goes mobile", body: "A full mobile app experience with a slide-in menu, bottom quick-access bar and a Buy sheet — every screen resized for the phone." },
    { date: "19 Jun 2026", tag: "Improved", title: "Dark mode everywhere", body: "The whole app and website now use a consistent dark theme that's remembered across visits." },
    { date: "19 Jun 2026", tag: "Improved", title: "Right-sized mobile text", body: "Refined the type scale on every mobile screen — tighter, cleaner and better aligned so pages are easy to read at a glance." },
    { date: "19 Jun 2026", tag: "Improved", title: "Side menu matches your theme", body: "The side menu is now light in light mode and dark in dark mode, so it always blends with the rest of the app." },
    { date: "19 Jun 2026", tag: "New", title: "Terms, FAQ & legal in one tap", body: "Read the full Terms & Conditions and an expanded FAQ right inside the app — and the Terms link is now tappable on the login and sign-up screens." },
    { date: "19 Jun 2026", tag: "Improved", title: "Simpler, safer AFA registration", body: "AFA registration now uses the Ghana Card only and shows a clear no-refunds notice — double-check details before you submit." },
    { date: "18 Jun 2026", tag: "Improved", title: "Tidier side menu", body: "The side menu now groups into collapsible dropdowns, so you can focus on the section you need." },
    { date: "18 Jun 2026", tag: "New", title: "Terms & Conditions", body: "Our full Terms & Conditions are now published — covering orders, eligibility, refunds and more. Find them in the footer or under Settings." },
    { date: "17 Jun 2026", tag: "Fixed", title: "Clearer dark mode", body: "Fixed contrast on notices, cards and the login screen so text stays readable in dark mode." },
    { date: "12 Jun 2026", tag: "New", title: "Your own online store", body: "Launch a branded storefront on a shareable link — customers buy directly and you earn automatically." },
    { date: "08 Jun 2026", tag: "Improved", title: "Faster Telecel delivery", body: "Average Telecel data delivery is now under 12 seconds." },
    { date: "01 Jun 2026", tag: "New", title: "Results Checker vouchers", body: "Sell WASSCE, BECE, Nov/Dec and school-placement checkers from your dashboard." },
    { date: "24 May 2026", tag: "Fixed", title: "Wallet top-up receipts", body: "MoMo top-ups now show a clear reference on every receipt." },
  ];

  // ---- Customer-facing What's New (simpler, store-shopper wording) ----
  const customerChangelog = [
    { date: "26 Aug 2026", tag: "Improved", title: "Write to us at support@sdhghana.com", body: "Our support inbox is now on our own domain, and it is the address every reply comes from — so replying to a support email reaches us directly. Codes and receipts still come from noreply@sdhghana.com." },
    { date: "22 Aug 2026", tag: "New", title: "We check MTN numbers before you pay", body: "Some MTN numbers can't receive data until they've been verified. We now check before taking payment and tell you right away, so you're never charged for an order that can't be delivered." },
    { date: "22 Aug 2026", tag: "New", title: "MTN Xpress bundles", body: "Buying MTN data? You can now choose Xpress for priority delivery, or stick with the standard bundle — both are shown side by side with their own prices." },
    { date: "22 Aug 2026", tag: "Improved", title: "Faster data delivery", body: "Data for MTN, Telecel and AT is now delivered through a new supplier, so orders land sooner and you'll see the status update the moment it changes." },
    { date: "15 Aug 2026", tag: "Fixed", title: "Results checker prices now match everywhere", body: "The results checker was showing a different price depending on where you looked. Every screen now shows the same, current price — and it's what you'll be charged." },
    { date: "15 Aug 2026", tag: "Fixed", title: "Utilities marked coming soon", body: "Electricity, water, DStv and streaming are listed but not available to buy yet. They now clearly show as Coming soon, so you won't start a purchase that can't be completed." },
    { date: "15 Aug 2026", tag: "Improved", title: "See exactly when each step happened", body: "Tracking now shows the real time your order was sent to the network, when the network started sending it, and when it was delivered — not estimates." },
    { date: "15 Aug 2026", tag: "New", title: "Track your order with your phone number", body: "Lost your receipt? Enter the phone number you bought for in Track order and we'll pull up your recent orders from this store. Order numbers are also much shorter now — like SO-K7M2XQ — so they're easy to read out or type." },
    { date: "15 Aug 2026", tag: "Fixed", title: "The price you see is the price you pay", body: "In some cases the buy screen showed one price while mobile money charged a different one. The amount now comes straight from our live price list, and an order won't go through at all if it doesn't match what you were shown — so what's on the Amount to pay line is exactly what leaves your account." },
    { date: "15 Aug 2026", tag: "Improved", title: "Emails now come from Smart Data Hub", body: "Your verification codes and order receipts now arrive from noreply@sdhghana.com instead of a personal Gmail address. Add it to your contacts so codes don't land in spam. Replies go to our support inbox as usual." },
    { date: "12 Aug 2026", tag: "Improved", title: "See exactly where your order is", body: "Your orders now show Waiting while the network still has them in the queue, and Processing once your bundle is actually being sent. The status updates by itself, so you can tell the difference between an order that's queued and one that's on its way." },
    { date: "12 Aug 2026", tag: "Fixed", title: "Your order appears the moment you go to pay", body: "Your order now shows up as soon as you're taken to the payment page, marked Pending until your payment clears — then it moves to Waiting on its own. You always have an order number to quote, even if a payment doesn't come through."  },
    { date: "31 Jul 2026", tag: "Improved", title: "Notifications open in a quick pop-up", body: "Tap the bell to see your latest updates in a small window without leaving the page — then tap View all if you want your full history." },
    { date: "31 Jul 2026", tag: "Improved", title: "Get GH₵2 off when you join with a friend's code", body: "Sign up with someone's referral code and once your first order is delivered, GH₵2 credit lands in your wallet for your next one. Credit works on any bundle, airtime or voucher, and lasts 60 days." },
    { date: "30 Jul 2026", tag: "New", title: "Buy airtime instantly", body: "Top up any MTN, Telecel or AT number in seconds. Pick the network and amount, pay with mobile money or your wallet, and the credit lands on the number right away — at face value, no extra charge. If it doesn't go through you're refunded automatically." },
    { date: "30 Jul 2026", tag: "Fixed", title: "Exact delivery times on your orders", body: "Order tracking and receipts now show the real moment your bundle was paid for and delivered, in Ghana time — no more estimates. Your expiry date is worked out from your bundle's actual validity." },
    { date: "30 Jul 2026", tag: "New", title: "Join with a friend's code, get GH₵5", body: "Signing up with someone's referral code? Enter it when you create your account — as soon as you fund your wallet, GH₵5 lands in it. Your friend gets GH₵5 too." },
    { date: "30 Jul 2026", tag: "New", title: "Notifications for every order", body: "The bell at the top of the app now keeps you posted — you'll see when your data is delivered, when a top-up lands, when a refund goes through and when support replies. Nothing to set up." },
    { date: "29 Jul 2026", tag: "Improved", title: "Live bundle list & prices", body: "The bundles you see are now always the current ones — sizes, validity and prices refresh automatically, so the price on the card is exactly what you pay at checkout." },
    { date: "23 Jul 2026", tag: "New", title: "Buy data with mobile money", body: "Pay securely with MTN MoMo, Telecel Cash or AT Money and your data is delivered automatically, usually within minutes. Keep your order number to track delivery anytime." },
    { date: "22 Jun 2026", tag: "New", title: "AT iShare & BigTime", body: "Buying AT data? Choose iShare for instant standard bundles, or BigTime for bulk data that never expires — both clearly listed." },
    { date: "22 Jun 2026", tag: "New", title: "Track your order live", body: "Tap “Track order”, enter your order number or phone, and watch your data go from paid to delivered in real time." },
    { date: "22 Jun 2026", tag: "Improved", title: "Fresh new look", body: "The store has a cleaner, faster design — pick a network, see prices at a glance and check out in a few taps." },
    { date: "21 Jun 2026", tag: "New", title: "Discount codes at checkout", body: "Got a promo code? Enter it at checkout to get money off your order instantly." },
    { date: "20 Jun 2026", tag: "New", title: "Pay your way", body: "Check out securely with MTN MoMo, Telecel Cash or AT Money — whichever you use." },
    { date: "19 Jun 2026", tag: "Improved", title: "Faster delivery", body: "Most orders now arrive in 2–10 minutes, any time of day. If something doesn't arrive, you're automatically refunded." },
  ];

  const community = [
    { id: "wa", name: "WhatsApp Agents Group", desc: "Daily price drops, tips and instant support from the team.", icon: "whatsapp", color: "#12A150", link: "https://whatsapp.com/channel/0029Vb7y5vR72WTpvfRVKm24" },
  ];

  // ---- MTN AFA REGISTRATION ----
  // Register an MTN number under the AFA (Affordable Access For All) association bundle.
  // Registered numbers can then buy heavily discounted AFA data/voice bundles.
  // Agents register customers and earn a commission on each registration.
  // ---- UTILITIES & BILLS ----
  // Five providers. `kind` drives the buy UI:
  //   meter   → enter account/meter + amount, get token   (ECG, Water)
  //   package → pick a TV package + smartcard number       (DStv)
  //   shared  → pick a streaming plan + delivery contact    (Netflix, Prime)
  // `comingSoon: true` hides the Buy action (card shows "Coming soon!" and is inert)
  // without touching pricing/plan data — flip it back to bring the card live again.
  const UTILITIES = {
    ecg: {
      id: "ecg", name: "ECG Prepaid Top-Up", short: "Electricity", type: "electricity", kind: "meter", icon: "bolt",
      tagline: "Buy ECG prepaid electricity units — token sent instantly",
      idLabel: "Meter number", idHint: "Your 10–11 digit ECG prepaid meter number", placeholder: "e.g. 0212 3456 789",
      amounts: [20, 50, 100, 200, 500], rate: 0.02, deliver: "Prepaid token sent by SMS in seconds",
      comingSoon: true,
    },
    water: {
      id: "water", name: "Water Bill (GWCL)", short: "Water", type: "water", kind: "meter", icon: "fund",
      tagline: "Pay your Ghana Water (GWCL) bill in seconds",
      idLabel: "Meter / account number", idHint: "Your GWCL account or meter number", placeholder: "e.g. 010-2233-44",
      amounts: [20, 50, 100, 200, 300], rate: 0.015, deliver: "Payment confirmation sent by SMS",
      comingSoon: true,
    },
    dstv: {
      id: "dstv", name: "DStv Subscription", short: "DStv", type: "TV", kind: "package", icon: "signal",
      tagline: "Renew any DStv package on your decoder",
      idLabel: "Smartcard / IUC number", idHint: "The 10-digit number on your DStv decoder", placeholder: "e.g. 7012 3456 78",
      rate: 0.025, deliver: "Subscription activated on your decoder instantly",
      comingSoon: true,
      packages: [
        { id: "padi",        name: "DStv Padi",         price: 80 },
        { id: "yanga",       name: "DStv Yanga",        price: 125 },
        { id: "confam",      name: "DStv Confam",       price: 220 },
        { id: "compact",     name: "DStv Compact",      price: 360, tag: "Popular" },
        { id: "compactplus", name: "DStv Compact Plus", price: 610 },
        { id: "premium",     name: "DStv Premium",      price: 970, tag: "Top" },
      ],
    },
    netflix: {
      id: "netflix", name: "Netflix Shared Account", short: "Netflix", type: "streaming", kind: "shared", icon: "play",
      tagline: "Affordable shared Netflix access — login sent to you",
      idLabel: "Delivery email or phone", idHint: "Where we send the login details", placeholder: "email or 24 000 0000",
      deliver: "Login details sent by SMS & email",
      plans: [
        { id: "n1s1m", name: "1 Screen · 1 Month",       price: 35,  cost: 25 },
        { id: "n2s1m", name: "2 Screens · 1 Month",      price: 55,  cost: 40, tag: "Popular" },
        { id: "n1s3m", name: "1 Screen · 3 Months",      price: 95,  cost: 72 },
        { id: "nfull", name: "Full HD Account · 1 Month", price: 120, cost: 95 },
      ],
      comingSoon: true,
    },
    prime: {
      id: "prime", name: "Prime Video Shared Account", short: "Prime Video", type: "streaming", kind: "shared", icon: "play",
      tagline: "Cheap Prime Video access — login sent to you",
      idLabel: "Delivery email or phone", idHint: "Where we send the login details", placeholder: "email or 24 000 0000",
      deliver: "Login details sent by SMS & email",
      plans: [
        { id: "p1p1m", name: "1 Profile · 1 Month",   price: 25, cost: 18 },
        { id: "p1p3m", name: "1 Profile · 3 Months",  price: 65, cost: 48, tag: "Popular" },
        { id: "pfull", name: "Full Account · 1 Month", price: 90, cost: 68 },
      ],
      comingSoon: true,
    },
  };
  const UTILITY_ORDER = ["ecg", "dstv", "netflix", "prime", "water"];

  // MTN AFA — Affordable Access For All. Run by MTN in partnership with Prepeez Limited.
  // The registration FEE is admin-set and lives on the server (lib/server/afaPricing.ts);
  // `suggested` is only the fallback shown until that price loads.
  //
  // AFA is a VOICE & SMS product, not a data-bundle one — the packages below are what a
  // registered number can actually buy, bought by dialling *1848# on the line itself.
  const afaInfo = {
    suggested: 20.00,   // fallback registration fee until the admin-set price loads
    professions: ["Farmer", "Trader / Market woman", "Driver", "Health worker", "Teacher", "Student", "Artisan", "Other"],
    partner: "Brought to you by MTN in partnership with Prepeez Limited.",
    blurb: "The MTN AFA bundle (Affordable Access For All) gives registered numbers heavily discounted voice and SMS, built for farmers, traders, drivers and other working professionals in Ghana.",
    ussd: "*1848#",
    // Verification is done by MTN, not by us — it genuinely takes days, so never imply minutes.
    steps: [
      ["Register the number", "Capture the customer's name, profession and MTN number."],
      ["They get activated", "The number joins the AFA group. Verification takes 1 to 3 working days."],
      ["They buy cheap packages", "Registered numbers unlock the discounted AFA prices below, and can buy several times a day."],
    ],
    packages: [
      { price: "GH₵10", what: "220 minutes + 50 SMS" },
      { price: "GH₵10", what: "160 minutes + 50 SMS + 150MB data" },
      { price: "GH₵10", what: "Renew any package" },
      { price: "Free", what: "Unlimited calls between AFA members" },
    ],
  };
  const afaRegsSeed = [];
  // platform-wide AFA registrations (admin view, across all agents)
  const adminAfaSeed = [];


  const company = {
    name: "Smart Data Hub",
    tagline: "Smart Data, Seamless Connection",
    phones: ["0240 021 899", "0205 064 022"],
    // The three company mailboxes. `email` is the one customers are given — support@ is
    // monitored; noreply@ only ever sends, and admin@ is internal, so neither is shown.
    email: "support@sdhghana.com",
    emails: { support: "support@sdhghana.com", noreply: "noreply@sdhghana.com", admin: "admin@sdhghana.com" },
    web: "sdhghana.com",
    location: "Osu, Accra · Ghana",
    waChannel: "https://whatsapp.com/channel/0029Vb7y5vR72WTpvfRVKm24",
    stats: { orders: "18,375", completed: "13,502", resellerShare: "76%", gtv: "GH₵262K+", rating: "4.9/5", resellers: "2,400+" },
  };
  // ---- dates & times ----------------------------------------------------------------
  // Every timestamp in the app is epoch milliseconds recorded by the SERVER (Date.now() in
  // the API/webhook that actually made the thing happen), so it's the same instant for
  // everyone. Display is pinned to Africa/Accra — the business's own clock — so a receipt,
  // an order timeline and a CSV export read identically no matter what timezone the
  // viewer's device is set to.
  const TZ = "Africa/Accra";
  const isTime = (ms) => { const n = Number(ms); return Number.isFinite(n) && n > 0; };
  const fmtAt = (ms, opts) => (isTime(ms) ? new Date(Number(ms)).toLocaleString("en-GB", { timeZone: TZ, ...opts }) : "—");

  // "12 Aug 2026, 14:32" — receipts, order details, anywhere an exact moment is shown.
  const stamp = (ms) => fmtAt(ms, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  // "12 Aug 2026"
  const dateOnly = (ms) => fmtAt(ms, { day: "2-digit", month: "short", year: "numeric" });
  // "14:32"
  const timeOnly = (ms) => fmtAt(ms, { hour: "2-digit", minute: "2-digit", hour12: false });
  // "12 Aug, 14:32" — compact, for timelines
  const shortStamp = (ms) => fmtAt(ms, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  // "12/08/2026 14:32:05" — CSV exports (seconds included, unambiguous, sortable by eye)
  const csvStamp = (ms) => fmtAt(ms, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(", ", " ");

  // Relative time. Clamps a client clock that's ahead of the server (which would otherwise
  // read "-4s ago"), and falls back to a real date once something is over a week old.
  const ago = (t) => {
    if (!isTime(t)) return "—";
    const s = Math.max(0, Math.floor((Date.now() - Number(t)) / 1000));
    if (s < 10) return "just now";
    if (s < 60) return s + "s ago";
    const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24); if (d < 7) return d + "d ago";
    return dateOnly(t);
  };

  // Business-day boundaries. Ghana runs on UTC+0 all year (no DST), so an Accra midnight IS
  // a UTC midnight — which means "today", "this week" and "this month" are the same buckets
  // for the business no matter where the viewer's device thinks it is.
  const dayStart = (ms) => { const d = new Date(isTime(ms) ? Number(ms) : Date.now()); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
  const monthStart = (ms) => { const d = new Date(isTime(ms) ? Number(ms) : Date.now()); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };
  // Month boundary `n` months back from the month containing `ms` (n=0 → this month).
  const monthsAgo = (n, ms) => { const d = new Date(isTime(ms) ? Number(ms) : Date.now()); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1); };
  const DAY_MS = 86400000;
  // Hour of day on the business clock — drives the "busiest hours" breakdowns.
  const hourOf = (ms) => new Date(isTime(ms) ? Number(ms) : 0).getUTCHours();

  // How long something took, from two server timestamps. Returns null unless both are real.
  const took = (from, to) => {
    if (!isTime(from) || !isTime(to)) return null;
    const s = Math.max(0, Math.round((Number(to) - Number(from)) / 1000));
    if (s < 60) return s + "s";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m " + (s % 60) + "s";
    const h = Math.floor(m / 60);
    return h + "h " + (m % 60) + "m";
  };

  const SDH = {
    NETWORKS, DATA_BUNDLES, AT_PRODUCTS, PRODUCTS_BY_NET, lineOf, pricingKeyOf, storePriceKeyOf,
    bundlesFor, dataLinesOf, validityOf, pkgOf, AIRTIME_PICKS, TIERS, tierFor,
    blendedEarnings, tierBonusOnMargin, REAL_SALES_FLOOR,
    seedLedger, seedCommissions, seedOrders, seedWithdrawals, salesWeek, resellerStats,
    STORE_THEMES, defaultStore, storePriceOf, storeSellOf, agentQuote, storeOrdersSeed, storeStats, orderTimeline,
    customersFrom, CUSTOMER_ACTIVE_DAYS, smsTemplates, STORE_LINK_TOKEN,
    storeInsights, promosSeed,
    adminOrders, adminWithdrawals, adminUsers, adminStats, company,
    checkerProducts, checkerSales, senderIds, smsHistory, smsRate, complaintsSeed, apiInfo, changelog, customerChangelog, community, afaInfo, afaRegsSeed, adminAfaSeed, UTILITIES, UTILITY_ORDER,
    fmt: (n) => "GH₵" + Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    fmt0: (n) => "GH₵" + Number(n).toLocaleString("en-GH", { maximumFractionDigits: 0 }),
    TZ, isTime, ago, took, stamp, dateOnly, timeOnly, shortStamp, csvStamp,
    dayStart, monthStart, monthsAgo, hourOf, DAY_MS,
    // Weekday / month labels, also pinned to Accra so a label always matches its bucket.
    weekday: (ms) => fmtAt(ms, { weekday: "short" }),
    monthLabel: (ms) => fmtAt(ms, { month: "short" }),
  };
  if (typeof window !== "undefined") (window as any).SDH = SDH;
  return SDH;
})();
