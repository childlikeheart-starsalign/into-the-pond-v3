import type { PropsWithChildren } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const CARD_ASPECT = 1400 / 900;

type GateCardShellProps = PropsWithChildren<{
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>;

/** Scales production parchment card art to container width while preserving aspect ratio. */
export function GateCardShell({ source, style, accessibilityLabel, children }: GateCardShellProps) {
  return (
    <View style={[styles.wrap, style]} accessibilityLabel={accessibilityLabel}>
      <ImageBackground
        source={source}
        style={styles.card}
        resizeMode="stretch"
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
  card: {
    width: "100%",
    aspectRatio: CARD_ASPECT,
    overflow: "hidden",
  },
  cardImage: {
    resizeMode: "stretch",
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});

export const GATE_CARD_ASPECT = CARD_ASPECT;
