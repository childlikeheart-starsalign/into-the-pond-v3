import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PreparingSanctuaryOverlay } from "@/src/components/auth/PreparingSanctuaryOverlay";
import { AUTH_OPENING_GATE_ERROR } from "@/src/constants/authCopy";
import { emailVerifiedHitRects, normRectToStyle } from "@/src/constants/emailVerifiedArtboard";
import { media } from "@/src/constants/media";
import { colors, fontFamilies } from "@/src/constants/theme";
import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { navigateAfterEmailVerified } from "@/src/navigation/navigateAfterEmailVerified";
import { routes } from "@/src/navigation/routes";
import { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { firebaseAuth } from "@/src/services/firebase/client";
import { Sentry } from "@/src/services/sentry/init";

const DANGER_SOFT = "#B86A6A";
const SETUP_ERROR = AUTH_OPENING_GATE_ERROR;

export default function EmailVerifiedScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const frame = usePortrait916Layout("cover");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uid = firebaseAuth.currentUser?.uid ?? null;
  const narrativeOnboarding = useNarrativeOnboarding();

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;
  const enterButtonStyle = normRectToStyle(
    emailVerifiedHitRects.enterButton,
    artboardWidth,
    artboardHeight,
  );
  const layerSize = { width: artboardWidth, height: artboardHeight };

  useEffect(() => {
    if (!uid) {
      router.replace(routes.login);
    }
  }, [uid]);

  const handleEnter = async () => {
    if (busy || !uid) return;
    setBusy(true);
    setErrorMessage(null);

    if (!narrativeOnboarding.ready) {
      setErrorMessage(SETUP_ERROR);
      setBusy(false);
      return;
    }

    try {
      await navigateAfterEmailVerified(router, {
        uid,
        emailVerified: true,
        sanctuaryInitialized: false,
        pathname: "/email-verified",
        narrative: {
          ready: narrativeOnboarding.ready,
          needsArchetype: narrativeOnboarding.needsArchetype,
          needsBirthDate: narrativeOnboarding.needsBirthDate,
          needsNarrative: narrativeOnboarding.needsNarrative,
        },
        syncNarrativeNeeds: getSyncNarrativeNeeds(),
        celebration: { ready: true, hasCompleted: false },
      });
    } catch (e) {
      Sentry.captureException(e, { tags: { area: "auth", flow: "email_verified_init" } });
      setErrorMessage(SETUP_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: windowHeight }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.artboard,
            {
              marginLeft: frame.left,
              marginTop: frame.top,
              width: artboardWidth,
              height: artboardHeight,
            },
          ]}
        >
          <Image
            source={media.auth.emailVerified.background}
            style={[styles.layerImage, layerSize]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          <Pressable
            style={[styles.hitTarget, enterButtonStyle]}
            onPress={() => void handleEnter()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Enter"
            accessibilityState={{ disabled: busy }}
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorRegion}>
            <Text
              style={styles.errorText}
              accessibilityLiveRegion="polite"
              accessibilityLabel={errorMessage}
            >
              {errorMessage}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void handleEnter()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Try again when you're ready"
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {busy ? <PreparingSanctuaryOverlay /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  artboard: {
    alignSelf: "stretch",
    position: "relative",
  },
  layerImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  hitTarget: {
    backgroundColor: "transparent",
  },
  errorRegion: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 16,
    alignItems: "center",
  },
  errorText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    lineHeight: 24,
    color: DANGER_SOFT,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
});
