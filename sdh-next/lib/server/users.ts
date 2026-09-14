// User helpers. SERVER ONLY.
import { getUsers, queryUsers, usingMongo } from "./db";
import { notifyAdmins, notifyUser } from "./notifications";
import { normalizeGhPhone } from "./phone";
import { generateRefCode } from "./referrals";

export const ROLES = ["customer", "reseller", "admin"] as const;

// Look up a user by id (handles ObjectId for real Mongo, string for the dev store).
export async function findUserById(id: string) {
  const users = await getUsers();
  if (usingMongo) {
    try {
      const { ObjectId } = await import("mongodb");
      return users.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }
  return users.findOne({ _id: id });
}

export const DEFAULT_NOTIF = { orders: true, lowbal: true, promos: false };

export function publicUser(doc: any) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email || null,
    phone: doc.phone?.local || null,
    role: doc.role,
    business: doc.business || null,
    agentStatus: doc.agentStatus || "none",
    avatar: doc.avatar || null,
    refCode: doc.refCode || null,
    notif: { ...DEFAULT_NOTIF, ...(doc.notif || {}) },
  };
}

// Build the _id query for either real Mongo (ObjectId) or the dev store (string).
async function idQuery(id: string): Promise<any> {
  if (!usingMongo) return { _id: id };
  const { ObjectId } = await import("mongodb");
  return { _id: new ObjectId(id) };
}

// Update selected fields on a user, then return the fresh public shape.
export async function updateUserById(id: string, patch: Record<string, any>) {
  const users = await getUsers();
  await users.updateOne(await idQuery(id), { $set: patch });
  return findUserById(id);
}

export async function findByEmail(email: string) {
  return (await getUsers()).findOne({ email: email.toLowerCase().trim() });
}

// ---- Admin bootstrap + role management ----
// The FIRST admin is created by listing their email in the ADMIN_EMAILS env var
// (comma-separated). On login/session, an allowlisted user is promoted to admin and the
// role is persisted — so after that they can add other admins from the Users page, and
// you can remove them from the env without losing their admin access.
export function isBootstrapAdmin(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(String(email).toLowerCase());
}

// Promote an allowlisted user to admin (persisted) if they aren't already. Returns the
// effective (possibly updated) user doc.
export async function ensureBootstrapAdmin(doc: any) {
  if (doc && doc.role !== "admin" && isBootstrapAdmin(doc.email)) {
    return (await updateUserById(String(doc._id), { role: "admin" })) || doc;
  }
  return doc;
}

// Resolve the signed-in user and confirm they're an admin (checks the LIVE db role, so a
// promotion/demotion takes effect immediately regardless of the session cookie's role).
export async function requireAdmin(uid: string) {
  const me = await findUserById(uid);
  return me && me.role === "admin" ? me : null;
}

export async function countAdmins(): Promise<number> {
  return (await queryUsers({ role: "admin" })).length;
}

// Admin-facing user shape for the Users table.
export function adminUserView(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name || "",
    email: doc.email || null,
    phone: doc.phone?.local || null,
    role: doc.role || "customer",
    business: doc.business || null,
    agentStatus: doc.agentStatus || "none",
    createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : null,
  };
}

// List users (optionally filtered by a name/email/phone search), newest first.
export async function listUsers(q = ""): Promise<any[]> {
  const all = await queryUsers({});
  const s = q.trim().toLowerCase();
  const rows = s
    ? all.filter((u) =>
        (u.name || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.phone?.local || "").includes(s))
    : all;
  return rows.map(adminUserView);
}

// Change a user's role. Guards: valid role, and never leave the platform with 0 admins.
export async function setUserRole(
  id: string,
  role: string
): Promise<{ ok: true; user: any } | { ok: false; error: string }> {
  if (!ROLES.includes(role as any)) return { ok: false, error: "Invalid role." };
  const target = await findUserById(id);
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === role) return { ok: true, user: adminUserView(target) };
  if (target.role === "admin" && role !== "admin") {
    if ((await countAdmins()) <= 1) return { ok: false, error: "You can't remove the last admin." };
  }
  const updated = await updateUserById(id, { role });
  return { ok: true, user: adminUserView(updated) };
}

export async function findByPhoneIntl(intl: string) {
  return (await getUsers()).findOne({ "phone.intl": intl });
}

// loginId may be an email or a phone number
export async function findByLogin(loginId: string) {
  const id = (loginId || "").trim();
  if (id.includes("@")) return findByEmail(id);
  const p = normalizeGhPhone(id);
  if (!p) return null;
  return findByPhoneIntl(p.intl);
}

// Insert a new user from a validated payload (password already hashed).
export async function createUser(data: {
  name: string;
  email: string;
  phone: { intl: string; local: string };
  passwordHash: string;
  role: string;
  business?: string | null;
  agentStatus?: string;   // none | pending | approved | rejected
}) {
  const users = await getUsers();
  const doc = {
    name: data.name,
    email: data.email.toLowerCase().trim(),
    phone: data.phone,
    passwordHash: data.passwordHash,
    role: data.role,
    business: data.business || null,
    agentStatus: data.agentStatus || "none",
    // Every account gets its own shareable referral code from day one.
    refCode: await generateRefCode(data.name),
    phoneVerified: true,
    createdAt: new Date(),
  };
  const res = await users.insertOne(doc);
  return { ...doc, _id: (res as any).insertedId };
}

// ---- Agent application lifecycle ----
// A user's granted access is `role`. Becoming an agent is gated: a request sets
// agentStatus "pending"; admin approval flips role → "reseller" (status "approved").
export type AgentStatus = "none" | "pending" | "approved" | "rejected";

// A customer applies to become an agent (optionally recording a business name).
export async function requestAgent(userId: string, business?: string): Promise<{ ok: true; user: any } | { ok: false; error: string }> {
  const u = await findUserById(userId);
  if (!u) return { ok: false, error: "User not found." };
  if (u.role === "reseller" || u.agentStatus === "approved") return { ok: false, error: "You're already an agent." };
  if (u.agentStatus === "pending") return { ok: false, error: "Your application is already under review." };
  const patch: Record<string, any> = { agentStatus: "pending" };
  if (business && business.trim()) patch.business = business.trim();
  const updated = await updateUserById(userId, patch);
  await notifyUser(userId, {
    type: "account",
    title: "Agent application received",
    body: "Thanks for applying! Our team is reviewing your application — we'll let you know as soon as it's approved.",
    icon: "brief",
    link: "profile",
  });
  await notifyAdmins({
    type: "account",
    title: "New agent application",
    body: `${patch.business || u.name || "A customer"} applied to become an agent.`,
    icon: "brief",
    link: "users",
  });
  return { ok: true, user: updated };
}

// Admin approves → grant the reseller role.
export async function approveAgent(userId: string): Promise<{ ok: true; user: any } | { ok: false; error: string }> {
  const u = await findUserById(userId);
  if (!u) return { ok: false, error: "User not found." };
  if (u.role === "admin") return { ok: false, error: "That user is an admin." };
  const updated = await updateUserById(userId, { role: "reseller", agentStatus: "approved" });
  await notifyUser(userId, {
    type: "account",
    title: "You're an approved agent 🎉",
    body: "Your agent account is live. Set up your store, price your bundles and start earning on every sale.",
    icon: "checkc",
    link: "my-store",
  });
  return { ok: true, user: updated };
}

// Admin rejects → keep them a customer, mark the application rejected.
export async function rejectAgent(userId: string): Promise<{ ok: true; user: any } | { ok: false; error: string }> {
  const u = await findUserById(userId);
  if (!u) return { ok: false, error: "User not found." };
  if (u.role === "admin") return { ok: false, error: "That user is an admin." };
  const updated = await updateUserById(userId, { role: "customer", agentStatus: "rejected" });
  await notifyUser(userId, {
    type: "account",
    title: "Agent application not approved",
    body: "We couldn't approve your agent application this time. Contact support if you'd like to know more or apply again.",
    icon: "info",
    link: "complaints",
  });
  return { ok: true, user: updated };
}
