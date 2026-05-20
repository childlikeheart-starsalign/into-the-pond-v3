import { useEffect, useMemo, useState } from "react";
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
import {
  forgotPasswordHitRects,
  forgotPasswordSentHitRects,
  normRectToStyle,
  resolveForgotPasswordArtboardIntrinsic,
} from "@/src/constants/forgotPasswordArtboard";
import { sendPasswordReset } from "@/src/services/firebase/auth";

const forgotPasswordMedia = media.auth.forgotPassword;
const COOLDOWN_SECONDS = 60;

/**
 * Forgot password flow:
 *   1. reset-password.png  — email input + Reset Password button
 *   2. reset-password-sent.png — confirmation with 60 s Resend countdown
 *      → after countdown expires → returns to step 1
 */
export default function ForgotPasswordScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const intrinsic = useMemo(() => resolveForgotPasswordArtboardIntrinsic(), []);
  const aspectRatio = intrinsic.height / intrinsic.width || 1024 / 576;

  const horizontalPad = spacing.inner * 2;
  const artboardWidth = Math.max(0, windowWidth - horizontalPad);
  const artboardHeight = artboardWidth * aspectRatio;

  const isEmailFormatValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  const canSubmit = email.trim().length > 0 && !submitting;

  // Tick the cooldown every second; when it hits 0 go back to the form.
  useEffect(() => {
    if (cooldown <= 0) {
      if (sent) {
        setSent(false);
        setEmail("");
        setError(null);
      }
      return;
    }
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown, sent]);

  const onSubmit = async () => {
    setError(null);

    if (!isEmailFormatValid) {
      setError("Invalid email address");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Could not send reset email. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0) return;
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setCooldown(10);
    } finally {
      setSubmitting(false);
    }
  };

  const emailInputStyle = normRectToStyle(
    forgotPasswordHitRects.emailInput,
    artboardWidth,
    artboardHeight,
  );
  const resetButtonStyle = normRectToStyle(
    forgotPasswordHitRects.resetButton,
    artboardWidth,
    artboardHeight,
  );
  const resendButtonStyle = normRectToStyle(
    forgotPasswordSentHitRects.resendButton,
    artboardWidth,
    artboardHeight,
  );

  const inputTextStyle = {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  };

  const layerSize = { width: artboardWidth, height: artboardHeight };

  // ── LINK SENT CONFIRMATION ────────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.artboard, { width: artboardWidth, height: artboardHeight }]}>
            <Image
              source={forgotPasswordMedia.linkSent}
              style={[styles.layerImage, layerSize]}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />

            {/* Resend button — disabled while cooldown > 0 */}
            <Pressable
              style={[styles.hitTarget, resendButtonStyle]}
              onPress={() => void onResend()}
              disabled={cooldown > 0 || submitting}
              accessibilityRole="button"
              accessibilityLabel={
                cooldown > 0 ? `Resend available in ${cooldown} seconds` : "Resend reset email"
              }
              accessibilityState={{ disabled: cooldown > 0 || submitting }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── FORGOT PASSWORD FORM ─────────────────────────────────────────────────
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
              source={forgotPasswordMedia.background}
              style={[styles.layerImage, layerSize]}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />

            {/* Invisible text input positioned over the drawn email field */}
            <TextInput
              style={[styles.textInput, emailInputStyle as TextStyle, inputTextStyle]}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder=""
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to reset password"
            />

            {/* Invisible pressable over Reset Password button */}
            <Pressable
              style={[styles.hitTarget, resetButtonStyle]}
              onPress={() => void onSubmit()}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Reset password"
              accessibilityState={{ disabled: !canSubmit }}
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
