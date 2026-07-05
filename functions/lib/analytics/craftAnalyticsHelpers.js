"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionTiming = collectionTiming;
exports.craftDurationHours = craftDurationHours;
exports.rodTierForAnalytics = rodTierForAnalytics;
exports.rodElementForAnalytics = rodElementForAnalytics;
exports.collectionTimingForRod = collectionTimingForRod;
const craftCosts_1 = require("../sanctuary/progression/craftCosts");
const ROD_TIER = {
  basic: "basic",
  rare_fire: "rare",
  rare_water: "rare",
  rare_wind: "rare",
  rare_electric: "rare",
  rare_wildcard: "rare",
  epic_fire: "epic",
  epic_water: "epic",
  epic_wind: "epic",
  epic_electric: "epic",
};
const ROD_ELEMENT = {
  basic: "any",
  rare_fire: "fire",
  rare_water: "water",
  rare_wind: "wind",
  rare_electric: "electric",
  rare_wildcard: "any",
  epic_fire: "fire",
  epic_water: "water",
  epic_wind: "wind",
  epic_electric: "electric",
};
function collectionTiming(hoursSinceReady) {
  if (hoursSinceReady <= 24) return "on_time";
  if (hoursSinceReady <= 24 * 7) return "late";
  return "very_late";
}
function craftDurationHours(rodId) {
  return (0, craftCosts_1.getCraftDurationMs)(rodId) / (60 * 60 * 1000);
}
function rodTierForAnalytics(rodId) {
  return ROD_TIER[rodId] ?? "basic";
}
function rodElementForAnalytics(rodId) {
  return ROD_ELEMENT[rodId] ?? "any";
}
function collectionTimingForRod(rodId, craftStartedAt, now) {
  if (craftStartedAt == null) return "on_time";
  const durationMs = (0, craftCosts_1.getCraftDurationMs)(rodId);
  if (durationMs <= 0) return "on_time";
  const readyAt = craftStartedAt + durationMs;
  const hoursSinceReady = (now - readyAt) / (60 * 60 * 1000);
  return collectionTiming(hoursSinceReady);
}
