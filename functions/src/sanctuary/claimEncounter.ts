import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

import { db } from "../init";
import { applyFishingClaimInTransaction } from "./applyFishingClaim";
import { CREATURE_REFS } from "./creatureCatalog";
import { resolveFishingClaimFromContext } from "./buildFishingClaimContext";
import { toClientClaimSummary } from "./fishingClaimPresentation";
import { fishingClaimKey, ledgerEntryIdForKey } from "./economy";
import { readIdempotencyInTransaction } from "./economy/resolveCallableIdempotency";
import { applyOperationalCounterResetsInTransaction } from "./dailyCounters";
import type { FishingClaim } from "./types";

export type UserClaimEconomyDoc = {
  totalWonder?: number;
  currentWonder?: number;
  storedWonder?: number;
  lifetimeWonderEarned?: number;
  lastFishingResetDate?: Timestamp;
  lastClaimedCastId?: string;
  activeCast?: {
    castId?: string;
    readyTimestamp?: Timestamp;
    rodType?: string;
    baitUsed?: string;
  } | null;
  inventory?: {
    parts?: number;
    baits?: Record<string, number>;
    baitMaterials?: Record<string, number>;
  };
};

export type ClaimSummary = ReturnType<typeof toClientClaimSummary>;

/** Deterministic fishingClaims doc id per cast (Invariant 8). */
export function fishingClaimDocId(castId: string): string {
  return `claim_${castId}`;
}

/** Server-authoritative castId — never from client payload. */
export function resolveClaimCastId(data: UserClaimEconomyDoc): string | null {
  if (data.activeCast?.castId) return data.activeCast.castId;
  if (data.lastClaimedCastId) return data.lastClaimedCastId;
  return null;
}

function normalizeStoredClaim(raw: Record<string, unknown>): FishingClaim {
  const claimedAt = raw.claimedAt;
  const claimedAtMs =
    claimedAt && typeof claimedAt === "object" && "toMillis" in claimedAt
      ? (claimedAt as Timestamp).toMillis()
      : typeof claimedAt === "number"
        ? claimedAt
        : Date.now();

  return {
    id: String(raw.id ?? ""),
    encounterId: String(raw.encounterId ?? raw.castId ?? ""),
    userId: String(raw.userId ?? ""),
    claimedAt: claimedAtMs,
    currentWonderAtClaim: Number(raw.currentWonderAtClaim ?? 0),
    outcome: raw.outcome as FishingClaim["outcome"],
    creatureTypeId: raw.creatureTypeId as string | undefined,
    creatureDisplayName: raw.creatureDisplayName as string | undefined,
    poolTier: raw.poolTier as FishingClaim["poolTier"],
    rarityIndicator: raw.rarityIndicator as FishingClaim["rarityIndicator"],
    wonderAwarded: Number(raw.wonderAwarded ?? 0),
    materialsAwarded: Number(raw.materialsAwarded ?? 0),
    spiritMessage: raw.spiritMessage as string | undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
  };
}

async function loadCachedClaimSummaryFromLedger(
  tx: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  castId: string,
): Promise<ClaimSummary | null> {
  const ledgerRef = userRef
    .collection("economyLedger")
    .doc(ledgerEntryIdForKey(fishingClaimKey(castId)));
  const ledgerSnap = await tx.get(ledgerRef);
  if (!ledgerSnap.exists) return null;

  const claimRef = userRef.collection("fishingClaims").doc(fishingClaimDocId(castId));
  const claimSnap = await tx.get(claimRef);
  if (!claimSnap.exists) return null;

  logger.warn(
    "Fishing claim idempotency miss but ledger + fishingClaims exist — returning stored claim",
    {
      castId,
      ledgerEntryId: ledgerRef.id,
    },
  );

  return toClientClaimSummary(normalizeStoredClaim(claimSnap.data() as Record<string, unknown>));
}

function assertActiveCastReadyForClaim(
  cast: NonNullable<UserClaimEconomyDoc["activeCast"]>,
  castId: string,
): void {
  if (!cast.castId || !cast.readyTimestamp) {
    throw new HttpsError("failed-precondition", "No active cast to claim");
  }
  if (cast.castId !== castId) {
    throw new HttpsError("failed-precondition", "Active cast does not match claim target");
  }
  if (cast.readyTimestamp.toMillis() > Date.now()) {
    throw new HttpsError("failed-precondition", "Cast is not ready yet");
  }
}

export async function executeClaimCastInTransaction(
  tx: FirebaseFirestore.Transaction,
  uid: string,
  userRef: FirebaseFirestore.DocumentReference,
): Promise<{ claimSummary: ClaimSummary }> {
  const userSnap = await tx.get(userRef);
  const data = (userSnap.data() ?? {}) as UserClaimEconomyDoc;

  applyOperationalCounterResetsInTransaction(tx, userRef, data as Record<string, unknown>);

  const castId = resolveClaimCastId(data);
  if (!castId) {
    throw new HttpsError("failed-precondition", "No active cast to claim");
  }

  const idempotencyKey = fishingClaimKey(castId);
  const idemRead = await readIdempotencyInTransaction<ClaimSummary>(tx, userRef, idempotencyKey);

  if (idemRead.hit) {
    return { claimSummary: idemRead.response };
  }

  const cast = data.activeCast;
  if (!cast?.castId || !cast.readyTimestamp) {
    const ledgerCached = await loadCachedClaimSummaryFromLedger(tx, userRef, castId);
    if (ledgerCached) {
      return { claimSummary: ledgerCached };
    }
    throw new HttpsError("failed-precondition", "No active cast to claim");
  }

  assertActiveCastReadyForClaim(cast, castId);

  const creaturesSnap = await tx.get(userRef.collection("creatures"));
  const caughtIds = new Set(creaturesSnap.docs.map((doc) => doc.id));
  const currentWonderAtClaim = data.currentWonder ?? data.totalWonder ?? 0;

  const claim = resolveFishingClaimFromContext({
    claimId: fishingClaimDocId(castId),
    encounterId: castId,
    userId: uid,
    castId,
    rodUiId: cast.rodType ?? "basic",
    baitUiId: cast.baitUsed ?? "random_bait",
    currentWonderAtClaim,
    caughtIds,
    creatureCatalog: CREATURE_REFS,
  });

  const claimSummary = await applyFishingClaimInTransaction(tx, {
    uid,
    userRef,
    data,
    claim,
    rodUiId: cast.rodType ?? "basic",
    castId,
    idempotencyMiss: { hit: false },
  });

  return { claimSummary };
}

export async function executeClaimCast(
  uid: string,
  userRef: FirebaseFirestore.DocumentReference,
): Promise<{ claimSummary: ClaimSummary }> {
  return db.runTransaction((tx) => executeClaimCastInTransaction(tx, uid, userRef));
}
