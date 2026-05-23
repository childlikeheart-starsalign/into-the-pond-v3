import { Asset } from "expo-asset";
import { router } from "expo-router";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type LayoutChangeEvent,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { normRectToStyle, signInHitRects } from "@/src/constants/signInArtboard";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";
import { signInWithEmail } from "@/src/services/firebase/auth";
import { userProfileExistsForAuthUser } from "@/src/services/firebase/userAccess";

const signInMedia = media.auth.signIn;

/** Temporary: Metro logs layout + window bounds when tapping invisible hit targets. Set false when done tuning rects. */
const SIGN_IN_HIT_DEBUG = __DEV__ && true;

function logSignInHitLayout(
  name: string,
  artboardWidth: number,
  artboardHeight: number,
): (e: LayoutChangeEvent) => void {
  return (e) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    console.log(`[sign-in hit] ${name} layout (relative to artboard)`, {
      artboardPx: { x, y, width, height },
      normalized: {
        left: Number((x / artboardWidth).toFixed(4)),
        top: Number((y / artboardHeight).toFixed(4)),
        width: Number((width / artboardWidth).toFixed(4)),
        height: Number((height / artboardHeight).toFixed(4)),
      },
      artboardSize: { width: artboardWidth, height: artboardHeight },
    });
  };
}

function logSignInTapWindow(name: string, ref: RefObject<View | null>) {
  ref.current?.measureInWindow((wx, wy, w, h) => {
    console.log(`[sign-in hit] ${name} tap measureInWindow (screen px)`, {
      x: wx,
      y: wy,
      width: w,
      height: h,
    });
  });
}

/**
 * Email/password sign-in: single artboard (14.png) with invisible hit targets.
 * Invalid email → 22.png; invalid password → 23.png; submitting → 24.png overlay.
 */
export function SignInScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const frame = usePortrait916Layout();
  const toggleHitRef = useRef<View>(null);
  const signInHitRef = useRef<View>(null);
  const signUpHitRef = useRef<View>(null);
  const forgotHitRef = useRef<View>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    void Asset.loadAsync([
      signInMedia.background,
      signInMedia.invalidEmailBg,
      signInMedia.invalidPasswordBg,
      signInMedia.loading,
    ]);
  }, []);

  // Fit the 576×1024 artboard inside the screen without cropping UI at the edges.
  const artboardWidth = frame.width;
  const artboardHeight = frame.height;

  const isEmailFormatValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const backgroundSource =
    passwordError != null
      ? signInMedia.invalidPasswordBg
      : emailError != null
        ? signInMedia.invalidEmailBg
        : signInMedia.background;

  const onSubmit = async () => {
    setEmailError(null);
    setPasswordError(null);
    if (!isEmailFormatValid) {
      setEmailError("Invalid email address");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signInWithEmail(email.trim(), password);
      const hasProfile = result.user.emailVerified
        ? false
        : await userProfileExistsForAuthUser(result.user);
      const canEnterMainApp = result.user.emailVerified || hasProfile;
      router.replace(canEnterMainApp ? routes.sanctuary : routes.verifyRequired);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      const isEmailError =
        code === "auth/user-not-found" ||
        code === "auth/invalid-email" ||
        code === "auth/user-disabled";

      if (isEmailError) {
        setEmailError("Invalid email address");
      } else {
        setPasswordError("Invalid password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const emailInputStyle = normRectToStyle(signInHitRects.emailInput, artboardWidth, artboardHeight);
  const passwordInputStyle = normRectToStyle(
    signInHitRects.passwordInput,
    artboardWidth,
    artboardHeight,
  );
  const toggleStyle = normRectToStyle(signInHitRects.passwordToggle, artboardWidth, artboardHeight);
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

  const inputTextStyle = {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  };

  const layerSize = { width: artboardWidth, height: artboardHeight };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: windowHeight, backgroundColor: colors.bg },
          ]}
          keyboardShouldPersistTaps="handled"
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
            onLayout={
              SIGN_IN_HIT_DEBUG
                ? logSignInHitLayout("ARTBOARD", artboardWidth, artboardHeight)
                : undefined
            }
            collapsable={false}
          >
            <Image
              source={backgroundSource}
                style={[styles.layerImage, layerSize]}
                resizeMode="cover"
              accessibilityIgnoresInvertColors
            />

            {/* Invisible text inputs positioned over the drawn fields */}
            <TextInput
              style={[styles.textInput, emailInputStyle as TextStyle, inputTextStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout("emailInput", artboardWidth, artboardHeight)
                  : undefined
              }
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder=""
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to sign in"
            />
            <TextInput
              style={[styles.textInput, passwordInputStyle as TextStyle, inputTextStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout("passwordInput", artboardWidth, artboardHeight)
                  : undefined
              }
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              autoComplete="password"
              textContentType="password"
              secureTextEntry={!showPassword}
              placeholder=""
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
            <Pressable
              ref={toggleHitRef}
              style={[styles.hitTarget, toggleStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout("passwordToggle (overlay)", artboardWidth, artboardHeight)
                  : undefined
              }
              collapsable={false}
              onPress={() => {
                if (SIGN_IN_HIT_DEBUG) logSignInTapWindow("passwordToggle", toggleHitRef);
                setShowPassword((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            />
            <Pressable
              ref={signInHitRef}
              style={[styles.hitTarget, signInButtonStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout("signInButton (overlay)", artboardWidth, artboardHeight)
                  : undefined
              }
              collapsable={false}
              onPress={() => {
                if (SIGN_IN_HIT_DEBUG) logSignInTapWindow("signInButton", signInHitRef);
                void onSubmit();
              }}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: !canSubmit }}
            />
            <Pressable
              ref={signUpHitRef}
              style={[styles.hitTarget, signUpLinkStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout("signUpLink (overlay)", artboardWidth, artboardHeight)
                  : undefined
              }
              collapsable={false}
              onPress={() => {
                if (SIGN_IN_HIT_DEBUG) logSignInTapWindow("signUpLink", signUpHitRef);
                router.push(routes.signup);
              }}
              accessibilityRole="link"
              accessibilityLabel="New user sign up here"
            />
            <Pressable
              ref={forgotHitRef}
              style={[styles.hitTarget, forgotLinkStyle]}
              onLayout={
                SIGN_IN_HIT_DEBUG
                  ? logSignInHitLayout(
                      "forgotPasswordLink (overlay)",
                      artboardWidth,
                      artboardHeight,
                    )
                  : undefined
              }
              collapsable={false}
              onPress={() => {
                if (SIGN_IN_HIT_DEBUG) logSignInTapWindow("forgotPasswordLink", forgotHitRef);
                router.push(routes.forgotPassword);
              }}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {submitting ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <Image
            source={signInMedia.loading}
            style={[styles.loadingImage, layerSize]}
            resizeMode="contain"
            accessibilityLabel="Signing in"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default SignInScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboard: {
    flex: 1,
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
  textInput: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  hitTarget: {
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingImage: {
    alignSelf: "center",
  },
});
