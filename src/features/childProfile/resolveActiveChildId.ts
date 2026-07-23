import {
  canAccessChild,
  resolveAccountTier,
  type AccountSubscriptionLike,
} from "@/shared/childProfile/tierAccess";
import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";

/**
 * If activeChildId is inaccessible under current tier, fall back to childOrder === 1.
 * Never deletes data — access only (plan §3).
 */
export function resolveActiveChildIdAfterEntitlement(
  activeChildId: string | null | undefined,
  summary: ChildrenSummaryEntry[] | null | undefined,
  subscription: AccountSubscriptionLike,
): string | null {
  if (!Array.isArray(summary) || summary.length === 0) {
    return activeChildId ?? null;
  }
  const tier = resolveAccountTier(subscription);
  const byId = new Map(summary.map((s) => [s.childId, s]));
  const active = activeChildId ? byId.get(activeChildId) : undefined;
  if (active && canAccessChild(active.childOrder, tier)) {
    return active.childId;
  }
  const first = summary.find((s) => s.childOrder === 1) ?? summary[0];
  return first?.childId ?? null;
}
