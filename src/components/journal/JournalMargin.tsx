import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  JOURNAL_MARGIN_CHAPTER_FONT_SIZE,
  JOURNAL_MARGIN_COLOR,
  JOURNAL_MARGIN_FONT_SIZE,
  JOURNAL_MARGIN_LEFT_ANCHOR,
  JOURNAL_MARGIN_LEFT_LETTER_SPACING,
} from "@/src/components/journal/journalMarginTokens";
import { fontFamilies } from "@/src/constants/theme";

export { FIELD_ENTRY_MARGIN_LABEL } from "@/src/components/journal/journalMarginCopy";

/**
 * JournalMargin — closed-scope book furniture for exactly four approved surfaces.
 *
 * Content-source rule (manual PR review): every `content` prop must trace to
 * (a) a real field on the surface's data model, or (b) a static category label
 * that never varies with data. No fabricated page numbers or counts.
 *
 * Do not add a fifth surface without explicit product sign-off.
 */

export type JournalMarginPosition = "left" | "bottom" | "corner";

export type JournalMarginVariant = "chapter" | "date" | "label";

export type JournalMarginAccessibilityGrouping = "leading" | "trailing";

type JournalMarginBaseProps = {
  position: JournalMarginPosition;
  /** Real data or fixed category label — see content-source rule above. */
  content: string;
  variant?: JournalMarginVariant;
  /** Extra horizontal inset for `position="left"` only (negative = toward card edge). */
  leftOffset?: number;
  /**
   * Parent controls sibling order for screen-reader flow.
   * leading = announce before main content; trailing = after as metadata.
   * Never mix leading and trailing on the same surface.
   */
  accessibilityGrouping: JournalMarginAccessibilityGrouping;
};

type JournalMarginInteractive =
  | { interactive?: undefined }
  | { interactive: { onPress: () => void } };

export type JournalMarginProps = JournalMarginBaseProps & JournalMarginInteractive;

/**
 * Shared margin mark. Parent must use `position: 'relative'` so absolute
 * placements stay inside the card/band bounds.
 */
export function JournalMargin({
  position,
  content,
  variant = "label",
  leftOffset = 0,
  accessibilityGrouping: _accessibilityGrouping,
  ...rest
}: JournalMarginProps) {
  const interactive = "interactive" in rest ? rest.interactive : undefined;
  const trimmed = content.trim();
  if (!trimmed) return null;

  const fontSize =
    variant === "chapter" ? JOURNAL_MARGIN_CHAPTER_FONT_SIZE : JOURNAL_MARGIN_FONT_SIZE;

  const text = (
    <Text
      style={[
        styles.base,
        { fontSize },
        position === "left" && styles.leftText,
        position === "bottom" && styles.bottomText,
        position === "corner" && styles.cornerText,
        variant === "date" && styles.dateItalic,
      ]}
      accessible={!interactive}
      accessibilityRole={interactive ? undefined : "text"}
      accessibilityLabel={trimmed}
      importantForAccessibility="yes"
    >
      {trimmed}
    </Text>
  );

  if (interactive) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={trimmed}
        onPress={interactive.onPress}
        style={[styles.hit, positionStyle(position, leftOffset)]}
        hitSlop={8}
      >
        {text}
      </Pressable>
    );
  }

  return (
    <View style={positionStyle(position, leftOffset)} pointerEvents="none">
      {text}
    </View>
  );
}

function positionStyle(position: JournalMarginPosition, leftOffset: number) {
  if (position === "left") {
    return [styles.leftAnchor, { left: JOURNAL_MARGIN_LEFT_ANCHOR + leftOffset }];
  }
  if (position === "bottom") return styles.bottomAnchor;
  return styles.cornerAnchor;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamilies.journalMargin,
    color: JOURNAL_MARGIN_COLOR,
    includeFontPadding: false,
  },
  leftText: {
    letterSpacing: JOURNAL_MARGIN_LEFT_LETTER_SPACING,
    textTransform: "uppercase",
  },
  bottomText: {
    textAlign: "right",
  },
  cornerText: {
    textAlign: "right",
  },
  dateItalic: {
    fontStyle: "italic",
  },
  leftAnchor: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -40 }, { rotate: "-90deg" }],
    zIndex: 6,
  },
  bottomAnchor: {
    position: "absolute",
    right: 12,
    bottom: 6,
    left: 12,
    alignItems: "flex-end",
    zIndex: 6,
  },
  cornerAnchor: {
    position: "absolute",
    right: 12,
    bottom: 10,
    zIndex: 6,
  },
  hit: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
});
