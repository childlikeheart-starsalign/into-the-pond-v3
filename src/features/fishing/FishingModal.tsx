import { SanctuaryFieldNote } from "@/src/components/sanctuary/SanctuaryFieldNote";
import { FISHING_ERROR_FIELD_NOTE_HEADING } from "@/src/features/fishing/fishingErrorCopy";
import { FishingLockTooltip } from "@/src/features/fishing/FishingLockTooltip";
import { LockOverlay } from "@/src/features/fishing/LockOverlay";
import {
  BAITS,
  DEFAULT_BAIT_ID,
  DEFAULT_ROD_ID,
  RODS,
  type Bait,
  type FishingRod,
  getBaitById,
  getRodById,
} from "@/src/features/fishing/fishingData";
import { stockForUiBaitId, useBaitInventory } from "@/src/features/fishing/useBaitInventory";
import { Sentry } from "@/src/services/sentry/init";
import {
  FISHING_BAIT_SLOT_LEFT_OFFSET_PX,
  FISHING_BAIT_SLOT_TOP_OFFSET_PX,
  FISHING_BOTTOM_NAV_INSET,
  FISHING_CAST_CENTER_Y_OFFSET_PX,
  FISHING_CLOSE_OFFSET_PX,
  FISHING_LAYOUT,
  FISHING_OVERLAY_SCALE,
  FISHING_OVERLAY_TOP_OFFSET_PX,
  FISHING_SCRIM_HEIGHT_SCALE,
  FISHING_SCRIM_TOP_OFFSET_PX,
  FISHING_PREVIEW_BAIT_SLOT_SCALE,
  FISHING_PREVIEW_CLOSE_SIZE_SCALE,
  FISHING_PREVIEW_ROD_SLOT_SCALE,
  FISHING_PREVIEW_TOP_OFFSET_PX,
  FISHING_SLOT_LAYOUT,
  frameRectToStyle,
  normRectToStyle,
  panelSlotToFrameBox,
  previewSlotToFrameStyle,
  refBox,
  refCircle,
  scaleFrameRectFromTopLeft,
} from "@/src/features/fishing/fishingModalLayout";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO } from "@/src/constants/sanctuaryNavLayout";
import { isUiRodOwnedForFishing } from "@/src/features/fishing/fishingRodOwnership";
import { useRodProgression } from "@/src/hooks/useRodProgression";
import { useUserIsPremium } from "@/src/hooks/useUserIsPremium";
import { firebaseAuth } from "@/src/services/firebase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";

type FishingModalProps = {
  visible: boolean;
  onClose: () => void;
  onCast: (selection: { rodId: string; baitId: string }) => boolean | Promise<boolean>;
  castError?: string | null;
  onDismissCastError?: () => void;
};

type TooltipTarget =
  | { kind: "bait"; id: string; reason: "membership" | "stock" }
  | { kind: "rod"; id: string }
  | null;

const FISHING_CAST_OVERLAY = require("@/assets/Fishing/fishing_cast_overlay.png");

function lockSizeForSlot(rect: { width: number; height: number }) {
  return Math.min(rect.width, rect.height) * 0.55;
}

export function FishingModal({
  visible,
  onClose,
  onCast,
  castError,
  onDismissCastError,
}: FishingModalProps) {
  const frame = usePortrait916Layout("contain");
  const { height: windowHeight } = useWindowDimensions();
  const isPremium = useUserIsPremium();
  const { playerRods } = useRodProgression();
  const baitStock = useBaitInventory(firebaseAuth.currentUser?.uid ?? null);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const castInFlightRef = useRef(false);

  const [selectedRodId, setSelectedRodId] = useState(DEFAULT_ROD_ID);
  const [selectedBaitId, setSelectedBaitId] = useState(DEFAULT_BAIT_ID);
  const [tooltipTarget, setTooltipTarget] = useState<TooltipTarget>(null);

  useEffect(() => {
    if (visible) return;
    flashOpacity.setValue(0);
    setTooltipTarget(null);
    castInFlightRef.current = false;
  }, [flashOpacity, visible]);

  const selectedRod = useMemo(() => getRodById(selectedRodId), [selectedRodId]);
  const selectedBait = useMemo(() => getBaitById(selectedBaitId), [selectedBaitId]);

  const layout = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) {
      return null;
    }

    const rodGrid = refBox(frame, FISHING_LAYOUT.rodGrid);
    const castBase = refCircle(frame, FISHING_LAYOUT.castButton);
    const castHitZone = {
      ...castBase,
      top: castBase.top + FISHING_CAST_CENTER_Y_OFFSET_PX,
    };
    const baitSlots = FISHING_SLOT_LAYOUT.baitSlots.map((slot, index) => {
      const rect = refBox(frame, panelSlotToFrameBox(FISHING_LAYOUT.baitPanel, slot));
      const leftOffset = FISHING_BAIT_SLOT_LEFT_OFFSET_PX[index] ?? 0;
      const topOffset = FISHING_BAIT_SLOT_TOP_OFFSET_PX[index] ?? 0;
      return frameRectToStyle({
        ...rect,
        left: rect.left + leftOffset,
        top: rect.top + topOffset,
      });
    });
    const rodSlots = FISHING_SLOT_LAYOUT.rodSlots.map((slot) =>
      normRectToStyle(slot, rodGrid.width, rodGrid.height),
    );
    const closeBase = scaleFrameRectFromTopLeft(
      refBox(frame, FISHING_LAYOUT.previewClose),
      FISHING_PREVIEW_CLOSE_SIZE_SCALE,
    );
    const closeHitZone = {
      ...closeBase,
      left: closeBase.left + FISHING_CLOSE_OFFSET_PX.left,
      top: closeBase.top + FISHING_CLOSE_OFFSET_PX.top,
    };
    const baseScrimTop = FISHING_SCRIM_TOP_OFFSET_PX;
    const baseScrimBottom = Math.max(
      0,
      windowHeight - (frame.top + frame.height * (1 - FISHING_BOTTOM_NAV_INSET)),
    );
    const navSafeBottom = Math.max(
      0,
      windowHeight - (frame.top + frame.height * (1 - SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO)),
    );
    const baseHeight = Math.max(0, windowHeight - baseScrimTop - baseScrimBottom);
    const targetHeight = baseHeight * FISHING_SCRIM_HEIGHT_SCALE;
    let extra = Math.max(0, targetHeight - baseHeight);

    let scrimBottom = baseScrimBottom;
    const downRoom = Math.max(0, baseScrimBottom - navSafeBottom);
    const downGrow = Math.min(extra, downRoom);
    scrimBottom -= downGrow;
    extra -= downGrow;

    let scrimTop = baseScrimTop;
    const upGrow = Math.min(extra, scrimTop);
    scrimTop -= upGrow;

    return {
      rodGrid,
      castHitZone,
      baitSlots,
      rodSlots,
      closeHitZone,
      scrimTop,
      scrimBottom,
    };
  }, [
    frame,
    windowHeight,
    FISHING_BAIT_SLOT_LEFT_OFFSET_PX,
    FISHING_BAIT_SLOT_TOP_OFFSET_PX,
    FISHING_PREVIEW_TOP_OFFSET_PX,
  ]);

  const baitAvailability = useCallback(
    (
      item: Bait,
    ): {
      selectable: boolean;
      reason: "membership" | "stock" | null;
      count: number | null;
    } => {
      const count = stockForUiBaitId(item.id, baitStock);
      if (item.isPremium && !isPremium) {
        return { selectable: false, reason: "membership", count };
      }
      if (count != null && count <= 0) {
        return { selectable: false, reason: "stock", count };
      }
      return { selectable: true, reason: null, count };
    },
    [baitStock, isPremium],
  );

  const canSelectRod = useCallback(
    (rod: FishingRod) => isUiRodOwnedForFishing(rod.id, playerRods),
    [playerRods],
  );

  useEffect(() => {
    if (!visible) return;
    const selected = getBaitById(selectedBaitId);
    if (!baitAvailability(selected).selectable) {
      setSelectedBaitId(DEFAULT_BAIT_ID);
    }
  }, [baitAvailability, selectedBaitId, visible]);

  const handleRodPress = useCallback(
    (rod: FishingRod) => {
      if (canSelectRod(rod)) {
        setSelectedRodId(rod.id);
        setTooltipTarget(null);
        return;
      }
      setTooltipTarget((prev) =>
        prev?.kind === "rod" && prev.id === rod.id ? null : { kind: "rod", id: rod.id },
      );
    },
    [canSelectRod],
  );

  const handleBaitPress = useCallback(
    (bait: Bait) => {
      const availability = baitAvailability(bait);
      if (availability.selectable) {
        setSelectedBaitId(bait.id);
        setTooltipTarget(null);
        return;
      }
      setTooltipTarget((prev) =>
        prev?.kind === "bait" && prev.id === bait.id
          ? null
          : { kind: "bait", id: bait.id, reason: availability.reason ?? "membership" },
      );
    },
    [baitAvailability],
  );

  const handleCast = useCallback(async () => {
    if (castInFlightRef.current) return;
    const availability = baitAvailability(getBaitById(selectedBaitId));
    if (!availability.selectable) {
      setTooltipTarget({
        kind: "bait",
        id: selectedBaitId,
        reason: availability.reason ?? "stock",
      });
      return;
    }
    castInFlightRef.current = true;
    try {
      const accepted = await onCast({ rodId: selectedRodId, baitId: selectedBaitId });
      if (!accepted) {
        castInFlightRef.current = false;
        return;
      }

      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
        flashOpacity.setValue(0);
        castInFlightRef.current = false;
      });
    } catch (error) {
      castInFlightRef.current = false;
      console.warn("[FishingModal] cast rejected", error);
      Sentry.captureException(error, {
        tags: { area: "fishing", flow: "cast_modal" },
      });
    }
  }, [baitAvailability, flashOpacity, onCast, onClose, selectedBaitId, selectedRodId]);

  if (!visible || !layout) {
    return null;
  }

  const { rodGrid, castHitZone, baitSlots, rodSlots, closeHitZone, scrimTop, scrimBottom } = layout;

  const artboard = { left: 0, top: 0, width: frame.width, height: frame.height };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.scrim, { top: scrimTop, bottom: scrimBottom }]} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.frameLayer,
          {
            left: frame.left,
            top: frame.top,
            width: frame.width,
            height: frame.height,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.overlayContent}>
          <View pointerEvents="none" style={styles.fishingImageWrap}>
            <Image
              source={FISHING_CAST_OVERLAY}
              style={styles.fishingImage}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View pointerEvents="none" style={styles.previewAssetsLayer}>
            <View
              style={[
                styles.previewRodWrap,
                previewSlotToFrameStyle(
                  artboard,
                  FISHING_SLOT_LAYOUT.previewRod,
                  FISHING_PREVIEW_ROD_SLOT_SCALE,
                  FISHING_PREVIEW_TOP_OFFSET_PX,
                ),
              ]}
            >
              <Image
                source={selectedRod.asset}
                style={styles.previewRod}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>

            <View
              style={[
                styles.previewBaitWrap,
                previewSlotToFrameStyle(
                  artboard,
                  FISHING_SLOT_LAYOUT.previewBait,
                  FISHING_PREVIEW_BAIT_SLOT_SCALE,
                  FISHING_PREVIEW_TOP_OFFSET_PX,
                ),
              ]}
            >
              <Image
                source={selectedBait.asset}
                style={styles.previewBait}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>

          {BAITS.map((bait, index) => {
            const availability = baitAvailability(bait);
            const locked = !availability.selectable;
            const slotStyle = baitSlots[index];
            const slotWidth = typeof slotStyle.width === "number" ? slotStyle.width : 48;
            const slotHeight = typeof slotStyle.height === "number" ? slotStyle.height : 48;
            const showTooltip = tooltipTarget?.kind === "bait" && tooltipTarget.id === bait.id;
            const stockLabel = availability.count != null ? String(availability.count) : null;

            return (
              <View key={bait.id} style={[styles.touchSlot, slotStyle]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    availability.reason === "membership"
                      ? "Locked bait. This bait is included with membership."
                      : availability.reason === "stock"
                        ? "Out of bait. Craft more at the bench."
                        : stockLabel
                          ? `Select bait, ${stockLabel} remaining`
                          : "Select bait"
                  }
                  onPress={() => handleBaitPress(bait)}
                  style={({ pressed }) => [
                    styles.touchPressable,
                    pressed && !locked && styles.pressed,
                  ]}
                />
                {!locked && selectedBaitId === bait.id ? (
                  <View pointerEvents="none" style={styles.selectedRing} />
                ) : null}
                {locked ? (
                  <LockOverlay size={lockSizeForSlot({ width: slotWidth, height: slotHeight })} />
                ) : null}
                {stockLabel != null && !locked ? (
                  <View pointerEvents="none" style={styles.baitCountBadge}>
                    <Text style={styles.baitCountText}>{stockLabel}</Text>
                  </View>
                ) : null}
                {showTooltip ? (
                  <FishingLockTooltip
                    variant="bait"
                    body={
                      tooltipTarget?.kind === "bait" && tooltipTarget.reason === "stock"
                        ? "None left — craft more when you're ready."
                        : undefined
                    }
                  />
                ) : null}
              </View>
            );
          })}

          <View pointerEvents="box-none" style={[styles.touchLayer, rodGrid]}>
            {RODS.map((rod, index) => {
              const locked = !canSelectRod(rod);
              const slotRect = rodSlots[index];
              const slotWidth = typeof slotRect.width === "number" ? slotRect.width : 48;
              const slotHeight = typeof slotRect.height === "number" ? slotRect.height : 48;
              const showTooltip = tooltipTarget?.kind === "rod" && tooltipTarget.id === rod.id;

              return (
                <View key={rod.id} style={[styles.touchSlot, slotRect]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      locked
                        ? `Locked ${rod.label} rod. Craft this rod at the bench first.`
                        : `Select ${rod.label} rod`
                    }
                    onPress={() => handleRodPress(rod)}
                    style={({ pressed }) => [
                      styles.touchPressable,
                      pressed && !locked && styles.pressed,
                    ]}
                  />
                  {!locked && selectedRodId === rod.id ? (
                    <View pointerEvents="none" style={styles.selectedRing} />
                  ) : null}
                  {locked ? (
                    <LockOverlay size={lockSizeForSlot({ width: slotWidth, height: slotHeight })} />
                  ) : null}
                  {showTooltip ? <FishingLockTooltip variant="rod" /> : null}
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to sanctuary"
            onPress={onClose}
            style={({ pressed }) => [styles.closeHitZone, closeHitZone, pressed && styles.pressed]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cast and return to sanctuary"
            onPress={() => void handleCast()}
            style={({ pressed }) => [styles.castHitZone, castHitZone, pressed && styles.pressed]}
          />

          {castError ? (
            <View style={styles.errorNoteWrap} pointerEvents="box-none">
              <SanctuaryFieldNote
                heading={FISHING_ERROR_FIELD_NOTE_HEADING}
                body={castError}
                onPress={onDismissCastError}
                accessibilityLabel="Dismiss fishing error"
                scale={0.7}
              />
            </View>
          ) : null}
        </View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    zIndex: 50,
    elevation: 50,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 26, 23, 0.35)",
  },
  frameLayer: {
    position: "absolute",
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    marginTop: FISHING_OVERLAY_TOP_OFFSET_PX,
    transform: [{ scale: FISHING_OVERLAY_SCALE }],
  },
  fishingImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  fishingImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  previewAssetsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 18,
    elevation: 18,
  },
  closeHitZone: {
    position: "absolute",
    zIndex: 20,
    elevation: 20,
    backgroundColor: "transparent",
  },
  previewRodWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRod: {
    width: "100%",
    height: "100%",
  },
  previewBaitWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBait: {
    width: "100%",
    height: "100%",
  },
  castHitZone: {
    position: "absolute",
    zIndex: 21,
    elevation: 21,
    backgroundColor: "transparent",
  },
  touchLayer: {
    position: "absolute",
  },
  touchSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  touchPressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  baitCountBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    minWidth: 20,
    minHeight: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "rgba(250,247,242,0.92)",
    borderWidth: 1,
    borderColor: "#E8DDD3",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 22,
  },
  baitCountText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#5B514A",
  },
  pressed: {
    opacity: 0.72,
  },
  flash: {
    zIndex: 1000,
    backgroundColor: "#FFF8EB",
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(75, 67, 60, 0.45)",
    backgroundColor: "rgba(255, 248, 235, 0.22)",
    borderRadius: 6,
    zIndex: 1,
  },
  errorNoteWrap: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "18%",
    alignItems: "center",
    zIndex: 30,
  },
});
