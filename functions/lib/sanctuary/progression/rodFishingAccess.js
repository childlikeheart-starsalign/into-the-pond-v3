"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterCreaturesByRodPermission = filterCreaturesByRodPermission;
exports.isRodOwnedForFishing = isRodOwnedForFishing;
const fishingPermissions_1 = require("./fishingPermissions");
const POOL_TIER_RANK = {
  common: 0,
  rare: 1,
  epic: 2,
};
/** Client/server shared pool filter for rod fishing permissions. */
function filterCreaturesByRodPermission(rodId, catalog) {
  const permission = (0, fishingPermissions_1.fishingPermissionForRod)(rodId);
  const maxRank = POOL_TIER_RANK[permission.maxTier];
  return catalog.filter((creature) => {
    const tierRank = POOL_TIER_RANK[creature.poolTier];
    if (tierRank > maxRank) return false;
    if (permission.elements.includes("any")) return true;
    return permission.elements.includes(creature.elementType);
  });
}
function isRodOwnedForFishing(state) {
  return state === "ready" || state === "equipped";
}
