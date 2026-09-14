"use client";
/* eslint-disable */
// @ts-nocheck
import React from "react";
import { SDH } from "@/lib/data";
import { isInFlight } from "@/lib/orderStatus";

/* Smart Data Hub — global store: auth, role, money, navigation.
   Two balances, both DERIVED, never edited directly:
     • WALLET  (spendable)  = topups − purchases + refunds
     • EARNINGS (commission) = baseline + commissions − withdrawals  */
const { createContext, useContext, useState, useEffect, useCallback } = React;
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);
// Bump this when persisted client state must be discarded. v4 drops all the old demo
// seed data (fake orders, commissions, store sales…) so the app reflects only real data.
const LS_KEY = "sdh_platform_v4";
const DEMO_USER = { name: "Demo account", phone: "0200000000", role: "admin" };

function loadState() {
  try {
    const r = JSON.parse(localStorage.getItem(LS_KEY));
    if (r && typeof r === "object") return r;
  } catch (e) {}
  return null;
}

// `publicMode` mounts the provider for a GUEST viewing an agent's public storefront
// (/<handle>): it ignores the local agent session/state, seeds the store from
// `initialStore` (fetched by handle from the backend), and never persists to localStorage.
// `adminView` marks the dedicated /admin entry. An admin account defaults to the ADMIN view
// either way — signing in puts them straight into the admin panel, and they switch to the
// Agent or Customer view from the account menu at any time.
function StoreProvider({
  children,
  publicMode = false,
  initialStore = null,
  initialScreen = null,
  adminView = false,
}) {
  const saved = publicMode ? null : loadState();
  const S = window.SDH;

  const [screen, setScreen] = useState(initialScreen || "app");
  const [sitePage, setSitePage] = useState(saved?.sitePage || "home");
  const [authMode, setAuthMode] = useState(saved?.authMode || "signup");
  const [user, setUser] = useState(DEMO_USER);
  const [role, setRole] = useState("admin");
  const [appPage, setAppPage] = useState(saved?.appPage || "dashboard");
  const [theme, setTheme] = useState(saved?.theme || "dark");

  // apply + persist the colour theme on <html data-theme>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Live published data pricing (admin Pricing page → /api/pricing). Public, so it loads for
  // guests too. Drives the DISPLAYED bundles so what customers see matches what they're
  // charged (the server prices from the same source). Refetched whenever the ACCOUNT role
  // changes (sign in/out, agent approved) because the response only carries `wholesale` for
  // agents/admins — a guest fetch would otherwise leave agent pages without their cost.
  const [dataPricing, setDataPricing] = useState(null);
  const [tierInfo, setTierInfo] = useState(null); // { id, name, rate } for the signed-in agent
  useEffect(() => {
    let alive = true;
    fetch("/api/pricing", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        if (d.pricing) setDataPricing(d.pricing);
        // The agent's current tier, sent with the prices so the buy screen can name the bonus
        // it's showing. Absent for customers and guests.
        if (d.tier) setTierInfo(d.tier);
        // Published checker prices — `cost` is only sent to agents/admins, so fall back to
        // retail for a customer/guest, as bundlesFor does for wholesale.
        // `unit` is the server's answer for what THIS account pays per voucher — used as-is by
        // the buy screen. `cost` (the agent price) is only sent to agents/admins and is for
        // margin display; it must never stand in as the charge, and `unit` means it no longer
        // has to. `live` marks these as published prices, as with data bundles.
        //
        // Merged OVER the catalog entry, not used bare: the published row carries the prices
        // but none of the copy (`blurb`), so spreading the seed first keeps the descriptions
        // while every number comes from the server.
        if (Array.isArray(d.checkers) && d.checkers.length)
          setCheckers(
            d.checkers.map((c) => ({
              ...(S.checkerProducts.find((p) => p.id === c.id) || {}),
              ...c,
              unit: c.unit ?? c.retail,
              cost: c.cost ?? c.retail,
              stock: 0,
              live: true,
            })),
          );
        // Bulk SMS rate per page — already resolved server-side to THIS account's rate
        // (agents pay their wholesale, everyone else retail).
        if (typeof d.smsRate === "number") setSmsRate(d.smsRate);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.role]);
  // Bundles for display — from the published pricing when loaded, else the client catalog.
  //
  // `cost` is what the SERVER says this account will be charged, sent as a finished amount by
  // /api/pricing. Nothing here recomputes it from the role: the client's role and the session
  // cookie the charge is priced from can disagree, and when they did, the buy screen showed
  // one amount and Paystack took another. `live` marks a bundle as safe to sell — see
  // priced() below.
  const bundlesFor = useCallback(
    (net, variant) => {
      if (dataPricing) {
        const key = window.SDH.pricingKeyOf(net, variant);
        const arr = dataPricing[key];
        if (Array.isArray(arr) && arr.length) {
          return arr.map((b) => ({
            id: b.id,
            gb: b.gb,
            days: b.noExpiry ? 0 : b.days,
            noExpiry: !!b.noExpiry,
            atProduct: window.SDH.lineOf(net, variant),
            price: b.retail,
            reseller: b.wholesale ?? b.retail, // wholesale is omitted for customers/guests
            // The same figure, but left NULL rather than falling back, so a caller that needs
            // to know "is this really the wholesale?" can tell. storeSellOf() floors a store
            // price against it and must not floor a guest's page against retail.
            wholesale: b.wholesale ?? null,
            cost: b.cost ?? b.retail, // authoritative charge for THIS account
            tierBonus: b.tierBonus ?? 0, // server-computed; 0 for non-agents
            live: true,
          }));
        }
      }
      // Published pricing hasn't loaded (or the fetch failed). These are the catalog's own
      // placeholder numbers and have no relationship to what admins published, so they're
      // flagged `live: false` — fine to lay out a screen with, never safe to charge from.
      return window.SDH.bundlesFor(net, variant).map((b) => ({
        ...b,
        cost: undefined,
        live: false,
      }));
    },
    [dataPricing],
  );

  const [ledger, setLedger] = useState(saved?.ledger || S.seedLedger);
  const [commissions, setCommissions] = useState(
    saved?.commissions || S.seedCommissions,
  );
  const [orders, setOrders] = useState(saved?.orders || S.seedOrders);
  const [withdrawals, setWithdrawals] = useState(
    saved?.withdrawals || S.seedWithdrawals,
  );
  // earnings: current snapshot (already net of historical activity); only live actions move it
  const [earn, setEarn] = useState(
    saved?.earn || {
      available: 0,
      thisMonth: 0,
      lifetime: 0,
    },
  );

  const [adminWds, setAdminWds] = useState(
    saved?.adminWds || S.adminWithdrawals,
  );
  const [adminOrds, setAdminOrds] = useState(saved?.adminOrds || S.adminOrders);
  const [prices, setPrices] = useState(saved?.prices || S.DATA_BUNDLES);
  // agent online store
  const [store, setStore] = useState(() => {
    // merge defaults so newly-added fields (logo, shortSlug, waChannel, announcement)
    // appear for stores saved before those features existed, while keeping saved edits
    const st = {
      ...S.defaultStore,
      ...((publicMode ? initialStore : saved?.store) || {}),
    };
    // Discount codes used to be their own localStorage-only list, which meant they never
    // reached a guest on the public store. They belong to the store config now (it syncs to
    // the backend); carry any locally-saved codes over on first load.
    if (!Array.isArray(st.promos))
      st.promos =
        !publicMode && Array.isArray(saved?.promos) ? saved.promos : [];
    // migrate legacy flat prices ({d1:..}) → per-telco nested
    if (
      st.prices &&
      st.prices.mtn === undefined &&
      st.prices.d1 !== undefined
    ) {
      const flat = st.prices;
      return {
        ...st,
        prices: { mtn: { ...flat }, telecel: { ...flat }, atigo: { ...flat } },
      };
    }
    return st;
  });
  const [storeOrders, setStoreOrders] = useState(
    saved?.storeOrders || S.storeOrdersSeed,
  );
  const [complaints, setComplaints] = useState(
    saved?.complaints || S.complaintsSeed,
  );
  // Notification centre — always live from the backend, never persisted locally.
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  // Admin announcements (broadcasts) + the size of each audience.
  const [broadcasts, setBroadcasts] = useState([]);
  const [audienceCounts, setAudienceCounts] = useState({
    all: 0,
    agents: 0,
    customers: 0,
  });
  // Referral programme — the account's own code + who has joined with it. Always live.
  const [referral, setReferral] = useState({
    code: "",
    signedUp: 0,
    qualified: 0,
    pending: 0,
    credit: 0,
    reward: 3,
    referredReward: 2,
    referrals: [],
  });
  const [payoutCfg, setPayoutCfg] = useState(
    saved?.payoutCfg || { autoApprove: false, limit: 200 },
  );
  // AFA registrations are server-backed and admin-reviewed, so they're never persisted
  // locally — a cached copy would show a stale status after an admin approves or rejects.
  // Always loaded fresh via refreshAfa() / refreshAdminAfa(), like notifications.
  const [afaRegs, setAfaRegs] = useState([]);
  // The AFA fee is set by ADMINS on the server and is the same for everyone — agents can't
  // price it and earn nothing on it. Seeded from the shared default until a fetch replaces it.
  const [afaPrice, setAfaPrice] = useState(S.afaInfo.suggested);
  // admin-managed collections
  const [adminAfa, setAdminAfa] = useState([]);
  const [checkers, setCheckers] = useState(
    saved?.checkers || S.checkerProducts,
  );
  // ---- bulk SMS (Arkesel) ----
  // Sender IDs and campaigns are server-backed and admin-reviewed, so they're never
  // persisted locally: a cached copy would show a stale approval status, or a campaign as
  // "sent" after the provider rejected it. Always loaded fresh, like AFA and notifications.
  const [senderIds, setSenderIds] = useState([]);
  const [smsCampaigns, setSmsCampaigns] = useState([]);
  // Per-page rate THIS account pays, published by admins (/api/pricing). Seeded from the
  // shared default until that fetch lands.
  const [smsRate, setSmsRate] = useState(S.smsRate);
  const [smsBalance, setSmsBalance] = useState(null); // admin only: our credit with Arkesel
  // admin platform pricing: per-telco data tables + product rates
  const [adminPrices, setAdminPrices] = useState(
    saved?.adminPrices || {
      mtn: S.bundlesFor("mtn"),
      telecel: S.bundlesFor("telecel"),
      atigo: S.bundlesFor("atigo"),
    },
  );
  // `platformRates` used to hold display-only figures for products with no backend. Nothing
  // is left in it — AFA's fee is admin-set on the server (afaPricing.ts) and the bulk SMS
  // rate now comes from smsPricing.ts via /api/pricing — so it's gone.
  // Promotional referral credit (spec §3): spendable on any product, never withdrawable,
  // expires 60 days after it's issued. Lives outside the cash balance.
  const [credit, setCredit] = useState({ amount: 0, grants: [] });
  const [toasts, setToasts] = useState([]);
  // Store autosave status shown in My Store: idle | saving | saved.
  const [storeSaveState, setStoreSaveState] = useState("idle");
  // First-load flags per backend data set — drive the loaders on data-driven pages so a
  // signed-in user sees a spinner (not a blank/empty table) until the fetch resolves.
  const [dataLoaded, setDataLoaded] = useState({
    wallet: false,
    orders: false,
    storeOrders: false,
    withdrawals: false,
    complaints: false,
    notifications: false,
    sms: false,
  });
  const markLoaded = (k) =>
    setDataLoaded((l) => (l[k] ? l : { ...l, [k]: true }));
  // Auth is bypassed for this UI preview; keep the flag for consumers of the store API.
  const [sessionChecked] = useState(true);

  useEffect(() => {
    if (publicMode) return; // guests never persist to the agent's local state
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        screen,
        sitePage,
        authMode,
        user,
        role,
        appPage,
        ledger,
        commissions,
        orders,
        withdrawals,
        earn,
        adminWds,
        adminOrds,
        prices,
        store,
        storeOrders,
        complaints,
        payoutCfg,
        checkers,
        adminPrices,
        theme,
      }),
    );
  }, [
    screen,
    sitePage,
    authMode,
    user,
    role,
    appPage,
    ledger,
    commissions,
    orders,
    withdrawals,
    earn,
    adminWds,
    adminOrds,
    prices,
    store,
    storeOrders,
    complaints,
    checkers,
    adminPrices,
    theme,
  ]);

  // ---- derived money ----
  // Cash balance — real, withdrawable money. Promotional referral credit is deliberately
  // NOT in here (spec §3: spendable but never withdrawable); it arrives from /api/wallet as
  // `credit` and is shown separately.
  const balance = ledger
    .filter((e) => !e.credit)
    .reduce((s, e) => s + e.amount, 0);
  // Earnings are DERIVED from the real wallet ledger for a signed-in account: every store /
  // reseller sale credits a `commission` entry server-side, so the dashboard reflects live
  // profit the moment it lands (the polling loop below pulls it in without a refresh). The
  // demo `earn` snapshot is only a fallback when there's no backend account.
  const monthStart = S.monthStart();
  // Everything an agent EARNS lands in the ledger as `commission` (a sale or tier bonus),
  // `referral` (a referral reward) or `override` (a recruitment override, spec §4).
  const earnEntries = ledger.filter(
    (e) =>
      ["commission", "referral", "override"].includes(e.type) && e.amount > 0,
  );
  const commLifetime = +earnEntries
    .reduce((s, e) => s + e.amount, 0)
    .toFixed(2);
  const commThisMonth = +earnEntries
    .filter((e) => e.at >= monthStart)
    .reduce((s, e) => s + e.amount, 0)
    .toFixed(2);

  // Tier score components — the same monthly earnings, split by where they came from.
  // Storefront sales are credited against the store order ref (SO-…); anything else
  // commission-typed is the agent's own selling (checker vouchers, reseller orders).
  const sumMonth = (arr) =>
    +arr
      .filter((e) => e.at >= monthStart)
      .reduce((s, e) => s + e.amount, 0)
      .toFixed(2);
  const isStoreSale = (e) => String(e.ref || "").startsWith("SO-");
  const commOnly = earnEntries.filter((e) => e.type === "commission");
  // §2 blended monthly earnings. `total` is the TIER SCORE, not the money earned: the 70%
  // real-sales safeguard holds back referral earnings that would otherwise let someone tier
  // up on invites alone. `earned` is what actually landed in the wallet.
  const earnBreakdown = S.blendedEarnings(
    sumMonth(commOnly.filter(isStoreSale)),
    sumMonth(commOnly.filter((e) => !isStoreSale(e))),
    sumMonth(
      earnEntries.filter((e) => e.type === "referral" || e.type === "override"),
    ),
  );
  // Commission still in flight — on processing store/reseller orders not yet delivered.
  const pendingComm = +[...(orders || []), ...(storeOrders || [])]
    .filter((o) => isInFlight(o.status) && o.commission > 0)
    .reduce((s, o) => s + o.commission, 0)
    .toFixed(2);
  const earnings = user?.id
    ? {
        available: +balance.toFixed(2), // withdrawable: commissions land here, payouts debit it
        thisMonth: commThisMonth,
        lifetime: commLifetime,
        pending: pendingComm,
      }
    : {
        available: earn.available,
        thisMonth: earn.thisMonth,
        lifetime: earn.lifetime,
        pending: pendingComm,
      };

  // Per-dataset loading flags for the UI: true while a signed-in user's data is still being
  // fetched for the first time (so pages show a loader instead of an empty state).
  const dataLoading = {
    wallet: !!user?.id && !dataLoaded.wallet,
    orders: !!user?.id && !dataLoaded.orders,
    storeOrders: !!user?.id && !dataLoaded.storeOrders,
    withdrawals: !!user?.id && !dataLoaded.withdrawals,
    complaints: !!user?.id && !dataLoaded.complaints,
    notifications: !!user?.id && !dataLoaded.notifications,
    sms: !!user?.id && !dataLoaded.sms,
  };

  // ---- toast ----
  const toast = useCallback((msg, icon = "check") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const addLedger = (entry) =>
    setLedger((l) => [
      { id: "L" + Date.now(), at: Date.now(), ...entry },
      ...l,
    ]);

  // ---- navigation ----
  const navSite = (p) => {
    setSitePage(p);
    window.scrollTo(0, 0);
  };
  const goApp = (p) => {
    setAppPage(p);
    setScreen("app");
    window.scrollTo(0, 0);
  };

  // Wipe all client-only state to a clean slate for a freshly signed-in account, so no
  // previous session's cached/demo data (store branding, storefront orders, commissions…)
  // leaks into a real account. Real data is then loaded from the backend where it exists;
  // the agent's store is reloaded/prefilled by the store-hydrate effect.
  const resetClientState = () => {
    setLedger([]);
    setOrders([]);
    setStore({ ...window.SDH.defaultStore });
    setStoreOrders([]);
    setCommissions([]);
    setCredit({ amount: 0, grants: [] });
    setComplaints([]);
    setAfaRegs([]);
    setWithdrawals([]);
    setNotifications([]);
    setUnreadNotifs(0);
    setBroadcasts([]);
    setReferral({
      code: "",
      signedUp: 0,
      qualified: 0,
      pending: 0,
      credit: 0,
      reward: 3,
      referredReward: 2,
      referrals: [],
    });
    setSmsCampaigns([]);
    setSenderIds([]);
    setSmsBalance(null);
    setDataLoaded({
      wallet: false,
      orders: false,
      storeOrders: false,
      withdrawals: false,
      complaints: false,
      notifications: false,
      sms: false,
    }); // re-show loaders until refetched
    setEarn({ available: 0, thisMonth: 0, lifetime: 0 });
    storeReadyRef.current = false;
  };

  // Default active view for an account: an admin always lands in the ADMIN view — at /admin
  // and at the main app (/) alike — and switches to the Agent/Customer view whenever they
  // want from the account menu. Everyone else sees their own role.
  const defaultView = (accountRole) =>
    accountRole === "admin" ? "admin" : accountRole || "reseller";

  // Restoring an existing session, as opposed to a fresh sign-in: an admin may have switched
  // to the Agent or Customer view, so keep whichever they last chose instead of snapping them
  // back to the admin panel on every reload. Non-admins always get their own role.
  const restoreView = (accountRole) =>
    accountRole === "admin" &&
    ["admin", "reseller", "customer"].includes(saved?.role)
      ? saved.role
      : defaultView(accountRole);

  const authenticate = (data) => {
    const u = {
      ...data,
      name: data.name || "",
      phone: data.phone || "",
      role: data.role || "reseller",
    };
    setUser(u);
    setRole(defaultView(u.role));
    setScreen("app");
    setAppPage("dashboard");
    window.scrollTo(0, 0);
    if (u.id) {
      resetClientState();
      refreshWallet();
      refreshOrders();
      refreshWithdrawals();
      refreshStoreOrders();
      refreshComplaints();
      refreshNotifications();
      refreshReferrals();
    } // real user → clean slate + live wallet/orders/payouts/store sales/complaints/notifications
  };
  // ---- real auth backend (MongoDB + Arkesel via /api/auth/*) ----
  // authenticate() above applies a signed-in user to the client; these call the API.
  const authApi = async (path, body) => {
    const r = await fetch("/api/auth/" + path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok)
      throw new Error(d.error || "Something went wrong. Please try again.");
    return d;
  };
  const registerStart = (data) => authApi("register/start", data); // sends OTP
  const registerVerify = (phone, otp) =>
    authApi("register/verify", { phone, otp }).then((d) => {
      authenticate(d.user);
      return d;
    });
  const loginUser = (loginId, password) =>
    authApi("login", { loginId, password }).then((d) => {
      authenticate(d.user);
      return d;
    });
  const resetStart = (phone) => authApi("reset/start", { phone }); // sends reset OTP
  const resetVerify = (phone, otp) =>
    authApi("reset/verify", { phone, otp }).then((d) => {
      authenticate(d.user);
      return d;
    });
  const updateProfile = async (patch) => {
    // save name/email/business/avatar/notif
    // Real backend user → persist to the API; demo (no id) → update local state so the UI still works.
    if (!user?.id) {
      setUser((u) => ({ ...(u || {}), ...patch }));
      return { user: { ...(user || {}), ...patch } };
    }
    const d = await authApi("profile", patch);
    setUser(d.user);
    return d;
  };
  const changePassword = (current, next) =>
    authApi("password", { current, next }); // requires current password

  // A signed-in customer applies to become an agent (admin must approve).
  const requestAgent = async (business) => {
    const r = await fetch("/api/auth/agent-request", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not submit your application.");
    if (d.user) setUser(d.user);
    return d.user;
  };

  // Returned from a Paystack top-up (callback redirects to /?topup=success|pending|failed).
  // Reflect the outcome, refresh the live balance, and strip the query param.
  useEffect(() => {
    if (publicMode) return;
    const q = new URLSearchParams(window.location.search);
    const tp = q.get("topup");
    const op = q.get("orderpay");
    if (!tp && !op) return;
    if (tp === "success") {
      toast("Wallet funded successfully", "wallet");
      refreshWallet();
    } else if (tp === "pending")
      toast("Payment not completed — you weren't charged", "info");
    else if (tp) toast("Top-up didn't go through", "info");
    // Returned from a direct mobile-money order payment.
    if (op === "success") {
      toast("Payment received — your bundle is on its way", "check");
      refreshWallet();
      refreshOrders();
    } else if (op === "pending")
      toast("Payment not completed — you weren't charged", "info");
    else if (op) toast("Payment didn't go through", "info");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // ---- agent store config sync (backend) ----
  // A signed-in reseller's store config is persisted server-side so their public
  // storefront link (/<handle>) renders their real branding & prices to customers.
  const storeReadyRef = React.useRef(false);
  const saveStoreRemote = useCallback(
    async (config) => {
      setStoreSaveState("saving");
      try {
        const r = await fetch("/api/store", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          if (d?.error) toast(d.error, "info");
          setStoreSaveState("idle");
          return;
        }
        setStoreSaveState("saved");
      } catch (e) {
        setStoreSaveState("idle");
      }
    },
    [toast],
  );

  // Clear the "Saved" tick back to idle a moment after it shows.
  useEffect(() => {
    if (storeSaveState !== "saved") return;
    const t = setTimeout(() => setStoreSaveState("idle"), 2200);
    return () => clearTimeout(t);
  }, [storeSaveState]);

  // Hydrate the agent's saved store once a backend session is known; then allow syncing.
  useEffect(() => {
    if (publicMode) return;
    if (!user?.id) {
      storeReadyRef.current = false;
      return;
    }
    let alive = true;
    fetch("/api/store", { credentials: "include" })
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          const d = await r.json().catch(() => ({}));
          if (d && d.store) {
            setStore((s) => ({ ...s, ...d.store }));
          } else {
            // No saved store yet → seed sensible defaults from the agent's own account so
            // nothing is blank/fake. They finish setup (logo, prices…) in My Store.
            setStore((s) => {
              const biz = (user.business || user.name || "").trim();
              const slug = biz
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 40);
              return {
                ...s,
                name:
                  !s.name || s.name === "My Data Store"
                    ? biz || s.name
                    : s.name,
                handle: s.handle || slug,
                whatsapp: s.whatsapp || user.phone || "",
              };
            });
          }
        }
        storeReadyRef.current = true;
      })
      .catch(() => {
        storeReadyRef.current = true;
      });
    return () => {
      alive = false;
    };
  }, [user?.id, publicMode]);

  // Debounced save whenever a reseller edits their store (only after hydration).
  useEffect(() => {
    if (publicMode || !user?.id || role !== "reseller") return;
    if (!storeReadyRef.current) return;
    setStoreSaveState("saving"); // immediate "Saving…" feedback on edit
    const t = setTimeout(() => saveStoreRemote(store), 900);
    return () => clearTimeout(t);
  }, [store, user?.id, role, publicMode, saveStoreRemote]);

  const logout = () => {
    try {
      fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    setScreen("site");
    setSitePage("home");
    setUser(null);
    setLedger([]);
    setOrders([]);
    window.scrollTo(0, 0);
  };
  const switchRole = (r) => {
    setRole(r);
    setAppPage("dashboard");
    window.scrollTo(0, 0);
  };
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ---- money actions ----
  // A real signed-in user has a backend id; their wallet is persisted in MongoDB
  // (via /api/wallet). Without one we fall back to the local demo ledger.
  const hasBackendWallet = () => !!user?.id;

  // Pull the live wallet (balance + history) from the backend into local state.
  const refreshWallet = useCallback(async () => {
    try {
      const r = await fetch("/api/wallet", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        setLedger(d.ledger || []);
        setCredit({ amount: Number(d.credit || 0), grants: d.credits || [] });
      }
    } catch (e) {
    } finally {
      markLoaded("wallet");
    }
  }, []);

  // ---- withdrawals: cash out the real wallet balance to mobile money via Paystack ----
  const refreshWithdrawals = useCallback(async () => {
    try {
      const r = await fetch("/api/wallet/withdraw", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        setWithdrawals(d.withdrawals || []);
      }
    } catch (e) {
    } finally {
      markLoaded("withdrawals");
    }
  }, []);

  // Step 1 — validate against the live wallet balance and email a confirmation code.
  const withdrawStart = async ({ amount, momoNumber, network, momoName }) => {
    const r = await fetch("/api/wallet/withdraw/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, momoNumber, network, momoName }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not start the withdrawal.");
    return d; // { sentTo, dev }
  };

  // Step 2 — confirm with the emailed code → debits wallet + pays out to MoMo.
  const withdrawConfirm = async ({ otp }) => {
    const r = await fetch("/api/wallet/withdraw", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not complete the withdrawal.");
    refreshWallet();
    refreshWithdrawals();
    return d; // { withdrawal, balance }
  };

  // Persist a wallet transaction; returns the created entry or throws with a message.
  const walletTx = async (tx) => {
    const r = await fetch("/api/wallet/tx", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Wallet update failed.");
    return d;
  };

  // Start funding the wallet. Returns "redirect" once the browser is being handed off
  // to Paystack's hosted checkout, or "demo" for the instant local top-up. Throws with a
  // message if a real checkout can't be started (the caller surfaces it).
  const fundWallet = async (amount) => {
    if (hasBackendWallet()) {
      // Real money in: start a Paystack checkout and hand off to their hosted page
      // (mobile money / card / bank). The wallet is credited server-side only after
      // Paystack confirms payment.
      const r = await fetch("/api/wallet/topup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: +amount }),
      });
      let d = {};
      try {
        d = await r.json();
      } catch (e) {}
      if (!r.ok || !d.authorizationUrl)
        throw new Error(d.error || "Could not start payment.");
      window.location.href = d.authorizationUrl;
      return "redirect";
    }
    // Production: funding always goes through the real Paystack gateway (above). No
    // signed-in backend user → nothing to fund.
    throw new Error("Please sign in to fund your wallet.");
  };

  // Build the Error thrown when a buy request is refused, carrying any structured payload
  // the caller needs to render something richer than a toast. `beneficiaryBlock` is set when
  // the recipient is an MTN number the network has already refused (see
  // lib/server/failedBeneficiaries.ts) — the buy screens open a caution dialog on it.
  const orderError = (d, fallback) => {
    const err = new Error(d?.error || fallback);
    if (d?.beneficiaryBlock) err.beneficiaryBlock = d.beneficiaryBlock;
    // Sent with a 409 when the server priced the item differently from what the screen showed
    // (an agent repriced, or the page was cached). It is the CORRECT price, so a checkout can
    // heal itself with it rather than dead-ending the customer.
    if (Number.isFinite(Number(d?.cost)) && Number(d.cost) > 0)
      err.cost = Number(d.cost);
    return err;
  };

  // Pay for a data bundle directly with mobile money (Paystack) — no wallet needed.
  // Prices server-side, then hands off to Paystack's hosted checkout; the order is
  // placed once payment is confirmed (webhook / callback). Redirects the browser.
  // `type` is "data" (bundle) or "airtime" (top-up); airtime passes `amount` instead of
  // a bundle. Both are priced server-side and fulfilled once Paystack confirms.
  const payOrderMomo = async ({
    type = "data",
    net,
    atProduct = null,
    capacityGb,
    amount,
    recipient,
    expectedCost,
  }) => {
    const r = await fetch("/api/orders/pay", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      // `expectedCost` — the amount the buy screen quoted. The server prices this itself;
      // sending what was displayed lets it refuse rather than open Paystack for a
      // different figure.
      body: JSON.stringify({
        type,
        net,
        atProduct,
        capacityGb,
        amount,
        recipient,
        expectedCost,
      }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok || !d.authorizationUrl)
      throw orderError(d, "Could not start payment.");
    window.location.href = d.authorizationUrl;
    return "redirect";
  };

  // GUEST storefront checkout — a customer on an agent's public /<handle> store pays for a
  // DATA bundle by mobile money (Paystack). Priced server-side from the agent's saved store
  // config; the order is placed with the provider and the agent credited once payment is
  // confirmed. Redirects the browser to Paystack's hosted checkout.
  // `type` is "data" or "airtime" — airtime carries a face-value `amount` instead of a
  // bundle, and the server prices both from its own tables either way.
  const payStoreOrderMomo = async ({
    handle,
    type = "data",
    net,
    atProduct = null,
    capacityGb,
    amount,
    recipient,
    payerPhone,
    payNetwork,
    promoCode = null,
    expectedCost,
  }) => {
    const r = await fetch("/api/store/" + encodeURIComponent(handle) + "/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        net,
        atProduct,
        capacityGb,
        amount,
        recipient,
        payerPhone,
        payNetwork,
        promoCode,
        expectedCost,
      }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok || !d.authorizationUrl)
      throw orderError(d, "Could not start payment.");
    window.location.href = d.authorizationUrl;
    return "redirect";
  };

  // Agent's real storefront sales (guest data orders on their /<handle> store).
  const refreshStoreOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/store/orders", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.orders)) setStoreOrders(d.orders);
      }
    } catch (e) {
    } finally {
      markLoaded("storeOrders");
    }
  }, []);

  // Public order tracking — look one storefront order up on the backend (guest, no session).
  // Track a storefront order by its order number OR by the phone number it was bought for —
  // a guest who's lost the receipt still knows the number they topped up. `by` picks which:
  // "ref" (default) or "phone". Resolves to { order, orders } — `order` is the newest match.
  const trackStoreOrder = async (value, handle, by = "ref") => {
    const key = by === "phone" ? "phone" : "ref";
    const r = await fetch(
      "/api/store/track?" +
        key +
        "=" +
        encodeURIComponent(value) +
        (handle ? "&handle=" + encodeURIComponent(handle) : ""),
    );
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "No order found.");
    return d.order;
  };

  const placeOrder = ({
    net,
    type,
    pkg,
    recipient,
    cost,
    commission = 0,
    payVia = "wallet",
  }) => {
    const id = "ORD·" + Math.floor(5520 + Math.random() * 400);
    const viaMomo = payVia === "momo";
    const order = {
      id,
      net,
      type,
      pkg,
      recipient,
      cost,
      commission,
      status: "processing",
      at: Date.now(),
      pay: viaMomo ? "Mobile money" : "Wallet",
    };
    setOrders((o) => [order, ...o]);
    if (viaMomo) {
      // Paid outside the wallet (mobile money) — no wallet debit, just a record for the demo ledger.
      if (!hasBackendWallet())
        addLedger({
          type: "external",
          amount: 0,
          ref: id,
          note: `${pkg} · ${S.NETWORKS[net].name} · ${recipient} · paid via mobile money`,
        });
    } else {
      const note = `${pkg} · ${S.NETWORKS[net].name} · ${recipient}`;
      if (hasBackendWallet()) {
        // Persist the debit; mirror it locally so the UI updates immediately.
        setLedger((l) => [
          {
            id: "L" + Date.now(),
            at: Date.now(),
            type: "purchase",
            amount: -cost,
            ref: id,
            note,
          },
          ...l,
        ]);
        walletTx({ type: "purchase", amount: -cost, ref: id, note }).catch(
          () => {},
        );
      } else {
        addLedger({ type: "purchase", amount: -cost, ref: id, note });
      }
    }
    return order;
  };

  const completeOrder = (order) => {
    setOrders((o) =>
      o.map((x) => (x.id === order.id ? { ...x, status: "delivered" } : x)),
    );
    if (order.commission > 0) {
      setCommissions((c) => [
        {
          id: "C" + order.id.slice(4),
          orderId: order.id,
          net: order.net,
          pkg: order.pkg,
          amount: order.commission,
          status: "earned",
          at: Date.now(),
        },
        ...c,
      ]);
      setEarn((e) => ({
        available: +(e.available + order.commission).toFixed(2),
        thisMonth: +(e.thisMonth + order.commission).toFixed(2),
        lifetime: +(e.lifetime + order.commission).toFixed(2),
      }));
    }
  };

  // ---- real data fulfillment (DataHub via /api/orders) ----
  // Pull the user's real order history into local state.
  const refreshOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/orders", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        setOrders(d.orders || []);
      }
    } catch (e) {
    } finally {
      markLoaded("orders");
    }
  }, []);

  // Buy a data bundle for real: server debits the wallet, places it with DataHub,
  // and persists the order. Returns the created order (status "processing" until delivered).
  const buyData = async ({
    net,
    atProduct = null,
    capacityGb,
    pkg,
    recipient,
    cost,
    commission = 0,
  }) => {
    const r = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      // `expectedCost` is the amount the buy screen actually displayed. The server prices
      // independently and ignores `cost`, but it rejects the order outright if what it
      // priced isn't what the buyer was shown.
      body: JSON.stringify({
        net,
        atProduct,
        capacityGb,
        pkg,
        recipient,
        cost,
        commission,
        expectedCost: cost,
      }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw orderError(d, "Could not place the order.");
    setOrders((o) => [d.order, ...o]);
    refreshWallet();
    return d.order;
  };

  // Send airtime for real: the server debits the wallet, sends the top-up through Muviin
  // and persists the order (refunding immediately if the provider rejects it). Returns the
  // created order — "processing" until Muviin confirms delivery.
  const buyAirtime = async ({ net, amount, recipient }) => {
    const r = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "airtime", net, amount, recipient }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not send the airtime.");
    setOrders((o) => [d.order, ...o]);
    refreshWallet();
    return d.order;
  };

  // Buy a result-checker voucher (WASSCE / BECE) from the wallet. Priced server-side; the
  // order is placed and the PIN + serial arrive by SMS once support fulfils it.
  const buyChecker = async ({
    productId,
    recipient,
    qty = 1,
    expectedCost,
  }) => {
    const r = await fetch("/api/checkers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, recipient, qty, expectedCost }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not place the order.");
    refreshWallet();
    return d.order;
  };

  // ---- bulk SMS ----
  // The account's campaign history + its rate. Admins load the platform-wide view instead:
  // every campaign, every sender request, and our remaining credit with Arkesel.
  const refreshSms = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (role === "admin") {
        const r = await fetch("/api/admin/sms", { credentials: "include" });
        if (r.ok) {
          const d = await r.json().catch(() => ({}));
          if (Array.isArray(d.campaigns)) setSmsCampaigns(d.campaigns);
          if (Array.isArray(d.senders)) setSenderIds(d.senders);
          if (d.balance) setSmsBalance(d.balance);
          return;
        }
      }
      const [campaigns, senders] = await Promise.all([
        fetch("/api/sms", { credentials: "include" }),
        fetch("/api/sms/senders", { credentials: "include" }),
      ]);
      if (campaigns.ok) {
        const d = await campaigns.json().catch(() => ({}));
        if (Array.isArray(d.campaigns)) setSmsCampaigns(d.campaigns);
        if (typeof d.rate === "number") setSmsRate(d.rate);
      }
      if (senders.ok) {
        const d = await senders.json().catch(() => ({}));
        if (Array.isArray(d.senders)) setSenderIds(d.senders);
      }
    } catch (e) {
    } finally {
      markLoaded("sms");
    }
  }, [user?.id, role]);

  // Send a bulk campaign. Priced and charged server-side; anything the provider rejects is
  // refunded there too, so the campaign that comes back already reflects what was really
  // sent and really paid.
  const sendBulkSms = async ({ sender, recipients, message }) => {
    const r = await fetch("/api/sms", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender, recipients, message }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) {
      // A total failure still returns the campaign (already refunded) — record it so the
      // history shows the attempt rather than losing it.
      if (d.campaign) setSmsCampaigns((c) => [d.campaign, ...c]);
      refreshWallet();
      throw new Error(d.error || "Could not send the campaign.");
    }
    setSmsCampaigns((c) => [d.campaign, ...c]);
    refreshWallet();
    return { campaign: d.campaign, skipped: d.skipped || 0 };
  };

  // Ask for a sender ID. Usable only once an admin registers it with Arkesel and approves it.
  const requestSenderId = async (name) => {
    const r = await fetch("/api/sms/senders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not request that sender ID.");
    if (Array.isArray(d.senders)) setSenderIds(d.senders);
    toast("Sender ID submitted for approval", "check");
    return d.sender;
  };

  // Poll one order's live status (delivers, or fails + refunds server-side).
  const fetchOrderStatus = async (ref) => {
    const r = await fetch("/api/orders/" + encodeURIComponent(ref), {
      credentials: "include",
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not check the order.");
    setOrders((o) => o.map((x) => (x.id === ref ? d.order : x)));
    return d.order;
  };

  const requestWithdrawal = (amount, payout) => {
    const id =
      "WD·" + String(Math.floor(40 + Math.random() * 60)).padStart(4, "0");
    const auto = payoutCfg.autoApprove && amount <= payoutCfg.limit;
    const status = auto ? "approved" : "requested";
    const extra = auto ? { approvedAt: Date.now(), auto: true } : {};
    setWithdrawals((w) => [
      { id, amount, payout, status, at: Date.now(), ...extra },
      ...w,
    ]);
    setAdminWds((a) => [
      {
        id,
        reseller: user?.name || "Kwesi Boateng",
        amount,
        payout,
        status,
        at: Date.now(),
        ...extra,
      },
      ...a,
    ]);
    setEarn((e) => ({ ...e, available: +(e.available - amount).toFixed(2) }));
    if (auto) {
      toast("Verified — payout auto-approved, sending to MoMo", "check");
      setTimeout(() => {
        setWithdrawals((w) =>
          w.map((x) => (x.id === id ? { ...x, status: "paid" } : x)),
        );
        setAdminWds((a) =>
          a.map((x) => (x.id === id ? { ...x, status: "paid" } : x)),
        );
      }, 2600);
    } else {
      toast("Withdrawal of " + S.fmt(amount) + " requested", "coins");
    }
  };

  const setWdStatus = (id, status) => {
    setAdminWds((a) => a.map((w) => (w.id === id ? { ...w, status } : w)));
    setWithdrawals((w) => w.map((x) => (x.id === id ? { ...x, status } : x)));
    toast("Payout " + status, "check");
  };

  const resolveOrder = (id, how) => {
    setAdminOrds((a) =>
      a.map((o) =>
        o.id === id
          ? { ...o, status: how === "refund" ? "failed" : "delivered" }
          : o,
      ),
    );
    toast(
      how === "refund"
        ? "Order refunded to wallet"
        : "Order re-pushed to provider",
      "refresh",
    );
  };
  const suspendUser = () => toast("User flagged for review", "shield");
  const updatePrice = (id, field, val) =>
    setPrices((p) => p.map((b) => (b.id === id ? { ...b, [field]: val } : b)));

  // ---- agent online store ----
  const updateStore = (partial) => setStore((s) => ({ ...s, ...partial }));
  // `bundleId` MUST be the stable capacity key ("d5"), never the published bundle's id.
  // Bundle ids are regenerated as "d" + Date.now() every time an admin re-creates a bundle on
  // the Pricing page, so anything keyed by id is orphaned on the next publish — which is how
  // agents' saved prices silently reverted to platform retail. Stores were migrated onto the
  // capacity key; resolveStorePrice()/storePriceOf() still read the id form for safety.
  const setStorePrice = (net, bundleId, price) =>
    setStore((s) => ({
      ...s,
      prices: {
        ...s.prices,
        [net]: { ...(s.prices && s.prices[net]), [bundleId]: price },
      },
    }));
  // generic price setters for the other product families
  // The agent's own AFA selling price on their storefront. They keep whatever they set above
  // the platform fee; the server floors it at the fee so a store can't sell below our cost.
  // AFA pays no tier bonus and no override — this margin is the agent's entire upside.
  const setStoreAfaPrice = (price) =>
    setStore((s) => ({ ...s, afaPrice: price }));
  const setProductPrice = (field, key, price) =>
    setStore((s) => ({ ...s, [field]: { ...(s[field] || {}), [key]: price } }));
  const setUtilMarkup = (id, pct) =>
    setStore((s) => ({
      ...s,
      utilMarkup: { ...(s.utilMarkup || {}), [id]: pct },
    }));
  const toggleStoreNet = (net) =>
    setStore((s) => ({ ...s, nets: { ...s.nets, [net]: !s.nets[net] } }));
  // Open the agent's REAL public storefront in a new browser tab, so they see exactly what a
  // customer sees — live prices, live stock, a real guest checkout — with their dashboard
  // still open behind it. The old behaviour swapped the dashboard for an in-app render of
  // the store, which looked right but wasn't the public page and lost their place.
  //
  // Falls back to the in-app preview only when there's no handle yet (a store that has never
  // been saved has no public URL to open).
  const previewStore = () => {
    const handle = String(store?.handle || "").trim();
    if (!handle) {
      toast("Pick your store link first, then you can open it", "info");
      setScreen("store");
      window.scrollTo(0, 0);
      return;
    }
    // noopener: the new tab must not get a handle on ours via window.opener.
    window.open(
      "/" + encodeURIComponent(handle),
      "_blank",
      "noopener,noreferrer",
    );
  };
  const exitStore = () => {
    if (publicMode) {
      window.location.href = "/";
      return;
    }
    setScreen(user ? "app" : "site");
    window.scrollTo(0, 0);
  };

  // a customer buys through the agent's storefront; pays the agent's price by MoMo,
  // platform delivers and credits the agent the commission automatically.
  const placeStoreOrder = ({
    net,
    pkg,
    price,
    cost,
    commission,
    customer,
    payNet,
  }) => {
    const id = "SO·" + Math.floor(2240 + Math.random() * 500);
    const payName = S.NETWORKS[payNet] ? S.NETWORKS[payNet].name : "MTN";
    const order = {
      id,
      net,
      pkg,
      price,
      cost,
      commission,
      customer,
      customerName: "Storefront customer",
      status: "processing",
      at: Date.now(),
      pay: payName + " MoMo",
      momoRef: "MM·" + Math.floor(70000 + Math.random() * 9999),
      via: "direct",
    };
    setStoreOrders((o) => [order, ...o]);
    return order;
  };
  const completeStoreOrder = (order) => {
    setStoreOrders((o) =>
      o.map((x) =>
        x.id === order.id
          ? { ...x, status: "delivered", deliveredAt: Date.now() }
          : x,
      ),
    );
    if (order.commission > 0) {
      setCommissions((c) => [
        {
          id: "C" + order.id.slice(3),
          orderId: order.id,
          net: order.net,
          pkg: order.pkg,
          amount: order.commission,
          status: "earned",
          at: Date.now(),
          store: true,
        },
        ...c,
      ]);
      setEarn((e) => ({
        available: +(e.available + order.commission).toFixed(2),
        thisMonth: +(e.thisMonth + order.commission).toFixed(2),
        lifetime: +(e.lifetime + order.commission).toFixed(2),
      }));
    }
  };

  // ---- order actions (agent managing a store order) ----
  const retryStoreOrder = (id) => {
    setStoreOrders((o) =>
      o.map((x) => (x.id === id ? { ...x, status: "processing" } : x)),
    );
    toast("Re-pushing order to provider…", "refresh");
    setTimeout(() => {
      setStoreOrders((o) =>
        o.map((x) => {
          if (x.id !== id) return x;
          if (x.commission > 0 && x.status !== "delivered") {
            setCommissions((c) => [
              {
                id: "C" + x.id.slice(3) + "r",
                orderId: x.id,
                net: x.net,
                pkg: x.pkg,
                amount: x.commission,
                status: "earned",
                at: Date.now(),
                store: true,
              },
              ...c,
            ]);
            setEarn((e) => ({
              available: +(e.available + x.commission).toFixed(2),
              thisMonth: +(e.thisMonth + x.commission).toFixed(2),
              lifetime: +(e.lifetime + x.commission).toFixed(2),
            }));
          }
          return { ...x, status: "delivered" };
        }),
      );
      toast("Order delivered", "check");
    }, 1800);
  };
  const refundStoreOrder = (id) => {
    setStoreOrders((o) =>
      o.map((x) => (x.id === id ? { ...x, status: "refunded" } : x)),
    );
    toast("Customer refunded to mobile money", "refresh");
  };

  // ---- discount codes / promos (agent storefront) ----
  // Stored on the store config so they sync to the backend, reach the public storefront and
  // can be re-validated server-side at checkout (lib/server/promos.ts). A real data sale
  // counts its own redemption on the server; redeemPromo only covers the simulated products.
  const promos = Array.isArray(store.promos) ? store.promos : [];
  const setPromos = (fn) =>
    setStore((s) => ({
      ...s,
      promos: fn(Array.isArray(s.promos) ? s.promos : []),
    }));
  const addPromo = ({ code, type, value, scope, max, expires }) => {
    setPromos((p) => [
      {
        code: code.toUpperCase(),
        type,
        value: +value,
        scope: scope || "all",
        uses: 0,
        max: +max || 0,
        active: true,
        expires: expires || null,
      },
      ...p.filter((x) => x.code !== code.toUpperCase()),
    ]);
    toast("Promo code " + code.toUpperCase() + " created", "tag");
  };
  const togglePromo = (code) =>
    setPromos((p) =>
      p.map((x) =>
        x.code === code
          ? {
              ...x,
              active: !x.active,
              expires: x.active
                ? x.expires
                : x.expires === "ended"
                  ? null
                  : x.expires,
            }
          : x,
      ),
    );
  const deletePromo = (code) => {
    setPromos((p) => p.filter((x) => x.code !== code));
    toast("Promo code removed", "x");
  };
  const redeemPromo = (code) =>
    setPromos((p) =>
      p.map((x) => (x.code === code ? { ...x, uses: x.uses + 1 } : x)),
    );

  // ---- complaints (real support desk, backed by /api/complaints) ----
  // Role-aware: an admin pulls EVERY complaint (the support desk); everyone else pulls their
  // own. `unread` per complaint (support reply for a user, user reply for admin) drives the
  // nav badge.
  const refreshComplaints = useCallback(async () => {
    const url = role === "admin" ? "/api/admin/complaints" : "/api/complaints";
    try {
      const r = await fetch(url, { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.complaints)) setComplaints(d.complaints);
      }
    } catch (e) {
    } finally {
      markLoaded("complaints");
    }
  }, [role]);

  const addComplaint = async ({ subject, ref, category, message }) => {
    const r = await fetch("/api/complaints", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, ref, category, message }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not submit your complaint.");
    setComplaints((c) => [d.complaint, ...c]);
    toast("Complaint submitted", "check");
    return d.complaint;
  };

  // Reply on a complaint thread — as the customer (own thread) or as support (admin).
  const replyComplaint = async (id, message) => {
    const asAdmin = role === "admin";
    const url = asAdmin
      ? "/api/admin/complaints"
      : "/api/complaints/" + encodeURIComponent(id);
    const body = asAdmin ? { id, action: "reply", message } : { message };
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not send your message.");
    if (d.complaint)
      setComplaints((c) => c.map((x) => (x.id === id ? d.complaint : x)));
    return d.complaint;
  };

  // Admin moves a complaint's status (open / in-review / resolved).
  const complaintStatus = async (id, status) => {
    const r = await fetch("/api/admin/complaints", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "status", status }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not update the complaint.");
    if (d.complaint)
      setComplaints((c) => c.map((x) => (x.id === id ? d.complaint : x)));
    return d.complaint;
  };

  // Mark a thread read (clears its unread badge). Optimistic, then confirmed by the server.
  const markComplaintRead = async (id) => {
    const asAdmin = role === "admin";
    const url = asAdmin
      ? "/api/admin/complaints"
      : "/api/complaints/" + encodeURIComponent(id);
    const body = asAdmin ? { id, action: "read" } : { action: "read" };
    setComplaints((c) =>
      c.map((x) => (x.id === id ? { ...x, unread: false } : x)),
    );
    try {
      const r = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (d.complaint)
          setComplaints((c) => c.map((x) => (x.id === id ? d.complaint : x)));
      }
    } catch (e) {}
  };

  // ---- notification centre (real feed, backed by /api/notifications) ----
  // Every real platform event (delivery, refund, top-up, payout, store sale, support reply,
  // account change) raises a notification server-side; admin announcements are merged in for
  // the audiences they're addressed to. The polling loop below keeps the bell live.
  const refreshNotifications = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.notifications)) {
          setNotifications(d.notifications);
          setUnreadNotifs(d.unread || 0);
        }
      }
    } catch (e) {
    } finally {
      markLoaded("notifications");
    }
  }, []);

  // Every feed action returns the fresh feed, so one helper covers read/readAll/delete/clear.
  const notifAction = async (body) => {
    const r = await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return;
    const d = await r.json().catch(() => ({}));
    if (Array.isArray(d.notifications)) {
      setNotifications(d.notifications);
      setUnreadNotifs(d.unread || 0);
    }
  };

  // Optimistic: the badge/row updates instantly, then the server response confirms it.
  const markNotifRead = (id) => {
    setNotifications((n) =>
      n.map((x) => (x.id === id && !x.read ? { ...x, read: true } : x)),
    );
    setUnreadNotifs((u) =>
      Math.max(
        0,
        u - (notifications.find((x) => x.id === id && !x.read) ? 1 : 0),
      ),
    );
    return notifAction({ action: "read", id });
  };
  const markAllNotifsRead = () => {
    setNotifications((n) => n.map((x) => (x.read ? x : { ...x, read: true })));
    setUnreadNotifs(0);
    return notifAction({ action: "readAll" });
  };
  const deleteNotif = (id) => {
    setNotifications((n) => n.filter((x) => x.id !== id));
    return notifAction({ action: "delete", id });
  };
  const clearNotifs = () => {
    setNotifications([]);
    setUnreadNotifs(0);
    return notifAction({ action: "clear" });
  };

  // ---- referrals (real, backed by /api/referrals) ----
  // The code is minted server-side at signup; signups and paid bonuses are counted from
  // the referrals collection, so the Refer & earn card always shows live numbers.
  const refreshReferrals = useCallback(async () => {
    try {
      const r = await fetch("/api/referrals", { credentials: "include" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (d && typeof d.code === "string") setReferral(d);
      }
    } catch (e) {}
  }, []);

  // Validate a referral code on the sign-up form (public — no session needed).
  const checkRefCode = async (code) => {
    try {
      const r = await fetch("/api/referrals?check=" + encodeURIComponent(code));
      if (!r.ok) return { valid: false };
      return await r.json();
    } catch (e) {
      return { valid: false };
    }
  };

  // ---- admin announcements ----
  const refreshBroadcasts = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications", {
        credentials: "include",
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (Array.isArray(d.broadcasts)) setBroadcasts(d.broadcasts);
        if (d.counts) setAudienceCounts(d.counts);
      }
    } catch (e) {}
  }, []);

  // Send a message to everyone, only agents, or only customers. Optionally emails it too.
  const sendAnnouncement = async ({
    title,
    body,
    audience = "all",
    email = false,
  }) => {
    const r = await fetch("/api/admin/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, audience, email }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not send the announcement.");
    if (Array.isArray(d.broadcasts)) setBroadcasts(d.broadcasts);
    refreshNotifications();
    return d;
  };

  const deleteAnnouncement = async (id) => {
    const r = await fetch("/api/admin/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok)
      throw new Error(d.error || "Could not withdraw the announcement.");
    if (Array.isArray(d.broadcasts)) setBroadcasts(d.broadcasts);
    refreshNotifications();
  };

  const unreadComplaints = (complaints || []).filter(
    (c) => c && c.unread,
  ).length;
  const navBadges = {
    complaints: unreadComplaints,
    notifications: unreadNotifs,
  };

  // ---- MTN AFA registration ----
  // Server-backed: the wallet is charged the ADMIN-set price, the application is stored for
  // review, and the applicant is texted + emailed that it's under review. AFA earns an agent
  // nothing and no one but an admin can price it, so no price or commission is sent here.
  const registerAfa = async ({
    name,
    phone,
    ghanaCard,
    location,
    occupation,
    dob,
  }) => {
    const r = await fetch("/api/afa", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        ghanaCard,
        location,
        occupation,
        dob,
      }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) throw new Error(d.error || "Could not submit the registration.");
    setAfaRegs((list) => [
      d.registration,
      ...(list || []).filter((x) => x.id !== d.registration.id),
    ]);
    refreshWallet();
    toast("AFA registration submitted — under review", "check");
    return d.registration;
  };

  // The signed-in user's own registrations + the live admin-set price.
  const refreshAfa = async () => {
    try {
      const r = await fetch("/api/afa", { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json();
      setAfaRegs(d.registrations || []);
      if (typeof d.price === "number") setAfaPrice(d.price);
    } catch (e) {}
  };

  // ---- admin management ----
  // Every AFA application across the platform, with the full Ghana Card for review.
  const refreshAdminAfa = async () => {
    try {
      const r = await fetch("/api/admin/afa", { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json();
      setAdminAfa(d.registrations || []);
      if (d.pricing && typeof d.pricing.price === "number")
        setAfaPrice(d.pricing.price);
    } catch (e) {}
  };
  // Approve / reject / reopen. The server sends the applicant's SMS + email.
  const setAfaAdminStatus = async (ref, status) => {
    const r = await fetch("/api/admin/afa", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, action: "status", status }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) {
      toast(d.error || "Could not update the registration", "info");
      return;
    }
    setAdminAfa((a) =>
      a.map((x) => (x.id === ref ? { ...x, ...d.registration } : x)),
    );
    toast(
      status === "approved"
        ? "Approved — applicant notified"
        : status === "rejected"
          ? "Rejected — applicant notified"
          : "Reopened for review",
      status === "approved"
        ? "checkc"
        : status === "rejected"
          ? "x"
          : "refresh",
    );
  };
  // The ONLY way the AFA fee changes, anywhere.
  const setAfaAdminPrice = async (price) => {
    const r = await fetch("/api/admin/afa", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "price", price }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) {
      toast(d.error || "Could not save the price", "info");
      return;
    }
    setAfaPrice(d.pricing.price);
    toast("AFA price updated", "check");
  };
  // Admin decision on a sender ID request. `ref` is the SND-… record id, not the name.
  const setSenderStatus = async (ref, status, note) => {
    const r = await fetch("/api/admin/sms", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "senderStatus", ref, status, note }),
    });
    let d = {};
    try {
      d = await r.json();
    } catch (e) {}
    if (!r.ok) {
      toast(d.error || "Could not update that sender ID", "x");
      return;
    }
    if (Array.isArray(d.senders)) setSenderIds(d.senders);
    toast("Sender ID " + status, status === "approved" ? "check" : "x");
  };
  const updateChecker = (id, field, val) =>
    setCheckers((c) =>
      c.map((x) => (x.id === id ? { ...x, [field]: val } : x)),
    );
  const setAdminPrice = (net, id, field, val) =>
    setAdminPrices((p) => ({
      ...p,
      [net]: p[net].map((b) => (b.id === id ? { ...b, [field]: val } : b)),
    }));
  const setComplaintStatus = (id, status) => {
    setComplaints((c) =>
      c.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              last:
                status === "resolved"
                  ? "Marked resolved by support."
                  : "Reopened by support — investigating.",
            }
          : x,
      ),
    );
    toast("Complaint " + status, "check");
  };

  // Keep the signed-in dashboard live without a manual refresh: poll the backend on an
  // interval and immediately whenever the tab regains focus. New commissions, store sales,
  // orders, payouts and balance changes then appear on their own.
  useEffect(() => {
    if (publicMode || !user?.id) return;
    const refreshAll = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      )
        return;
      refreshWallet();
      refreshOrders();
      refreshStoreOrders();
      refreshWithdrawals();
      refreshComplaints();
      refreshNotifications();
      refreshReferrals();
    };
    const iv = setInterval(refreshAll, 15000);
    const onVisible = () => refreshAll();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [
    publicMode,
    user?.id,
    refreshWallet,
    refreshOrders,
    refreshStoreOrders,
    refreshWithdrawals,
    refreshComplaints,
    refreshNotifications,
    refreshReferrals,
  ]);

  const value = {
    S,
    publicMode,
    storeSaveState,
    dataLoading,
    bundlesFor,
    screen,
    sitePage,
    authMode,
    user,
    role,
    appPage,
    sessionChecked,
    ledger,
    commissions,
    orders,
    withdrawals,
    adminWds,
    adminOrds,
    prices,
    balance,
    earnings,
    toasts,
    store,
    storeOrders,
    complaints,
    afaRegs,
    afaPrice,
    tierInfo,
    adminAfa,
    senderIds,
    checkers,
    adminPrices,
    theme,
    smsCampaigns,
    smsRate,
    smsBalance,
    refreshSms,
    sendBulkSms,
    requestSenderId,
    setScreen,
    setSitePage,
    setAuthMode,
    navSite,
    goApp,
    setAppPage,
    authenticate,
    registerStart,
    registerVerify,
    loginUser,
    resetStart,
    resetVerify,
    updateProfile,
    changePassword,
    requestAgent,
    logout,
    switchRole,
    toggleTheme,
    fundWallet,
    payOrderMomo,
    payStoreOrderMomo,
    refreshStoreOrders,
    trackStoreOrder,
    refreshWallet,
    placeOrder,
    completeOrder,
    buyData,
    buyAirtime,
    buyChecker,
    refreshOrders,
    fetchOrderStatus,
    requestWithdrawal,
    withdrawStart,
    withdrawConfirm,
    refreshWithdrawals,
    setWdStatus,
    resolveOrder,
    suspendUser,
    updatePrice,
    toast,
    updateStore,
    setStorePrice,
    setStoreAfaPrice,
    setProductPrice,
    setUtilMarkup,
    toggleStoreNet,
    previewStore,
    exitStore,
    placeStoreOrder,
    completeStoreOrder,
    promos,
    addPromo,
    togglePromo,
    deletePromo,
    redeemPromo,
    payoutCfg,
    setPayoutCfg,
    retryStoreOrder,
    refundStoreOrder,
    addComplaint,
    refreshComplaints,
    replyComplaint,
    complaintStatus,
    markComplaintRead,
    unreadComplaints,
    navBadges,
    registerAfa,
    notifications,
    unreadNotifs,
    refreshNotifications,
    markNotifRead,
    markAllNotifsRead,
    deleteNotif,
    clearNotifs,
    broadcasts,
    audienceCounts,
    refreshBroadcasts,
    sendAnnouncement,
    deleteAnnouncement,
    referral,
    refreshReferrals,
    checkRefCode,
    earnBreakdown,
    credit,
    setAfaAdminStatus,
    setAfaAdminPrice,
    refreshAfa,
    refreshAdminAfa,
    setSenderStatus,
    updateChecker,
    setComplaintStatus,
    setAdminPrice,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export { LS_KEY, StoreCtx, StoreProvider, loadState, useStore };
