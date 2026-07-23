import { SETTINGS } from "./config";
import { RevenueCatSubscriber } from "./types";

export async function getRevenueCatSubscriber(appUserId: string) {
  if (!SETTINGS.revenueCat.apiKey) {
    throw new Error("Missing REVENUECAT_SECRET_KEY (or REVENUECAT_API_KEY) runtime env");
  }
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SETTINGS.revenueCat.apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`RevenueCat API failed: ${response.status}`);
  }
  return (await response.json()) as RevenueCatSubscriber;
}
