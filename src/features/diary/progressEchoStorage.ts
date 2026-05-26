import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ProgressEcho, SelfCheckResponses } from "@/src/features/diary/types";

const STORAGE_KEY = "diary:progress-echo";

export async function saveProgressEcho(
  lessonId: string,
  responses: SelfCheckResponses,
): Promise<void> {
  const hasIntention =
    responses.intentionTrigger.trim().length > 0 && responses.intentionAction.trim().length > 0;
  const hasMoment = responses.momentWhat !== null && responses.momentFeeling !== null;

  if (!hasIntention && !hasMoment) return;

  const echo: ProgressEcho = {
    lessonId,
    intentionTrigger: responses.intentionTrigger.trim(),
    intentionAction: responses.intentionAction.trim(),
    momentWhat: responses.momentWhat,
    momentFeeling: responses.momentFeeling,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(echo));
}

export async function loadProgressEcho(): Promise<ProgressEcho | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ProgressEcho;
  } catch {
    return null;
  }
}

export function formatProgressEcho(echo: ProgressEcho): string | null {
  if (echo.intentionAction) {
    return `Last week, you wanted to try ${echo.intentionAction}.`;
  }
  if (echo.momentFeeling && echo.momentWhat) {
    const momentLabel = echo.momentWhat === "transition" ? "transitions" : echo.momentWhat;
    return `You noticed ${echo.momentFeeling} showing up during ${momentLabel}.`;
  }
  return null;
}
