import { NextResponse } from "next/server";
import { getStoreByHandle, publicView } from "@/lib/server/stores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUBLIC — no auth. Resolve an agent's storefront config by its handle so the public
// store page (/<handle>) can render it for guests. Returns 404 for unknown handles.
export async function GET(_req: Request, { params }: { params: { handle: string } }) {
  const doc = await getStoreByHandle(params.handle);
  if (!doc) return NextResponse.json({ error: "Store not found." }, { status: 404 });
  // Only expose open stores to guests; a closed store still resolves so the storefront
  // can show its "currently closed" state (the client handles config.open).
  return NextResponse.json({ store: await publicView(doc) });
}
