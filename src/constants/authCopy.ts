/** Sanctuary-toned auth microcopy (TASK H3 — code-rendered strings and a11y only). */

export const AUTH_INVALID_EMAIL_FORMAT = "That email doesn't look quite right — take your time.";

export const AUTH_WRONG_PASSWORD = "That password didn't match. Try again, or reset it.";

export const AUTH_NETWORK_ERROR =
  "You seem offline. Your information is safe — try again when you're connected.";

export const AUTH_UNKNOWN_ERROR = "Something didn't work — try again in a moment.";

export const AUTH_OPENING_GATE_ERROR = "One more moment — we're still opening the gate.";

export const AUTH_VERIFY_RESEND_SUCCESS = "We've sent a gentle nudge to your inbox.";

export const AUTH_VERIFY_STILL_WAITING_LINES = [
  "Still waiting —",
  "check your inbox and spam,",
  "then refresh again.",
  "We'll be right here when you're back.",
] as const;

export const AUTH_LOGIN_BUTTON_A11Y = "Step back in";
export const AUTH_FORGOT_PASSWORD_A11Y = "Forgot your password? We can help.";
export const AUTH_LOGIN_SIGNUP_LINK_A11Y = "New to the pond? Save your place";

export const AUTH_SIGNUP_CREATE_A11Y = "Save my place";
export const AUTH_SIGNUP_SIGNIN_LINK_A11Y = "I've been here before — Sign in";

export const AUTH_VERIFY_REFRESH_A11Y = "Check if your email is verified";
export const AUTH_VERIFY_RETURN_SIGNUP = "Begin again with a new email";
export const AUTH_VERIFY_WRONG_EMAIL_A11Y = "Use a different email";

export const AUTH_FINISH_EMAIL_HELPER =
  "Your place is waiting — sign in to step back into your sanctuary.";
export const AUTH_FINISH_EMAIL_VERIFIED_SIGNED_OUT =
  "Your email is verified. Step back in when you're ready.";
export const AUTH_FINISH_EMAIL_INVALID_LINK =
  "This link didn't open the gate — try again from your inbox.";
export const AUTH_FINISH_EMAIL_CONFIRMING = "Confirming your email…";
export const AUTH_FINISH_EMAIL_BACK_TO_SIGN_IN = "Step back in";
