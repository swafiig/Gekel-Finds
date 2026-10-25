import type { Metadata } from "next";
import OrdersPage from "@/features/Orders";

export const metadata: Metadata = { title: "Orders" };
export default function Page() {
  return <OrdersPage />;
}
