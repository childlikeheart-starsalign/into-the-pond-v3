import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  CHILD_COMPANION_IDS,
  CHILD_INTEREST_ALLOWLIST,
  type ChildCompanionId,
  type ChildInterestId,
} from "@/shared/childProfile/tierAccess";
import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import {
  chapterStepFromIndex,
  formatChapterLabel,
} from "@/src/components/journal/formatChapterNumber";
import { JournalMargin } from "@/src/components/journal/JournalMargin";
import { childProfileColors } from "@/src/constants/childProfileTheme";
import { fontFamilies, spacing } from "@/src/constants/theme";
import { callCreateChildProfile } from "@/src/features/childProfile/createChildProfileClient";
import { isChildLimitReachedError } from "@/src/features/childProfile/childLimitReached";
import {
  childProfileFlowReducer,
  createInitialFlowState,
  type ChildProfileFlowState,
} from "@/src/features/childProfile/flowReducer";
import { routes } from "@/src/navigation/routes";
import {
  trackCreateChildProfileCompleted,
  trackCreateChildProfileEntry,
} from "@/src/services/analytics/createChildProfileFunnel";
import { playProfilePlanted } from "@/src/services/audio/authSounds";
import { playPaperClick } from "@/src/services/audio/playPaperClick";
import { Sentry } from "@/src/services/sentry/init";

const SEAL_MIN_DWELL_MS = 200;
const SEAL_HOLD_MS = 175;

const COMPANION_LABELS: Record<ChildCompanionId, string> = {
  blackbird: "Blackbird",
  goldfinch: "Goldfinch",
  butterfly: "Butterfly",
  pond_fish: "Pond fish",
};

function progressFor(step: ChildProfileFlowState["step"]): number {
  if (step === "name") return 1;
  if (step === "age") return 2;
  if (step === "companion") return 3;
  if (step === "interests") return 4;
  return 0;
}

function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
  } catch {
    return "en-US";
  }
}

export function CreateChildProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entry?: string }>();
  const entry = params.entry === "add_child" ? "add_child" : "first_run";

  // draftId generated once at mount for this flow instance — not on Review re-entry.
  const [state, dispatch] = useReducer(childProfileFlowReducer, entry, createInitialFlowState);
  const [nameInput, setNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [companionIndex, setCompanionIndex] = useState(0);
  const sealingRef = useRef(false);
  const entryTrackedRef = useRef(false);

  useEffect(() => {
    if (entryTrackedRef.current) return;
    entryTrackedRef.current = true;
    trackCreateChildProfileEntry({ entry });
  }, [entry]);

  useEffect(() => {
    if (state.step !== "sealing") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [state.step]);

  useEffect(() => {
    if (state.step !== "confirmed") return;
    const t = setTimeout(() => {
      // first_run → Day 1 narrative; add_child → sanctuary (plan §6).
      router.replace(entry === "add_child" ? routes.sanctuary : routes.narrativeOnboarding);
    }, 450);
    return () => clearTimeout(t);
  }, [state.step, router, entry]);

  const performSeal = useCallback(async () => {
    if (state.step !== "reviewing" || sealingRef.current) return;
    sealingRef.current = true;
    const { draftId, draft } = state;
    dispatch({ type: "SEAL", startedAt: Date.now() });
    await new Promise((r) => setTimeout(r, SEAL_HOLD_MS));
    const start = Date.now();
    try {
      const result = await callCreateChildProfile({
        draftId,
        name: draft.name,
        dob: draft.dob,
        companionId: draft.companionId,
        interests: draft.interests,
      });
      const elapsed = Date.now() - start;
      await new Promise((r) => setTimeout(r, Math.max(0, SEAL_MIN_DWELL_MS - elapsed)));
      trackCreateChildProfileCompleted({
        entry,
        childId: result.childId,
        childOrder: result.childOrder,
      });
      void playProfilePlanted();
      dispatch({
        type: "SEAL_SUCCESS",
        childId: result.childId,
        childOrder: result.childOrder,
      });
    } catch (err) {
      if (isChildLimitReachedError(err)) {
        dispatch({ type: "SEAL_LIMIT_REACHED" });
      } else {
        Sentry.captureException(err, {
          tags: { area: "profile", flow: "create_child_profile" },
        });
        dispatch({ type: "SEAL_FAILURE", reason: "network" });
      }
    } finally {
      sealingRef.current = false;
    }
  }, [state, entry]);

  const rings = progressFor(state.step);
  const chapterStep = chapterStepFromIndex(rings);
  const chapterLabel = chapterStep ? formatChapterLabel(chapterStep, deviceLocale()) : null;

  return (
    <View style={styles.root}>
      <Portrait916Frame>
        <View style={[styles.page, chapterLabel ? styles.pageWithChapter : null]}>
          {chapterLabel ? (
            <JournalMargin
              position="left"
              content={chapterLabel}
              variant="chapter"
              accessibilityGrouping="leading"
            />
          ) : null}

          {rings > 0 ? (
            <View style={styles.rings} importantForAccessibility="no-hide-descendants">
              {[1, 2, 3, 4].map((n) => (
                <View key={n} style={[styles.ring, n <= rings ? styles.ringOn : styles.ringOff]} />
              ))}
            </View>
          ) : null}

          {state.step === "name" ? (
            <Step
              prompt="What shall we call them in the journal?"
              onContinue={() => {
                if (!nameInput.trim()) return;
                dispatch({ type: "ADVANCE", patch: { name: nameInput.trim() } });
              }}
            >
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Their name"
                placeholderTextColor={childProfileColors.inkMuted}
                style={styles.input}
                autoFocus
                maxLength={48}
                accessibilityLabel="Child name"
              />
            </Step>
          ) : null}

          {state.step === "age" ? (
            <Step
              prompt="How many seasons has your little one seen?"
              onBack={() => dispatch({ type: "BACK" })}
              onContinue={() => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dobInput.trim())) return;
                dispatch({ type: "ADVANCE", patch: { dob: dobInput.trim() } });
              }}
            >
              <Text style={styles.helper}>Birthday (YYYY-MM-DD)</Text>
              <TextInput
                value={dobInput}
                onChangeText={setDobInput}
                placeholder="2018-06-01"
                placeholderTextColor={childProfileColors.inkMuted}
                style={styles.input}
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                accessibilityLabel="Child birthday"
              />
            </Step>
          ) : null}

          {state.step === "companion" ? (
            <Step
              prompt="Does this one feel like yours?"
              onBack={entry === "first_run" ? () => dispatch({ type: "BACK" }) : null}
              onContinue={() => {
                dispatch({
                  type: "ADVANCE",
                  patch: { companionId: CHILD_COMPANION_IDS[companionIndex] },
                });
              }}
              continueLabel="Choose"
            >
              <View style={styles.companionCard}>
                <Text style={styles.companionName}>
                  {COMPANION_LABELS[CHILD_COMPANION_IDS[companionIndex]]}
                </Text>
                <Text style={styles.helper}>Placeholder art — serial browse</Text>
                <View style={styles.companionNav}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous companion"
                    onPress={() => {
                      playPaperClick();
                      setCompanionIndex(
                        (companionIndex + CHILD_COMPANION_IDS.length - 1) %
                          CHILD_COMPANION_IDS.length,
                      );
                    }}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Prev</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next companion"
                    onPress={() => {
                      playPaperClick();
                      setCompanionIndex((companionIndex + 1) % CHILD_COMPANION_IDS.length);
                    }}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Next</Text>
                  </Pressable>
                </View>
              </View>
            </Step>
          ) : null}

          {state.step === "interests" ? (
            <Step
              prompt="We'll discover this together."
              onBack={() => dispatch({ type: "BACK" })}
              onContinue={() => dispatch({ type: "ENTER_REVIEW" })}
              onSkip={() => {
                dispatch({ type: "PATCH", patch: { interests: [] } });
                dispatch({ type: "ENTER_REVIEW" });
              }}
              skipLabel="Skip"
            >
              <View style={styles.chips}>
                {CHILD_INTEREST_ALLOWLIST.map((id) => {
                  const isOn = state.draft.interests.includes(id);
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isOn }}
                      onPress={() => {
                        playPaperClick();
                        const interests: ChildInterestId[] = isOn
                          ? state.draft.interests.filter((x) => x !== id)
                          : state.draft.interests.length >= 3
                            ? state.draft.interests
                            : [...state.draft.interests, id];
                        dispatch({ type: "PATCH", patch: { interests } });
                      }}
                      style={[styles.chip, isOn && styles.chipSelected]}
                    >
                      <Text style={styles.chipText}>{id}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Step>
          ) : null}

          {state.step === "reviewing" ? (
            <View style={styles.review}>
              <Text style={styles.scriptName}>{state.draft.name}</Text>
              <Text style={styles.helper}>
                {COMPANION_LABELS[state.draft.companionId]} · {state.draft.dob}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Press the wax seal"
                onPress={() => {
                  playPaperClick();
                  void performSeal();
                }}
                style={styles.seal}
              >
                <Text style={styles.sealText}>Seal</Text>
              </Pressable>
              <Pressable onPress={() => dispatch({ type: "BACK" })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
            </View>
          ) : null}

          {state.step === "sealing" ? (
            <View style={styles.review}>
              <Text style={styles.scriptName}>{state.draft.name}</Text>
              <View style={[styles.seal, styles.sealPressed]}>
                <Text style={styles.sealText}>Sealing…</Text>
              </View>
              <Text style={styles.helper}>Notice a moment</Text>
            </View>
          ) : null}

          {state.step === "error" ? (
            <View style={styles.review}>
              <Text style={styles.prompt}>
                The page didn&apos;t quite catch the light — let&apos;s try again.
              </Text>
              <Pressable
                onPress={() => dispatch({ type: "RETRY" })}
                style={styles.primaryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {state.step === "limit_reached" ? (
            <View style={styles.review}>
              <Text style={styles.prompt}>
                {/* DRAFT — not Pillar 5 retry framing; cap is real. */}
                [draft] All the little stories that fit here already have their place. Your notes
                are kept — come back from the Gate if a path opens.
              </Text>
              <Pressable
                onPress={() => router.replace(routes.gate)}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Return to Gate"
              >
                <Text style={styles.primaryBtnText}>Back to the Gate</Text>
              </Pressable>
            </View>
          ) : null}

          {state.step === "confirmed" ? (
            <View style={[styles.review, { backgroundColor: childProfileColors.cream }]}>
              <Text style={styles.helper}>Opening the next page…</Text>
            </View>
          ) : null}
        </View>
      </Portrait916Frame>
    </View>
  );
}

function Step({
  prompt,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  skipLabel,
  onSkip,
}: {
  prompt: string;
  children: React.ReactNode;
  onBack?: (() => void) | null;
  onContinue: () => void;
  continueLabel?: string;
  skipLabel?: string;
  onSkip?: () => void;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.body}>{children}</View>
      <View style={styles.actions}>
        {onBack ? (
          <Pressable
            onPress={() => {
              playPaperClick();
              onBack();
            }}
            style={styles.secondaryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
        {onSkip ? (
          <Pressable
            onPress={() => {
              playPaperClick();
              onSkip();
            }}
            style={styles.secondaryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>{skipLabel ?? "Skip"}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            playPaperClick();
            onContinue();
          }}
          style={styles.primaryBtn}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{continueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: childProfileColors.parchment },
  page: { flex: 1, paddingHorizontal: spacing.section, paddingTop: spacing.section },
  /** Extra left inset so rotated chapter label clears the back affordance on SE. */
  pageWithChapter: {
    position: "relative",
    paddingLeft: spacing.section + 28,
  },
  rings: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 24 },
  ring: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  ringOn: {
    borderColor: childProfileColors.pondTeal,
    backgroundColor: childProfileColors.pondTeal,
  },
  ringOff: { borderColor: childProfileColors.pondTeal, backgroundColor: "transparent" },
  step: { flex: 1 },
  prompt: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 22,
    lineHeight: 34,
    letterSpacing: 0.44,
    color: childProfileColors.deepInk,
    marginBottom: spacing.inner,
  },
  helper: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: childProfileColors.inkMuted,
    marginBottom: 8,
    textAlign: "center",
  },
  body: { flex: 1, justifyContent: "center" },
  input: {
    backgroundColor: childProfileColors.cream,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: fontFamilies.body,
    fontSize: 18,
    color: childProfileColors.deepInk,
  },
  actions: { flexDirection: "row", gap: 8, paddingBottom: 28, alignItems: "center" },
  primaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: childProfileColors.bark,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: fontFamilies.bodySemi,
    color: childProfileColors.cream,
    fontSize: 16,
  },
  secondaryBtn: {
    minHeight: 52,
    minWidth: 72,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: fontFamilies.bodyMedium,
    color: childProfileColors.deepInk,
    fontSize: 16,
  },
  companionCard: {
    backgroundColor: childProfileColors.cream,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  companionName: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    color: childProfileColors.deepInk,
    letterSpacing: -0.56,
  },
  companionNav: { flexDirection: "row", gap: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: childProfileColors.marigold,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    shadowColor: childProfileColors.marigold,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  chipText: {
    fontFamily: fontFamilies.bodyMedium,
    color: childProfileColors.deepInk,
    textTransform: "capitalize",
  },
  review: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  scriptName: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 44,
    color: childProfileColors.deepInk,
    textAlign: "center",
  },
  seal: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: childProfileColors.blossomPink,
    alignItems: "center",
    justifyContent: "center",
  },
  sealPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  sealText: {
    fontFamily: fontFamilies.bodySemi,
    color: childProfileColors.cream,
    fontSize: 18,
  },
});
