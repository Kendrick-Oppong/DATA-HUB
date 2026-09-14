// Agent online-store persistence. SERVER ONLY.
//
// Each reseller has ONE store, addressable by a unique `handle` that forms their public
// storefront URL: smartdatahubgh.com/<handle>. We persist the whole client-side store
// config object (branding, prices, product toggles, announcement, …) verbatim, so the
// public storefront route can hydrate the exact same `store` shape the agent edits in
// their dashboard — no translation layer.
//
// Scope note: this stores CONFIG only. Guest checkout on the public storefront is real for
// DATA (priced from this config, paid via Paystack, fulfilled via HubNet/GHDataConnect and
// credited to the agent) and for AIRTIME (face value, fulfilled via Muviin, no agent
// commission) — see storeOrderPayments.ts / storeOrders.ts and app/api/store/[handle]/pay.
// AFA has its own real flow (afaPayments.ts). Checkers and utilities have no storefront
// provider yet and remain simulated on the client (see components/storefront.tsx).
import { getStores } from "./db";
import { storefrontPrices } from "./pricing";

export interface StoreDoc {
  userId: string;
  handle: string;          // public URL segment, unique, [a-z0-9-]
  config: any;             // the client `store` object (SDH.defaultStore shape + agent edits)
  updatedAt: number;
  createdAt: number;
}

// Handles that must never resolve to a storefront (real routes / static assets / future use).
const RESERVED = new Set([
  "api", "mobile", "store", "stores", "admin", "assets", "public", "_next", "favicon",
  "r", "team", "my", "login", "signup", "register", "auth", "app", "dashboard", "help",
]);

// Normalize/validate a handle. Returns the cleaned handle or null if unusable.
export function normalizeHandle(raw: string): string | null {
  const h = String(raw || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
  if (h.length < 3 || h.length > 40) return null;
  if (RESERVED.has(h)) return null;
  return h;
}

export async function getStoreByUserId(userId: string): Promise<StoreDoc | null> {
  const stores = await getStores();
  return stores.findOne({ userId });
}

export async function getStoreByHandle(handle: string): Promise<StoreDoc | null> {
  const h = normalizeHandle(handle);
  if (!h) return null;
  const stores = await getStores();
  return stores.findOne({ handle: h });
}

// Public projection of a store — the config the storefront needs, nothing internal.
// Bundle prices go out already floored at the platform wholesale (see storefrontPrices),
// because a guest is never told the wholesale and so cannot apply that floor themselves.
export async function publicView(doc: StoreDoc): Promise<any> {
  return { ...doc.config, prices: await storefrontPrices(doc.config), handle: doc.handle };
}

// Create or update the signed-in agent's store. Enforces global handle uniqueness.
export async function saveStore(
  userId: string,
  config: any
): Promise<{ ok: true; store: StoreDoc } | { ok: false; error: string }> {
  const handle = normalizeHandle(config?.handle);
  if (!handle) return { ok: false, error: "Choose a store link of 3–40 letters, numbers or hyphens." };

  const stores = await getStores();

  // Reject if the handle is already used by a different agent.
  const clash = await stores.findOne({ handle });
  if (clash && clash.userId !== userId) {
    return { ok: false, error: "That store link is already taken. Try another." };
  }

  const now = Date.now();
  const existing = await stores.findOne({ userId });
  const doc: StoreDoc = {
    userId,
    handle,
    config: { ...config, handle }, // keep config.handle in sync with the indexed handle
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
  await stores.updateOne({ userId }, { $set: doc }, { upsert: true });
  return { ok: true, store: doc };
}
