export const AUTH_ANALYTICS_EVENTS = {
  authGateViewed: "auth_gate_viewed",
  authInteractionStarted: "auth_interaction_started",
  authFormSubmitted: "auth_form_submitted",
  authErrorEncountered: "auth_error_encountered",
  verifyScreenViewed: "verify_screen_viewed",
  verifyEmailOpened: "verify_email_opened",
  authSuccess: "auth_success",
  sanctuaryEntered: "sanctuary_entered",
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

export const FRICTION_RECORDING_PROPS = {
  friction_recording_tag: true,
} as const;
