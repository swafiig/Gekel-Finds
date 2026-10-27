import type { Metadata } from "next";
import Page_ from "@/features/Quotes";

export const metadata: Metadata = { title: "Quotes" };
export default function Page() {
  return <Page_ />;
}
