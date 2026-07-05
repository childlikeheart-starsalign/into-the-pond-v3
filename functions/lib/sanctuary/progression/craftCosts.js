"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRAFTABLE_ROD_IDS =
  exports.PHASE1_CRAFTABLE_RARE_ROD_IDS =
  exports.ROD_CRAFT_DURATION_MS_BY_ID =
  exports.ROD_PROGRESSION_CRAFT_COSTS =
    void 0;
exports.getCraftCost = getCraftCost;
exports.getCraftDurationMs = getCraftDurationMs;
exports.hasCraftTimer = hasCraftTimer;
exports.craftCompletesAt = craftCompletesAt;
exports.isCraftTimerComplete = isCraftTimerComplete;
const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Rod progression v2 craft costs — single source of truth.
 * Wildcard is a journey gift (0 / 0). Epic rows are incremental craft costs only.
 */
exports.ROD_PROGRESSION_CRAFT_COSTS = {
  basic: { parts: 0, storedWonder: 0 },
  rare_fire: { parts: 4, storedWonder: 25 },
  rare_water: { parts: 5, storedWonder: 35 },
  rare_wind: { parts: 5, storedWonder: 35 },
  rare_electric: { parts: 6, storedWonder: 45 },
  rare_wildcard: { parts: 0, storedWonder: 0 },
  epic_fire: { parts: 8, storedWonder: 25 },
  epic_water: { parts: 8, storedWonder: 25 },
  epic_wind: { parts: 8, storedWonder: 25 },
  epic_electric: { parts: 8, storedWonder: 25 },
};
/** Craft timer duration per rod (ms). Wildcard has no timer. */
exports.ROD_CRAFT_DURATION_MS_BY_ID = {
  rare_fire: 1 * DAY_MS,
  rare_water: 2 * DAY_MS,
  rare_wind: 2 * DAY_MS,
  rare_electric: 3 * DAY_MS,
  epic_fire: 5 * DAY_MS,
  epic_water: 5 * DAY_MS,
  epic_wind: 5 * DAY_MS,
  epic_electric: 5 * DAY_MS,
};
exports.PHASE1_CRAFTABLE_RARE_ROD_IDS = ["rare_fire", "rare_water", "rare_wind", "rare_electric"];
exports.CRAFTABLE_ROD_IDS = [
  ...exports.PHASE1_CRAFTABLE_RARE_ROD_IDS,
  "epic_fire",
  "epic_water",
  "epic_wind",
  "epic_electric",
];
function getCraftCost(rodId) {
  return exports.ROD_PROGRESSION_CRAFT_COSTS[rodId];
}
function getCraftDurationMs(rodId) {
  return exports.ROD_CRAFT_DURATION_MS_BY_ID[rodId] ?? 0;
}
function hasCraftTimer(rodId) {
  return getCraftDurationMs(rodId) > 0;
}
function craftCompletesAt(rodId, craftStartedAt) {
  return craftStartedAt + getCraftDurationMs(rodId);
}
function isCraftTimerComplete(rodId, craftStartedAt, now = Date.now()) {
  if (craftStartedAt == null) return false;
  const duration = getCraftDurationMs(rodId);
  if (duration <= 0) return false;
  return now >= craftStartedAt + duration;
}
