/** Deterministic PRNG for server-side encounter resolution. */

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** Mulberry32 — returns [0, 1) deterministically from seed string. */
export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollBelow(seed: string, probability: number): boolean {
  return createSeededRandom(seed)() < probability;
}

export function pickIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  return Math.floor(createSeededRandom(`${seed}:pick`)() * length);
}
