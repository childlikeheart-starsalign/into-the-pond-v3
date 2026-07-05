import { StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "@/src/constants/theme";
import { WELL_CARD_CONTENT_INSETS } from "@/src/features/well/wellModalLayout";
import type { WellCardStatus } from "@/src/features/well/wellCardStatus";
import {
  ASKED_TODAY_LABEL,
  categoryLabel,
  FLIP_SWIPE_HINT,
  FLIP_TAP_ALT_HINT,
  TODAYS_FOCUS_LABEL,
  WHY_THIS_MATTERS_FLIP_PROMPT,
} from "@/src/features/well/wellCopy";
import { WellCardShell } from "@/src/features/well/WellCardShell";
import { WellDepthRating } from "@/src/features/well/WellDepthRating";
import { TODAYS_FOCUS_CARD } from "@/src/features/well/wellAssets";
import type { WellBankQuestion } from "@/shared/sanctuary/well/types";

const SAGE = "#7A9070";
const INK = "#2C1810";
const BARK = "#7A5C48";
const RULE = "rgba(200, 216, 192, 0.3)";
const ASKED_PILL_BG = "rgba(200, 216, 192, 0.22)";
const ASKED_PILL_TEXT = "#4A6840";
const FLIP_HINT_COLOR = "rgba(122, 92, 72, 0.6)";

type TodaysFocusCardFrontProps = {
  question: WellBankQuestion;
  cardStatus: WellCardStatus;
};

export function TodaysFocusCardFront({ question, cardStatus }: TodaysFocusCardFrontProps) {
  const showFlipHints = cardStatus === "pending";
  const showAskedPill = cardStatus === "asked";

  return (
    <WellCardShell
      variant="focus"
      source={TODAYS_FOCUS_CARD}
      accessibilityLabel="Today's focus question. Swipe or tap to flip the card."
    >
      <View style={styles.insets}>
        <Text style={styles.label}>{TODAYS_FOCUS_LABEL}</Text>
        <Text style={styles.theme}>{question.themeLabel}</Text>
        <Text style={styles.prompt} numberOfLines={3} ellipsizeMode="tail">
          {question.prompt}
        </Text>

        <View style={styles.spacer} />

        {showFlipHints ? (
          <View style={styles.interactPrompt} accessibilityRole="text">
            <View style={styles.swipeAffordance}>
              <Text style={styles.swipeChevron} accessibilityElementsHidden>
                ‹
              </Text>
              <Text style={styles.swipeHint}>{FLIP_SWIPE_HINT}</Text>
              <Text style={styles.swipeChevron} accessibilityElementsHidden>
                ›
              </Text>
            </View>
            <Text style={styles.tapAltHint}>{FLIP_TAP_ALT_HINT}</Text>
            <Text style={styles.whyPrompt}>{WHY_THIS_MATTERS_FLIP_PROMPT} →</Text>
          </View>
        ) : null}

        <View style={styles.metaSection}>
          <View style={styles.metaRule} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLeft}>{categoryLabel(question.category)}</Text>
            <WellDepthRating rating={question.depthRating} size={9} />
          </View>
        </View>

        {showAskedPill ? (
          <View style={styles.askedPill}>
            <Text style={styles.askedPillText}>{ASKED_TODAY_LABEL}</Text>
          </View>
        ) : null}
      </View>
    </WellCardShell>
  );
}

const styles = StyleSheet.create({
  insets: {
    position: "absolute",
    left: `${WELL_CARD_CONTENT_INSETS.left * 100}%`,
    top: `${WELL_CARD_CONTENT_INSETS.top * 100}%`,
    width: `${WELL_CARD_CONTENT_INSETS.width * 100}%`,
    height: `${WELL_CARD_CONTENT_INSETS.height * 100}%`,
    paddingBottom: 4,
    flexDirection: "column",
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SAGE,
    marginBottom: 10,
  },
  theme: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 20,
    fontWeight: "400",
    lineHeight: 25,
    color: INK,
  },
  prompt: {
    marginTop: 8,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 22.1,
    color: BARK,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  metaSection: {
    marginTop: 8,
  },
  metaRule: {
    height: 0.5,
    backgroundColor: RULE,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLeft: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    color: SAGE,
  },
  interactPrompt: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginBottom: 6,
  },
  swipeAffordance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  swipeChevron: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 18,
    color: FLIP_HINT_COLOR,
  },
  swipeHint: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: BARK,
    textAlign: "center",
  },
  tapAltHint: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    color: FLIP_HINT_COLOR,
    textAlign: "center",
  },
  whyPrompt: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: SAGE,
    textAlign: "center",
  },
  askedPill: {
    alignSelf: "center",
    backgroundColor: ASKED_PILL_BG,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  askedPillText: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: ASKED_PILL_TEXT,
    textAlign: "center",
  },
});
