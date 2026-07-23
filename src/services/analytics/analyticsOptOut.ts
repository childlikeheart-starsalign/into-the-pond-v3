import AsyncStorage from "@react-native-async-storage/async-storage";

import { posthog } from "@/src/services/analytics/posthogClient";
import { firebaseAuth } from "@/src/services/firebase/client";
import { setDocument } from "@/src/services/firebase/firestore";

const STORAGE_KEY = "@itp/analytics_opt_out";

let cachedOptOut: boolean | null = null;
const listeners = new Set<(optedOut: boolean) => void>();

function notifyListeners(): void {
  const value = cachedOptOut === true;
  listeners.forEach((listener) => listener(value));
}

export function subscribeAnalyticsOptOut(listener: (optedOut: boolean) => void): () => void {
  listeners.add(listener);
  listener(cachedOptOut === true);
  return () => listeners.delete(listener);
}

export function isAnalyticsCaptureDisabled(): boolean {
  return cachedOptOut === true;
}

export async function loadAnalyticsOptOutPreference(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedOptOut = stored === "true";
    if (cachedOptOut && posthog) {
      await posthog.optOut();
    }
    notifyListeners();
    return cachedOptOut;
  } catch {
    cachedOptOut = false;
    return false;
  }
}

async function syncAnalyticsOptOutToUserDoc(optOut: boolean): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDocument("users", uid, { analyticsOptOut: optOut });
  } catch {
    /* Firestore may be unavailable offline — client opt-out still applies */
  }
}

export async function setAnalyticsOptOut(optOut: boolean): Promise<void> {
  cachedOptOut = optOut;
  await AsyncStorage.setItem(STORAGE_KEY, optOut ? "true" : "false");

  if (posthog) {
    if (optOut) {
      await posthog.optOut();
      posthog.reset();
    } else {
      await posthog.optIn();
    }
  }

  await syncAnalyticsOptOutToUserDoc(optOut);
  notifyListeners();
}
