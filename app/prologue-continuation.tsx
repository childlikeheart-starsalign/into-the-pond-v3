import { MaterialCommunityIcons } from "@expo/vector-icons";
import { updateProfile } from "firebase/auth";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StoryBackground } from "@/components/story/StoryBackground";
import { axesFromDisplayArchetype } from "@/shared/childProfile/archetypeCaptionBank";
import {
  scoreQuickCheckTally,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
} from "@/shared/childProfile/archetypeQuickCheck";
import { ArchetypeQuickCheck } from "@/src/components/dialogue/ArchetypeQuickCheck";
import { ArchetypeResultFlipCard } from "@/src/components/dialogue/ArchetypeResultFlipCard";
import { DialogueOverlay } from "@/src/components/dialogue/DialogueOverlay";
import { OnboardingProgressCue } from "@/src/components/dialogue/OnboardingProgressCue";
import { SanctuaryPreparationStep } from "@/src/components/dialogue/SanctuaryPreparationStep";
import { ARCHETYPE_DISCLAIMER } from "@/src/constants/archetypeDiagnostics";
import { STORY_BACKGROUNDS, STORY_PAPER_INPUT_CARD } from "@/src/constants/storyAssets";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { callCreateChildProfile } from "@/src/features/childProfile/createChildProfileClient";
import { isChildLimitReachedError } from "@/src/features/childProfile/childLimitReached";
import { useActiveChild } from "@/src/features/childProfile/useActiveChild";
import { mapPrepareErrorToStorybookMessage } from "@/src/features/childProfile/prepareStorybookMessages";
import type { StorybookMessage } from "@/src/features/childProfile/prepareStorybookMessages";
import {
  childBirthYearRange,
  validateChildBirthMonthYear,
} from "@/src/features/onboarding/validateChildBirthDate";
import { routes } from "@/src/navigation/routes";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  clearProloguePart2Draft,
  createEmptyProloguePart2Draft,
  getProloguePart2Draft,
  saveProloguePart2Draft,
  type ProloguePart2Draft,
  type ProloguePart2Step,
} from "@/src/services/onboarding/narrativeOnboardingStorage";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Phase =
  | "loading"
  | "name"
  | "name_confirm"
  | "nickname"
  | "birthdate"
  | "quick_check"
  | "result"
  | "prepare"
  | "prepare_error"
  | "sanctuary_intro";

function stepToPhase(step: ProloguePart2Step): Phase {
  switch (step) {
    case "name":
      return "name";
    case "nickname":
      return "nickname";
    case "birthdate":
      return "birthdate";
    case "quick_check":
      return "quick_check";
    case "result":
      return "result";
    case "prepare":
      return "prepare";
    case "sanctuary_intro":
      return "sanctuary_intro";
    default:
      return "name";
  }
}

function progressIndex(phase: Phase): number {
  if (phase === "name" || phase === "name_confirm") return 0;
  if (phase === "nickname") return 1;
  if (phase === "birthdate") return 2;
  if (phase === "quick_check") return 3;
  return -1;
}

function BirthdateUi({ onSubmit }: { onSubmit: (isoDate: string) => void }) {
  const { minYear, maxYear } = useMemo(() => childBirthYearRange(), []);
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear],
  );
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [picker, setPicker] = useState<"month" | "year" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const continueEnabled = month != null && year != null;

  return (
    <View style={birthStyles.wrap}>
      <View style={birthStyles.row}>
        <Pressable
          style={({ pressed }) => [
            birthStyles.specimen,
            birthStyles.monthSpecimen,
            month != null && birthStyles.specimenSelected,
            pressed && birthStyles.specimenPressed,
          ]}
          onPress={() => setPicker("month")}
          accessibilityRole="button"
          accessibilityLabel={
            month != null ? `Birth month, ${MONTH_LABELS[month - 1]}` : "Choose birth month"
          }
        >
          <ImageBackground
            source={STORY_PAPER_INPUT_CARD}
            style={birthStyles.specimenPaper}
            imageStyle={birthStyles.specimenPaperImage}
            resizeMode="stretch"
          >
            <MaterialCommunityIcons
              name="leaf"
              size={17}
              color={month != null ? colors.secondary : colors.primary}
              style={birthStyles.specimenLeaf}
            />
            <Text style={birthStyles.specimenLabel}>BIRTH MONTH</Text>
            <Text style={birthStyles.specimenValue}>
              {month != null ? MONTH_LABELS[month - 1] : "Choose month"}
            </Text>
            <Text style={birthStyles.specimenCue}>
              {month != null ? "pressed specimen" : "tap to open"}
            </Text>
          </ImageBackground>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            birthStyles.specimen,
            birthStyles.yearSpecimen,
            year != null && birthStyles.specimenSelected,
            pressed && birthStyles.specimenPressed,
          ]}
          onPress={() => setPicker("year")}
          accessibilityRole="button"
          accessibilityLabel={year != null ? `Birth year, ${year}` : "Choose birth year"}
        >
          <ImageBackground
            source={STORY_PAPER_INPUT_CARD}
            style={birthStyles.specimenPaper}
            imageStyle={birthStyles.specimenPaperImage}
            resizeMode="stretch"
          >
            <MaterialCommunityIcons
              name="sprout"
              size={17}
              color={year != null ? colors.secondary : colors.primary}
              style={birthStyles.specimenLeaf}
            />
            <Text style={birthStyles.specimenLabel}>BIRTH YEAR</Text>
            <Text style={birthStyles.specimenValue}>
              {year != null ? String(year) : "Choose year"}
            </Text>
            <Text style={birthStyles.specimenCue}>
              {year != null ? "pressed specimen" : "tap to open"}
            </Text>
          </ImageBackground>
        </Pressable>
      </View>

      {error ? <Text style={birthStyles.error}>{error}</Text> : null}
      <ImageBackground
        source={STORY_PAPER_INPUT_CARD}
        style={[birthStyles.btnPaper, !continueEnabled && birthStyles.btnDisabled]}
        imageStyle={birthStyles.btnPaperImage}
        resizeMode="stretch"
      >
        <Pressable
          style={birthStyles.btn}
          disabled={!continueEnabled}
          onPress={() => {
            if (month == null || year == null) return;
            const validation = validateChildBirthMonthYear(month, year);
            if (!validation.ok) {
              setError("Please choose a valid birth month and year.");
              return;
            }
            onSubmit(validation.isoDate);
          }}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={birthStyles.btnLabel}>Continue →</Text>
        </Pressable>
      </ImageBackground>

      <Modal visible={picker != null} transparent animationType="fade">
        <Pressable style={birthStyles.modalBackdrop} onPress={() => setPicker(null)}>
          <ImageBackground
            source={STORY_PAPER_INPUT_CARD}
            style={birthStyles.sheet}
            imageStyle={birthStyles.sheetPaper}
            resizeMode="stretch"
          >
            <View style={birthStyles.sheetHeader}>
              <Text style={birthStyles.sheetKicker}>BOTANICAL RECORD</Text>
              <Text style={birthStyles.sheetTitle}>
                {picker === "month" ? "Choose the month" : "Choose the year"}
              </Text>
              <View style={birthStyles.sheetDivider}>
                <View style={birthStyles.sheetRule} />
                <Text style={birthStyles.sheetOrnament}>❦</Text>
                <View style={birthStyles.sheetRule} />
              </View>
            </View>

            <ScrollView>
              {(picker === "month"
                ? MONTH_LABELS.map((label, i) => ({ value: i + 1, label }))
                : years.map((y) => ({ value: y, label: String(y) }))
              ).map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    birthStyles.sheetRow,
                    (picker === "month" ? month === opt.value : year === opt.value) &&
                      birthStyles.sheetRowSelected,
                  ]}
                  onPress={() => {
                    if (picker === "month") setMonth(opt.value);
                    else setYear(opt.value);
                    setPicker(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: picker === "month" ? month === opt.value : year === opt.value,
                  }}
                >
                  <Text style={birthStyles.sheetText}>{opt.label}</Text>
                  {(picker === "month" ? month === opt.value : year === opt.value) ? (
                    <MaterialCommunityIcons name="leaf" size={15} color={colors.secondary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </ImageBackground>
        </Pressable>
      </Modal>
    </View>
  );
}

const birthStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: spacing.inner,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.inner,
  },
  specimen: {
    flex: 1,
    minHeight: 116,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.22)",
    backgroundColor: colors.bg,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 1, height: 3 },
    elevation: 2,
    overflow: "visible",
  },
  monthSpecimen: {
    transform: [{ rotate: "-1deg" }],
  },
  yearSpecimen: {
    transform: [{ rotate: "0.8deg" }],
  },
  specimenPressed: {
    opacity: 0.82,
    top: 2,
  },
  specimenSelected: {
    borderColor: colors.secondary,
  },
  specimenPaper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  specimenPaperImage: {
    borderRadius: 8,
    opacity: 0.98,
  },
  specimenLeaf: {
    position: "absolute",
    top: 10,
    right: 11,
    opacity: 0.72,
  },
  specimenLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.3,
    color: colors.primary,
    marginBottom: 7,
  },
  specimenValue: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.02 * 17,
    color: colors.textPrimary,
  },
  specimenCue: {
    marginTop: 7,
    fontFamily: fontFamilies.body,
    fontSize: 9,
    lineHeight: 12,
    color: colors.textSecondary,
    opacity: 0.72,
    fontStyle: "italic",
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.dangerSoft,
  },
  btnPaper: {
    minHeight: 52,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.22)",
    backgroundColor: colors.bg,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    transform: [{ rotate: "-0.15deg" }],
  },
  btnPaperImage: {
    borderRadius: 7,
  },
  btn: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.inner,
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31,26,23,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "62%",
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingVertical: spacing.inner,
    paddingHorizontal: 12,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  sheetPaper: {
    borderRadius: 8,
    opacity: 0.99,
  },
  sheetHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.inner,
    gap: spacing.tapGap,
  },
  sheetKicker: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  sheetTitle: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.02 * 21,
    color: colors.textPrimary,
  },
  sheetDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.tapGap,
  },
  sheetRule: {
    width: 48,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(122, 92, 69, 0.38)",
  },
  sheetOrnament: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 14,
    color: colors.secondary,
  },
  sheetRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.inner,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(122, 92, 69, 0.18)",
  },
  sheetRowSelected: {
    backgroundColor: "rgba(111, 125, 104, 0.10)",
  },
  sheetText: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
});

/** Part 2 — signed-in profile inputs → Quick Check → prepare → sanctuary intro. */
export default function PrologueContinuationScreen() {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const insets = useSafeAreaInsets();
  const activeChild = useActiveChild();
  const [draft, setDraft] = useState<ProloguePart2Draft | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [prepareStorybookMessage, setPrepareStorybookMessage] = useState<StorybookMessage | null>(
    null,
  );
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const exitedForExistingChildRef = useRef(false);

  /** Child already sealed — leave Part 2 so the auth guard cannot trap tab navigation. */
  const exitToSanctuary = useCallback(async () => {
    if (!uid || exitedForExistingChildRef.current) return;
    exitedForExistingChildRef.current = true;
    try {
      await clearProloguePart2Draft(uid);
    } catch {
      /* best-effort */
    }
    router.replace(routes.sanctuary);
  }, [uid]);

  useEffect(() => {
    if (!activeChild.ready) return;
    if (activeChild.childrenSummary.length === 0) return;
    if (phase === "loading") return;
    // Existing child: never keep the user on prepare / prepare_error.
    if (phase === "prepare" || phase === "prepare_error") {
      void exitToSanctuary();
    }
  }, [activeChild.ready, activeChild.childrenSummary.length, phase, exitToSanctuary]);

  useEffect(() => {
    if (phase !== "prepare_error") return;
    if (prepareStorybookMessage?.id !== "limitReached") return;
    void exitToSanctuary();
  }, [phase, prepareStorybookMessage?.id, exitToSanctuary]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!uid) {
        router.replace(routes.login);
        return;
      }
      const existing = await getProloguePart2Draft(uid);
      const next = existing ?? createEmptyProloguePart2Draft();
      if (!existing) await saveProloguePart2Draft(uid, next);
      if (cancelled) return;
      setDraft(next);
      setPhase(stepToPhase(next.currentStep));
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const persist = useCallback(
    async (patch: Partial<ProloguePart2Draft>, nextPhase?: Phase) => {
      if (!uid) return;
      const saved = await saveProloguePart2Draft(uid, patch);
      setDraft(saved);
      if (nextPhase) setPhase(nextPhase);
    },
    [uid],
  );

  const resolveKeeperName = useCallback(() => {
    return draft?.keeperName?.trim() || firebaseAuth.currentUser?.displayName?.trim() || "Keeper";
  }, [draft?.keeperName]);

  const runPrepare = useCallback(async () => {
    if (!uid || !draft) return;
    // Already sealed elsewhere — do not retry create into CHILD_LIMIT_REACHED.
    if (activeChild.ready && activeChild.childrenSummary.length > 0) {
      await exitToSanctuary();
      return;
    }
    if (!draft.childNickname || !draft.childBirthDate || !draft.archetype) {
      setPrepareStorybookMessage(mapPrepareErrorToStorybookMessage(new Error("client_validation")));
      setPhase("prepare_error");
      return;
    }
    setPhase("prepare");
    setPrepareStorybookMessage(null);
    try {
      await callCreateChildProfile({
        draftId: draft.draftId,
        name: draft.childNickname,
        dob: draft.childBirthDate,
        companionId: "pond_fish",
        interests: [],
        archetype: draft.archetype,
        onboardingComplete: true,
        quickCheckTally: draft.quickCheckTally,
      });
      await persist({ currentStep: "sanctuary_intro" }, "sanctuary_intro");
    } catch (err) {
      if (isChildLimitReachedError(err)) {
        await exitToSanctuary();
        return;
      }
      setPrepareStorybookMessage(mapPrepareErrorToStorybookMessage(err));
      setPhase("prepare_error");
      await persist({ currentStep: "prepare" });
    }
  }, [uid, draft, persist, activeChild.ready, activeChild.childrenSummary.length, exitToSanctuary]);

  const prepareStartedRef = useRef(false);
  useEffect(() => {
    if (phase !== "prepare") {
      prepareStartedRef.current = false;
      return;
    }
    if (prepareStartedRef.current) return;
    prepareStartedRef.current = true;
    void runPrepare();
  }, [phase, runPrepare]);

  const progressVisible = progressIndex(phase) >= 0;
  const displayName = (draft?.displayArchetypeName ?? "Weather Child") as DisplayArchetypeName;
  const mapAxes = axesFromDisplayArchetype(displayName);

  if (phase === "loading" || !draft) {
    return <View style={styles.fill} />;
  }

  if (phase === "prepare") {
    return <SanctuaryPreparationStep status="loading" />;
  }

  // Limit-reached storybook lives on /child-profile-limit (add-child path only).
  // Network / unexpected prepare failures still show here with retry.
  if (phase === "prepare_error" && prepareStorybookMessage) {
    if (prepareStorybookMessage.id === "limitReached") {
      return <View style={styles.fill} />;
    }
    return (
      <SanctuaryPreparationStep
        status="error"
        message={prepareStorybookMessage}
        onPrimaryPress={() => {
          router.replace(routes.sanctuary);
        }}
        onRetry={() => {
          prepareStartedRef.current = false;
          setPhase("prepare");
        }}
      />
    );
  }

  if (phase === "quick_check") {
    return (
      <View style={styles.fill}>
        <DialogueOverlay
          sceneId="archetype_quick_check"
          onComplete={() => undefined}
          headerSlot={<OnboardingProgressCue stepIndex={3} visible />}
          renderSpecialUi={({ uiType, advance }) => {
            if (uiType !== "quick_check") return null;
            return (
              <ArchetypeQuickCheck
                initialAnswers={draft.quickCheckTally}
                onComplete={(answers) => {
                  const scored = scoreQuickCheckTally(answers);
                  void persist(
                    {
                      quickCheckTally: answers,
                      archetype: scored.primaryArchetype,
                      displayArchetypeName: scored.displayArchetypeName,
                      tieOccurred: scored.tieOccurred,
                      currentStep: "result",
                    },
                    "result",
                  );
                  advance();
                }}
              />
            );
          }}
        />
      </View>
    );
  }

  if (phase === "result") {
    return (
      <View style={styles.fill}>
        <StoryBackground source={STORY_BACKGROUNDS.sanctuary} />
        <View style={[styles.resultScreen, { paddingTop: insets.top + 8 }]}>
          <OnboardingProgressCue stepIndex={3} visible />
          <View style={styles.resultPlateWrap}>
            <ArchetypeResultFlipCard
              displayName={displayName}
              axisA={mapAxes.axisA}
              axisB={mapAxes.axisB}
              showAgeBandNote={false}
              showDisclaimer={showDisclaimer}
              disclaimer={ARCHETYPE_DISCLAIMER}
              ctaLabel="Turn the page →"
              ctaAccessibilityLabel="Turn the page"
              onContinue={() => {
                setShowDisclaimer(false);
                void persist({ currentStep: "prepare" }, "prepare");
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  const sceneId =
    phase === "name"
      ? "name_prompt"
      : phase === "name_confirm"
        ? "name_confirmation"
        : phase === "nickname"
          ? "child_nickname_prompt"
          : phase === "birthdate"
            ? "birthdate_prompt"
            : "sanctuary_pond_intro";

  return (
    <View style={styles.fill}>
      <DialogueOverlay
        sceneId={sceneId}
        dynamicFieldValues={{
          Name: resolveKeeperName(),
          displayArchetypeName: displayName,
        }}
        headerSlot={
          <OnboardingProgressCue stepIndex={progressIndex(phase)} visible={progressVisible} />
        }
        onUiSubmit={async ({ uiType, value }) => {
          if (uiType === "text_input" && phase === "name") {
            const name = String(value).trim();
            const user = firebaseAuth.currentUser;
            if (user) {
              try {
                await updateProfile(user, { displayName: name });
              } catch {
                /* Auth update is best-effort; draft still persists. */
              }
            }
            await persist({ keeperName: name, currentStep: "nickname" });
            setPhase("name_confirm");
            return;
          }
          if (uiType === "text_input" && phase === "nickname") {
            await persist(
              { childNickname: String(value).trim(), currentStep: "birthdate" },
              "birthdate",
            );
          }
        }}
        renderSpecialUi={({ uiType }) => {
          if (uiType === "birthdate" && phase === "birthdate") {
            return (
              <BirthdateUi
                onSubmit={(isoDate) => {
                  void persist(
                    { childBirthDate: isoDate, currentStep: "quick_check" },
                    "quick_check",
                  );
                }}
              />
            );
          }
          return null;
        }}
        onComplete={() => {
          if (phase === "name_confirm") {
            void persist({ currentStep: "nickname" }, "nickname");
            return;
          }
          if (phase === "name") {
            // Scene may complete after input line already advanced — no-op.
            return;
          }
          if (phase === "sanctuary_intro") {
            void (async () => {
              if (uid) await clearProloguePart2Draft(uid);
              router.replace(routes.sanctuary);
            })();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  resultScreen: {
    flex: 1,
  },
  resultPlateWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
});
