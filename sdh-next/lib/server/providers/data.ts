// Which provider fulfils which data network. SERVER ONLY.
//
// MTN, Telecel, AT (iShare + BigTime) → DataHub Ghana.
//
// Everything that buys or reconciles a DATA order goes through here rather than importing a
// provider directly, so the split lives in exactly one place. All adapters expose the same
// normalized shape, so callers don't care which one answered.
//
// HubNet and GHDataConnect are NOT retired code — they are still the only things that can
// settle the orders they took before the switch. An order records which provider fulfilled
// it (`provider` on the order doc), and reconciliation MUST route on that stored value, not
// on the network. Deleting either adapter would strand every in-flight order it holds.
import * as datahub from "./datahub";
import * as hubnet from "./hubnet";
import * as ghdc from "./ghdataconnect";
import type { OrderStatus } from "@/lib/orderStatus";
import type { ProductLine } from "./lines";

export type DataProvider = "datahub" | "hubnet" | "ghdc";

// The provider every new data order goes to.
//
// Safety valve, carried over from the previous switch-over: an adapter with no key runs in
// DRY mode, where a purchase is simulated and the reconciler happily reports "delivered".
// Routing live traffic at an unconfigured DataHub would charge customers for data that was
// never sent. So while DataHub is dry and HubNet is still live, data keeps going to HubNet —
// the moment DATAHUB_API_KEY is set it all switches over on its own. In a fully dry dev
// environment both are dry and DataHub stands, so local testing exercises the new provider.
export function providerFor(_net: string): DataProvider {
  if (datahub.providerMode() === "dry" && hubnet.providerMode() === "live") {
    if (!warned) {
      warned = true;
      console.warn("DataHub is not configured (DATAHUB_API_KEY blank) — data is still being fulfilled by HubNet.");
    }
    return "hubnet";
  }
  return "datahub";
}
let warned = false;

const adapterFor = (p: DataProvider) => (p === "hubnet" ? hubnet : p === "ghdc" ? ghdc : datahub);

// Is this network + line sellable at all? Used by the buy routes to reject an unsupported
// combination BEFORE any money moves.
//
// The line matters, not just the network: MTN Xpress exists only at DataHub, so while the
// HubNet safety valve above is engaged an Xpress order must be refused rather than quietly
// fulfilled as a standard MTN bundle at the Xpress price.
export function supportedNetwork(net: string, line?: ProductLine | null): boolean {
  const p = providerFor(net);
  if (p === "hubnet") return line === "xpress" ? false : !!hubnet.toNetworkCode(net, line);
  if (p === "ghdc") return !!ghdc.toNetworkKey(net, line);
  return !!datahub.toNetworkKey(net, line);
}

export interface DataPurchaseInput {
  phoneNumber: string;
  network: string;
  atProduct?: ProductLine | null;   // product line — see providers/lines.ts on the name
  capacityGb: number;
  reference: string;
}

// Place a data order with whichever provider owns the network. Returns the same shape as the
// adapters, plus the `provider` that took it so the caller can persist it on the order.
export async function purchaseData(
  input: DataPurchaseInput
): Promise<
  | { ok: true; provider: DataProvider; providerRef: string; status: OrderStatus; cost: number | null; raw: any }
  | { ok: false; provider: DataProvider; error: string; raw?: any }
> {
  const provider = providerFor(input.network);
  const r: any = await adapterFor(provider).purchase(input as any);
  // DataHub and GHDataConnect report what they charged us; HubNet doesn't, so cost stays null.
  return r.ok
    ? { ok: true, provider, providerRef: String(r.providerRef), status: r.status, cost: r.cost ?? null, raw: r.raw }
    : { ok: false, provider, error: String(r.error), raw: r.raw };
}

// Reconcile a data order. Routes on the provider STORED on the order, falling back to the
// current provider for older orders saved before the field existed. Every provider keys its
// status lookup on our own reference, so the call is identical either way.
export async function dataOrderStatus(
  reference: string,
  provider?: string | null,
  net?: string | null
): Promise<{ ok: true; status: OrderStatus; raw: any } | { ok: false; error: string; raw?: any }> {
  const p: DataProvider =
    provider === "ghdc" || provider === "hubnet" || provider === "datahub"
      ? provider
      : providerFor(String(net || "mtn"));
  return adapterFor(p).orderStatus(reference);
}

// Wallet balance at each upstream provider, for the admin view. HubNet and GHDataConnect are
// still reported so an admin can see the float left behind at the old providers.
export async function providerBalances(): Promise<{ datahub: any; hubnet: any; ghdc: any }> {
  const [d, h, g] = await Promise.all([datahub.balance(), hubnet.balance(), ghdc.balance()]);
  return { datahub: d, hubnet: h, ghdc: g };
}

export { datahub, hubnet, ghdc };
