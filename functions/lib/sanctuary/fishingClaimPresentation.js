"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFishingClaimPresentation = toFishingClaimPresentation;
exports.toClientClaimSummary = toClientClaimSummary;
function toFishingClaimPresentation(claim) {
  const caughtCreature =
    claim.creatureTypeId && claim.creatureDisplayName
      ? { id: claim.creatureTypeId, displayName: claim.creatureDisplayName }
      : null;
  const duplicateReward =
    claim.outcome === "duplicate"
      ? { wonder: claim.wonderAwarded, materials: claim.materialsAwarded }
      : null;
  const consolationReward =
    claim.outcome === "miss"
      ? {
          wonder: claim.wonderAwarded,
          materials: claim.materialsAwarded,
          spiritMessage: claim.spiritMessage,
        }
      : null;
  return {
    outcome: claim.outcome,
    caughtCreature,
    rarity: claim.rarityIndicator,
    poolTier: claim.poolTier,
    wonderDelta: claim.wonderAwarded,
    materialDelta: claim.materialsAwarded,
    duplicateReward,
    consolationReward,
    spiritMessage: claim.spiritMessage,
  };
}
/** Client-safe summary — no percentages exposed. */
function toClientClaimSummary(claim) {
  return {
    outcome: claim.outcome,
    rarityIndicator: claim.rarityIndicator,
    creatureTypeId: claim.creatureTypeId,
    creatureDisplayName: claim.creatureDisplayName,
    wonderAwarded: claim.wonderAwarded,
    materialsAwarded: claim.materialsAwarded,
    spiritMessage: claim.spiritMessage,
  };
}
