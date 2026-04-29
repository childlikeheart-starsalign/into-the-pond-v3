"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueCatSubscriber = getRevenueCatSubscriber;
const config_1 = require("./config");
async function getRevenueCatSubscriber(appUserId) {
    if (!config_1.SETTINGS.revenueCat.apiKey) {
        throw new Error("Missing revenuecat.secret_key runtime config");
    }
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${config_1.SETTINGS.revenueCat.apiKey}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`RevenueCat API failed: ${response.status}`);
    }
    return (await response.json());
}
