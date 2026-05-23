import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ImageBackground, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { layout, spacing } from "@/src/constants/theme";
import { useSanctuaryFrame } from "@/src/hooks/useSanctuaryFrame";
import { routes } from "@/src/navigation/routes";
import { signInAnonymouslyUser, subscribeToAuthState } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";

/** Garden — full-bleed sanctuary illustration with invisible landmark tap targets. */
export default function SanctuaryScreen() {
  const { source: sanctuarySource, nextFrame } = useSanctuaryFrame();
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (uid === null) {
      setShowOnboarding(true);
    }
  }, [uid]);

  const openWell = () => {
    if (!uid) return;
    router.push(routes.well);
  };

  const openCraft = () => {
    if (!uid) return;
    router.push(routes.craft);
  };

  return (
    <>
      <Portrait916Frame>
        <ImageBackground
          source={sanctuarySource}
          style={styles.background}
          resizeMode="cover"
          accessibilityLabel="Garden sanctuary"
        >
          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cycle sanctuary mood frame"
              style={styles.devFrameCycle}
              onPress={nextFrame}
            />
          ) : null}
          <View style={styles.overlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Well of Questions"
              style={styles.wellTarget}
              onPress={openWell}
              disabled={!uid}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Craft Bench"
              style={styles.craftTarget}
              onPress={openCraft}
              disabled={!uid}
            />
          </View>
        </ImageBackground>
      </Portrait916Frame>

      <Modal
        visible={showOnboarding}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOnboarding(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={layout.screenTitle}>Welcome to the garden</Text>
            <Text style={layout.subtitle}>
              Would you like to continue as a guest, or sign in to save your wonders?
            </Text>

            <Pressable
              accessibilityRole="button"
              style={layout.btnPrimary}
              onPress={async () => {
                try {
                  await signInAnonymouslyUser();
                  setShowOnboarding(false);
                } catch {
                  // best-effort; user can retry
                }
              }}
            >
              <Text style={layout.btnPrimaryText}>Continue as guest</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={layout.btnSecondary}
              onPress={() => {
                setShowOnboarding(false);
                router.push(routes.login);
              }}
            >
              <Text style={layout.btnSecondaryText}>Sign in / Sign up</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  devFrameCycle: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 48,
    minHeight: 48,
    zIndex: 10,
  },
  wellTarget: {
    position: "absolute",
    left: "8%",
    bottom: "22%",
    width: "28%",
    minHeight: 52,
  },
  craftTarget: {
    position: "absolute",
    right: "8%",
    bottom: "22%",
    width: "28%",
    minHeight: 52,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(31,26,23,0.25)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.section + 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.inner,
  },
});
