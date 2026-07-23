import { FirebaseError } from "firebase/app";

export type ClaimErrorClassification = {
  /** Safe to clear local cast cache after reconcile confirms server has no cast. */
  terminal: boolean;
  /** Caller may retry without treating local cache as corrupt. */
  retrySafe: boolean;
  /** Hook may schedule automatic claim retries (false for auth — hammering won't help). */
  autoRetry: boolean;
  message: string;
  code: string;
};

export type ClaimErrorContext = {
  /** When true, auth-class errors mean service/token failure — not a logout. */
  signedIn?: boolean;
};

function errorCode(error: unknown): string {
  if (error instanceof FirebaseError) return error.code;
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code ?? "unknown");
  }
  return "unknown";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Could not reel in this cast. Try again in a moment.";
}

function authFailureMessage(signedIn: boolean): string {
  if (signedIn) {
    return "Couldn't reach the fishing service.\nTry again in a moment.";
  }
  return "Sign in again to reel in your cast.";
}

/**
 * Classify claim failures. Unclassified errors default to retry-safe
 * (do not clear local cast on ambiguous failure).
 */
export function classifyClaimError(
  error: unknown,
  context?: ClaimErrorContext,
): ClaimErrorClassification {
  const code = errorCode(error);
  const message = errorMessage(error);
  const normalized = message.toLowerCase();
  const signedIn = context?.signedIn === true;

  if (
    code === "functions/unauthenticated" ||
    code === "unauthenticated" ||
    code === "permission-denied" ||
    code === "functions/permission-denied"
  ) {
    return {
      terminal: false,
      retrySafe: true,
      autoRetry: false,
      message: authFailureMessage(signedIn),
      code,
    };
  }

  if (normalized.includes("no active cast")) {
    return {
      terminal: true,
      retrySafe: false,
      autoRetry: false,
      message: "This cast was already reeled in.",
      code,
    };
  }

  if (
    normalized.includes("recall window") ||
    normalized.includes("cannot be recalled") ||
    normalized.includes("too many recalls")
  ) {
    return {
      terminal: false,
      retrySafe: false,
      autoRetry: false,
      message: normalized.includes("too many")
        ? "Too many recalls recently. Let this cast finish."
        : "The line has settled — this cast will finish on its own.",
      code,
    };
  }

  if (normalized.includes("not ready")) {
    return {
      terminal: false,
      retrySafe: true,
      autoRetry: true,
      message: "Still waiting for a bite. Try again in a moment.",
      code,
    };
  }

  if (
    code === "functions/unavailable" ||
    code === "functions/deadline-exceeded" ||
    code === "functions/internal" ||
    code === "unavailable" ||
    code === "deadline-exceeded"
  ) {
    return {
      terminal: false,
      retrySafe: true,
      autoRetry: true,
      message: "The pond is busy. Your cast is still waiting — try again shortly.",
      code,
    };
  }

  // Default: ambiguous → keep local cast, retry-safe with gentle auto-retry.
  return {
    terminal: false,
    retrySafe: true,
    autoRetry: true,
    message: "Could not reel in this cast. Try again in a moment.",
    code: code || "unknown",
  };
}

/**
 * Terminal claim failures unlock the pond. `retrySafe` means keep the cache on
 * ambiguous failure; clear when terminal or when reconcile shows no server cast.
 */
export function shouldClearCastAfterClaimFailure(input: {
  terminal: boolean;
  serverHasActiveCast: boolean;
}): boolean {
  return input.terminal || !input.serverHasActiveCast;
}
