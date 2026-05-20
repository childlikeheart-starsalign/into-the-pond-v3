import Constants from "expo-constants";

type ExtraConfig = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseMeasurementId?: string;
  revenueCatApiKeyApple?: string;
  revenueCatApiKeyGoogle?: string;
  /** Identifier for “Into the pond Pro” in RevenueCat (not the dashboard display title). */
  revenueCatEntitlementPro?: string;
  revenueCatEntitlementWooden?: string;
  revenueCatEntitlementFiberglass?: string;
  revenueCatEntitlementLifetime?: string;
  cloudFunctionsRegion?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const env = {
  firebase: {
    apiKey: extra.firebaseApiKey ?? "",
    authDomain: extra.firebaseAuthDomain ?? "",
    projectId: extra.firebaseProjectId ?? "",
    storageBucket: extra.firebaseStorageBucket ?? "",
    messagingSenderId: extra.firebaseMessagingSenderId ?? "",
    appId: extra.firebaseAppId ?? "",
    measurementId: extra.firebaseMeasurementId ?? "",
  },
  revenueCat: {
    appleApiKey: extra.revenueCatApiKeyApple ?? "",
    googleApiKey: extra.revenueCatApiKeyGoogle ?? "",
    entitlementPro: extra.revenueCatEntitlementPro ?? "into_the_pond_pro",
    entitlementWooden: extra.revenueCatEntitlementWooden ?? "wooden_rod",
    entitlementFiberglass: extra.revenueCatEntitlementFiberglass ?? "fiberglass_rod",
    entitlementLifetime: extra.revenueCatEntitlementLifetime ?? "lifetime_keeper",
  },
  cloudFunctionsRegion: extra.cloudFunctionsRegion ?? "asia-east2",
};

export function assertRequiredEnv() {
  const missing: string[] = [];
  if (!env.firebase.apiKey) missing.push("firebaseApiKey");
  if (!env.firebase.projectId) missing.push("firebaseProjectId");
  if (!env.firebase.appId) missing.push("firebaseAppId");
  if (!env.revenueCat.appleApiKey && !env.revenueCat.googleApiKey) {
    missing.push("revenueCatApiKeyApple or revenueCatApiKeyGoogle");
  }
  return missing;
}
