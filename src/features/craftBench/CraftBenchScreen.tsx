import { doc, getDoc } from "firebase/firestore";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCraftDurationMs, rareRodForEpic } from "@/shared/sanctuary/progression";
import { ROD_CATALOG } from "@/shared/sanctuary/rods/catalog";
import type { FishingRodId } from "@/shared/sanctuary/types";
import { colors, fontFamilies, layout as themeLayout, spacing } from "@/src/constants/theme";
import { SanctuaryFieldNote } from "@/src/components/sanctuary/SanctuaryFieldNote";
import { CraftBenchCarousel } from "@/src/features/craftBench/CraftBenchCarousel";
import { CraftBenchMemo } from "@/src/features/craftBench/CraftBenchMemo";
import { RodCollectionMoment } from "@/src/features/craftBench/RodCollectionMoment";
import { type CraftBenchCatalogTier } from "@/src/features/craftBench/craftBenchCatalog";
import {
  CRAFT_BENCH_EPIC_RODS_BG,
  CRAFT_BENCH_RARE_RODS_BG,
} from "@/src/features/craftBench/craftBenchAssets";
import { CRAFT_BENCH_RARE_LAYOUT } from "@/src/features/craftBench/craftBenchLayout";
import { minTapTargetRect, refBox, refCircle } from "@/src/features/fishing/fishingModalLayout";
import { useRodProgression } from "@/src/hooks/useRodProgression";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import {
  beginCraftBenchSession,
  didCastDuringCraftBenchSession,
  endCraftBenchSession,
} from "@/src/services/analytics/analyticsSession";
import {
  collectionTiming,
  countRodStates,
  craftDurationHours,
  craftProgressPct,
  daysOverdueFromHoursSinceReady,
  hoursRemaining,
  isFirstCraft,
  moduleLessonCounts,
  persistBenchVisit,
  readDaysSinceLastBenchVisit,
  rodElementForAnalytics,
  rodStateForAnalytics,
  rodTierForAnalytics,
  timeOfDay,
} from "@/src/services/analytics/craftAnalyticsHelpers";
import {
  trackCraftBenchOpened,
  trackCraftCollected,
  trackCraftCollectedLate,
  trackCraftStarted,
  trackRodDetailViewed,
} from "@/src/services/analytics/funnelEvents";
import { firestore } from "@/src/services/firebase/client";
import type { UserDoc } from "@/src/services/firebase/types";
import {
  reattachRodProgressionListener,
  retryRodProgressionUserDoc,
} from "@/src/services/firebase/rodProgressionSync";
import { WellTopBar } from "@/src/features/well/WellTopBar";

function formatRodName(rodId: FishingRodId): string {
  return ROD_CATALOG[rodId].displayName.replace("Rare ", "");
}

const CRAFT_BENCH_HELP_HEADING = "Craft Bench";
const CRAFT_BENCH_HELP_BODY =
  "Choose a rod below. Gather Wonder and Parts from lessons, then Craft. Finished rods need a little time before you can collect them.";

async function loadCompletedLessons(uid: string): Promise<Record<string, boolean>> {
  const snap = await getDoc(doc(firestore, "users", uid));
  if (!snap.exists()) return {};
  return (snap.data() as UserDoc).completedLessons ?? {};
}

export function CraftBenchScreen() {
  const frame = usePortrait916Layout("contain");
  const {
    uid,
    userDocStatus,
    userDocError,
    showEpicCatalog,
    playerRods,
    selectedRodSummary,
    optimisticStartCraft,
    optimisticCollectCraft,
    optimisticEquipRod,
    carouselRodIds,
    lastError,
  } = useRodProgression();

  const [catalogTier, setCatalogTier] = useState<CraftBenchCatalogTier>("rare");
  const [selectedRodId, setSelectedRodId] = useState<FishingRodId>("rare_fire");
  const [busy, setBusy] = useState(false);
  const [collectionMoment, setCollectionMoment] = useState<{
    rodId: FishingRodId;
    originX: number;
    originY: number;
  } | null>(null);

  const [retryBusy, setRetryBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const benchOpenedFired = useRef(false);
  const benchOpenedAt = useRef<number | null>(null);
  const viewStartedAt = useRef<number | null>(null);
  const viewRodId = useRef<FishingRodId | null>(null);
  const tappedStartCraftForView = useRef(false);

  const flushRodDetailView = useCallback(
    (rodId: FishingRodId) => {
      if (viewStartedAt.current == null) return;

      const rodSummary = selectedRodSummary(rodId);
      const record = playerRods[rodId];
      const viewDurationMs = Date.now() - viewStartedAt.current;
      const tier = rodTierForAnalytics(rodId);

      trackRodDetailViewed({
        rodId,
        rodTier: tier,
        rodElement: rodElementForAnalytics(rodId),
        rodState: rodStateForAnalytics(rodSummary.state),
        partsCurrent: rodSummary.partsCurrent,
        partsRequired: rodSummary.partsRequired,
        wonderCurrent: rodSummary.wonderCurrent,
        wonderRequired: rodSummary.wonderRequired,
        partsGap: rodSummary.partsGap,
        wonderGap: rodSummary.wonderGap,
        craftProgressPct: craftProgressPct(rodId, record?.craftStartedAt),
        hoursRemaining: hoursRemaining(rodId, record?.craftStartedAt),
        viewDurationMs,
        tappedStartCraft: tappedStartCraftForView.current,
      });

      viewStartedAt.current = null;
      viewRodId.current = null;
      tappedStartCraftForView.current = false;
    },
    [playerRods, selectedRodSummary],
  );

  const handleSelectRod = useCallback(
    (rodId: FishingRodId) => {
      if (viewRodId.current != null && viewRodId.current !== rodId) {
        flushRodDetailView(viewRodId.current);
      }
      setSelectedRodId(rodId);
      viewRodId.current = rodId;
      viewStartedAt.current = Date.now();
      tappedStartCraftForView.current = false;
    },
    [flushRodDetailView],
  );

  const handleRetryMissingProfile = useCallback(async () => {
    if (!uid || retryBusy) return;
    setRetryBusy(true);
    try {
      await retryRodProgressionUserDoc(uid);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not set up your profile";
      Alert.alert("Not yet", message);
    } finally {
      setRetryBusy(false);
    }
  }, [retryBusy, uid]);

  const handleRetryListener = useCallback(() => {
    if (!uid || retryBusy) return;
    reattachRodProgressionListener(uid);
  }, [retryBusy, uid]);

  const activeRodIds = useMemo(() => carouselRodIds(catalogTier), [carouselRodIds, catalogTier]);

  useEffect(() => {
    if (!activeRodIds.includes(selectedRodId)) {
      handleSelectRod(activeRodIds[0] ?? "rare_fire");
    }
  }, [activeRodIds, handleSelectRod, selectedRodId]);

  const summary = useMemo(
    () => selectedRodSummary(selectedRodId),
    [selectedRodId, selectedRodSummary],
  );

  const layout = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) return null;

    const memoPanel = refBox(frame, CRAFT_BENCH_RARE_LAYOUT.memo.panel);
    const craftCircle = refCircle(frame, CRAFT_BENCH_RARE_LAYOUT.craftButton);
    const craftHitZone = minTapTargetRect(craftCircle, 52);
    const backHitZone = minTapTargetRect(refBox(frame, CRAFT_BENCH_RARE_LAYOUT.backButton));
    const helpHitZone = minTapTargetRect(refBox(frame, CRAFT_BENCH_RARE_LAYOUT.helpButton));
    const carouselSlots = CRAFT_BENCH_RARE_LAYOUT.carouselSlots.map((slot) => refBox(frame, slot));
    const arrowLeft = minTapTargetRect(refBox(frame, CRAFT_BENCH_RARE_LAYOUT.carouselArrowLeft));
    const arrowRight = minTapTargetRect(refBox(frame, CRAFT_BENCH_RARE_LAYOUT.carouselArrowRight));

    return {
      memoPanel,
      craftHitZone,
      craftBorderRadius: craftCircle.borderRadius,
      backHitZone,
      helpHitZone,
      carouselSlots,
      arrowLeft,
      arrowRight,
    };
  }, [frame]);

  useEffect(() => {
    if (!layout || userDocStatus !== "ready" || benchOpenedFired.current) return;

    const task = InteractionManager.runAfterInteractions(() => {
      if (benchOpenedFired.current) return;
      benchOpenedFired.current = true;
      beginCraftBenchSession();
      benchOpenedAt.current = Date.now();

      void (async () => {
        const daysSinceLastBenchVisit = await readDaysSinceLastBenchVisit();
        const counts = countRodStates(playerRods);
        trackCraftBenchOpened({
          ...counts,
          entryPoint: "sanctuary_tap",
          timeOfDay: timeOfDay(),
          daysSinceLastBenchVisit,
        });
        await persistBenchVisit();

        if (viewRodId.current == null) {
          viewRodId.current = selectedRodId;
          viewStartedAt.current = Date.now();
        }
      })();
    });

    return () => task.cancel();
  }, [layout, playerRods, selectedRodId, userDocStatus]);

  useEffect(() => {
    return () => {
      if (viewRodId.current != null) {
        flushRodDetailView(viewRodId.current);
      }
      endCraftBenchSession();
    };
  }, [flushRodDetailView]);

  const carouselRods = useMemo(
    () =>
      activeRodIds.map((rodId) => ({
        rodId,
        label: formatRodName(rodId),
      })),
    [activeRodIds],
  );

  const switchCatalogTier = useCallback(() => {
    if (!showEpicCatalog) return;
    const nextTier: CraftBenchCatalogTier = catalogTier === "rare" ? "epic" : "rare";
    setCatalogTier(nextTier);
    if (nextTier === "epic") {
      const pairedEpic = carouselRodIds("epic").find(
        (rodId) => rareRodForEpic(rodId) === selectedRodId,
      );
      if (pairedEpic) handleSelectRod(pairedEpic);
    } else {
      const pairedRare = rareRodForEpic(selectedRodId);
      if (pairedRare && carouselRodIds("rare").includes(pairedRare)) {
        handleSelectRod(pairedRare);
      }
    }
  }, [carouselRodIds, catalogTier, handleSelectRod, selectedRodId, showEpicCatalog]);

  const goPrevTier = switchCatalogTier;
  const goNextTier = switchCatalogTier;

  const onCraftPress = async () => {
    if (busy || !uid) return;
    setBusy(true);
    try {
      if (summary.canBegin) {
        const result = await optimisticStartCraft(selectedRodId);
        tappedStartCraftForView.current = true;
        const completedLessons = await loadCompletedLessons(uid);
        const { moduleLessonsCompleted, moduleLessonsTotal } = moduleLessonCounts(
          selectedRodId,
          completedLessons,
        );
        const tier = rodTierForAnalytics(selectedRodId);
        if (tier === "rare" || tier === "epic") {
          trackCraftStarted({
            rodId: selectedRodId,
            rodTier: tier,
            rodElement: rodElementForAnalytics(selectedRodId),
            wonderInvested: result.wonderInvested,
            partsSpent: result.partsSpent,
            wonderRemaining: result.storedWonderRemaining,
            partsRemaining: result.partsRemaining,
            craftDurationHours: craftDurationHours(selectedRodId),
            benchSessionDurationMs: benchOpenedAt.current ? Date.now() - benchOpenedAt.current : 0,
            isFirstCraft: isFirstCraft(playerRods, selectedRodId),
            moduleLessonsCompleted,
            moduleLessonsTotal,
          });
        }
        Alert.alert("Taking shape", "Wonder is resting in this rod.");
      } else if (summary.canCollectTimer) {
        const record = playerRods[selectedRodId];
        const craftStartedAt = record?.craftStartedAt ?? null;
        await optimisticCollectCraft(selectedRodId);

        const now = Date.now();
        const durationHours = craftDurationHours(selectedRodId);
        const hoursToCollect =
          craftStartedAt != null ? (now - craftStartedAt) / (60 * 60 * 1000) : 0;
        const readyAt =
          craftStartedAt != null ? craftStartedAt + getCraftDurationMs(selectedRodId) : now;
        const hoursSinceReady = (now - readyAt) / (60 * 60 * 1000);
        const timing = collectionTiming(hoursSinceReady);

        trackCraftCollected({
          rodId: selectedRodId,
          rodTier: rodTierForAnalytics(selectedRodId),
          rodElement: rodElementForAnalytics(selectedRodId),
          hoursToCollect,
          craftDurationHours: durationHours,
          collectionTiming: timing,
          castSameSession: didCastDuringCraftBenchSession(),
        });

        if (timing === "very_late") {
          trackCraftCollectedLate({
            rodId: selectedRodId,
            daysOverdue: daysOverdueFromHoursSinceReady(hoursSinceReady),
            receivedReadyNotification: false,
            notificationToCollectionDays: null,
            returnEntryPoint: "organic",
          });
        }

        Alert.alert("Complete", "It's been waiting for you.");
      } else if (summary.canEquip && layout) {
        const originX = frame.left + layout.craftHitZone.left + layout.craftHitZone.width / 2;
        const originY = frame.top + layout.craftHitZone.top + layout.craftHitZone.height / 2;
        await optimisticEquipRod(selectedRodId);
        setCollectionMoment({ rodId: selectedRodId, originX, originY });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Not yet", message);
    } finally {
      setBusy(false);
    }
  };

  const craftLabel = summary.canCollectTimer
    ? "Welcome"
    : summary.canEquip
      ? "Collect Rod"
      : summary.canBegin
        ? "Begin"
        : "Craft";

  const craftDisabled =
    busy || (!summary.canBegin && !summary.canCollectTimer && !summary.canEquip);

  const backgroundSource =
    catalogTier === "epic" ? CRAFT_BENCH_EPIC_RODS_BG : CRAFT_BENCH_RARE_RODS_BG;

  if (!layout) {
    return <View style={styles.root} />;
  }

  const {
    memoPanel,
    craftHitZone,
    craftBorderRadius,
    backHitZone,
    helpHitZone,
    carouselSlots,
    arrowLeft,
    arrowRight,
  } = layout;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View
        pointerEvents="box-none"
        style={[
          styles.frameLayer,
          { left: frame.left, top: frame.top, width: frame.width, height: frame.height },
        ]}
      >
        <Image
          source={backgroundSource}
          style={styles.background}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />

        <CraftBenchMemo
          memoRect={memoPanel}
          rodId={selectedRodId}
          rodName={formatRodName(selectedRodId)}
          statusLine={summary.statusLine}
          uxLabel={
            summary.state === "locked" ? "Complete lessons to\ngather more parts." : summary.uxLabel
          }
          wonderCurrent={summary.wonderCurrent}
          wonderRequired={summary.wonderRequired}
          partsCurrent={summary.partsCurrent}
          partsRequired={summary.partsRequired}
          lastError={lastError}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={craftLabel}
          disabled={craftDisabled}
          onPress={onCraftPress}
          style={[
            styles.craftHit,
            {
              left: craftHitZone.left,
              top: craftHitZone.top,
              width: craftHitZone.width,
              height: craftHitZone.height,
              borderRadius: craftBorderRadius,
            },
            craftDisabled && styles.craftHitDisabled,
          ]}
        >
          {!craftDisabled ? (
            busy ? (
              <ActivityIndicator color="#2D4C31" />
            ) : (
              <Text style={styles.craftLabel}>{craftLabel}</Text>
            )
          ) : null}
        </Pressable>

        <CraftBenchCarousel
          slots={carouselSlots}
          arrowLeft={arrowLeft}
          arrowRight={arrowRight}
          rods={carouselRods}
          selectedRodId={selectedRodId}
          onSelectRod={handleSelectRod}
          onPrev={goPrevTier}
          onNext={goNextTier}
          tierSwitchEnabled={showEpicCatalog}
          catalogTier={catalogTier}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Craft Bench"
          onPress={() => router.back()}
          style={[
            styles.chromeHit,
            {
              left: backHitZone.left,
              top: backHitZone.top,
              width: backHitZone.width,
              height: backHitZone.height,
            },
          ]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Craft Bench help"
          onPress={() => setHelpOpen(true)}
          style={[
            styles.chromeHit,
            {
              left: helpHitZone.left,
              top: helpHitZone.top,
              width: helpHitZone.width,
              height: helpHitZone.height,
            },
          ]}
        />

        {helpOpen ? (
          <View style={styles.helpOverlay} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss Craft Bench help"
              onPress={() => setHelpOpen(false)}
              style={styles.helpScrim}
            />
            <View style={styles.helpNoteWrap} pointerEvents="box-none">
              <SanctuaryFieldNote
                heading={CRAFT_BENCH_HELP_HEADING}
                body={CRAFT_BENCH_HELP_BODY}
                onPress={() => setHelpOpen(false)}
                accessibilityLabel="Dismiss Craft Bench help"
                scale={0.9}
              />
            </View>
          </View>
        ) : null}

        {userDocStatus === "pending" ? (
          <View style={styles.pendingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {userDocStatus === "missing" ? (
          <View style={styles.statusOverlay}>
            <Text style={themeLayout.subtitle}>
              Your profile is still being set up. Try again in a moment.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              disabled={retryBusy}
              onPress={() => void handleRetryMissingProfile()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              {retryBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonText}>Try again</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {userDocStatus === "error" ? (
          <View style={styles.statusOverlay}>
            <Text style={themeLayout.subtitle}>
              {userDocError ?? "Something went wrong loading your craft bench."}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              disabled={retryBusy}
              onPress={handleRetryListener}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {collectionMoment ? (
        <RodCollectionMoment
          visible
          rodId={collectionMoment.rodId}
          rodName={formatRodName(collectionMoment.rodId)}
          originX={collectionMoment.originX}
          originY={collectionMoment.originY}
          onContinue={() => setCollectionMoment(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  frameLayer: {
    position: "absolute",
    overflow: "hidden",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  craftHit: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  craftHitDisabled: {
    opacity: 0.35,
  },
  craftLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 22,
    color: "#2D4C31",
  },
  chromeHit: {
    position: "absolute",
    borderRadius: 999,
  },
  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  helpScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 26, 23, 0.28)",
  },
  helpNoteWrap: {
    position: "absolute",
    left: "8%",
    right: "8%",
    alignItems: "center",
    zIndex: 41,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250, 247, 242, 0.25)",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.inner,
    paddingHorizontal: spacing.inner,
    backgroundColor: "rgba(250, 247, 242, 0.92)",
  },
  retryButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
