import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";

/**
 * Dual-read helper (plan §8): prefer child-path DOB when present; else legacy root.
 * Callers that hydrate Flag A decide when to pass an active-child DOB.
 */
export function resolveChildBirthDate(args: {
  activeChildDob?: string | null;
  legacyRootDob?: string | null;
}): string | null {
  if (typeof args.activeChildDob === "string" && args.activeChildDob.trim()) {
    return args.activeChildDob.trim();
  }
  if (typeof args.legacyRootDob === "string" && args.legacyRootDob.trim()) {
    return args.legacyRootDob.trim();
  }
  return null;
}

export function resolveHeaderChildName(args: {
  summary: ChildrenSummaryEntry[] | null | undefined;
  activeChildId: string | null | undefined;
  legacyDisplayName?: string | null;
}): string {
  const active = args.summary?.find((s) => s.childId === args.activeChildId);
  if (active?.name?.trim()) return active.name.trim();
  const first = args.summary?.find((s) => s.childOrder === 1);
  if (first?.name?.trim()) return first.name.trim();
  return args.legacyDisplayName?.trim() || "Friend";
}
