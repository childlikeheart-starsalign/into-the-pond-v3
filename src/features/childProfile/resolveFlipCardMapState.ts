import type { RecentDeepCheckPoint } from "@/shared/childProfile/archetypeDeepCheck";
import { normalizeMapCheckSource } from "@/shared/childProfile/archetypeDeepCheck";
import { axesFromDisplayArchetype } from "@/shared/childProfile/archetypeCaptionBank";
import type { DisplayArchetypeName } from "@/shared/childProfile/archetypeQuickCheck";
import type { MapTrailPoint } from "@/src/constants/archetypeMapCopy";

export type FlipCardMapState = {
  axisA: number;
  axisB: number;
  /** Prior points oldest-first (excludes current). */
  trail: MapTrailPoint[];
  /** True when any trail points exist (Quick or Deep). */
  hasMapHistory: boolean;
  /**
   * True when at least one Deep Check is in the trail.
   * Used for Deep Check first vs retake CTA (not for map presence).
   */
  hasDeepHistory: boolean;
  /** Current check completion ISO — for journal margin; null without history. */
  observedAt: string | null;
  /** Source of the current (newest) marker. */
  currentSource: "quick" | "deep" | null;
};

/**
 * Prefer latest shared map-trail coordinates + priors; else Quick Check display presets.
 * `recentDeepChecks` is newest-first (Quick + Deep mixed, Firestore key name historical).
 */
export function resolveFlipCardMapState(
  displayName: DisplayArchetypeName,
  recentDeepChecks: readonly RecentDeepCheckPoint[] | null | undefined,
): FlipCardMapState {
  const recent = Array.isArray(recentDeepChecks) ? recentDeepChecks : [];
  if (recent.length === 0) {
    const axes = axesFromDisplayArchetype(displayName);
    return {
      ...axes,
      trail: [],
      hasMapHistory: false,
      hasDeepHistory: false,
      observedAt: null,
      currentSource: null,
    };
  }
  const current = recent[0]!;
  const currentSource = normalizeMapCheckSource(current.source);
  const priorsOldestFirst: MapTrailPoint[] = [...recent.slice(1)].reverse().map((p) => ({
    axisA: p.axisA,
    axisB: p.axisB,
    completedAt: p.completedAt,
    source: normalizeMapCheckSource(p.source),
  }));
  const hasDeepHistory = recent.some((p) => normalizeMapCheckSource(p.source) === "deep");
  return {
    axisA: current.axisA,
    axisB: current.axisB,
    trail: priorsOldestFirst,
    hasMapHistory: true,
    hasDeepHistory,
    observedAt: current.completedAt,
    currentSource,
  };
}
