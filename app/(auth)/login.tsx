import { Asset } from "expo-asset";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Linking, Pressable, TextInput, Text, View, type TextStyle } from "react-native";

import {
  AuthArtboardScreen,
  authArtboardFieldStyles,
} from "@/src/components/auth/AuthArtboardScreen";
import { AuthAppleSignInSection } from "@/src/components/auth/AuthAppleSignInSection";
import { AuthGoogleSignInSection } from "@/src/components/auth/AuthGoogleSignInSection";
import { ErrorOverlay } from "@/src/components/auth/ErrorOverlay";
import {
  AUTH_FORGOT_PASSWORD_A11Y,
  AUTH_INVALID_EMAIL_FORMAT,
  AUTH_LOGIN_BUTTON_A11Y,
  AUTH_LOGIN_SIGNUP_LINK_A11Y,
  AUTH_UNKNOWN_ERROR,
  AUTH_WRONG_PASSWORD,
} from "@/src/constants/authCopy";
import { SIGN_IN_ARTBOARD_MIN_MS } from "@/src/constants/signInArrival";
import { fontFamilies, colors } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { normRectToStyle, signInHitRects } from "@/src/constants/signInArtboard";
import { useSignInArrival } from "@/src/contexts/SignInArrivalContext";
import { useAppleSignIn } from "@/src/hooks/auth/useAppleSignIn";
import { useGoogleSignIn } from "@/src/hooks/auth/useGoogleSignIn";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";
import {
  identifyReturningUser,
  trackAuthErrorEncountered,
  trackAuthFormSubmitted,
  trackAuthInteractionStarted,
} from "@/src/services/analytics/authFunnel";
import {
  mapSignInScreenError,
  signInWithEmailForLoginScreen,
} from "@/src/services/firebase/signInClassification";
import { maybeMarkCelebrationForReturningUser } from "@/src/services/onboarding/maybeMarkCelebrationForReturningUser";
import { Sentry } from "@/src/services/sentry/init";

const signInMedia = media.auth.signIn;
const DELETE_ACCOUNT_WEB_URL = "https://intothepond.app/delete-account";

/**
 * Email/password sign-in: single artboard (14.png) with invisible hit targets.
 * Invalid email → 22.png; invalid password → 23.png; returning load → root arrival overlay.
 */
export function SignInScreen() {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const { active: signInArrivalActive, startArtboard, startVideo, cancel } = useSignInArrival();
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    void Asset.loadAsync([
      signInMedia.background,
      signInMedia.invalidEmailBg,
      signInMedia.invalidPasswordBg,
      media.startup.waitingScreen,
    ]);
  }, []);

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;

  const isEmailFormatValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    !signInArrivalActive &&
    !appleLoading &&
    !googleLoading;

  const backgroundSource =
    passwordError != null
      ? signInMedia.invalidPasswordBg
      : emailError != null
        ? signInMedia.invalidEmailBg
        : signInMedia.background;

  const onSubmit = async () => {
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    if (!isEmailFormatValid) {
      setEmailError(AUTH_INVALID_EMAIL_FORMAT);
      return;
    }

    Keyboard.dismiss();
    startArtboard();

    try {
      trackAuthFormSubmitted("email");
      const [result] = await Promise.all([
        signInWithEmailForLoginScreen(email, password),
        new Promise<void>((resolve) => setTimeout(resolve, SIGN_IN_ARTBOARD_MIN_MS)),
      ]);

      if (!result.user.emailVerified) {
        cancel();
        router.replace(routes.verifyRequired);
        return;
      }

      const markResult = await maybeMarkCelebrationForReturningUser(result.user.uid);
      if (markResult === false) {
        cancel();
        return;
      }

      identifyReturningUser();
      startVideo(result.user.uid, markResult === "unknown");
    } catch (e) {
      Sentry.captureException(e, { tags: { area: "auth", flow: "sign_in_email" } });
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      trackAuthErrorEncountered({ errorCode: code || "unknown", authMethod: "email" });
      const mapped = mapSignInScreenError(e);
      if (mapped.emailError) {
        setEmailError(mapped.emailError);
      } else if (mapped.passwordError) {
        setPasswordError(mapped.passwordError);
      } else {
        setGeneralError(AUTH_UNKNOWN_ERROR);
      }
      cancel();
    }
  };

  const handleAppleSignIn = useCallback(async () => {
    clearError();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    Keyboard.dismiss();
    startArtboard();

    try {
      trackAuthInteractionStarted({
        focusedField: "oauth_apple",
        authMethodAttempted: "apple",
      });
      trackAuthFormSubmitted("apple");
      const [result] = await Promise.all([
        appleSignIn(),
        new Promise<void>((resolve) => setTimeout(resolve, SIGN_IN_ARTBOARD_MIN_MS)),
      ]);

      if (!result) {
        trackAuthErrorEncountered({ errorCode: "apple/canceled", authMethod: "apple" });
        cancel();
        return;
      }

      if (!result.user.emailVerified) {
        cancel();
        router.replace(routes.verifyRequired);
        return;
      }

      const markResult = await maybeMarkCelebrationForReturningUser(result.user.uid);
      if (markResult === false) {
        cancel();
        return;
      }

      identifyReturningUser();
      startVideo(result.user.uid, markResult === "unknown");
    } catch (e) {
      Sentry.captureException(e, { tags: { area: "auth", flow: "sign_in_apple" } });
      trackAuthErrorEncountered({ errorCode: "apple/unknown", authMethod: "apple" });
      cancel();
    }
  }, [appleSignIn, cancel, clearError, startArtboard, startVideo]);

  const handleGoogleSignIn = useCallback(async () => {
    clearGoogleError();
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    Keyboard.dismiss();
    startArtboard();

    try {
      trackAuthInteractionStarted({
        focusedField: "oauth_google",
        authMethodAttempted: "google",
      });
      trackAuthFormSubmitted("google");
      const [result] = await Promise.all([
        googleSignIn(),
        new Promise<void>((resolve) => setTimeout(resolve, SIGN_IN_ARTBOARD_MIN_MS)),
      ]);

      if (!result) {
        trackAuthErrorEncountered({ errorCode: "google/canceled", authMethod: "google" });
        cancel();
        return;
      }

      if (!result.user.emailVerified) {
        cancel();
        router.replace(routes.verifyRequired);
        return;
      }

      const markResult = await maybeMarkCelebrationForReturningUser(result.user.uid);
      if (markResult === false) {
        cancel();
        return;
      }

      identifyReturningUser();
      startVideo(result.user.uid, markResult === "unknown");
    } catch (e) {
      Sentry.captureException(e, { tags: { area: "auth", flow: "sign_in_google" } });
      trackAuthErrorEncountered({ errorCode: "google/unknown", authMethod: "google" });
      cancel();
    }
  }, [cancel, clearGoogleError, googleSignIn, startArtboard, startVideo]);

  const emailInputStyle = normRectToStyle(signInHitRects.emailInput, artboardWidth, artboardHeight);
  const passwordInputStyle = normRectToStyle(
    signInHitRects.passwordInput,
    artboardWidth,
    artboardHeight,
  );
  const signInButtonStyle = normRectToStyle(
    signInHitRects.signInButton,
    artboardWidth,
    artboardHeight,
  );
  const signUpLinkStyle = normRectToStyle(signInHitRects.signUpLink, artboardWidth, artboardHeight);
  const forgotLinkStyle = normRectToStyle(
    signInHitRects.forgotPasswordLink,
    artboardWidth,
    artboardHeight,
  );
  const appleSignInStyle = normRectToStyle(
    signInHitRects.appleSignIn,
    artboardWidth,
    artboardHeight,
  );

  const inputTextStyle = {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  };

  const inputsLocked = signInArrivalActive || appleLoading || googleLoading;

  return (
    <AuthArtboardScreen
      backgroundSource={backgroundSource}
      footer={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Delete account without signing in"
          onPress={() => void Linking.openURL(DELETE_ACCOUNT_WEB_URL)}
          style={loginFooterStyles.link}
        >
          <Text style={loginFooterStyles.linkText}>Delete account</Text>
        </Pressable>
      }
    >
      <ErrorOverlay
        visible={emailError != null}
        message={emailError ?? AUTH_INVALID_EMAIL_FORMAT}
      />
      <ErrorOverlay
        visible={passwordError != null}
        message={passwordError ?? AUTH_WRONG_PASSWORD}
        linkText={AUTH_FORGOT_PASSWORD_A11Y}
        onLinkPress={() => router.push(routes.forgotPassword)}
      />
      <ErrorOverlay visible={generalError != null} message={generalError ?? AUTH_UNKNOWN_ERROR} />

      <AuthAppleSignInSection
        containerStyle={appleSignInStyle}
        disabled={inputsLocked}
        loading={appleLoading}
        error={appleError}
        onSignIn={() => void handleAppleSignIn()}
      />

      <AuthGoogleSignInSection
        containerStyle={appleSignInStyle}
        disabled={inputsLocked}
        loading={googleLoading}
        error={googleError}
        onSignIn={() => void handleGoogleSignIn()}
      />

      <TextInput
        style={[authArtboardFieldStyles.textInput, emailInputStyle as TextStyle, inputTextStyle]}
        value={email}
        onChangeText={(t) => {
          trackAuthInteractionStarted({
            focusedField: "email",
            authMethodAttempted: "email",
          });
          setEmail(t);
          setEmailError(null);
          setGeneralError(null);
        }}
        editable={!inputsLocked}
        spellCheck={false}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        textAlignVertical="center"
        placeholder=""
        accessibilityLabel="Email address"
        accessibilityHint="Enter your email address to sign in"
      />
      <View style={passwordInputStyle}>
        <TextInput
          style={[
            authArtboardFieldStyles.textInput,
            authArtboardFieldStyles.passwordTextInput,
            inputTextStyle,
          ]}
          value={password}
          onChangeText={(t) => {
            trackAuthInteractionStarted({
              focusedField: "password",
              authMethodAttempted: "email",
            });
            setPassword(t);
            setPasswordError(null);
            setGeneralError(null);
          }}
          editable={!inputsLocked}
          spellCheck={false}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          textAlignVertical="center"
          secureTextEntry={!showPassword}
          placeholder=""
          accessibilityLabel="Password"
          accessibilityHint="Enter your password"
        />
        <Pressable
          style={authArtboardFieldStyles.passwordToggleButton}
          disabled={inputsLocked}
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#8B7355" />
        </Pressable>
      </View>
      <Pressable
        style={[authArtboardFieldStyles.hitTarget, signInButtonStyle]}
        onPress={() => void onSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel={AUTH_LOGIN_BUTTON_A11Y}
        accessibilityState={{ disabled: !canSubmit }}
      />
      <Pressable
        style={[authArtboardFieldStyles.hitTarget, signUpLinkStyle]}
        disabled={inputsLocked}
        onPress={() => router.push(routes.signup)}
        accessibilityRole="link"
        accessibilityLabel={AUTH_LOGIN_SIGNUP_LINK_A11Y}
      />
      <Pressable
        style={[authArtboardFieldStyles.hitTarget, forgotLinkStyle]}
        disabled={inputsLocked}
        onPress={() => router.push(routes.forgotPassword)}
        accessibilityRole="link"
        accessibilityLabel={AUTH_FORGOT_PASSWORD_A11Y}
      />
    </AuthArtboardScreen>
  );
}

export default SignInScreen;

const loginFooterStyles = {
  link: {
    minHeight: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  linkText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: "underline" as const,
  },
};
