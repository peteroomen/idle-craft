// mulberry32: tiny, fast, and its whole state is one uint32 that lives in the save.
export function random(s: { rng: number }): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max]. */
export const randInt = (s: { rng: number }, min: number, max: number) => min + Math.floor(random(s) * (max - min + 1));
