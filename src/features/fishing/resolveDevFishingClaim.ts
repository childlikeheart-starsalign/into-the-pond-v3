/**
 * DEV preview only — resolves fishing claim outcome for UI modal.
 * INVARIANT 2: Never writes economy state to Firestore (preview-only, zero persistence).
 * Optional Firestore reads for wonder/creatures are display-only fallbacks to WMDB.
 */
import { Q } from "@nozbe/watermelondb";
import { collection, getDocs } from "firebase/firestore";

import { database } from "@/src/db";
import { LocalCreature } from "@/src/db/models/LocalCreature";
import { LocalUserProfile } from "@/src/db/models/LocalUserProfile";
import { CREATURE_REFS } from "@/src/domain/sanctuary/creatureCatalog";
import type {
  ServerClaimSummary,
  ServerFishingCast,
} from "@/src/features/fishing/fishingServerCast";
import { getUserProgress } from "@/src/services/firebase/progress";
import { firestore } from "@/src/services/firebase/client";
import { resolveFishingClaimFromContext, toClientClaimSummary } from "../../../shared/sanctuary";

async function loadCurrentWonderForPreview(uid: string): Promise<number> {
  try {
    const userDoc = await getUserProgress(uid);
    if (userDoc) {
      return userDoc.currentWonder ?? userDoc.totalWonder ?? 0;
    }
  } catch (error) {
    console.warn("[Fishing] DEV preview could not read Firestore wonder", error);
  }

  try {
    const rows = await database
      .get<LocalUserProfile>("local_user_profile")
      .query(Q.where("uid", uid))
      .fetch();
    const profile = rows[0];
    if (profile?.currentWonder != null) {
      return profile.currentWonder;
    }
  } catch (error) {
    console.warn("[Fishing] DEV preview could not read local wonder", error);
  }

  return 0;
}

async function loadCaughtIdsForPreview(uid: string): Promise<Set<string>> {
  try {
    const snap = await getDocs(collection(firestore, "users", uid, "creatures"));
    return new Set(snap.docs.map((doc) => doc.id));
  } catch (error) {
    console.warn("[Fishing] DEV preview could not read Firestore creatures", error);
  }

  try {
    const rows = await database
      .get<LocalCreature>("local_creatures")
      .query(Q.where("uid", uid))
      .fetch();
    return new Set(rows.map((row) => row.creatureId));
  } catch (error) {
    console.warn("[Fishing] DEV preview could not read local creatures", error);
    return new Set();
  }
}

/** DEV preview only — resolve + modal. Zero persistence. */
export async function resolveDevFishingClaim(
  uid: string,
  cast: ServerFishingCast,
): Promise<ServerClaimSummary> {
  console.warn("[Fishing] DEV preview — outcome not persisted. Deploy functions for real claims.");

  const currentWonderAtClaim = await loadCurrentWonderForPreview(uid);
  const caughtIds = await loadCaughtIdsForPreview(uid);

  const claim = resolveFishingClaimFromContext({
    claimId: `dev_claim_${Date.now()}`,
    encounterId: cast.castId,
    userId: uid,
    castId: cast.castId,
    rodUiId: cast.rodIdAtCast,
    baitUiId: cast.baitIdAtCast,
    currentWonderAtClaim,
    caughtIds,
    creatureCatalog: CREATURE_REFS,
  });

  return {
    ...toClientClaimSummary(claim),
    previewOnly: true,
  };
}
