/**
 * Fishing/craft SFX sources per `docs/handoff/Oscar/deliverables/01-audio-manifest.csv`.
 */
export type FishingCraftSoundSlot =
  | "castSplash"
  | "pondWaitingAmbient"
  | "claimCatch"
  | "claimDuplicate"
  | "claimMissChance"
  | "claimMissWonderGate"
  | "craftBegin"
  | "craftReady"
  | "craftEquip";

export const fishingCraftAudio: Record<FishingCraftSoundSlot, number> = {
  castSplash: require("@/assets/audio/fishing/cast-splash.mp3"),
  pondWaitingAmbient: require("@/assets/audio/fishing/pond-waiting-ambient.mp3"),
  claimCatch: require("@/assets/audio/fishing/claim-catch.mp3"),
  claimDuplicate: require("@/assets/audio/fishing/claim-duplicate.mp3"),
  claimMissChance: require("@/assets/audio/fishing/claim-miss-chance.mp3"),
  claimMissWonderGate: require("@/assets/audio/fishing/claim-miss-wonder-gate.mp3"),
  craftBegin: require("@/assets/audio/fishing/craft-begin.mp3"),
  craftReady: require("@/assets/audio/fishing/craft-ready.mp3"),
  craftEquip: require("@/assets/audio/fishing/craft-equip.mp3"),
};
