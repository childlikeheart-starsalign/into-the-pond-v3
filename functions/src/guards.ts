import { HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { db } from "./init";
import { ActiveRod, SubscriptionStatus } from "./types";

const rank: Record<ActiveRod, number> = {
  basic: 0,
  wooden: 1,
  fiberglass: 2,
};

type GuardOptions = {
  minRod?: ActiveRod;
};

export async function assertActiveRodOrThrow(uid: string, options: GuardOptions = {}) {
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  const data = (snapshot.data() ?? {}) as {
    activeRod?: ActiveRod;
    subscription?: {
      subscriptionStatus?: SubscriptionStatus;
      productId?: string | null;
      expiryDate?: Timestamp | null;
      isLifetime?: boolean;
    };
  };
  const subscription = data.subscription ?? {};
  const activeRod = (data.activeRod ??
    (subscription.subscriptionStatus === "fiberglass"
      ? "fiberglass"
      : subscription.subscriptionStatus === "wooden"
        ? "wooden"
        : "basic")) as ActiveRod;
  const isLifetime = subscription.isLifetime ?? false;
  const expiryDate = subscription.expiryDate ?? null;
  const productId = subscription.productId ?? null;
  const now = Date.now();
  const notExpired = !expiryDate || expiryDate.toMillis() > now;
  const hasPaid = !!productId || isLifetime || activeRod !== "basic";

  if (!hasPaid && options.minRod !== "basic") {
    throw new HttpsError("permission-denied", "Subscription inactive");
  }
  if (isLifetime) return;
  if (!notExpired || rank[activeRod] < rank[options.minRod ?? "wooden"]) {
    throw new HttpsError("permission-denied", "Subscription inactive or insufficient tier");
  }
}
