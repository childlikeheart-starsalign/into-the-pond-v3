import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { STORY_JOURNAL_CARD_SIZE } from "@/src/constants/storyAssets";

/**
 * Open Folio layout tokens — Concept B.
 * Botanical card.png sheet sits in the lower third; illustration remains the hero.
 */
export function useStoryDialogueLayoutTokens() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const cardAspect = STORY_JOURNAL_CARD_SIZE.width / STORY_JOURNAL_CARD_SIZE.height;
    /**
     * Wider sheet for children's-book measure (~45–60ch).
     * At 16px Playfair, ~0.52em avg glyph → target text column ≈ 340–400px.
     */
    const folioWidth = Math.min(Math.round(width * 0.94), 440);
    const folioHeight = Math.round(folioWidth / cardAspect);
    /** Specimen medallion — overlaps paper; only ~half reserves text gutter */
    const medallionSize = Math.round(Math.min(Math.max(68, Math.round(width * 0.18)), 80) * 1.05);
    const plateHeight = Math.round(height * 0.73);
    const seamHeight = Math.round(height * 0.04);

    return {
      width,
      height,
      /** Zone A — clear illustration */
      plateHeight,
      /** Soft paper/art seam band */
      seamHeight,
      /** Zone C — botanical journal card */
      folioWidth,
      folioHeight,
      /** Slightly wider side insets — shorter book measure inside the botanical frame */
      folioPadTop: 40,
      folioPadLeft: 38,
      folioPadRight: 38,
      folioPadBottom: 36,
      medallionSize,
      /** Only part of the paste needs horizontal reservation; rest overlaps */
      medallionGap: 8,
      medallionTextGutter: Math.round(medallionSize * 0.5) + 8,
      medallionTopInset: -18,
      safeBottomMin: 28,
      /** Soft warm vignette peaking in lower Zone A */
      vignetteMaxOpacity: 0.22,
      dialogueFontSize: 16,
      dialogueLineHeight: 26,
      speakerFontSize: 11,
      turnHintFontSize: 10,
      typewriterMs: 28,
      folioEnterMs: 700,
      folioEnterY: 22,
      portraitEnterMs: 450,
      portraitDelayMs: 0,
      dialogueRevealDelayMs: 500,
      dialogueFadeMs: 300,
      hintRevealDelayMs: 300,
      hintPulseMs: 1300,
    };
  }, [width, height]);
}

/** Stage-direction lines wrapped in [ ] render at 80% dialogue size. */
export function isBracketedStageDirection(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("[") && trimmed.endsWith("]");
}

export function scaleDialogueTypography(
  fontSize: number,
  lineHeight: number,
  text: string,
): { fontSize: number; lineHeight: number } {
  if (!isBracketedStageDirection(text)) {
    return { fontSize, lineHeight };
  }
  return {
    fontSize: Math.round(fontSize * 0.8),
    lineHeight: Math.round(lineHeight * 0.8),
  };
}

/** Open Folio paper / ink — aligned with atlas + brand warmth */
export const storyFolioColors = {
  paper: "#F7F1E6",
  paperDeep: "#F3EADF",
  ink: "#2B241D",
  speaker: "#7A5C45",
  turnHint: "#A67E53",
  vine: "#8A9A7A",
  seamMist: "rgba(43, 36, 29, 0.18)",
  vignetteBark: "rgba(43, 36, 29, 0.22)",
  vignetteClear: "rgba(43, 36, 29, 0)",
} as const;
