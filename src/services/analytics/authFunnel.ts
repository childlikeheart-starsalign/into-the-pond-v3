import type { PostHogEventProperties } from "@posthog/core";

import {
  AUTH_ANALYTICS_EVENTS,
  type AuthErrorType,
  type AuthFlow,
  type AuthMethod,
  type FocusedField,
  FRICTION_RECORDING_PROPS,
} from "@/src/constants/authAnalyticsEvents";
import { isAnalyticsCaptureDisabled } from "@/src/services/analytics/analyticsOptOut";
import { posthog } from "@/src/services/analytics/posthogClient";
import { firebaseAuth } from "@/src/services/firebase/client";

type FrictionReason = "error" | "retry_submit";

let gateViewedAtMs: number | null = null;
const signinAttemptCountByMethod = new Map<AuthMethod, number>();
const signupAttemptCountByMethod = new Map<AuthMethod, number>();
const signinStartedByMethod = new Set<AuthMethod>();
const signupStartedByMethod = new Set<AuthMethod>();
let frictionScore = 0;
let signupErrorCount = 0;
let hasStitchedIdentity = false;
let initialAuthMethod: AuthMethod | null = null;
let hitVerifyWall = false;

function capture(event: string, properties: PostHogEventProperties): void {
  if (!posthog || isAnalyticsCaptureDisabled()) return;
  posthog.capture(event, properties);
}

function identify(properties: PostHogEventProperties): void {
  if (!posthog || isAnalyticsCaptureDisabled()) return;
  const user = firebaseAuth.currentUser;
  if (!user) return;
  posthog.identify(user.uid, properties);
}

export function resetAuthFunnelSession(): void {
  gateViewedAtMs = null;
  signinAttemptCountByMethod.clear();
  signupAttemptCountByMethod.clear();
  signinStartedByMethod.clear();
  signupStartedByMethod.clear();
  frictionScore = 0;
  signupErrorCount = 0;
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
      ...FRICTION_RECORDING_PROPS,
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
  capture(AUTH_ANALYTICS_EVENTS.authGateInteraction, { action: "viewed" });
}

export function trackAuthGateInteraction(params: {
  action: "focus" | "oauth_tap";
  flow: AuthFlow;
  authMethod: AuthMethod;
  focusedField?: FocusedField;
}): void {
  capture(AUTH_ANALYTICS_EVENTS.authGateInteraction, {
    action: params.action,
    flow: params.flow,
    auth_method: params.authMethod,
    ...(params.focusedField ? { focused_field: params.focusedField } : {}),
  });
}

export function trackAuthSigninStarted(params: {
  authMethod: AuthMethod;
  focusedField?: FocusedField;
}): void {
  trackAuthGateInteraction({
    action: params.focusedField?.startsWith("oauth") ? "oauth_tap" : "focus",
    flow: "signin",
    authMethod: params.authMethod,
    focusedField: params.focusedField,
  });
  if (signinStartedByMethod.has(params.authMethod)) return;
  signinStartedByMethod.add(params.authMethod);
  capture(AUTH_ANALYTICS_EVENTS.authSigninStarted, {
    auth_method: params.authMethod,
    ...(params.focusedField ? { focused_field: params.focusedField } : {}),
  });
}

export function trackAuthSigninSubmitted(authMethod: AuthMethod): void {
  const attemptCount = (signinAttemptCountByMethod.get(authMethod) ?? 0) + 1;
  signinAttemptCountByMethod.set(authMethod, attemptCount);
  if (attemptCount > 1) {
    incrementFriction("retry_submit");
    capture(AUTH_ANALYTICS_EVENTS.authSigninErrorRecovery, {
      auth_method: authMethod,
      attempt_count: attemptCount,
      ...FRICTION_RECORDING_PROPS,
    });
  }
  capture(AUTH_ANALYTICS_EVENTS.authSigninSubmitted, {
    auth_method: authMethod,
    attempt_count: attemptCount,
  });
}

export function trackAuthSigninFailed(params: { errorCode: string; authMethod: AuthMethod }): void {
  const attemptCount = signinAttemptCountByMethod.get(params.authMethod) ?? 1;
  const errorType = mapErrorType(params.errorCode);
  const newScore = incrementFriction("error");
  capture(AUTH_ANALYTICS_EVENTS.authSigninFailed, {
    error_code: params.errorCode,
    error_type: errorType,
    auth_method: params.authMethod,
    is_retry: attemptCount > 1,
    attempt_count: attemptCount,
    ...FRICTION_RECORDING_PROPS,
    friction_reason: "auth_error",
    $set: { auth_friction_score: newScore },
  });
}

export function trackAuthSignupStarted(params: {
  authMethod: AuthMethod;
  focusedField?: FocusedField;
}): void {
  trackAuthGateInteraction({
    action: params.focusedField?.startsWith("oauth") ? "oauth_tap" : "focus",
    flow: "signup",
    authMethod: params.authMethod,
    focusedField: params.focusedField,
  });
  if (signupStartedByMethod.has(params.authMethod)) return;
  signupStartedByMethod.add(params.authMethod);
  capture(AUTH_ANALYTICS_EVENTS.authSignupStarted, {
    auth_method: params.authMethod,
    ...(params.focusedField ? { focused_field: params.focusedField } : {}),
  });
}

export function trackAuthSignupSubmitted(authMethod: AuthMethod): void {
  const attemptCount = (signupAttemptCountByMethod.get(authMethod) ?? 0) + 1;
  signupAttemptCountByMethod.set(authMethod, attemptCount);
  capture(AUTH_ANALYTICS_EVENTS.authSignupSubmitted, {
    auth_method: authMethod,
    attempt_count: attemptCount,
  });
}

export function trackAuthSignupFailed(params: { errorCode: string; authMethod: AuthMethod }): void {
  const attemptCount = signupAttemptCountByMethod.get(params.authMethod) ?? 1;
  const errorType = mapErrorType(params.errorCode);
  signupErrorCount += 1;
  const newScore = incrementFriction("error");
  capture(AUTH_ANALYTICS_EVENTS.authSignupFailed, {
    error_code: params.errorCode,
    error_type: errorType,
    auth_method: params.authMethod,
    is_retry: attemptCount > 1,
    attempt_count: attemptCount,
    signup_error_count: signupErrorCount,
    ...FRICTION_RECORDING_PROPS,
    friction_reason: "auth_error",
    $set: {
      auth_friction_score: newScore,
      signup_error_count: signupErrorCount,
    },
  });
}

export function trackAuthVerifyPending(): void {
  markHitVerifyWall();
  capture(AUTH_ANALYTICS_EVENTS.authVerifyPending, {
    action: "screen_viewed",
    time_since_gate_viewed_ms: getMsSinceGate(),
  });
}

export function trackAuthVerifyEmailOpened(): void {
  capture(AUTH_ANALYTICS_EVENTS.authVerifyPending, {
    action: "email_client_opened",
  });
}

export function trackAuthVerifyAbandoned(dwellSeconds: number): void {
  capture(AUTH_ANALYTICS_EVENTS.authVerifyAbandoned, {
    dwell_seconds: dwellSeconds,
    ...FRICTION_RECORDING_PROPS,
    friction_reason: "verify_dwell_45s",
  });
}

export function trackAuthVerifyResent(): void {
  capture(AUTH_ANALYTICS_EVENTS.authVerifyResent, {});
}

export function trackAuthVerifyCompleted(): void {
  capture(AUTH_ANALYTICS_EVENTS.authVerifyCompleted, {
    time_since_gate_viewed_ms: getMsSinceGate(),
  });
}

export function trackAuthSigninSuccess(params: { authMethod: AuthMethod }): void {
  capture(AUTH_ANALYTICS_EVENTS.authSigninSuccess, {
    auth_method: params.authMethod,
    total_duration_from_gate_ms: getMsSinceGate(),
  });
}

export function trackSanctuaryArrived(): void {
  capture(AUTH_ANALYTICS_EVENTS.sanctuaryArrived, {
    ms_since_gate_viewed: getMsSinceGate(),
  });
}

export function stitchPostHogIdentityAndAuthSuccess(authMethod: AuthMethod): void {
  if (!posthog || hasStitchedIdentity || isAnalyticsCaptureDisabled()) return;

  const user = firebaseAuth.currentUser;
  if (!user) return;

  hasStitchedIdentity = true;
  if (!initialAuthMethod) {
    initialAuthMethod = authMethod;
  }

  posthog.alias(user.uid);
  identify({
    $set_once: {
      initial_auth_method: initialAuthMethod,
      hit_verify_wall: hitVerifyWall,
      auth_method: initialAuthMethod,
      signup_date: user.metadata.creationTime ?? undefined,
    },
    $set: {
      auth_friction_score: frictionScore,
      signup_error_count: signupErrorCount,
      account_created_at: user.metadata.creationTime ?? undefined,
      auth_method: initialAuthMethod,
    },
  });

  trackAuthSigninSuccess({ authMethod: initialAuthMethod });
}

export function identifyReturningUser(): void {
  if (!posthog || hasStitchedIdentity || isAnalyticsCaptureDisabled()) return;
  const user = firebaseAuth.currentUser;
  if (!user) return;

  identify({
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
