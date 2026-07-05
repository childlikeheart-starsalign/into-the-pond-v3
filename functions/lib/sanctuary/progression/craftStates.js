"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WILDCARD_GIFT_READY_COPY = exports.ROD_UX_LABELS = void 0;
exports.uxLabelForRodState = uxLabelForRodState;
exports.statusLineForRodState = statusLineForRodState;
exports.isRodInHand = isRodInHand;
exports.canStartCraft = canStartCraft;
exports.canCollectCraft = canCollectCraft;
exports.ROD_UX_LABELS = {
  locked: "Waiting",
  craftable: "Ready to begin",
  crafting: "Taking shape",
  ready: "Complete",
  equipped: "In hand",
};
exports.WILDCARD_GIFT_READY_COPY = "The pond feels wider now. Something is waiting.";
function uxLabelForRodState(state, options) {
  if (state === "ready" && options?.wildcardGift) {
    return "Complete";
  }
  return exports.ROD_UX_LABELS[state];
}
function statusLineForRodState(state, options) {
  if (state === "ready" && options?.wildcardGift) {
    return exports.WILDCARD_GIFT_READY_COPY;
  }
  switch (state) {
    case "locked":
      return "Not yet.";
    case "craftable":
      return "Something is taking shape.";
    case "crafting":
      return "The wood is settling.";
    case "ready":
      return "It's been waiting for you.";
    case "equipped":
      return "Currently in hand.";
    default:
      return "Something is taking shape.";
  }
}
function isRodInHand(state) {
  return state === "ready" || state === "equipped";
}
function canStartCraft(state) {
  return state === "craftable";
}
function canCollectCraft(state) {
  return state === "ready";
}
