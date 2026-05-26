import { useCallback, useEffect, useState } from "react";

import type { LessonItem, VideoPlayerPayload } from "@/src/features/classroom/types";
import { firebaseAuth } from "@/src/services/firebase/client";
import { subscribeToUserSubscription } from "@/src/services/firebase/entitlements";

/* REPLACE WITH ACTUAL STORE IMPORT — e.g. const isPremium = useUserStore((s) => s.isPremium) */
function usePreloadedUserIsPremium(): boolean {
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

export function useLessonNavigation() {
  const userIsPremium = usePreloadedUserIsPremium();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [video, setVideo] = useState<VideoPlayerPayload>({ visible: false, lesson: null });

  const handleLessonPress = useCallback(
    (lesson: LessonItem) => {
      if (lesson.isPremium && !userIsPremium) {
        setPaywallVisible(true);
        return;
      }

      setVideo({
        visible: true,
        lesson,
      });
    },
    [userIsPremium],
  );

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
  }, []);

  const closeVideo = useCallback(() => {
    setVideo({ visible: false, lesson: null });
  }, []);

  return {
    handleLessonPress,
    paywallVisible,
    closePaywall,
    video,
    closeVideo,
  };
}
