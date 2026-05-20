import { ResizeMode, Video } from "expo-av";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";

import { layout, spacing } from "@/src/constants/theme";
import type { VideoPlayerPayload } from "@/src/features/classroom/types";

type VideoPlayerProps = {
  video: VideoPlayerPayload;
  onClose: () => void;
  /** Optional — closes video and lets parent open diary step */
  onContinueToDiary?: () => void;
};

/** Plays remote or file URIs via expo-av. YouTube/Vimeo embeds can use WebView in a later iteration. */
export function VideoPlayerModal({ video, onClose, onContinueToDiary }: VideoPlayerProps) {
  const { visible, url } = video;

  if (!visible) {
    return null;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close video"
            style={layout.btnSecondary}
            onPress={onClose}
          >
            <Text style={layout.btnSecondaryText}>Close</Text>
          </Pressable>
        </View>
        {url ? (
          <Video
            style={styles.video}
            source={{ uri: url }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            accessibilityLabel="Lesson video"
          />
        ) : (
          <Text style={layout.muted}>No video URL configured.</Text>
        )}
        {onContinueToDiary ? (
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to diary"
              style={layout.btnPrimary}
              onPress={onContinueToDiary}
            >
              <Text style={layout.btnPrimaryText}>Continue to diary</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1A17",
    paddingTop: spacing.section,
  },
  header: {
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.inner,
  },
  footer: {
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.section,
    paddingTop: spacing.inner,
  },
  video: {
    flex: 1,
    alignSelf: "stretch",
  },
});
