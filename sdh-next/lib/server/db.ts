// Data layer. Uses real MongoDB when MONGODB_URI is set; otherwise falls back to a
// tiny in-memory store so the auth flow is testable before MongoDB is configured.
// SERVER ONLY — only imported by app/api route handlers, never client components.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "smart_data_hub";

export const usingMongo = !!uri;

// ---- minimal collection interface we rely on ----
export interface Coll {
  findOne(query: any): Promise<any>;
  insertOne(doc: any): Promise<any>;
  updateOne(query: any, update: any, opts?: { upsert?: boolean }): Promise<any>;
  deleteOne(query: any): Promise<any>;
  createIndex(spec: any, opts?: any): Promise<any>;
}

// ---------- real MongoDB ----------
async function mongoColl(name: string): Promise<Coll> {
  const { MongoClient } = await import("mongodb");
  const g = globalThis as any;
  if (!g._sdhMongo) {
    const client = new MongoClient(uri as string);
    // Cache the connection promise, but drop it on failure so the next request
    // retries instead of forever re-awaiting a rejected promise (e.g. a transient
    // network/allow-list issue at boot would otherwise poison the process).
    g._sdhMongo = client.connect().catch((e: unknown) => {
      g._sdhMongo = null;
      throw e;
    });
  }
  const client = await g._sdhMongo;
  return client.db(dbName).collection(name) as unknown as Coll;
}

// ---------- in-memory fallback ----------
function path(obj: any, p: string) {
  return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function match(doc: any, query: any): boolean {
  for (const [k, v] of Object.entries(query)) {
    if (k === "$or") {
      if (!(v as any[]).some((q) => match(doc, q))) return false;
      continue;
    }
    if (path(doc, k) !== v) return false;
  }
  return true;
}
function applyUpdate(doc: any, update: any) {
  if (update.$set) Object.assign(doc, update.$set);
  if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + (v as number);
  return doc;
}

class MemColl implements Coll {
  docs: any[] = [];
  async findOne(query: any) {
    return this.docs.find((d) => match(d, query)) || null;
  }
  async insertOne(doc: any) {
    if (!doc._id) doc._id = (globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random()));
    this.docs.push(doc);
    return { insertedId: doc._id };
  }
  async updateOne(query: any, update: any, opts: { upsert?: boolean } = {}) {
    let d = this.docs.find((x) => match(x, query));
    if (!d && opts.upsert) {
      d = { ...query };
      if (!d._id) d._id = globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random());
      this.docs.push(d);
    }
    if (d) applyUpdate(d, update);
    return { matchedCount: d ? 1 : 0, upsertedId: d ? d._id : null };
  }
  async deleteOne(query: any) {
    const i = this.docs.findIndex((d) => match(d, query));
    if (i >= 0) this.docs.splice(i, 1);
    return { deletedCount: i >= 0 ? 1 : 0 };
  }
  async createIndex() {
    return "ok";
  }
}
function memColl(name: string): Coll {
  const g = globalThis as any;
  g._sdhMem = g._sdhMem || {};
  if (!g._sdhMem[name]) g._sdhMem[name] = new MemColl();
  return g._sdhMem[name];
}

// ---------- accessors ----------
async function coll(name: string): Promise<Coll> {
  return usingMongo ? mongoColl(name) : memColl(name);
}

let indexed = false;
export async function getUsers(): Promise<Coll> {
  const c = await coll("users");
  if (usingMongo && !indexed) {
    indexed = true;
    try {
      await c.createIndex({ email: 1 }, { unique: true, sparse: true });
      await c.createIndex({ "phone.intl": 1 }, { unique: true });
    } catch {}
  }
  return c;
}
export async function getOtps(): Promise<Coll> {
  return coll("otps");
}

// List users matching a query, newest first (admin user management). Mongo + mem.
export async function queryUsers(query: any = {}): Promise<any[]> {
  const c: any = await getUsers();
  if (usingMongo) return c.find(query).sort({ createdAt: -1 }).toArray();
  return (c.docs as any[])
    .filter((d) => match(d, query))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

// One document per agent store: { userId, handle (unique), config, updatedAt }.
// `handle` is the public URL segment (smartdatahubgh.com/<handle>) and is unique.
let storesIndexed = false;
export async function getStores(): Promise<Coll> {
  const c = await coll("stores");
  if (usingMongo && !storesIndexed) {
    storesIndexed = true;
    try {
      await c.createIndex({ handle: 1 }, { unique: true });
      await c.createIndex({ userId: 1 }, { unique: true });
    } catch {}
  }
  return c;
}

// One document per user: { userId, balance, ledger: [ { id, type, amount, ref, note, at } ] }.
export async function getWallets(): Promise<Coll> {
  return coll("wallets");
}

// List wallet documents matching a query (admin-wide transaction view). Mongo + mem.
export async function queryWallets(query: any = {}): Promise<any[]> {
  const c: any = await coll("wallets");
  if (usingMongo) return c.find(query).toArray();
  return (c.docs as any[]).filter((d) => match(d, query));
}

// One document per order (queryable by `ref` for webhooks, by `userId` for listing).
export async function getOrders(): Promise<Coll> {
  return coll("orders");
}

// One document per GUEST storefront order (a customer buying on an agent's public /<handle>
// store). Keyed by `ref` (unique, customer-facing + the HubNet reference), queryable by
// `agentUserId` (agent's sales list), `handle` (store) and `providerRef` (webhook fallback).
let storeOrdersIndexed = false;
export async function getStoreOrders(): Promise<Coll> {
  const c = await coll("storeOrders");
  if (usingMongo && !storeOrdersIndexed) {
    storeOrdersIndexed = true;
    try {
      await c.createIndex({ ref: 1 }, { unique: true });
      await c.createIndex({ agentUserId: 1 });
      await c.createIndex({ handle: 1 });
      await c.createIndex({ providerRef: 1 });
      // Guest "track my order by phone number" — always scoped to one store.
      await c.createIndex({ handle: 1, recipient: 1 });
    } catch {}
  }
  return c;
}

// List store orders matching a query, newest first. Handles Mongo cursors and the mem store.
export async function queryStoreOrders(query: any): Promise<any[]> {
  const c: any = await getStoreOrders();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per top-up payment, keyed by its Paystack `reference`. Drives
// exactly-once wallet crediting (webhook + callback can both fire).
export async function getPayments(): Promise<Coll> {
  return coll("payments");
}

// Platform config singletons, keyed by `key` (e.g. "dataPricing"). One doc per config.
export async function getConfig(): Promise<Coll> {
  return coll("config");
}

// One document per result-checker order, keyed by `ref` (CHK-…), queryable by `userId`.
let checkerOrdersIndexed = false;
export async function getCheckerOrders(): Promise<Coll> {
  const c = await coll("checkerOrders");
  if (usingMongo && !checkerOrdersIndexed) {
    checkerOrdersIndexed = true;
    try {
      await c.createIndex({ ref: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
    } catch {}
  }
  return c;
}
export async function queryCheckerOrders(query: any = {}): Promise<any[]> {
  const c: any = await getCheckerOrders();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per failed-beneficiary report, keyed by `id` (FB-…). Indexed by phone so the
// same number reported twice can be spotted, and by status for the admin filter.
let failedBenIndexed = false;
export async function getFailedBeneficiaries(): Promise<Coll> {
  const c = await coll("failedBeneficiaries");
  if (usingMongo && !failedBenIndexed) {
    failedBenIndexed = true;
    try {
      await c.createIndex({ id: 1 }, { unique: true });
      await c.createIndex({ phoneNumber: 1 });
      await c.createIndex({ status: 1 });
    } catch {}
  }
  return c;
}
export async function queryFailedBeneficiaries(query: any = {}): Promise<any[]> {
  const c: any = await getFailedBeneficiaries();
  if (usingMongo) return c.find(query).sort({ createdAt: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Raw inbound webhook payloads, kept verbatim. Providers document their callbacks poorly (or
// not at all), so every delivery is recorded exactly as received — that's how we learn a
// payload's real shape instead of guessing field names, and it's the audit trail when a
// callback did or didn't arrive. Capped by the caller, not here.
export async function getWebhookEvents(): Promise<Coll> {
  return coll("webhookEvents");
}
export async function queryWebhookEvents(query: any = {}): Promise<any[]> {
  const c: any = await getWebhookEvents();
  if (usingMongo) return c.find(query).sort({ at: -1 }).limit(100).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 100);
}

// One document per AFA registration, keyed by `ref` (AFA-…), queryable by `userId` and by
// the applicant's canonical Ghana Card number (which is what stops the same card being
// registered twice).
let afaIndexed = false;
export async function getAfaRegistrations(): Promise<Coll> {
  const c = await coll("afaRegistrations");
  if (usingMongo && !afaIndexed) {
    afaIndexed = true;
    try {
      await c.createIndex({ ref: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
      await c.createIndex({ ghanaCard: 1 });
    } catch {}
  }
  return c;
}
export async function queryAfaRegistrations(query: any = {}): Promise<any[]> {
  const c: any = await getAfaRegistrations();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per support complaint, keyed by `id` (CMP-…), queryable by `userId`.
let complaintsIndexed = false;
export async function getComplaints(): Promise<Coll> {
  const c = await coll("complaints");
  if (usingMongo && !complaintsIndexed) {
    complaintsIndexed = true;
    try {
      await c.createIndex({ id: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
    } catch {}
  }
  return c;
}

// List complaints matching a query, newest-updated first. Mongo + mem.
export async function queryComplaints(query: any = {}): Promise<any[]> {
  const c: any = await getComplaints();
  if (usingMongo) return c.find(query).sort({ updatedAt: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// One document per SENDER ID request, keyed by `id` (SND-…). The 11-character name an
// agent's bulk SMS goes out under. Indexed by userId (their own list) and by name, since
// the same name can only be claimed once across the platform.
let senderIdsIndexed = false;
export async function getSenderIds(): Promise<Coll> {
  const c = await coll("senderIds");
  if (usingMongo && !senderIdsIndexed) {
    senderIdsIndexed = true;
    try {
      await c.createIndex({ id: 1 }, { unique: true });
      await c.createIndex({ name: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
    } catch {}
  }
  return c;
}
export async function querySenderIds(query: any = {}): Promise<any[]> {
  const c: any = await getSenderIds();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per BULK SMS campaign, keyed by `ref` (SMS-…), queryable by `userId`.
let smsIndexed = false;
export async function getSmsCampaigns(): Promise<Coll> {
  const c = await coll("smsCampaigns");
  if (usingMongo && !smsIndexed) {
    smsIndexed = true;
    try {
      await c.createIndex({ ref: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
    } catch {}
  }
  return c;
}
export async function querySmsCampaigns(query: any = {}, limit = 200): Promise<any[]> {
  const c: any = await getSmsCampaigns();
  if (usingMongo) return c.find(query).sort({ at: -1 }).limit(limit).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, limit);
}

// One document per REFERRED SIGNUP, keyed by `id` (REF-…). Queryable by `referrerId` (an
// agent's own referrals) and `referredId` (to qualify the reward on their first delivered order).
let referralsIndexed = false;
export async function getReferrals(): Promise<Coll> {
  const c = await coll("referrals");
  if (usingMongo && !referralsIndexed) {
    referralsIndexed = true;
    try {
      await c.createIndex({ id: 1 }, { unique: true });
      await c.createIndex({ referredId: 1 }, { unique: true });
      await c.createIndex({ referrerId: 1 });
    } catch {}
  }
  return c;
}

// List referrals matching a query, newest first. Mongo + mem.
export async function queryReferrals(query: any = {}): Promise<any[]> {
  const c: any = await getReferrals();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per in-app notification, keyed by `id` (NTF-…). A PERSONAL notification has
// a `userId`; an admin BROADCAST has `userId: null` plus an `audience` (all | agents |
// customers) and is resolved per-viewer at read time (see lib/server/notifications.ts).
let notifsIndexed = false;
export async function getNotifications(): Promise<Coll> {
  const c = await coll("notifications");
  if (usingMongo && !notifsIndexed) {
    notifsIndexed = true;
    try {
      await c.createIndex({ id: 1 }, { unique: true });
      await c.createIndex({ userId: 1, at: -1 });
      await c.createIndex({ at: -1 });
    } catch {}
  }
  return c;
}

// List notifications matching a query, newest first, capped. Mongo + mem.
export async function queryNotifications(query: any = {}, limit = 200): Promise<any[]> {
  const c: any = await getNotifications();
  if (usingMongo) return c.find(query).sort({ at: -1 }).limit(limit).toArray();
  return (c.docs as any[])
    .filter((d) => match(d, query))
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, limit);
}

// List orders matching a query, newest first. Handles Mongo cursors and the mem store.
export async function queryOrders(query: any): Promise<any[]> {
  const c: any = await coll("orders");
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}

// One document per withdrawal/payout request, keyed by `reference` (unique) and
// queryable by `userId` (listing) and `transferCode` (webhook settlement).
let wdIndexed = false;
export async function getWithdrawals(): Promise<Coll> {
  const c = await coll("withdrawals");
  if (usingMongo && !wdIndexed) {
    wdIndexed = true;
    try {
      await c.createIndex({ reference: 1 }, { unique: true });
      await c.createIndex({ userId: 1 });
      await c.createIndex({ transferCode: 1 });
    } catch {}
  }
  return c;
}

// List withdrawals matching a query, newest first. Handles Mongo cursors and the mem store.
export async function queryWithdrawals(query: any): Promise<any[]> {
  const c: any = await getWithdrawals();
  if (usingMongo) return c.find(query).sort({ at: -1 }).toArray();
  return (c.docs as any[]).filter((d) => match(d, query)).sort((a, b) => (b.at || 0) - (a.at || 0));
}
