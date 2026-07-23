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
  const summary = {
    outcome: claim.outcome,
    rarityIndicator: claim.rarityIndicator,
    wonderAwarded: claim.wonderAwarded,
    materialsAwarded: claim.materialsAwarded,
    claimedAt: claim.claimedAt,
  };
  if (claim.creatureTypeId != null) summary.creatureTypeId = claim.creatureTypeId;
  if (claim.creatureDisplayName != null) summary.creatureDisplayName = claim.creatureDisplayName;
  if (claim.spiritMessage != null) summary.spiritMessage = claim.spiritMessage;
  const reason = claim.metadata?.reason;
  if (typeof reason === "string" && reason.length > 0) {
    summary.metadata = { reason };
  }
  return summary;
}
