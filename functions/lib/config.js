"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS = void 0;
const firebase_functions_1 = require("firebase-functions");
const runtimeConfig = (0, firebase_functions_1.config)();
exports.SETTINGS = {
  revenueCat: {
    apiKey: runtimeConfig.revenuecat?.secret_key ?? "",
    entitlementPro: runtimeConfig.revenuecat?.entitlement_pro ?? "into_the_pond_pro",
    entitlementWooden: runtimeConfig.revenuecat?.entitlement_wooden ?? "wooden_rod",
    entitlementFiberglass: runtimeConfig.revenuecat?.entitlement_fiberglass ?? "fiberglass_rod",
    entitlementLifetime: runtimeConfig.revenuecat?.entitlement_lifetime ?? "lifetime_keeper",
  },
};
