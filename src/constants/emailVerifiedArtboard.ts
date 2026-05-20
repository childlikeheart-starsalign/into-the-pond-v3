import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical email-verified PNG canvas (matches exported slice). */
export const EMAIL_VERIFIED_ARTBOARD_WIDTH = 576;
export const EMAIL_VERIFIED_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the email-verified design with parchment card layout.
 */
export const emailVerifiedHitRects = {
  /** Enter button (cloud shape with wave decoration). */
  enterButton: { left: 0.3, top: 0.548, width: 0.4, height: 0.062 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveEmailVerifiedArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: EMAIL_VERIFIED_ARTBOARD_WIDTH,
      height: EMAIL_VERIFIED_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.emailVerified.background);
  return {
    width: resolved.width ?? EMAIL_VERIFIED_ARTBOARD_WIDTH,
    height: resolved.height ?? EMAIL_VERIFIED_ARTBOARD_HEIGHT,
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
