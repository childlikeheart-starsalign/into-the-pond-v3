import { Image, type ImageSourcePropType } from "react-native";
import type { ViewStyle } from "react-native";

import { media } from "@/src/constants/media";

/** Canonical sign-in layered PNG canvas (matches exported slices). */
export const SIGN_IN_ARTBOARD_WIDTH = 576;
export const SIGN_IN_ARTBOARD_HEIGHT = 1024;

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Interactive regions as fractions of the artboard (0–1).
 * Tuned to match the sign-in design with parchment card layout.
 */
export const signInHitRects = {
  /** Sign in with Apple + or divider (iOS only). */
  appleSignIn: { left: 0.26, top: 0.28, width: 0.525, height: 0.09 },
  /** Email input inside wavy-bordered field. */
  emailInput: { left: 0.26, top: 0.4, width: 0.525, height: 0.055 },
  /** Password input (shorter width to leave room for toggle icon). */
  passwordInput: { left: 0.26, top: 0.53, width: 0.52, height: 0.055 },
  /** Show/hide password key icon; sized for ≥48px tap target. */
  passwordToggle: { left: 0.71, top: 0.495, width: 0.11, height: 0.07 },
  /** Sign in button (cloud shape with wave decoration). */
  signInButton: { left: 0.31, top: 0.586, width: 0.38, height: 0.068 },
  /** Green "Here" link — height expanded for ≥48px tap target. */
  signUpLink: { left: 0.548, top: 0.688, width: 0.108, height: 0.04 },
  /** Green "Forgot password" link — height expanded for ≥48px tap target. */
  forgotPasswordLink: { left: 0.432, top: 0.712, width: 0.215, height: 0.04 },
} as const satisfies Record<string, NormRect>;

/** Resolved intrinsic size from Metro bundle metadata (fallback when unavailable, e.g. RN Web). */
export function resolveSignInArtboardIntrinsic(): { width: number; height: number } {
  const resolveFn =
    typeof Image.resolveAssetSource === "function"
      ? (Image.resolveAssetSource as (src: ImageSourcePropType) => {
          width?: number;
          height?: number;
        })
      : undefined;

  if (!resolveFn) {
    return {
      width: SIGN_IN_ARTBOARD_WIDTH,
      height: SIGN_IN_ARTBOARD_HEIGHT,
    };
  }

  const resolved = resolveFn(media.auth.signIn.background);
  return {
    width: resolved.width ?? SIGN_IN_ARTBOARD_WIDTH,
    height: resolved.height ?? SIGN_IN_ARTBOARD_HEIGHT,
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
