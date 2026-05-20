import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical verify-email-sent PNG canvas (matches exported slice). */
export const VERIFY_EMAIL_ARTBOARD_WIDTH = 576;
export const VERIFY_EMAIL_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the verify-email-sent design with parchment card layout.
 */
export const verifyEmailHitRects = {
  /** Resend button (cloud shape with wave decoration). */
  resendButton: { left: 0.27, top: 0.624, width: 0.46, height: 0.062 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveVerifyEmailArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: VERIFY_EMAIL_ARTBOARD_WIDTH,
      height: VERIFY_EMAIL_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.verifyEmail.linkSent);
  return {
    width: resolved.width ?? VERIFY_EMAIL_ARTBOARD_WIDTH,
    height: resolved.height ?? VERIFY_EMAIL_ARTBOARD_HEIGHT,
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
