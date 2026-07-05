import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SanctuaryBreathingOverlay } from "@/src/components/auth/SanctuaryBreathingOverlay";
import {
  AUTH_OPENING_GATE_ERROR,
  AUTH_VERIFY_REFRESH_A11Y,
  AUTH_VERIFY_RESEND_SUCCESS,
  AUTH_VERIFY_RETURN_SIGNUP,
  AUTH_VERIFY_STILL_WAITING_LINES,
  AUTH_VERIFY_WRONG_EMAIL_A11Y,
} from "@/src/constants/authCopy";
import { media } from "@/src/constants/media";
import { colors, fontFamilies } from "@/src/constants/theme";
import {
  normRectToStyle,
  VERIFY_EMAIL_HIT_DEBUG,
  verifyEmailHitRects,
} from "@/src/constants/verifyEmailArtboard";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { useAuthBoot } from "@/src/hooks/useAuthBoot";
import { routes } from "@/src/navigation/routes";
import { completeSanctuaryInitWithLegacyFallback } from "@/src/services/auth/completeSanctuaryInit";
import {
  trackAuthVerifyAbandoned,
  trackAuthVerifyCompleted,
  trackAuthVerifyEmailOpened,
  trackAuthVerifyPending,
  trackAuthVerifyResent,
} from "@/src/services/analytics/authFunnel";
import {
  sendEmailVerificationForCurrentUser,
  signOutCurrentUser,
} from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";
import { Sentry } from "@/src/services/sentry/init";

const VERIFY_DWELL_MS = 45_000;

const AUTH_INLINE_BROWN = "#2E2520";
const DANGER_SOFT = "#B86A6A";
const STILL_WAITING_LINES = AUTH_VERIFY_STILL_WAITING_LINES;
const STATUS_FONT_SIZE = 16;
const STATUS_LINE_HEIGHT = 24;
const STILL_WAITING_FONT_SIZE = Math.round(STATUS_FONT_SIZE * 0.7);
const STILL_WAITING_LINE_HEIGHT = Math.round(STATUS_LINE_HEIGHT * 0.7);

export default function VerifyRequiredScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const { unlockGateForSession } = useAuthBoot();
  const frame = usePortrait916Layout("cover");
  const [resendBusy, setResendBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsStillWaiting, setStatusIsStillWaiting] = useState(false);
  const [statusIsError, setStatusIsError] = useState(false);
  const dwellTrackedRef = useRef(false);
  const verifyOpenedTrackedRef = useRef(false);

  useEffect(() => {
    trackAuthVerifyPending();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dwellTrackedRef.current) {
        dwellTrackedRef.current = true;
        trackAuthVerifyAbandoned(VERIFY_DWELL_MS / 1000);
      }
    }, VERIFY_DWELL_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        if (!verifyOpenedTrackedRef.current) {
          verifyOpenedTrackedRef.current = true;
          trackAuthVerifyEmailOpened();
        }
      }
      if (state === "active") {
        void handleVerifiedInitCheck();
      }
    });
    return () => sub.remove();
  }, []);

  const handleVerifiedInitCheck = useCallback(async () => {
    if (refreshBusy) return;
    setRefreshBusy(true);
    setStatusMessage(null);
    setStatusIsStillWaiting(false);
    setStatusIsError(false);
    try {
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) return;
      const result = await completeSanctuaryInitWithLegacyFallback(uid);
      if (result.status === "success" || result.status === "already_initialized") {
        trackAuthVerifyCompleted();
        router.replace(routes.emailVerified);
        return;
      }
      if (result.status === "not_verified") {
        setStatusMessage(STILL_WAITING_LINES.join("\n"));
        setStatusIsStillWaiting(true);
      } else if (result.status === "error") {
        setStatusMessage(AUTH_OPENING_GATE_ERROR);
        setStatusIsError(true);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { area: "auth", flow: "verify_refresh" } });
      setStatusMessage(formatFirebaseAuthError(error));
      setStatusIsError(true);
    } finally {
      setRefreshBusy(false);
    }
  }, [refreshBusy]);

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;
  const layerSize = { width: artboardWidth, height: artboardHeight };

  const refreshButtonStyle = normRectToStyle(
    verifyEmailHitRects.refreshButton,
    artboardWidth,
    artboardHeight,
  );
  const resendButtonStyle = normRectToStyle(
    verifyEmailHitRects.resendButton,
    artboardWidth,
    artboardHeight,
  );
  const countdownLabelStyle = normRectToStyle(
    verifyEmailHitRects.resendCountdownLabel,
    artboardWidth,
    artboardHeight,
  );
  const returnToSignUpLinkStyle = normRectToStyle(
    verifyEmailHitRects.returnToSignUpLink,
    artboardWidth,
    artboardHeight,
  );
  const statusMessageStyle = normRectToStyle(
    verifyEmailHitRects.statusMessage,
    artboardWidth,
    artboardHeight,
  );
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (resendBusy || cooldownSeconds > 0) return;
    setResendBusy(true);
    setStatusMessage(null);
    setStatusIsStillWaiting(false);
    setStatusIsError(false);
    try {
      await sendEmailVerificationForCurrentUser();
      trackAuthVerifyResent();
      setCooldownSeconds(60);
      setStatusMessage(AUTH_VERIFY_RESEND_SUCCESS);
      setStatusIsStillWaiting(false);
      setStatusIsError(false);
    } catch (error) {
      Sentry.captureException(error, { tags: { area: "auth", flow: "verify_resend" } });
      setStatusMessage(formatFirebaseAuthError(error));
      setStatusIsStillWaiting(false);
      setStatusIsError(true);
    } finally {
      setResendBusy(false);
    }
  };

  const handleRefresh = async () => {
    await handleVerifiedInitCheck();
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    router.replace(routes.login);
  };

  const handleReturnToSignUp = async () => {
    unlockGateForSession();
    await signOutCurrentUser();
    router.replace(routes.signup);
  };

  const showBusyOverlay = refreshBusy || resendBusy;

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
            source={media.auth.verifyEmail.linkSent}
            style={[styles.layerImage, layerSize]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          <Pressable
            style={[styles.hitTarget, refreshButtonStyle]}
            onPress={() => void handleRefresh()}
            disabled={refreshBusy}
            accessibilityRole="button"
            accessibilityLabel={AUTH_VERIFY_REFRESH_A11Y}
            accessibilityState={{ disabled: refreshBusy }}
          />

          <Pressable
            style={[styles.hitTarget, resendButtonStyle]}
            onPress={() => void handleResend()}
            disabled={resendBusy || cooldownSeconds > 0}
            accessibilityRole="button"
            accessibilityLabel={
              cooldownSeconds > 0
                ? `Resend available in ${cooldownSeconds} seconds`
                : "Resend verification email"
            }
            accessibilityState={{ disabled: resendBusy || cooldownSeconds > 0 }}
          />

          {cooldownSeconds > 0 ? (
            <Text
              style={[styles.countdownLabel, countdownLabelStyle as TextStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {`Resend available in ${cooldownSeconds}s`}
            </Text>
          ) : null}

          <Pressable
            style={[styles.returnToSignUpLink, returnToSignUpLinkStyle]}
            onPress={() => void handleReturnToSignUp()}
            accessibilityRole="link"
            accessibilityLabel={AUTH_VERIFY_RETURN_SIGNUP}
            hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          >
            <Text style={styles.returnToSignUpLabel} maxFontSizeMultiplier={1.3}>
              {AUTH_VERIFY_RETURN_SIGNUP}
            </Text>
          </Pressable>

          {statusMessage ? (
            <Text
              style={[
                styles.statusMessage,
                statusMessageStyle as TextStyle,
                statusIsStillWaiting ? styles.statusStillWaiting : null,
                statusIsError ? styles.statusError : styles.statusNeutral,
              ]}
              numberOfLines={statusIsStillWaiting ? 4 : 2}
              adjustsFontSizeToFit={!statusIsStillWaiting}
              maxFontSizeMultiplier={1.3}
              accessibilityLiveRegion="polite"
              accessibilityLabel={
                statusIsStillWaiting ? STILL_WAITING_LINES.join(" ") : statusMessage
              }
            >
              {statusMessage}
            </Text>
          ) : null}

          {VERIFY_EMAIL_HIT_DEBUG ? (
            <>
              <View style={[styles.debugRect, refreshButtonStyle]} />
              <View style={[styles.debugRect, resendButtonStyle]} />
              <View style={[styles.debugRect, countdownLabelStyle]} />
              <View style={[styles.debugRect, returnToSignUpLinkStyle]} />
              <View style={[styles.debugRect, statusMessageStyle]} />
            </>
          ) : null}
        </View>

        <Pressable
          style={styles.wrongEmailLink}
          onPress={() => void handleSignOut()}
          accessibilityRole="button"
          accessibilityLabel={AUTH_VERIFY_WRONG_EMAIL_A11Y}
        >
          <Text style={styles.wrongEmailLabel} maxFontSizeMultiplier={1.3}>
            Use a different email
          </Text>
        </Pressable>
      </ScrollView>

      {showBusyOverlay ? (
        <SanctuaryBreathingOverlay accessibilityLabel={AUTH_VERIFY_REFRESH_A11Y} />
      ) : null}
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
  countdownLabel: {
    position: "absolute",
    fontFamily: fontFamilies.handwritten,
    fontSize: 19,
    lineHeight: 26,
    marginTop: 10,
    color: "#2C1810",
    opacity: 0.55,
    textAlign: "center",
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },
  returnToSignUpLink: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  returnToSignUpLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 19,
    color: "#2C1810",
    opacity: 0.55,
    textDecorationLine: "underline",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  statusMessage: {
    position: "absolute",
    fontFamily: fontFamilies.bodySemi,
    fontSize: STATUS_FONT_SIZE,
    lineHeight: STATUS_LINE_HEIGHT,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  statusStillWaiting: {
    fontSize: STILL_WAITING_FONT_SIZE,
    lineHeight: STILL_WAITING_LINE_HEIGHT,
  },
  statusNeutral: {
    color: AUTH_INLINE_BROWN,
  },
  statusError: {
    color: DANGER_SOFT,
  },
  wrongEmailLink: {
    minHeight: 48,
    marginTop: 16,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  wrongEmailLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugRect: {
    position: "absolute",
    backgroundColor: "rgba(122, 92, 69, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.6)",
  },
});
