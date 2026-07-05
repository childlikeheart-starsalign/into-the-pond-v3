"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldLedgerEntries = foldLedgerEntries;
exports.computeLifetimeWonderEarned = computeLifetimeWonderEarned;
exports.emptyLedgerFoldSums = emptyLedgerFoldSums;
exports.mergeFoldSums = mergeFoldSums;
exports.projectionFromFoldSums = projectionFromFoldSums;
exports.projectionFromLedgerEntries = projectionFromLedgerEntries;
exports.projectionFromCheckpointAndEntries = projectionFromCheckpointAndEntries;
exports.sortLedgerEntriesByTimestamp = sortLedgerEntriesByTimestamp;
exports.buildCheckpointFromSortedEntries = buildCheckpointFromSortedEntries;
function sumLedgerMaterials(entry) {
  const materials = entry.deltaMaterials ?? {};
  return {
    feather: materials.feather ?? 0,
    scale: materials.scale ?? 0,
    glimmerdust: materials.glimmerdust ?? 0,
  };
}
function foldLedgerEntries(entries) {
  const sums = {
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
function computeLifetimeWonderEarned(entries) {
  let total = 0;
  for (const entry of entries) {
    const dc = entry.deltaCurrentWonder ?? 0;
    const ds = entry.deltaStoredWonder ?? 0;
    if (dc > 0) total += dc;
    if (ds > 0) total += ds;
  }
  return total;
}
function emptyLedgerFoldSums() {
  return {
    currentWonder: 0,
    storedWonder: 0,
    parts: 0,
    feather: 0,
    scale: 0,
    glimmerdust: 0,
  };
}
function mergeFoldSums(base, add) {
  return {
    currentWonder: base.currentWonder + add.currentWonder,
    storedWonder: base.storedWonder + add.storedWonder,
    parts: base.parts + add.parts,
    feather: base.feather + add.feather,
    scale: base.scale + add.scale,
    glimmerdust: base.glimmerdust + add.glimmerdust,
  };
}
function projectionFromFoldSums(sums, lifetimeWonderEarned) {
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
function projectionFromLedgerEntries(entries) {
  const sums = foldLedgerEntries(entries);
  const lifetimeWonderEarned = computeLifetimeWonderEarned(entries);
  return projectionFromFoldSums(sums, lifetimeWonderEarned);
}
function projectionFromCheckpointAndEntries(checkpoint, tailEntries, pendingEntry) {
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
function sortLedgerEntriesByTimestamp(entries) {
  return [...entries].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.id.localeCompare(b.id);
  });
}
/** Build checkpoint folding all but the last `keepTailEntries` rows (sorted by timestamp). */
function buildCheckpointFromSortedEntries(sortedEntries, keepTailEntries, compactedBy) {
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
