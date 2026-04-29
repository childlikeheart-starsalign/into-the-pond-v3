import { httpsCallable } from "firebase/functions";

import { functions } from "@/src/services/firebase/client";
import { LogicalProductId } from "@/src/services/iap/catalog";

type VerifyPurchasePayload = {
  productId: LogicalProductId;
  platform: "ios" | "android";
  customerInfo: unknown;
};

export async function verifyPurchase(payload: VerifyPurchasePayload) {
  const callable = httpsCallable(functions, "verifyPurchase");
  const result = await callable(payload);
  return result.data as { success: boolean; reason?: string };
}

