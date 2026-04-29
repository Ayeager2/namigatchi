// Pure RNG utilities. Use these everywhere instead of bare Math.random()
// so we can later support seeded runs (replays, sharing seeds, debugging).

export const clamp = (n, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

// mulberry32 — small, fast, deterministic seeded RNG.
// Returns a function: rng() → [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one entry from a weighted table.
//   table: [{ weight: number, ...rest }, ...]
// Returns the selected entry (with all its fields).
export function pickWeighted(rng, table) {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of table) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return table[table.length - 1];
}

// Roll a chance: rng() < p ? true : false.
export function rollChance(rng, p) {
  return rng() < p;
}

// Random integer in [min, max] inclusive.
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
