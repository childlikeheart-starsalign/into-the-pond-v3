import { doc, onSnapshot } from "firebase/firestore";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";
import { cancelAccountDeletion } from "@/src/services/auth/accountDeletion";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { signOutCurrentUser } from "@/src/services/firebase/auth";
import type { UserDoc } from "@/src/services/firebase/types";

export default function DeletionPendingScreen() {
  const insets = useSafeAreaInsets();
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const [purgeAt, setPurgeAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(firestore, "users", uid);
    return onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setPurgeAt(null);
        return;
      }
      const data = snap.data() as UserDoc;
      setPurgeAt(data.deletionPurgeAt?.toDate?.()?.toISOString?.() ?? null);
    });
  }, [uid]);

  const formattedDate = purgeAt
    ? new Date(purgeAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "the scheduled date";

  const handleCancelDeletion = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelAccountDeletion();
      router.replace(routes.sanctuary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel deletion.");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutCurrentUser();
    router.replace(routes.gateEntry);
  }, []);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.section,
          paddingBottom: insets.bottom + spacing.section,
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Account scheduled for deletion</Text>
        <Text style={styles.body}>
          Your account is scheduled for deletion on {formattedDate}. Journal and profile content has
          already been removed. Sign in anytime before then to cancel and keep your sanctuary shell.
        </Text>
        <Text style={styles.note}>
          After {formattedDate}, deletion is permanent. Cancel your App Store subscription
          separately if needed.
        </Text>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel deletion"
          disabled={busy}
          onPress={() => void handleCancelDeletion()}
          style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.pressed]}
        >
          {busy ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryBtnText}>Cancel deletion</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={busy}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryBtnText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.inner,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: spacing.inner,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    letterSpacing: -0.48,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.warning,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.dangerSoft,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.inner,
  },
  primaryBtnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
