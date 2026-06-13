import type { BreathingHotspot } from "@/src/features/fieldJournal/types";

/** Canonical journal spread artboard — all reader PNGs target this size. */
export const FIELD_JOURNAL_REFERENCE_WIDTH = 576;
export const FIELD_JOURNAL_REFERENCE_HEIGHT = 1024;

/** Default journal spread layout — cover fit within Portrait916Frame (see fitContainRect). */
export const JOURNAL_SPREAD_LAYOUT = {
  fit: "cover" as const,
  artboardWidth: FIELD_JOURNAL_REFERENCE_WIDTH,
  artboardHeight: FIELD_JOURNAL_REFERENCE_HEIGHT,
};

/**
 * Spread overlay clip on the open book (576×1024 artboard, normalized 0–1).
 * Includes binding gutters where spread pixels match open_book_scene — avoids a
 * visible seam at the page-content edge (hairline at the old 0.076 left inset).
 */
export const JOURNAL_BOOK_PAGE_NORM = {
  left: 0,
  top: 0.094,
  width: 0.823,
  height: 0.778,
} as const;

/** Extra clip bleed in reference pixels — softens the Skia clip edge. */
export const JOURNAL_BOOK_PAGE_CLIP_BLEED_PX = 2;

/**
 * Extra margin around the page rect while curling (fraction of page width/height per side).
 * Prevents the fold from clipping spread art at the page edge.
 */
export const JOURNAL_PAGE_CURL_BLEED = {
  left: 0.06,
  /** No right bleed — curl must stop at the binding strip, not overlap tabs. */
  right: 0,
  top: 0.06,
  /** Bottom needs more room — curl shadow and lower creature art extend past the page norm. */
  bottom: 0.16,
} as const;

/** Right edge of the left page / start of binding+tabs (reference px, 576×1024). */
export const JOURNAL_BINDING_STRIP_LEFT_PX = 467;
export const JOURNAL_BINDING_STRIP_LEFT_NORM =
  JOURNAL_BINDING_STRIP_LEFT_PX / FIELD_JOURNAL_REFERENCE_WIDTH;

/** Top of parchment content below the spread header (reference px). */
export const JOURNAL_PAGE_NORM_TOP_PX = Math.round(
  JOURNAL_BOOK_PAGE_NORM.top * FIELD_JOURNAL_REFERENCE_HEIGHT,
);

/** Wood line — parchment ends here; desk scene shows below (reference px). */
export const JOURNAL_PAGE_CONTENT_BOTTOM_PX = 837;

/**
 * Page-only crop for open_book_scene compositing (reference px on spread artboard).
 * Matches stillwater pages/*_page.png dimensions; deep-current pages use the same slot.
 */
export const JOURNAL_PAGE_CROP_REF = {
  left: 57,
  top: 0,
  width: 410,
  height: JOURNAL_PAGE_CONTENT_BOTTOM_PX,
} as const;

/** Warm parchment on the reverse of a curling page (#EDE4C8). */
export const JOURNAL_PAGE_BACK_COLOR = "#EDE4C8";

/**
 * Net-slot creature index ranges per fabric chapter tab (see creatures150 catalog).
 * Stillwater = common pool; Deep Current = all rare tiers; Charged Depths = epic.
 */
export const FIELD_JOURNAL_CHAPTER_SLOTS = {
  stillwater: { start: 0, end: 29 },
  "deep-current": { start: 30, end: 99 },
  "charged-depths": { start: 100, end: 149 },
} as const;

/** Glow positions for three creature illustrations per spread (576×1024 artboard). */
export const DEFAULT_CREATURE_HOTSPOTS: BreathingHotspot[] = [
  { x: 0.66, y: 0.26, rx: 0.06, ry: 0.05, color: "rgba(255, 255, 255, 0.55)" },
  { x: 0.65, y: 0.51, rx: 0.06, ry: 0.05, color: "rgba(255, 255, 255, 0.55)" },
  { x: 0.66, y: 0.73, rx: 0.06, ry: 0.05, color: "rgba(255, 255, 255, 0.55)" },
];
