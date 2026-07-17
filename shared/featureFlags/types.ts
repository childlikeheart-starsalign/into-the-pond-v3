/** Minimal allowlist rollout — not a general experimentation platform. */
export type FeatureFlagRolloutState = "off" | "allowlist" | "all";

export type FeatureFlagDoc = {
  rolloutState: FeatureFlagRolloutState;
  allowlistUids: string[];
};

/** Well-known flag document ids under `featureFlags/{flagName}`. */
export const FEATURE_FLAG_NAMES = {
  /** Flag A — dual-read narrative/Well/Atlas prefer children/{id} when present. */
  childMigrationDualRead: "childMigrationDualRead",
  /** Flag B — Create Child Profile route + Gate add-child + switcher UI. */
  createChildProfileUi: "createChildProfileUi",
  /** New split-prologue dialogue onboarding (Gate → /prologue → signup → Part 2). */
  newOnboardingEnabled: "newOnboardingEnabled",
} as const;

export type KnownFeatureFlagName =
  (typeof FEATURE_FLAG_NAMES)[keyof typeof FEATURE_FLAG_NAMES];
