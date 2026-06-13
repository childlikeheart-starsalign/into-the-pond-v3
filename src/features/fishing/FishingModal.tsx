import { PremiumTooltip } from "@/src/features/fishing/PremiumTooltip";
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
import {
  FISHING_BOTTOM_NAV_INSET,
  FISHING_LAYOUT,
  FISHING_SLOT_LAYOUT,
  minTapTargetRect,
  normRectToStyle,
  refBox,
  refCircle,
} from "@/src/features/fishing/fishingModalLayout";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { useUserIsPremium } from "@/src/hooks/useUserIsPremium";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";

type FishingModalProps = {
  visible: boolean;
  onClose: () => void;
  onCast: (selection: { rodId: string; baitId: string }) => boolean | Promise<boolean>;
};

type SelectableFishingItem = FishingRod | Bait;

const FISHING_UNLOCKED_IMAGE = require("@/assets/Fishing/40.png");
const FISHING_LOCKED_IMAGE = require("@/assets/Fishing/41.png");

export function FishingModal({ visible, onClose, onCast }: FishingModalProps) {
  const frame = usePortrait916Layout("contain");
  const { height: windowHeight } = useWindowDimensions();
  const isPremium = useUserIsPremium();
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const [selectedRodId, setSelectedRodId] = useState(DEFAULT_ROD_ID);
  const [selectedBaitId, setSelectedBaitId] = useState(DEFAULT_BAIT_ID);
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) return;
    flashOpacity.setValue(0);
    setTooltipId(null);
  }, [flashOpacity, visible]);

  const selectedRod = useMemo(() => getRodById(selectedRodId), [selectedRodId]);
  const selectedBait = useMemo(() => getBaitById(selectedBaitId), [selectedBaitId]);

  const layout = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) {
      return null;
    }

    const previewCard = refBox(frame, FISHING_LAYOUT.previewCard);
    const baitPanel = refBox(frame, FISHING_LAYOUT.baitPanel);
    const rodGrid = refBox(frame, FISHING_LAYOUT.rodGrid);
    const castHitZone = refCircle(frame, FISHING_LAYOUT.castButton);
    const baitSlots = FISHING_SLOT_LAYOUT.baitSlots.map((slot) => {
      const rect = {
        left: baitPanel.width * slot.left,
        top: baitPanel.height * slot.top,
        width: baitPanel.width * slot.width,
        height: baitPanel.height * slot.height,
      };

      return {
        rect,
        itemSize: Math.min(64, rect.width, rect.height),
      };
    });
    const rodSlots = FISHING_SLOT_LAYOUT.rodSlots.map((slot) =>
      normRectToStyle(slot, rodGrid.width, rodGrid.height),
    );
    const closeHitZone = minTapTargetRect(refBox(frame, FISHING_LAYOUT.previewClose));
    const scrimBottom = Math.max(
      0,
      windowHeight - (frame.top + frame.height * (1 - FISHING_BOTTOM_NAV_INSET)),
    );

    return {
      previewCard,
      baitPanel,
      rodGrid,
      castHitZone,
      baitSlots,
      rodSlots,
      closeHitZone,
      scrimBottom,
    };
  }, [frame, windowHeight]);

  const canSelect = useCallback(
    (item: SelectableFishingItem) => isPremium || !item.isPremium,
    [isPremium],
  );

  const handleRodPress = useCallback(
    (rod: FishingRod) => {
      if (canSelect(rod)) {
        setSelectedRodId(rod.id);
        setTooltipId(null);
        return;
      }
      setTooltipId((prev) => (prev === rod.id ? null : rod.id));
    },
    [canSelect],
  );

  const handleBaitPress = useCallback(
    (bait: Bait) => {
      if (canSelect(bait)) {
        setSelectedBaitId(bait.id);
        setTooltipId(null);
        return;
      }
      setTooltipId((prev) => (prev === bait.id ? null : bait.id));
    },
    [canSelect],
  );

  const handleCast = useCallback(async () => {
    const accepted = await onCast({ rodId: selectedRodId, baitId: selectedBaitId });
    if (!accepted) return;

    Animated.timing(flashOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      flashOpacity.setValue(0);
    });
  }, [flashOpacity, onCast, onClose, selectedBaitId, selectedRodId]);

  if (!visible || !layout) {
    return null;
  }

  const {
    previewCard,
    baitPanel,
    rodGrid,
    castHitZone,
    baitSlots,
    rodSlots,
    closeHitZone,
    scrimBottom,
  } = layout;
  const fishingImage = isPremium ? FISHING_UNLOCKED_IMAGE : FISHING_LOCKED_IMAGE;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.scrim, { bottom: scrimBottom }]} />
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
        <View pointerEvents="none" style={styles.fishingImageWrap}>
          <Image
            source={fishingImage}
            style={styles.fishingImage}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View pointerEvents="box-none" style={[styles.previewOverlay, previewCard]}>
          <View
            pointerEvents="none"
            style={[
              styles.previewRodWrap,
              normRectToStyle(
                FISHING_SLOT_LAYOUT.previewRod,
                previewCard.width,
                previewCard.height,
              ),
            ]}
          >
            <Image
              source={selectedRod.previewAsset}
              style={styles.previewRod}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View
            pointerEvents="none"
            style={[
              styles.previewBaitWrap,
              normRectToStyle(
                FISHING_SLOT_LAYOUT.previewBait,
                previewCard.width,
                previewCard.height,
              ),
            ]}
          >
            <Image
              source={selectedBait.previewAsset}
              style={styles.previewBait}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>
        </View>

        <View pointerEvents="box-none" style={[styles.touchLayer, baitPanel]}>
          {BAITS.map((bait, index) => {
            const locked = !canSelect(bait);
            const selected = bait.id === selectedBaitId;
            const slot = baitSlots[index];
            return (
              <View key={bait.id} style={[styles.touchSlot, slot?.rect]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={locked ? "Locked bait" : "Select bait"}
                  onPress={() => handleBaitPress(bait)}
                  style={({ pressed }) => [
                    styles.touchPressable,
                    selected && styles.selectedTouchZone,
                    pressed && !locked && styles.pressed,
                  ]}
                />
                {tooltipId === bait.id ? <PremiumTooltip /> : null}
              </View>
            );
          })}
        </View>

        <View pointerEvents="box-none" style={[styles.touchLayer, rodGrid]}>
          {RODS.map((rod, index) => {
            const locked = !canSelect(rod);
            const selected = rod.id === selectedRodId;
            const slotRect = rodSlots[index];

            return (
              <View key={rod.id} style={[styles.touchSlot, slotRect]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    locked ? `Locked ${rod.label} rod` : `Select ${rod.label} rod`
                  }
                  onPress={() => handleRodPress(rod)}
                  style={({ pressed }) => [
                    styles.touchPressable,
                    selected && styles.selectedTouchZone,
                    pressed && !locked && styles.pressed,
                  ]}
                />
                {tooltipId === rod.id ? <PremiumTooltip /> : null}
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
          onPress={handleCast}
          style={({ pressed }) => [styles.castHitZone, castHitZone, pressed && styles.pressed]}
        />
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
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  frameLayer: {
    position: "absolute",
  },
  fishingImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  fishingImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
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
    height: "81%",
  },
  previewBaitWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBait: {
    width: "100%",
    height: "70%",
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
  selectedTouchZone: {
    borderWidth: 2,
    borderColor: "#C0A060",
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.72,
  },
  flash: {
    zIndex: 1000,
    backgroundColor: "#FFFFFF",
  },
});
