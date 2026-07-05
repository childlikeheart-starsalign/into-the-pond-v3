export type ElementType = "fire" | "water" | "wind" | "electric" | "any";
export type PoolTier = "common" | "rare" | "epic";
export type RodType =
  | "basic"
  | "rare1"
  | "rare2"
  | "rare3"
  | "rare4"
  | "rare5"
  | "epic1"
  | "epic2"
  | "epic3"
  | "epic4";

export interface Creature {
  creatureTypeId: string;
  displayName: string;
  poolTier: PoolTier;
  elementType: ElementType;
  rodRequired: RodType;
  peakWonderGate: number; // min peakWonder to unlock pool
  lessonId: string; // for revisit routing
  moduleId: number;
  visualMetaphor: string;
  masteryTip: string;
  partnerEcho?: string;
  illustrationAssetKey: string;
  netSlotIndex: number; // 0–149, fixed gallery position
}

export {
  DUPLICATE_CONSOLATION,
  ENCOUNTER_RATES,
  MISS_CONSOLATION,
} from "@/shared/sanctuary/fishing/encounterEngine";

export const WONDER_GATES: Record<RodType, number> = {
  basic: 0,
  rare1: 40,
  rare2: 40,
  rare3: 40,
  rare4: 40,
  rare5: 65,
  epic1: 90,
  epic2: 90,
  epic3: 90,
  epic4: 90,
};
