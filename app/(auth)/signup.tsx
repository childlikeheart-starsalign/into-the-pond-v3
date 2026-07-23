import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import {
  AuthArtboardScreen,
  authArtboardFieldStyles,
} from "@/src/components/auth/AuthArtboardScreen";
import { AuthAppleSignInSection } from "@/src/components/auth/AuthAppleSignInSection";
import { AuthGoogleSignInSection } from "@/src/components/auth/AuthGoogleSignInSection";
import { AuthWaitingVideo } from "@/src/components/auth/AuthWaitingVideo";
import {
  AUTH_INVALID_EMAIL_FORMAT,
  AUTH_SIGNUP_CREATE_A11Y,
  AUTH_SIGNUP_SIGNIN_LINK_A11Y,
} from "@/src/constants/authCopy";
import { SIGNUP_ENTRANCE_MS, SIGNUP_ENTRANCE_OFFSET_Y } from "@/src/constants/gateTransition";
import { colors, fontFamilies } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { normRectToStyle, signUpHitRects } from "@/src/constants/signUpArtboard";
import { useAppleSignIn } from "@/src/hooks/auth/useAppleSignIn";
import { useGoogleSignIn } from "@/src/hooks/auth/useGoogleSignIn";
import { useAuthSoftDenyOnError } from "@/src/hooks/useAuthSoftDenyOnError";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";
import {
  setInitialAuthMethod,
  trackAuthSignupFailed,
  trackAuthSignupStarted,
  trackAuthSignupSubmitted,
} from "@/src/services/analytics/authFunnel";
import {
  sendEmailVerificationForCurrentUser,
  signOutCurrentUser,
  signUpWithEmail,
} from "@/src/services/firebase/auth";
import { mapSignupError } from "@/src/services/firebase/mapSignupError";
import { playAuthSoftDeny, playAuthWelcome } from "@/src/services/audio/authSounds";
import { playPaperClick } from "@/src/services/audio/playPaperClick";
import { Sentry } from "@/src/services/sentry/init";

const signUpMedia = media.auth.signUp;
const DANGER_SOFT = "#B86A6A";
const SEND_FAILURE_MESSAGE =
  "Your place is saved. We just couldn't reach your inbox — you can still continue.";

/**
 * Email/password sign-up: single artboard (25.png) with invisible hit targets.
 * Creates Firebase user, sends verification email, then routes to verify-required.
 */
export default function SignUpScreen() {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [sendFailure, setSendFailure] = useState(false);
  const {
    signIn: appleSignIn,
    loading: appleLoading,
    error: appleError,
    clearError,
  } = useAppleSignIn();
  const {
    signIn: googleSignIn,
    loading: googleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleSignIn();

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;

  const slideY = useSharedValue(SIGNUP_ENTRANCE_OFFSET_Y);
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        slideY.value = 0;
        fadeIn.value = 1;
        return;
      }
      slideY.value = withTiming(0, {
        duration: SIGNUP_ENTRANCE_MS,
        easing: Easing.out(Easing.quad),
      });
      fadeIn.value = withTiming(1, {
        duration: SIGNUP_ENTRANCE_MS,
        easing: Easing.out(Easing.quad),
      });
    });
  }, [fadeIn, slideY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideY.value }],
  }));

  const isEmailFormatValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    !submitting &&
    !appleLoading &&
    !googleLoading &&
    !sendFailure;

  const onSubmit = async () => {
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSendFailure(false);

    if (!isEmailFormatValid) {
      setEmailError(AUTH_INVALID_EMAIL_FORMAT);
      void playAuthSoftDeny();
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      void playAuthSoftDeny();
      return;
    }

    playPaperClick();
    setSubmitting(true);
    try {
      setInitialAuthMethod("email");
      trackAuthSignupSubmitted("email");
      await signUpWithEmail(email.trim(), password);
      void playAuthWelcome();
      try {
        await sendEmailVerificationForCurrentUser();
        router.replace(routes.verifyRequired);
      } catch (e) {
        Sentry.captureException(e, { tags: { area: "auth", flow: "sign_up_verify_send" } });
        setSendFailure(true);
      }
    } catch (e) {
      Sentry.captureException(e, { tags: { area: "auth", flow: "sign_up_email" } });
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      trackAuthSignupFailed({ errorCode: code || "unknown", authMethod: "email" });
      const mapped = mapSignupError(code);
      if (mapped.field === "email") {
        setEmailError(mapped.message);
      } else if (mapped.field === "password") {
        setPasswordError(mapped.message);
      } else {
        setGeneralError(mapped.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleSignIn = useCallback(async () => {
    clearError();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSendFailure(false);
    playPaperClick();
    trackAuthSignupStarted({ authMethod: "apple", focusedField: "oauth_apple" });
    trackAuthSignupSubmitted("apple");
    setInitialAuthMethod("apple");
    const result = await appleSignIn();
    if (!result) {
      trackAuthSignupFailed({ errorCode: "apple/canceled", authMethod: "apple" });
    } else {
      void playAuthWelcome();
    }
  }, [appleSignIn, clearError]);

  const handleGoogleSignIn = useCallback(async () => {
    clearGoogleError();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSendFailure(false);
    playPaperClick();
    trackAuthSignupStarted({ authMethod: "google", focusedField: "oauth_google" });
    trackAuthSignupSubmitted("google");
    setInitialAuthMethod("google");
    const result = await googleSignIn();
    if (!result) {
      trackAuthSignupFailed({ errorCode: "google/canceled", authMethod: "google" });
    } else {
      void playAuthWelcome();
    }
  }, [clearGoogleError, googleSignIn]);

  const onContinueToVerification = () => {
    router.replace(routes.verifyRequired);
  };

  const onSignOutAndRetry = async () => {
    await signOutCurrentUser();
    setSendFailure(false);
    router.replace(routes.login);
  };

  const emailInputStyle = normRectToStyle(signUpHitRects.emailInput, artboardWidth, artboardHeight);
  const passwordInputStyle = normRectToStyle(
    signUpHitRects.passwordInput,
    artboardWidth,
    artboardHeight,
  );
  const createButtonStyle = normRectToStyle(
    signUpHitRects.createAccountButton,
    artboardWidth,
    artboardHeight,
  );
  const signInLinkStyle = normRectToStyle(signUpHitRects.signInLink, artboardWidth, artboardHeight);
  const appleSignInStyle = normRectToStyle(
    signUpHitRects.appleSignIn,
    artboardWidth,
    artboardHeight,
  );

  const emailErrorStyle = normRectToStyle(
    {
      left: signUpHitRects.emailInput.left,
      top: signUpHitRects.emailInput.top + signUpHitRects.emailInput.height + 0.006,
      width: signUpHitRects.emailInput.width,
      height: 0.04,
    },
    artboardWidth,
    artboardHeight,
  );
  const passwordErrorStyle = normRectToStyle(
    {
      left: signUpHitRects.passwordInput.left,
      top: signUpHitRects.passwordInput.top + signUpHitRects.passwordInput.height + 0.006,
      width: signUpHitRects.passwordInput.width,
      height: 0.04,
    },
    artboardWidth,
    artboardHeight,
  );

  const inputTextStyle = {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  };

  useAuthSoftDenyOnError([emailError, passwordError, generalError, appleError, googleError]);

  return (
    <AuthArtboardScreen
      backgroundSource={signUpMedia.background}
      artboardAnimatedStyle={cardStyle}
      scrollContentStyle={{ backgroundColor: colors.bg }}
      footer={
        <>
          {generalError ? (
            <Text
              style={styles.generalErrorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {generalError}
            </Text>
          ) : null}

          {sendFailure ? (
            <View style={styles.failureRegion}>
              <Text
                style={styles.failureMessage}
                accessibilityLiveRegion="polite"
                accessibilityLabel={SEND_FAILURE_MESSAGE}
              >
                {SEND_FAILURE_MESSAGE}
              </Text>
              <Pressable
                style={styles.primaryCta}
                onPress={onContinueToVerification}
                accessibilityRole="button"
                accessibilityLabel="Continue to verification"
              >
                <Text style={styles.primaryCtaLabel}>Continue to verification</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryLink}
                onPress={() => void onSignOutAndRetry()}
                accessibilityRole="button"
                accessibilityLabel="Sign out and try again"
              >
                <Text style={styles.secondaryLinkLabel}>Sign out and try again</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      }
      overlay={
        submitting || appleLoading || googleLoading ? (
          <AuthWaitingVideo accessibilityLabel="Creating your account" />
        ) : null
      }
    >
      <AuthAppleSignInSection
        containerStyle={appleSignInStyle}
        disabled={submitting || appleLoading || googleLoading || sendFailure}
        loading={appleLoading}
        error={appleError}
        onSignIn={() => void handleAppleSignIn()}
      />

      <AuthGoogleSignInSection
        containerStyle={appleSignInStyle}
        disabled={submitting || appleLoading || googleLoading || sendFailure}
        loading={googleLoading}
        error={googleError}
        onSignIn={() => void handleGoogleSignIn()}
      />

      <TextInput
        style={[authArtboardFieldStyles.textInput, emailInputStyle as TextStyle, inputTextStyle]}
        value={email}
        onChangeText={(t) => {
          trackAuthSignupStarted({ authMethod: "email", focusedField: "email" });
          setEmail(t);
          setEmailError(null);
          setGeneralError(null);
        }}
        spellCheck={false}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        textAlignVertical="center"
        placeholder=""
        accessibilityLabel="Email address"
        accessibilityHint="Enter your email address to create an account"
        editable={!sendFailure}
      />
      {emailError === "email-in-use" ? (
        <View style={[emailErrorStyle, styles.emailInUseErrorOffset]}>
          <Text style={styles.emailInUseErrorText}>
            You already have a pond here.{" "}
            <Text
              onPress={() => router.replace(routes.login)}
              style={styles.emailInUseErrorLink}
              accessibilityRole="link"
              accessibilityLabel="Sign in instead"
            >
              Sign in instead?
            </Text>
          </Text>
        </View>
      ) : emailError ? (
        <Text
          style={[styles.errorText, emailErrorStyle as TextStyle]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {emailError}
        </Text>
      ) : null}
      <View style={passwordInputStyle}>
        <TextInput
          style={[
            authArtboardFieldStyles.textInput,
            authArtboardFieldStyles.passwordTextInput,
            inputTextStyle,
          ]}
          value={password}
          onChangeText={(t) => {
            trackAuthSignupStarted({ authMethod: "email", focusedField: "password" });
            setPassword(t);
            setPasswordError(null);
            setGeneralError(null);
          }}
          spellCheck={false}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          textAlignVertical="center"
          secureTextEntry={!showPassword}
          placeholder=""
          accessibilityLabel="Password"
          accessibilityHint="Enter your password (at least 6 characters)"
          editable={!sendFailure}
        />
        <Pressable
          style={authArtboardFieldStyles.passwordToggleButton}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          disabled={sendFailure}
        >
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#8B7355" />
        </Pressable>
      </View>
      {passwordError ? (
        <Text
          style={[styles.errorText, passwordErrorStyle as TextStyle]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {passwordError}
        </Text>
      ) : null}
      <Pressable
        style={[authArtboardFieldStyles.hitTarget, createButtonStyle]}
        onPress={() => void onSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel={AUTH_SIGNUP_CREATE_A11Y}
        accessibilityState={{ disabled: !canSubmit }}
      />
      <Pressable
        style={[authArtboardFieldStyles.hitTarget, signInLinkStyle]}
        onPress={() => router.push(routes.login)}
        accessibilityRole="link"
        accessibilityLabel={AUTH_SIGNUP_SIGNIN_LINK_A11Y}
      />
    </AuthArtboardScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: DANGER_SOFT,
  },
  emailInUseErrorText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 9,
    lineHeight: 13,
    color: DANGER_SOFT,
  },
  emailInUseErrorOffset: {
    transform: [{ translateX: 4 }, { translateY: 7 }],
  },
  errorLink: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  emailInUseErrorLink: {
    fontSize: 9,
    lineHeight: 13,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  generalErrorText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: DANGER_SOFT,
    marginTop: 16,
    marginHorizontal: 16,
    textAlign: "center",
  },
  failureRegion: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 16,
  },
  failureMessage: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    lineHeight: 24,
    color: DANGER_SOFT,
    textAlign: "center",
  },
  primaryCta: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryCtaLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
  secondaryLink: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  secondaryLinkLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
