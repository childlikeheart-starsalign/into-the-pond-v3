import type { PlayerRodState, RodUxLabel } from "./types";

export const ROD_UX_LABELS: Record<PlayerRodState, RodUxLabel> = {
  locked: "Waiting",
  craftable: "Ready to begin",
  crafting: "Taking shape",
  ready: "Complete",
  equipped: "In hand",
};

export const WILDCARD_GIFT_READY_COPY = "The pond feels wider now. Something is waiting." as const;

export function uxLabelForRodState(
  state: PlayerRodState,
  options?: { wildcardGift?: boolean },
): RodUxLabel {
  if (state === "ready" && options?.wildcardGift) {
    return "Complete";
  }
  return ROD_UX_LABELS[state];
}

export function statusLineForRodState(
  state: PlayerRodState,
  options?: { wildcardGift?: boolean },
): string {
  if (state === "ready" && options?.wildcardGift) {
    return WILDCARD_GIFT_READY_COPY;
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

export function isRodInHand(state: PlayerRodState): boolean {
  return state === "ready" || state === "equipped";
}

export function canStartCraft(state: PlayerRodState): boolean {
  return state === "craftable";
}

export function canCollectCraft(state: PlayerRodState): boolean {
  return state === "ready";
}
