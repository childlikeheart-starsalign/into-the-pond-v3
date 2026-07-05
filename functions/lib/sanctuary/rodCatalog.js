"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiRodIdToDomain = exports.uiBaitIdToTier = void 0;
exports.rodTypeKeyForId = rodTypeKeyForId;
const ROD_TYPE_KEYS = {
  basic: "basic",
  rare_fire: "rare1",
  rare_water: "rare2",
  rare_wind: "rare3",
  rare_electric: "rare4",
  rare_wildcard: "rare5",
  epic_fire: "epic1",
  epic_water: "epic2",
  epic_wind: "epic3",
  epic_electric: "epic4",
};
function rodTypeKeyForId(rodId) {
  return ROD_TYPE_KEYS[rodId] ?? "basic";
}
var castMapping_1 = require("./castMapping");
Object.defineProperty(exports, "uiBaitIdToTier", {
  enumerable: true,
  get: function () {
    return castMapping_1.uiBaitIdToTier;
  },
});
Object.defineProperty(exports, "uiRodIdToDomain", {
  enumerable: true,
  get: function () {
    return castMapping_1.uiRodIdToDomain;
  },
});
