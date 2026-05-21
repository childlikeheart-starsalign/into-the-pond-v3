import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";

type NarrativeVideoSceneProps = {
  source: number;
  onComplete: () => void;
  isLastScene?: boolean;
  /** When true, only tap advances — video end does not auto-advance. */
  tapOnly?: boolean;
};

export function NarrativeVideoScene({
  source,
  onComplete,
  isLastScene = false,
  tapOnly = false,
}: NarrativeVideoSceneProps) {
  const hasCompletedRef = useRef(false);

  // Reset completion guard when the scene video changes (same component instance reused).
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [source]);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (tapOnly) return;
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        handleComplete();
      }
    },
    [handleComplete, tapOnly],
  );

  return (
    // Portrait916Frame provides an absolutely-positioned 9:16 box centred on screen.
    // Everything inside is sized relative to that box's explicit width/height.
    <Portrait916Frame>
      {/* Pressable fills the entire 9:16 frame via flex: 1 */}
      <Pressable
        style={styles.fill}
        onPress={handleComplete}
        accessibilityRole="button"
        accessibilityLabel={isLastScene ? "Tap to enter the garden" : "Tap to continue"}
      >
        {/* pointerEvents="none" — native Video surface steals touches on iOS/Android */}
        <Video
          style={styles.fill}
          source={source}
          shouldPlay
          isLooping={false}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handlePlaybackStatus}
          pointerEvents="none"
        />
      </Pressable>
    </Portrait916Frame>
  );
}

const styles = StyleSheet.create({
  // flex: 1 fills the parent box (Portrait916Frame's inner view has explicit w/h)
  fill: {
    flex: 1,
  },
});
