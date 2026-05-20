import { config } from "firebase-functions";

const runtimeConfig = config();

export const SETTINGS = {
  revenueCat: {
    apiKey: runtimeConfig.revenuecat?.secret_key ?? "",
    entitlementPro: runtimeConfig.revenuecat?.entitlement_pro ?? "into_the_pond_pro",
    entitlementWooden: runtimeConfig.revenuecat?.entitlement_wooden ?? "wooden_rod",
    entitlementFiberglass: runtimeConfig.revenuecat?.entitlement_fiberglass ?? "fiberglass_rod",
    entitlementLifetime: runtimeConfig.revenuecat?.entitlement_lifetime ?? "lifetime_keeper",
  },
};
