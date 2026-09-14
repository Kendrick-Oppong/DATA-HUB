// In-app notification centre. SERVER ONLY.
//
// Two kinds of notification share the `notifications` collection:
//   * PERSONAL   — { userId } set. Raised by the platform for real events on ONE account
//                  (order delivered, wallet funded, payout sent, store sale, support reply…).
//                  Read state lives on the doc (`readAt`).
//   * BROADCAST  — { userId: null, audience }. An admin announcement to everyone / agents /
//                  customers. Stored ONCE (no fan-out) and resolved per viewer at read time;
//                  read state lives on the viewer's user doc (`notifReadIds`), and a
//                  "mark all read" just moves the `notifReadAt` watermark.
//
// Every raise helper is BEST-EFFORT: a notification must never fail an order, payment or
// payout, so all writes are swallowed and logged.
//
// This module deliberately depends only on db.ts (never users.ts) so user-lifecycle code
// can import it without an import cycle.
import { getNotifications, getUsers, queryNotifications, queryUsers, usingMongo } from "./db";
import { sendEmail } from "./email";

export type NotifAudience = "all" | "agents" | "customers";

export interface NotifDoc {
  id: string;                     // NTF-… (client-facing)
  userId: string | null;          // personal recipient, or null for a broadcast
  audience: NotifAudience | null; // broadcasts only
  type: string;                   // order | wallet | payout | sale | support | account | announcement
  title: string;
  body: string;
  icon: string;                   // client icon name (components/icons.tsx)
  link: string | null;            // app page to open on click, e.g. "orders"
  ref: string | null;             // related order/withdrawal reference
  by: string | null;              // admin who sent it (broadcasts)
  at: number;
  readAt?: number | null;         // personal only
}

// How many notifications a user's feed keeps / returns.
const FEED_LIMIT = 100;
// Cap the per-user read/hidden id lists so the user doc can't grow without bound.
const ID_LIST_CAP = 400;
// Never email more than this many recipients from one announcement.
const EMAIL_CAP = 500;

// Default icon per notification type (the client renders these by name).
const TYPE_ICON: Record<string, string> = {
  order: "receipt",
  wallet: "wallet",
  payout: "download",
  sale: "coins",
  support: "flag",
  account: "shield",
  referral: "gift",
  announcement: "megaphone",
};

export function newNotifRef(): string {
  return "NTF-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// Money formatting for notification copy — matches what the app shows elsewhere.
export function ghs(n: number): string {
  const v = Math.round(Number(n || 0) * 100) / 100;
  return "GH₵" + v.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- local user helpers (kept here so users.ts can import this module cycle-free) ----
async function idQuery(id: string): Promise<any> {
  if (!usingMongo) return { _id: id };
  const { ObjectId } = await import("mongodb");
  return { _id: new ObjectId(id) };
}
async function userById(id: string): Promise<any> {
  const users = await getUsers();
  if (!usingMongo) return users.findOne({ _id: id });
  try {
    return await users.findOne(await idQuery(id));
  } catch {
    return null;
  }
}
async function patchUser(id: string, set: Record<string, any>): Promise<void> {
  const users = await getUsers();
  await users.updateOne(await idQuery(id), { $set: set });
}

// ---- creating ----

interface NotifInput {
  type: string;
  title: string;
  body: string;
  icon?: string;
  link?: string | null;
  ref?: string | null;
}

async function insert(doc: NotifDoc): Promise<NotifDoc> {
  const c = await getNotifications();
  await c.insertOne(doc);
  return doc;
}

// Raise a notification for ONE user. Best-effort — never throws.
export async function notifyUser(userId: string, n: NotifInput): Promise<void> {
  if (!userId) return;
  try {
    await insert({
      id: newNotifRef(),
      userId: String(userId),
      audience: null,
      type: n.type,
      title: n.title,
      body: n.body,
      icon: n.icon || TYPE_ICON[n.type] || "bell",
      link: n.link || null,
      ref: n.ref || null,
      by: null,
      at: Date.now(),
      readAt: null,
    });
  } catch (e: any) {
    console.error("Notification error:", e?.message);
  }
}

// Raise the same notification for every admin (support desk alerts). Best-effort.
export async function notifyAdmins(n: NotifInput): Promise<void> {
  try {
    const admins = await queryUsers({ role: "admin" });
    for (const a of admins) await notifyUser(String(a._id), n);
  } catch (e: any) {
    console.error("Admin notification error:", e?.message);
  }
}

// Admin announcement to a whole audience. Stored as ONE doc; every matching user sees it.
export async function createBroadcast(p: {
  audience: NotifAudience;
  title: string;
  body: string;
  by?: string | null;
  link?: string | null;
}): Promise<NotifDoc> {
  return insert({
    id: newNotifRef(),
    userId: null,
    audience: p.audience,
    type: "announcement",
    title: p.title.slice(0, 140),
    body: p.body.slice(0, 2000),
    icon: "megaphone",
    link: p.link || null,
    ref: null,
    by: p.by || null,
    at: Date.now(),
  });
}

// ---- audience resolution ----

function inAudience(role: string, audience: NotifAudience | null): boolean {
  // Admins see every announcement (they send them).
  if (role === "admin") return true;
  const a = audience || "all";
  if (a === "agents") return role === "reseller";
  if (a === "customers") return role === "customer";
  return true;
}

// Everyone an announcement is addressed to (used for the recipient count + optional email).
export async function audienceUsers(audience: NotifAudience): Promise<any[]> {
  const all = await queryUsers({});
  return all.filter((u) => {
    const role = u.role || "customer";
    if (audience === "agents") return role === "reseller";
    if (audience === "customers") return role === "customer";
    return true;
  });
}

export async function audienceCount(audience: NotifAudience): Promise<number> {
  try {
    return (await audienceUsers(audience)).length;
  } catch {
    return 0;
  }
}

// ---- reading ----

// Client-facing shape.
function publicNotif(n: NotifDoc, read: boolean) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    icon: n.icon || TYPE_ICON[n.type] || "bell",
    link: n.link || null,
    ref: n.ref || null,
    at: n.at,
    read,
    broadcast: !n.userId,
    audience: n.audience || null,
    by: n.by || null,
  };
}

// The signed-in user's feed: their personal notifications merged with every announcement
// addressed to them (and sent since they joined), newest first, with per-viewer read state.
export async function listForUser(
  userId: string
): Promise<{ notifications: ReturnType<typeof publicNotif>[]; unread: number }> {
  const u = await userById(userId);
  if (!u) return { notifications: [], unread: 0 };

  const rows = (await queryNotifications({ $or: [{ userId: String(userId) }, { userId: null }] }, 300)) as NotifDoc[];
  const role = u.role || "customer";
  const watermark = Number(u.notifReadAt || 0);
  const readIds = new Set<string>(u.notifReadIds || []);
  const hiddenIds = new Set<string>(u.notifHiddenIds || []);
  const joinedAt = u.createdAt ? new Date(u.createdAt).getTime() : 0;

  const list = rows
    .filter((n) => {
      if (hiddenIds.has(n.id)) return false;
      if (n.userId) return true;                      // personal — always theirs
      if (n.at < joinedAt) return false;              // announcement sent before they joined
      return inAudience(role, n.audience);
    })
    .slice(0, FEED_LIMIT)
    .map((n) => {
      const read = n.userId ? !!n.readAt || n.at <= watermark : readIds.has(n.id) || n.at <= watermark;
      return publicNotif(n, read);
    });

  return { notifications: list, unread: list.filter((n) => !n.read).length };
}

// Mark one notification read for this viewer.
export async function markRead(userId: string, id: string): Promise<boolean> {
  const c = await getNotifications();
  const doc = (await c.findOne({ id })) as NotifDoc | null;
  if (!doc) return false;
  if (doc.userId) {
    if (String(doc.userId) !== String(userId)) return false;
    await c.updateOne({ id }, { $set: { readAt: Date.now() } });
    return true;
  }
  // Broadcast → remember it on the viewer's account.
  const u = await userById(userId);
  if (!u) return false;
  const ids: string[] = Array.isArray(u.notifReadIds) ? u.notifReadIds : [];
  if (ids.includes(id)) return true;
  await patchUser(userId, { notifReadIds: [id, ...ids].slice(0, ID_LIST_CAP) });
  return true;
}

// Mark everything currently in the feed read — a single watermark write.
export async function markAllRead(userId: string): Promise<void> {
  await patchUser(userId, { notifReadAt: Date.now() });
}

// Remove one notification from this viewer's feed. A personal one is deleted outright; an
// announcement is only hidden for them (it still exists for everyone else).
export async function removeForUser(userId: string, id: string): Promise<boolean> {
  const c = await getNotifications();
  const doc = (await c.findOne({ id })) as NotifDoc | null;
  if (!doc) return false;
  if (doc.userId) {
    if (String(doc.userId) !== String(userId)) return false;
    await c.deleteOne({ id });
    return true;
  }
  const u = await userById(userId);
  if (!u) return false;
  const ids: string[] = Array.isArray(u.notifHiddenIds) ? u.notifHiddenIds : [];
  if (!ids.includes(id)) await patchUser(userId, { notifHiddenIds: [id, ...ids].slice(0, ID_LIST_CAP) });
  return true;
}

// Clear the whole feed for this viewer (deletes their personal ones, hides announcements).
export async function clearForUser(userId: string): Promise<void> {
  const { notifications } = await listForUser(userId);
  for (const n of notifications) {
    try {
      await removeForUser(userId, n.id);
    } catch {}
  }
}

// ---- admin ----

// Every announcement an admin has sent, newest first.
export async function listBroadcasts(limit = 60): Promise<any[]> {
  const rows = (await queryNotifications({ userId: null }, limit)) as NotifDoc[];
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    audience: n.audience || "all",
    by: n.by || null,
    link: n.link || null,
    at: n.at,
  }));
}

// Withdraw an announcement — removes it from every recipient's feed.
export async function deleteBroadcast(id: string): Promise<boolean> {
  const c = await getNotifications();
  const doc = (await c.findOne({ id })) as NotifDoc | null;
  if (!doc || doc.userId) return false;
  await c.deleteOne({ id });
  return true;
}

// Optionally email an announcement to its audience. Best-effort and capped — a failure
// never fails the announcement itself (which is already saved in-app).
export async function emailBroadcast(
  audience: NotifAudience,
  title: string,
  body: string
): Promise<number> {
  let sent = 0;
  try {
    const users = await audienceUsers(audience);
    const emails = [...new Set(users.map((u) => String(u.email || "").toLowerCase()).filter(Boolean))].slice(0, EMAIL_CAP);
    for (const to of emails) {
      try {
        const res = await sendEmail(to, `Smart Data Hub · ${title}`, `${body}\n\n— Smart Data Hub`);
        if (res.ok) sent++;
      } catch {}
    }
  } catch (e: any) {
    console.error("Announcement email error:", e?.message);
  }
  return sent;
}
