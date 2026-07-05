import Constants from "expo-constants";
import * as Linking from "expo-linking";
import type { ActionCodeSettings } from "firebase/auth";

import {
  AUTH_INVALID_EMAIL_FORMAT,
  AUTH_NETWORK_ERROR,
  AUTH_UNKNOWN_ERROR,
  AUTH_WRONG_PASSWORD,
} from "@/src/constants/authCopy";
import { isAllowedAuthDeepLinkUrl as isAllowedAuthDeepLinkUrlCore } from "@/shared/auth/authDeepLinkValidation";

export { normalizeFirebaseAuthHost } from "@/shared/auth/authDeepLinkValidation";

/** Matches native bundle / package identifiers in app config for Firebase Auth action emails. */
export const IOS_BUNDLE_ID = "com.intothepond.app.v3";
export const ANDROID_PACKAGE = "com.intothepond.app.v3";

export type ParsedFirebaseAuthLink = {
  mode?: string;
  oobCode?: string;
  apiKey?: string;
  lang?: string;
};

function pickQueryParam(queryParams: Record<string, unknown>, key: string): string | undefined {
  const v = queryParams[key];
  return typeof v === "string" ? v : undefined;
}

type AuthDeepLinkAllowOptions = {
  authDomain?: string;
  appScheme?: string;
};

/**
 * Rejects auth action URLs from unknown hosts/schemes before routing oobCode handlers.
 * HTTPS links must match configured firebaseAuthDomain; custom scheme must match app scheme.
 */
export function isAllowedAuthDeepLinkUrl(
  rawUrl: string,
  options?: AuthDeepLinkAllowOptions,
): boolean {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const authDomainRaw =
    options?.authDomain ??
    (typeof extra?.firebaseAuthDomain === "string" ? extra.firebaseAuthDomain : "");
  const appScheme =
    options?.appScheme ??
    (typeof Constants.expoConfig?.scheme === "string"
      ? Constants.expoConfig.scheme
      : "intothepond");

  return isAllowedAuthDeepLinkUrlCore(rawUrl, { authDomain: authDomainRaw, appScheme });
}

export function parseFirebaseAuthLink(rawUrl: string): ParsedFirebaseAuthLink | null {
  try {
    const parsed = Linking.parse(rawUrl);
    const fromLinking = parsed.queryParams ?? {};

    let mode = pickQueryParam(fromLinking as Record<string, unknown>, "mode");
    let oobCode = pickQueryParam(fromLinking as Record<string, unknown>, "oobCode");
    let apiKey = pickQueryParam(fromLinking as Record<string, unknown>, "apiKey");
    let lang = pickQueryParam(fromLinking as Record<string, unknown>, "lang");

    const qIdx = rawUrl.indexOf("?");
    const hashIdx = rawUrl.indexOf("#");
    const querySlice =
      qIdx >= 0 ? rawUrl.slice(qIdx + 1, hashIdx >= 0 && hashIdx > qIdx ? hashIdx : undefined) : "";
    if (querySlice) {
      const sp = new URLSearchParams(querySlice);
      mode = mode ?? sp.get("mode") ?? undefined;
      oobCode = oobCode ?? sp.get("oobCode") ?? undefined;
      apiKey = apiKey ?? sp.get("apiKey") ?? undefined;
      lang = lang ?? sp.get("lang") ?? undefined;
    }

    try {
      if (/^https?:\/\//i.test(rawUrl)) {
        const u = new URL(rawUrl);
        mode = mode ?? u.searchParams.get("mode") ?? undefined;
        oobCode = oobCode ?? u.searchParams.get("oobCode") ?? undefined;
        apiKey = apiKey ?? u.searchParams.get("apiKey") ?? undefined;
        lang = lang ?? u.searchParams.get("lang") ?? undefined;
      }
    } catch {
      /* ignore */
    }

    if (!mode && !oobCode) return null;
    return { mode, oobCode, apiKey, lang };
  } catch {
    return null;
  }
}

/** Uses `expo.extra` Firebase auth domain / project id so Action URLs stay authorized under Firebase Console domains. */
export function buildAuthActionCodeSettings(): ActionCodeSettings {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const authDomainRaw =
    typeof extra?.firebaseAuthDomain === "string"
      ? extra.firebaseAuthDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
      : "";
  const projectId = typeof extra?.firebaseProjectId === "string" ? extra.firebaseProjectId : "";

  const host = authDomainRaw || (projectId ? `${projectId}.firebaseapp.com` : "");
  const universalContinue = host ? `https://${host}/finish-email` : null;
  const url = universalContinue ?? Linking.createURL("/finish-email");

  return {
    url,
    handleCodeInApp: true,
    iOS: { bundleId: IOS_BUNDLE_ID },
    android: {
      packageName: ANDROID_PACKAGE,
      installApp: true,
      minimumVersion: "12",
    },
  };
}

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": AUTH_INVALID_EMAIL_FORMAT,
  "auth/user-not-found": AUTH_INVALID_EMAIL_FORMAT,
  "auth/wrong-password": AUTH_WRONG_PASSWORD,
  "auth/invalid-credential": AUTH_WRONG_PASSWORD,
  "auth/invalid-login-credentials": AUTH_WRONG_PASSWORD,
  "auth/too-many-requests": "You've sent a few already — wait a few minutes before trying again.",
  "auth/network-request-failed": AUTH_NETWORK_ERROR,
  "auth/invalid-action-code": "This link has expired or was already used.",
  "auth/expired-action-code": "This link has expired.",
  "auth/user-disabled": "This account has been disabled.",
};

export function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
  if (code && FIREBASE_AUTH_MESSAGES[code]) return FIREBASE_AUTH_MESSAGES[code];
  if (err instanceof Error && err.message) return err.message;
  return AUTH_UNKNOWN_ERROR;
}
