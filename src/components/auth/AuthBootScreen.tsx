import { StyleSheet, View } from "react-native";

import { AuthWaitingVideo } from "@/src/components/auth/AuthWaitingVideo";
import { hideAppSplashOnce } from "@/src/services/splash/hideAppSplashOnce";

const BOOT_A11Y_LABEL = "Preparing your Sanctuary";

/**
 * Cold-start boot overlay — shared by signed-out (Gate) and signed-in (resolver) paths.
 */
export function AuthBootScreen() {
  return (
    <View style={styles.root} pointerEvents="auto">
      <AuthWaitingVideo
        accessibilityLabel={BOOT_A11Y_LABEL}
        onReadyForDisplay={() => void hideAppSplashOnce()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
