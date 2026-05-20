import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical sign-up layered PNG canvas (matches exported slices). */
export const SIGN_UP_ARTBOARD_WIDTH = 576;
export const SIGN_UP_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the sign-up design with parchment card layout.
 */
export const signUpHitRects = {
  /** Email input inside wavy-bordered field. */
  emailInput: { left: 0.24, top: 0.412, width: 0.6, height: 0.048 },
  /** Password input (shorter width to leave room for toggle icon). */
  passwordInput: { left: 0.24, top: 0.532, width: 0.6, height: 0.048 },
  /** Show/hide password key icon; height expanded for ≥48px tap target. */
  passwordToggle: { left: 0.725, top: 0.555, width: 0.08, height: 0.055 },
  /** Create Account button (cloud shape with wave decoration). */
  createAccountButton: { left: 0.3, top: 0.586, width: 0.4, height: 0.062 },
  /** Green "Sign in" link — height expanded for ≥48px tap target. */
  signInLink: { left: 0.46, top: 0.694, width: 0.12, height: 0.04 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveSignUpArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: SIGN_UP_ARTBOARD_WIDTH,
      height: SIGN_UP_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.signUp.background);
  return {
    width: resolved.width ?? SIGN_UP_ARTBOARD_WIDTH,
    height: resolved.height ?? SIGN_UP_ARTBOARD_HEIGHT,
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
