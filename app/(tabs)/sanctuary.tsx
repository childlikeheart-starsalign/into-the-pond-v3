import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, View } from "react-native";

import { SanctuaryFieldNote, SanctuaryScreen } from "@/src/components/sanctuary";
import {
  SANCTUARY_TIME_OF_DAY_ORDER,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { spacing } from "@/src/constants/theme";
import { canCreateNextChild } from "@/shared/childProfile/tierAccess";
import { ChildSwitcherModal } from "@/src/features/childProfile/ChildSwitcherModal";
import { useChildProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import { useActiveChild } from "@/src/features/childProfile/useActiveChild";
import { useActiveCastContext } from "@/src/features/fishing/ActiveCastContext";
import { CatalogRarityRing } from "@/src/features/fishing/CatalogRarityRing";
import {
  claimPresentationId,
  shouldPlayRingForPresentation,
  shouldShowCatalogRarityRingOverlay,
} from "@/src/features/fishing/claimCeremony";
import { buildClaimCelebrationCopy } from "@/src/features/fishing/claimCelebrationCopy";
import { ClaimCelebrationCard } from "@/src/features/fishing/ClaimCelebrationCard";
import { FISHING_ERROR_FIELD_NOTE_HEADING } from "@/src/features/fishing/fishingErrorCopy";
import { FishingModal } from "@/src/features/fishing/FishingModal";
import {
  CLAIM_THRESHOLD_SCRIM,
  claimHasCreature,
  outcomeToDisplayTier,
  pondRippleCeremonyKey,
  type PondRippleActiveTier,
} from "@/src/features/fishing/pondRippleCatalog";
import { useFishingCraftSounds } from "@/src/features/fishing/useFishingCraftSounds";
import { getUnseenBloom, markBloomArrivalSeen } from "@/src/features/sanctuary/cultivationStorage";
import { syncDevPreviewWonderFromWellState } from "@/src/features/well/wellDevPreview";
import { useEveningPondSuppression } from "@/src/hooks/useEveningPondSuppression";
import { useRodProgression } from "@/src/hooks/useRodProgression";
import { useSanctuaryCultivation } from "@/src/hooks/useSanctuaryCultivation";
import { useSanctuaryHeaderData } from "@/src/hooks/useSanctuaryHeaderData";
import { useSanctuarySceneReady } from "@/src/hooks/useSanctuarySceneReady";
import { useWellQuestion } from "@/src/hooks/useWellQuestion";
import { routes } from "@/src/navigation/routes";
import { noteCastDuringCraftBenchSession } from "@/src/services/analytics/analyticsSession";
import { trackSanctuaryArrived } from "@/src/services/analytics/authFunnel";
import {
  trackClaimCelebrationDismissed,
  trackFishingClaimResolved,
  trackPondRippleComplete,
} from "@/src/services/analytics/fishingClaimEvents";
import { stopSanctuaryFirstRevealTheme } from "@/src/services/audio/sanctuaryThemeSound";
import { subscribeToAuthState } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  DEFAULT_SUBSCRIPTION_STATE,
  subscribeToUserSubscription,
  toDerivedSubscriptionState,
} from "@/src/services/firebase/entitlements";
import { isSanctuaryInitialized } from "@/src/state/authInitStore";
import {
  getPendingArrivalBloomId,
  setPendingArrivalBloomId,
  setSanctuaryCultivationState,
} from "@/src/state/sanctuaryCultivation";
import { setSanctuaryTimeOfDay } from "@/src/state/sanctuaryTimeOfDay";

/** Garden — asset-driven sanctuary with time-of-day backgrounds and pose-cycling avatar. */
export default function SanctuaryTabScreen() {
  const [timeOfDay, setTimeOfDay] = useState<SanctuaryTimeOfDay>("afternoon");
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const [fishingOpen, setFishingOpen] = useState(false);
  const [claimRevealReady, setClaimRevealReady] = useState(false);
  const [subscription, setSubscription] = useState(() =>
    toDerivedSubscriptionState(DEFAULT_SUBSCRIPTION_STATE),
  );
  const lastRingCompletedPresentationIdRef = useRef<string | null>(null);
  const claimCeremonyPresentedRef = useRef<string | null>(null);
  const ceremonyInFlightRef = useRef(false);
  const claimResolvedAtRef = useRef<number | null>(null);
  /** Claim-time subscription snapshot — set once per claim, cleared on dismiss. */
  const claimSubscriptionSnapshotRef = useRef<PondRippleActiveTier | null>(null);
  const [arrivalBloomId, setArrivalBloomId] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { cultivation, reload } = useSanctuaryCultivation();
  const header = useSanctuaryHeaderData();
  const activeChild = useActiveChild();
  const { createChildProfileUi, newOnboardingEnabled } = useChildProfileFeatureFlags();
  const switcherUiEnabled = createChildProfileUi || newOnboardingEnabled;
  const well = useWellQuestion(Boolean(uid), activeChild.childAwareId);
  const { craftBenchNeedsAttention } = useRodProgression();
  const { reportLayerLoad, curtainLiftActive, sanctuaryRevealOpacity } = useSanctuarySceneReady();
  const fishingSounds = useFishingCraftSounds();
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const wrapperOpacity =
    curtainLiftActive && sanctuaryRevealOpacity ? sanctuaryRevealOpacity : screenOpacity;

  const {
    cast,
    active: isCasting,
    ready: castReady,
    canRecall,
    castingLabel,
    completedClaim,
    completedClaimCastId,
    castError,
    startCast,
    cancelCast,
    clearCompletedClaim,
    clearCastError,
    dismissCastError,
  } = useActiveCastContext();

  if (completedClaim && claimSubscriptionSnapshotRef.current == null) {
    claimSubscriptionSnapshotRef.current = subscription.activeTier as PondRippleActiveTier;
  }
  if (!completedClaim) {
    claimSubscriptionSnapshotRef.current = null;
  }
  const claimSubscriptionSnapshot = claimSubscriptionSnapshotRef.current;

  const shownFieldNoteKeysRef = useRef(new Set<string>());
  const presentingFieldNoteRef = useRef<string | null>(null);
  const [fieldNoteBody, setFieldNoteBody] = useState<string | null>(null);
  const fieldNoteOpacity = useRef(new Animated.Value(1)).current;

  const canPresentClaimCeremony = completedClaim != null && !curtainLiftActive;

  useEffect(() => {
    if (fishingOpen) {
      // Modal owns the field note while open — never show both.
      // Burn the key so the same error does not replay on sanctuary after close.
      if (castError) {
        shownFieldNoteKeysRef.current.add(`${cast?.castId ?? "none"}:${castError}`);
      }
      presentingFieldNoteRef.current = null;
      setFieldNoteBody(null);
      return;
    }

    if (!castError) return;

    const errorKey = `${cast?.castId ?? "none"}:${castError}`;
    if (shownFieldNoteKeysRef.current.has(errorKey)) {
      dismissCastError();
      return;
    }
    if (presentingFieldNoteRef.current === castError) return;

    presentingFieldNoteRef.current = castError;
    setFieldNoteBody(castError);
    fieldNoteOpacity.setValue(1);

    let cancelled = false;
    const holdTimer = setTimeout(() => {
      Animated.timing(fieldNoteOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (cancelled || !finished) return;
        shownFieldNoteKeysRef.current.add(errorKey);
        presentingFieldNoteRef.current = null;
        setFieldNoteBody(null);
        dismissCastError();
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(holdTimer);
      // Allow a remount (e.g. Strict Mode) to restart if we never finished.
      if (!shownFieldNoteKeysRef.current.has(errorKey)) {
        presentingFieldNoteRef.current = null;
      }
    };
  }, [cast?.castId, castError, dismissCastError, fieldNoteOpacity, fishingOpen]);

  const handleFieldNotePress = useCallback(() => {
    if (fieldNoteBody) {
      shownFieldNoteKeysRef.current.add(`${cast?.castId ?? "none"}:${fieldNoteBody}`);
    }
    presentingFieldNoteRef.current = null;
    fieldNoteOpacity.stopAnimation();
    setFieldNoteBody(null);
    clearCastError();
  }, [cast?.castId, clearCastError, fieldNoteBody, fieldNoteOpacity]);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) {
      setSubscription(toDerivedSubscriptionState(DEFAULT_SUBSCRIPTION_STATE));
      return;
    }
    return subscribeToUserSubscription(uid, setSubscription);
  }, [uid]);

  useEffect(() => {
    setSanctuaryTimeOfDay(timeOfDay);
  }, [timeOfDay]);

  useEffect(() => {
    if (!completedClaim) {
      setClaimRevealReady(false);
      ceremonyInFlightRef.current = false;
      claimResolvedAtRef.current = null;
      return;
    }
    if (!canPresentClaimCeremony) return;

    const presentationId = claimPresentationId({
      castId: completedClaimCastId,
      claimedAt: completedClaim.claimedAt,
    });
    if (!presentationId) {
      setClaimRevealReady(true);
      ceremonyInFlightRef.current = false;
      return;
    }

    if (claimCeremonyPresentedRef.current !== presentationId) {
      claimCeremonyPresentedRef.current = presentationId;
      console.log("[Fishing] claim", completedClaim.outcome, completedClaim.creatureTypeId);
      void stopSanctuaryFirstRevealTheme();
      fishingSounds.stopAmbient();
      fishingSounds.playClaimOutcome(completedClaim);
      claimResolvedAtRef.current = Date.now();
      trackFishingClaimResolved({
        outcome: completedClaim.outcome,
        rarityIndicator: completedClaim.rarityIndicator,
        creatureTypeId: completedClaim.creatureTypeId,
        ringUiEnabled: true,
        castId: completedClaimCastId ?? undefined,
      });
    }

    if (
      !shouldPlayRingForPresentation(presentationId, lastRingCompletedPresentationIdRef.current)
    ) {
      setClaimRevealReady(true);
      ceremonyInFlightRef.current = false;
      return;
    }
    ceremonyInFlightRef.current = true;
    setClaimRevealReady(false);
  }, [canPresentClaimCeremony, completedClaim, completedClaimCastId, fishingSounds]);

  const handlePondRippleComplete = useCallback(() => {
    if (completedClaim) {
      const presentationId = claimPresentationId({
        castId: completedClaimCastId,
        claimedAt: completedClaim.claimedAt,
      });
      if (presentationId) lastRingCompletedPresentationIdRef.current = presentationId;
      const tierSnapshot =
        claimSubscriptionSnapshot ?? (subscription.activeTier as PondRippleActiveTier);
      trackPondRippleComplete({
        caughtTier: outcomeToDisplayTier(completedClaim),
        subscriptionTier: tierSnapshot,
        ringUiEnabled: true,
      });
    }
    ceremonyInFlightRef.current = false;
    setClaimRevealReady(true);
  }, [claimSubscriptionSnapshot, completedClaim, completedClaimCastId, subscription.activeTier]);

  const handleClaimCelebrationContinue = useCallback(() => {
    if (completedClaim) {
      const resolvedAt = claimResolvedAtRef.current;
      trackClaimCelebrationDismissed({
        outcome: completedClaim.outcome,
        ringUiEnabled: true,
        dwellMs: resolvedAt != null ? Date.now() - resolvedAt : undefined,
      });
    }
    claimCeremonyPresentedRef.current = null;
    clearCompletedClaim();
  }, [clearCompletedClaim, completedClaim]);

  const showRingOverlay = shouldShowCatalogRarityRingOverlay({
    claimRevealReady,
  });

  const claimCeremonyBlocking = completedClaim != null;

  useEveningPondSuppression("sanctuary-cast", { kind: "stop", active: isCasting });
  useEveningPondSuppression("sanctuary-claim", { kind: "pause", active: claimCeremonyBlocking });
  useEveningPondSuppression("sanctuary-fishing-modal", { kind: "pause", active: fishingOpen });

  const celebration = useMemo(
    () => (completedClaim ? buildClaimCelebrationCopy(completedClaim) : null),
    [completedClaim],
  );
  useEffect(() => {
    if (completedClaim) {
      setFishingOpen(false);
    }
  }, [completedClaim]);

  const handleCast = useCallback(
    async ({ rodId, baitId }: { rodId: string; baitId: string }) => {
      if (completedClaim != null) return false;
      const accepted = await startCast({ rodId, baitId });
      if (!accepted) return false;
      noteCastDuringCraftBenchSession();
      fishingSounds.play("castSplash");
      fishingSounds.play("pondWaitingAmbient");
      return true;
    },
    [completedClaim, fishingSounds, startCast],
  );

  useFocusEffect(
    useCallback(() => {
      if (uid && __DEV__) {
        void syncDevPreviewWonderFromWellState(uid);
      }
    }, [uid]),
  );

  useFocusEffect(
    useCallback(() => {
      if (isSanctuaryInitialized()) {
        trackSanctuaryArrived();
      }
      void reload()
        .then((loaded) => {
          const pending = getPendingArrivalBloomId();
          if (pending) {
            setArrivalBloomId(pending);
            return;
          }
          const unseen = getUnseenBloom(loaded);
          setArrivalBloomId(unseen?.id ?? null);
        })
        .catch((error) => {
          console.warn("[Sanctuary] failed to reload cultivation", error);
          setArrivalBloomId(null);
        });
    }, [reload]),
  );

  const handleBloomArrivalComplete = useCallback(async (bloomId: string) => {
    const next = await markBloomArrivalSeen(bloomId);
    setSanctuaryCultivationState(next);
    setPendingArrivalBloomId(null);
    setArrivalBloomId(null);
  }, []);

  const cycleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => {
      const idx = SANCTUARY_TIME_OF_DAY_ORDER.indexOf(prev);
      const next = SANCTUARY_TIME_OF_DAY_ORDER[(idx + 1) % SANCTUARY_TIME_OF_DAY_ORDER.length];
      return next;
    });
  }, []);

  const openWell = () => {
    if (!uid) return;
    router.push(routes.well);
  };

  const openCraft = () => {
    if (!uid) return;
    router.push(routes.craft);
  };

  const openPracticeMoment = () => {
    if (!uid) return;
    router.push(routes.practiceMoment);
  };

  const openSettings = useCallback(() => {
    router.push(routes.gate);
  }, []);

  const canAddChild =
    createChildProfileUi &&
    canCreateNextChild(activeChild.childrenSummary.length, activeChild.tier).ok;

  /** Free tier with at least one child: show add slot that opens limit storybook. */
  const showLimitAddSlot =
    switcherUiEnabled &&
    !canAddChild &&
    activeChild.tier === "free" &&
    activeChild.childrenSummary.length >= 1;

  const showSanctuaryCastError = Boolean(fieldNoteBody) && !fishingOpen;

  const sanctuaryBody = (
    <SanctuaryScreen
      timeOfDay={timeOfDay}
      cultivation={cultivation}
      arrivalBloomId={arrivalBloomId}
      onBloomArrivalComplete={handleBloomArrivalComplete}
      isCasting={isCasting}
      castingLabel={castingLabel}
      canRecall={canRecall}
      onRecallCast={() => {
        void cancelCast();
      }}
      castWaitingAtPond={Boolean(isCasting && castReady && !completedClaim)}
      onPondPress={() => {
        if (claimCeremonyBlocking) return;
        setFishingOpen(true);
      }}
      onWellPress={openWell}
      onCraftPress={openCraft}
      onPracticePress={openPracticeMoment}
      wellDisabled={!uid}
      wellCardStatus={well.cardStatus}
      craftDisabled={!uid}
      craftAttention={craftBenchNeedsAttention}
      practiceDisabled={!uid}
      onDevCycleTimeOfDay={cycleTimeOfDay}
      onDevOpenCastFinishPreview={() => {
        router.push(routes.castFinishFixture as never);
      }}
      onLayerLoad={curtainLiftActive ? reportLayerLoad : undefined}
      month={header.month}
      wonderLabel={header.wonderLabel}
      wonderAccessibilityLabel={header.wonderAccessibilityLabel}
      displayName={header.displayName}
      avatarSource={header.avatarSource}
      onPressSettings={openSettings}
      onPressAvatar={
        switcherUiEnabled && activeChild.ready ? () => setSwitcherOpen(true) : undefined
      }
      headerDisableAnimations={header.disableAnimations}
    />
  );

  return (
    <>
      <Animated.View
        style={[
          styles.screenHost,
          curtainLiftActive && styles.screenHostHandoff,
          { opacity: wrapperOpacity },
        ]}
      >
        {sanctuaryBody}
        {showSanctuaryCastError && fieldNoteBody ? (
          <Animated.View
            pointerEvents="box-none"
            style={[styles.sanctuaryErrorNote, { opacity: fieldNoteOpacity }]}
          >
            <SanctuaryFieldNote
              heading={FISHING_ERROR_FIELD_NOTE_HEADING}
              body={fieldNoteBody}
              onPress={handleFieldNotePress}
              accessibilityLabel="Dismiss fishing error"
              scale={0.7}
            />
          </Animated.View>
        ) : null}
      </Animated.View>

      <FishingModal
        visible={fishingOpen}
        onClose={() => {
          clearCastError();
          setFishingOpen(false);
        }}
        onCast={handleCast}
        castError={castError}
        onDismissCastError={clearCastError}
      />

      <ChildSwitcherModal
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        summary={activeChild.childrenSummary}
        activeChildId={activeChild.activeChildId}
        tier={activeChild.tier}
        switchingBlocked={false}
        onSelect={(childId) => {
          void activeChild.setActiveChildId(childId);
        }}
        canAddChild={canAddChild}
        onAddChild={() => {
          router.push({
            pathname: routes.createChildProfile as never,
            params: { entry: "add_child" },
          });
        }}
        showLimitAddSlot={showLimitAddSlot}
        onLimitAddChild={() => {
          router.push(routes.childProfileLimit as never);
        }}
      />

      <Modal
        visible={canPresentClaimCeremony}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!claimRevealReady) return;
          handleClaimCelebrationContinue();
        }}
      >
        <View style={styles.claimBackdrop}>
          {completedClaim && celebration ? (
            <ClaimCelebrationCard
              celebration={celebration}
              showContinue={claimRevealReady}
              continueAccessibilityLabel={
                claimHasCreature(completedClaim)
                  ? "Dismiss catch celebration"
                  : "Continue after fishing"
              }
              onContinue={handleClaimCelebrationContinue}
              claimDateMs={completedClaim.claimedAt}
              revealOverlay={
                showRingOverlay ? (
                  <CatalogRarityRing
                    caughtTier={outcomeToDisplayTier(completedClaim)}
                    subscriptionTier={
                      claimSubscriptionSnapshot ?? (subscription.activeTier as PondRippleActiveTier)
                    }
                    claimedCreatureId={
                      pondRippleCeremonyKey({
                        outcome: completedClaim.outcome,
                        creatureTypeId: completedClaim.creatureTypeId,
                        castId: completedClaimCastId,
                      }) ?? `claim-${completedClaim.outcome}`
                    }
                    onComplete={handlePondRippleComplete}
                  />
                ) : null
              }
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screenHost: {
    flex: 1,
  },
  screenHostHandoff: {
    backgroundColor: SPLASH_FRAME_BG,
  },
  sanctuaryErrorNote: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 166,
    alignItems: "center",
    zIndex: 40,
  },
  claimBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
    backgroundColor: CLAIM_THRESHOLD_SCRIM,
  },
});
