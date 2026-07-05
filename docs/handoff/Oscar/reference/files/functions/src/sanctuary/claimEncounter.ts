import { Timestamp } from "firebase-admin/firestore";

import { CREATURE_REFS } from "./creatureCatalog";
import { resolveFishingClaim, toClientClaimSummary } from "./encounterEngine";
import { filterCreaturesByRodPermission } from "./progression/fishingPermissionService";
import { rodTypeKeyForId, uiBaitIdToTier, uiRodIdToDomain } from "./rodCatalog";
import type { BaitTier, FishingRodId } from "./types";
import { applyWonderEarn } from "./wonderLedger";
import { persistWonderTransaction, wonderAccountFromDoc, wonderFieldsPatch } from "./wonderEconomy";

type UserEconomyDoc = {
  totalWonder?: number;
  currentWonder?: number;
  storedWonder?: number;
  lifetimeWonderEarned?: number;
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

function baitTierFromCast(baitUsed?: string): BaitTier | null {
  return uiBaitIdToTier(baitUsed ?? "");
}

export async function executeClaimCast(
  uid: string,
  userRef: FirebaseFirestore.DocumentReference,
  data: UserEconomyDoc,
): Promise<{
  claimSummary: ReturnType<typeof toClientClaimSummary>;
  patch: Record<string, unknown>;
}> {
  const cast = data.activeCast;
  if (!cast?.readyTimestamp || cast.readyTimestamp.toMillis() > Date.now()) {
    throw new Error("Cast is not ready yet");
  }

  const account = wonderAccountFromDoc(uid, data);
  const creaturesSnap = await userRef.collection("creatures").get();
  const caughtIds = new Set(creaturesSnap.docs.map((d) => d.id));

  const rodId = uiRodIdToDomain(cast.rodType ?? "basic") as FishingRodId;
  const baitTier = baitTierFromCast(cast.baitUsed);
  const filteredCatalog = filterCreaturesByRodPermission(rodId, CREATURE_REFS);

  const claim = resolveFishingClaim({
    claimId: `claim_${Date.now()}`,
    encounterId: cast.castId ?? `enc_${Date.now()}`,
    userId: uid,
    castId: cast.castId ?? `cast_${Date.now()}`,
    rodId,
    baitTier,
    currentWonderAtClaim: account.currentWonder,
    caughtIds,
    creatureCatalog: filteredCatalog,
  });

  let nextAccount = account;
  if (claim.wonderAwarded > 0) {
    const source =
      claim.outcome === "duplicate" ? "fishing_duplicate_consolation" : "fishing_miss_consolation";
    const result = applyWonderEarn({
      account,
      source,
      amount: claim.wonderAwarded,
      transactionId: `tx_${claim.id}`,
      metadata: { claimId: claim.id },
    });
    nextAccount = result.account;
    await persistWonderTransaction(userRef, result.transaction);
  }

  const materials = claim.materialsAwarded;
  const inventory = data.inventory ?? {};
  const baitMaterials = {
    ...(inventory.baitMaterials ?? { feather: 0, scale: 0, glimmerdust: 0 }),
  };
  baitMaterials.feather = (baitMaterials.feather ?? 0) + materials;

  const patch: Record<string, unknown> = {
    activeCast: null,
    ...wonderFieldsPatch(nextAccount),
    inventory: {
      ...inventory,
      parts: inventory.parts ?? 0,
      baitMaterials,
    },
  };

  if (claim.outcome === "catch" && claim.creatureTypeId) {
    await userRef
      .collection("creatures")
      .doc(claim.creatureTypeId)
      .set({
        creatureId: claim.creatureTypeId,
        name: claim.creatureDisplayName ?? claim.creatureTypeId,
        rarity:
          claim.poolTier === "common" ? "basic" : claim.poolTier === "rare" ? "rare" : "legendary",
        caughtAt: Timestamp.now(),
        rodRequired: rodTypeKeyForId(rodId),
      });
  }

  await userRef
    .collection("fishingClaims")
    .doc(claim.id)
    .set({
      ...claim,
      claimedAt: Timestamp.fromMillis(claim.claimedAt),
    });

  await userRef.collection("sanctuaryAnalytics").add({
    type: "fishing_claim",
    userId: uid,
    outcome: claim.outcome,
    rarityIndicator: claim.rarityIndicator,
    timestamp: Date.now(),
  });

  return { claimSummary: toClientClaimSummary(claim), patch };
}
