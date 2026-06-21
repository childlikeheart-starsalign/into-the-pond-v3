import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies } from "@/src/constants/theme";

/**
 * Temporary Sentry verification route — reachable only via deep link
 * (intothepond://sentry-verification-crash). Not linked from app navigation.
 * Remove after production crash + symbolication is confirmed in Sentry.
 */
export default function SentryVerificationCrashScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Sentry verification</Text>
        <Text style={styles.body}>
          Deep-link only. Tap once to send a test crash to Sentry, then remove this route.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={() => {
            throw new Error("Sentry verification crash");
          }}
        >
          <Text style={styles.buttonLabel}>Send test crash</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    letterSpacing: -0.48,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  button: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
});
