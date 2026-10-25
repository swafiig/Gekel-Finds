export const MIN = 60000;
export const ago = (m: number) => Date.now() - m * MIN;
let seed = 20261024;
export function reseed(s = 20261024) { seed = s; }
export const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
export const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
