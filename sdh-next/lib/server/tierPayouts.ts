// Paying the tier bonus on a delivered order. SERVER ONLY.
//
// Implements "Tier Bonus Formula, Updated" (31 Jul 2026) §1. Kept separate from tiers.ts
// (pure maths) and imported by orders.ts, so it must not import orders.ts back — it reaches
// the collection through db.ts directly.
//
// THE BASE IS THE PLATFORM'S MARGIN: what the AGENT paid US, minus what WE paid Hubnet.
//
//   platform_margin = order.wholesale − order.supplierCost
//   bonus           = platform_margin × tier_rate
//
// It is NOT `order.commission`. That field is retail − wholesale — the AGENT's own margin,
// money the platform never touches. Paying a percentage of it meant paying out of revenue we
// never received, and it moved whenever an agent changed their own price. That was the bug
// this file previously had, and it's what the 31 Jul correction exists to fix.
import { getOrders, getStoreOrders } from "./db";
import { ghs, notifyUser } from "./notifications";
import { monthlyBlended, platformMargin, tierBonusOnMargin } from "./tiers";
import { addTx } from "./wallet";
import { payRecruitmentOverride } from "./overrides";
import type { OrderDoc } from "./orders";

// Pay the reseller their tier bonus for one delivered order — at most once.
export async function payTierBonus(order: OrderDoc): Promise<void> {
  if (!order || order.role !== "reseller") return;          // customers earn no tier bonus

  // What the agent paid us. On a reseller order that's the wholesale price, which is also
  // what was debited — `wholesale` is stored explicitly, with `cost` as the fallback for
  // orders placed before that field existed.
  const wholesale = Math.round(Number(order.wholesale ?? order.cost ?? 0) * 100) / 100;
  // What we paid Hubnet. Prefer what the provider actually charged; fall back to the vendor
  // catalog price captured at purchase.
  const supplier = Math.round(
    Number(
      typeof order.providerCost === "number" && Number.isFinite(order.providerCost)
        ? order.providerCost
        : order.supplierCost ?? 0
    ) * 100
  ) / 100;

  // Airtime is face value, so there's no wholesale/supplier split and it correctly earns
  // nothing. An order with no known supplier price pays nothing either — a bonus computed
  // off a guess is exactly how a sale quietly becomes a loss.
  const margin = platformMargin(wholesale, supplier);
  if (!(margin > 0)) return;

  // The reseller's tier comes from their blended monthly earnings (§2), which already
  // carries the 70%-real-sales safeguard.
  const { tier } = await monthlyBlended(order.userId);
  const bonus = tierBonusOnMargin(margin, tier.rate);   // base is the PLATFORM margin, never retail
  if (!(bonus > 0)) return;

  // tierBonusOnMargin already caps the bonus at the margin it comes from, so `platform_keeps`
  // can never go negative whatever rate is configured.

  // Claim the order before money moves, so a webhook and the poller can't both pay it.
  const orders = await getOrders();
  const claim = await orders.updateOne(
    { ref: order.ref, tierBonusPaid: { $ne: true } },
    { $set: { tierBonusPaid: true, tierBonusAmount: bonus, tierBonusTier: tier.id } }
  );
  if (!claim || (claim as any).matchedCount === 0) return;

  await addTx(order.userId, {
    type: "commission",
    amount: bonus,
    ref: order.ref,
    note: `${tier.name} tier bonus · ${order.pkg} · ${order.recipient}`,
  });
  await notifyUser(order.userId, {
    type: "sale",
    title: `${tier.name} bonus · ${ghs(bonus)}`,
    body: `You earned ${ghs(bonus)} on ${order.pkg} — ${Math.round(tier.rate * 100)}% of the ${ghs(margin)} platform margin.`,
    icon: "coins",
    link: "wallet",
    ref: order.ref,
  });

  // §4: their recruiter (if any) earns an override on this commission.
  await payRecruitmentOverride(order.userId, bonus, order.ref);
}

// The same bonus on a delivered STOREFRONT sale (§1: the tier bonus doesn't care whether the
// sale came through the agent's online store or a manual buy on their behalf).
//
// Identical base — what the agent paid us, minus what we paid Hubnet. The guest's price is
// the agent's business and plays no part, which is exactly the point of the correction.
export async function payStoreTierBonus(order: {
  ref: string;
  agentUserId: string;
  pkg: string;
  recipient: string;
  wholesale?: number;
  supplierCost?: number;
  tierBonusPaid?: boolean;
}): Promise<void> {
  if (!order || !order.agentUserId) return;

  const margin = platformMargin(Number(order.wholesale || 0), Number(order.supplierCost || 0));
  if (!(margin > 0)) return;

  const { tier } = await monthlyBlended(order.agentUserId);
  const bonus = tierBonusOnMargin(margin, tier.rate);
  if (!(bonus > 0)) return;

  // Claim on the store order, so webhook and poller can't both pay it.
  const store = await getStoreOrders();
  const claim = await store.updateOne(
    { ref: order.ref, tierBonusPaid: { $ne: true } },
    { $set: { tierBonusPaid: true, tierBonusAmount: bonus, tierBonusTier: tier.id } }
  );
  if (!claim || (claim as any).matchedCount === 0) return;

  await addTx(order.agentUserId, {
    type: "commission",
    amount: bonus,
    ref: order.ref,
    note: `${tier.name} tier bonus · ${order.pkg} · ${order.recipient}`,
  });
  await notifyUser(order.agentUserId, {
    type: "sale",
    title: `${tier.name} bonus · ${ghs(bonus)}`,
    body: `You earned ${ghs(bonus)} on ${order.pkg} — ${Math.round(tier.rate * 100)}% of the ${ghs(margin)} platform margin.`,
    icon: "coins",
    link: "wallet",
    ref: order.ref,
  });

  await payRecruitmentOverride(order.agentUserId, bonus, order.ref);
}
