import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import {
  normRectToStyle,
  resolveVerifyEmailArtboardIntrinsic,
  verifyEmailHitRects,
} from "@/src/constants/verifyEmailArtboard";
import { routes } from "@/src/navigation/routes";
import { useAuthAccess } from "@/src/hooks/useAuthAccess";
import {
  reloadCurrentUser,
  sendEmailVerificationForCurrentUser,
  signOutCurrentUser,
} from "@/src/services/firebase/auth";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";
import { firebaseAuth } from "@/src/services/firebase/client";

export default function VerifyRequiredScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const email = firebaseAuth.currentUser?.email ?? null;
  const emailVerified = firebaseAuth.currentUser?.emailVerified ?? false;
  const authAccess = useAuthAccess({ uid, email, emailVerified });
  const [resendBusy, setResendBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [hint, setHint] = useState<string | null>(null);

  const intrinsic = useMemo(() => resolveVerifyEmailArtboardIntrinsic(), []);

  const artboardWidth = windowWidth;
  const artboardHeight = Math.max(0, windowHeight - insets.top - insets.bottom);

  const resendButtonStyle = normRectToStyle(
    verifyEmailHitRects.resendButton,
    artboardWidth,
    artboardHeight,
  );
  const layerSize = { width: artboardWidth, height: artboardHeight };

  useEffect(() => {
    if (!authAccess.ready) return;
    if (authAccess.canAccessMainApp) {
      router.replace(routes.sanctuary);
    }
  }, [authAccess.canAccessMainApp, authAccess.ready]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      // If user remains on this screen when cooldown expires, send them back to sign-up to retry.
      router.replace(routes.signup);
      return;
    }
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (resendBusy || cooldownSeconds > 0) return;
    setResendBusy(true);
    setHint(null);
    try {
      await sendEmailVerificationForCurrentUser();
      setCooldownSeconds(60);
      setHint("Verification email sent. Please check your inbox.");
    } catch (error) {
      setHint(formatFirebaseAuthError(error));
    } finally {
      setResendBusy(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshBusy) return;
    setRefreshBusy(true);
    setHint(null);
    try {
      await reloadCurrentUser();
      if (firebaseAuth.currentUser?.emailVerified) {
        router.replace(routes.sanctuary);
        return;
      }
      setHint("Still waiting for verification. Please verify from your email and try again.");
    } catch (error) {
      setHint(formatFirebaseAuthError(error));
    } finally {
      setRefreshBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    router.replace(routes.login);
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.artboard, { width: artboardWidth, height: artboardHeight }]}>
          <Image
            source={media.auth.verifyEmail.linkSent}
            style={[styles.layerImage, layerSize]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          <Pressable
            style={[styles.hitTarget, resendButtonStyle]}
            onPress={() => void handleResend()}
            disabled={resendBusy || cooldownSeconds > 0}
            accessibilityRole="button"
            accessibilityLabel={
              resendBusy || cooldownSeconds > 0
                ? `Resend cooling down (${cooldownSeconds || 0} seconds)`
                : "Resend verification email"
            }
            accessibilityState={{ disabled: resendBusy || cooldownSeconds > 0 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
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
});
