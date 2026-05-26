import type { SelfCheckRitual } from "@/src/features/diary/types";

export const WEEK1_SELF_CHECK: SelfCheckRitual = {
  id: "week-1-reflection",
  lessonId: "1.1",
  title: "Week 1 Reflection",
  arrival: {
    lines: ["You are not being graded here.", "This is a place to notice, not perform."],
    ctaLabel: "Begin noticing",
  },
  reframeRecall: {
    cardTitle: "This week's reframe",
    reframe: "Behavior is not the problem.\nIt is the signal.",
    prompt: "When things felt hard this week…\nwhat did you most naturally assume?",
    options: [
      "My child was being difficult.",
      "My child was overwhelmed.",
      "I remembered behavior is communication.",
      "Honestly, I forgot in the moment.",
    ],
  },
  momentReplay: {
    intro: "Let's replay one small moment.",
    whatHappened: {
      prompt: "What happened?",
      options: [
        "whining",
        "yelling",
        "homework",
        "bedtime",
        "transition",
        "sibling conflict",
        "shutdown",
        "refusing",
        "something else",
      ],
    },
    bodyFeeling: {
      prompt: "What did you notice in yourself first?",
      options: [
        "tight chest",
        "frustration",
        "urgency",
        "panic",
        "embarrassment",
        "numbness",
        "helplessness",
        "calm",
        "not sure",
      ],
    },
    pause: {
      prompt: "Did you pause before reacting?",
      options: ["Yes", "A little", "Not this time"],
    },
    different: {
      prompt: "What did you do differently, even slightly?",
      maxLength: 200,
      placeholder: "A small shift counts…",
    },
  },
  supportNeeded: {
    prompt: "Where did your nervous system need support?",
    options: [
      "I reacted too quickly",
      "I shut down",
      "I forgot the script",
      "I felt triggered",
      "I was exhausted",
      "I knew what to do but couldn't access it",
      "something else",
    ],
    detailPrompt: "Anything you want to leave here?",
    detailPlaceholder: "Optional — leave it here if it helps",
  },
  intention: {
    prompt: "Next time I notice ______,\nI want to try ______.",
    triggerPlaceholder: "when bedtime gets chaotic…",
    actionPlaceholder: "choose a tool",
    actionSuggestions: [
      "slowing my voice",
      "getting curious first",
      "naming the feeling",
      "pausing before correcting",
      "repairing afterward",
      "asking what's hard",
    ],
    toolsLabel: "Choose a tool",
  },
  closure: {
    lines: ["You paused.\nThat matters.", "Awareness comes before change."],
    nextLessonLabel: "See you in Lesson 1.2.",
    ctaLabel: "Plant this noticing",
  },
};

const RITUALS_BY_LESSON: Record<string, SelfCheckRitual> = {
  [WEEK1_SELF_CHECK.lessonId]: WEEK1_SELF_CHECK,
};

export function getSelfCheckRitual(lessonId: string): SelfCheckRitual | null {
  return RITUALS_BY_LESSON[lessonId] ?? null;
}
