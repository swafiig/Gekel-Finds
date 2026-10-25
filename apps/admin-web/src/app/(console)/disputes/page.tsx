import type { Metadata } from "next";
import DisputesPage from "@/features/Disputes";

export const metadata: Metadata = { title: "Disputes" };
export default function Page() {
  return <DisputesPage />;
}
