// Bulk-SMS sender IDs — the ≤11-character name a campaign shows as on the handset.
// SERVER ONLY.
//
// Arkesel has no public API for registering a sender ID: the name has to be submitted on
// their dashboard and cleared by the telcos, which takes hours. So this is a REAL two-sided
// workflow rather than an automated one — an agent requests a name here, an admin registers
// it with Arkesel, and approving it here is what makes it selectable in the composer.
//
// A shared, already-registered sender ID (ARKESEL_BULK_SENDER_ID) is offered to everyone as
// a built-in, so an agent can send from day one instead of waiting on approval. It's separate
// from the transactional sender our own OTPs go out under.
import { getSenderIds, querySenderIds } from "./db";
import { bulkSenderId, platformSenderId } from "./arkesel";
import { notifyAdmins, notifyUser } from "./notifications";

export type SenderIdStatus = "pending" | "approved" | "rejected";

export interface SenderIdDoc {
  id: string;            // SND-…
  userId: string;
  userName: string;
  name: string;          // the sender ID itself, uppercase, ≤11 chars
  status: SenderIdStatus;
  note: string | null;   // admin's reason, shown to the agent on a rejection
  at: number;
  updatedAt: number;
  reviewedBy?: string | null;
}

export function newSenderRef(): string {
  return "SND-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
}

// Telcos accept letters, digits, spaces, hyphens and dots, up to 11 characters, and the name
// must contain at least one letter (a digits-only sender ID is rejected as a shortcode).
export function normalizeSenderName(raw: string): string | null {
  const name = String(raw || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 11) return null;
  if (!/^[A-Z0-9 .-]+$/.test(name)) return null;
  if (!/[A-Z]/.test(name)) return null;
  return name;
}

export function publicSenderId(d: SenderIdDoc) {
  return {
    id: d.name,          // the client keys and displays by the NAME, which is what's unique
    ref: d.id,
    userId: d.userId,
    user: d.userName,
    status: d.status,
    note: d.note || null,
    at: d.at,
    updatedAt: d.updatedAt || d.at,
  };
}

// The built-in platform sender, presented in the same shape as a registered one so the
// composer can list it alongside the agent's own without a special case.
export function platformSenderOption() {
  return {
    id: bulkSenderId(),
    ref: "SND-PLATFORM",
    userId: null as string | null,
    user: "Smart Data Hub",
    status: "approved" as const,
    note: "Shared platform sender — available to everyone.",
    at: 0,
    updatedAt: 0,
    platform: true,
  };
}

export async function listSenderIdsByUser(userId: string): Promise<SenderIdDoc[]> {
  return querySenderIds({ userId });
}

export async function listAllSenderIds(): Promise<SenderIdDoc[]> {
  return querySenderIds({});
}

export async function findSenderIdByName(name: string): Promise<SenderIdDoc | null> {
  const c = await getSenderIds();
  return c.findOne({ name });
}

// Request a sender ID. The name is claimed platform-wide on first request, so two agents
// can't both send as the same name — whoever asked first owns it.
export async function requestSenderId(
  user: { id: string; name?: string },
  rawName: string
): Promise<{ ok: true; sender: SenderIdDoc } | { ok: false; error: string }> {
  const name = normalizeSenderName(rawName);
  if (!name) {
    return { ok: false, error: "Use 3–11 characters: letters, numbers, spaces, dots or hyphens, including at least one letter." };
  }
  if (name === bulkSenderId().toUpperCase()) {
    return { ok: false, error: "That's the shared platform sender — you can already send with it." };
  }
  // Our transactional sender is ours alone: an agent sending campaigns under it would look
  // like an OTP or a delivery text from us.
  if (name === platformSenderId().toUpperCase()) {
    return { ok: false, error: "That name is reserved. Try another one." };
  }

  const existing = await findSenderIdByName(name);
  if (existing) {
    if (existing.userId === user.id) {
      return { ok: false, error: `You've already requested ${name} — it's ${existing.status}.` };
    }
    return { ok: false, error: "That sender ID is already taken. Try another name." };
  }

  const now = Date.now();
  const doc: SenderIdDoc = {
    id: newSenderRef(),
    userId: user.id,
    userName: user.name || "Agent",
    name,
    status: "pending",
    note: null,
    at: now,
    updatedAt: now,
    reviewedBy: null,
  };
  const c = await getSenderIds();
  try {
    await c.insertOne(doc);
  } catch {
    // Lost the race on the unique index — someone else claimed the name in between.
    return { ok: false, error: "That sender ID is already taken. Try another name." };
  }

  await notifyAdmins({
    type: "account",
    title: `Sender ID requested · ${name}`,
    body: `${doc.userName} wants to send bulk SMS as "${name}". Register it on Arkesel, then approve it here.`,
    icon: "mail",
    link: "sms",
    ref: doc.id,
  });
  return { ok: true, sender: doc };
}

// Admin decision. Approving only marks it usable HERE — the name must already be registered
// with Arkesel, or the provider will reject every send under it.
export async function setSenderIdStatus(
  ref: string,
  status: SenderIdStatus,
  adminId: string,
  note?: string
): Promise<{ ok: true; sender: SenderIdDoc } | { ok: false; error: string }> {
  if (!["pending", "approved", "rejected"].includes(status)) return { ok: false, error: "Unknown status." };
  const c = await getSenderIds();
  const doc: SenderIdDoc | null = await c.findOne({ id: ref });
  if (!doc) return { ok: false, error: "Sender ID not found." };

  const now = Date.now();
  await c.updateOne(
    { id: ref },
    { $set: { status, note: note?.trim() || null, reviewedBy: adminId, updatedAt: now } }
  );
  const updated = { ...doc, status, note: note?.trim() || null, updatedAt: now };

  if (status !== doc.status) {
    await notifyUser(doc.userId, {
      type: "account",
      title: status === "approved" ? `Sender ID ${doc.name} approved` : `Sender ID ${doc.name} rejected`,
      body:
        status === "approved"
          ? `Your bulk SMS can now go out as "${doc.name}". Pick it in the composer under SMS.`
          : `We couldn't register "${doc.name}".${note?.trim() ? " " + note.trim() : " Try a different name."}`,
      icon: "mail",
      link: "sms",
      ref: doc.id,
    });
  }
  return { ok: true, sender: updated };
}

// The senders this account may actually send under: the shared platform one, plus any of
// their own that an admin has approved. This is the allow-list the send route checks —
// never the value the client posts.
export async function allowedSendersFor(userId: string): Promise<string[]> {
  const own = (await listSenderIdsByUser(userId)).filter((s) => s.status === "approved").map((s) => s.name);
  return [bulkSenderId(), ...own];
}
