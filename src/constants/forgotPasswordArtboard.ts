import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical forgot-password PNG canvas (matches exported slice). */
export const FORGOT_PASSWORD_ARTBOARD_WIDTH = 576;
export const FORGOT_PASSWORD_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the reset-password design with parchment card layout.
 */
export const forgotPasswordHitRects = {
  /** Email input inside wavy-bordered field. */
  emailInput: { left: 0.24, top: 0.516, width: 0.6, height: 0.048 },
  /** Reset Password button (cloud shape with wave decoration). */
  resetButton: { left: 0.3, top: 0.638, width: 0.4, height: 0.062 },
} as const satisfies Record<string, NormRect>;

/**
 * Hit rects for the link-sent confirmation screen (reset-password-sent.png).
 */
export const forgotPasswordSentHitRects = {
  /** "Resend" / "Resend cooling down" button. */
  resendButton: { left: 0.27, top: 0.624, width: 0.46, height: 0.062 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveForgotPasswordArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: FORGOT_PASSWORD_ARTBOARD_WIDTH,
      height: FORGOT_PASSWORD_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.forgotPassword.background);
  return {
    width: resolved.width ?? FORGOT_PASSWORD_ARTBOARD_WIDTH,
    height: resolved.height ?? FORGOT_PASSWORD_ARTBOARD_HEIGHT,
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
