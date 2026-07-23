import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { onAuthStateChanged } from "firebase/auth";

import type { FishingRodId } from "@/shared/sanctuary/types";
import {
  EPIC_ELEMENT_ROD_IDS,
  getCraftCost,
  getCraftDurationMs,
  isCraftTimerComplete,
  PHASE1_CRAFTABLE_RARE_ROD_IDS,
  statusLineForRodState,
  uxLabelForRodState,
  WILDCARD_ROD_ID,
} from "@/shared/sanctuary/progression";
import { collectCraft, equipRod, startCraft } from "@/src/services/firebase/serverActions";
import { useFishingCraftSounds } from "@/src/features/fishing/useFishingCraftSounds";
import {
  craftBenchCarouselRodIds,
  craftBenchNeedsAttention,
  hasEpicCatalog,
  rodsReadyToCollect,
  type CraftBenchCatalogTier,
} from "@/src/features/craftBench/craftBenchCatalog";
import {
  didCollectThisBenchSession,
  markCollectedThisBenchSession,
} from "@/src/services/analytics/analyticsSession";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  applyOptimisticEconomyPatch,
  applyOptimisticRodPatch,
  clearPendingRod,
  getRodProgressionState,
  isRodProgressionPending,
  rollbackOptimisticRod,
  subscribeRodProgression as subscribeStore,
} from "@/src/state/rodProgressionStore";

export type RodSummary = ReturnType<ReturnType<typeof useRodProgression>["selectedRodSummary"]>;

/**
 * Reads the optimistic rod progression cache only.
 * Firestore sync is started once at app root via `useRodProgressionSync`.
 */
export function useRodProgression() {
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const state = useSyncExternalStore(
    subscribeStore,
    getRodProgressionState,
    getRodProgressionState,
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  const fishingSounds = useFishingCraftSounds();

  const selectedRodSummary = useCallback(
    (rodId: FishingRodId) => {
      const record = state.playerRods[rodId];
      const cost = getCraftCost(rodId);
      const rodState = record?.state ?? "locked";
      const isWildcardGift =
        rodId === WILDCARD_ROD_ID &&
        record?.giftSource === "journey_gift" &&
        (rodState === "ready" || rodState === "equipped");
      const timerComplete =
        rodState === "crafting" && isCraftTimerComplete(rodId, record?.craftStartedAt ?? null);
      const isPending = isRodProgressionPending(rodId);

      return {
        rodId,
        state: rodState,
        uxLabel: uxLabelForRodState(rodState, { wildcardGift: isWildcardGift }),
        statusLine: statusLineForRodState(rodState, { wildcardGift: isWildcardGift }),
        partsCurrent: state.parts,
        partsRequired: cost.parts,
        wonderCurrent: state.storedWonder,
        wonderRequired: cost.storedWonder,
        partsGap: Math.max(0, cost.parts - state.parts),
        wonderGap: Math.max(0, cost.storedWonder - state.storedWonder),
        canBegin: rodId !== WILDCARD_ROD_ID && rodState === "craftable" && !isPending,
        canCollectTimer: rodId !== WILDCARD_ROD_ID && timerComplete,
        canEquip: rodState === "ready",
        craftCompletesAt:
          record?.craftStartedAt != null ? record.craftStartedAt + getCraftDurationMs(rodId) : null,
        isPending,
        isWildcardGift,
      };
    },
    [state],
  );

  const optimisticStartCraft = useCallback(
    async (rodId: FishingRodId) => {
      if (!uid) throw new Error("Sign in required");
      const cost = getCraftCost(rodId);
      const now = Date.now();
      applyOptimisticRodPatch(rodId, {
        state: "crafting",
        craftStartedAt: now,
        wonderInvested: cost.storedWonder,
        partsSpentOnCraft: cost.parts,
      });
      applyOptimisticEconomyPatch({
        parts: state.parts - cost.parts,
        storedWonder: state.storedWonder - cost.storedWonder,
      });

      try {
        const result = await startCraft(uid, rodId);
        clearPendingRod(rodId);
        fishingSounds.play("craftBegin");
        return result;
      } catch (error) {
        rollbackOptimisticRod(rodId);
        throw error;
      }
    },
    [fishingSounds, state.parts, state.storedWonder, uid],
  );

  const optimisticCollectCraft = useCallback(
    async (rodId: FishingRodId) => {
      if (!uid) throw new Error("Sign in required");
      markCollectedThisBenchSession();
      applyOptimisticRodPatch(rodId, { state: "ready", craftCompletedAt: Date.now() });
      try {
        const result = await collectCraft(uid, rodId);
        clearPendingRod(rodId);
        fishingSounds.play("craftReady");
        return result;
      } catch (error) {
        rollbackOptimisticRod(rodId);
        throw error;
      }
    },
    [fishingSounds, uid],
  );

  const optimisticEquipRod = useCallback(
    async (rodId: FishingRodId) => {
      if (!uid) throw new Error("Sign in required");
      applyOptimisticRodPatch(rodId, { state: "equipped" });
      try {
        const result = await equipRod(uid, rodId, {
          collectedThisBenchSession: didCollectThisBenchSession(),
        });
        clearPendingRod(rodId);
        fishingSounds.play("craftEquip");
        return result;
      } catch (error) {
        rollbackOptimisticRod(rodId);
        throw error;
      }
    },
    [fishingSounds, uid],
  );

  const carouselRodIds = useCallback(
    (tier: CraftBenchCatalogTier) => craftBenchCarouselRodIds(tier, state.playerRods),
    [state.playerRods],
  );

  const rareRods = useMemo(
    () => carouselRodIds("rare").map((rodId) => selectedRodSummary(rodId)),
    [carouselRodIds, selectedRodSummary],
  );

  const epicRods = useMemo(
    () => carouselRodIds("epic").map((rodId) => selectedRodSummary(rodId)),
    [carouselRodIds, selectedRodSummary],
  );

  return {
    ...state,
    uid,
    rareRods,
    epicRods,
    showEpicCatalog: hasEpicCatalog(state.playerRods),
    rodsReadyToCollect: rodsReadyToCollect(state.playerRods),
    craftBenchNeedsAttention: craftBenchNeedsAttention(state.playerRods),
    equippedRodId: state.equippedRodId,
    selectedRodSummary,
    carouselRodIds,
    optimisticStartCraft,
    optimisticCollectCraft,
    optimisticEquipRod,
    isPending: isRodProgressionPending,
  };
}

export { PHASE1_CRAFTABLE_RARE_ROD_IDS, EPIC_ELEMENT_ROD_IDS, WILDCARD_ROD_ID };
