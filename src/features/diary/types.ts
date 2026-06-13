export type SelfCheckRitualStep =
  | "arrival"
  | "reframe"
  | "rule"
  | "body-first"
  | "honest-inventory"
  | "the-gap"
  | "noticing"
  | "compassion"
  | "next-step"
  | "tiny-win"
  | "loop-break"
  | "script-voice"
  | "tone-reflect"
  | "obstacle-pair"
  | "moment-try"
  | "what-shifted"
  | "moment-what"
  | "moment-feeling"
  | "moment-pause"
  | "moment-different"
  | "support"
  | "intention"
  | "closure";

export type QuotedRecallBlock = {
  cardTitle: string;
  reframe: string;
  prompt: string;
  options: string[];
};

export type ReflectSectionText = {
  sectionLabel: string;
  prompt: string;
  helper?: string;
  placeholder?: string;
  maxLength?: number;
};

export type ReflectSectionSlider = {
  sectionLabel: string;
  prompt: string;
  helper?: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  followUpPrompt: string;
  followUpPlaceholder?: string;
  followUpOptional?: boolean;
};

export type ReflectSectionMultiselect = {
  sectionLabel: string;
  prompt: string;
  helper?: string;
  options: string[];
  detailPrompt?: string;
  detailPlaceholder?: string;
  exclusiveOption?: string;
};

export type ReflectSectionCompassion = {
  sectionLabel: string;
  storyPrompt: string;
  storyHelper?: string;
  storyPlaceholder?: string;
  truthPrompt: string;
  options: string[];
};

export type ReflectSectionSelect = {
  sectionLabel: string;
  prompt: string;
  options: string[];
};

export type ReflectSectionSelectText = {
  sectionLabel: string;
  prompt: string;
  helper?: string;
  options: string[];
  followUpPrompt: string;
  followUpPlaceholder?: string;
  secondFollowUpPrompt?: string;
  secondFollowUpPlaceholder?: string;
  embodimentPrompt?: string;
  embodimentPlaceholder?: string;
};

export type ReflectSectionDoubleText = {
  sectionLabel: string;
  prompt: string;
  helper?: string;
  firstLabel: string;
  firstPlaceholder?: string;
  secondPrompt: string;
  secondPlaceholder?: string;
  maxLength?: number;
};

export type ReflectLabeledField = {
  id: string;
  label: string;
  placeholder?: string;
  /** When true, field is not required to continue. */
  optional?: boolean;
};

export type ReflectSectionLabeledFields = {
  sectionLabel: string;
  intro: string;
  helper?: string;
  fields: ReflectLabeledField[];
  maxLength?: number;
};

export type SelfCheckRitual = {
  id: string;
  lessonId: string;
  title: string;
  steps: SelfCheckRitualStep[];
  arrival: {
    lines: string[];
    ctaLabel: string;
  };
  reframeRecall?: QuotedRecallBlock;
  ruleRecall?: QuotedRecallBlock;
  bodyFirst?: ReflectSectionText;
  honestInventory?: ReflectSectionSlider;
  theGap?: ReflectSectionMultiselect;
  noticing?: ReflectSectionText;
  compassion?: ReflectSectionCompassion;
  nextStep?: ReflectSectionText;
  tinyWin?: ReflectSectionSelect;
  loopBreak?: ReflectSectionSelectText;
  scriptVoice?: ReflectSectionSelectText;
  toneReflect?: ReflectSectionText;
  obstaclePair?: ReflectSectionDoubleText;
  momentTry?: ReflectSectionLabeledFields;
  whatShifted?: ReflectSectionMultiselect;
  momentReplay?: {
    intro: string;
    whatHappened: {
      prompt: string;
      options: string[];
    };
    bodyFeeling: {
      prompt: string;
      options: string[];
    };
    pause: {
      prompt: string;
      options: string[];
    };
    different: {
      prompt: string;
      maxLength: number;
      placeholder: string;
    };
  };
  supportNeeded?: {
    prompt: string;
    options: string[];
    detailPrompt: string;
    detailPlaceholder: string;
    exclusiveOption?: string;
    otherOption?: string;
  };
  intention?: {
    prompt: string;
    triggerPlaceholder: string;
    actionPlaceholder: string;
    actionSuggestions: string[];
    toolsLabel: string;
  };
  closure: {
    lines: string[];
    nextLessonLabel: string;
    ctaLabel: string;
  };
};

export type SelfCheckResponses = {
  reframeAssumption: string | null;
  ruleAssumption: string | null;
  bodyFirst: string;
  regulationLevel: number | null;
  regulationContext: string;
  gapMoves: string[];
  gapOther: string;
  noticingResponse: string;
  compassionStory: string;
  compassionTruth: string | null;
  smallestNextStep: string;
  tinyWin: string | null;
  loopBreakStep: string | null;
  loopBreakWhy: string;
  loopBreakAlreadyDone: string;
  scriptFeelsReal: string | null;
  scriptInMyVoice: string;
  scriptBodyResponse: string;
  toneVersusWords: string;
  biggestObstacle: string;
  obstacleWorkaround: string;
  trySituation: string;
  tryNotice: string;
  tryRegulate: string;
  tryConnectSupport: string;
  tryMinimumStep: string;
  trySelfCompassion: string;
  whatShiftedMarks: string[];
  whatShiftedTakeaway: string;
  momentWhat: string | null;
  momentFeeling: string | null;
  momentPause: string | null;
  momentDifferent: string;
  supportNeeds: string[];
  supportDetail: string;
  intentionTrigger: string;
  intentionAction: string;
};

export type ProgressEcho = {
  lessonId: string;
  intentionTrigger: string;
  intentionAction: string;
  momentWhat: string | null;
  momentFeeling: string | null;
  savedAt: string;
};
