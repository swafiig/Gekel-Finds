import type { Metadata } from "next";
import SuppliersPage from "@/features/Suppliers";

export const metadata: Metadata = { title: "Suppliers" };
export default function Page() {
  return <SuppliersPage />;
}
