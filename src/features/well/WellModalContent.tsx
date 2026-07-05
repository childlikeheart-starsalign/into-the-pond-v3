import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, layout, spacing } from "@/src/constants/theme";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { useWellQuestion } from "@/src/hooks/useWellQuestion";
import {
  getWellFocusCardLayoutWidth,
  getWellFooterLinkLayout,
} from "@/src/features/well/wellModalLayout";
import { wellLoadErrorMessage } from "@/src/features/well/wellCopy";
import { TodaysFocusCardEntry } from "@/src/features/well/TodaysFocusCardEntry";
import { TodaysFocusFlipCard } from "@/src/features/well/TodaysFocusFlipCard";
import { PreviewOnlyBanner } from "@/src/features/sanctuary/PreviewOnlyBanner";
import { WellDeferLink } from "@/src/features/well/WellDeferLink";
import { WellRerollButton } from "@/src/features/well/WellRerollButton";
import { WellSceneBackground } from "@/src/features/well/WellSceneBackground";
import type { WellVisualPhase } from "@/src/features/well/WellSceneJourney";

type WellModalContentProps = {
  onClose: () => void;
};

export function WellModalContent({ onClose }: WellModalContentProps) {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const well = useWellQuestion(true);
  const atlasAnchorRef = useRef<View>(null);

  const [phase, setPhase] = useState<WellVisualPhase>("establishing");
  const [closeupReady, setCloseupReady] = useState(false);
  const [face, setFace] = useState<"front" | "back">("front");
  const [revealActive, setRevealActive] = useState(false);
  const [wonderAwarded, setWonderAwarded] = useState<number | undefined>();
  const [reflectionPreviewOnly, setReflectionPreviewOnly] = useState(false);
  const [atlasEntryId, setAtlasEntryId] = useState<string | null>(null);
  const [savedReflection, setSavedReflection] = useState<string | null>(null);

  const questionReady = well.status === "ready" || well.status === "answered";
  const showCard = Boolean(well.question && questionReady);
  const isLoadingQuestion = well.status === "loading" || well.status === "idle";
  const cardEntryReady = closeupReady || phase === "interactive";
  const sceneReadyForOverlay = closeupReady || phase === "closeup" || phase === "interactive";
  const showCardSlot =
    sceneReadyForOverlay && (isLoadingQuestion || well.status === "error" || showCard);
  const showCardChrome = showCardSlot && showCard;
  const cardLayoutWidth =
    frame.width > 0 && frame.height > 0
      ? getWellFocusCardLayoutWidth(frame.width, frame.height)
      : undefined;

  useEffect(() => {
    if (phase === "interactive") {
      setCloseupReady(true);
    }
  }, [phase]);

  const handleFlip = useCallback(
    async (to: "front" | "back") => {
      setFace(to);
      if (to === "back" && !well.hasAnsweredToday) {
        await well.markAsked();
      }
    },
    [well],
  );

  const handleSave = useCallback(
    async (headline?: string): Promise<boolean> => {
      const response = await well.submitReflection(well.draftText, headline);
      if (!response.success) return false;
      setSavedReflection(well.draftText.trim());
      setWonderAwarded(response.wonderAwarded);
      setReflectionPreviewOnly(response.previewOnly === true);
      setAtlasEntryId(response.atlasEntryId);
      setRevealActive(true);
      setFace("back");
      return true;
    },
    [well],
  );

  const handleRevealComplete = useCallback(() => {
    setRevealActive(false);
  }, []);

  const handleReroll = useCallback(async () => {
    await well.reroll();
    setFace("front");
    setRevealActive(false);
    setSavedReflection(null);
    setAtlasEntryId(null);
    setReflectionPreviewOnly(false);
  }, [well]);

  const footerLayout =
    frame.width > 0 && frame.height > 0 ? getWellFooterLinkLayout(frame.width, frame.height) : null;

  return (
    <View style={styles.root}>
      <WellSceneBackground
        phase={phase}
        onPhaseChange={setPhase}
        onCloseupReady={() => setCloseupReady(true)}
        onClose={onClose}
        showOverlay={showCardSlot}
      >
        {isLoadingQuestion ? (
          <View style={styles.cardSlotMessage}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {well.status === "error" ? (
          <View style={styles.cardSlotMessage}>
            <Text style={layout.subtitle}>{wellLoadErrorMessage(well.error)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              onPress={() => void well.refresh()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {showCard && well.question ? (
          <TodaysFocusCardEntry
            animateKey={well.question.questionId}
            entryReady={cardEntryReady || showCard}
          >
            <TodaysFocusFlipCard
              question={well.question}
              layoutWidth={cardLayoutWidth}
              face={face}
              onFlip={handleFlip}
              cardStatus={well.cardStatus ?? "pending"}
              hasAnsweredToday={well.hasAnsweredToday}
              savedReflectionText={savedReflection}
              draftText={well.draftText}
              onDraftChange={well.setDraftText}
              onSave={handleSave}
              revealActive={revealActive}
              wonderAwarded={wonderAwarded}
              reflectionPreviewOnly={reflectionPreviewOnly}
              onRevealComplete={handleRevealComplete}
              atlasAnchorRef={atlasAnchorRef}
              atlasEntryId={atlasEntryId}
            />
          </TodaysFocusCardEntry>
        ) : null}
      </WellSceneBackground>

      {showCardChrome && frame.width > 0 ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.stageOverlay,
            {
              left: frame.left,
              top: frame.top,
              width: frame.width,
              height: frame.height,
            },
          ]}
        >
          {footerLayout && !well.hasAnsweredToday ? (
            <>
              <View pointerEvents="box-none" style={[styles.stageHitTarget, footerLayout.reroll]}>
                <WellRerollButton canReroll={well.canReroll} onPress={handleReroll} />
              </View>
              <View pointerEvents="box-none" style={[styles.stageHitTarget, footerLayout.defer]}>
                <WellDeferLink onPress={onClose} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  stageOverlay: {
    position: "absolute",
  },
  stageHitTarget: {
    position: "absolute",
  },
  cardSlotMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.inner,
    paddingHorizontal: spacing.inner,
  },
  retryButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
