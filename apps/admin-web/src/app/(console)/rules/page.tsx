import type { Metadata } from "next";
import RulesPage from "@/features/Rules";

export const metadata: Metadata = { title: "Rules and team" };
export default function Page() {
  return <RulesPage />;
}
