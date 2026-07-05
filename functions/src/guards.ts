import { HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { db } from "./init";
import { ActiveRod, DeletionStatus, SubscriptionStatus } from "./types";

export type UserDeletionSlice = {
  deletionStatus: DeletionStatus;
  deletionPurgeAt: Timestamp | null;
  deletionRequestedAt: Timestamp | null;
};

export async function assertAccountActive(uid: string): Promise<UserDeletionSlice> {
  const snapshot = await db.collection("users").doc(uid).get();
  const data = snapshot.data() ?? {};
  const deletionStatus = (data.deletionStatus ?? "active") as DeletionStatus;

  if (deletionStatus !== "active") {
    throw new HttpsError("failed-precondition", "account/pending-deletion");
  }

  return {
    deletionStatus,
    deletionPurgeAt: (data.deletionPurgeAt as Timestamp | null | undefined) ?? null,
    deletionRequestedAt: (data.deletionRequestedAt as Timestamp | null | undefined) ?? null,
  };
}

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
