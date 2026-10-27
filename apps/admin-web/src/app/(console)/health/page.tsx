import type { Metadata } from "next";
import Page_ from "@/features/Health";

export const metadata: Metadata = { title: "App health" };
export default function Page() {
  return <Page_ />;
}
