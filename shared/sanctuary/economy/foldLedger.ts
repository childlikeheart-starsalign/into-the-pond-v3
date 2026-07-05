import type { EconomyLedgerCheckpoint, EconomyLedgerEntry } from "./types";

export type LedgerFoldSums = {
  currentWonder: number;
  storedWonder: number;
  parts: number;
  feather: number;
  scale: number;
  glimmerdust: number;
};

function sumLedgerMaterials(entry: EconomyLedgerEntry): {
  feather: number;
  scale: number;
  glimmerdust: number;
} {
  const materials = entry.deltaMaterials ?? {};
  return {
    feather: materials.feather ?? 0,
    scale: materials.scale ?? 0,
    glimmerdust: materials.glimmerdust ?? 0,
  };
}

export function foldLedgerEntries(entries: EconomyLedgerEntry[]): LedgerFoldSums {
  const sums: LedgerFoldSums = {
    currentWonder: 0,
    storedWonder: 0,
    parts: 0,
    feather: 0,
    scale: 0,
    glimmerdust: 0,
  };

  for (const entry of entries) {
    sums.currentWonder += entry.deltaCurrentWonder ?? 0;
    sums.storedWonder += entry.deltaStoredWonder ?? 0;
    sums.parts += entry.deltaParts ?? 0;
    const materials = sumLedgerMaterials(entry);
    sums.feather += materials.feather;
    sums.scale += materials.scale;
    sums.glimmerdust += materials.glimmerdust;
  }

  return sums;
}

export function computeLifetimeWonderEarned(entries: EconomyLedgerEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    const dc = entry.deltaCurrentWonder ?? 0;
    const ds = entry.deltaStoredWonder ?? 0;
    if (dc > 0) total += dc;
    if (ds > 0) total += ds;
  }
  return total;
}

export type EconomyProjection = {
  currentWonder: number;
  storedWonder: number;
  lifetimeWonderEarned: number;
  totalWonder: number;
  parts: number;
  baitMaterials: { feather: number; scale: number; glimmerdust: number };
};

export function emptyLedgerFoldSums(): LedgerFoldSums {
  return {
    currentWonder: 0,
    storedWonder: 0,
    parts: 0,
    feather: 0,
    scale: 0,
    glimmerdust: 0,
  };
}

export function mergeFoldSums(base: LedgerFoldSums, add: LedgerFoldSums): LedgerFoldSums {
  return {
    currentWonder: base.currentWonder + add.currentWonder,
    storedWonder: base.storedWonder + add.storedWonder,
    parts: base.parts + add.parts,
    feather: base.feather + add.feather,
    scale: base.scale + add.scale,
    glimmerdust: base.glimmerdust + add.glimmerdust,
  };
}

export function projectionFromFoldSums(
  sums: LedgerFoldSums,
  lifetimeWonderEarned: number,
): EconomyProjection {
  return {
    currentWonder: Math.max(0, sums.currentWonder),
    storedWonder: Math.max(0, sums.storedWonder),
    lifetimeWonderEarned: Math.max(0, lifetimeWonderEarned),
    totalWonder: Math.max(0, sums.currentWonder),
    parts: Math.max(0, sums.parts),
    baitMaterials: {
      feather: Math.max(0, sums.feather),
      scale: Math.max(0, sums.scale),
      glimmerdust: Math.max(0, sums.glimmerdust),
    },
  };
}

export function projectionFromLedgerEntries(entries: EconomyLedgerEntry[]): EconomyProjection {
  const sums = foldLedgerEntries(entries);
  const lifetimeWonderEarned = computeLifetimeWonderEarned(entries);
  return projectionFromFoldSums(sums, lifetimeWonderEarned);
}

export function projectionFromCheckpointAndEntries(
  checkpoint: EconomyLedgerCheckpoint | null | undefined,
  tailEntries: EconomyLedgerEntry[],
  pendingEntry?: EconomyLedgerEntry,
): EconomyProjection {
  const entries = [...tailEntries];
  if (pendingEntry) entries.push(pendingEntry);

  const baseSums = checkpoint ? { ...checkpoint.foldSums } : emptyLedgerFoldSums();
  const tailSums = entries.length > 0 ? foldLedgerEntries(entries) : emptyLedgerFoldSums();
  const mergedSums = mergeFoldSums(baseSums, tailSums);

  let lifetimeWonderEarned = checkpoint?.lifetimeWonderEarned ?? 0;
  if (entries.length > 0) {
    lifetimeWonderEarned += computeLifetimeWonderEarned(entries);
  }

  return projectionFromFoldSums(mergedSums, lifetimeWonderEarned);
}

export function sortLedgerEntriesByTimestamp(entries: EconomyLedgerEntry[]): EconomyLedgerEntry[] {
  return [...entries].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.id.localeCompare(b.id);
  });
}

/** Build checkpoint folding all but the last `keepTailEntries` rows (sorted by timestamp). */
export function buildCheckpointFromSortedEntries(
  sortedEntries: EconomyLedgerEntry[],
  keepTailEntries: number,
  compactedBy: EconomyLedgerCheckpoint["compactedBy"],
): EconomyLedgerCheckpoint | null {
  if (sortedEntries.length <= keepTailEntries) return null;

  const prefix = sortedEntries.slice(0, sortedEntries.length - keepTailEntries);
  const lastFolded = prefix[prefix.length - 1];
  if (!lastFolded) return null;

  return {
    schemaVersion: 1,
    foldedThroughTimestamp: lastFolded.timestamp,
    foldedThroughEntryId: lastFolded.id,
    foldedEntryCount: prefix.length,
    foldSums: foldLedgerEntries(prefix),
    lifetimeWonderEarned: computeLifetimeWonderEarned(prefix),
    compactedAt: Date.now(),
    compactedBy,
  };
}
