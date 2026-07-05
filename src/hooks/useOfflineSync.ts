import { useEffect } from "react";
import { AppState } from "react-native";

import {
  subscribeAndCacheCreatures,
  subscribeAndCacheDiaryEntries,
  subscribeAndCacheLessons,
  subscribeAndCacheUserProfile,
  subscribeAndCacheWellQuestions,
} from "@/src/db/sync";
import { reconcileServerCastCache } from "@/src/features/fishing/fishingServerCast";
import { retryPendingDiaryEntries } from "@/src/services/firebase/offlineDiaryQueue";

export function useOfflineSync(uid: string | null, enabled = false) {
  useEffect(() => {
    if (!uid || !enabled) return;

    const unsubscribers = [
      subscribeAndCacheUserProfile(uid),
      subscribeAndCacheLessons(uid),
      subscribeAndCacheWellQuestions(uid),
      subscribeAndCacheDiaryEntries(uid),
      subscribeAndCacheCreatures(uid),
    ];

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void retryPendingDiaryEntries(uid);
        void reconcileServerCastCache(uid);
      }
    });

    void retryPendingDiaryEntries(uid);
    void reconcileServerCastCache(uid);

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe?.();
      }
      appStateSubscription.remove();
    };
  }, [enabled, uid]);
}
