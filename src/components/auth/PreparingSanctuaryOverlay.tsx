import { StyleSheet, View } from "react-native";

import { AuthWaitingVideo } from "@/src/components/auth/AuthWaitingVideo";

const PREPARING_A11Y_LABEL = "Preparing your Sanctuary";

/**
 * Enter → destination overlay — same waiting video as cold-start boot.
 */
export function PreparingSanctuaryOverlay() {
  return (
    <View style={styles.root} pointerEvents="auto">
      <AuthWaitingVideo accessibilityLabel={PREPARING_A11Y_LABEL} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
