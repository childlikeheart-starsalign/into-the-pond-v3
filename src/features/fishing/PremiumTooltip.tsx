import { StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies } from "@/src/constants/theme";

export function PremiumTooltip() {
  return (
    <View style={styles.bubble} pointerEvents="none">
      <Text style={styles.text}>Unlock with Premium</Text>
      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    bottom: "106%",
    zIndex: 100,
    minWidth: 140,
    alignSelf: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(31, 26, 23, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: colors.bg,
    fontFamily: fontFamilies.body,
    fontSize: 12,
    textAlign: "center",
  },
  arrow: {
    position: "absolute",
    bottom: -5,
    width: 10,
    height: 10,
    alignSelf: "center",
    backgroundColor: "rgba(31, 26, 23, 0.92)",
    transform: [{ rotate: "45deg" }],
  },
});
