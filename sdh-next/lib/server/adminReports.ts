// Admin reporting — cross-agent sales & commission aggregates for the admin panel.
// SERVER ONLY. Built from the storeOrders collection (guest storefront sales) joined with
// the reseller accounts, so admins can see every agent's performance and every commission.
import { queryUsers, queryStoreOrders, queryOrders, queryWallets, queryWithdrawals } from "./db";
import { reconcilePending } from "./orders";
import { reconcileStoreAirtime } from "./storeOrders";
import { isInFlight, isAwaitingPayment } from "@/lib/orderStatus";

export interface AgentSalesRow {
  id: string;
  name: string;
  business: string | null;
  phone: string | null;
  email: string | null;
  handle: string | null;
  createdAt: number | null;
  orders: number;            // total store orders
  delivered: number;
  processing: number;
  failed: number;            // failed + refunded
  revenue: number;           // customer spend on delivered orders (sum of sell)
  commission: number;        // commission the agent EARNED (delivered only)
  pendingCommission: number; // commission on still-processing orders
  lastSaleAt: number | null;
}

export interface AdminSaleRow {
  id: string;
  agentId: string;
  agentName: string;
  business: string | null;
  handle: string | null;
  net: string;
  pkg: string;
  sell: number;
  commission: number;
  status: string;
  customer: string;
  at: number;
  deliveredAt: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const nameOf = (u: any) => (u?.name || u?.business || "Agent");
const phoneOf = (u: any) =>
  u?.phone?.local || u?.phone?.intl || (typeof u?.phone === "string" ? u.phone : null);

// Every agent (reseller) with their storefront sales rolled up, plus the flat list of all
// store orders (newest first). One pass over both collections.
export async function agentSalesReport(): Promise<{ agents: AgentSalesRow[]; orders: AdminSaleRow[] }> {
  const [resellers, storeOrders] = await Promise.all([
    queryUsers({ role: "reseller" }),
    queryStoreOrders({}),
  ]);

  const info = new Map<string, any>();
  for (const u of resellers) info.set(String(u._id), u);

  // Seed a row for every agent so agents with no sales still appear.
  const rows = new Map<string, AgentSalesRow>();
  const seed = (id: string, u: any, handle: string | null): AgentSalesRow => ({
    id,
    name: u ? nameOf(u) : (handle || "Agent"),
    business: u?.business || null,
    phone: phoneOf(u),
    email: u?.email || null,
    handle: handle || null,
    createdAt: u?.createdAt ? new Date(u.createdAt).getTime() : null,
    orders: 0, delivered: 0, processing: 0, failed: 0,
    revenue: 0, commission: 0, pendingCommission: 0, lastSaleAt: null,
  });
  for (const u of resellers) rows.set(String(u._id), seed(String(u._id), u, null));

  const orders: AdminSaleRow[] = [];
  for (const o of storeOrders) {
    const aid = String(o.agentUserId);
    const u = info.get(aid);
    let row = rows.get(aid);
    if (!row) { row = seed(aid, u, o.handle || null); rows.set(aid, row); }  // agent whose role changed
    if (!row.handle) row.handle = o.handle || null;

    row.orders++;
    if (o.status === "delivered") { row.delivered++; row.revenue += o.sell || 0; row.commission += o.commission || 0; }
    // waiting AND processing are both "in flight" — neither is a failure.
    else if (isInFlight(o.status)) { row.processing++; row.pendingCommission += o.commission || 0; }
    // "pending" is captured but UNPAID: it's an open order, not a failure — and its commission
    // isn't pending on anything yet, since no money has been confirmed.
    else if (isAwaitingPayment(o.status)) { row.processing++; }
    else row.failed++; // failed | refunded
    if (!row.lastSaleAt || (o.at || 0) > row.lastSaleAt) row.lastSaleAt = o.at || row.lastSaleAt;

    orders.push({
      id: o.ref,
      agentId: aid,
      agentName: row.name,
      business: row.business,
      handle: o.handle || null,
      net: o.net,
      pkg: o.pkg,
      sell: o.sell || 0,
      commission: o.commission || 0,
      status: o.status,
      customer: o.recipient,
      at: o.at || 0,
      deliveredAt: o.deliveredAt || null,
    });
  }

  const agents = [...rows.values()]
    .map((a) => ({ ...a, revenue: r2(a.revenue), commission: r2(a.commission), pendingCommission: r2(a.pendingCommission) }))
    .sort((a, b) => b.commission - a.commission || b.orders - a.orders || (b.lastSaleAt || 0) - (a.lastSaleAt || 0));
  orders.sort((a, b) => b.at - a.at);

  return { agents, orders };
}

// ---- Platform-wide order monitor: EVERY order, both signed-in buys (orders collection)
// and guest storefront sales (storeOrders), unified for the admin. ----
export interface PlatformOrderRow {
  id: string;
  net: string;
  pkg: string;
  type: string;
  amount: number;          // what was charged (cost for a buy, sell price for a store sale)
  status: string;
  at: number;
  user: string;            // buyer (or the selling agent, for a storefront sale)
  role: string;            // customer | reseller | storefront
  source: string;          // Wallet | Mobile money | Storefront
  recipient: string;
}

async function nameMap(): Promise<Map<string, { name: string; role: string }>> {
  const users = await queryUsers({});
  const m = new Map<string, { name: string; role: string }>();
  for (const u of users) m.set(String(u._id), { name: nameOf(u), role: u.role || "customer" });
  return m;
}

// Reconciliation is a NICE-TO-HAVE on this page; the listing is not. Run it behind a short
// deadline and fall back to the unreconciled rows on any error or delay, so a slow or
// unreachable provider can only ever cost freshness — never make the monitor look empty.
// (It did exactly that: provider calls had no timeout, so four orders stuck at an
// unresponsive provider hung the request until it was killed and the page rendered no orders.)
const RECONCILE_DEADLINE_MS = 6000;
async function bestEffort<T>(work: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    let timer: any;
    const deadline = new Promise<T>((resolve) => { timer = setTimeout(() => resolve(fallback), RECONCILE_DEADLINE_MS); });
    const out = await Promise.race([work, deadline]);
    clearTimeout(timer);
    return out;
  } catch (e: any) {
    console.error(`${label} reconciliation skipped:`, e?.message);
    return fallback;
  }
}

export async function platformOrders(): Promise<PlatformOrderRow[]> {
  const [rawOrders, rawStoreOrders, names] = await Promise.all([queryOrders({}), queryStoreOrders({}), nameMap()]);
  // The monitor is where a stuck order is most likely to be noticed, so settle in-flight
  // ones while we're here — but never at the cost of showing the list.
  const [orders, storeOrders] = await Promise.all([
    bestEffort(reconcilePending(rawOrders as any), rawOrders as any, "Order monitor"),
    bestEffort(reconcileStoreAirtime(rawStoreOrders as any), rawStoreOrders as any, "Store order"),
  ]);
  const rows: PlatformOrderRow[] = [];

  for (const o of orders) {
    const u = names.get(String(o.userId));
    rows.push({
      id: o.ref, net: o.net, pkg: o.pkg, type: o.type || "data",
      amount: o.cost || 0, status: o.status, at: o.at || 0,
      user: u?.name || "User", role: o.role || u?.role || "customer",
      source: o.pay || "Wallet", recipient: o.recipient,
    });
  }
  for (const o of storeOrders) {
    const u = names.get(String(o.agentUserId));
    rows.push({
      id: o.ref, net: o.net, pkg: o.pkg, type: "data",
      amount: o.sell || 0, status: o.status, at: o.at || 0,
      user: u?.name || o.handle || "Store", role: "storefront",
      source: "Storefront", recipient: o.recipient,
    });
  }
  rows.sort((a, b) => b.at - a.at);
  return rows;
}

// ---- Platform-wide transactions: every wallet ledger entry across all users. ----
export interface PlatformTxRow {
  id: string;
  userId: string;
  user: string;
  role: string;
  type: string;            // topup | purchase | refund | commission | withdrawal | external
  amount: number;          // signed
  ref: string;
  note: string;
  at: number;
}

// ---- Platform-wide withdrawals (agent payouts). ----
export interface PlatformWithdrawalRow {
  id: string;
  userId: string;
  user: string;
  amount: number;
  network: string;
  number: string;
  status: string;          // processing | paid | failed
  reason: string | null;
  at: number;
}

export async function platformWithdrawals(): Promise<PlatformWithdrawalRow[]> {
  const [wds, names] = await Promise.all([queryWithdrawals({}), nameMap()]);
  const rows: PlatformWithdrawalRow[] = wds.map((w: any) => ({
    id: w.reference,
    userId: String(w.userId),
    user: names.get(String(w.userId))?.name || "Agent",
    amount: w.amountGhs || 0,
    network: w.momo?.network || "",
    number: w.momo?.number || "",
    status: w.status,
    reason: w.failureReason || null,
    at: w.at || 0,
  }));
  rows.sort((a, b) => b.at - a.at);
  return rows;
}

export async function platformTransactions(): Promise<PlatformTxRow[]> {
  const [wallets, names] = await Promise.all([queryWallets({}), nameMap()]);
  const rows: PlatformTxRow[] = [];
  for (const w of wallets) {
    const u = names.get(String(w.userId));
    for (const e of w.ledger || []) {
      rows.push({
        id: e.id, userId: String(w.userId), user: u?.name || "User", role: u?.role || "customer",
        type: e.type, amount: e.amount || 0, ref: e.ref || "", note: e.note || "", at: e.at || 0,
      });
    }
  }
  rows.sort((a, b) => b.at - a.at);
  return rows;
}
