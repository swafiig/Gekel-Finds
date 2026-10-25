import type { Order, OrderStatus } from "./api";
import type { Tone } from "../components/ui";

export type OrderGroup = "confirm" | "pack" | "handoff" | "done";

export const GROUPS: Array<{ key: OrderGroup; label: string }> = [
  { key: "confirm", label: "To confirm" },
  { key: "pack", label: "To pack" },
  { key: "handoff", label: "Handoff" },
  { key: "done", label: "Done" },
];

export const groupOf = (s: OrderStatus): OrderGroup => {
  switch (s) {
    case "awaiting_payment":
    case "payment_submitted":
      return "confirm";
    case "paid":
      return "pack";
    case "packed":
    case "ready":
    case "in_transit":
      return "handoff";
    default:
      return "done";
  }
};

export const STATUS_LABEL: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "Awaiting payment", tone: "neutral" },
  payment_submitted: { label: "Confirm payment", tone: "brand" },
  paid: { label: "Ready to pack", tone: "brand" },
  packed: { label: "Packed", tone: "brand" },
  ready: { label: "Ready for pickup", tone: "success" },
  in_transit: { label: "On the way", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/** What the supplier must do next, in plain words. Shown on cards and as the detail-screen header. */
export function nextAction(o: Order): string | null {
  switch (o.status) {
    case "awaiting_payment":
      return "Waiting for the buyer to pay your Till";
    case "payment_submitted":
      return "Check M-Pesa, then confirm you received the payment";
    case "paid":
      return "Pack the order and take a proof photo";
    case "packed":
      return "Mark ready so a rider can collect it";
    case "ready":
      return "Show the handoff code to the rider";
    case "in_transit":
      return "Rider is delivering";
    default:
      return null;
  }
}

/** Index into the 6-step supplier timeline. */
export function stepIndex(s: OrderStatus): number {
  return { awaiting_payment: 0, payment_submitted: 1, paid: 2, packed: 3, ready: 4, in_transit: 5, delivered: 6, cancelled: 0 }[s];
}
