/**
 * Normalized content zones measured from production gate card PNGs (1400×900).
 * Cards are layout templates — overlay dynamic content inside these rects only.
 *
 * Reference: sanctuary-gate-reference.png
 *   Current Access: illustration left ~38%, copy right ~52%
 *   Pricing: illustration left ~32%, info middle ~34%, purchase right ~28%
 */

import type { ViewStyle } from "react-native";

export const GATE_CARD_REF_WIDTH = 1400;
export const GATE_CARD_REF_HEIGHT = 900;

export type GateNormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

export function gatePercentRectStyle(rect: GateNormRect): ViewStyle {
  return {
    position: "absolute",
    left: `${rect.left * 100}%`,
    top: `${rect.top * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  };
}

/** Current Access — cottage illustration window + entitlement copy column. */
export const CURRENT_ACCESS_CARD_LAYOUT = {
  illustration: { left: 0.06, top: 0.14, width: 0.36, height: 0.72 },
  copy: { left: 0.44, top: 0.2, width: 0.5, height: 0.62 },
  title: { left: 0.44, top: 0.2, width: 0.5, height: 0.11 },
  activeLabel: { left: 0.44, top: 0.32, width: 0.5, height: 0.09 },
  description: { left: 0.44, top: 0.42, width: 0.5, height: 0.38 },
} as const satisfies Record<string, GateNormRect>;

/** Standard pricing — Wooden / Fiberglass tiers (three-column template). */
export const PRICING_CARD_STANDARD_LAYOUT = {
  ribbon: { left: 0.8, top: 0.01, width: 0.17, height: 0.2 },
  seal: { left: 0.74, top: 0.06, width: 0.13, height: 0.16 },
  illustration: { left: 0.04, top: 0.1, width: 0.3, height: 0.82 },
  header: { left: 0.36, top: 0.14, width: 0.34, height: 0.2 },
  features: { left: 0.36, top: 0.34, width: 0.34, height: 0.5 },
  purchase: { left: 0.7, top: 0.16, width: 0.26, height: 0.7 },
  ctaMonthly: { left: 0.7, top: 0.2, width: 0.26, height: 0.24 },
  ctaLifetime: { left: 0.7, top: 0.5, width: 0.26, height: 0.24 },
  unavailable: { left: 0.7, top: 0.38, width: 0.26, height: 0.14 },
} as const satisfies Record<string, GateNormRect>;

/** Premium pricing — Lifetime tier (wider gold inset, same column logic). */
export const PRICING_CARD_PREMIUM_LAYOUT = {
  ribbon: { left: 0.79, top: 0.02, width: 0.17, height: 0.19 },
  seal: { left: 0.73, top: 0.07, width: 0.13, height: 0.15 },
  illustration: { left: 0.05, top: 0.12, width: 0.3, height: 0.78 },
  header: { left: 0.37, top: 0.16, width: 0.33, height: 0.2 },
  features: { left: 0.37, top: 0.36, width: 0.33, height: 0.48 },
  purchase: { left: 0.7, top: 0.18, width: 0.25, height: 0.66 },
  ctaLifetime: { left: 0.7, top: 0.32, width: 0.25, height: 0.28 },
  unavailable: { left: 0.7, top: 0.4, width: 0.25, height: 0.14 },
} as const satisfies Record<string, GateNormRect>;

export const ACCOUNT_FOOTER_CARD_LAYOUT = {
  content: { left: 0.1, top: 0.18, width: 0.8, height: 0.64 },
  accountId: { left: 0.1, top: 0.38, width: 0.8, height: 0.18 },
  signOut: { left: 0.1, top: 0.56, width: 0.8, height: 0.22 },
  restore: { left: 0.1, top: 0.78, width: 0.8, height: 0.18 },
} as const satisfies Record<string, GateNormRect>;

export function pricingLayoutForCardType(cardType: "standard" | "premium") {
  return cardType === "premium" ? PRICING_CARD_PREMIUM_LAYOUT : PRICING_CARD_STANDARD_LAYOUT;
}
