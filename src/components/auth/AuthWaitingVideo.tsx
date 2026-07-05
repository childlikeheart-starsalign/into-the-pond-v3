import { ResizeMode, Video } from "expo-av";
import type { Video as VideoType } from "expo-av";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { media } from "@/src/constants/media";

export type AuthWaitingVideoHandle = {
  freezeAtStart: () => Promise<void>;
};

type AuthWaitingVideoProps = {
  accessibilityLabel?: string;
  onReadyForDisplay?: () => void;
};

/**
 * Looping full-screen waiting video for cold-start boot and Enter overlay.
 */
export const AuthWaitingVideo = forwardRef<AuthWaitingVideoHandle, AuthWaitingVideoProps>(
  function AuthWaitingVideo(
    { accessibilityLabel = "Preparing your Sanctuary…", onReadyForDisplay },
    ref,
  ) {
    const videoRef = useRef<VideoType>(null);
    const [readyForDisplay, setReadyForDisplay] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        freezeAtStart: async () => {
          const player = videoRef.current;
          if (!player) return;
          await player.setStatusAsync({
            shouldPlay: false,
            positionMillis: 0,
          });
        },
      }),
      [],
    );

    useEffect(() => {
      const player = videoRef.current;
      return () => {
        void player?.unloadAsync();
      };
    }, []);

    return (
      <View
        style={styles.container}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
        accessibilityLiveRegion="polite"
      >
        <Video
          ref={videoRef}
          style={[styles.video, !readyForDisplay && styles.videoHidden]}
          source={media.startup.waitingScreen}
          shouldPlay
          isLooping
          isMuted
          resizeMode={ResizeMode.COVER}
          pointerEvents="none"
          onReadyForDisplay={() => {
            setReadyForDisplay(true);
            onReadyForDisplay?.();
          }}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_FRAME_BG,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoHidden: {
    opacity: 0,
  },
});
