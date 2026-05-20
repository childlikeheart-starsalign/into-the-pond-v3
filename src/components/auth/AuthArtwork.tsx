import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type PropsWithChildren } from "react";
import {
  Image,
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { media } from "@/src/constants/media";

type AuthFrameProps = PropsWithChildren<{
  helperText?: string;
}>;

export function AuthFrame({ children, helperText }: AuthFrameProps) {
  return (
    <ImageBackground source={media.gate.background} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Into the Pond</Text>
        {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
        <View style={styles.paper}>{children}</View>
      </SafeAreaView>
    </ImageBackground>
  );
}

type SketchInputProps = TextInputProps & {
  label: string;
  error?: string | null;
  secure?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  secureShownIcon?: ImageSourcePropType;
  secureHiddenIcon?: ImageSourcePropType;
};

export function SketchInput({
  label,
  error,
  secure,
  showSecure,
  onToggleSecure,
  secureShownIcon,
  secureHiddenIcon,
  style,
  ...rest
}: SketchInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !!error && styles.inputError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#7C6B61"
          secureTextEntry={secure && !showSecure}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={onToggleSecure} style={styles.iconBtn}>
            {secureShownIcon && secureHiddenIcon ? (
              <Image
                source={showSecure ? secureShownIcon : secureHiddenIcon}
                style={styles.secureIconImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons
                name={showSecure ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#2D221C"
              />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type CloudButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function CloudButton({ label, onPress, disabled }: CloudButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cloud,
        disabled && styles.cloudDisabled,
        pressed && styles.cloudPressed,
      ]}
    >
      <Text style={styles.cloudText}>{label}</Text>
    </Pressable>
  );
}

type InlineLinkProps = {
  prefix?: string;
  linkLabel: string;
  onPress: () => void;
};

export function InlineLink({ prefix, linkLabel, onPress }: InlineLinkProps) {
  return (
    <View style={styles.inlineRow}>
      {prefix ? <Text style={styles.inlineText}>{prefix} </Text> : null}
      <Pressable onPress={onPress} style={styles.inlinePress}>
        <Text style={styles.inlineLink}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#171311",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 12, 8, 0.35)",
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.inner,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
  },
  title: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 66,
    lineHeight: 72,
    letterSpacing: -0.6,
    color: "#3F2A22",
    textAlign: "center",
  },
  helper: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: "#463B33",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 22,
  },
  paper: {
    width: "100%",
    maxWidth: 392,
    backgroundColor: "#F3EFE7",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DDD2C7",
    padding: spacing.cardPadding,
    gap: spacing.inner,
    marginTop: 8,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 32 / 2,
    color: "#2F2119",
  },
  inputRow: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: "#5C4338",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F2EB",
  },
  inputError: {
    borderColor: "#B86A6A",
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  iconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  secureIconImage: {
    width: 24,
    height: 24,
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: "#B86A6A",
  },
  cloud: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#2E2520",
    backgroundColor: "#F6F4EC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    alignSelf: "center",
    minWidth: 200,
    shadowColor: "#F0B31C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cloudPressed: {
    opacity: 0.85,
  },
  cloudDisabled: {
    opacity: 0.55,
  },
  cloudText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 34 / 2,
    color: "#D05878",
  },
  inlineRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  inlineText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: "#2E2520",
  },
  inlinePress: {
    minHeight: 24,
    justifyContent: "center",
  },
  inlineLink: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.secondary,
    textDecorationLine: "underline",
  },
});
