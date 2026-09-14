// Support complaints / tickets. SERVER ONLY.
// A customer or agent raises a complaint; it holds a message thread the user and support
// (admin) both reply to, and a status the admin moves through open → in-review → resolved.
import { getComplaints, queryComplaints } from "./db";
import { opsRecipients, sendEmail, supportEmail } from "./email";
import { notifyAdmins, notifyUser } from "./notifications";
import { findUserById } from "./users";

export type ComplaintStatus = "open" | "in-review" | "resolved";

export interface ComplaintMessage {
  from: "user" | "support";
  text: string;
  at: number;
}

export interface ComplaintDoc {
  id: string;                 // CMP-… (customer-facing)
  userId: string;
  userName: string;           // filer's name (denormalized for the admin desk)
  subject: string;
  category: string;           // Delivery | Payment | Payout | Wallet | Account | Other
  ref: string;                // related order/reference, or "—"
  status: ComplaintStatus;
  messages: ComplaintMessage[];
  at: number;                 // created
  updatedAt: number;
  userReadAt?: number;        // last time the filer opened the thread
  adminReadAt?: number;       // last time an admin opened the thread
}

export function newComplaintRef(): string {
  return "CMP-" + Date.now() + "-" + Math.floor(100 + Math.random() * 900);
}

// Client-facing shape — mirrors what the UI already renders (id/subject/category/ref/status/
// at) plus `last` (latest message), `msgs` (count), the thread, the filer, and an `unread`
// flag computed for the VIEWER (a support reply is unread to the user; a user reply is unread
// to the admin) — this drives the nav badge.
export function publicComplaint(c: ComplaintDoc, viewer: "user" | "admin" = "user") {
  const msgs = c.messages || [];
  const last = msgs.length ? msgs[msgs.length - 1] : null;
  const readAt = viewer === "admin" ? (c.adminReadAt || 0) : (c.userReadAt || 0);
  const wantFrom = viewer === "admin" ? "user" : "support";
  const unread = !!last && last.from === wantFrom && last.at > readAt;
  return {
    id: c.id,
    subject: c.subject,
    category: c.category,
    ref: c.ref || "—",
    status: c.status,
    at: c.at,
    updatedAt: c.updatedAt,
    last: last ? last.text : "",
    lastFrom: last ? last.from : "user",
    msgs: msgs.length,
    messages: msgs,
    user: c.userName,
    userId: c.userId,
    unread,
  };
}

export async function createComplaint(input: {
  userId: string;
  userName: string;
  subject: string;
  category: string;
  ref?: string;
  message: string;
}): Promise<ComplaintDoc> {
  const now = Date.now();
  const doc: ComplaintDoc = {
    id: newComplaintRef(),
    userId: input.userId,
    userName: input.userName || "User",
    subject: input.subject.slice(0, 160),
    category: input.category || "Other",
    ref: (input.ref || "").trim() || "—",
    status: "open",
    messages: [{ from: "user", text: input.message.slice(0, 2000), at: now }],
    at: now,
    updatedAt: now,
    userReadAt: now,   // the filer has of course seen their own message
    adminReadAt: 0,    // unread for admins until one opens it
  };
  const c = await getComplaints();
  await c.insertOne(doc);
  return doc;
}

// Mark a thread as read by the viewer (clears their unread flag).
export async function markComplaintRead(id: string, viewer: "user" | "admin"): Promise<ComplaintDoc | null> {
  const c = await getComplaints();
  const doc = (await c.findOne({ id })) as ComplaintDoc | null;
  if (!doc) return null;
  const field = viewer === "admin" ? "adminReadAt" : "userReadAt";
  await c.updateOne({ id }, { $set: { [field]: Date.now() } });
  return { ...doc, [field]: Date.now() } as ComplaintDoc;
}

// ---- Email notifications (best-effort) ----
const appUrl = () => (process.env.APP_BASE_URL || "https://www.sdhghana.com").replace(/\/+$/, "");

// New complaint → tell the admins.
export async function notifyNewComplaint(doc: ComplaintDoc): Promise<void> {
  await notifyAdmins({
    type: "support",
    title: "New complaint raised",
    body: `${doc.userName}: ${doc.subject}`,
    link: "complaints",
    ref: doc.id,
  });
  try {
    const to = opsRecipients();
    if (!to.length) return;
    const subject = `New complaint · ${doc.subject}`;
    const text = `${doc.userName} raised a complaint.\n\nSubject: ${doc.subject}\nCategory: ${doc.category}\nReference: ${doc.ref}\n\n"${doc.messages[0]?.text || ""}"\n\nOpen the support desk: ${appUrl()}/admin`;
    for (const t of to) { try { await sendEmail(t, subject, text); } catch {} }
  } catch {}
}

// Support replied → tell the filer.
export async function notifyUserReply(doc: ComplaintDoc, text: string): Promise<void> {
  await notifyUser(doc.userId, {
    type: "support",
    title: "Support replied to your complaint",
    body: `${doc.subject} — "${text.slice(0, 160)}"`,
    link: "complaints",
    ref: doc.id,
  });
  try {
    const u = await findUserById(doc.userId);
    const email = u?.email;
    if (!email) return;
    const subject = `Support replied · ${doc.subject}`;
    const body = `Our support team replied to your complaint "${doc.subject}" (${doc.id}):\n\n"${text}"\n\nView and reply in the app: ${appUrl()}\nOr just reply to this email — it reaches ${supportEmail()}.`;
    await sendEmail(String(email), subject, body, undefined, { from: "support" });
  } catch {}
}

// Customer replied → tell the admins.
export async function notifyAdminsReply(doc: ComplaintDoc, text: string): Promise<void> {
  await notifyAdmins({
    type: "support",
    title: `Reply on complaint · ${doc.subject}`,
    body: `${doc.userName}: "${text.slice(0, 160)}"`,
    link: "complaints",
    ref: doc.id,
  });
  try {
    const to = opsRecipients();
    if (!to.length) return;
    const subject = `Reply on complaint · ${doc.subject}`;
    const body = `${doc.userName} replied on complaint ${doc.id}:\n\n"${text}"\n\nOpen the support desk: ${appUrl()}/admin`;
    for (const t of to) { try { await sendEmail(t, subject, body); } catch {} }
  } catch {}
}

export async function listComplaintsByUser(userId: string): Promise<ComplaintDoc[]> {
  return queryComplaints({ userId });
}

export async function listAllComplaints(): Promise<ComplaintDoc[]> {
  return queryComplaints({});
}

export async function getComplaint(id: string): Promise<ComplaintDoc | null> {
  const c = await getComplaints();
  return c.findOne({ id });
}

// Append a message to a complaint's thread. A support reply on an "open" ticket moves it to
// "in-review"; a user reply on a "resolved" ticket reopens it.
export async function addComplaintMessage(
  id: string,
  from: "user" | "support",
  text: string
): Promise<ComplaintDoc | null> {
  const c = await getComplaints();
  const doc = (await c.findOne({ id })) as ComplaintDoc | null;
  if (!doc) return null;
  const msg: ComplaintMessage = { from, text: String(text).slice(0, 2000), at: Date.now() };
  let status = doc.status;
  if (from === "support" && status === "open") status = "in-review";
  if (from === "user" && status === "resolved") status = "in-review";
  await c.updateOne({ id }, { $set: { messages: [...(doc.messages || []), msg], status, updatedAt: Date.now() } });
  return { ...doc, messages: [...(doc.messages || []), msg], status, updatedAt: Date.now() };
}

export async function setComplaintStatus(id: string, status: ComplaintStatus): Promise<boolean> {
  if (!["open", "in-review", "resolved"].includes(status)) return false;
  const c = await getComplaints();
  const res = await c.updateOne({ id }, { $set: { status, updatedAt: Date.now() } });
  return !!res && (res as any).matchedCount !== 0;
}
