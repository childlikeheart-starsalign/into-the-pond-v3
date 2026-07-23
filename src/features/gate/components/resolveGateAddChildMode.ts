import {
  HARD_CHILD_CAP,
  canCreateNextChild,
  resolveAccountTier,
  type AccountSubscriptionLike,
} from "@/shared/childProfile/tierAccess";

export type GateAddChildMode =
  | { kind: "hidden" }
  | { kind: "at_cap"; body: string }
  | { kind: "invite_upgrade"; body: string; cta: string }
  | { kind: "add_child"; body: string; cta: string };

/**
 * Pure Gate card decision (plan §6). Free never creates an empty child slot —
 * upgrade CTA only. Draft copy strings.
 */
export function resolveGateAddChildMode(args: {
  flagEnabled: boolean;
  childCount: number;
  hasPaidRod: boolean;
  subscription: AccountSubscriptionLike;
}): GateAddChildMode {
  if (!args.flagEnabled) return { kind: "hidden" };

  const tier = resolveAccountTier(args.subscription);
  const createCheck = canCreateNextChild(args.childCount, tier);

  if (args.childCount >= HARD_CHILD_CAP || (!createCheck.ok && createCheck.reason === "hard_cap")) {
    return {
      kind: "at_cap",
      body: "[draft] All three little stories have their place here.",
    };
  }

  if (!args.hasPaidRod || tier === "free") {
    return {
      kind: "invite_upgrade",
      body: "[draft] One little story has begun here. When your family is ready, a Wooden path can make room for another.",
      cta: "[draft] See the Wooden path",
    };
  }

  if (createCheck.ok) {
    return {
      kind: "add_child",
      body: "[draft] There's room in the pond for another little story.",
      cta: "[draft] Add another child",
    };
  }

  return {
    kind: "at_cap",
    body: "[draft] All three little stories have their place here.",
  };
}
