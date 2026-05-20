import { useEffect } from "react";
import { AppState } from "react-native";

import {
  subscribeAndCacheCreatures,
  subscribeAndCacheDiaryEntries,
  subscribeAndCacheLessons,
  subscribeAndCacheUserProfile,
  subscribeAndCacheWellQuestions,
} from "@/src/db/sync";
import { retryPendingDiaryEntries } from "@/src/services/firebase/offlineDiaryQueue";

export function useOfflineSync(uid: string | null) {
  useEffect(() => {
    if (!uid) return;

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
      }
    });

    void retryPendingDiaryEntries(uid);

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe?.();
      }
      appStateSubscription.remove();
    };
  }, [uid]);
}
