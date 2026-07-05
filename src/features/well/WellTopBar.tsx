import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontFamilies } from "@/src/constants/theme";

/** Well scene top bar — frosted breadcrumb + Close pill over baked scene hood. */
const WELL_TOP_BAR_ZONE_HEIGHT = 56;
const WELL_TOP_BAR_CONTENT_HEIGHT = 36;
const WELL_TOP_BAR_CREAM = "rgba(245, 240, 232, 0.85)";
const WELL_TOP_BAR_PILL_BG = "rgba(245, 240, 232, 0.12)";
const WELL_TOP_BAR_PILL_BORDER = "rgba(245, 240, 232, 0.22)";
const WELL_TOP_BAR_PILL_TEXT = "rgba(245, 240, 232, 0.80)";

type WellTopBarProps = {
  onClose: () => void;
  closeAccessibilityLabel?: string;
};

/** Shared Sanctuary header + Close pill (birthdate gate and Well scene). */
export function WellTopBar({ onClose, closeAccessibilityLabel = "Close Well" }: WellTopBarProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, WELL_TOP_BAR_ZONE_HEIGHT - WELL_TOP_BAR_CONTENT_HEIGHT);
  const barHeight = Math.max(WELL_TOP_BAR_ZONE_HEIGHT, paddingTop + WELL_TOP_BAR_CONTENT_HEIGHT);

  return (
    <View style={[styles.topBar, { paddingTop, height: barHeight }]}>
      <View style={styles.contentRow}>
        <Text style={styles.sanctuaryLabel}>Sanctuary</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeAccessibilityLabel}
          onPress={onClose}
          style={({ pressed }) => [styles.topPill, pressed && styles.topPillPressed]}
        >
          <Text style={styles.topPillText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: "100%",
    zIndex: 10,
  },
  contentRow: {
    height: WELL_TOP_BAR_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 16,
  },
  sanctuaryLabel: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 15,
    fontWeight: "400",
    color: WELL_TOP_BAR_CREAM,
    flexShrink: 1,
  },
  topPill: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: WELL_TOP_BAR_PILL_BG,
    borderWidth: 0.5,
    borderColor: WELL_TOP_BAR_PILL_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  topPillPressed: {
    opacity: 0.88,
  },
  topPillText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: "400",
    color: WELL_TOP_BAR_PILL_TEXT,
  },
});
