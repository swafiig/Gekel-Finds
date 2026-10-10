import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

export function useCountdown(endsAt: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, endsAt - now);
  const s = Math.floor(ms / 1000);
  const parts = [pad(Math.floor(s / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];
  return { ms, ended: ms === 0, parts, label: parts.join(':') };
}
