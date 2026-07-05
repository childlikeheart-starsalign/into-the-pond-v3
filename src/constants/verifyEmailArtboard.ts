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
  /** Signed-in email displayed on parchment card. */
  emailDisplay: { left: 0.1, top: 0.468, width: 0.8, height: 0.044 },
  /** Continue checking verification status (refresh). */
  refreshButton: { left: 0.2, top: 0.538, width: 0.6, height: 0.065 },
  /** Resend verification email button. */
  resendButton: { left: 0.2, top: 0.618, width: 0.6, height: 0.065 },
  /** Countdown label below resend button. */
  resendCountdownLabel: { left: 0.1, top: 0.69, width: 0.8, height: 0.04 },
  /** Return to sign-up link below countdown. */
  returnToSignUpLink: { left: 0.1, top: 0.728, width: 0.8, height: 0.04 },
  /** Status feedback below countdown. */
  statusMessage: { left: 0.08, top: 0.735, width: 0.84, height: 0.08 },
} as const satisfies Record<string, NormRect>;

/** Dev-only: draw semi-transparent rects over hit targets for on-device tuning. */
export const VERIFY_EMAIL_HIT_DEBUG = __DEV__ && false;

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
