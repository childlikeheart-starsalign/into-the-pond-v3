import { router, useLocalSearchParams } from "expo-router";
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
import {
  normRectToStyle,
  resetPasswordHitRects,
  resolveResetPasswordArtboardIntrinsic,
} from "@/src/constants/resetPasswordArtboard";
import { routes } from "@/src/navigation/routes";
import { confirmNewPassword } from "@/src/services/firebase/auth";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";

const resetPasswordMedia = media.auth.resetPassword;

function paramFirst(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Enter new password: single artboard (enter-new-password.png) with invisible hit targets.
 * Confirms the Firebase oobCode from the deep-link, then routes to login on success.
 */
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ oobCode?: string | string[]; mode?: string | string[] }>();
  const oobCode = useMemo(() => paramFirst(params.oobCode), [params.oobCode]);

  const { width: windowWidth } = useWindowDimensions();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intrinsic = useMemo(() => resolveResetPasswordArtboardIntrinsic(), []);
  const aspectRatio = intrinsic.height / intrinsic.width || 1024 / 576;

  const horizontalPad = spacing.inner * 2;
  const artboardWidth = Math.max(0, windowWidth - horizontalPad);
  const artboardHeight = artboardWidth * aspectRatio;

  const canSubmit = password.length >= 6 && !!oobCode && !submitting;

  const onSubmit = async () => {
    setError(null);
    if (!oobCode) {
      setError("Invalid or expired reset link. Request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmNewPassword(oobCode, password);
      router.replace(routes.login);
    } catch (e) {
      setError(formatFirebaseAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordInputStyle = normRectToStyle(
    resetPasswordHitRects.passwordInput,
    artboardWidth,
    artboardHeight,
  );
  const enterButtonStyle = normRectToStyle(
    resetPasswordHitRects.enterButton,
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
              source={resetPasswordMedia.background}
              style={[styles.layerImage, layerSize]}
              resizeMode="stretch"
              accessibilityIgnoresInvertColors
            />

            {/* Invisible password input positioned over the drawn field */}
            <TextInput
              style={[styles.textInput, passwordInputStyle as TextStyle, inputTextStyle]}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry
              placeholder=""
              editable={!!oobCode}
              accessibilityLabel="New password"
              accessibilityHint="Enter your new password (at least 6 characters)"
            />

            {/* Invisible pressable over the Enter button */}
            <Pressable
              style={[styles.hitTarget, enterButtonStyle]}
              onPress={() => void onSubmit()}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel={submitting ? "Saving password" : "Enter new password"}
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
