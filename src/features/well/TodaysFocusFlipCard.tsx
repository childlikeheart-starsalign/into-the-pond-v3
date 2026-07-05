import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  backFaceOpacity,
  backFaceRotateY,
  CARD_FLIP_DURATION_MS,
  CARD_FLIP_EASING,
  frontFaceOpacity,
  frontFaceRotateY,
} from "@/src/features/well/cardFlipAnimation";
import { useCardFlipGesture } from "@/src/features/well/cardFlipGesture";
import { TodaysFocusCardBack } from "@/src/features/well/TodaysFocusCardBack";
import { TodaysFocusCardFront } from "@/src/features/well/TodaysFocusCardFront";
import type { WellCardStatus } from "@/src/features/well/wellCardStatus";
import type { WellBankQuestion } from "@/shared/sanctuary/well/types";

type CardDisplayMode = "front" | "back" | "animating";

type TodaysFocusFlipCardProps = {
  question: WellBankQuestion;
  /** Layout width in points — sized for display, not transform-scaled. */
  layoutWidth?: number;
  face: "front" | "back";
  onFlip: (to: "front" | "back") => void;
  cardStatus: WellCardStatus;
  hasAnsweredToday: boolean;
  savedReflectionText?: string | null;
  draftText: string;
  onDraftChange: (text: string) => void;
  onSave: (headline?: string) => Promise<boolean>;
  revealActive: boolean;
  wonderAwarded?: number;
  reflectionPreviewOnly?: boolean;
  onRevealComplete: () => void;
  atlasAnchorRef: React.RefObject<View | null>;
  atlasEntryId?: string | null;
};

export function TodaysFocusFlipCard({
  question,
  layoutWidth,
  face,
  onFlip,
  cardStatus,
  hasAnsweredToday,
  savedReflectionText,
  draftText,
  onDraftChange,
  onSave,
  revealActive,
  wonderAwarded,
  reflectionPreviewOnly,
  onRevealComplete,
  atlasAnchorRef,
  atlasEntryId,
}: TodaysFocusFlipCardProps) {
  const isFlipped = face === "back";
  const rotation = useSharedValue(isFlipped ? 180 : 0);
  const reduceMotionSv = useSharedValue(false);
  const displayMode = useSharedValue<CardDisplayMode>(isFlipped ? "back" : "front");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionSv.value = enabled;
    });
  }, [reduceMotionSv]);

  useEffect(() => {
    displayMode.value = "animating";
    setIsAnimating(true);
    rotation.value = withTiming(
      isFlipped ? 180 : 0,
      {
        duration: reduceMotionSv.value ? 150 : CARD_FLIP_DURATION_MS,
        easing: CARD_FLIP_EASING,
      },
      (finished) => {
        if (finished) {
          runOnJS(setIsAnimating)(false);
          displayMode.value = isFlipped ? "back" : "front";
        }
      },
    );
  }, [displayMode, isFlipped, reduceMotionSv, rotation]);

  const frontStyle = useAnimatedStyle(() => {
    const mode = displayMode.value;
    if (mode === "front") {
      return { opacity: 1 };
    }
    if (mode === "back") {
      return { opacity: 0 };
    }
    const deg = rotation.value;
    if (reduceMotionSv.value) {
      return { opacity: frontFaceOpacity(deg) };
    }
    return {
      opacity: frontFaceOpacity(deg),
      transform: [{ perspective: 1200 }, { rotateY: frontFaceRotateY(deg) }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const mode = displayMode.value;
    if (mode === "back") {
      return { opacity: 1 };
    }
    if (mode === "front") {
      return { opacity: 0 };
    }
    const deg = rotation.value;
    if (reduceMotionSv.value) {
      return { opacity: backFaceOpacity(deg) };
    }
    return {
      opacity: backFaceOpacity(deg),
      transform: [{ perspective: 1200 }, { rotateY: backFaceRotateY(deg) }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const handleFlipRequest = useCallback(() => {
    if (isAnimating || revealActive) return;
    onFlip(isFlipped ? "front" : "back");
  }, [isAnimating, isFlipped, onFlip, revealActive]);

  const flipGesture = useCardFlipGesture({
    enabled: !isAnimating && !revealActive,
    onFlipRequest: handleFlipRequest,
  });

  return (
    <View style={[styles.wrap, layoutWidth ? { width: layoutWidth } : null]}>
      <GestureDetector gesture={flipGesture}>
        <View style={styles.cardStack}>
          <Animated.View
            style={[styles.face, frontStyle]}
            pointerEvents={isFlipped ? "none" : "auto"}
            collapsable={false}
          >
            <TodaysFocusCardFront question={question} cardStatus={cardStatus} />
          </Animated.View>
          <Animated.View
            style={[styles.face, styles.backFace, backStyle]}
            pointerEvents={isFlipped ? "auto" : "none"}
            collapsable={false}
          >
            <TodaysFocusCardBack
              question={question}
              draftText={draftText}
              onDraftChange={onDraftChange}
              onSave={onSave}
              hasAnsweredToday={hasAnsweredToday}
              savedReflectionText={savedReflectionText}
              revealActive={revealActive}
              wonderAwarded={wonderAwarded}
              reflectionPreviewOnly={reflectionPreviewOnly}
              onRevealComplete={onRevealComplete}
              atlasAnchorRef={atlasAnchorRef}
              atlasEntryId={atlasEntryId}
            />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
  cardStack: {
    width: "100%",
  },
  face: {
    width: "100%",
  },
  backFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
