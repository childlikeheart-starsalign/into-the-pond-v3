import { Timestamp } from "firebase-admin/firestore";

import { commitEconomyAction } from "./economy/commitEconomyAction";
import { applyWonderEarnInMemory, buildEconomyLedgerEntry, fishingClaimKey } from "./economy";
import type {
  FishingClaim,
  FishingPityState,
  FishingRodId,
  WonderAccount,
  WonderSource,
  WonderTransaction,
} from "./types";
import { rodTypeKeyForId, uiRodIdToDomain } from "./rodCatalog";
import { toClientClaimSummary } from "./fishingClaimPresentation";
import { DAILY_FISHING_WONDER_CAP } from "./wonderRules";

type UserEconomyDoc = {
  totalWonder?: number;
  currentWonder?: number;
  storedWonder?: number;
  lifetimeWonderEarned?: number;
  fishingWonderToday?: number;
  inventory?: {
    parts?: number;
    baits?: Record<string, number>;
    baitMaterials?: Record<string, number>;
  };
};

export type ApplyFishingClaimInput = {
  uid: string;
  userRef: FirebaseFirestore.DocumentReference;
  data: UserEconomyDoc;
  claim: FishingClaim;
  rodUiId: string;
  castId: string;
  /** Updated pity counters to persist on users/{uid}. */
  nextFishingPity?: FishingPityState;
  /** When parent already read idempotency in the same tx. */
  idempotencyMiss?: { hit: false };
  /** Daily counter reset fields deferred until the final user write. */
  counterResetPatch?: Record<string, unknown>;
};

function fishingClaimWonderSource(claim: FishingClaim): WonderSource {
  if (claim.outcome === "duplicate") return "fishing_duplicate_consolation";
  if (claim.outcome === "miss") return "fishing_miss_consolation";
  return "fishing_catch";
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function fishingClaimLedgerMetadata(claim: FishingClaim): Record<string, unknown> {
  return omitUndefined({
    claimId: claim.id,
    outcome: claim.outcome,
    creatureTypeId: claim.creatureTypeId,
    duplicate: claim.outcome === "duplicate",
  });
}

function buildFishingClaimLedgerResult(input: {
  uid: string;
  account: WonderAccount;
  claim: FishingClaim;
  castId: string;
  transactionId: string;
  materials: number;
  additionalUserPatch: Record<string, unknown>;
  claimSummary: ReturnType<typeof toClientClaimSummary>;
}) {
  const {
    uid,
    account,
    claim,
    castId,
    transactionId,
    materials,
    additionalUserPatch,
    claimSummary,
  } = input;
  const wonderSource = fishingClaimWonderSource(claim);
  const idempotencyKey = fishingClaimKey(castId);
  const metadata = fishingClaimLedgerMetadata(claim);

  if (claim.wonderAwarded > 0) {
    const { transaction } = applyWonderEarnInMemory(account, {
      source: wonderSource,
      amount: claim.wonderAwarded,
      transactionId,
      metadata,
    });

    const entry = buildEconomyLedgerEntry({
      uid,
      actionType: "fishing_claim",
      source: wonderSource,
      transaction,
      idempotencyKey,
      correlationId: castId,
      metadata,
      deltaMaterials: { feather: materials },
    });

    return {
      entry,
      additionalUserPatch,
      response: claimSummary,
    };
  }

  const transaction: WonderTransaction = {
    id: transactionId,
    userId: uid,
    timestamp: Date.now(),
    source: wonderSource,
    amount: 0,
    metadata: {},
  };

  const entry = buildEconomyLedgerEntry({
    uid,
    actionType: "fishing_claim",
    source: wonderSource,
    transaction,
    idempotencyKey,
    correlationId: castId,
    metadata,
    deltaMaterials: { feather: materials },
  });

  return {
    entry,
    additionalUserPatch,
    response: claimSummary,
  };
}

/** Persistence only — no probability logic. Ledger commit is the causal anchor (Invariant 4). */
export async function applyFishingClaimInTransaction(
  tx: FirebaseFirestore.Transaction,
  input: ApplyFishingClaimInput,
): Promise<ReturnType<typeof toClientClaimSummary>> {
  const {
    uid,
    userRef,
    data,
    claim,
    rodUiId,
    castId,
    nextFishingPity,
    idempotencyMiss,
    counterResetPatch,
  } = input;
  const rodId = uiRodIdToDomain(rodUiId) as FishingRodId;
  const idempotencyKey = fishingClaimKey(castId);
  const transactionId = `tx_${claim.id}`;

  const materials = claim.materialsAwarded;

  const fishingWonderToday = data.fishingWonderToday ?? 0;
  const remainingCap = Math.max(0, DAILY_FISHING_WONDER_CAP - fishingWonderToday);
  const effectiveWonderAwarded = Math.min(claim.wonderAwarded, remainingCap);
  const cappedClaim = { ...claim, wonderAwarded: effectiveWonderAwarded };

  const additionalUserPatch: Record<string, unknown> = {
    ...(counterResetPatch ?? {}),
    activeCast: null,
    lastClaimedCastId: castId,
    fishingWonderToday: fishingWonderToday + effectiveWonderAwarded,
    ...(nextFishingPity ? { fishingPity: nextFishingPity } : {}),
  };

  const claimSummary = {
    ...toClientClaimSummary(claim),
    wonderAwarded: effectiveWonderAwarded,
  };

  const economyCommit = await commitEconomyAction({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "fishing_claim",
    touchReflection: false,
    idempotencyMiss,
    build: ({ account }) =>
      buildFishingClaimLedgerResult({
        uid,
        account,
        claim: cappedClaim,
        castId,
        transactionId,
        materials,
        additionalUserPatch,
        claimSummary,
      }),
  });

  if (economyCommit.committed) {
    if (claim.outcome === "catch" && claim.creatureTypeId) {
      tx.set(userRef.collection("creatures").doc(claim.creatureTypeId), {
        creatureId: claim.creatureTypeId,
        name: claim.creatureDisplayName ?? claim.creatureTypeId,
        rarity:
          claim.poolTier === "common" ? "basic" : claim.poolTier === "rare" ? "rare" : "legendary",
        caughtAt: Timestamp.now(),
        rodRequired: rodTypeKeyForId(rodId),
      });
    }

    tx.set(userRef.collection("fishingClaims").doc(claim.id), {
      ...omitUndefined(claim as unknown as Record<string, unknown>),
      claimedAt: Timestamp.fromMillis(claim.claimedAt),
    });

    const analyticsRef = userRef.collection("sanctuaryAnalytics").doc();
    tx.set(analyticsRef, {
      type: "fishing_claim",
      userId: uid,
      outcome: claim.outcome,
      duplicate: claim.outcome === "duplicate",
      rarityIndicator: claim.rarityIndicator,
      timestamp: Date.now(),
    });
  }

  return economyCommit.result;
}
