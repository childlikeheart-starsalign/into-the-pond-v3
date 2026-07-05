"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROD_FISHING_PERMISSIONS = void 0;
exports.fishingPermissionForRod = fishingPermissionForRod;
/**
 * Which creature pools a domain rod may access at claim time.
 * Wonder gate at claim is unchanged — this layer filters eligible creatures only.
 */
exports.ROD_FISHING_PERMISSIONS = {
  basic: { elements: ["any"], maxTier: "common" },
  rare_fire: { elements: ["fire"], maxTier: "rare" },
  rare_water: { elements: ["water"], maxTier: "rare" },
  rare_wind: { elements: ["wind"], maxTier: "rare" },
  rare_electric: { elements: ["electric"], maxTier: "rare" },
  rare_wildcard: {
    elements: ["water", "wind", "fire", "electric"],
    maxTier: "rare",
  },
  epic_fire: { elements: ["fire"], maxTier: "epic" },
  epic_water: { elements: ["water"], maxTier: "epic" },
  epic_wind: { elements: ["wind"], maxTier: "epic" },
  epic_electric: { elements: ["electric"], maxTier: "epic" },
};
function fishingPermissionForRod(rodId) {
  return exports.ROD_FISHING_PERMISSIONS[rodId];
}
