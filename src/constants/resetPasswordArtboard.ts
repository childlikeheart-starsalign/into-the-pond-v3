import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical enter-new-password PNG canvas (matches exported slice). */
export const RESET_PASSWORD_ARTBOARD_WIDTH = 576;
export const RESET_PASSWORD_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the enter-new-password design with parchment card layout.
 */
export const resetPasswordHitRects = {
  /** New password input inside wavy-bordered field. */
  passwordInput: { left: 0.24, top: 0.518, width: 0.6, height: 0.048 },
  /** Enter button (cloud shape with wave decoration). */
  enterButton: { left: 0.34, top: 0.639, width: 0.4, height: 0.062 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveResetPasswordArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: RESET_PASSWORD_ARTBOARD_WIDTH,
      height: RESET_PASSWORD_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.resetPassword.background);
  return {
    width: resolved.width ?? RESET_PASSWORD_ARTBOARD_WIDTH,
    height: resolved.height ?? RESET_PASSWORD_ARTBOARD_HEIGHT,
  };
}

export function normRectToStyle(
  rect: NormRect,
  artboardWidth: number,
  artboardHeight: number,
): ViewStyle {
  return {
    position: "absolute",
    left: rect.left * artboardWidth,
    top: rect.top * artboardHeight,
    width: rect.width * artboardWidth,
    height: rect.height * artboardHeight,
  };
}
