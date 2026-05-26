import { useNavigation, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentReference,
  type DocumentData,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ExportBottomSheet } from "@/components/ExportBottomSheet";
import { DiaryRitualFlow } from "@/src/components/diary/DiaryRitualFlow";
import { DiaryPromptMultiselect } from "@/src/components/diary/DiaryPromptMultiselect";
import { DiaryPromptSlider } from "@/src/components/diary/DiaryPromptSlider";
import { DiaryPromptText } from "@/src/components/diary/DiaryPromptText";
import { colors, fontFamilies, layout, spacing } from "@/src/constants/theme";
import { LESSONS_BY_MODULE } from "@/src/features/classroom/lessonCatalog";
import { saveProgressEcho } from "@/src/features/diary/progressEchoStorage";
import { getSelfCheckRitual } from "@/src/features/diary/selfCheckCatalog";
import type { SelfCheckResponses, SelfCheckRitual } from "@/src/features/diary/types";
import { addReflectionBloom } from "@/src/features/sanctuary/cultivationStorage";
import { clearRitualDraft } from "@/src/features/diary/ritualDraftStorage";
import {
  refreshSanctuaryCultivation,
  setPendingArrivalBloomId,
} from "@/src/state/sanctuaryCultivation";
import { routes } from "@/src/navigation/routes";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import type { ExportEntryData } from "@/utils/exportHelpers";

type PromptType = "text" | "slider" | "multiselect";

type DiaryPrompt = {
  id: string;
  question: string;
  type: PromptType;
  options?: string[];
  sliderMin?: number;
  sliderMax?: number;
};

type PromptResponse = string | number | string[];
type ResponsesByPrompt = Record<string, PromptResponse>;
type TouchedByPrompt = Record<string, boolean>;

type LoadedLesson = {
  id: string;
  title: string;
  prompts: DiaryPrompt[];
  ref: DocumentReference<DocumentData> | null;
};

type DiaryEntryScreenProps = {
  lessonId: string;
};

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function isPromptType(value: unknown): value is PromptType {
  return value === "text" || value === "slider" || value === "multiselect";
}

function normalizePrompts(input: unknown): DiaryPrompt[] {
  if (!Array.isArray(input)) return [];

  return input.reduce<DiaryPrompt[]>((prompts, item, index) => {
    if (typeof item === "string" && item.trim()) {
      prompts.push({ id: `prompt-${index + 1}`, question: item, type: "text" });
      return prompts;
    }

    if (!item || typeof item !== "object") return prompts;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : `prompt-${index + 1}`;
    const question = typeof raw.question === "string" ? raw.question.trim() : "";
    const type = isPromptType(raw.type) ? raw.type : null;

    if (!question || !type) return prompts;

    const min =
      typeof raw.sliderMin === "number" ? raw.sliderMin : typeof raw.min === "number" ? raw.min : 1;
    const max =
      typeof raw.sliderMax === "number" ? raw.sliderMax : typeof raw.max === "number" ? raw.max : 5;

    prompts.push({
      id,
      question,
      type,
      options: Array.isArray(raw.options)
        ? raw.options.filter((option): option is string => typeof option === "string")
        : undefined,
      sliderMin: min,
      sliderMax: Math.max(min, max),
    });
    return prompts;
  }, []);
}

function defaultResponseFor(prompt: DiaryPrompt): PromptResponse {
  if (prompt.type === "slider") {
    const min = prompt.sliderMin ?? 1;
    const max = prompt.sliderMax ?? 5;
    return Math.round((min + max) / 2);
  }
  if (prompt.type === "multiselect") return [];
  return "";
}

function buildInitialResponses(prompts: DiaryPrompt[]) {
  return prompts.reduce<ResponsesByPrompt>((acc, prompt) => {
    acc[prompt.id] = defaultResponseFor(prompt);
    return acc;
  }, {});
}

function isResponseValid(prompt: DiaryPrompt, response: PromptResponse | undefined) {
  if (prompt.type === "text") return typeof response === "string" && response.trim().length > 0;
  if (prompt.type === "slider") return typeof response === "number";
  if (prompt.type === "multiselect") return Array.isArray(response) && response.length >= 1;
  return false;
}

const LOCAL_FALLBACK_PROMPTS: DiaryPrompt[] = [
  {
    id: "reflection",
    question: "What stood out to you from this lesson?",
    type: "text",
  },
  {
    id: "feeling",
    question: "How ready do you feel to practice this today?",
    type: "slider",
    sliderMin: 1,
    sliderMax: 5,
  },
  {
    id: "next-step",
    question: "What do you want to carry forward?",
    type: "multiselect",
    options: ["Calm", "Patience", "Connection", "Confidence"],
  },
];

function getLocalLessonFallback(lessonId: string): LoadedLesson {
  const localLesson = Object.values(LESSONS_BY_MODULE)
    .flat()
    .find((item) => item.id === lessonId);

  return {
    id: lessonId,
    title: localLesson?.title ?? "Lesson reflection",
    prompts: LOCAL_FALLBACK_PROMPTS,
    ref: null,
  };
}

function ritualResponsesToExport(
  ritual: SelfCheckRitual,
  responses: SelfCheckResponses,
): ExportEntryData["prompts"] {
  return [
    {
      question: ritual.reframeRecall.prompt,
      response: responses.reframeAssumption ?? "",
    },
    {
      question: ritual.momentReplay.whatHappened.prompt,
      response: responses.momentWhat ?? "",
    },
    {
      question: ritual.momentReplay.bodyFeeling.prompt,
      response: responses.momentFeeling ?? "",
    },
    {
      question: ritual.momentReplay.pause.prompt,
      response: responses.momentPause ?? "",
    },
    {
      question: ritual.momentReplay.different.prompt,
      response: responses.momentDifferent,
    },
    {
      question: ritual.supportNeeded.prompt,
      response: [
        ...responses.supportNeeds,
        ...(responses.supportDetail.trim() ? [responses.supportDetail.trim()] : []),
      ],
    },
    {
      question: ritual.intention.prompt,
      response: `Next time I notice ${responses.intentionTrigger}, I want to try ${responses.intentionAction}.`,
    },
  ];
}

async function saveRitualEntryLocal(
  ritual: SelfCheckRitual,
  lesson: LoadedLesson,
  responses: SelfCheckResponses,
) {
  await saveProgressEcho(lesson.id, responses);

  const bloom = await addReflectionBloom(lesson.id, ritual.id);
  setPendingArrivalBloomId(bloom.id);
  await refreshSanctuaryCultivation();
  await clearRitualDraft(lesson.id);
}

function saveRitualEntryCloud(
  ritual: SelfCheckRitual,
  lesson: LoadedLesson,
  responses: SelfCheckResponses,
) {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;

  const prompts = ritualResponsesToExport(ritual, responses);
  const entryRef = doc(collection(firestore, "diaryEntries"));

  const entryWrite = setDoc(entryRef, {
    lessonId: lesson.id,
    userId: uid,
    ritualId: ritual.id,
    prompts: prompts.map((item, index) => ({
      promptId: `ritual-${index + 1}`,
      question: item.question,
      response: item.response,
    })),
    savedAt: serverTimestamp(),
  });

  const followUpWrites: Promise<void>[] = [
    setDoc(
      doc(firestore, "users", uid, "lessonProgress", lesson.id),
      { diaryEntryId: entryRef.id },
      { merge: true },
    ),
  ];

  if (lesson.ref) {
    followUpWrites.push(setDoc(lesson.ref, { diaryEntryId: entryRef.id }, { merge: true }));
  }

  void Promise.all([entryWrite, ...followUpWrites]).catch((error) => {
    console.warn("[DiaryEntry] failed to save ritual entry", error);
  });
}

async function fetchLesson(lessonId: string): Promise<LoadedLesson | null> {
  if (!lessonId) return getLocalLessonFallback("unknown");

  const directRef = doc(firestore, "lessons", lessonId);
  let directSnap;

  try {
    directSnap = await getDoc(directRef);
  } catch (error) {
    console.warn("[DiaryEntry] falling back to local prompts", error);
    return getLocalLessonFallback(lessonId);
  }

  if (directSnap.exists()) {
    const data = directSnap.data();
    return {
      id: lessonId,
      title: typeof data.title === "string" ? data.title : "Lesson reflection",
      prompts: normalizePrompts(data.diaryPrompts).length
        ? normalizePrompts(data.diaryPrompts)
        : LOCAL_FALLBACK_PROMPTS,
      ref: directRef,
    };
  }

  let fallback;
  try {
    fallback = await getDocs(
      query(collection(firestore, "lessons"), where("lessonId", "==", lessonId), limit(1)),
    );
  } catch (error) {
    console.warn("[DiaryEntry] falling back to local prompts", error);
    return getLocalLessonFallback(lessonId);
  }
  const first = fallback.docs[0];
  if (!first) return getLocalLessonFallback(lessonId);

  const data = first.data();
  const prompts = normalizePrompts(data.diaryPrompts);
  return {
    id: lessonId,
    title: typeof data.title === "string" ? data.title : "Lesson reflection",
    prompts: prompts.length ? prompts : LOCAL_FALLBACK_PROMPTS,
    ref: first.ref,
  };
}

export function DiaryEntryScreen({ lessonId }: DiaryEntryScreenProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const allowLeaveRef = useRef(false);
  const ritual = useMemo(() => getSelfCheckRitual(lessonId), [lessonId]);
  const [lesson, setLesson] = useState<LoadedLesson | null>(null);
  const [responses, setResponses] = useState<ResponsesByPrompt>({});
  const [touched, setTouched] = useState<TouchedByPrompt>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDiscardSheet, setShowDiscardSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [exportEntryData, setExportEntryData] = useState<ExportEntryData | null>(null);
  const [ritualCompleting, setRitualCompleting] = useState(false);

  useEffect(() => {
    setRitualCompleting(false);
  }, [lessonId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);

    void fetchLesson(lessonId)
      .then((loaded) => {
        if (!alive) return;
        if (!loaded) {
          setLoadError("Lesson not found.");
          return;
        }
        setLesson(loaded);
        setResponses(buildInitialResponses(loaded.prompts));
      })
      .catch(() => {
        if (alive) setLoadError("Unable to load this reflection.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [lessonId]);

  const hasUnsavedChanges = useMemo(() => {
    if (ritual || !lesson || saved) return false;
    return lesson.prompts.some((prompt) => {
      const response = responses[prompt.id];
      if (prompt.type === "text") return typeof response === "string" && response.length > 0;
      if (prompt.type === "multiselect") return Array.isArray(response) && response.length > 0;
      return false;
    });
  }, [ritual, lesson, responses, saved]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (allowLeaveRef.current || !hasUnsavedChanges) return;
      event.preventDefault();
      setShowDiscardSheet(true);
    });

    return unsubscribe;
  }, [hasUnsavedChanges, navigation]);

  const isValid = useMemo(() => {
    if (!lesson || lesson.prompts.length === 0) return false;
    return lesson.prompts.every((prompt) => isResponseValid(prompt, responses[prompt.id]));
  }, [lesson, responses]);

  const updateResponse = useCallback((promptId: string, response: PromptResponse) => {
    setResponses((prev) => ({ ...prev, [promptId]: response }));
  }, []);

  const markTouched = useCallback((promptId: string) => {
    setTouched((prev) => ({ ...prev, [promptId]: true }));
  }, []);

  const handleRitualComplete = useCallback(
    async (responses: SelfCheckResponses) => {
      if (!ritual || !lesson || ritualCompleting) return;

      setRitualCompleting(true);
      try {
        await saveRitualEntryLocal(ritual, lesson, responses);
        saveRitualEntryCloud(ritual, lesson, responses);
      } catch (error) {
        console.warn("[DiaryEntry] failed to save ritual locally", error);
      } finally {
        setSaved(true);
        allowLeaveRef.current = true;
        router.replace(routes.sanctuary);
        setRitualCompleting(false);
      }
    },
    [lesson, ritual, ritualCompleting, router],
  );

  const handleRitualExit = useCallback(() => {
    router.back();
  }, [router]);

  const handleSave = useCallback(() => {
    if (!lesson || !isValid || saving) return;
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    Keyboard.dismiss();
    setSaving(true);

    try {
      const entryRef = doc(collection(firestore, "diaryEntries"));
      const entryWrite = setDoc(entryRef, {
        lessonId: lesson.id,
        userId: uid,
        prompts: lesson.prompts.map((prompt) => ({
          promptId: prompt.id,
          question: prompt.question,
          response: responses[prompt.id],
        })),
        savedAt: serverTimestamp(),
      });

      const followUpWrites: Promise<void>[] = [
        setDoc(
          doc(firestore, "users", uid, "lessonProgress", lesson.id),
          {
            diaryEntryId: entryRef.id,
          },
          { merge: true },
        ),
      ];

      if (lesson.ref) {
        followUpWrites.push(
          setDoc(
            lesson.ref,
            {
              diaryEntryId: entryRef.id,
            },
            { merge: true },
          ),
        );
      }

      void Promise.all([entryWrite, ...followUpWrites]).catch((error) => {
        console.warn("[DiaryEntry] failed to save entry", error);
      });

      void addReflectionBloom(lesson.id, `diary-${lesson.id}`)
        .then((bloom) => {
          setPendingArrivalBloomId(bloom.id);
          return refreshSanctuaryCultivation();
        })
        .catch((error) => {
          console.warn("[DiaryEntry] failed to record sanctuary bloom", error);
        });
    } catch (error) {
      console.warn("[DiaryEntry] failed to queue entry save", error);
    }

    setExportEntryData({
      diaryEntryId: lesson.id,
      lessonTitle: lesson.title,
      date: todayLabel(),
      prompts: lesson.prompts.map((prompt) => ({
        question: prompt.question,
        response: responses[prompt.id],
      })),
    });
    setSaved(true);
    setShowExportSheet(true);
    setSaving(false);
  }, [isValid, lesson, responses, saving]);

  const navigateToLessonComplete = useCallback(() => {
    if (!lesson) return;
    setShowExportSheet(false);
    allowLeaveRef.current = true;
    router.replace({
      pathname: "/lesson-complete",
      params: { lessonTitle: lesson.title },
    });
  }, [lesson, router]);

  const handleExportNotNow = useCallback(() => {
    navigateToLessonComplete();
  }, [navigateToLessonComplete]);

  const discardAndLeave = useCallback(() => {
    setResponses({});
    setTouched({});
    setShowDiscardSheet(false);
    allowLeaveRef.current = true;
    router.back();
  }, [router]);

  const renderPrompt = (prompt: DiaryPrompt, index: number) => {
    const response = responses[prompt.id];
    const key = `${prompt.id}-${index}`;

    if (prompt.type === "slider") {
      return (
        <DiaryPromptSlider
          key={key}
          question={prompt.question}
          min={prompt.sliderMin ?? 1}
          max={prompt.sliderMax ?? 5}
          value={typeof response === "number" ? response : Number(defaultResponseFor(prompt))}
          onChange={(value) => updateResponse(prompt.id, value)}
        />
      );
    }

    if (prompt.type === "multiselect") {
      return (
        <DiaryPromptMultiselect
          key={key}
          question={prompt.question}
          options={prompt.options ?? []}
          selected={Array.isArray(response) ? response : []}
          onChange={(value) => updateResponse(prompt.id, value)}
        />
      );
    }

    const textValue = typeof response === "string" ? response : "";
    const showError = touched[prompt.id] && textValue.trim().length === 0;
    return (
      <DiaryPromptText
        key={key}
        question={prompt.question}
        value={textValue}
        error={showError ? "Please respond to continue" : undefined}
        onChange={(value) => updateResponse(prompt.id, value)}
        onBlur={() => markTouched(prompt.id)}
      />
    );
  };

  if (ritual && lesson && !loading && !loadError) {
    return (
      <DiaryRitualFlow
        ritual={ritual}
        onComplete={handleRitualComplete}
        onExit={handleRitualExit}
        completing={ritualCompleting}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading reflection...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>{loadError}</Text>
          <Pressable style={layout.btnPrimary} onPress={() => router.back()}>
            <Text style={layout.btnPrimaryText}>Go back</Text>
          </Pressable>
        </View>
      ) : lesson ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(132, insets.bottom + 116) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{lesson.title}</Text>
                <Text style={styles.date}>{todayLabel()}</Text>
              </View>
            </View>

            {lesson.prompts.length > 0 ? (
              lesson.prompts.map(renderPrompt)
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No reflection prompts found.</Text>
                <Text style={layout.subtitle}>This lesson does not have diary prompts yet.</Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(spacing.inner, insets.bottom) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save entry"
              accessibilityState={{ disabled: !isValid || saving }}
              style={[
                layout.btnPrimary,
                styles.saveButton,
                (!isValid || saving) && styles.disabled,
              ]}
              disabled={!isValid || saving}
              onPress={handleSave}
            >
              <Text style={layout.btnPrimaryText}>{saving ? "Saving..." : "Save entry"}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Modal visible={showDiscardSheet} transparent animationType="fade">
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Discard entry?</Text>
            <Text style={styles.sheetCopy}>
              Discarding will erase your response from this screen.
            </Text>
            <View style={styles.sheetActions}>
              <Pressable style={layout.btnSecondary} onPress={discardAndLeave}>
                <Text style={layout.btnSecondaryText}>Discard</Text>
              </Pressable>
              <Pressable style={layout.btnPrimary} onPress={() => setShowDiscardSheet(false)}>
                <Text style={layout.btnPrimaryText}>Keep editing</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ExportBottomSheet
        visible={showExportSheet}
        entryData={exportEntryData}
        onClose={navigateToLessonComplete}
        onNotNow={handleExportNotNow}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.inner,
    gap: spacing.section,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.inner,
    padding: spacing.inner,
  },
  loadingText: {
    fontFamily: fontFamilies.body,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.inner,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  emptyTitle: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 20,
    color: colors.textPrimary,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.inner,
    backgroundColor: "rgba(250, 247, 242, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    width: "100%",
  },
  disabled: {
    opacity: 0.45,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(31, 26, 23, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    margin: spacing.inner,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  sheetTitle: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 22,
    color: colors.textPrimary,
  },
  sheetCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sheetActions: {
    gap: spacing.tapGap,
  },
});
