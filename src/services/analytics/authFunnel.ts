import type { PostHogEventProperties } from "@posthog/core";

import {
  AUTH_ANALYTICS_EVENTS,
  type AuthErrorType,
  type AuthMethod,
  type FocusedField,
  FRICTION_RECORDING_PROPS,
} from "@/src/constants/authAnalyticsEvents";
import { posthog } from "@/src/services/analytics/posthogClient";
import { firebaseAuth } from "@/src/services/firebase/client";

type FrictionReason = "error" | "retry_submit";

let gateViewedAtMs: number | null = null;
const attemptCountByMethod = new Map<AuthMethod, number>();
const interactionStartedByMethod = new Set<AuthMethod>();
let frictionScore = 0;
let hasStitchedIdentity = false;
let initialAuthMethod: AuthMethod | null = null;
let hitVerifyWall = false;

function capture(event: string, properties: PostHogEventProperties): void {
  posthog?.capture(event, properties);
}

export function resetAuthFunnelSession(): void {
  gateViewedAtMs = null;
  attemptCountByMethod.clear();
  interactionStartedByMethod.clear();
  frictionScore = 0;
  hasStitchedIdentity = false;
  initialAuthMethod = null;
  hitVerifyWall = false;
}

export function getHasStitchedIdentity(): boolean {
  return hasStitchedIdentity;
}

export function markGateViewed(): void {
  if (gateViewedAtMs == null) {
    gateViewedAtMs = Date.now();
  }
}

export function getMsSinceGate(): number {
  if (gateViewedAtMs == null) return 0;
  return Math.max(0, Date.now() - gateViewedAtMs);
}

export function incrementFriction(reason: FrictionReason): number {
  frictionScore += 1;
  if (reason === "retry_submit") {
    capture(AUTH_ANALYTICS_EVENTS.authFrictionSignal, {
      friction_reason: "rage_click",
      friction_score: frictionScore,
    });
  }
  return frictionScore;
}

export function getFrictionScore(): number {
  return frictionScore;
}

export function markHitVerifyWall(): void {
  hitVerifyWall = true;
}

export function mapErrorType(errorCode: string): AuthErrorType {
  if (
    errorCode === "auth/invalid-email" ||
    errorCode === "auth/weak-password" ||
    errorCode === "auth/missing-password"
  ) {
    return "validation";
  }
  if (
    errorCode === "auth/wrong-password" ||
    errorCode === "auth/user-not-found" ||
    errorCode === "auth/invalid-credential"
  ) {
    return "credentials";
  }
  if (errorCode === "auth/network-request-failed") {
    return "network";
  }
  if (
    errorCode.startsWith("apple/") ||
    errorCode.startsWith("google/") ||
    errorCode === "auth/popup-closed-by-user"
  ) {
    return "provider";
  }
  return "unknown";
}

export function trackAuthGateViewed(): void {
  markGateViewed();
  capture(AUTH_ANALYTICS_EVENTS.authGateViewed, {});
}

export function trackAuthInteractionStarted(params: {
  focusedField: FocusedField;
  authMethodAttempted: AuthMethod;
}): void {
  if (interactionStartedByMethod.has(params.authMethodAttempted)) return;
  interactionStartedByMethod.add(params.authMethodAttempted);
  capture(AUTH_ANALYTICS_EVENTS.authInteractionStarted, params);
}

export function trackAuthFormSubmitted(authMethod: AuthMethod): void {
  const attemptCount = (attemptCountByMethod.get(authMethod) ?? 0) + 1;
  attemptCountByMethod.set(authMethod, attemptCount);
  if (attemptCount > 1) {
    incrementFriction("retry_submit");
  }
  capture(AUTH_ANALYTICS_EVENTS.authFormSubmitted, {
    auth_method: authMethod,
    attempt_count: attemptCount,
  });
}

export function trackAuthErrorEncountered(params: {
  errorCode: string;
  authMethod: AuthMethod;
}): void {
  const attemptCount = attemptCountByMethod.get(params.authMethod) ?? 1;
  const errorType = mapErrorType(params.errorCode);
  const newScore = incrementFriction("error");
  capture(AUTH_ANALYTICS_EVENTS.authErrorEncountered, {
    error_code: params.errorCode,
    error_type: errorType,
    auth_method: params.authMethod,
    is_retry: attemptCount > 1,
    ...FRICTION_RECORDING_PROPS,
    friction_reason: "auth_error",
    $set: { auth_friction_score: newScore },
  });
}

export function trackVerifyScreenViewed(): void {
  markHitVerifyWall();
  capture(AUTH_ANALYTICS_EVENTS.verifyScreenViewed, {
    time_since_gate_viewed_ms: getMsSinceGate(),
  });
}

export function trackVerifyEmailOpened(): void {
  capture(AUTH_ANALYTICS_EVENTS.verifyEmailOpened, {});
}

export function trackVerifyDwellFriction(dwellMs: number): void {
  capture(AUTH_ANALYTICS_EVENTS.authFrictionSignal, {
    ...FRICTION_RECORDING_PROPS,
    friction_reason: "verify_dwell_45s",
    dwell_ms: dwellMs,
  });
}

export function trackAuthSuccess(params: { authMethod: AuthMethod }): void {
  capture(AUTH_ANALYTICS_EVENTS.authSuccess, {
    auth_method: params.authMethod,
    total_duration_from_gate_ms: getMsSinceGate(),
  });
}

export function trackSanctuaryEntered(params: {
  isFirstEntry: boolean;
  totalOnboardingDurationMs: number;
}): void {
  capture(AUTH_ANALYTICS_EVENTS.sanctuaryEntered, {
    is_first_entry: params.isFirstEntry,
    total_onboarding_duration_ms: params.totalOnboardingDurationMs,
  });
}

export function stitchPostHogIdentityAndAuthSuccess(authMethod: AuthMethod): void {
  if (!posthog || hasStitchedIdentity) return;

  const user = firebaseAuth.currentUser;
  if (!user) return;

  hasStitchedIdentity = true;
  if (!initialAuthMethod) {
    initialAuthMethod = authMethod;
  }

  posthog.alias(user.uid);
  posthog.identify(user.uid, {
    $set_once: {
      initial_auth_method: initialAuthMethod,
      hit_verify_wall: hitVerifyWall,
    },
    $set: {
      auth_friction_score: frictionScore,
      account_created_at: user.metadata.creationTime ?? undefined,
    },
  });

  trackAuthSuccess({ authMethod: initialAuthMethod });
}

export function identifyReturningUser(): void {
  if (!posthog || hasStitchedIdentity) return;
  const user = firebaseAuth.currentUser;
  if (!user) return;

  posthog.identify(user.uid, {
    $set: {
      auth_friction_score: frictionScore,
      account_created_at: user.metadata.creationTime ?? undefined,
    },
  });
}

export function setInitialAuthMethod(method: AuthMethod): void {
  if (!initialAuthMethod) {
    initialAuthMethod = method;
  }
}

export function resolveAuthMethodFromUser(): AuthMethod {
  const user = firebaseAuth.currentUser;
  const provider = user?.providerData[0]?.providerId;
  if (provider === "apple.com") return "apple";
  if (provider === "google.com") return "google";
  return "email";
}
