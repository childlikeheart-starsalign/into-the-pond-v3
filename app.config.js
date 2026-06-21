const path = require("path");

// Load root `.env` before reading `process.env` (Expo CLI also loads `.env` for `expo start`).
require("dotenv").config({ path: path.join(__dirname, ".env") });

const appJson = require("./app.json");

/**
 * Dynamic Expo config: merges env vars into `extra` for EAS Build secrets and local `.env`.
 * See [.env.example](.env.example) and README Configuration.
 */
module.exports = () => {
  const expoBlock = appJson.expo;
  const baseExtra = expoBlock.extra ?? {};

  const mergedExtra = {
    ...baseExtra,
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? baseExtra.firebaseApiKey,
    firebaseAuthDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? baseExtra.firebaseAuthDomain,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? baseExtra.firebaseProjectId,
    firebaseStorageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? baseExtra.firebaseStorageBucket,
    firebaseMessagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? baseExtra.firebaseMessagingSenderId,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? baseExtra.firebaseAppId,
    firebaseMeasurementId:
      process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? baseExtra.firebaseMeasurementId,
    revenueCatApiKeyApple: process.env.REVENUECAT_APPLE_API_KEY ?? baseExtra.revenueCatApiKeyApple,
    revenueCatApiKeyGoogle:
      process.env.REVENUECAT_GOOGLE_API_KEY ?? baseExtra.revenueCatApiKeyGoogle,
    revenueCatEntitlementPro:
      process.env.REVENUECAT_ENTITLEMENT_PRO ?? baseExtra.revenueCatEntitlementPro,
    revenueCatEntitlementWooden:
      process.env.REVENUECAT_ENTITLEMENT_WOODEN ?? baseExtra.revenueCatEntitlementWooden,
    revenueCatEntitlementFiberglass:
      process.env.REVENUECAT_ENTITLEMENT_FIBERGLASS ?? baseExtra.revenueCatEntitlementFiberglass,
    revenueCatEntitlementLifetime:
      process.env.REVENUECAT_ENTITLEMENT_LIFETIME ?? baseExtra.revenueCatEntitlementLifetime,
    cloudFunctionsRegion:
      process.env.EXPO_PUBLIC_CLOUD_FUNCTIONS_REGION ?? baseExtra.cloudFunctionsRegion,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? baseExtra.sentryDsn,
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? baseExtra.posthogApiKey,
    posthogHost:
      process.env.EXPO_PUBLIC_POSTHOG_HOST ?? baseExtra.posthogHost ?? "https://app.posthog.com",
  };

  const basePlugins = (expoBlock.plugins ?? []).filter(
    (plugin) => !(Array.isArray(plugin) && plugin[0] === "@sentry/react-native/expo"),
  );

  return {
    expo: {
      ...expoBlock,
      owner: "childlike-heart",
      plugins: [
        ...basePlugins,
        [
          "@sentry/react-native/expo",
          {
            organization: "childlike-heart",
            project: "react-native",
          },
        ],
        "./plugins/withFirebaseNativeFiles",
      ],
      extra: mergedExtra,
    },
  };
};
