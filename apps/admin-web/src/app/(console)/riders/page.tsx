import type { Metadata } from "next";
import RidersPage from "@/features/Riders";

export const metadata: Metadata = { title: "Riders and dispatch" };
export default function Page() {
  return <RidersPage />;
}
