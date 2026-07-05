import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, fontFamilies } from "@/src/constants/theme";

const FADE_MS = 300;

type ErrorOverlayProps = {
  message: string;
  linkText?: string;
  onLinkPress?: () => void;
  visible: boolean;
};

/** Warm parchment overlay for login error artboards (22/23). */
export function ErrorOverlay({ message, linkText, onLinkPress, visible }: ErrorOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: FADE_MS });
  }, [opacity, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityRole="alert"
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>
      {linkText && onLinkPress ? (
        <Pressable
          onPress={onLinkPress}
          accessibilityRole="button"
          accessibilityLabel={linkText}
          style={styles.linkButton}
        >
          <Text style={styles.link}>{linkText}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: "20%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(237, 228, 200, 0.92)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#2C1810",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  message: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 20,
  },
  linkButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  link: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
