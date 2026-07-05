import type { FishingRodId } from "@/shared/sanctuary/types";

/** Emotional copy for the rod collection ceremony — learning, never power. */
const ROD_COLLECTION_COPY: Partial<Record<FishingRodId, string>> = {
  rare_fire: "You've spent time understanding difficult emotions.",
  epic_fire: "You've spent time understanding difficult emotions.",
  rare_water: "You've listened closely to feelings beneath the surface.",
  epic_water: "You've listened closely to feelings beneath the surface.",
  rare_wind: "You've noticed how gently moods can shift and settle.",
  epic_wind: "You've noticed how gently moods can shift and settle.",
  rare_electric: "You've stayed present when feelings arrive with intensity.",
  epic_electric: "You've stayed present when feelings arrive with intensity.",
  rare_wildcard: "Curiosity has revealed many sides of your child's world.",
};

export function rodCollectionCopyFor(rodId: FishingRodId): string {
  return (
    ROD_COLLECTION_COPY[rodId] ??
    "You stayed curious long enough for something meaningful to take shape."
  );
}
