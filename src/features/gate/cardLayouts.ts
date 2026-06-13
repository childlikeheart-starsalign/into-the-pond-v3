/**
 * Sanctuary Gate card template layouts (1400×900 artboard).
 * All coordinates are normalized 0–1 relative to card width/height.
 *
 * Visual map: CARD_LAYOUT_MAP.md
 */

export type CardFrame = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

export type CardLayout = {
  readonly illustrationFrame: CardFrame;
  readonly titleFrame: CardFrame;
  readonly descriptionFrame: CardFrame;
  readonly featuresFrame: CardFrame | null;
  readonly pricingFrame: CardFrame | null;
  readonly buttonFrame: CardFrame | null;
  /** Botanical corners / deckled margins — no dynamic content. */
  readonly forbiddenRegions: readonly CardFrame[];
  /** Optional badge overlays (ribbon, wax seal) — decorative, not text. */
  readonly badgeOverlays?: readonly { id: string; frame: CardFrame }[];
};

/** Explorer / current entitlement — two-column template (illustration + copy). */
export const CURRENT_ACCESS_CARD_LAYOUT: CardLayout = {
  illustrationFrame: { left: 0.05, top: 0.12, width: 0.38, height: 0.76 },
  titleFrame: { left: 0.45, top: 0.18, width: 0.48, height: 0.12 },
  descriptionFrame: { left: 0.45, top: 0.38, width: 0.48, height: 0.4 },
  featuresFrame: null,
  pricingFrame: null,
  buttonFrame: null,
  forbiddenRegions: [
    { left: 0, top: 0, width: 0.22, height: 0.28 },
    { left: 0.78, top: 0, width: 0.22, height: 0.22 },
    { left: 0, top: 0.72, width: 0.28, height: 0.28 },
    { left: 0.72, top: 0.68, width: 0.28, height: 0.32 },
  ],
};

/** Active tier label sits between title and description on current access card. */
export const CURRENT_ACCESS_ACTIVE_TIER_FRAME: CardFrame = {
  left: 0.45,
  top: 0.3,
  width: 0.48,
  height: 0.08,
};

/** Wooden / Fiberglass — three-column template. */
export const PRICING_CARD_STANDARD_LAYOUT: CardLayout = {
  illustrationFrame: { left: 0.03, top: 0.08, width: 0.31, height: 0.84 },
  titleFrame: { left: 0.35, top: 0.12, width: 0.33, height: 0.1 },
  descriptionFrame: { left: 0.35, top: 0.22, width: 0.33, height: 0.14 },
  featuresFrame: { left: 0.35, top: 0.36, width: 0.33, height: 0.52 },
  pricingFrame: { left: 0.69, top: 0.14, width: 0.27, height: 0.22 },
  buttonFrame: { left: 0.69, top: 0.18, width: 0.27, height: 0.7 },
  forbiddenRegions: [
    { left: 0, top: 0, width: 0.2, height: 0.26 },
    { left: 0.8, top: 0, width: 0.2, height: 0.24 },
    { left: 0, top: 0.74, width: 0.26, height: 0.26 },
    { left: 0.74, top: 0.7, width: 0.26, height: 0.3 },
  ],
  badgeOverlays: [
    { id: "ribbon", frame: { left: 0.79, top: 0, width: 0.18, height: 0.2 } },
    { id: "seal", frame: { left: 0.73, top: 0.05, width: 0.14, height: 0.16 } },
  ],
};

/** Monthly / lifetime CTA slots inside buttonFrame (standard card). */
export const PRICING_STANDARD_BUTTON_SLOTS = {
  monthly: { left: 0.69, top: 0.2, width: 0.27, height: 0.26 },
  lifetime: { left: 0.69, top: 0.5, width: 0.27, height: 0.26 },
  unavailable: { left: 0.69, top: 0.36, width: 0.27, height: 0.14 },
} as const satisfies Record<string, CardFrame>;

/** Lifetime premium — gold inset; illustration + info + single lifetime CTA. */
export const PRICING_CARD_PREMIUM_LAYOUT: CardLayout = {
  illustrationFrame: { left: 0.04, top: 0.1, width: 0.3, height: 0.8 },
  titleFrame: { left: 0.36, top: 0.14, width: 0.32, height: 0.1 },
  descriptionFrame: { left: 0.36, top: 0.24, width: 0.32, height: 0.14 },
  featuresFrame: { left: 0.36, top: 0.38, width: 0.32, height: 0.5 },
  pricingFrame: { left: 0.69, top: 0.2, width: 0.26, height: 0.16 },
  buttonFrame: { left: 0.69, top: 0.28, width: 0.26, height: 0.32 },
  forbiddenRegions: [
    { left: 0, top: 0, width: 0.18, height: 0.22 },
    { left: 0.82, top: 0, width: 0.18, height: 0.2 },
    { left: 0, top: 0.76, width: 0.24, height: 0.24 },
    { left: 0.76, top: 0.72, width: 0.24, height: 0.28 },
  ],
  badgeOverlays: [
    { id: "ribbon", frame: { left: 0.78, top: 0.01, width: 0.18, height: 0.19 } },
    { id: "seal", frame: { left: 0.72, top: 0.06, width: 0.14, height: 0.15 } },
  ],
};

export const PRICING_PREMIUM_BUTTON_SLOTS = {
  lifetime: { left: 0.69, top: 0.3, width: 0.26, height: 0.3 },
  unavailable: { left: 0.69, top: 0.38, width: 0.26, height: 0.14 },
} as const satisfies Record<string, CardFrame>;

export function pricingCardLayout(cardType: "standard" | "premium"): CardLayout {
  return cardType === "premium" ? PRICING_CARD_PREMIUM_LAYOUT : PRICING_CARD_STANDARD_LAYOUT;
}
