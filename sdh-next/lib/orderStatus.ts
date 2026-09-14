// Order status vocabulary — shared by the SERVER (order docs, provider adapters, webhooks)
// and the CLIENT (badges, filters, counts). Client-safe: no server-only imports.
//
// The lifecycle, in order:
//
//   pending     — the order is CAPTURED but not paid for. Written the moment the buyer is
//                 handed off to Paystack, so a payment that succeeds without ever being
//                 confirmed back to us can never leave money gone and no order to point at.
//                 Nothing has been sent to any provider yet.
//   waiting     — paid, and the provider has ACCEPTED it but hasn't started sending.
//   processing  — the provider is actively sending it.
//   delivered / failed / refunded — settled.
//
// The two in-flight states mirror what the upstream providers actually report:
//
//   provider (DataHub Ghana)             Smart Data Hub
//   ---------------------------------   --------------
//   Accepted / pending / queued      →  waiting      (taken, not started yet)
//   In Progress / processing         →  processing   (actively being sent)
//   Completed / delivered            →  delivered
//
// `waiting` and `processing` both mean "money taken, nothing settled yet", so ANY code that
// reconciles, refunds, or counts open orders must test isInFlight() — never `=== "processing"`.
// `pending` is deliberately NOT in-flight: no money has been confirmed and no provider holds
// it, so reconcilers must never poll it and refunds must never fire on it.
export type OrderStatus = "pending" | "waiting" | "processing" | "delivered" | "failed" | "refunded";

// The two PAID, non-terminal states, in the order an order passes through them.
export const IN_FLIGHT: readonly OrderStatus[] = ["waiting", "processing"];

export function isInFlight(status?: string | null): boolean {
  return status === "waiting" || status === "processing";
}

// Captured, but the payment hasn't been confirmed yet.
export function isAwaitingPayment(status?: string | null): boolean {
  return status === "pending";
}

// Reached a final outcome. Anything NOT settled is still open in some form.
export function isSettled(status?: string | null): boolean {
  return status === "delivered" || status === "failed" || status === "refunded";
}

// Open = the customer is still waiting on an outcome (unpaid, queued or sending).
export function isOpen(status?: string | null): boolean {
  return !isSettled(status);
}

// Customer-facing label for a status.
export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  waiting: "Waiting",
  processing: "Processing",
  delivered: "Delivered",
  failed: "Failed",
  refunded: "Refunded",
};

export function statusLabel(status?: string | null): string {
  return STATUS_LABEL[String(status || "")] || "Processing";
}
