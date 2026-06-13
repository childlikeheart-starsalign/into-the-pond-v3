import { useEffect, useState } from "react";

import { firebaseAuth } from "@/src/services/firebase/client";
import { subscribeToUserSubscription } from "@/src/services/firebase/entitlements";

export function useUserIsPremium(): boolean {
  const [isPremium, setIsPremium] = useState(false);
  const uid = firebaseAuth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setIsPremium(false);
      return;
    }

    return subscribeToUserSubscription(uid, (state) => {
      setIsPremium(state.hasPaidRod);
    });
  }, [uid]);

  return isPremium;
}
