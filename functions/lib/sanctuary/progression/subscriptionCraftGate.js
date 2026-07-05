"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxCraftableModuleId = maxCraftableModuleId;
exports.canCraftRodBySubscription = canCraftRodBySubscription;
const moduleRodMap_1 = require("./moduleRodMap");
/** Highest module whose rare rod can be crafted at this subscription tier. */
function maxCraftableModuleId(tier) {
  switch (tier) {
    case "free":
      return 0;
    case "wooden":
      return 3;
    case "fiberglass":
    case "lifetime":
      return 5;
    default:
      return 0;
  }
}
function canCraftRodBySubscription(rodId, tier) {
  if (rodId === "basic" || rodId === moduleRodMap_1.WILDCARD_ROD_ID) {
    return false;
  }
  if (moduleRodMap_1.RARE_ELEMENT_ROD_IDS.includes(rodId)) {
    const moduleId = (0, moduleRodMap_1.moduleIdForRareRod)(rodId);
    if (moduleId == null) return false;
    return moduleId <= maxCraftableModuleId(tier);
  }
  if (moduleRodMap_1.EPIC_ELEMENT_ROD_IDS.includes(rodId)) {
    return tier === "fiberglass" || tier === "lifetime";
  }
  return false;
}
