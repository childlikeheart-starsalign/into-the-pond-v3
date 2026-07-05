import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/constants/theme";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";

export type AuthArtboardScreenProps = {
  backgroundSource: ImageSourcePropType;
  children: ReactNode;
  /** Below-artboard content inside ScrollView (signup generalError + sendFailure). */
  footer?: ReactNode;
  /** Reanimated style for H4 signup entrance; omit on login. */
  artboardAnimatedStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  /** Full-screen sibling overlay (signup AuthWaitingVideo). */
  overlay?: ReactNode;
  /** Extra scroll content style (signup sets backgroundColor). */
  scrollContentStyle?: StyleProp<ViewStyle>;
};

/**
 * Shared auth artboard shell: SafeArea → keyboard → scroll → framed 9:16 stage + background PNG.
 * Screen-specific hit targets and inputs are passed as children.
 */
export function AuthArtboardScreen({
  backgroundSource,
  children,
  footer,
  artboardAnimatedStyle,
  overlay,
  scrollContentStyle,
}: AuthArtboardScreenProps) {
  const { height: windowHeight } = useWindowDimensions();
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);

  const artboardWidth = frame.width;
  const artboardHeight = frame.height;
  const layerSize = { width: artboardWidth, height: artboardHeight };

  const artboardFrameStyle = [
    styles.artboard,
    {
      marginLeft: frame.left,
      marginTop: frame.top,
      width: artboardWidth,
      height: artboardHeight,
    },
  ];

  const artboardContent = (
    <>
      <Image
        source={backgroundSource}
        style={[styles.layerImage, layerSize]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minHeight: windowHeight },
            scrollContentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {artboardAnimatedStyle ? (
            <Animated.View style={[...artboardFrameStyle, artboardAnimatedStyle]}>
              {artboardContent}
            </Animated.View>
          ) : (
            <View style={artboardFrameStyle}>{artboardContent}</View>
          )}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
      {overlay}
    </SafeAreaView>
  );
}

/** Shared field styles for login/signup hit-target artboards. */
export const authArtboardFieldStyles = StyleSheet.create({
  textInput: {
    backgroundColor: "rgba(237, 228, 200, 0.55)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  passwordTextInput: {
    width: "100%",
    height: "100%",
    paddingRight: 40,
  },
  passwordToggleButton: {
    position: "absolute",
    right: 5,
    top: "50%",
    marginTop: -18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
    minHeight: 48,
  },
  hitTarget: {
    backgroundColor: "transparent",
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  artboard: {
    alignSelf: "stretch",
    position: "relative",
  },
  layerImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
