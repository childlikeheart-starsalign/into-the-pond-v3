import type { UserCredential } from "firebase/auth";

import {
  AUTH_FIREBASE_CONFIG_ERROR,
  AUTH_INVALID_EMAIL_FORMAT,
  AUTH_NETWORK_ERROR,
  AUTH_WRONG_PASSWORD,
} from "@/src/constants/authCopy";

export const SIGN_IN_EMAIL_NOT_FOUND = "auth/sign-in-email-not-found";
export const SIGN_IN_WRONG_PASSWORD = "auth/sign-in-wrong-password";

const EMAIL_FORMAT_RE = /^\S+@\S+\.\S+$/;

export class SignInEmailNotFoundError extends Error {
  readonly code = SIGN_IN_EMAIL_NOT_FOUND;

  constructor(message = AUTH_INVALID_EMAIL_FORMAT) {
    super(message);
    this.name = "SignInEmailNotFoundError";
  }
}

export class SignInWrongPasswordError extends Error {
  readonly code = SIGN_IN_WRONG_PASSWORD;

  constructor(message = AUTH_WRONG_PASSWORD) {
    super(message);
    this.name = "SignInWrongPasswordError";
  }
}

export function isEmailFormatValid(email: string): boolean {
  return EMAIL_FORMAT_RE.test(email.trim());
}

export function firebaseAuthErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: string }).code);
  }
  return "";
}

export function isFetchSignInMethodsBlocked(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    code === "auth/operation-not-allowed" ||
    code === "auth/admin-restricted-operation" ||
    code === "auth/invalid-api-key"
  );
}

/** JS SDK cannot enumerate when API keys are restricted to native bundle IDs. */
export function isFetchSignInEnumerationUnavailable(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    isFetchSignInMethodsBlocked(error) ||
    code.includes("requests-from-this-ios-client-application") ||
    code.includes("requests-from-this-android-client-application")
  );
}

export function isFirebaseAuthConfigError(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    code.includes("api-key-expired") ||
    code.includes("requests-from-this-ios-client-application") ||
    code.includes("requests-from-this-android-client-application") ||
    code === "auth/invalid-api-key"
  );
}

export function isNetworkAuthError(error: unknown): boolean {
  return firebaseAuthErrorCode(error) === "auth/network-request-failed";
}

export function isPasswordCredentialError(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-login-credentials"
  );
}

export function isEmailSideAuthError(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    code === "auth/user-not-found" || code === "auth/invalid-email" || code === "auth/user-disabled"
  );
}

export function isCallableUnavailable(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return (
    code === "functions/not-found" ||
    code === "functions/unavailable" ||
    code === "functions/deadline-exceeded" ||
    code === "functions/internal" ||
    // IAM / App Check / invoker misconfig — registration gate is UX-only; fall through to sign-in.
    code === "functions/permission-denied" ||
    code === "functions/failed-precondition" ||
    code === "functions/unauthenticated"
  );
}

export type SignInClassificationDeps = {
  fetchSignInMethods: (email: string) => Promise<string[]>;
  checkEmailRegistered: (email: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
};

/**
 * Returns whether the email has a password sign-in method registered.
 * Uses fetchSignInMethodsForEmail when available; falls back to callable when empty/blocked.
 */
export async function isEmailRegisteredForPasswordSignIn(
  email: string,
  deps: SignInClassificationDeps,
): Promise<boolean> {
  const normalized = email.trim();
  let methods: string[] | null = null;

  try {
    methods = await deps.fetchSignInMethods(normalized);
  } catch (error) {
    if (isFetchSignInEnumerationUnavailable(error)) {
      // Platform-restricted API keys block enumeration from the JS SDK — sign in directly.
      return true;
    }
    throw error;
  }

  if (methods && methods.length > 0) {
    return methods.includes("password") || methods.includes("emailLink");
  }

  try {
    const registered = await deps.checkEmailRegistered(normalized);
    return registered;
  } catch (error) {
    if (isCallableUnavailable(error)) {
      // Callable not deployed or unreachable — attempt sign-in directly.
      return true;
    }
    throw error;
  }
}

/**
 * Login-screen sign-in: maps failures to email (22.png) vs password (23.png) artboards.
 */
export async function signInWithEmailForLoginScreen(
  email: string,
  password: string,
  deps: SignInClassificationDeps,
): Promise<UserCredential> {
  const normalized = email.trim();

  if (!isEmailFormatValid(normalized)) {
    throw new SignInEmailNotFoundError();
  }

  const registered = await isEmailRegisteredForPasswordSignIn(normalized, deps);
  if (!registered) {
    throw new SignInEmailNotFoundError();
  }

  try {
    return await deps.signIn(normalized, password);
  } catch (error) {
    if (isEmailSideAuthError(error)) {
      throw new SignInEmailNotFoundError();
    }
    if (isPasswordCredentialError(error)) {
      throw new SignInWrongPasswordError();
    }
    throw error;
  }
}

export function mapSignInScreenError(error: unknown): {
  emailError: string | null;
  passwordError: string | null;
  generalError: string | null;
} {
  if (error instanceof SignInEmailNotFoundError) {
    return { emailError: error.message, passwordError: null, generalError: null };
  }
  if (error instanceof SignInWrongPasswordError) {
    return { emailError: null, passwordError: error.message, generalError: null };
  }
  if (isEmailSideAuthError(error)) {
    return { emailError: AUTH_INVALID_EMAIL_FORMAT, passwordError: null, generalError: null };
  }
  if (isPasswordCredentialError(error)) {
    return { emailError: null, passwordError: AUTH_WRONG_PASSWORD, generalError: null };
  }
  if (isNetworkAuthError(error)) {
    return { emailError: null, passwordError: null, generalError: AUTH_NETWORK_ERROR };
  }
  if (isFirebaseAuthConfigError(error)) {
    return { emailError: null, passwordError: null, generalError: AUTH_FIREBASE_CONFIG_ERROR };
  }
  return { emailError: null, passwordError: null, generalError: null };
}
