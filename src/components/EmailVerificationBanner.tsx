import type { User } from "firebase/auth";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { sendEmailVerificationForCurrentUser } from "@/src/services/firebase/auth";
import { formatFirebaseAuthError } from "@/src/services/firebase/authLinks";

type Props = { user: User };

export function EmailVerificationBanner({ user }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  if (dismissed || user.emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    setHint(null);
    try {
      await sendEmailVerificationForCurrentUser();
      setHint("Verification email sent.");
    } catch (e) {
      setHint(formatFirebaseAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: spacing.inner,
        paddingVertical: spacing.inner,
        backgroundColor: colors.primarySoft,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.inner,
      }}
      accessibilityRole="alert"
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing.inner,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fontFamilies.body,
            fontSize: 14,
            color: colors.textPrimary,
          }}
        >
          Please verify your email ({user.email ?? "your address"}) so we can reach you if needed.
        </Text>
        <Pressable
          accessibilityLabel="Dismiss verification reminder"
          hitSlop={12}
          onPress={() => setDismissed(true)}
          style={{ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>×</Text>
        </Pressable>
      </View>
      {hint ? (
        <Text style={{ fontFamily: fontFamilies.body, fontSize: 13, color: colors.textSecondary }}>
          {hint}
        </Text>
      ) : null}
      <Pressable
        style={{
          minHeight: 48,
          alignSelf: "flex-start",
          justifyContent: "center",
          paddingHorizontal: 12,
          opacity: busy ? 0.6 : 1,
        }}
        disabled={busy}
        onPress={() => void resend()}
      >
        <Text style={{ fontFamily: fontFamilies.bodySemi, fontSize: 15, color: colors.primary }}>
          {busy ? "Sending…" : "Resend verification email"}
        </Text>
      </Pressable>
    </View>
  );
}
