import type { QuickCheckArchetype } from "@/shared/childProfile/archetypeQuickCheck";
import { ARCHETYPE_DISCLAIMER, BOTH_CAN_BE_TRUE } from "@/shared/childProfile/archetypeCaptionBank";

export { ARCHETYPE_DISCLAIMER, BOTH_CAN_BE_TRUE };
export type QuickCheckOption = {
  archetype: QuickCheckArchetype;
  label: string;
};

export type QuickCheckQuestion = {
  id: string;
  scenario: string;
  options: [QuickCheckOption, QuickCheckOption, QuickCheckOption];
};

/** Canonical Quick Check (5 scenarios) — storm / wall / spark. */
export const QUICK_CHECK_QUESTIONS: readonly QuickCheckQuestion[] = [
  {
    id: "qc_1",
    scenario: "When something doesn't go their way",
    options: [
      {
        archetype: "storm",
        label: "Big reaction right away — tears, yelling, or a meltdown",
      },
      {
        archetype: "wall",
        label: "Goes quiet, walks away, or seems to shut the moment out",
      },
      {
        archetype: "spark",
        label: 'Immediately asks "why not?" or tries to negotiate',
      },
    ],
  },
  {
    id: "qc_2",
    scenario: "When it's time to stop something fun",
    options: [
      { archetype: "storm", label: "Protests loudly, can escalate fast" },
      { archetype: "wall", label: "Ignores you, or pretends not to hear" },
      { archetype: "spark", label: "Wants the reason, or bargains for more time" },
    ],
  },
  {
    id: "qc_3",
    scenario: "In a new or unfamiliar situation",
    options: [
      { archetype: "storm", label: "Gets overwhelmed, reacts big" },
      { archetype: "wall", label: "Holds back, watches quietly from the edge" },
      { archetype: "spark", label: "Jumps in, starts exploring or asking questions" },
    ],
  },
  {
    id: "qc_4",
    scenario: 'When they\'re corrected or told "no"',
    options: [
      { archetype: "storm", label: "The moment can spiral fast" },
      {
        archetype: "wall",
        label: "Goes still, sometimes hard to reach for a while after",
      },
      { archetype: "spark", label: "Pushes back, wants to understand the rule itself" },
    ],
  },
  {
    id: "qc_5",
    scenario: "At the end of a long or tiring day",
    options: [
      { archetype: "storm", label: "Small things set them off" },
      { archetype: "wall", label: "Withdraws, wants to be left alone" },
      { archetype: "spark", label: "Gets restless, tests limits more than usual" },
    ],
  },
] as const;

export const AGE_BAND_NOTE =
  "Children shift patterns as their brains develop. This is a guide, not a fixed identity.";

export type DeepCheckScenario = {
  id: string;
  scenario: string;
};

/** Fixed slider prompts — same wording every Deep Check scenario (quiz bank §4). */
export const DEEP_CHECK_SLIDER_A = {
  question: "In that moment, did they turn inward or outward?",
  minLabel: "Went quiet / withdrew",
  maxLabel: "Got loud / visible",
} as const;

export const DEEP_CHECK_SLIDER_B = {
  question: "What was underneath it?",
  minLabel: "Overwhelmed — needed to calm down",
  maxLabel: "Testing — wanted to understand or negotiate",
} as const;

export const DEEP_CHECK_INTRO = {
  title: "A closer look",
  body: "Think through five recent moments — for each, you'll place two quick markers. There's no wrong answer, and you can retake this any time things feel like they're shifting.",
} as const;

/** Canonical Deep Check (5 scenarios) — Expression + Driver axes. */
export const DEEP_CHECK_SCENARIOS: readonly DeepCheckScenario[] = [
  {
    id: "dc_1",
    scenario:
      "Think about a recent time (in the last week or two) you told them no to something they really wanted.",
  },
  {
    id: "dc_2",
    scenario:
      "Think about a recent time (in the last week or two) their routine or plans changed suddenly, without warning.",
  },
  {
    id: "dc_3",
    scenario:
      "Think about a recent transition that was tough — leaving somewhere fun, bedtime, getting off a screen.",
  },
  {
    id: "dc_4",
    scenario: "Think about a recent time they were around new people, or in a group setting.",
  },
  {
    id: "dc_5",
    scenario:
      "Think about a recent time they made a mistake, or you had to correct something they did.",
  },
] as const;

export const DEEP_CHECK_RETENTION_NOTE = "We keep the last 5 checks (Quick and Deep).";

export const DEEP_CHECK_FIRST_INTRO =
  "This page is a first sketch. A Deep Check looks closer at how they move through the world.";

export const DEEP_CHECK_RETAKE_INTRO =
  "Patterns shift. Another Deep Check can show where they are now.";

export const DEEP_CHECK_FIRST_CTA = "Begin Deep Check";
export const DEEP_CHECK_RETAKE_CTA = "Take Deep Check again";
