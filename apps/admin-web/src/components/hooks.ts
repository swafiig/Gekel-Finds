"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Drawer state that can be opened from a link such as /find?open=f3 and cleared again on close. */
export function useOpenId(param = "open") {
  const sp = useSearchParams(); const router = useRouter(); const path = usePathname();
  const q = sp.get(param); const [id, setId] = useState<string | null>(q);
  useEffect(() => { if (q) setId(q); }, [q]);
  const close = () => { setId(null); if (sp.get(param)) router.replace(path, { scroll: false }); };
  return [id, setId, close] as const;
}
export function useDownload() {
  return (name: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}
