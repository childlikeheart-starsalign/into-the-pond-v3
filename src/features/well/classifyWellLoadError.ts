import { FirebaseError } from "firebase/app";

export type WellLoadError = "MISSING_BIRTH_DATE" | "OFFLINE" | "FUNCTIONS_UNAVAILABLE" | "UNKNOWN";

const OFFLINE_CODES = new Set([
  "unavailable",
  "functions/unavailable",
  "auth/network-request-failed",
  "firestore/unavailable",
]);

const FUNCTIONS_UNAVAILABLE_CODES = new Set([
  "functions/not-found",
  "not-found",
  "functions/internal",
  "functions/deadline-exceeded",
  "functions/failed-precondition",
]);

/** Map thrown Well load errors to user-facing error codes (excluding structured API errors). */
export function classifyWellLoadError(
  error: unknown,
): Exclude<WellLoadError, "MISSING_BIRTH_DATE"> {
  if (error instanceof FirebaseError) {
    if (OFFLINE_CODES.has(error.code)) return "OFFLINE";
    if (FUNCTIONS_UNAVAILABLE_CODES.has(error.code)) return "FUNCTIONS_UNAVAILABLE";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("offline")) {
      return "OFFLINE";
    }
  }

  return "UNKNOWN";
}
