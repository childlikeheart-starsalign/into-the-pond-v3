import { StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

/** Printed folio rule + ❦ — shared across prologue parchment plates. */
export function FolioOrnamentDivider() {
  return (
    <View style={styles.divider} accessible={false} importantForAccessibility="no">
      <View style={styles.rule} />
      <Text style={styles.ornament}>❦</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.tapGap,
    marginVertical: 1,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(122, 92, 69, 0.35)",
  },
  ornament: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 12,
    lineHeight: 13.8,
    color: colors.primary,
    opacity: 0.75,
  },
});
