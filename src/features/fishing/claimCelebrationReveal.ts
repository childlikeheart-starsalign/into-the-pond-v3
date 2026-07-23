/** Letter-opening reveal for the cast-finish field-note card (~2s total). */

export const FIELD_NOTE_REVEAL_PAGE_RISE_MS = 450;
export const FIELD_NOTE_REVEAL_SETTLE_MS = 350;
export const FIELD_NOTE_REVEAL_SPECIES_MS = 350;
export const FIELD_NOTE_REVEAL_BODY_MS = 350;
export const FIELD_NOTE_REVEAL_CLOSING_MS = 300;
export const FIELD_NOTE_REVEAL_CTA_MS = 200;

export const FIELD_NOTE_REVEAL_TOTAL_MS =
  FIELD_NOTE_REVEAL_PAGE_RISE_MS +
  FIELD_NOTE_REVEAL_SETTLE_MS +
  FIELD_NOTE_REVEAL_SPECIES_MS +
  FIELD_NOTE_REVEAL_BODY_MS +
  FIELD_NOTE_REVEAL_CLOSING_MS +
  FIELD_NOTE_REVEAL_CTA_MS;

export type FieldNoteRevealDelays = {
  settle: number;
  title: number;
  species: number;
  body: number;
  closing: number;
  cta: number;
};

/** Stagger delays (ms) from journal reveal start. Miss skips species — body starts earlier. */
export function fieldNoteRevealDelays(hasSpecies: boolean): FieldNoteRevealDelays {
  const settle = FIELD_NOTE_REVEAL_PAGE_RISE_MS;
  const title = settle;
  const species = settle + FIELD_NOTE_REVEAL_SETTLE_MS;
  const body = hasSpecies ? species + FIELD_NOTE_REVEAL_SPECIES_MS : species;
  const closing =
    FIELD_NOTE_REVEAL_PAGE_RISE_MS +
    FIELD_NOTE_REVEAL_SETTLE_MS +
    FIELD_NOTE_REVEAL_SPECIES_MS +
    FIELD_NOTE_REVEAL_BODY_MS;
  const cta = closing + FIELD_NOTE_REVEAL_CLOSING_MS;
  return { settle, title, species, body, closing, cta };
}

export const FIELD_NOTE_PAGE_TURN_LABEL = "Turn the page →";

/**
 * Card shell opacity during cast-finish ceremony.
 * Phase A (Pond Ripple overlay): shell must stay at 1 so CatalogRarityRing is visible.
 * Phase B: shell stays at 1; journal subtree owns letter-reveal opacity/motion.
 */
export function claimCelebrationShellOpacity(hasRevealOverlay: boolean): number {
  void hasRevealOverlay;
  return 1;
}
