import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { PreviewOnlyBanner } from "@/src/features/sanctuary/PreviewOnlyBanner";
import { SanctuaryScreen } from "@/src/components/sanctuary";
import {
  SANCTUARY_TIME_OF_DAY_ORDER,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { FishingModal } from "@/src/features/fishing/FishingModal";
import { noteCastDuringCraftBenchSession } from "@/src/services/analytics/analyticsSession";
import { getMsSinceGate, trackSanctuaryEntered } from "@/src/services/analytics/authFunnel";
import { isSanctuaryInitialized } from "@/src/state/authInitStore";
import {
  claimServerCast,
  FishingServiceError,
  getServerCastStatus,
  loadServerCast,
  startServerCast,
  type ServerClaimSummary,
} from "@/src/features/fishing/fishingServerCast";
import { layout, spacing } from "@/src/constants/theme";
import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { Sentry } from "@/src/services/sentry/init";
import { useRodProgression } from "@/src/hooks/useRodProgression";
import { useWellQuestion } from "@/src/hooks/useWellQuestion";
import { getUnseenBloom, markBloomArrivalSeen } from "@/src/features/sanctuary/cultivationStorage";
import { useSanctuaryCultivation } from "@/src/hooks/useSanctuaryCultivation";
import { useSanctuarySceneReady } from "@/src/hooks/useSanctuarySceneReady";
import { routes } from "@/src/navigation/routes";
import { subscribeToAuthState } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  getPendingArrivalBloomId,
  setPendingArrivalBloomId,
  setSanctuaryCultivationState,
} from "@/src/state/sanctuaryCultivation";
import { setSanctuaryTimeOfDay } from "@/src/state/sanctuaryTimeOfDay";

const EMPTY_CAST_STATUS = getServerCastStatus(null);

/** Garden — asset-driven sanctuary with time-of-day backgrounds and pose-cycling avatar. */
export default function SanctuaryTabScreen() {
  const [timeOfDay, setTimeOfDay] = useState<SanctuaryTimeOfDay>("afternoon");
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const [fishingOpen, setFishingOpen] = useState(false);
  const [castStatus, setCastStatus] = useState(EMPTY_CAST_STATUS);
  const [completedClaim, setCompletedClaim] = useState<ServerClaimSummary | null>(null);
  const [castError, setCastError] = useState<string | null>(null);
  const [arrivalBloomId, setArrivalBloomId] = useState<string | null>(null);
  const checkingCastRef = useRef(false);
  const { cultivation, reload } = useSanctuaryCultivation();
  const well = useWellQuestion(Boolean(uid));
  const { craftBenchNeedsAttention } = useRodProgression();
  const { reportLayerLoad, curtainLiftActive, sanctuaryRevealOpacity } = useSanctuarySceneReady();
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const wrapperOpacity =
    curtainLiftActive && sanctuaryRevealOpacity ? sanctuaryRevealOpacity : screenOpacity;

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setSanctuaryTimeOfDay(timeOfDay);
  }, [timeOfDay]);

  useEffect(() => {
    if (!completedClaim) return;
    console.log("[Fishing] claim", completedClaim.outcome, completedClaim.creatureTypeId);
  }, [completedClaim]);

  const checkCastStatus = useCallback(async () => {
    if (checkingCastRef.current) return;
    checkingCastRef.current = true;

    try {
      const activeCast = await loadServerCast();
      const nextStatus = getServerCastStatus(activeCast);

      if (!nextStatus.active) {
        setCastStatus(EMPTY_CAST_STATUS);
        return;
      }

      if (!nextStatus.ready) {
        setCastStatus(nextStatus);
        return;
      }

      if (!uid) {
        setCastStatus(nextStatus);
        return;
      }

      const claim = await claimServerCast(uid, nextStatus.cast);
      if (claim) {
        setCompletedClaim(claim);
      }
      setCastStatus(EMPTY_CAST_STATUS);
    } catch (error) {
      if (error instanceof FishingServiceError) {
        setCastError(error.message);
        setCastStatus(EMPTY_CAST_STATUS);
      }
      console.warn("[Fishing] failed to check cast status", error);
      Sentry.captureException(error, {
        tags: { area: "fishing", flow: "cast_status_check" },
      });
    } finally {
      checkingCastRef.current = false;
    }
  }, [uid]);

  useEffect(() => {
    void checkCastStatus();
    const interval = setInterval(() => {
      void checkCastStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [checkCastStatus]);

  const sanctuaryEnteredTrackedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (isSanctuaryInitialized() && !sanctuaryEnteredTrackedRef.current) {
        sanctuaryEnteredTrackedRef.current = true;
        trackSanctuaryEntered({
          isFirstEntry: true,
          totalOnboardingDurationMs: getMsSinceGate(),
        });
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

  const handleCast = useCallback(
    async ({ rodId, baitId }: { rodId: string; baitId: string }) => {
      if (!uid) return false;

      try {
        setCastError(null);
        const result = await startServerCast(uid, { rodId, baitId });

        setCompletedClaim(null);
        setCastStatus(getServerCastStatus(result.cast));
        noteCastDuringCraftBenchSession();
        return true;
      } catch (error) {
        const message =
          error instanceof FishingServiceError
            ? error.message
            : "Could not start a cast. Try again in a moment.";
        setCastError(message);
        console.warn("[Fishing] cast failed", error);
        Sentry.captureException(error, {
          tags: { area: "fishing", flow: "cast_start" },
        });
        return false;
      }
    },
    [uid],
  );

  const sanctuaryBody = (
    <SanctuaryScreen
      timeOfDay={timeOfDay}
      cultivation={cultivation}
      arrivalBloomId={arrivalBloomId}
      onBloomArrivalComplete={handleBloomArrivalComplete}
      isCasting={castStatus.active}
      onPondPress={() => setFishingOpen(true)}
      onWellPress={openWell}
      onCraftPress={openCraft}
      onPracticePress={openPracticeMoment}
      wellDisabled={!uid}
      wellCardStatus={well.cardStatus}
      craftDisabled={!uid}
      craftAttention={craftBenchNeedsAttention}
      practiceDisabled={!uid}
      onDevCycleTimeOfDay={cycleTimeOfDay}
      onLayerLoad={curtainLiftActive ? reportLayerLoad : undefined}
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
      </Animated.View>

      <FishingModal
        visible={fishingOpen}
        onClose={() => {
          setCastError(null);
          setFishingOpen(false);
        }}
        onCast={handleCast}
        castError={castError}
      />

      <Modal
        visible={completedClaim != null}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletedClaim(null)}
      >
        <View style={styles.claimBackdrop}>
          <View style={styles.claimSheet}>
            {completedClaim?.previewOnly ? <PreviewOnlyBanner /> : null}
            {completedClaim?.outcome === "catch" ? (
              <>
                <Text style={layout.screenTitle}>A visitor from the pond</Text>
                <Text style={layout.subtitle}>
                  {completedClaim.creatureDisplayName ?? "Something new arrived."}
                </Text>
              </>
            ) : (
              <>
                <Text style={layout.screenTitle}>The pond answered gently</Text>
                <Text style={layout.subtitle}>
                  {completedClaim?.spiritMessage ??
                    "Not this time. The water remembers your patience."}
                </Text>
                {completedClaim && completedClaim.wonderAwarded > 0 ? (
                  <Text style={styles.wonderLine}>+{completedClaim.wonderAwarded} Wonder</Text>
                ) : null}
              </>
            )}
            <PrimaryButton
              label="Continue"
              accessibilityLabel={
                completedClaim?.outcome === "catch"
                  ? "Dismiss catch celebration"
                  : "Continue after fishing"
              }
              onPress={() => setCompletedClaim(null)}
            />
          </View>
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
  claimBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
    backgroundColor: "rgba(31,26,23,0.35)",
  },
  claimSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.section,
    gap: spacing.inner,
  },
  wonderLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#7A5C45",
  },
});
