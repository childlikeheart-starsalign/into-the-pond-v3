import { doc, onSnapshot } from "firebase/firestore";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AUTH_DELETION_PENDING_BODY_DATE,
  AUTH_DELETION_PENDING_BODY_RESERVE,
  AUTH_DELETION_PENDING_DATE_FALLBACK,
  AUTH_DELETION_PENDING_EMOTION,
  AUTH_DELETION_PENDING_ERROR,
  AUTH_DELETION_PENDING_HEADLINE,
  AUTH_DELETION_PENDING_KEEP,
  AUTH_DELETION_PENDING_PRIVACY,
  AUTH_DELETION_PENDING_REMINDER_BODY,
  AUTH_DELETION_PENDING_REMINDER_LABEL,
  AUTH_DELETION_PENDING_SIGN_OUT,
  fillAuthDeletionPendingDate,
} from "@/src/constants/authCopy";
import { atlasColors, colors, fontFamilies, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";
import { TODAYS_FOCUS_CARD_BACK } from "@/src/features/well/wellAssets";
import { WellCardShell } from "@/src/features/well/WellCardShell";
import { cancelAccountDeletion } from "@/src/services/auth/accountDeletion";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { signOutCurrentUser } from "@/src/services/firebase/auth";
import type { UserDoc } from "@/src/services/firebase/types";
import { Sentry } from "@/src/services/sentry/init";

/**
 * Content box inside the botanical card — slightly roomier than Well focus
 * insets so farewell copy + CTAs fit while clearing corner leaves.
 */
const DELETION_CARD_INSETS = {
  left: 0.12,
  top: 0.11,
  width: 0.76,
  height: 0.74,
} as const;

export default function DeletionPendingScreen() {
  const insets = useSafeAreaInsets();
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const [purgeAt, setPurgeAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(firestore, "users", uid);
    return onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setPurgeAt(null);
          return;
        }
        const data = snap.data() as UserDoc;
        setPurgeAt(data.deletionPurgeAt?.toDate?.()?.toISOString?.() ?? null);
      },
      (err) => {
        console.warn("[DeletionPending] user snapshot failed", err);
        Sentry.captureException(err, {
          tags: { area: "auth", flow: "deletion_pending_snapshot" },
        });
      },
    );
  }, [uid]);

  const formattedDate = purgeAt
    ? new Date(purgeAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : AUTH_DELETION_PENDING_DATE_FALLBACK;

  const handleCancelDeletion = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelAccountDeletion();
      router.replace(routes.sanctuary);
    } catch (err) {
      setError(err instanceof Error ? err.message : AUTH_DELETION_PENDING_ERROR);
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
      <WellCardShell
        variant="focus"
        source={TODAYS_FOCUS_CARD_BACK}
        accessibilityLabel={AUTH_DELETION_PENDING_HEADLINE}
        style={styles.shell}
      >
        <View style={styles.insets}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{AUTH_DELETION_PENDING_HEADLINE}</Text>

            <View style={styles.copyBlock}>
              <Text style={styles.body}>
                {fillAuthDeletionPendingDate(AUTH_DELETION_PENDING_BODY_DATE, formattedDate)}
              </Text>
              <Text style={styles.body}>{AUTH_DELETION_PENDING_BODY_RESERVE}</Text>
              <Text style={styles.body}>{AUTH_DELETION_PENDING_PRIVACY}</Text>
            </View>

            <Text style={styles.emotion}>
              {fillAuthDeletionPendingDate(AUTH_DELETION_PENDING_EMOTION, formattedDate)}
            </Text>

            <View style={styles.reminder}>
              <Text style={styles.reminderLabel}>{AUTH_DELETION_PENDING_REMINDER_LABEL}</Text>
              <Text style={styles.reminderBody}>{AUTH_DELETION_PENDING_REMINDER_BODY}</Text>
            </View>

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={AUTH_DELETION_PENDING_KEEP}
              disabled={busy}
              onPress={() => void handleCancelDeletion()}
              style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.pressed]}
            >
              {busy ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryBtnText}>{AUTH_DELETION_PENDING_KEEP}</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={AUTH_DELETION_PENDING_SIGN_OUT}
              disabled={busy}
              onPress={() => void handleSignOut()}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryBtnText}>{AUTH_DELETION_PENDING_SIGN_OUT}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </WellCardShell>
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
  shell: {
    maxWidth: 400,
    alignSelf: "center",
  },
  insets: {
    position: "absolute",
    left: `${DELETION_CARD_INSETS.left * 100}%`,
    top: `${DELETION_CARD_INSETS.top * 100}%`,
    width: `${DELETION_CARD_INSETS.width * 100}%`,
    height: `${DELETION_CARD_INSETS.height * 100}%`,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 12,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    letterSpacing: -0.44,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  copyBlock: {
    gap: 12,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  emotion: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginTop: 4,
  },
  reminder: {
    marginTop: 4,
    gap: 6,
  },
  reminderLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 12,
    color: atlasColors.inkMuted,
  },
  reminderBody: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    color: atlasColors.inkMuted,
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
    marginTop: 8,
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
