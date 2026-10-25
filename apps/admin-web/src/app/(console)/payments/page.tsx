import type { Metadata } from "next";
import PaymentsPage from "@/features/Payments";

export const metadata: Metadata = { title: "Payments" };
export default function Page() {
  return <PaymentsPage />;
}
