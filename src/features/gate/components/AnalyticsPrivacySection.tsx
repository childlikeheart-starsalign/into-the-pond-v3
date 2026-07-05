import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { translateGateCopy } from "@/src/features/gate/gateCopy";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import {
  setAnalyticsOptOut,
  subscribeAnalyticsOptOut,
} from "@/src/services/analytics/analyticsOptOut";

const PRIVACY_POLICY_URL = "https://intothepond.app/privacy";

type AnalyticsPrivacySectionProps = {
  compact?: boolean;
};

export function AnalyticsPrivacySection({ compact = false }: AnalyticsPrivacySectionProps) {
  const [optedOut, setOptedOut] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeAnalyticsOptOut(setOptedOut), []);

  const analyticsEnabled = !optedOut;

  const onToggle = (nextEnabled: boolean) => {
    if (busy) return;
    setBusy(true);
    void setAnalyticsOptOut(!nextEnabled).finally(() => setBusy(false));
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>{translateGateCopy("gate.analytics.title")}</Text>
          {!compact ? (
            <Text style={styles.body}>{translateGateCopy("gate.analytics.body")}</Text>
          ) : null}
        </View>
        <Switch
          accessibilityRole="switch"
          accessibilityLabel={translateGateCopy("gate.analytics.toggleA11y")}
          accessibilityState={{ checked: analyticsEnabled, disabled: busy }}
          value={analyticsEnabled}
          disabled={busy}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          thumbColor={analyticsEnabled ? colors.primary : colors.surface}
        />
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={translateGateCopy("gate.analytics.policyLinkA11y")}
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        style={styles.policyLink}
      >
        <Text style={styles.policyLinkText}>{translateGateCopy("gate.analytics.policyLink")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: spacing.inner,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wrapCompact: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.inner,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.gateTitle,
    fontSize: 18,
    letterSpacing: -0.36,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  policyLink: {
    minHeight: 48,
    justifyContent: "center",
  },
  policyLinkText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
