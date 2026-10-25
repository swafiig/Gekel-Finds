import type { Config, HubName, PermKey, RoleName, StatusKey, Tone } from "./types";

export const HUBS: Record<HubName, { x: number; y: number; color: string }> = {
  Eastleigh: { x: 470, y: 150, color: "#FA3F0A" },
  Kamukunji: { x: 250, y: 205, color: "#FFFFFF" },
};
export const AREAS: Record<string, { x: number; y: number }> = {
  Kilimani: { x: 110, y: 255 }, Westlands: { x: 95, y: 70 }, "South B": { x: 380, y: 305 }, Parklands: { x: 210, y: 42 },
  CBD: { x: 285, y: 150 }, Ngara: { x: 330, y: 75 }, Umoja: { x: 590, y: 255 }, Kasarani: { x: 575, y: 60 }, Donholm: { x: 540, y: 205 }, "Lang'ata": { x: 150, y: 330 },
};
export const STATUS: Record<StatusKey, { label: string; tone: Tone; step: number }> = {
  awaiting_payment: { label: "Awaiting payment", tone: "", step: 0 },
  payment_submitted: { label: "Payment to confirm", tone: "warn", step: 1 },
  paid: { label: "Ready to pack", tone: "acc", step: 2 },
  packed: { label: "Packed", tone: "acc", step: 3 },
  ready: { label: "Awaiting rider", tone: "acc", step: 4 },
  in_transit: { label: "On the way", tone: "dk", step: 5 },
  delivered: { label: "Delivered", tone: "ok", step: 6 },
  cancelled: { label: "Cancelled", tone: "bad", step: -1 },
  disputed: { label: "In dispute", tone: "bad", step: 6 },
};
export const FLOW = ["Buyer pays supplier Till", "Supplier confirms payment", "Packed with proof photo", "Marked ready", "Rider collects", "Delivered"];
export const BUYERS = ["Kelvin M.", "Sarah O.", "Brian K.", "Grace W.", "Joy W.", "Faith W.", "Omari K.", "Mama Zawadi", "Amina H.", "Peter N.", "Naomi C.", "Dennis L.", "Halima S.", "Moses T."];
export const CATALOG: Record<string, [string, number][]> = {
  s1: [["Brown Leather Handbag", 1850], ["Red Handbag", 1650], ["Polo Shirts", 1300]],
  s2: [["Cotton Wax Print (6 yd)", 1450], ["Bed Sheets Set", 2300], ["Duvet Covers", 2800]],
  s3: [["Brass Planters", 620], ["Steel Pots Set", 3400], ["Door Hinges (box)", 1900]],
  s4: [["Black High Heels", 1650], ["Leather Sandals", 1100], ["Safari Work Boots", 2100]],
  s5: [["Leather Belts (12)", 4200], ["Wallets (6)", 2400], ["Laptop Bag", 3200]],
  s6: [["Wireless Headphones", 3500], ["Phone Chargers (10)", 2800], ["Power Bank 20k", 2600]],
  s7: [["Sufuria Set (5)", 3900], ["Cooking Pot 30cm", 1500], ["Thermos Flask", 1200]],
};
export const VERIFIED_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];
export const DEFAULT_CONFIG: Config = { findFee: 100, baseDelivery: 120, perKm: 20, servicePct: 1.5, serviceCap: 300, riderShare: 78, offerSecs: 45, radiusKm: 4, maxJobs: 1, quoteWindow: 90, payConfirmSla: 10 };

export const ROLES: RoleName[] = ["Super admin", "Ops lead", "Support", "Verifier", "Finance"];
export const PERMS: [PermKey, string][] = [
  ["orders", "Manage orders and dispatch"], ["suppliers", "Verify and suspend suppliers"], ["riders", "Suspend riders and edit documents"],
  ["disputes", "Rule on disputes"], ["payments", "Reconcile payments"], ["config", "Edit fees and dispatch rules"], ["team", "Manage team and roles"],
];
export const ROLE_PERMS: Record<RoleName, PermKey[]> = {
  "Super admin": ["orders", "suppliers", "riders", "disputes", "payments", "config", "team"],
  "Ops lead": ["orders", "suppliers", "riders", "disputes", "payments", "config"],
  Support: ["orders", "disputes"],
  Verifier: ["suppliers"],
  Finance: ["payments"],
};
export const ME = { name: "Rashid Mwangi", role: "Super admin" as RoleName };
export const permLabel = (p: PermKey) => PERMS.find((x) => x[0] === p)![1];

export const calcFee = (items: number, km: number, c: Config) => Math.round(c.findFee + c.baseDelivery + c.perKm * km + Math.min(c.serviceCap, (items * c.servicePct) / 100));
