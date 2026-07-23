/**
 * Runtime settings for Cloud Functions v2.
 * Prefer process.env — `functions.config()` throws at module load on Functions v2
 * and breaks every callable healthcheck (including createCast).
 */
export const SETTINGS = {
  revenueCat: {
    apiKey: process.env.REVENUECAT_SECRET_KEY ?? process.env.REVENUECAT_API_KEY ?? "",
    entitlementPro: process.env.REVENUECAT_ENTITLEMENT_PRO ?? "into_the_pond_pro",
    entitlementWooden: process.env.REVENUECAT_ENTITLEMENT_WOODEN ?? "wooden_rod",
    entitlementFiberglass: process.env.REVENUECAT_ENTITLEMENT_FIBERGLASS ?? "fiberglass_rod",
    entitlementLifetime: process.env.REVENUECAT_ENTITLEMENT_LIFETIME ?? "lifetime_keeper",
  },
};
