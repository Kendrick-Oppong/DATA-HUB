import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import {
  findUserById,
  findByEmail,
  publicUser,
  updateUserById,
  DEFAULT_NOTIF,
} from "@/lib/server/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Update the signed-in user's profile. Editable here: name, email, business
// (resellers) and notification prefs. Phone is the verified login identity and is
// not changed from this screen.
export async function POST(req: Request) {
  try {
    const s = readSession();
    if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const me = await findUserById(s.uid);
    if (!me) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    if (b.name !== undefined) {
      const name = String(b.name || "").trim();
      if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
      patch.name = name;
    }

    if (b.email !== undefined) {
      const email = String(b.email || "").trim().toLowerCase();
      if (email) {
        if (!/\S+@\S+\.\S+/.test(email))
          return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
        const other = await findByEmail(email);
        if (other && String(other._id) !== s.uid)
          return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
        patch.email = email;
      } else {
        patch.email = null; // email is optional — allow clearing it
      }
    }

    if (b.business !== undefined && me.role === "reseller") {
      patch.business = String(b.business || "").trim() || null;
    }

    if (b.avatar !== undefined) {
      // Profile picture as a data URL (or null to remove). Guard the size so a huge
      // image can't bloat the user document (base64 is ~1.37× the raw bytes).
      const av = b.avatar;
      if (av === null || av === "") {
        patch.avatar = null;
      } else if (typeof av === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(av)) {
        if (av.length > 900_000)
          return NextResponse.json({ error: "Image too large — keep it under 600KB." }, { status: 400 });
        patch.avatar = av;
      } else {
        return NextResponse.json({ error: "Unsupported image." }, { status: 400 });
      }
    }

    if (b.notif !== undefined && b.notif) {
      patch.notif = {
        ...DEFAULT_NOTIF,
        ...(me.notif || {}),
        ...Object.fromEntries(
          Object.keys(DEFAULT_NOTIF).map((k) => [k, !!b.notif[k]])
        ),
      };
    }

    if (Object.keys(patch).length === 0)
      return NextResponse.json({ user: publicUser(me) });

    const updated = await updateUserById(s.uid, patch);
    return NextResponse.json({ user: publicUser(updated) });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
