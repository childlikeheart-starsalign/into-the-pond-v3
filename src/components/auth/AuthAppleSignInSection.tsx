import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { fontFamilies } from "@/src/constants/theme";

const DIVIDER_LINE_COLOR = "rgba(44, 24, 16, 0.18)";
const DIVIDER_LABEL_COLOR = "rgba(44, 24, 16, 0.38)";
const ERROR_TEXT_COLOR = "rgba(44, 24, 16, 0.65)";

type AuthAppleSignInSectionProps = {
  containerStyle: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onSignIn: () => void;
};

/** iOS Sign in with Apple block — official button + warm field-journal divider. */
export function AuthAppleSignInSection({
  containerStyle,
  disabled = false,
  loading = false,
  error = null,
  onSignIn,
}: AuthAppleSignInSectionProps) {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      setIsAvailable(false);
      return;
    }
    void AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  if (Platform.OS !== "ios" || !isAvailable) {
    return null;
  }

  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    onSignIn();
  };

  return (
    <View style={[styles.container, containerStyle]} pointerEvents="box-none">
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={styles.appleButton}
        onPress={handlePress}
      />

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: "rgba(237, 232, 200, 0)",
    paddingVertical: 0,
    marginBottom: 24,
  },
  appleButton: {
    width: "100%",
    height: 48,
  },
  errorText: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 13,
    color: ERROR_TEXT_COLOR,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DIVIDER_LINE_COLOR,
  },
  dividerLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 12,
    color: DIVIDER_LABEL_COLOR,
    marginHorizontal: 14,
    letterSpacing: 1.2,
    textTransform: "lowercase",
  },
});
