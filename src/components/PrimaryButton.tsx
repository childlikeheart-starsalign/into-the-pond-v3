import type { ReactNode } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { fontFamilies } from "@/src/constants/theme";

export type ButtonVariant = "standard" | "recommended" | "destructive";

const VARIANT_ASSETS = {
  standard: require("@/assets/buttons/button_standard.png"),
  recommended: require("@/assets/buttons/button_recommended.png"),
  destructive: require("@/assets/buttons/button_destructive.png"),
} as const;

const DISABLED_ASSET = require("@/assets/buttons/button_disabled.png");

/** Preserve corner botanical art when stretching horizontally (844×260 source). */
const PLAQUE_CAP_INSETS = { left: 140, top: 52, right: 140, bottom: 52 };

const PRIMARY_BUTTON_TEXT_COLOR = "#FAF7F2";

export interface PrimaryButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  busyIndicator?: ReactNode;
}

/**
 * Standard primary CTA with illustrated wood-plaque background and enforced
 * VoiceOver contract (role, label, disabled/busy state).
 */
export function PrimaryButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  variant = "standard",
  disabled = false,
  busy = false,
  style,
  textStyle,
  busyIndicator,
  onPress,
  ...rest
}: PrimaryButtonProps) {
  const isInactive = disabled || busy;
  const asset = disabled ? DISABLED_ASSET : VARIANT_ASSETS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: !!busy }}
      disabled={isInactive}
      onPress={onPress}
      style={[styles.pressable, style]}
      {...rest}
    >
      <ImageBackground
        source={asset}
        capInsets={PLAQUE_CAP_INSETS}
        resizeMode="stretch"
        style={styles.plaque}
        imageStyle={styles.plaqueImage}
      >
        {busy ? (
          (busyIndicator ?? <ActivityIndicator color={PRIMARY_BUTTON_TEXT_COLOR} />)
        ) : (
          <Text style={[styles.label, textStyle]}>{label}</Text>
        )}
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "stretch",
    minHeight: 52,
  },
  plaque: {
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  plaqueImage: {
    borderRadius: 0,
  },
  label: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: PRIMARY_BUTTON_TEXT_COLOR,
    textAlign: "center",
  },
});
