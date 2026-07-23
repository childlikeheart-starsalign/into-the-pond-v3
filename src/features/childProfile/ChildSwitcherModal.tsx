import { useCallback, useEffect, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  DeepCheckAxisPair,
  DeepCheckScoreResult,
  RecentDeepCheckPoint,
} from "@/shared/childProfile/archetypeDeepCheck";
import { prependRecentDeepCheck, scoreDeepCheck } from "@/shared/childProfile/archetypeDeepCheck";
import { axesFromDisplayArchetype } from "@/shared/childProfile/archetypeCaptionBank";
import {
  isDisplayArchetypeName,
  scoreQuickCheckTally,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
  type QuickCheckScoreResult,
} from "@/shared/childProfile/archetypeQuickCheck";
import { formatLastExploredLabel } from "@/shared/childProfile/childrenSummary";
import { canAccessChild } from "@/shared/childProfile/tierAccess";
import type { ChildAccessTier } from "@/shared/childProfile/tierAccess";
import { FolioOrnamentDivider } from "@/components/story/FolioOrnamentDivider";
import { ArchetypeDeepCheck } from "@/src/components/dialogue/ArchetypeDeepCheck";
import { ArchetypeQuickCheck } from "@/src/components/dialogue/ArchetypeQuickCheck";
import { ArchetypeResultFlipCard } from "@/src/components/dialogue/ArchetypeResultFlipCard";
import { SanctuaryPreparationStep } from "@/src/components/dialogue/SanctuaryPreparationStep";
import {
  ARCHETYPE_DISCLAIMER,
  DEEP_CHECK_FIRST_CTA,
  DEEP_CHECK_FIRST_INTRO,
  DEEP_CHECK_RETENTION_NOTE,
  DEEP_CHECK_RETAKE_CTA,
  DEEP_CHECK_RETAKE_INTRO,
} from "@/src/constants/archetypeDiagnostics";
import { STORY_LONG_CARD } from "@/src/constants/storyAssets";
import { storyFolioColors } from "@/src/constants/storyDialogueStyles";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { playPaperClick } from "@/src/services/audio/playPaperClick";
import { useChildProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import { isChildRowDisabled } from "@/src/features/childProfile/isChildRowDisabled";
import { StorybookMessage } from "@/src/features/childProfile/prepareStorybookMessages";
import { resolveFlipCardMapState } from "@/src/features/childProfile/resolveFlipCardMapState";
import { callSubmitChildDeepCheck } from "@/src/features/childProfile/submitChildDeepCheckClient";
import { callSubmitChildQuickCheck } from "@/src/features/childProfile/submitChildQuickCheckClient";
import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";

type ModalPhase =
  | "switcher"
  | "peek"
  | "unwritten"
  | "deepCheck"
  | "dcResult"
  | "quickCheck"
  | "qcResult";

type DeepCheckReturnPhase = "peek" | "qcResult";

type Props = {
  visible: boolean;
  onClose: () => void;
  summary: ChildrenSummaryEntry[];
  activeChildId: string | null;
  tier: ChildAccessTier;
  /** When true, ignore selection (seal / in-flight Well write). */
  switchingBlocked?: boolean;
  onSelect: (childId: string) => void;
  onAddChild?: () => void;
  canAddChild?: boolean;
  /**
   * Free-tier at cap: show an Add child slot that opens the limit storybook
   * (not create-child-profile).
   */
  showLimitAddSlot?: boolean;
  onLimitAddChild?: () => void;
};

/**
 * Header switcher — dense folio page on the meadow.
 * Entries read as folio captions; chapter CTA binds to the page foot.
 * When childResultPeek is on, taps open a peek plate without switching
 * until the primary CTA requests a switch.
 */
export function ChildSwitcherModal({
  visible,
  onClose,
  summary,
  activeChildId,
  tier,
  switchingBlocked = false,
  onSelect,
  onAddChild,
  canAddChild = false,
  showLimitAddSlot = false,
  onLimitAddChild,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { childResultPeek: childResultPeekEnabled } = useChildProfileFeatureFlags();
  const [phase, setPhase] = useState<ModalPhase>("switcher");
  const [peekChild, setPeekChild] = useState<ChildrenSummaryEntry | null>(null);
  const [qcScore, setQcScore] = useState<QuickCheckScoreResult | null>(null);
  const [qcTally, setQcTally] = useState<QuickCheckArchetype[] | null>(null);
  const [qcPersistError, setQcPersistError] = useState<string | null>(null);
  const [qcPersisting, setQcPersisting] = useState(false);
  const [dcScore, setDcScore] = useState<DeepCheckScoreResult | null>(null);
  const [dcAnswers, setDcAnswers] = useState<DeepCheckAxisPair[] | null>(null);
  const [dcPersistError, setDcPersistError] = useState<string | null>(null);
  const [dcPersisting, setDcPersisting] = useState(false);
  const [deepCheckReturnPhase, setDeepCheckReturnPhase] = useState<DeepCheckReturnPhase>("peek");

  useEffect(() => {
    if (!visible) {
      setPhase("switcher");
      setPeekChild(null);
      setQcScore(null);
      setQcTally(null);
      setQcPersistError(null);
      setQcPersisting(false);
      setDcScore(null);
      setDcAnswers(null);
      setDcPersistError(null);
      setDcPersisting(false);
      setDeepCheckReturnPhase("peek");
    }
  }, [visible]);

  const persistQuickCheck = useCallback(
    async (childId: string, answers: QuickCheckArchetype[], scored: QuickCheckScoreResult) => {
      setQcPersisting(true);
      setQcPersistError(null);
      try {
        const result = await callSubmitChildQuickCheck({ childId, quickCheckTally: answers });
        setPeekChild((prev) =>
          prev
            ? {
                ...prev,
                displayArchetypeName: scored.displayArchetypeName,
                recentDeepChecks: result.recentDeepChecks,
              }
            : prev,
        );
      } catch (err) {
        const code =
          err &&
          typeof err === "object" &&
          "code" in err &&
          typeof (err as { code: unknown }).code === "string"
            ? (err as { code: string }).code
            : null;
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[submitChildQuickCheck] persist failed", { code, message, err });
        const base = "We couldn't save this page. Please try again.";
        setQcPersistError(__DEV__ && code ? `${base} (${code})` : base);
      } finally {
        setQcPersisting(false);
      }
    },
    [],
  );

  const persistDeepCheck = useCallback(
    async (childId: string, answers: DeepCheckAxisPair[], scored: DeepCheckScoreResult) => {
      setDcPersisting(true);
      setDcPersistError(null);
      try {
        const result = await callSubmitChildDeepCheck({
          childId,
          deepCheckAnswers: answers,
        });
        setPeekChild((prev) =>
          prev
            ? {
                ...prev,
                displayArchetypeName: result.displayArchetypeName,
                recentDeepChecks: result.recentDeepChecks,
              }
            : prev,
        );
        setDcScore({
          axisA: result.axisA,
          axisB: result.axisB,
          displayArchetypeName: result.displayArchetypeName,
          primaryArchetype: result.primaryArchetype,
        });
      } catch (err) {
        const code =
          err &&
          typeof err === "object" &&
          "code" in err &&
          typeof (err as { code: unknown }).code === "string"
            ? (err as { code: string }).code
            : null;
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[submitChildDeepCheck] persist failed", { code, message, err });
        // Do not prepend again — onComplete already wrote the optimistic point.
        const base = "We couldn't save this page. Please try again.";
        setDcPersistError(__DEV__ && code ? `${base} (${code})` : base);
      } finally {
        setDcPersisting(false);
      }
    },
    [],
  );

  const startDeepCheck = useCallback((from: DeepCheckReturnPhase) => {
    setDeepCheckReturnPhase(from);
    setDcPersistError(null);
    setPhase("deepCheck");
  }, []);

  const deepCheckCtaProps = useCallback(
    (hasDeepHistory: boolean, hasMapHistory: boolean, from: DeepCheckReturnPhase) => ({
      deepCheckIntro: hasDeepHistory ? DEEP_CHECK_RETAKE_INTRO : DEEP_CHECK_FIRST_INTRO,
      deepCheckCtaLabel: hasDeepHistory ? DEEP_CHECK_RETAKE_CTA : DEEP_CHECK_FIRST_CTA,
      onDeepCheckPress: () => startDeepCheck(from),
      deepCheckRetentionNote: hasMapHistory ? DEEP_CHECK_RETENTION_NOTE : null,
    }),
    [startDeepCheck],
  );

  const pageWidth = Math.min(screenWidth * 0.92 * 1.06 * 1.2, 400 * 1.06 * 1.2, screenWidth - 32);
  const pageMinHeight = Math.round(screenHeight * 0.46) + 60;
  const pageMaxHeight = Math.round(screenHeight * 0.7 * 1.06 * 1.2);
  const edgeInset = Math.round(pageWidth * 0.13);
  const showFooter =
    (canAddChild && onAddChild) || (!canAddChild && showLimitAddSlot && onLimitAddChild);
  const contentMinHeight = Math.max(pageMinHeight - edgeInset * 2, 0);

  const dismissToSanctuary = () => {
    setPhase("switcher");
    setPeekChild(null);
    onClose();
  };

  const handleRowPress = (child: ChildrenSummaryEntry) => {
    const accessible = canAccessChild(child.childOrder, tier);
    const isActive = child.childId === activeChildId;
    if (
      isChildRowDisabled({
        accessible,
        switchingBlocked,
        isActive,
        childResultPeekEnabled,
      })
    ) {
      return;
    }

    playPaperClick();

    if (!childResultPeekEnabled) {
      onSelect(child.childId);
      onClose();
      return;
    }

    setPeekChild(child);
    setPhase(isDisplayArchetypeName(child.displayArchetypeName) ? "peek" : "unwritten");
  };

  const renderSwitcher = () => (
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={[
        styles.pageWrap,
        {
          width: pageWidth,
          minHeight: pageMinHeight,
          maxHeight: pageMaxHeight,
          marginTop: 30,
        },
      ]}
    >
      <ImageBackground
        source={STORY_LONG_CARD}
        style={[styles.page, { minHeight: pageMinHeight, maxHeight: pageMaxHeight }]}
        imageStyle={styles.pageImage}
        resizeMode="stretch"
      >
        <ScrollView
          contentContainerStyle={[
            styles.pageInner,
            {
              paddingHorizontal: edgeInset,
              paddingTop: edgeInset,
              paddingBottom: edgeInset,
              minHeight: contentMinHeight,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.upper}>
            <Text style={styles.title}>Whose story shall we continue?</Text>
            <Text style={styles.deck}>Choose whose story continues.</Text>
            <Text style={styles.support}>
              Children resting in the Sanctuary will quietly{"\n"}
              wait until you return to them.
            </Text>

            <View style={styles.list}>
              {summary.map((child, index) => {
                const accessible = canAccessChild(child.childOrder, tier);
                const isActive = child.childId === activeChildId;
                const lastExplored = formatLastExploredLabel(child.lastVisitedAt);
                const showRule = summary.length > 1 && index < summary.length - 1;
                const disabled = isChildRowDisabled({
                  accessible,
                  switchingBlocked,
                  isActive,
                  childResultPeekEnabled,
                });
                const a11yBits = [
                  child.name,
                  child.displayArchetypeName,
                  typeof child.ageYears === "number" ? `Age ${child.ageYears}` : null,
                  !accessible ? "resting in the Sanctuary" : null,
                  isActive ? "current story" : null,
                ].filter(Boolean);

                return (
                  <Pressable
                    key={child.childId}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: isActive,
                      disabled,
                    }}
                    accessibilityLabel={a11yBits.join(", ")}
                    onPress={() => handleRowPress(child)}
                    style={[
                      styles.entry,
                      showRule && styles.entryRule,
                      isActive && styles.entryActive,
                      !accessible && styles.entryLocked,
                    ]}
                  >
                    {isActive ? (
                      <>
                        <View style={styles.brassBookmark} pointerEvents="none" />
                        <Text style={styles.pressedFlower} pointerEvents="none">
                          ✿
                        </Text>
                      </>
                    ) : null}

                    <View style={[styles.portrait, !accessible && styles.portraitLocked]} />
                    <View style={styles.meta}>
                      <Text style={[styles.name, !accessible && styles.nameLocked]}>
                        {child.name}
                      </Text>
                      {child.displayArchetypeName ? (
                        <Text style={styles.archetype}>{child.displayArchetypeName}</Text>
                      ) : null}
                      {accessible && typeof child.ageYears === "number" ? (
                        <Text style={styles.detail}>Age {child.ageYears}</Text>
                      ) : null}
                      {accessible && lastExplored ? (
                        <Text style={styles.detail}>Last explored · {lastExplored}</Text>
                      ) : null}
                      {!accessible ? (
                        <Text style={styles.resting}>Resting in the Sanctuary</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showFooter ? <View style={styles.spine} /> : null}

          {showFooter ? (
            <View style={styles.footer}>
              <View style={styles.footerDivider}>
                <FolioOrnamentDivider />
              </View>
              {canAddChild && onAddChild ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Begin another story"
                  onPress={() => {
                    onClose();
                    onAddChild();
                  }}
                  style={styles.emptyPage}
                >
                  <Text style={styles.emptyPageMark}>＋</Text>
                  <Text style={styles.emptyPageTitle}>Begin another story</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Upgrade your Sanctuary to welcome another child."
                  onPress={() => {
                    onClose();
                    onLimitAddChild?.();
                  }}
                  style={styles.emptyPage}
                >
                  <Text style={styles.emptyPageMark}>＋</Text>
                  <Text style={styles.chapterSupport}>
                    Upgrade your Sanctuary{"\n"}
                    to welcome another child.
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </ScrollView>
      </ImageBackground>
    </Pressable>
  );

  const renderPeek = () => {
    if (!peekChild || !isDisplayArchetypeName(peekChild.displayArchetypeName)) {
      return null;
    }
    const displayName = peekChild.displayArchetypeName;
    const mapState = resolveFlipCardMapState(displayName, peekChild.recentDeepChecks);
    const isActive = peekChild.childId === activeChildId;

    return (
      <View pointerEvents="box-none" style={styles.peekWrap}>
        <ArchetypeResultFlipCard
          displayName={displayName}
          axisA={mapState.axisA}
          axisB={mapState.axisB}
          trail={mapState.trail}
          observedAt={mapState.observedAt}
          currentSource={mapState.currentSource}
          eyebrow={`Peeking into ${peekChild.name}'s page`}
          showAgeBandNote
          showDisclaimer
          disclaimer={ARCHETYPE_DISCLAIMER}
          ctaLabel={isActive ? undefined : `Switch to ${peekChild.name} →`}
          ctaAccessibilityLabel={isActive ? undefined : `Switch to ${peekChild.name}`}
          onContinue={
            isActive
              ? undefined
              : () => {
                  playPaperClick();
                  onSelect(peekChild.childId);
                  dismissToSanctuary();
                }
          }
          {...deepCheckCtaProps(mapState.hasDeepHistory, mapState.hasMapHistory, "peek")}
        />
      </View>
    );
  };

  const renderUnwritten = () => (
    <View pointerEvents="box-none" style={styles.peekWrap}>
      <SanctuaryPreparationStep
        status="error"
        presentation="embedded"
        message={StorybookMessage.pageUnwritten}
        onPrimaryPress={() => setPhase("switcher")}
        onSecondaryPress={() => setPhase("quickCheck")}
      />
    </View>
  );

  const renderQuickCheck = () => {
    if (!peekChild) return null;
    return (
      <View pointerEvents="box-none" style={styles.peekWrap}>
        <ArchetypeQuickCheck
          onComplete={(answers) => {
            const scored = scoreQuickCheckTally(answers);
            setQcScore(scored);
            setQcTally(answers);
            const axes = axesFromDisplayArchetype(scored.displayArchetypeName);
            const point: RecentDeepCheckPoint = {
              axisA: axes.axisA,
              axisB: axes.axisB,
              completedAt: new Date().toISOString(),
              source: "quick",
            };
            setPeekChild((prev) =>
              prev
                ? {
                    ...prev,
                    displayArchetypeName: scored.displayArchetypeName,
                    recentDeepChecks: prependRecentDeepCheck(prev.recentDeepChecks, point),
                  }
                : prev,
            );
            setPhase("qcResult");
            void persistQuickCheck(peekChild.childId, answers, scored);
          }}
        />
      </View>
    );
  };

  const renderQcResult = () => {
    if (!peekChild || !qcScore) return null;
    const displayName = qcScore.displayArchetypeName as DisplayArchetypeName;
    const mapState = resolveFlipCardMapState(displayName, peekChild.recentDeepChecks);

    return (
      <View pointerEvents="box-none" style={styles.peekWrap}>
        <ArchetypeResultFlipCard
          displayName={displayName}
          axisA={mapState.axisA}
          axisB={mapState.axisB}
          trail={mapState.trail}
          observedAt={mapState.observedAt}
          currentSource={mapState.currentSource}
          eyebrow={`${peekChild.name}'s page`}
          showAgeBandNote={false}
          showDisclaimer
          disclaimer={ARCHETYPE_DISCLAIMER}
          {...deepCheckCtaProps(mapState.hasDeepHistory, mapState.hasMapHistory, "qcResult")}
          secondaryCtaLabel={qcPersistError ? "Try again" : undefined}
          onSecondaryPress={
            qcPersistError && qcTally
              ? () => {
                  void persistQuickCheck(peekChild.childId, qcTally, qcScore);
                }
              : undefined
          }
        />
        {qcPersistError ? (
          <Text style={styles.qcError}>{qcPersistError}</Text>
        ) : qcPersisting ? (
          <Text style={styles.qcError}>Saving…</Text>
        ) : null}
      </View>
    );
  };

  const renderDeepCheck = () => {
    if (!peekChild) return null;
    return (
      <View pointerEvents="box-none" style={styles.peekWrap}>
        <ArchetypeDeepCheck
          onComplete={(answers) => {
            const scored = scoreDeepCheck(answers);
            setDcScore(scored);
            setDcAnswers(answers);
            const point: RecentDeepCheckPoint = {
              axisA: scored.axisA,
              axisB: scored.axisB,
              completedAt: new Date().toISOString(),
              source: "deep",
            };
            setPeekChild((prev) =>
              prev
                ? {
                    ...prev,
                    displayArchetypeName: scored.displayArchetypeName,
                    recentDeepChecks: prependRecentDeepCheck(prev.recentDeepChecks, point),
                  }
                : prev,
            );
            setPhase("dcResult");
            void persistDeepCheck(peekChild.childId, answers, scored);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => setPhase(deepCheckReturnPhase)}
          style={styles.stubBack}
        >
          <Text style={styles.stubBackLabel}>Back</Text>
        </Pressable>
      </View>
    );
  };

  const renderDcResult = () => {
    if (!peekChild || !dcScore) return null;
    const displayName = dcScore.displayArchetypeName;
    const mapState = resolveFlipCardMapState(displayName, peekChild.recentDeepChecks);

    return (
      <View pointerEvents="box-none" style={styles.peekWrap}>
        <ArchetypeResultFlipCard
          displayName={displayName}
          axisA={mapState.axisA}
          axisB={mapState.axisB}
          trail={mapState.trail}
          observedAt={mapState.observedAt}
          currentSource={mapState.currentSource}
          eyebrow={`${peekChild.name}'s page`}
          showAgeBandNote
          showDisclaimer
          disclaimer={ARCHETYPE_DISCLAIMER}
          {...deepCheckCtaProps(true, true, "peek")}
          secondaryCtaLabel={dcPersistError ? "Try again" : undefined}
          onSecondaryPress={
            dcPersistError && dcAnswers
              ? () => {
                  void persistDeepCheck(peekChild.childId, dcAnswers, dcScore);
                }
              : undefined
          }
        />
        {dcPersistError ? (
          <Text style={styles.qcError}>{dcPersistError}</Text>
        ) : dcPersisting ? (
          <Text style={styles.qcError}>Saving…</Text>
        ) : null}
      </View>
    );
  };

  const backdropDismiss =
    phase === "switcher"
      ? onClose
      : phase === "qcResult" || phase === "dcResult" || phase === "peek" || phase === "unwritten"
        ? dismissToSanctuary
        : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissToSanctuary}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={backdropDismiss}
            accessibilityLabel="Close"
            accessibilityRole="button"
          />
          <View pointerEvents="box-none" style={styles.contentLayer}>
            {phase === "switcher"
              ? renderSwitcher()
              : phase === "peek"
                ? renderPeek()
                : phase === "unwritten"
                  ? renderUnwritten()
                  : phase === "quickCheck"
                    ? renderQuickCheck()
                    : phase === "qcResult"
                      ? renderQcResult()
                      : phase === "deepCheck"
                        ? renderDeepCheck()
                        : renderDcResult()}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const BRASS = "#B8956A";
const GOLD_GLOW = "#C4A35A";

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(43, 36, 29, 0.28)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
  },
  pageWrap: {
    shadowColor: "#2B241D",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  page: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  pageImage: {
    borderRadius: 0,
  },
  pageInner: {
    gap: 12,
  },
  upper: {
    gap: 12,
  },
  spine: {
    flexGrow: 1,
    flexShrink: 0,
    minHeight: 8,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 21,
    letterSpacing: -0.02 * 21,
    color: "rgba(43, 36, 29, 0.78)",
    textAlign: "center",
  },
  deck: {
    fontFamily: fontFamilies.gateTitleRegular,
    fontSize: 18,
    letterSpacing: 0.01 * 18,
    lineHeight: 24,
    color: "rgba(43, 36, 29, 0.78)",
    textAlign: "center",
  },
  support: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    opacity: 0.6,
    textAlign: "center",
  },
  list: {
    gap: 0,
    marginTop: spacing.tapGap,
    marginLeft: 20,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 50,
    paddingHorizontal: 4,
    paddingVertical: 11,
    backgroundColor: "transparent",
    overflow: "visible",
    position: "relative",
  },
  entryRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(122, 92, 69, 0.22)",
  },
  entryActive: {
    shadowColor: GOLD_GLOW,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  entryLocked: {
    opacity: 0.78,
  },
  brassBookmark: {
    position: "absolute",
    left: 0,
    top: 9,
    bottom: 9,
    width: 3,
    backgroundColor: BRASS,
    opacity: 0.85,
  },
  pressedFlower: {
    position: "absolute",
    right: 2,
    bottom: 7,
    fontSize: 16,
    color: colors.primary,
    opacity: 0.28,
  },
  portrait: {
    width: 36,
    height: 43,
    borderRadius: 18,
    backgroundColor: "rgba(243, 234, 223, 0.95)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122, 92, 69, 0.28)",
    marginLeft: 5,
  },
  portraitLocked: {
    opacity: 0.45,
  },
  meta: { flex: 1, gap: 2 },
  name: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    letterSpacing: -0.02 * 14,
    color: storyFolioColors.ink,
  },
  nameLocked: {
    opacity: 0.85,
  },
  archetype: {
    fontFamily: fontFamilies.gateTitleRegular,
    fontSize: 14,
    fontStyle: "italic",
    letterSpacing: 0.01 * 14,
    color: colors.primary,
  },
  detail: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.75,
    marginTop: 1,
  },
  resting: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: "rgba(154, 122, 66, 0.95)",
    marginTop: 1,
  },
  footer: {
    gap: 6,
  },
  footerDivider: {
    width: "90%",
    alignSelf: "center",
    marginTop: -25,
  },
  emptyPage: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
    paddingBottom: 4,
    gap: 4,
  },
  emptyPageMark: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 20,
    color: colors.primary,
    opacity: 0.55,
  },
  emptyPageTitle: {
    fontFamily: fontFamilies.gateTitleRegular,
    fontSize: 17,
    letterSpacing: 0.01 * 17,
    color: "rgba(43, 36, 29, 0.85)",
    textAlign: "center",
  },
  chapterSupport: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    opacity: 0.55,
    textAlign: "center",
    marginTop: 32,
  },
  peekWrap: {
    alignItems: "center",
    alignSelf: "center",
  },
  qcError: {
    marginTop: spacing.inner,
    paddingHorizontal: spacing.inner,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 340,
  },
  stubCard: {
    width: "92%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  stubTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    letterSpacing: -0.02 * 22,
    color: colors.textPrimary,
    textAlign: "center",
  },
  stubBody: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
  },
  stubBack: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stubBackLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.primary,
  },
});
