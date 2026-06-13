import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";
import { colors, fontFamilies } from "@/src/constants/theme";

const OPEN_MS = 600;

type FieldJournalCoverProps = {
  width: number;
  height: number;
  isAnimating: boolean;
  onOpenStart: () => void;
  onOpenComplete: () => void;
  onBackToSanctuary: () => void;
};

export function FieldJournalCover({
  width,
  height,
  isAnimating,
  onOpenStart,
  onOpenComplete,
  onBackToSanctuary,
}: FieldJournalCoverProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const finishOpen = useCallback(() => {
    onOpenComplete();
  }, [onOpenComplete]);

  const handleOpen = useCallback(() => {
    if (isAnimating) return;
    onOpenStart();

    if (reduceMotion) {
      finishOpen();
      return;
    }

    scale.value = withTiming(1.02, { duration: OPEN_MS }, (finished) => {
      if (finished) {
        runOnJS(finishOpen)();
      }
    });
  }, [finishOpen, isAnimating, onOpenStart, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.root, { width, height }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Sanctuary Field Journal"
        disabled={isAnimating}
        onPress={handleOpen}
        style={styles.tapArea}
      >
        <Animated.View style={[styles.coverWrap, { width, height }, animatedStyle]}>
          <Image source={fieldJournalMedia.cover} style={{ width, height }} resizeMode="cover" />
        </Animated.View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Sanctuary"
        onPress={onBackToSanctuary}
        disabled={isAnimating}
        style={[styles.backButton, { top: insets.top + 8 }]}
      >
        <Text style={styles.backLabel}>Sanctuary</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
  },
  tapArea: {
    flex: 1,
  },
  coverWrap: {
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 16,
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  backLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.primary,
  },
});
