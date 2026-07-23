import { Pressable, StyleSheet, View } from "react-native";

import type { FishingRodId } from "@/shared/sanctuary/types";
import type { CraftBenchCatalogTier } from "@/src/features/craftBench/craftBenchCatalog";

/**
 * Selection chrome nudge to match `craft-bench_rare-rods.png` carousel cells.
 * Applied to chrome only — hit Pressable stays aligned to layout slots.
 */
const SELECTED_SLOT_OFFSET_PX = { x: 5, y: -7 } as const;
const SELECTION_CHROME_INSET_PX = 5;

type CarouselRod = {
  rodId: FishingRodId;
  label: string;
};

type CraftBenchCarouselProps = {
  slots: Array<{ left: number; top: number; width: number; height: number }>;
  arrowLeft: { left: number; top: number; width: number; height: number };
  arrowRight: { left: number; top: number; width: number; height: number };
  rods: CarouselRod[];
  selectedRodId: FishingRodId;
  onSelectRod: (rodId: FishingRodId) => void;
  onPrev: () => void;
  onNext: () => void;
  tierSwitchEnabled: boolean;
  catalogTier: CraftBenchCatalogTier;
};

export function CraftBenchCarousel({
  slots,
  arrowLeft,
  arrowRight,
  rods,
  selectedRodId,
  onSelectRod,
  onPrev,
  onNext,
  tierSwitchEnabled,
  catalogTier,
}: CraftBenchCarouselProps) {
  const prevLabel = catalogTier === "rare" ? "Show epic rods" : "Show rare rods";
  const nextLabel = catalogTier === "rare" ? "Show epic rods" : "Show rare rods";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={prevLabel}
        accessibilityState={{ disabled: !tierSwitchEnabled }}
        disabled={!tierSwitchEnabled}
        onPress={onPrev}
        style={[styles.hit, arrowLeft, !tierSwitchEnabled && styles.hitDisabled]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: !tierSwitchEnabled }}
        disabled={!tierSwitchEnabled}
        onPress={onNext}
        style={[styles.hit, arrowRight, !tierSwitchEnabled && styles.hitDisabled]}
      />

      {rods.map((rod, index) => {
        const slot = slots[index];
        if (!slot) return null;
        const selected = rod.rodId === selectedRodId;
        return (
          <View key={rod.rodId} style={[styles.slotFrame, slot]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rod.label}
              accessibilityState={{ selected }}
              onPress={() => onSelectRod(rod.rodId)}
              style={styles.slotHit}
            />
            {selected ? (
              <View
                pointerEvents="none"
                style={[
                  styles.selectionChrome,
                  {
                    top: SELECTION_CHROME_INSET_PX,
                    right: SELECTION_CHROME_INSET_PX,
                    bottom: SELECTION_CHROME_INSET_PX,
                    left: SELECTION_CHROME_INSET_PX,
                    transform: [
                      { translateX: SELECTED_SLOT_OFFSET_PX.x },
                      { translateY: SELECTED_SLOT_OFFSET_PX.y },
                    ],
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  hit: {
    position: "absolute",
    minWidth: 48,
    minHeight: 48,
  },
  hitDisabled: {
    opacity: 0.35,
  },
  slotFrame: {
    position: "absolute",
    minHeight: 48,
  },
  slotHit: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Soft graphite / pressed-paper indent — no floral language (Craft wreath owns that). */
  selectionChrome: {
    position: "absolute",
    backgroundColor: "rgba(75, 67, 60, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(75, 67, 60, 0.32)",
    borderRadius: 12,
  },
});
