import { doc, onSnapshot, Timestamp } from "firebase/firestore";

import { firestore } from "@/src/services/firebase/client";
import { requestSubscriptionSync } from "@/src/services/firebase/serverActions";
import { Sentry } from "@/src/services/sentry/init";
import {
  RodTier,
  SubscriptionStatus,
  UserDoc,
  UserSubscription,
} from "@/src/services/firebase/types";

export type SubscriptionState = UserSubscription & {
  activeRod: RodTier;
};

export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  activeRod: "basic",
  productId: null,
  expiryDate: null,
  isLifetime: false,
  subscriptionStatus: "free",
  lastVerifiedAt: null,
  source: "unknown",
};

export function toDerivedSubscriptionState(input: Partial<SubscriptionState> | null | undefined) {
  const merged: SubscriptionState = {
    ...DEFAULT_SUBSCRIPTION_STATE,
    ...(input ?? {}),
  };
  const now = Date.now();
  const expiryMs = merged.expiryDate?.toMillis() ?? 0;
  const isExpired = !merged.isLifetime && expiryMs > 0 && expiryMs < now;
  const effectiveStatus: SubscriptionStatus = isExpired ? "free" : merged.subscriptionStatus;
  const activeRod: RodTier = effectiveStatus === "free" ? "basic" : effectiveStatus;

  return {
    ...merged,
    activeRod,
    subscriptionStatus: effectiveStatus,
    isExpired,
    hasPaidRod: merged.isLifetime || effectiveStatus !== "free",
    activeTier: merged.isLifetime ? "lifetime" : effectiveStatus,
  };
}

export function subscribeToUserSubscription(
  uid: string,
  callback: (state: ReturnType<typeof toDerivedSubscriptionState>) => void,
) {
  let triggeredSync = false;
  return onSnapshot(
    doc(firestore, "users", uid),
    (snapshot) => {
      const data = snapshot.data() as UserDoc | undefined;
      const rawStatus = data?.subscription?.subscriptionStatus ?? "free";
      const rawRod = data?.activeRod ?? "basic";
      const expectedRod: RodTier = rawStatus === "free" ? "basic" : rawStatus;
      if (!triggeredSync && rawRod !== expectedRod) {
        triggeredSync = true;
        void requestSubscriptionSync(uid).finally(() => {
          triggeredSync = false;
        });
      }
      const raw = data?.subscription;
      callback(
        toDerivedSubscriptionState({
          ...raw,
          activeRod: data?.activeRod ?? "basic",
        }),
      );
    },
    (error) => {
      console.warn("[entitlements] user subscription snapshot failed", error);
      Sentry.captureException(error, {
        tags: { area: "firebase", flow: "subscribe_user_subscription" },
      });
    },
  );
}
