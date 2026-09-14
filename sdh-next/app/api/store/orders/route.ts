import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/session";
import { listStoreOrdersByAgent, publicStoreOrder } from "@/lib/server/storeOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The signed-in agent's real storefront sales (guest data orders placed on their /<handle>
// store). Powers the "Store orders" dashboard and their earnings from storefront sales.
export async function GET() {
  const s = readSession();
  if (!s) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const orders = await listStoreOrdersByAgent(s.uid);
  return NextResponse.json({ orders: orders.map(publicStoreOrder) });
}
