import { HttpsError, onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";

const EMAIL_FORMAT_RE = /^\S+@\S+\.\S+$/;

type CheckSignInEmailRegisteredRequest = {
  email?: unknown;
};

type CheckSignInEmailRegisteredResponse = {
  registered: boolean;
};

/**
 * Unauthenticated lookup for login artboard routing (22 vs 23).
 * Rate limiting should be added before broad public launch if abuse appears.
 */
export const checkSignInEmailRegisteredCallable = onCall<
  CheckSignInEmailRegisteredRequest,
  Promise<CheckSignInEmailRegisteredResponse>
>(async (request) => {
  const email = typeof request.data?.email === "string" ? request.data.email.trim() : "";
  if (!email || !EMAIL_FORMAT_RE.test(email)) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }

  try {
    await admin.auth().getUserByEmail(email);
    return { registered: true };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "auth/user-not-found") {
      return { registered: false };
    }
    throw new HttpsError("internal", "Unable to verify email registration.");
  }
});
