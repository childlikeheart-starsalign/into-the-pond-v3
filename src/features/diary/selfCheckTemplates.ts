import type {
  ReflectSectionMultiselect,
  ReflectSectionSelectText,
  ReflectSectionSlider,
  SelfCheckRitual,
} from "@/src/features/diary/types";

/** 30-second grounding opener — line 1 of arrival. */
export const THERAPEUTIC_ARRIVAL_LINE_1 =
  "Before you answer anything: take one slow breath. You don't need to get this right.";

export const THERAPEUTIC_ARRIVAL_LINE_2 = "This entry is for you, not for the lesson.";

export const THERAPEUTIC_ARRIVAL_FOOTER =
  "Take 5–10 minutes, or pause and come back. All entries are private to you.";

export const STANDARD_GROUND: ReflectSectionSlider = {
  sectionLabel: "Ground",
  prompt: "How regulated do you feel right now?",
  helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
  min: 1,
  max: 10,
  minLabel: "Very flooded",
  maxLabel: "Steady and calm",
  followUpPrompt: "Optional: what is present in you at that number?",
  followUpPlaceholder: "Only if it helps to name it…",
  followUpOptional: true,
};

export const LOOP_BREAK_ALREADY_DONE: Pick<
  ReflectSectionSelectText,
  "secondFollowUpPrompt" | "secondFollowUpPlaceholder"
> = {
  secondFollowUpPrompt:
    "What part of this loop have you already done — even once, even imperfectly?",
  secondFollowUpPlaceholder: "Notice, Regulate, Connect, or Support — a small moment counts.",
};

export const SCRIPT_VOICE_EMBODIMENT: Pick<
  ReflectSectionSelectText,
  "embodimentPrompt" | "embodimentPlaceholder"
> = {
  embodimentPrompt:
    "Say your version out loud (or in your head). What happens in your chest, throat, or shoulders when you say it?",
  embodimentPlaceholder: "Comfort, performance, collapse — whatever you notice…",
};

export const STANDARD_TONE_REFLECT_HELPER =
  "Recall a time someone spoke calmly while you were upset — what did your body do? Now recall when the words were fine but the tone wasn't. What does your child seem to respond to more — your words or your tone?";

export const STANDARD_OBSTACLE_SECOND_PROMPT =
  "Given that obstacle, what is a good-enough version of the loop — not the lesson version, the version that might actually happen when you're tired? What would you want to forgive yourself for in advance?";

export const STANDARD_WHAT_SHIFTED_DETAIL: Pick<
  ReflectSectionMultiselect,
  "detailPrompt" | "detailPlaceholder" | "exclusiveOption"
> = {
  detailPrompt: "Optional — one sentence you want to remember this week:",
  detailPlaceholder: "A phrase to carry with you…",
  exclusiveOption: "Nothing shifted yet — I'm still taking it in",
};

export const STANDARD_WHAT_SHIFTED_OPTIONS = [
  "I see the loop more clearly than before",
  "I have words that feel closer to my voice",
  "I'm clearer on what will be hardest for me",
  "I feel more hopeful about trying once",
  "I feel overwhelmed — that's okay too",
  "Nothing shifted yet — I'm still taking it in",
] as const;

export const STANDARD_NEXT_STEP_HELPER =
  "You don't have to master this. One honest moment this week counts.";

const EARLY_RITUAL_IDS = new Set(["week-1-reflection", "lesson-1-2-reflection"]);

function usesTherapeuticArc(ritual: SelfCheckRitual): boolean {
  if (EARLY_RITUAL_IDS.has(ritual.id)) return false;
  return (
    ritual.steps.includes("honest-inventory") ||
    ritual.steps.includes("what-shifted") ||
    ritual.steps.includes("loop-break")
  );
}

function mergeArrival(ritual: SelfCheckRitual): SelfCheckRitual["arrival"] {
  const lines = [...ritual.arrival.lines];
  const hasBreathOpener = lines.some((line) => line.toLowerCase().includes("slow breath"));

  if (!hasBreathOpener) {
    lines.unshift(THERAPEUTIC_ARRIVAL_LINE_1);
  }

  const hasEntryForYou = lines.some((line) => line.toLowerCase().includes("this entry is for you"));
  if (!hasEntryForYou && lines.length > 0) {
    const breathIndex = lines.findIndex((line) => line.toLowerCase().includes("slow breath"));
    lines.splice(breathIndex >= 0 ? breathIndex + 1 : 1, 0, THERAPEUTIC_ARRIVAL_LINE_2);
  }

  const hasPrivacyFooter = lines.some(
    (line) => line.includes("private") || line.includes("5–10 minutes"),
  );
  if (!hasPrivacyFooter) {
    lines.push(THERAPEUTIC_ARRIVAL_FOOTER);
  }

  return { ...ritual.arrival, lines };
}

/** Apply shared therapeutic defaults without overwriting lesson-specific prompts. */
export function applyTherapeuticDefaults(ritual: SelfCheckRitual): SelfCheckRitual {
  if (!usesTherapeuticArc(ritual)) return ritual;

  const next: SelfCheckRitual = {
    ...ritual,
    arrival: mergeArrival(ritual),
  };

  if (next.honestInventory) {
    next.honestInventory = {
      ...STANDARD_GROUND,
      ...next.honestInventory,
      followUpOptional: true,
    };
  }

  if (next.loopBreak) {
    next.loopBreak = {
      ...next.loopBreak,
      followUpPrompt: next.loopBreak.followUpPrompt?.includes("Why did you pick")
        ? "What comes up when you think about that step?"
        : next.loopBreak.followUpPrompt,
      secondFollowUpPrompt:
        next.loopBreak.secondFollowUpPrompt ?? LOOP_BREAK_ALREADY_DONE.secondFollowUpPrompt,
      secondFollowUpPlaceholder:
        next.loopBreak.secondFollowUpPlaceholder ??
        LOOP_BREAK_ALREADY_DONE.secondFollowUpPlaceholder,
    };
  }

  if (next.scriptVoice) {
    next.scriptVoice = {
      ...next.scriptVoice,
      embodimentPrompt:
        next.scriptVoice.embodimentPrompt ?? SCRIPT_VOICE_EMBODIMENT.embodimentPrompt,
      embodimentPlaceholder:
        next.scriptVoice.embodimentPlaceholder ?? SCRIPT_VOICE_EMBODIMENT.embodimentPlaceholder,
    };
  }

  if (next.toneReflect && next.loopBreak && next.scriptVoice) {
    const helper = next.toneReflect.helper ?? "";
    if (!helper.toLowerCase().includes("your child")) {
      next.toneReflect = {
        ...next.toneReflect,
        helper: helper
          ? `${helper}\n\n${STANDARD_TONE_REFLECT_HELPER}`
          : STANDARD_TONE_REFLECT_HELPER,
      };
    }
  }

  if (next.obstaclePair) {
    const second = next.obstaclePair.secondPrompt ?? "";
    const lower = second.toLowerCase();
    const hasGoodEnough = lower.includes("good-enough") || lower.includes("good enough");
    const hasForgive = lower.includes("forgive");
    const isWorkaroundPrompt = lower.includes("work around") || lower.includes("workaround");

    let secondPrompt = second;
    if (isWorkaroundPrompt && !hasGoodEnough) {
      secondPrompt = STANDARD_OBSTACLE_SECOND_PROMPT;
    } else if (!hasForgive) {
      secondPrompt = second
        ? `${second}\n\nWhat would you want to forgive yourself for in advance?`
        : STANDARD_OBSTACLE_SECOND_PROMPT;
    }

    next.obstaclePair = {
      ...next.obstaclePair,
      secondPrompt,
    };
  }

  if (next.momentTry) {
    const standardOptionalFields = [
      {
        id: "tryMinimumStep" as const,
        label: "Minimum viable step:",
        placeholder: "If you only manage one step, which would still help your child most?",
        optional: true,
      },
      {
        id: "trySelfCompassion" as const,
        label: "Afterward:",
        placeholder: "What would you say to yourself that is true and kind?",
        optional: true,
      },
    ];

    const fields = [...next.momentTry.fields];
    for (const standard of standardOptionalFields) {
      if (!fields.some((field) => field.id === standard.id)) {
        fields.push(standard);
      }
    }

    next.momentTry = {
      ...next.momentTry,
      fields: fields.map((field) =>
        field.id === "tryMinimumStep" || field.id === "trySelfCompassion"
          ? { ...field, optional: true }
          : field,
      ),
    };
  }

  if (next.whatShifted) {
    next.whatShifted = {
      ...next.whatShifted,
      prompt: next.whatShifted.prompt || "Mark what feels true for you right now:",
      detailPrompt: next.whatShifted.detailPrompt ?? STANDARD_WHAT_SHIFTED_DETAIL.detailPrompt,
      detailPlaceholder:
        next.whatShifted.detailPlaceholder ?? STANDARD_WHAT_SHIFTED_DETAIL.detailPlaceholder,
      exclusiveOption:
        next.whatShifted.exclusiveOption ?? STANDARD_WHAT_SHIFTED_DETAIL.exclusiveOption,
    };
  }

  if (next.nextStep && !next.nextStep.helper?.toLowerCase().includes("one honest")) {
    next.nextStep = {
      ...next.nextStep,
      helper: next.nextStep.helper
        ? `${next.nextStep.helper} ${STANDARD_NEXT_STEP_HELPER}`
        : STANDARD_NEXT_STEP_HELPER,
    };
  }

  if (next.closure && next.steps.includes("next-step")) {
    const lines = [...next.closure.lines];
    const hasIntegrationLine = lines.some((line) =>
      line.toLowerCase().includes("one honest moment"),
    );
    if (!hasIntegrationLine) {
      const thankYouIndex = lines.findIndex((line) => line.toLowerCase().includes("thank you"));
      const integrationLine =
        "You don't have to master this. You only need one honest moment this week.";
      if (thankYouIndex >= 0) {
        lines.splice(thankYouIndex + 1, 0, integrationLine);
      } else {
        lines.unshift(integrationLine);
      }
      next.closure = { ...next.closure, lines };
    }
  }

  return next;
}
