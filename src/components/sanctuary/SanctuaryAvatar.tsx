import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import type { SanctuaryAvatarPoseAsset } from "@/src/constants/sanctuaryAssets";

const POSE_CYCLE_MS = 3000;
const FADE_MS = 350;

type SanctuaryAvatarProps = {
  poses: SanctuaryAvatarPoseAsset[];
  onFirstPoseLoad?: () => void;
};

function hitRectToStyle(pose: SanctuaryAvatarPoseAsset): ViewStyle {
  const { left, top, width, height } = pose.hitRect;
  return {
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  };
}

/**
 * Full-artboard avatar overlay that cycles poses every 3s or on tap.
 * The pose PNGs are transparent 9:16 canvases, so rendering them full-frame
 * preserves the reference placement from the source artwork.
 */
export function SanctuaryAvatar({ poses, onFirstPoseLoad }: SanctuaryAvatarProps) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advancePose = useCallback(() => {
    if (poses.length <= 1) return;

    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS / 2,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setIndex((prev) => (prev + 1) % poses.length);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS / 2,
        useNativeDriver: true,
      }).start();
    });
  }, [opacity, poses.length]);

  useEffect(() => {
    if (poses.length <= 1) return undefined;
    timerRef.current = setInterval(advancePose, POSE_CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advancePose, poses.length]);

  useEffect(() => {
    setIndex(0);
    opacity.setValue(1);
  }, [poses, opacity]);

  if (poses.length === 0) return null;

  const pose = poses[index];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.fill, { opacity }]} pointerEvents="none">
        <Image
          source={pose.source}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onLoad={index === 0 ? onFirstPoseLoad : undefined}
        />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cycle avatar pose"
        onPress={advancePose}
        style={[styles.hitTarget, hitRectToStyle(pose)]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  hitTarget: {
    position: "absolute",
    minWidth: 48,
    minHeight: 48,
    backgroundColor: "transparent",
  },
});
