import type { ImageSourcePropType } from "react-native";

/**
 * Sanctuary header illustrated layers — Implementation Deliverables asset table.
 *
 * | Asset | Legacy z | Composite | Stretch |
 * |-------|----------|-----------|---------|
 * | header_paper_bg | 1 | hidden | 9-slice only |
 * | header_illustration_strip | — | 1 single watercolor UI | stretch; edge matte + deckle crop |
 * | botanical_overlay | 2 | hidden in composite | contain |
 * | month_note | 3 | hidden in composite | contain |
 * | wonder_bottle | 4 | hidden in composite | contain |
 * | avatar_hole_mask | 4 | N/A | legacy only |
 * | settings_button | 6 live | 7 deco + 8 Pressable | contain |
 *
 * Composite production replaces paper strip + avatar frame (wreath in overlay).
 * Composite band height 128pt (vs legacy 182–188pt) — see docs/sanctuary-header-qa.md.
 */
export const USE_HEADER_COMPOSITE_OVERLAY = true;

/** Spec: all decorative PNGs use contain; only paper uses 9-slice stretch. */
export const SANCTUARY_HEADER_DECORATIVE_RESIZE_MODE = "contain" as const;

/**
 * Temporary stretch for 1440×37 vine placeholders. Set false after intrinsic slot PNGs
 * (npm run sanctuary:extract-header-slots + sanctuary:process-header-assets).
 */
export const USE_COMPOSITE_PLACEHOLDER_STRETCH = false;

export type SanctuaryHeaderDecorativeResizeMode = "contain" | "stretch" | "cover";

export function resolveCompositeSlotResizeMode(): SanctuaryHeaderDecorativeResizeMode {
  return USE_COMPOSITE_PLACEHOLDER_STRETCH ? "stretch" : SANCTUARY_HEADER_DECORATIVE_RESIZE_MODE;
}

export function resolveCompositeBotanicalResizeMode(): SanctuaryHeaderDecorativeResizeMode {
  return USE_COMPOSITE_PLACEHOLDER_STRETCH ? "cover" : SANCTUARY_HEADER_DECORATIVE_RESIZE_MODE;
}

export const SANCTUARY_HEADER_PAPER_CAP_INSETS = {
  top: 72,
  left: 120,
  bottom: 72,
  right: 120,
} as const;

export const sanctuaryHeaderAssets = {
  headerArtwork: require("@/assets/sanctuary/header/header_illustration_strip.png"),
  paperBackground: require("@/assets/sanctuary/header/header_paper_bg.png"),
  botanicalOverlay: require("@/assets/sanctuary/header/botanical_overlay.png"),
  monthNote: require("@/assets/sanctuary/header/month_note.png"),
  wonderBottle: require("@/assets/sanctuary/header/wonder_bottle.png"),
  avatarHoleMask: require("@/assets/sanctuary/header/avatar_hole_mask.png"),
  settingsButton: require("@/assets/sanctuary/header/settings_button.png"),
  headerTopOverlay: require("@/assets/sanctuary/header/header_top_overlay.png"),
} as const;

/** Internal z-order inside SanctuaryHeader root (1 = back). */
export const SANCTUARY_HEADER_LAYER_Z = {
  paperBackground: 1,
  botanicalOverlay: 2,
  monthNote: 3,
  wonderBottle: 4,
  avatarHoleMask: 4,
  headerTopOverlay: 7,
  /** Same z as overlay; painted after overlay in JSX. */
  compositeDecoratives: 7,
  liveContent: 8,
} as const;

const COMPOSITE_HEADER_PREFETCH_SOURCES = [sanctuaryHeaderAssets.headerArtwork] as const;

const LEGACY_HEADER_PREFETCH_SOURCES = [
  sanctuaryHeaderAssets.paperBackground,
  sanctuaryHeaderAssets.botanicalOverlay,
  sanctuaryHeaderAssets.monthNote,
  sanctuaryHeaderAssets.wonderBottle,
  sanctuaryHeaderAssets.settingsButton,
] as const;

/** Primary visible layer for curtain-lift onLoadEnd. */
export function getSanctuaryHeaderPrefetchSource() {
  return USE_HEADER_COMPOSITE_OVERLAY
    ? sanctuaryHeaderAssets.headerArtwork
    : sanctuaryHeaderAssets.paperBackground;
}

/** All header PNGs to preload at curtain lift. */
export function getSanctuaryHeaderPrefetchSources(): ImageSourcePropType[] {
  return USE_HEADER_COMPOSITE_OVERLAY
    ? [...COMPOSITE_HEADER_PREFETCH_SOURCES]
    : [...LEGACY_HEADER_PREFETCH_SOURCES];
}
