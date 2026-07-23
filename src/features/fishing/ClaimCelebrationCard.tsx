import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { storyPlateTextStyles } from "@/src/constants/storyPlateTypography";
import { colors, fontFamilies } from "@/src/constants/theme";
import { FIELD_ENTRY_MARGIN_LABEL, JournalMargin } from "@/src/components/journal/JournalMargin";
import { formatClaimMarginDate } from "@/src/components/journal/formatJournalMarginDate";
import { FIELD_ENTRY_LEFT_OFFSET } from "@/src/components/journal/journalMarginTokens";
import type {
  ClaimCelebrationCopy,
  QuietRewardLine,
} from "@/src/features/fishing/claimCelebrationCopy";
import {
  FIELD_NOTE_PAGE_TURN_LABEL,
  FIELD_NOTE_REVEAL_BODY_MS,
  FIELD_NOTE_REVEAL_CLOSING_MS,
  FIELD_NOTE_REVEAL_CTA_MS,
  FIELD_NOTE_REVEAL_PAGE_RISE_MS,
  FIELD_NOTE_REVEAL_SETTLE_MS,
  FIELD_NOTE_REVEAL_SPECIES_MS,
  fieldNoteRevealDelays,
} from "@/src/features/fishing/claimCelebrationReveal";
import { TODAYS_FOCUS_CARD_BACK } from "@/src/features/well/wellAssets";
import { WELL_CARD_CONTENT_INSETS } from "@/src/features/well/wellModalLayout";
import { WellCardShell } from "@/src/features/well/WellCardShell";

/** Field-journal ink — never pure black. */
const TITLE_INK = "#34281F";
const SPECIES_INK = "#3A2C22";
const FIELD_NOTE = "#76685A";
const CLOSING_LINE = "#8B7B68";
const REWARD_LABEL = "#645242";
const REWARD_AMOUNT = "#9A8A79";
const ICON_INK = "#8B7B68";
/** Warm olive botanical rule. */
const OLIVE_INK = "rgba(111, 125, 104, 0.55)";
const OLIVE_ORNAMENT = "rgba(111, 125, 104, 0.72)";

const PAGE_RISE_OFFSET = 28;
const PAGE_SETTLE_SCALE = 0.985;

type ClaimCelebrationCardProps = {
  celebration: ClaimCelebrationCopy;
  /** When true, show page-turn CTA (after ripple or miss). */
  showContinue: boolean;
  continueAccessibilityLabel: string;
  onContinue: () => void;
  /** Full-bleed overlay while Pond Ripple runs. */
  revealOverlay?: ReactNode;
  /** Real claim timestamp (ms) for corner margin — Surface 1. */
  claimDateMs?: number;
};

function BotanicalDivider() {
  return (
    <View style={styles.divider} accessible={false}>
      <View style={styles.rule} />
      <Text style={styles.ornament}>❦</Text>
      <View style={styles.rule} />
    </View>
  );
}

function rewardIconName(kind: QuietRewardLine["kind"]): "flower-outline" | "leaf" {
  return kind === "wonder" ? "flower-outline" : "leaf";
}

function QuietRewardRow({ line }: { line: QuietRewardLine }) {
  return (
    <View style={styles.rewardRow} accessibilityLabel={`${line.label} plus ${line.amount}`}>
      <MaterialCommunityIcons
        name={rewardIconName(line.kind)}
        size={16}
        color={ICON_INK}
        style={styles.rewardIcon}
      />
      <Text style={styles.rewardLabel}>{line.label}</Text>
      <Text style={styles.rewardAmount}>({`+${line.amount}`})</Text>
    </View>
  );
}

function FieldNotePageTurnLink({
  visible,
  interactive,
  accessibilityLabel,
  onPress,
}: {
  visible: boolean;
  interactive: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.ctaWrap} pointerEvents={interactive ? "auto" : "none"}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !interactive }}
        disabled={!interactive}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pageTurnHit,
          pressed && interactive && styles.pageTurnPressed,
        ]}
      >
        <MaterialCommunityIcons
          name="leaf"
          size={12}
          color={colors.primary}
          style={storyPlateTextStyles.ctaLeaf}
        />
        <Text style={storyPlateTextStyles.ctaLabel}>{FIELD_NOTE_PAGE_TURN_LABEL}</Text>
      </Pressable>
    </View>
  );
}

function celebrationRevealKey(celebration: ClaimCelebrationCopy): string {
  return [
    celebration.title,
    celebration.speciesName ?? "",
    celebration.fieldNote,
    celebration.closingLine,
    celebration.rewardLines.map((line) => `${line.kind}:${line.amount}`).join(","),
  ].join("|");
}

/**
 * Antique naturalist's field note on Today's Focus card-back parchment.
 * Spec order: title → species → fieldNote → [divider] → rewards → closingLine → page turn.
 */
export function ClaimCelebrationCard({
  celebration,
  showContinue,
  continueAccessibilityLabel,
  onContinue,
  revealOverlay,
  claimDateMs,
}: ClaimCelebrationCardProps) {
  const showJournal = !revealOverlay;
  const hasRewards = celebration.rewardLines.length > 0;
  const hasSpecies = Boolean(celebration.speciesName);
  const claimDateLabel =
    claimDateMs != null && Number.isFinite(claimDateMs) ? formatClaimMarginDate(claimDateMs) : "";
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ctaInteractive, setCtaInteractive] = useState(false);

  const revealKey = useMemo(() => celebrationRevealKey(celebration), [celebration]);
  const delays = useMemo(() => fieldNoteRevealDelays(hasSpecies), [hasSpecies]);

  const pageTranslateY = useSharedValue(PAGE_RISE_OFFSET);
  const pageOpacity = useSharedValue(0);
  const pageScale = useSharedValue(PAGE_SETTLE_SCALE);
  const titleOpacity = useSharedValue(0);
  const speciesOpacity = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const closingOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  const enableCta = useCallback(() => {
    setCtaInteractive(true);
  }, []);

  const snapRevealToFinal = useCallback(() => {
    pageTranslateY.value = 0;
    pageOpacity.value = 1;
    pageScale.value = 1;
    titleOpacity.value = 1;
    speciesOpacity.value = 1;
    bodyOpacity.value = 1;
    closingOpacity.value = 1;
    ctaOpacity.value = 1;
    setCtaInteractive(true);
  }, [
    bodyOpacity,
    closingOpacity,
    ctaOpacity,
    pageOpacity,
    pageScale,
    pageTranslateY,
    speciesOpacity,
    titleOpacity,
  ]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!showJournal) {
      pageTranslateY.value = PAGE_RISE_OFFSET;
      pageOpacity.value = 0;
      pageScale.value = PAGE_SETTLE_SCALE;
      titleOpacity.value = 0;
      speciesOpacity.value = 0;
      bodyOpacity.value = 0;
      closingOpacity.value = 0;
      ctaOpacity.value = 0;
      setCtaInteractive(false);
      return;
    }

    setCtaInteractive(false);

    if (reduceMotion) {
      snapRevealToFinal();
      return;
    }

    pageTranslateY.value = PAGE_RISE_OFFSET;
    pageOpacity.value = 0;
    pageScale.value = PAGE_SETTLE_SCALE;
    titleOpacity.value = 0;
    speciesOpacity.value = 0;
    bodyOpacity.value = 0;
    closingOpacity.value = 0;
    ctaOpacity.value = 0;

    const riseEase = Easing.out(Easing.cubic);
    const fadeEase = Easing.inOut(Easing.quad);

    pageTranslateY.value = withTiming(0, {
      duration: FIELD_NOTE_REVEAL_PAGE_RISE_MS,
      easing: riseEase,
    });
    pageOpacity.value = withTiming(1, {
      duration: FIELD_NOTE_REVEAL_PAGE_RISE_MS,
      easing: riseEase,
    });

    pageScale.value = withDelay(
      delays.settle,
      withTiming(1, { duration: FIELD_NOTE_REVEAL_SETTLE_MS, easing: fadeEase }),
    );
    titleOpacity.value = withDelay(
      delays.title,
      withTiming(1, { duration: FIELD_NOTE_REVEAL_SETTLE_MS, easing: fadeEase }),
    );

    if (hasSpecies) {
      speciesOpacity.value = withDelay(
        delays.species,
        withTiming(1, { duration: FIELD_NOTE_REVEAL_SPECIES_MS, easing: fadeEase }),
      );
    }

    bodyOpacity.value = withDelay(
      delays.body,
      withTiming(1, { duration: FIELD_NOTE_REVEAL_BODY_MS, easing: fadeEase }),
    );
    closingOpacity.value = withDelay(
      delays.closing,
      withTiming(1, { duration: FIELD_NOTE_REVEAL_CLOSING_MS, easing: fadeEase }),
    );
    ctaOpacity.value = withDelay(
      delays.cta,
      withTiming(1, { duration: FIELD_NOTE_REVEAL_CTA_MS, easing: fadeEase }, (finished) => {
        if (finished) runOnJS(enableCta)();
      }),
    );
  }, [
    bodyOpacity,
    closingOpacity,
    ctaOpacity,
    delays,
    enableCta,
    hasSpecies,
    pageOpacity,
    pageScale,
    pageTranslateY,
    reduceMotion,
    revealKey,
    showJournal,
    snapRevealToFinal,
    speciesOpacity,
    titleOpacity,
  ]);

  const journalMotionStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [{ translateY: pageTranslateY.value }, { scale: pageScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const speciesStyle = useAnimatedStyle(() => ({ opacity: speciesOpacity.value }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: bodyOpacity.value }));
  const closingStyle = useAnimatedStyle(() => ({ opacity: closingOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const handleContinue = useCallback(() => {
    if (!ctaInteractive) return;
    onContinue();
  }, [ctaInteractive, onContinue]);

  return (
    <View style={styles.cardWidth}>
      <WellCardShell
        variant="focus"
        source={TODAYS_FOCUS_CARD_BACK}
        accessibilityLabel="Field note"
      >
        {revealOverlay ? (
          <View style={styles.revealOverlay} pointerEvents="box-none">
            {revealOverlay}
          </View>
        ) : null}

        {showJournal ? (
          <Animated.View style={[styles.journalLayer, journalMotionStyle]} pointerEvents="box-none">
            <View style={styles.page} pointerEvents="box-none">
              <View style={styles.pageBody}>
                <Animated.View style={[styles.titleBlock, titleStyle]}>
                  <Text style={styles.title}>{celebration.title}</Text>
                </Animated.View>

                {celebration.speciesName ? (
                  <Animated.Text style={[styles.speciesName, speciesStyle]}>
                    {celebration.speciesName}
                  </Animated.Text>
                ) : null}

                <Animated.View
                  style={[
                    bodyStyle,
                    celebration.speciesName
                      ? styles.fieldNoteAfterSpecies
                      : styles.fieldNoteAfterTitle,
                  ]}
                >
                  <Text style={styles.fieldNote} numberOfLines={3}>
                    {celebration.fieldNote}
                  </Text>

                  {hasRewards ? (
                    <>
                      <View style={styles.noteToDivider}>
                        <BotanicalDivider />
                      </View>
                      <View style={styles.rewardBlock}>
                        {celebration.rewardLines.map((line) => (
                          <QuietRewardRow key={line.kind} line={line} />
                        ))}
                      </View>
                    </>
                  ) : null}
                </Animated.View>

                <Animated.Text
                  style={[
                    styles.closingLine,
                    hasRewards ? styles.closingAfterRewards : styles.closingAfterFieldNote,
                    closingStyle,
                  ]}
                >
                  {celebration.closingLine}
                </Animated.Text>
              </View>

              {showContinue ? (
                <Animated.View style={[styles.ctaDock, ctaStyle]}>
                  <FieldNotePageTurnLink
                    visible
                    interactive={ctaInteractive}
                    accessibilityLabel={continueAccessibilityLabel}
                    onPress={handleContinue}
                  />
                </Animated.View>
              ) : null}
            </View>

            {/* Trailing a11y — journal furniture after main field-note content. */}
            <JournalMargin
              position="left"
              content={FIELD_ENTRY_MARGIN_LABEL}
              variant="label"
              leftOffset={FIELD_ENTRY_LEFT_OFFSET}
              accessibilityGrouping="trailing"
            />
            {claimDateLabel ? (
              <JournalMargin
                position="corner"
                content={claimDateLabel}
                variant="date"
                accessibilityGrouping="trailing"
              />
            ) : null}
          </Animated.View>
        ) : null}
      </WellCardShell>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWidth: {
    width: "90%",
    maxWidth: 360,
    alignSelf: "center",
    position: "relative",
  },
  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  journalLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  page: {
    position: "absolute",
    left: `${WELL_CARD_CONTENT_INSETS.left * 100}%`,
    top: "12%",
    bottom: "10%",
    width: `${WELL_CARD_CONTENT_INSETS.width * 100}%`,
    zIndex: 2,
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 16,
  },
  pageBody: {
    alignSelf: "stretch",
    alignItems: "center",
    flexShrink: 1,
  },
  ctaDock: {
    alignSelf: "stretch",
    marginTop: "auto",
    paddingTop: 16,
    alignItems: "center",
    transform: [{ translateY: 15 }],
  },
  titleBlock: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  title: {
    fontFamily: fontFamilies.gateTitle,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: TITLE_INK,
    textAlign: "center",
  },
  speciesName: {
    fontFamily: fontFamilies.gateTitleSemi,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: SPECIES_INK,
    textAlign: "center",
    marginTop: 16,
  },
  fieldNote: {
    fontFamily: fontFamilies.gateTitleItalic,
    fontSize: 15,
    lineHeight: 20,
    color: FIELD_NOTE,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  fieldNoteAfterSpecies: {
    marginTop: 8,
    alignSelf: "stretch",
  },
  fieldNoteAfterTitle: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  noteToDivider: {
    marginTop: 16,
    alignSelf: "stretch",
    alignItems: "center",
  },
  rewardBlock: {
    marginTop: 0,
    alignItems: "center",
    alignSelf: "stretch",
    gap: 1.5,
  },
  closingLine: {
    fontFamily: fontFamilies.gateTitleItalic,
    fontSize: 14,
    lineHeight: 18,
    color: CLOSING_LINE,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  closingAfterRewards: {
    marginTop: 20,
  },
  closingAfterFieldNote: {
    marginTop: 24,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rewardIcon: {
    marginTop: 1,
  },
  rewardLabel: {
    fontFamily: fontFamilies.gateTitleSemi,
    fontSize: 14,
    lineHeight: 18,
    color: REWARD_LABEL,
  },
  rewardAmount: {
    fontFamily: fontFamilies.gateTitleSemi,
    fontSize: 12,
    lineHeight: 16,
    color: REWARD_AMOUNT,
  },
  ctaWrap: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  pageTurnHit: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  pageTurnPressed: {
    opacity: 0.72,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "stretch",
  },
  rule: {
    flex: 1,
    maxWidth: 72,
    height: StyleSheet.hairlineWidth,
    backgroundColor: OLIVE_INK,
  },
  ornament: {
    fontFamily: fontFamilies.gateTitleRegular,
    fontSize: 14,
    lineHeight: 16,
    color: OLIVE_ORNAMENT,
  },
});
