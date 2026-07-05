import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus, Video as VideoType } from "expo-av";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { colors, fontFamilies, layout, spacing } from "@/src/constants/theme";
import type { VideoPlayerPayload } from "@/src/features/classroom/types";
import { firebaseAuth } from "@/src/services/firebase/client";

type VideoPlayerProps = {
  video: VideoPlayerPayload;
  onClose: () => void;
  onContinueToReflection: (lessonId: string) => void;
};

const COMPLETION_THRESHOLD = 0.95;
const CONTROLS_HIDE_DELAY_MS = 2000;

function formatTime(millis: number) {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Full-screen lesson video player. Completion is based on playback progress, not didJustFinish. */
export function VideoPlayerModal({ video, onClose, onContinueToReflection }: VideoPlayerProps) {
  const { visible, lesson } = video;
  const videoRef = useRef<VideoType | null>(null);
  const hasCompleted = useRef(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const [continueVisible, setContinueVisible] = useState(false);
  const [leaveSheetVisible, setLeaveSheetVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hideControlsSoon = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, CONTROLS_HIDE_DELAY_MS);
  }, [controlsOpacity]);

  const showControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    hideControlsSoon();
  }, [controlsOpacity, hideControlsSoon]);

  useEffect(() => {
    if (!visible || !lesson) return;
    hasCompleted.current = false;
    setContinueVisible(false);
    setLeaveSheetVisible(false);
    setIsSavingCompletion(false);
    setSaveError(null);
    setIsPlaying(true);
    setPositionMillis(0);
    setDurationMillis(0);
    continueOpacity.setValue(0);
    controlsOpacity.setValue(1);
    hideControlsSoon();

    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      void videoRef.current?.unloadAsync();
    };
  }, [continueOpacity, controlsOpacity, hideControlsSoon, lesson, visible]);

  const fireCompletion = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    setContinueVisible(true);
    Animated.timing(continueOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [continueOpacity]);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const currentPosition = status.positionMillis ?? 0;
      const currentDuration = status.durationMillis ?? 0;
      setPositionMillis(currentPosition);
      setDurationMillis(currentDuration);
      setIsPlaying(status.isPlaying);

      if (currentDuration > 0 && currentPosition / currentDuration >= COMPLETION_THRESHOLD) {
        fireCompletion();
      }
    },
    [fireCompletion],
  );

  const togglePlayback = useCallback(() => {
    showControls();
    if (isPlaying) {
      void videoRef.current?.pauseAsync();
    } else {
      void videoRef.current?.playAsync();
    }
  }, [isPlaying, showControls]);

  const handleBackPress = useCallback(() => {
    showControls();
    setLeaveSheetVisible(true);
  }, [showControls]);

  const handleLeave = useCallback(() => {
    setLeaveSheetVisible(false);
    onClose();
  }, [onClose]);

  const handleContinue = useCallback(async () => {
    if (!lesson || isSavingCompletion) return;

    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      setSaveError("Please sign in to continue.");
      return;
    }

    setIsSavingCompletion(true);
    setSaveError(null);

    // Lesson progress is written server-side via completeLessonReflection.
    setIsSavingCompletion(false);
    onClose();
    setTimeout(() => {
      onContinueToReflection(lesson.id);
    }, 0);
  }, [isSavingCompletion, lesson, onClose, onContinueToReflection]);

  if (!visible || !lesson) {
    return null;
  }

  const progress = durationMillis > 0 ? Math.min(positionMillis / durationMillis, 1) : 0;
  const elapsedLabel = formatTime(positionMillis);
  const durationLabel = formatTime(durationMillis);

  return (
    <Modal visible animationType="fade" onRequestClose={handleBackPress}>
      <StatusBar hidden />
      <View style={styles.container}>
        {lesson.videoUrl ? (
          <Pressable style={styles.videoPressable} onPress={togglePlayback}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: lesson.videoUrl }}
              shouldPlay
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handlePlaybackStatus}
              progressUpdateIntervalMillis={250}
              accessibilityLabel={`Video for ${lesson.title}`}
            />
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No video URL configured.</Text>
          </View>
        )}

        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave lesson"
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.centerControl} pointerEvents="none">
            <Text style={styles.playPauseText}>{isPlaying ? "Pause" : "Play"}</Text>
          </View>

          <View style={styles.progressArea}>
            <Text style={styles.timeText}>
              {elapsedLabel} / {durationLabel}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </Animated.View>

        {continueVisible ? (
          <Animated.View style={[styles.continueWrap, { opacity: continueOpacity }]}>
            <PrimaryButton
              label={isSavingCompletion ? "Saving..." : "Continue to reflection"}
              accessibilityLabel="Continue to lesson reflection"
              disabled={isSavingCompletion}
              busy={isSavingCompletion}
              style={styles.continueButton}
              onPress={handleContinue}
            />
            {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
          </Animated.View>
        ) : null}

        {leaveSheetVisible ? (
          <View style={styles.leaveBackdrop}>
            <View style={styles.leaveSheet}>
              <Text style={styles.leaveTitle}>Leave lesson?</Text>
              <Text style={styles.leaveCopy}>
                If you leave now, this lesson will not be marked complete.
              </Text>
              <View style={styles.leaveActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Stay in lesson"
                  style={layout.btnSecondary}
                  onPress={() => setLeaveSheetVisible(false)}
                >
                  <Text style={layout.btnSecondaryText}>Stay</Text>
                </Pressable>
                <PrimaryButton
                  label="Leave"
                  accessibilityLabel="Leave lesson without completing"
                  onPress={handleLeave}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoPressable: {
    flex: 1,
  },
  video: {
    flex: 1,
    alignSelf: "stretch",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.inner,
  },
  emptyText: {
    fontFamily: fontFamilies.body,
    color: "#FFFFFF",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "box-none",
  },
  backButton: {
    position: "absolute",
    top: spacing.section,
    left: spacing.inner,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(31, 26, 23, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.body,
    fontSize: 36,
    lineHeight: 40,
  },
  centerControl: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "48%",
    alignItems: "center",
  },
  playPauseText: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(31, 26, 23, 0.55)",
    color: "#FFFFFF",
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  progressArea: {
    position: "absolute",
    left: spacing.inner,
    right: spacing.inner,
    bottom: 96,
    gap: spacing.tapGap,
  },
  timeText: {
    color: "#FFFFFF",
    fontFamily: fontFamilies.body,
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  continueWrap: {
    position: "absolute",
    left: spacing.inner,
    right: spacing.inner,
    bottom: spacing.section,
    alignItems: "center",
  },
  continueButton: {
    alignSelf: "stretch",
  },
  saveError: {
    marginTop: spacing.tapGap,
    textAlign: "center",
    color: "#FFFFFF",
    fontFamily: fontFamilies.body,
    fontSize: 13,
  },
  leaveBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 26, 23, 0.55)",
    justifyContent: "flex-end",
  },
  leaveSheet: {
    margin: spacing.inner,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  leaveTitle: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 22,
    color: colors.textPrimary,
  },
  leaveCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  leaveActions: {
    gap: spacing.tapGap,
  },
});
