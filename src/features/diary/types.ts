export type SelfCheckRitualStep =
  | "arrival"
  | "reframe"
  | "moment-what"
  | "moment-feeling"
  | "moment-pause"
  | "moment-different"
  | "support"
  | "intention"
  | "closure";

export type SelfCheckRitual = {
  id: string;
  lessonId: string;
  title: string;
  arrival: {
    lines: string[];
    ctaLabel: string;
  };
  reframeRecall: {
    cardTitle: string;
    reframe: string;
    prompt: string;
    options: string[];
  };
  momentReplay: {
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
  supportNeeded: {
    prompt: string;
    options: string[];
    detailPrompt: string;
    detailPlaceholder: string;
  };
  intention: {
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
