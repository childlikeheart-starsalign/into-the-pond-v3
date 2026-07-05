import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "@/src/constants/theme";
import { WellRefreshIcon } from "@/src/features/well/WellFooterLinkIcons";
import { REROLL_LABEL, WELL_QUIET_LABEL } from "@/src/features/well/wellCopy";

const REROLL_CREAM = "rgba(245, 240, 232, 0.80)";
const QUIET_CREAM = "rgba(245, 240, 232, 0.45)";

type WellRerollButtonProps = {
  onPress: () => void;
  canReroll: boolean;
};

export function WellRerollButton({ onPress, canReroll }: WellRerollButtonProps) {
  if (!canReroll) {
    return (
      <View style={styles.hit} accessibilityRole="text">
        <Text style={styles.quietLabel}>{WELL_QUIET_LABEL}</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={REROLL_LABEL}
      onPress={onPress}
      style={styles.hit}
    >
      {({ pressed }) => (
        <View style={styles.row}>
          <WellRefreshIcon size={14} color={REROLL_CREAM} />
          <Text style={[styles.label, pressed && styles.labelPressed]}>{REROLL_LABEL}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: REROLL_CREAM,
    textAlign: "center",
  },
  labelPressed: {
    textDecorationLine: "underline",
  },
  quietLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    fontStyle: "italic",
    color: QUIET_CREAM,
    textAlign: "center",
  },
});
