import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui";
import { clock } from "@/lib/format";
import type { Proof } from "@/lib/types";

export function ProofFrame({ p }: { p: Proof }) {
  return (
    <figure className="frame m-0">
      <div className="ph">
        <span className="seal">{p.seal ? <Pill tone="ok">Seal intact</Pill> : <Pill tone="warn">No seal</Pill>}</span>
        <svg viewBox="0 0 120 90" aria-hidden="true"><rect x="22" y="30" width="76" height="46" rx="3" fill="#8A6A4C" /><rect x="22" y="30" width="76" height="12" fill="#A5825F" /><rect x="54" y="30" width="12" height="46" fill="#FA3F0A" opacity=".9" /><rect x="74" y="50" width="18" height="12" rx="2" fill="#F4F2EE" /></svg>
        <div className="ts"><span>{clock(p.at)}</span><span>{p.gps}</span></div>
      </div>
      <figcaption>{p.cap}</figcaption>
    </figure>
  );
}
export const NoProof = () => (<figure className="frame empty m-0"><div className="ph"><Icon name="camera" /></div><figcaption>No proof photos yet. They appear when the supplier packs.</figcaption></figure>);
