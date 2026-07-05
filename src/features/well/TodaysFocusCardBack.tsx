import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { fontFamilies } from "@/src/constants/theme";
import { WELL_CARD_CONTENT_INSETS } from "@/src/features/well/wellModalLayout";
import {
  REFLECTION_GUIDANCE,
  REFLECTION_HEADER,
  WHY_THIS_MATTERS_HEADING,
} from "@/src/features/well/wellCopy";
import { WellAtlasSavedLabel } from "@/src/features/well/WellAtlasSavedLabel";
import { PreviewOnlyBanner } from "@/src/features/sanctuary/PreviewOnlyBanner";
import { TODAYS_FOCUS_CARD } from "@/src/features/well/wellAssets";
import { WellCardShell } from "@/src/features/well/WellCardShell";
import { WellReflectionJournalForm } from "@/src/features/well/WellReflectionJournalForm";
import { WellRewardRevealAnimation } from "@/src/features/well/WellRewardRevealAnimation";
import type { WellBankQuestion } from "@/shared/sanctuary/well/types";

const INK = "#2C1810";
const BARK = "#7A5C48";
const SAGE = "#7A9070";
const RULE = "rgba(200, 216, 192, 0.3)";

type TodaysFocusCardBackProps = {
  question: WellBankQuestion;
  draftText: string;
  onDraftChange: (text: string) => void;
  onSave: (headline?: string) => Promise<boolean>;
  hasAnsweredToday: boolean;
  savedReflectionText?: string | null;
  revealActive: boolean;
  wonderAwarded?: number;
  reflectionPreviewOnly?: boolean;
  onRevealComplete: () => void;
  atlasAnchorRef: React.RefObject<View | null>;
  atlasEntryId?: string | null;
};

export function TodaysFocusCardBack({
  question,
  draftText,
  onDraftChange,
  onSave,
  hasAnsweredToday,
  savedReflectionText,
  revealActive,
  wonderAwarded,
  reflectionPreviewOnly,
  onRevealComplete,
  atlasAnchorRef,
  atlasEntryId,
}: TodaysFocusCardBackProps) {
  const [headline, setHeadline] = useState("");
  const contentOpacity = useSharedValue(1);

  useEffect(() => {
    if (!revealActive) {
      contentOpacity.value = 1;
    }
  }, [contentOpacity, revealActive]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleSubmit = async () => {
    contentOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const trimmedHeadline = headline.trim();
    const success = await onSave(trimmedHeadline || undefined);
    if (!success) {
      contentOpacity.value = withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) });
    }
  };

  return (
    <WellCardShell variant="focus" source={TODAYS_FOCUS_CARD} accessibilityLabel="Reflection">
      <View style={styles.insets}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, contentStyle]}>
            <Text style={styles.whyHeading}>{WHY_THIS_MATTERS_HEADING}</Text>
            <Text style={styles.whyBody}>{question.whyThisMatters}</Text>

            <View style={styles.sectionRule} />

            <Text style={styles.guidance}>{REFLECTION_GUIDANCE}</Text>
            <Text style={styles.header}>{REFLECTION_HEADER}</Text>

            {hasAnsweredToday ? (
              <View style={styles.readOnlyBody}>
                <Text style={styles.savedText}>{savedReflectionText ?? draftText}</Text>
                <WellAtlasSavedLabel ref={atlasAnchorRef} entryId={atlasEntryId ?? undefined} />
              </View>
            ) : (
              <WellReflectionJournalForm
                draftText={draftText}
                headline={headline}
                onDraftChange={onDraftChange}
                onHeadlineChange={setHeadline}
                onSubmit={handleSubmit}
              />
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {revealActive && wonderAwarded != null ? (
        <>
          {reflectionPreviewOnly ? (
            <View style={styles.previewBannerWrap}>
              <PreviewOnlyBanner />
            </View>
          ) : null}
          <WellRewardRevealAnimation wonderAwarded={wonderAwarded} onComplete={onRevealComplete} />
        </>
      ) : null}
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  content: {
    flexGrow: 1,
    paddingTop: 20,
  },
  previewBannerWrap: {
    marginBottom: 16,
  },
  whyHeading: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SAGE,
    marginBottom: 8,
  },
  whyBody: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 22.1,
    color: BARK,
  },
  sectionRule: {
    height: 0.5,
    backgroundColor: RULE,
    marginVertical: 16,
  },
  guidance: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 18.7,
    fontStyle: "italic",
    color: BARK,
    marginBottom: 12,
  },
  header: {
    marginBottom: 16,
    fontFamily: fontFamilies.headingRegular,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 21.25,
    color: INK,
  },
  readOnlyBody: {
    flexGrow: 1,
    gap: 16,
  },
  savedText: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 22.1,
    color: INK,
  },
});
