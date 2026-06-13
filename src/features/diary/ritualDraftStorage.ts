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
    responses.ruleAssumption !== null ||
    responses.bodyFirst.trim().length > 0 ||
    responses.regulationLevel !== null ||
    responses.regulationContext.trim().length > 0 ||
    responses.gapMoves.length > 0 ||
    responses.gapOther.trim().length > 0 ||
    responses.noticingResponse.trim().length > 0 ||
    responses.compassionStory.trim().length > 0 ||
    responses.compassionTruth !== null ||
    responses.smallestNextStep.trim().length > 0 ||
    responses.tinyWin !== null ||
    responses.loopBreakStep !== null ||
    responses.loopBreakWhy.trim().length > 0 ||
    responses.loopBreakAlreadyDone.trim().length > 0 ||
    responses.scriptFeelsReal !== null ||
    responses.scriptInMyVoice.trim().length > 0 ||
    responses.scriptBodyResponse.trim().length > 0 ||
    responses.toneVersusWords.trim().length > 0 ||
    responses.biggestObstacle.trim().length > 0 ||
    responses.obstacleWorkaround.trim().length > 0 ||
    responses.trySituation.trim().length > 0 ||
    responses.tryNotice.trim().length > 0 ||
    responses.tryRegulate.trim().length > 0 ||
    responses.tryConnectSupport.trim().length > 0 ||
    responses.tryMinimumStep.trim().length > 0 ||
    responses.trySelfCompassion.trim().length > 0 ||
    responses.whatShiftedMarks.length > 0 ||
    responses.whatShiftedTakeaway.trim().length > 0 ||
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
      responses: { ...emptyRitualResponses(), ...parsed.responses },
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

function emptyRitualResponses(): SelfCheckResponses {
  return {
    reframeAssumption: null,
    ruleAssumption: null,
    bodyFirst: "",
    regulationLevel: null,
    regulationContext: "",
    gapMoves: [],
    gapOther: "",
    noticingResponse: "",
    compassionStory: "",
    compassionTruth: null,
    smallestNextStep: "",
    tinyWin: null,
    loopBreakStep: null,
    loopBreakWhy: "",
    loopBreakAlreadyDone: "",
    scriptFeelsReal: null,
    scriptInMyVoice: "",
    scriptBodyResponse: "",
    toneVersusWords: "",
    biggestObstacle: "",
    obstacleWorkaround: "",
    trySituation: "",
    tryNotice: "",
    tryRegulate: "",
    tryConnectSupport: "",
    tryMinimumStep: "",
    trySelfCompassion: "",
    whatShiftedMarks: [],
    whatShiftedTakeaway: "",
    momentWhat: null,
    momentFeeling: null,
    momentPause: null,
    momentDifferent: "",
    supportNeeds: [],
    supportDetail: "",
    intentionTrigger: "",
    intentionAction: "",
  };
}
