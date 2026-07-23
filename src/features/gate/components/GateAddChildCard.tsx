import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { childProfileColors } from "@/src/constants/childProfileTheme";
import { useChildProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";
import { resolveGateAddChildMode } from "@/src/features/gate/components/resolveGateAddChildMode";
import { routes } from "@/src/navigation/routes";
import { toDerivedSubscriptionState } from "@/src/services/firebase/entitlements";

/**
 * Draft Gate copy (plan §6) — product pass still required before ship.
 */
export function GateAddChildCard({
  subscription,
  childrenSummary,
  onScrollToPricing,
}: {
  subscription: ReturnType<typeof toDerivedSubscriptionState>;
  childrenSummary: ChildrenSummaryEntry[] | null | undefined;
  onScrollToPricing?: () => void;
}) {
  const router = useRouter();
  const { createChildProfileUi } = useChildProfileFeatureFlags();
  const mode = resolveGateAddChildMode({
    flagEnabled: createChildProfileUi,
    childCount: childrenSummary?.length ?? 0,
    hasPaidRod: subscription.hasPaidRod,
    subscription: {
      subscriptionStatus: subscription.subscriptionStatus,
      isLifetime: subscription.isLifetime,
    },
  });

  if (mode.kind === "hidden") return null;

  const onPress =
    mode.kind === "invite_upgrade"
      ? () => onScrollToPricing?.()
      : mode.kind === "add_child"
        ? () =>
            router.push({
              pathname: routes.createChildProfile as never,
              params: { entry: "add_child" },
            } as never)
        : null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>Family stories</Text>
      <Text style={styles.body}>{mode.body}</Text>
      {mode.kind !== "at_cap" && onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={mode.cta}
        >
          <Text style={styles.ctaText}>{mode.cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.inner,
    padding: spacing.cardPadding,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.44,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  cta: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: childProfileColors.bark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  ctaText: {
    fontFamily: fontFamilies.bodySemi,
    color: childProfileColors.cream,
    fontSize: 15,
  },
});
