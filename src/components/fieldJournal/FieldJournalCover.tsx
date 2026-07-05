import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, Image, Pressable, StyleSheet, View } from "react-native";

import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";
import { fieldJournalCoverCroppedImageStyle } from "@/src/features/fieldJournal/fieldJournalLayout";
import { WellTopBar } from "@/src/features/well/WellTopBar";

type FieldJournalCoverProps = {
  isAnimating: boolean;
  onOpenStart: () => void;
  onOpenComplete: () => void;
  onClose: () => void;
};

/** Cover scene inside the shared 9:16 Portrait916Frame (matches reader phase). */
export function FieldJournalCover({
  isAnimating,
  onOpenStart,
  onOpenComplete,
  onClose,
}: FieldJournalCoverProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const handleOpen = useCallback(() => {
    if (isAnimating) return;
    onOpenStart();
    if (reduceMotion) {
      onOpenComplete();
      return;
    }
    onOpenComplete();
  }, [isAnimating, onOpenComplete, onOpenStart, reduceMotion]);

  return (
    <View style={styles.root} collapsable={false}>
      <Image
        source={fieldJournalMedia.cover}
        style={[styles.coverImage, fieldJournalCoverCroppedImageStyle()]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Sanctuary Field Journal"
        disabled={isAnimating}
        onPress={handleOpen}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topBarWrap} pointerEvents="box-none">
        <WellTopBar onClose={onClose} closeAccessibilityLabel="Close Journal" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  coverImage: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  topBarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
