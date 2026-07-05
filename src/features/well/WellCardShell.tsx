import type { PropsWithChildren } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export const WELL_CARD_ASPECT = 505 / 836;

const FOCUS_BORDER = "rgba(200, 216, 192, 0.45)";
const FOCUS_RADIUS = 18;
const FOCUS_SHADOW = {
  shadowColor: "rgba(42, 24, 16, 0.18)",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 6,
};

type WellCardShellProps = PropsWithChildren<{
  source?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  variant?: "default" | "focus" | "focusBack";
}>;

export function WellCardShell({
  source,
  style,
  accessibilityLabel,
  variant = "default",
  children,
}: WellCardShellProps) {
  if (variant === "focusBack") {
    return (
      <View
        style={[styles.wrap, styles.focusShadow, style]}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.card, styles.focusCard, styles.focusBackCard]}>
          <View style={styles.focusBackFill} />
          <View style={styles.content} pointerEvents="box-none">
            {children}
          </View>
        </View>
      </View>
    );
  }

  if (variant === "focus") {
    return (
      <View
        style={[styles.wrap, styles.focusShadow, style]}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.card, styles.focusCard]}>
          {source ? (
            <Image
              source={source}
              style={styles.focusArt}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View style={styles.content} pointerEvents="box-none">
            {children}
          </View>
        </View>
      </View>
    );
  }

  if (!source) {
    return null;
  }

  return (
    <View style={[styles.wrap, style]} accessibilityLabel={accessibilityLabel}>
      <ImageBackground
        source={source}
        style={styles.card}
        resizeMode="contain"
        imageStyle={styles.cardImage}
      >
        <View style={styles.content}>{children}</View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  focusShadow: {
    ...FOCUS_SHADOW,
  },
  card: {
    width: "100%",
    aspectRatio: WELL_CARD_ASPECT,
    overflow: "hidden",
  },
  cardImage: {
    resizeMode: "contain",
  },
  focusCard: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  focusBackCard: {
    backgroundColor: "#FDFAF4",
  },
  focusBackFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FDFAF4",
  },
  focusArt: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});
