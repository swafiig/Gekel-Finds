"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHead, Tabs } from "@/components/ui";
import { useDb } from "@/lib/store";
import Disputes from "./Disputes";
import Returns from "./Returns";

/** "Suluhu" is Swahili for solution. One desk for everything that went wrong after delivery. */
export default function Suluhu() {
  const db = useDb()!; const sp = useSearchParams(); const router = useRouter(); const [tab, setTab] = useState<"disputes" | "returns">(sp.get("tab") === "returns" ? "returns" : "disputes");
  const od = db.disputes.filter((d) => d.status !== "resolved").length, or = db.returns.filter((r) => ["requested", "discussing", "approved"].includes(r.status)).length;
  return (
    <>
      <PageHead title="Suluhu desk" sub="Suluhu means solution. Disputes about an order and return requests are handled here, with the proof and both sides in one place." />
      <div className="seg" role="tablist" aria-label="Desk"><button role="tab" aria-pressed={tab === "disputes"} onClick={() => { setTab("disputes"); router.replace("/suluhu"); }}>Disputes ({od})</button><button role="tab" aria-pressed={tab === "returns"} onClick={() => { setTab("returns"); router.replace("/suluhu?tab=returns"); }}>Returns ({or})</button></div>
      {tab === "disputes" ? <Disputes embedded /> : <Returns />}
    </>
  );
}
void Tabs;
