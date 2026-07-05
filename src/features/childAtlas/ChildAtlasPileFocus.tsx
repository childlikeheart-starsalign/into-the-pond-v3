import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { atlasColors, fontFamilies, spacing } from "@/src/constants/theme";
import { ChildAtlasEntrySlide } from "@/src/features/childAtlas/ChildAtlasEntrySlide";
import type { PileOriginRect } from "@/src/features/childAtlas/atlasEntryCardLayout";
import type { ChildAtlasEntry } from "@/src/hooks/useChildAtlas";
import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

const FOCUS_SCALE = 1.3;
const ENTER_MS = 350;

type ChildAtlasPileFocusProps = {
  category: DiscoveryCategory;
  entries: ChildAtlasEntry[];
  initialIndex: number;
  origin: PileOriginRect | null;
  reduceMotion: boolean;
  onClose: () => void;
};

export function ChildAtlasPileFocus({
  category,
  entries,
  initialIndex,
  origin,
  reduceMotion,
  onClose,
}: ChildAtlasPileFocusProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardWidth = screenWidth * 0.72;

  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const scrim = useSharedValue(reduceMotion ? 1 : 0);
  const originCenterX = (origin?.x ?? screenWidth / 2) + (origin?.width ?? 0) / 2;
  const originCenterY = (origin?.y ?? screenHeight / 2) + (origin?.height ?? 0) / 2;
  const deltaX = originCenterX - screenWidth / 2;
  const deltaY = originCenterY - screenHeight / 2;

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      scrim.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) });
    scrim.value = withTiming(1, { duration: ENTER_MS });
  }, [progress, reduceMotion, scrim]);

  const finishClose = () => {
    onClose();
  };

  const handleClose = () => {
    if (reduceMotion) {
      finishClose();
      return;
    }
    progress.value = withTiming(0, { duration: ENTER_MS, easing: Easing.in(Easing.cubic) });
    scrim.value = withTiming(0, { duration: ENTER_MS }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const cardWrapStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const scale = 1 + (FOCUS_SCALE - 1) * t;
    return {
      opacity: reduceMotion ? t : 1,
      transform: [{ translateX: deltaX * (1 - t) }, { translateY: deltaY * (1 - t) }, { scale }],
    };
  });

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrim.value * 0.25,
  }));

  const safeInitialIndex = Math.min(initialIndex, Math.max(entries.length - 1, 0));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss atlas focus"
        onPress={handleClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.cardWrap, cardWrapStyle, { minHeight: screenHeight * 0.5 }]}>
        <FlatList
          data={entries}
          horizontal
          pagingEnabled
          initialScrollIndex={safeInitialIndex}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width: screenWidth, alignItems: "center", justifyContent: "center" }}>
              <ChildAtlasEntrySlide entry={item} width={cardWidth} />
            </View>
          )}
        />
      </Animated.View>
      <Text style={styles.caption}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "center",
  },
  scrim: {
    backgroundColor: "rgba(44, 36, 24, 1)",
  },
  cardWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    position: "absolute",
    bottom: spacing.section,
    alignSelf: "center",
    fontFamily: fontFamilies.body,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: atlasColors.inkMuted,
  },
});
