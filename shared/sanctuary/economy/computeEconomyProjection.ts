import { COMPACT_TAIL_HARD_LIMIT, MAX_LEDGER_READS_PER_TX } from "./compactionConstants";
import {
  foldLedgerEntries,
  mergeFoldSums,
  projectionFromCheckpointAndEntries,
  projectionFromLedgerEntries,
  emptyLedgerFoldSums,
  type EconomyProjection,
} from "./foldLedger";
import { EconomyError } from "./types";
import type { EconomyLedgerCheckpoint, EconomyLedgerEntry } from "./types";
import { ECONOMY_LEDGER_CHECKPOINT_DOC_ID } from "./types";

export type { EconomyProjection };

export type EconomyProjectionComputeMeta = {
  tailEntryCount: number;
  usedCheckpoint: boolean;
  totalCommittedEntryCount: number;
};

export type EconomyProjectionComputeResult = {
  projection: EconomyProjection;
  meta: EconomyProjectionComputeMeta;
};

export { MAX_LEDGER_READS_PER_TX, COMPACT_TAIL_HARD_LIMIT } from "./compactionConstants";

function assertSolvencyFromFold(
  sums: ReturnType<typeof foldLedgerEntries>,
  context: Record<string, unknown>,
): void {
  if (sums.currentWonder < 0 || sums.storedWonder < 0 || sums.parts < 0) {
    throw new EconomyError("INSUFFICIENT_WONDER", "Ledger fold would produce negative balances", {
      currentWonder: sums.currentWonder,
      storedWonder: sums.storedWonder,
      parts: sums.parts,
      ...context,
    });
  }
}

export function computeProjectionFromLedgerState(input: {
  checkpoint: EconomyLedgerCheckpoint | null | undefined;
  tailEntries: EconomyLedgerEntry[];
  pendingEntry: EconomyLedgerEntry;
}): EconomyProjectionComputeResult {
  const projection = projectionFromCheckpointAndEntries(
    input.checkpoint,
    input.tailEntries,
    input.pendingEntry,
  );

  const tailWithPending = [...input.tailEntries, input.pendingEntry];
  const baseSums = input.checkpoint ? { ...input.checkpoint.foldSums } : emptyLedgerFoldSums();
  const mergedSums = mergeFoldSums(
    baseSums,
    tailWithPending.length > 0 ? foldLedgerEntries(tailWithPending) : emptyLedgerFoldSums(),
  );
  assertSolvencyFromFold(mergedSums, {
    tailEntryCount: input.tailEntries.length,
    usedCheckpoint: !!input.checkpoint,
  });

  const totalCommittedEntryCount =
    (input.checkpoint?.foldedEntryCount ?? 0) + input.tailEntries.length;

  return {
    projection,
    meta: {
      tailEntryCount: input.tailEntries.length,
      usedCheckpoint: !!input.checkpoint,
      totalCommittedEntryCount,
    },
  };
}

/**
 * Fold committed ledger rows plus the pending entry (not yet visible to collection queries in-tx).
 * Uses checkpoint + tail query when checkpoint exists; otherwise full collection scan.
 */
export async function computeEconomyProjectionInTransaction(
  tx: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  pendingEntry: EconomyLedgerEntry,
): Promise<EconomyProjectionComputeResult> {
  const checkpointRef = userRef
    .collection("economyLedgerCheckpoint")
    .doc(ECONOMY_LEDGER_CHECKPOINT_DOC_ID);
  const checkpointSnap = await tx.get(checkpointRef);
  const checkpoint = checkpointSnap.exists
    ? (checkpointSnap.data() as EconomyLedgerCheckpoint)
    : null;

  if (!checkpoint) {
    const ledgerSnap = await tx.get(userRef.collection("economyLedger"));

    if (ledgerSnap.size >= MAX_LEDGER_READS_PER_TX) {
      throw new EconomyError(
        "LEDGER_READ_LIMIT",
        `User ledger has ${ledgerSnap.size} entries; running totals required before ${MAX_LEDGER_READS_PER_TX}`,
        { ledgerEntryCount: ledgerSnap.size },
      );
    }

    const entries = ledgerSnap.docs.map((doc) => doc.data() as EconomyLedgerEntry);
    entries.push(pendingEntry);

    const sums = foldLedgerEntries(entries);
    assertSolvencyFromFold(sums, { ledgerEntryCount: ledgerSnap.size });

    return {
      projection: projectionFromLedgerEntries(entries),
      meta: {
        tailEntryCount: ledgerSnap.size,
        usedCheckpoint: false,
        totalCommittedEntryCount: ledgerSnap.size,
      },
    };
  }

  const tailSnap = await tx.get(
    userRef
      .collection("economyLedger")
      .where("timestamp", ">", checkpoint.foldedThroughTimestamp)
      .orderBy("timestamp", "asc"),
  );

  if (tailSnap.size >= COMPACT_TAIL_HARD_LIMIT) {
    throw new EconomyError(
      "LEDGER_READ_LIMIT",
      `User ledger tail has ${tailSnap.size} entries; compaction required before ${COMPACT_TAIL_HARD_LIMIT}`,
      { tailEntryCount: tailSnap.size, foldedEntryCount: checkpoint.foldedEntryCount },
    );
  }

  const tailEntries = tailSnap.docs.map((doc) => doc.data() as EconomyLedgerEntry);
  return computeProjectionFromLedgerState({ checkpoint, tailEntries, pendingEntry });
}
