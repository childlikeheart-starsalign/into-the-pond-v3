import { StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "@/src/constants/theme";

type PreviewOnlyBannerProps = {
  message?: string;
};

const DEFAULT_MESSAGE = "Preview only — rewards not saved. Deploy functions for real awards.";

/** Shown when DEV preview computed rewards locally (Invariant 6). */
export function PreviewOnlyBanner({ message = DEFAULT_MESSAGE }: PreviewOnlyBannerProps) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#EFE4DA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: "#5B514A",
    textAlign: "center",
  },
});
