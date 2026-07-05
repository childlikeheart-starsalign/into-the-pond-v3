import { Pressable, StyleSheet } from "react-native";

import type { FishingRodId } from "@/shared/sanctuary/types";
import type { CraftBenchCatalogTier } from "@/src/features/craftBench/craftBenchCatalog";

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
          <Pressable
            key={rod.rodId}
            accessibilityRole="button"
            accessibilityLabel={rod.label}
            onPress={() => onSelectRod(rod.rodId)}
            style={[styles.slot, slot, selected && styles.slotSelected]}
          />
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
  slot: {
    position: "absolute",
    minHeight: 48,
  },
  slotSelected: {
    backgroundColor: "rgba(239, 228, 218, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.45)",
    borderRadius: 8,
  },
});
