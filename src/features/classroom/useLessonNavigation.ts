import { useCallback, useState } from "react";

import type { LessonItem, VideoPlayerPayload } from "@/src/features/classroom/types";
import { useUserIsPremium } from "@/src/hooks/useUserIsPremium";

export function useLessonNavigation() {
  const userIsPremium = useUserIsPremium();
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
