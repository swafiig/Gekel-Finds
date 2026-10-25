import type { Delivery } from "./api";
import type { RiderStackParams } from "../navigation/types";

export const routeForStage = (d: Delivery): { name: "Pickup" | "Transit" | "Handover"; params: { id: string } } => {
  switch (d.stage) {
    case "to_pickup":
      return { name: "Pickup", params: { id: d.id } };
    case "picked_up":
    case "in_transit":
      return { name: "Transit", params: { id: d.id } };
    default:
      return { name: "Handover", params: { id: d.id } };
  }
};

export type RiderRoute = keyof RiderStackParams;
