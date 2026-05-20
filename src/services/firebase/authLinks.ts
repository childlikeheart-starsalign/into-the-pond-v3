import Constants from "expo-constants";
import * as Linking from "expo-linking";
import type { ActionCodeSettings } from "firebase/auth";

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

/**
 * Extract Firebase Auth email-action query params (`mode`, `oobCode`, …) from a URL opened via deep link or universal link.
 */
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
  const url = host ? `https://${host}/` : "https://localhost/";

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
  "auth/invalid-email": "That email doesn’t look valid.",
  "auth/user-not-found": "No account found for that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/invalid-action-code": "This link has expired or was already used.",
  "auth/expired-action-code": "This link has expired.",
  "auth/user-disabled": "This account has been disabled.",
};

export function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
  if (code && FIREBASE_AUTH_MESSAGES[code]) return FIREBASE_AUTH_MESSAGES[code];
  return err instanceof Error ? err.message : String(err);
}
