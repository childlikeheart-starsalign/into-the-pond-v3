import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

type PortraitProps = {
  source: ImageSourcePropType;
  size: number;
  animatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

/**
 * Herbarium specimen medallion — circular watercolor stamp on the folio.
 */
export function Portrait({ source, size, animatedStyle }: PortraitProps) {
  const radius = size / 2;

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, animatedStyle]}>
      <View
        style={[
          styles.pasteBacking,
          {
            width: size + 8,
            height: size + 6,
            borderRadius: radius * 0.86,
          },
        ]}
      />
      <View style={[styles.ring, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={source}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
          accessible={false}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: "#2B241D",
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 1, height: 3 },
    elevation: 3,
    zIndex: 6,
  },
  pasteBacking: {
    position: "absolute",
    top: -3,
    left: -4,
    backgroundColor: "#F3EADF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122, 92, 69, 0.2)",
    transform: [{ rotate: "1.8deg" }],
  },
  ring: {
    overflow: "hidden",
    backgroundColor: "#EFE4DA",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122, 92, 69, 0.28)",
    transform: [{ rotate: "-1.1deg" }],
  },
});
