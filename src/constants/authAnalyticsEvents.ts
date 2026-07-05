export const AUTH_ANALYTICS_EVENTS = {
  authGateInteraction: "auth_gate_interaction",
  authSignupStarted: "auth_signup_started",
  authSignupSubmitted: "auth_signup_submitted",
  authSignupFailed: "auth_signup_failed",
  authSignupAbandoned: "auth_signup_abandoned",
  authSigninStarted: "auth_signin_started",
  authSigninSubmitted: "auth_signin_submitted",
  authSigninFailed: "auth_signin_failed",
  authSigninErrorRecovery: "auth_signin_error_recovery",
  authVerifyPending: "auth_verify_pending",
  authVerifyResent: "auth_verify_resent",
  authVerifyAbandoned: "auth_verify_abandoned",
  authVerifyCompleted: "auth_verify_completed",
  authSigninSuccess: "auth_signin_success",
  sanctuaryArrived: "sanctuary_arrived",
  authFrictionSignal: "auth_friction_signal",
} as const;

export const AUTH_SERVER_EVENTS = {
  accountCreatedBackend: "account_created_backend",
  verifyWallAbandoned: "verify_wall_abandoned",
  emailVerifiedBackend: "email_verified_backend",
} as const;

export type AuthMethod = "email" | "apple" | "google";

export type FocusedField = "email" | "password" | "oauth_apple" | "oauth_google";

export type AuthErrorType = "validation" | "credentials" | "network" | "provider" | "unknown";

export type AuthFlow = "signin" | "signup";

export const FRICTION_RECORDING_PROPS = {
  friction_recording_tag: true,
} as const;
