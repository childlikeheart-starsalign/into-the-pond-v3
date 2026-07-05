import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "@/src/constants/theme";
import { WellBookmarkIcon } from "@/src/features/well/WellFooterLinkIcons";
import { DEFER_LABEL } from "@/src/features/well/wellCopy";

const DEFER_CREAM = "rgba(245, 240, 232, 0.50)";

type WellDeferLinkProps = {
  onPress: () => void;
};

export function WellDeferLink({ onPress }: WellDeferLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={DEFER_LABEL}
      onPress={onPress}
      style={styles.hit}
    >
      <View style={styles.row}>
        <WellBookmarkIcon size={13} color={DEFER_CREAM} />
        <Text style={styles.label}>{DEFER_LABEL}</Text>
      </View>
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
    fontSize: 12,
    color: DEFER_CREAM,
    textAlign: "center",
  },
});
