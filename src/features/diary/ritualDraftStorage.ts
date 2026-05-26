import AsyncStorage from "@react-native-async-storage/async-storage";

import type { SelfCheckResponses } from "@/src/features/diary/types";

export type RitualDraft = {
  responses: SelfCheckResponses;
  stepIndex: number;
  savedAt: string;
};

const draftKey = (lessonId: string) => `diary:ritual-draft:${lessonId}`;

export function hasRitualProgress(responses: SelfCheckResponses): boolean {
  return (
    responses.reframeAssumption !== null ||
    responses.momentWhat !== null ||
    responses.momentFeeling !== null ||
    responses.momentPause !== null ||
    responses.momentDifferent.trim().length > 0 ||
    responses.supportNeeds.length > 0 ||
    responses.supportDetail.trim().length > 0 ||
    responses.intentionTrigger.trim().length > 0 ||
    responses.intentionAction.trim().length > 0
  );
}

export async function saveRitualDraft(
  lessonId: string,
  responses: SelfCheckResponses,
  stepIndex: number,
): Promise<void> {
  const draft: RitualDraft = {
    responses,
    stepIndex,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(draftKey(lessonId), JSON.stringify(draft));
}

export async function loadRitualDraft(lessonId: string): Promise<RitualDraft | null> {
  const raw = await AsyncStorage.getItem(draftKey(lessonId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RitualDraft> & { responses?: SelfCheckResponses };
    if (!parsed.responses) return null;

    return {
      responses: parsed.responses,
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function clearRitualDraft(lessonId: string): Promise<void> {
  await AsyncStorage.removeItem(draftKey(lessonId));
}
