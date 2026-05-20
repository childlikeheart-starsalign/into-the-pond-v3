import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { media } from "@/src/constants/media";
import { normRectToStyle, resolveSignUpArtboardIntrinsic, signUpHitRects } from "@/src/constants/signUpArtboard";
import { routes } from "@/src/navigation/routes";
import { sendEmailVerificationForCurrentUser, signUpWithEmail } from "@/src/services/firebase/auth";

const signUpMedia = media.auth.signUp;

/**
 * Email/password sign-up: single artboard (25.png) with invisible hit targets.
 * Creates Firebase user, sends verification email, then routes to verify-required.
 */
export default function SignUpScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const intrinsic = useMemo(() => resolveSignUpArtboardIntrinsic(), []);
  const aspectRatio = intrinsic.height / intrinsic.width || 1024 / 576;

  const horizontalPad = spacing.inner * 2;
  const artboardWidth = Math.max(0, windowWidth - horizontalPad);
  const artboardHeight = artboardWidth * aspectRatio;

  const isEmailFormatValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = async () => {
    setEmailError(null);
    setPasswordError(null);

    if (!isEmailFormatValid) {
      setEmailError("Invalid email address");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password);
      try {
        await sendEmailVerificationForCurrentUser();
      } catch {
        // optional — user can resend from verify-required screen
      }
      router.replace(routes.verifyRequired);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      const isEmailError =
        code === "auth/email-already-in-use" ||
        code === "auth/invalid-email" ||
        code === "auth/operation-not-allowed";

      if (isEmailError) {
        setEmailError("Invalid email address");
      } else {
        setPasswordError("Invalid password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const emailInputStyle = normRectToStyle(signUpHitRects.emailInput, artboardWidth, artboardHeight);
  const passwordInputStyle = normRectToStyle(signUpHitRects.passwordInput, artboardWidth, artboardHeight);
  const toggleStyle = normRectToStyle(signUpHitRects.passwordToggle, artboardWidth, artboardHeight);
  const createButtonStyle = normRectToStyle(signUpHitRects.createAccountButton, artboardWidth, artboardHeight);
  const signInLinkStyle = normRectToStyle(signUpHitRects.signInLink, artboardWidth, artboardHeight);

  const inputTextStyle = {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  };

  const layerSize = { width: artboardWidth, height: artboardHeight };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.artboard, { width: artboardWidth, height: artboardHeight }]}>
            <Image
              source={signUpMedia.background}
              style={[styles.layerImage, layerSize]}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />

            {/* Invisible text inputs positioned over the drawn fields */}
            <TextInput
              style={[styles.textInput, emailInputStyle as TextStyle, inputTextStyle]}
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
              accessibilityHint="Enter your email address to create an account"
            />
            <TextInput
              style={[styles.textInput, passwordInputStyle as TextStyle, inputTextStyle]}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry={!showPassword}
              placeholder=""
              accessibilityLabel="Password"
              accessibilityHint="Enter your password (at least 6 characters)"
            />
            <Pressable
              style={[styles.hitTarget, toggleStyle]}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            />
            <Pressable
              style={[styles.hitTarget, createButtonStyle]}
              onPress={() => void onSubmit()}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: !canSubmit }}
            />
            <Pressable
              style={[styles.hitTarget, signInLinkStyle]}
              onPress={() => router.push(routes.login)}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
    paddingVertical: spacing.section,
  },
  artboard: {
    alignSelf: "center",
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
});
