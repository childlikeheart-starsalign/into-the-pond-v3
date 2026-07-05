import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";

import {
  getHasStitchedIdentity,
  resetAuthFunnelSession,
} from "@/src/services/analytics/authFunnel";
import { posthog } from "@/src/services/analytics/posthogClient";
import { isPlayableUserDoc } from "@/src/services/auth/sanctuaryPlayable";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import type { UserDoc } from "@/src/services/firebase/types";
import { getRodProgressionState, subscribeRodProgression } from "@/src/state/rodProgressionStore";

export function usePostHogIdentify(uid: string | null, sanctuaryInitialized = false): void {
  const lastIdentifiedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog) return;
    if (!uid) {
      posthog.reset();
      resetAuthFunnelSession();
      lastIdentifiedKey.current = null;
      return;
    }

    const identifyIfReady = async () => {
      if (!posthog) return;
      if (!sanctuaryInitialized) return;
      if (getHasStitchedIdentity()) return;

      const { userDocStatus } = getRodProgressionState();
      if (userDocStatus !== "ready") return;

      const userSnap = await getDoc(doc(firestore, "users", uid));
      if (!userSnap.exists()) return;

      const data = userSnap.data() as UserDoc;
      if (!isPlayableUserDoc(data)) return;

      const subscriptionTier = data.subscription?.subscriptionStatus ?? "free";
      const authUser = firebaseAuth.currentUser;
      const accountCreatedAt = authUser?.metadata.creationTime ?? undefined;
      const identifyKey = `${uid}:${subscriptionTier}:${accountCreatedAt ?? ""}`;

      if (lastIdentifiedKey.current === identifyKey) return;
      lastIdentifiedKey.current = identifyKey;

      posthog.identify(uid, {
        subscription_tier: subscriptionTier,
        ...(accountCreatedAt ? { account_created_at: accountCreatedAt } : {}),
      });
    };

    void identifyIfReady();
    const unsub = subscribeRodProgression(() => {
      void identifyIfReady();
    });

    return () => unsub();
  }, [sanctuaryInitialized, uid]);
}
