import type { SelfCheckRitual, SelfCheckRitualStep } from "@/src/features/diary/types";
import { applyTherapeuticDefaults } from "@/src/features/diary/selfCheckTemplates";

const WEEK1_STEPS: SelfCheckRitualStep[] = [
  "arrival",
  "reframe",
  "moment-what",
  "moment-feeling",
  "moment-pause",
  "moment-different",
  "support",
  "intention",
  "closure",
];

export const WEEK1_SELF_CHECK: SelfCheckRitual = {
  id: "week-1-reflection",
  lessonId: "1.1",
  title: "Week 1 Reflection",
  steps: WEEK1_STEPS,
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

export const LESSON_1_2_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-1-2-reflection",
  lessonId: "1.2",
  title: "Lesson 1.2 Reflection",
  steps: ["arrival", "reframe", "rule", "support", "closure"],
  arrival: {
    lines: ["You are not being graded here.", "This is a place to notice, not perform."],
    ctaLabel: "Begin noticing",
  },
  reframeRecall: {
    cardTitle: "1. The Core Reframe",
    reframe: "Behavior is not the problem.\nIt is the signal.",
    prompt: "",
    options: [
      "I caught myself interpreting behavior as a signal this week",
      "I understand this intellectually but haven't caught it in the moment yet",
      "I'm still sitting with this—it's shifting something for me",
    ],
  },
  ruleRecall: {
    cardTitle: "2. The Core Rule",
    reframe: "Regulation must come before reasoning.",
    prompt: "",
    options: [
      "I successfully paused before explaining at least once",
      "I tried but couldn't pause—my own activation took over",
      "I noticed after the fact that I explained first again (awareness is the first win)",
    ],
  },
  supportNeeded: {
    prompt: "3. The Script I Used\n\nCircle what came out of your mouth this week:",
    options: [
      "I see you're upset.",
      "I'm here.",
      "We'll solve it after you feel better.",
      "None yet—still practicing",
      "Something else I created:",
    ],
    detailPrompt: "Something else I created:",
    detailPlaceholder: "What did you say?",
    exclusiveOption: "None yet—still practicing",
    otherOption: "Something else I created:",
  },
  closure: {
    lines: ["You showed up.\nThat counts.", "Small shifts build over time."],
    nextLessonLabel: "See you in Lesson 1.3.",
    ctaLabel: "Plant this noticing",
  },
};

export const LESSON_1_3_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-1-3-reflection",
  lessonId: "1.3",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "body-first",
    "the-gap",
    "noticing",
    "compassion",
    "next-step",
    "what-shifted",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "This entry is for you, not for the lesson. There are no right answers here — just an honest record of where you are.",
      "Before you type anything, notice where your body is holding tension right now. That noticing is already the work.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  bodyFirst: {
    sectionLabel: "01 — BODY FIRST",
    prompt:
      "When you think back to the last time your child was escalated, where did you feel it in your body?",
    helper: "Not what you thought or did. Just where it landed physically.",
    placeholder: "Shoulders, chest, jaw, stomach…",
    maxLength: 400,
  },
  theGap: {
    sectionLabel: "02 — THE GAP",
    prompt: "Before this lesson, what was your default move when your child got loud?",
    helper: "Choose everything that fits. Honesty here is more useful than a flattering answer.",
    options: [
      "Explain why",
      "Raise my voice",
      "Go quiet / shut down",
      "Leave the room",
      "Try to reason through it",
      "Threaten a consequence",
      "Give in to stop it",
      "Try to distract",
      "Feel ashamed after",
    ],
    detailPrompt: "Anything not listed — add it here.",
    detailPlaceholder: "Optional",
  },
  noticing: {
    sectionLabel: "03 — NOTICING THE NERVOUS SYSTEM",
    prompt:
      'When you heard the phrase "you cannot lend calm you do not possess" — what happened inside you?',
    helper:
      "A reaction, a memory, a feeling of recognition, resistance, relief. Whatever actually arose.",
    placeholder: "Write what arose…",
    maxLength: 500,
  },
  compassion: {
    sectionLabel: "04 — SELF-COMPASSION CHECK",
    storyPrompt:
      "What story do you carry about what it means that you get activated by your child?",
    storyHelper: "Many parents carry a quiet verdict about themselves. What is yours?",
    storyPlaceholder: "Write the story…",
    truthPrompt: "After writing it — is that story true? Or is it your flooded brain's conclusion?",
    options: ["It feels true right now", "I am not sure", "It feels less true after writing it"],
  },
  nextStep: {
    sectionLabel: "05 — THE SMALLEST NEXT STEP",
    prompt:
      "Tonight, if your child gets upset, what is the one thing you will try before you explain anything?",
    helper:
      "Not a plan. Not a commitment. Just one thing, small enough to actually do when your own nervous system is firing.",
    placeholder: "One small thing…",
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "I noticed something about my own nervous system I hadn't before",
      "I see the gap between what I know and what I do in the moment",
      "I have words that feel closer to my voice",
      "I'm clearer on what will be hardest for me",
      "I feel more hopeful about trying once",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "A phrase to carry with you…",
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You don't have to master co-regulation. You only need one honest moment this week.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 1.4.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_1_4_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-1-4-reflection",
  lessonId: "1.4",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "This lesson introduced the co-regulation loop and gave you exact words. This diary asks whether those words fit your voice, and whether the loop feels possible in your world.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  loopBreak: {
    sectionLabel: "01 — NOTICE",
    prompt:
      "Read through Notice, Regulate, Connect, Support. Which step feels least natural for you right now?",
    helper:
      "Not because you are failing — because it is new or hard in your life. This is not weakness. It is honest self-knowledge.",
    options: ["Notice", "Regulate", "Connect", "Support"],
    followUpPrompt: "What comes up when you think about that step?",
    followUpPlaceholder: "Name what makes this step hard in the moment…",
    secondFollowUpPrompt:
      "Which part of this loop have you already done — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "02 — THE SCRIPT IN YOUR VOICE",
    prompt:
      "You heard the phrase: \"You're not okay. I'm here.\" Does that feel real coming out of your mouth?",
    helper: "Not whether it is good. Whether it sounds like you, or like you reading from a card.",
    options: [
      "Yes — that could sound like me",
      "Partly — close but not quite mine",
      "No — it feels like reading from a card",
    ],
    followUpPrompt: "If it doesn't feel like you, what would you actually say instead?",
    followUpPlaceholder: "Your words, in your voice…",
    embodimentPrompt:
      "Say your version out loud or in your head. What happens in your chest, throat, or shoulders?",
    embodimentPlaceholder: "Comfort, performance, collapse — whatever you notice…",
  },
  toneReflect: {
    sectionLabel: "03 — TONE VERSUS WORDS",
    prompt:
      "Think of two moments: when someone spoke calmly while you were upset, and when the words were fine but the tone was not.",
    helper:
      "Not the textbook answer. What did your body do in each? What does your child seem to respond to more — your words or your tone?",
    placeholder: "Write what you notice in your body and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "04 — REALITY CHECK",
    prompt: "What in your actual life will make this loop hardest to follow when adrenaline hits?",
    helper:
      "Not what should make it hard — what actually will. Time of day, your state, your child's meltdown style, your partner, fatigue…",
    firstLabel: "Biggest obstacle",
    firstPlaceholder: "What will actually make this hardest?",
    secondPrompt:
      "Given that obstacle, what is a good-enough version of the loop — not the lesson version? What would you want to forgive yourself for in advance?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "05 — ONE MOMENT TO TRY",
    intro:
      "Think of a specific situation this week where your child might escalate. Describe it. Then describe what the four-step loop looks like in that actual situation.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      { id: "trySituation", label: "Situation:", placeholder: "When will this happen?" },
      { id: "tryNotice", label: "Notice:", placeholder: "What will you see?" },
      { id: "tryRegulate", label: "Regulate:", placeholder: "What will you do to slow yourself?" },
      {
        id: "tryConnectSupport",
        label: "Connect & Support:",
        placeholder: "What will you actually do and say?",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage one step:",
        placeholder: "Which would still help your child most?",
      },
      {
        id: "trySelfCompassion",
        label: "Afterward, what is true and kind to say to yourself?",
        placeholder: "Optional — one sentence…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "I see the loop more clearly",
      "I have words closer to my voice",
      "I'm clearer on what will be hardest for me",
      "I feel more hopeful about trying once",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "A phrase to carry with you…",
  },
  nextStep: {
    sectionLabel: "ONE SMALL COMMITMENT",
    prompt:
      "You do not have to master co-regulation. What is the smallest thing you are willing to try this week?",
    helper: "One honest moment counts.",
    placeholder: "One small thing…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You only need one honest moment this week.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 1.5.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_1_5_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-1-5-reflection",
  lessonId: "1.5",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "body-first",
    "loop-break",
    "noticing",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Take one slow breath. You don't need to get this right.",
      "Emotional flooding — the lever is your nervous system. Same child. Different anchor.",
      "5–10 minutes; entries are private.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "Ground",
    prompt: "How regulated do you feel right now?",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  bodyFirst: {
    sectionLabel: "01 — THE HIJACK IN YOUR BODY",
    prompt: "Where did you feel it the last time you lost your cool?",
    helper:
      "Tight chest, clenched jaw, louder voice than you meant — that was not a character flaw. It was a physiological hijack.",
    placeholder: "Chest, jaw, throat, heat, urgency to fix or escape…",
    maxLength: 400,
  },
  loopBreak: {
    sectionLabel: "02 — YOUR ANCHOR",
    prompt: "Select the anchor that feels most usable for you right now:",
    options: ["Breath", "Physical grounding", "Two-second pause"],
    followUpPrompt: "What comes up imagining that mid-meltdown?",
    followUpPlaceholder: "Honest — awkward, hopeful, impossible, worth trying…",
    secondFollowUpPrompt: "Have you used any anchor once already?",
    secondFollowUpPlaceholder: "Even imperfectly — a small moment counts…",
  },
  noticing: {
    sectionLabel: "03 — WHAT YOUR BODY REMEMBERS",
    prompt: "What did your childhood teach you about big emotions?",
    helper:
      "Were they allowed, dismissed, punished, sent away? Whatever you learned, your body remembers.",
    placeholder: "Write what comes up…",
    maxLength: 500,
  },
  scriptVoice: {
    sectionLabel: "04 — MY REGULATION COMES FIRST",
    prompt: 'How does "My regulation comes first" land for you?',
    options: ["Makes sense", "Partly", "Feels selfish or indulgent"],
    followUpPrompt: "What would you need to hear instead?",
    followUpPlaceholder: "Your words, not the lesson's…",
    embodimentPrompt:
      'Say "I am safe. You are safe." once rushed and stressed, then once slow with your hand on your belly. What shifted in your body?',
    embodimentPlaceholder: "The difference you felt — even small…",
  },
  toneReflect: {
    sectionLabel: "05 — SAME WORDS, DIFFERENT ANCHOR",
    prompt:
      "When you said calm words but stayed activated — what happened? What did your child mirror?",
    placeholder: "Write what you remember in your body and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE REGULATION TRAP",
    prompt: "What keeps you waiting until they're dysregulated to regulate yourself?",
    firstLabel: "What pulls you into the trap",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt: "Good-enough daily anchor + pre-forgiveness?",
    secondPlaceholder: "What would you forgive yourself for if you only manage the anchor once?",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — TRY TONIGHT",
    intro:
      "Picture a specific moment this week when activation might hit — and walk through the anchor there.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "When might activation hit?",
      },
      {
        id: "tryNotice",
        label: "Notice (body):",
        placeholder: "What will your body do?",
      },
      {
        id: "tryRegulate",
        label: "Anchor:",
        placeholder: "Breath, grounding, or pause?",
      },
      {
        id: "tryConnectSupport",
        label: "In the moment (messy):",
        placeholder: "What will that look like when it's not perfect?",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage the anchor:",
        placeholder: "What still counts as enough?",
        optional: true,
      },
      {
        id: "trySelfCompassion",
        label: "Kind truth afterward:",
        placeholder: "Optional — one sentence…",
        optional: true,
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what is true for you right now:",
    options: [
      "Flooding is physiology — not a character flaw",
      "I recognize the regulation trap",
      "I chose an anchor to try",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet",
    ],
    exclusiveOption: "Nothing shifted yet",
  },
  nextStep: {
    sectionLabel: "ONE ANCHOR BEFORE TOMORROW",
    prompt: "Which anchor, and when?",
    helper: "One breath, thirty seconds of grounding, or one pause before responding.",
    placeholder: "My anchor and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: ["Your job is not to stop their storm.", "Be the anchor."],
    nextLessonLabel: "See you in Lesson 1.6.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_1_6_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-1-6-reflection",
  lessonId: "1.6",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "You know why reasoning fails. You know the co-regulation loop. But in the chaos of real life, it's easy to forget. That's not failure — that's the gap between knowledge and system.",
      "Today was about three loops that do the remembering for you. Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — CONNECTION OR CORRECTION",
    prompt:
      "Think about your morning today — or yesterday. Did you start with connection or correction?",
    helper: "Not judgment. Data. Did you see your child first — or the clock, the shoes, the task?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — YOUR LOOP",
    prompt:
      "The Daily Integration System has three loops: Morning (anticipatory connection), Stress (co-regulation during), and Bedtime (file sorting). Which feels hardest to actually do in your real life?",
    helper:
      "Not which sounds best on paper — which one disappears when you're rushed, flooded, or exhausted.",
    options: ["Morning Loop", "Stress Loop", "Bedtime Loop"],
    followUpPrompt: "What comes up when you think about that loop?",
    followUpPlaceholder: "Morning rush, after-school crash, bedtime battles…",
    secondFollowUpPrompt: "Which loop have you already touched — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — THE SCRIPTS IN YOUR VOICE",
    prompt:
      "During a flood, the Stress Loop script is: \"You're having a hard time. I'm here. We'll wait.\" Does that feel real coming out of your mouth?",
    helper:
      "Not whether it is good. Whether it sounds like you — or like reading from a card while you're still activated.",
    options: [
      "Yes — that could sound like me",
      "Partly — close but not quite mine",
      "No — it feels like reading from a card",
    ],
    followUpPrompt: "If it doesn't feel like you, what would you actually say instead?",
    followUpPlaceholder: "Your words, in your voice…",
    embodimentPrompt:
      "Whisper this phrase — half your normal volume, half your normal speed: \"I've got you. You are safe. I'm not going anywhere.\" What happened in your shoulders, breath, or chest?",
    embodimentPlaceholder: "The shift you felt — even small…",
  },
  toneReflect: {
    sectionLabel: "04 — COMPLIANCE OR REGULATION",
    prompt:
      "Recall a recent moment when you needed your child to comply — shoes on, out the door, stop crying. Were you playing for compliance or regulation?",
    helper:
      "Compliance can be fast in the moment. Regulation wins the long game. What did your tone carry — rhythm and safety, or urgency and threat?",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE PERFECTION TRAP",
    prompt:
      "What actually makes the Daily Integration System hardest to follow — not what should, but what will?",
    helper:
      "Trying all three loops perfectly on day one, morning rush, your own exhaustion, needing them calm so you can breathe…",
    firstLabel: "Biggest obstacle",
    firstPlaceholder: "What will actually make this hardest?",
    secondPrompt:
      "These loops are off-ramps, not a checklist. If you miss the Morning Loop, you still have Stress or Bedtime. What would you forgive yourself for in advance?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT (BEDTIME LOOP)",
    intro:
      "Tonight, try 60 seconds of the Bedtime Loop before the tasks. Sit on the bed, dim the light, and review the day — not with a cortex question, but with presence.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "When tonight — before pajamas, teeth, or stories?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you toward tasks instead of 60 seconds of presence?",
      },
      {
        id: "tryRegulate",
        label: "Questions:",
        placeholder: "What was one hard moment today? What was one good moment?",
      },
      {
        id: "tryConnectSupport",
        label: "When they share the hard moment:",
        placeholder: "Don't fix it — what will you say and do? (Hand on heart, 'That was tough…')",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage 60 seconds:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "If presence feels impossible tonight — what is true and kind to say to yourself?",
        placeholder: "Optional — that information is where your regulation work begins…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "I see the gap between knowledge and having a system",
      "Connection vs correction landed as data — not judgment",
      "I understand compliance vs regulation — the long game",
      "I felt my body respond to slow, rhythmic tone",
      "I know which loop is my starting point",
      "I have a Bedtime Loop to try tonight",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "A phrase to carry with you…",
  },
  nextStep: {
    sectionLabel: "ONE LOOP THIS WEEK",
    prompt:
      "You don't have to run all three loops perfectly. Which one loop will you prioritize this week — and when?",
    helper:
      "Morning, Stress, or Bedtime. One loop. One practice. Knowledge becomes instinct through repetition, not perfection.",
    placeholder: "My loop and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're not building a perfect system. You're building a practice.",
      "Miss the Morning Loop? You have the Stress Loop. Miss all three? There's tomorrow.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Module 2.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_1_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-1-reflection",
  lessonId: "2.1",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Control creates resistance — not because your child is difficult, but because a flooded brain reads demands as threat. This is Module 2. You're not just changing a behavior. You're changing a belief about what discipline means.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — HAVING A HARD TIME",
    prompt:
      "Think about the last time your child melted down over something that seemed small. If you believed — truly believed — they were having a hard time, not giving you one… what would have shifted in your response?",
    helper:
      "Not the answer you think you should give. Sit with what actually would have changed — your tone, your body, the demand.",
    placeholder: "Write what comes up…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — THE POWER STRUGGLE LOOP",
    prompt: "Demand → resist → escalate → flood. Where do you usually enter this loop?",
    helper:
      "The goal isn't to win the struggle — it's to never enter it. You can only exit at Step 1.",
    options: [
      "Step 1 — I demand compliance",
      "Step 2 — Child resists (I'm already in)",
      "Step 3 — I escalate my tone",
      "It happens too fast to name",
    ],
    followUpPrompt: "What comes up when you think about pausing before that first demand?",
    followUpPlaceholder: "Running late, urgency, fear they'll never listen…",
    secondFollowUpPrompt: "Have you ever paused before demanding — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — THE 3 L'S IN YOUR VOICE",
    prompt:
      'Instead of "Put the shoes on or we\'re leaving without you," the lesson offered: "Shoes are hard right now. I\'m going to put mine on, then help you with one foot." Does that feel real coming out of your mouth?',
    helper:
      "Low volume, low posture, low stakes. Not whether it's good — whether it sounds like you, or like a card you can't reach for when you're flooded.",
    options: [
      "Yes — that could sound like me",
      "Partly — close but not quite mine",
      "No — it feels like reading from a card",
    ],
    followUpPrompt: "If it doesn't feel like you, what would you actually say instead?",
    followUpPlaceholder: "Your words, in your voice…",
    embodimentPrompt:
      "Whisper the Regulator Voice in your head: \"I won't let you hit. I'm going to sit here until your hands feel calm.\" What happened in your shoulders, jaw, or chest?",
    embodimentPlaceholder: "You can't fake regulation — what did your body show you?",
  },
  toneReflect: {
    sectionLabel: "04 — POWERFUL OR SAFE",
    prompt:
      "When you're running late and stressed, which actually shows up — the control approach (trying to be powerful) or the connection approach (trying to be safe)?",
    helper:
      "Not which one you want. Which one your child gets. If your voice is calm but your jaw is clenched, they feel the jaw.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — WHERE CONTROL SHOWS UP",
    prompt:
      "Where did your attempt to control actually make things worse this week — or where do you expect it will?",
    helper:
      "Morning rush, sibling hitting, bedtime, transitions. Not judgment — data. Natural laws become tools once you see them.",
    firstLabel: "The moment",
    firstPlaceholder: "When and where did control backfire — or might?",
    secondPrompt:
      "Given that moment, what is a good-enough way to go low and slow instead of demanding first? What would you forgive yourself for if you only manage the posture — not the perfect script?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT: GO LOW & SLOW",
    intro:
      "When you feel the urge to demand compliance from a dysregulated child: drop your voice, drop your body to their level, and observe their body before you say a word. Plan that moment now.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "When might the urge to control show up — tonight or tomorrow?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will your body do? (firm voice, pointing, jaw, urgency…)",
      },
      {
        id: "tryRegulate",
        label: "Go low & slow:",
        placeholder: "Drop voice, drop posture — what will that look like before any instruction?",
      },
      {
        id: "tryConnectSupport",
        label: "Observe first:",
        placeholder: "What will you watch for in their body before you ask for behavior?",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage low posture:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "Afterward, what is true and kind to say to yourself?",
        placeholder: "Optional — resistance isn't failure; it's a working brain…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Control creates resistance — I see it in my own parenting",
      "Having a hard time vs giving me a hard time — that reframe landed",
      "I know where I enter the power struggle loop",
      "The 3 L's feel closer to something I could try",
      "I felt the difference between powerful and safe in my body",
      "I have a go-low-and-slow moment planned",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "A phrase to carry with you…",
  },
  nextStep: {
    sectionLabel: "ONE BELIEF SHIFT THIS WEEK",
    prompt:
      "Which of the 3 L's — low volume, low posture, or low stakes — will you practice once this week, and when?",
    helper:
      "One shift. Not mastering de-escalation. Your job isn't to break resistance — it's to be safe enough for them to lay it down.",
    placeholder: "My L and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You are not failing when your child resists your control. You are seeing a natural law.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 2.2.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_2_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-2-reflection",
  lessonId: "2.2",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Cooperation is not compliance. It's a shared dance where you lead less and follow more. This diary asks whether the Three-Part Ask — Connect, Frame, Invite — fits your voice and your real daily battles.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — YOUR DAILY BATTLE",
    prompt:
      "Think of one thing you ask your child to do every day that turns into a fight — getting dressed, brushing teeth, leaving the house. Name it.",
    helper:
      "If cooperation is inviting them into a shared yes — not making them obey — what would shift in how you enter that moment?",
    placeholder: "The battle and what usually happens…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — THE THREE-PART ASK",
    prompt:
      "Connect → Frame → Invite. Which part feels hardest for you to actually do in the moment?",
    helper: "Not weakness — honest self-knowledge. Commands are fast. Cooperation takes practice.",
    options: [
      "Connect — get low, name what they're into",
      "Frame — state reality without blame",
      "Invite — offer a genuine choice",
    ],
    followUpPrompt: "What comes up when you think about that step?",
    followUpPlaceholder: "Urgency, fear they'll say no, forgetting the script…",
    secondFollowUpPrompt:
      "Have you already used any part of the Three-Part Ask — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — YOUR THREE-PART ASK",
    prompt:
      'For your daily battle, imagine: Connect ("You\'re really into…"), Frame ("We need to…"), Invite ("Do you want X or Y?"). Could that sound like you — or like a card?',
    helper: "Not whether it's good. Whether you could reach for it when the fight is starting.",
    options: [
      "Yes — I could see myself saying that",
      "Partly — I'd need my own words",
      "No — commands still feel automatic",
    ],
    followUpPrompt:
      "Write your Three-Part Ask for that daily battle — Connect, Frame, Invite in your words.",
    followUpPlaceholder: "Connect… Frame… Invite…",
    embodimentPrompt:
      "Say your Invite line once rushed or fake-nice, then once slow and warm — like inviting a friend. What shifted in your body?",
    embodimentPlaceholder: "Trap vs anchor — what you noticed…",
  },
  toneReflect: {
    sectionLabel: "04 — TRAP OR ANCHOR",
    prompt:
      "Same words, different tone: fake-nice and rushed sounds like a trap. Ground, slow, and warm sounds like a calm anchor. Which tone does your child usually get in your daily battle?",
    helper:
      "Your tone is the difference between a power struggle and a partnership. Not what you intend — what lands.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — WHY COMMANDS WIN",
    prompt:
      "What actually makes commands your default in that daily battle — not what should, but what does?",
    helper: "Running late, repetition fatigue, fear they'll never cooperate, your own activation…",
    firstLabel: "What pulls you toward commands",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Given that, what is a good-enough Three-Part Ask — messy, not magic? What would you forgive yourself for if you only manage Connect before the demand?",
    secondPlaceholder: "Realistic and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT",
    intro:
      "Pick one daily battle. Before you say anything, breathe. Then run Connect → Frame → Invite and watch for a small shift — not magic, the first crack in the old pattern.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "Which battle — and when (tonight or tomorrow morning)?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will they be doing or feeling when the fight usually starts?",
      },
      {
        id: "tryRegulate",
        label: "Connect:",
        placeholder: "Get low — what will you name about what they're into or feeling?",
      },
      {
        id: "tryConnectSupport",
        label: "Frame & Invite:",
        placeholder: "State the reality, then offer a genuine choice…",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage Connect:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "Afterward, what is true and kind to say to yourself?",
        placeholder: "Optional — a small shift is the first crack…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Cooperation vs compliance — that distinction landed",
      "I named my daily battle clearly",
      "I know which part of the Three-Part Ask is hardest for me",
      "I felt the difference between trap tone and anchor tone",
      "I wrote a Three-Part Ask in my own words",
      "I have one battle ready to try Connect → Frame → Invite",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Connect. Frame. Invite.",
  },
  nextStep: {
    sectionLabel: "ONE BATTLE TOMORROW",
    prompt:
      "Tomorrow, during your hardest transition — getting dressed, leaving, homework — use the Three-Part Ask instead of a command. Which battle, and when?",
    helper: "One battle. One ask. Don't expect magic. Expect a small shift.",
    placeholder: "My battle and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You didn't give up the boundary. You wrapped it in connection and a real choice.",
      "Next up: when they say no anyway — boundaries without breaking connection.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 2.3.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_3_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-3-reflection",
  lessonId: "2.3",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "A dysregulated child cannot learn, listen, or cooperate. Connection regulates the nervous system first. Instruction comes second. This diary asks what you reach for first — and whether Connect First fits your voice.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHAT YOU SAID FIRST",
    prompt:
      "Think of the last time your child was really upset — a meltdown, big tears, yelling. What did you say first?",
    helper:
      "Instruction? ('Calm down.' 'Take a breath.' 'Use your words.') Connection? Or something else? No judgment — just data.",
    placeholder: "Write what actually came out of your mouth…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — CONNECT FIRST",
    prompt: "When your child loses it, what is your first instinct?",
    helper: "Connection before instruction. You can't teach a drowning person to swim.",
    options: [
      "Try to reason and problem-solve",
      "Try to distract or bribe",
      "Get frustrated or threaten",
      "Get close, get low, and just be with them",
    ],
    followUpPrompt: "What comes up when you think about pausing before instructing?",
    followUpPlaceholder: "Urgency to fix, fear it will escalate, running late…",
    secondFollowUpPrompt:
      "Have you ever connected first — get low, name the feeling, stay — even once?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — THE CONNECT FIRST SCRIPT",
    prompt:
      "Get low. Name the feeling. Say: \"I'm here. I'm not going anywhere.\" Then be quiet. Does that feel real coming out of your mouth?",
    helper:
      "Not whether it's soft parenting. Whether you could reach for it when everything in you wants to lecture.",
    options: [
      "Yes — that could sound like me",
      "Partly — close but not quite mine",
      "No — instructing still feels automatic",
    ],
    followUpPrompt:
      "If it doesn't feel like you, what would you actually say instead — still without fixing or teaching?",
    followUpPlaceholder: "Your words, in your voice…",
    embodimentPrompt:
      "Say \"Hey. I'm here. I'm not going anywhere.\" once rushed and anxious, then once slow and grounded. What shifted in your body?",
    embodimentPlaceholder: "Anxiety vs life raft — what you noticed…",
  },
  toneReflect: {
    sectionLabel: "04 — INSTRUCTION OR CONNECTION",
    prompt:
      "Recall a meltdown where you meant well — 'It's okay, we can fix it, take a breath.' What happened? Did instruction land, or did it add noise?",
    helper:
      "When the upstairs brain is offline, even kind instruction sounds like threat. What did your tone carry — urgency or presence?",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE URGE TO FIX",
    prompt:
      "What actually makes you instruct, fix, or reason first — not what should, but what does?",
    helper:
      "Wanting the meltdown to stop, embarrassment, your own activation, believing you're helping…",
    firstLabel: "What pulls you toward instruction",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Given that urge, what is a good-enough Connect First — get low, name it, 'I'm here,' ten seconds of quiet? What would you forgive yourself for if you don't fix anything?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT",
    intro:
      "Practice on a low-stakes moment — frustrated with a toy, whining about dinner. No instructing, fixing, or reasoning. Just connect.",
    helper: "Not the ideal version. The messy real version that might happen.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "A low-stakes moment tonight — when and what?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to instruct, fix, or say 'It's okay'?",
      },
      {
        id: "tryRegulate",
        label: "Get low & name it:",
        placeholder: "What feeling will you name without fixing? ('You're so frustrated…')",
      },
      {
        id: "tryConnectSupport",
        label: "Presence:",
        placeholder: "\"I'm here. I'm not going anywhere.\" — then ten seconds of quiet",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage to get low:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "Afterward, what is true and kind to say to yourself?",
        placeholder: "Optional — you're not trying to stop the feeling…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Connection before instruction — that order landed",
      "I see why instruction fails when they're dysregulated",
      "I know my first instinct when they melt down",
      "The Connect First script feels closer to my voice",
      "I felt anxious tone vs life raft tone in my body",
      "I have a low-stakes moment planned to connect first",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Connection before instruction.",
  },
  nextStep: {
    sectionLabel: "CONNECT FIRST — 24 HOURS",
    prompt:
      "The next time your child melts down, your only job: get low, name the feeling, say 'I'm here,' and wait ten seconds. No 'Calm down.' No 'Use your words.' When might that happen?",
    helper: "One meltdown or low-stakes moment. Let the silence do the regulation.",
    placeholder: "When I'll practice Connect First…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're not trying to stop the feeling. You're teaching them feelings are survivable — and they're not alone.",
      "Next up: from 'I'm here' to 'Now let's solve this.'",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 2.4.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_4_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-4-reflection",
  lessonId: "2.4",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "You've been practicing co-regulation — and still sometimes explain, teach, and lecture while it escalates. That's not failure. It's a deeply ingrained instinct. Today was about why reasoning fails when the upstairs brain is offline.",
      "Attachment → Safety → Cooperation. Not logic → cooperation. Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHEN YOU WERE FLOODED",
    prompt:
      "Think back to a time you were truly overwhelmed — not mildly stressed, but flooded. If someone had given you a logical, bullet-pointed list of why you shouldn't feel that way… what would have happened?",
    helper:
      "You wouldn't have said thank you. You needed someone to sit with you. Your child needs the same when their upstairs brain is offline.",
    placeholder: "Write what you would have felt — and what you needed instead…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — ATTACHMENT OR LOGIC",
    prompt: "In your last meltdown with your child, did you lead with attachment or logic?",
    helper:
      "Not judgment — noticing. They aren't giving you a hard time. Their upstairs brain is offline.",
    options: [
      "Logic — I explained, taught, or reasoned",
      "Mixed — connection first, then 'but…'",
      "Attachment — I stayed, validated, didn't instruct",
      "It happened too fast to know",
    ],
    followUpPrompt:
      "What comes up when you think about leading with safety instead of explanation?",
    followUpPlaceholder: "Fear of permissiveness, urgency to fix, the word 'but'…",
    secondFollowUpPrompt:
      "Have you ever validated without explaining — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — YOUR FLOOD SCRIPT",
    prompt:
      "When they're flooded, your vocabulary shrinks to three moves: invite proximity, validate the feeling, be present. Which line feels most natural to you?",
    helper:
      "None of these contain 'but,' explain why they're wrong, or solve the problem. They build safety — that's it.",
    options: [
      "Invite proximity — 'Come here for a second.' / 'I'm right here.'",
      "Validate the feeling — 'You are so frustrated.' / 'That is so hard.'",
      "Be present — 'We're okay. I've got you.'",
    ],
    followUpPrompt:
      "Write that line in your own words — still an invitation, not a demand, with no 'but.'",
    followUpPlaceholder: "Your words, slow and soft…",
    embodimentPrompt:
      "Say your line once as a demand, then once as a slow invitation. What shifted in your voice and body?",
    embodimentPlaceholder: "Invitation vs demand — what you noticed…",
  },
  toneReflect: {
    sectionLabel: "04 — CALM BUT STILL INSTRUCTING",
    prompt:
      "Recall a moment you used a calm voice but still taught, corrected, or said 'but' during a meltdown. What happened?",
    helper:
      "You were speaking to an empty room — the upstairs brain had left. Connection without correction isn't permissive. It's foundational.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE URGE TO EXPLAIN",
    prompt:
      "What actually makes you explain, teach, or reason during a flood — not what should, but what does?",
    helper:
      "Believing you're helping, wanting it to stop, fear you're not doing enough, how you were raised…",
    firstLabel: "What pulls you toward reasoning",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Your only job for the first 60 seconds is to be the safe harbor. What is a good-enough version of that — and can you give yourself permission if it feels like 'not doing enough'?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT (CALM PRACTICE)",
    intro:
      "Tonight, when things are calm: sit with your child for two minutes. Don't ask questions. Just sit close and build the pathway — connection = safety — outside of crisis.",
    helper: "Not the ideal version. Doing nothing but being present is not passivity.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "When tonight — after dinner, before bed, quiet moment?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you toward questions, tasks, or fixing?",
      },
      {
        id: "tryRegulate",
        label: "Presence:",
        placeholder:
          "Sit close — hand on back? What will you say? ('I just wanted to sit with you…')",
      },
      {
        id: "tryConnectSupport",
        label: "For the next meltdown:",
        placeholder: "Invite → validate → be present — your three lines, no 'but'",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage one minute:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "If it feels like you're not doing enough — what is true and kind to say?",
        placeholder: "Optional — being the safe harbor is the most active thing…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Attachment → Safety → Cooperation — that pathway landed",
      "I see why reasoning fails when they're flooded",
      "I know whether I led with logic or attachment last time",
      "I have a flood script without 'but' in my own words",
      "I felt invitation vs demand in my body",
      "I have calm practice planned for tonight",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Safe harbor, not teacher.",
  },
  nextStep: {
    sectionLabel: "60 SECONDS — SAFE HARBOR",
    prompt:
      "At the next meltdown, your only job for the first 60 seconds: invite proximity, validate the feeling, be present. No explaining. When might that happen?",
    helper:
      "You cannot set a boundary while the upstairs brain is offline. Safety first — boundaries come after.",
    placeholder: "When I'll practice safe harbor first…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You weren't failing when you lectured to a flooded brain. You were fighting an instinct.",
      "Next up: boundaries — without breaking connection.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 2.5.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_5_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-5-reflection",
  lessonId: "2.5",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Your boundary was often right. The meltdown came back because of timing and delivery — threat re-activated the downstairs brain. Today was about holding the line without becoming the threat.",
      "Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHEN THE STORM RETURNED",
    prompt:
      "Think of the last time you set a boundary — hitting, screen time, something non-negotiable — and your child re-flooded. You thought connection was restored. What did you say?",
    helper:
      "Not judgment — data. 'If you do that again…' sounds like a boundary but lands as threat.",
    placeholder: "Write what actually came out…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — TWO SENTENCES",
    prompt:
      "The protective frame is two sentences: 'I won't let you…' plus 'You're upset and that makes sense.' Which is harder for you to say in the moment?",
    helper:
      "Same boundary in both frames. One activates shame and resistance. The other activates safety.",
    options: [
      "Sentence 1 — 'I won't let you…' (the boundary)",
      "Sentence 2 — 'You're upset and that makes sense.' (the validation)",
      "Both feel equally hard",
      "Neither — threat frame still comes out first",
    ],
    followUpPrompt:
      "What comes up when you think about saying the protective frame instead of 'If you… then…'?",
    followUpPlaceholder: "Too soft, they'll walk over me, urgency to punish…",
    secondFollowUpPrompt:
      "Have you ever held a boundary without a threat — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — PROTECTIVE FRAME IN YOUR VOICE",
    prompt:
      "Imagine: \"I won't let you hit. You're upset and that makes sense. I'm going to help you stop.\" Does that feel real coming out of your mouth?",
    helper:
      "Not whether it's too soft. Whether you could say it low and steady — without anger — when a boundary is crossed.",
    options: [
      "Yes — that could sound like me",
      "Partly — close but not quite mine",
      "No — threat frame still feels more natural",
    ],
    followUpPrompt:
      "Write your two sentences for a boundary you actually face — behavior and validation in your words.",
    followUpPlaceholder: "I won't let you… / You're upset and…",
    embodimentPrompt:
      "Say your two sentences out loud, low and steady, without anger. What happened in your body — tight or open?",
    embodimentPlaceholder: "Practice the tone, not just the words…",
  },
  toneReflect: {
    sectionLabel: "04 — THREAT OR PROTECTIVE",
    prompt:
      "When you read the protective frame, did a part of you think 'That's too soft'? When a boundary is crossed for real, which frame actually shows up — threat or protective?",
    helper:
      "Firmness doesn't require harshness. Who do you learn more from — someone who threatens, or someone who holds you steady?",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE 'IF YOU… THEN…' HABIT",
    prompt: "What actually makes the threat frame your default — not what should, but what does?",
    helper:
      "How you were raised, fear they won't listen, needing compliance fast, your own activation after the meltdown…",
    firstLabel: "What pulls you toward threat",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Given that, what is a good-enough two-sentence boundary — then act with your body, no lecture? What would you forgive yourself for if the tone isn't perfect?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT",
    intro:
      "Practice the protective frame out loud — to yourself, in the mirror. Low, steady, calm. Then plan how you'll use two sentences at the next boundary cross.",
    helper: "No more than two sentences. No lectures. No threats. Then move in with your presence.",
    fields: [
      {
        id: "trySituation",
        label: "Practice tonight:",
        placeholder: "When will you say it out loud — mirror, car, quiet moment?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you toward anger, explanation, or 'If you… then…'?",
      },
      {
        id: "tryRegulate",
        label: "Sentence 1 — Boundary:",
        placeholder: "'I won't let you…' — your behavior, your words",
      },
      {
        id: "tryConnectSupport",
        label: "Sentence 2 — Validation + action:",
        placeholder:
          "'You're upset and that makes sense.' — then how you'll hold the line with your body",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage Sentence 1:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "If 'too soft' shows up — what is true and kind to say to yourself?",
        placeholder: "Optional — same boundary, different frame…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Threat vs safety — I see why delivery re-floods them",
      "I understand punitive vs protective frame",
      "I know which of the two sentences is harder for me",
      "I wrote a two-sentence boundary in my own words",
      "I felt the difference saying it without anger in my body",
      "I have protective-frame practice planned for tonight",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "I won't let you. You're upset and that makes sense.",
  },
  nextStep: {
    sectionLabel: "TWO SENTENCES AT THE NEXT BOUNDARY",
    prompt:
      "The next time your child crosses a physical or behavioral boundary, use exactly two sentences — then act. Which boundary, and when might it happen?",
    helper: "No lectures. No threats. Hold the line with your body and presence.",
    placeholder: "The boundary and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "Same boundary. One teaches isolation. One teaches they are not alone.",
      "Next up: real-life scenarios — leaving the house, screen time, sibling conflict.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 2.6.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_2_6_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-2-6-reflection",
  lessonId: "2.6",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Theory is beautiful when your child is calm. At 5 PM on a Tuesday — shoes, iPad, sibling war — the model lives or dies. This is Module 2's last lesson: taking connection-first and protective boundaries into the chaos.",
      "Pick one scenario. One protocol. Take 5–10 minutes, or pause and come back. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — YOUR 48-HOUR MOMENT",
    prompt:
      "Think about the last 48 hours. When did your jaw clench — when you knew what to do but needed them to LISTEN?",
    helper:
      "Leaving the house? Screen turning off? Sibling fight? Hold that moment — we're rewriting it.",
    placeholder: "What happened and what did you reach for…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — YOUR TRIGGER SCENARIO",
    prompt: "Which of these three scenarios makes you lose your cool most often?",
    helper:
      "You're not practicing all three at once. Pick one. That's your commitment for Module 2.",
    options: ["Leaving the house", "Screen time transitions", "Sibling conflict"],
    followUpPrompt: "What comes up when you think about connection-first in that scenario?",
    followUpPlaceholder: "Late, dopamine loop, playing judge, 'I just need them to listen'…",
    secondFollowUpPrompt:
      "Have you ever used connection before instruction in that scenario — even once?",
    secondFollowUpPlaceholder: "Bridge before transition, timer warning, bridge not judge…",
  },
  scriptVoice: {
    sectionLabel: "03 — YOUR PROTOCOL & WORD",
    prompt:
      "For your trigger scenario, does the connection-first protocol feel possible — or impossible in the chaos?",
    helper:
      "Leaving: bridge → play → hold with presence. Screens: touch warning → timer → validate → hold. Siblings: bridge not judge → connect with flooded child → 'I won't let you' → separate with connection.",
    options: [
      "Yes — I can picture myself doing it",
      "Partly — one step feels reachable",
      "No — chaos still wins every time",
    ],
    followUpPrompt:
      "Write your key lines for that scenario — the scripts you'll actually say, in your voice.",
    followUpPlaceholder: "Your connect, validate, and boundary lines…",
    embodimentPrompt:
      "Say your failsafe word out loud — bridge, safety, upstairs brain, or your own. Then: 'When this happens, my goal is to restore safety, not control.' What shifted?",
    embodimentPlaceholder: "Your word and what you felt…",
  },
  toneReflect: {
    sectionLabel: "04 — CONTROL OR SAFETY",
    prompt:
      "In your trigger scenario last time, was your goal to control your child — or to restore safety so their brain could cooperate?",
    helper:
      "Instructing from across the room? Grabbing the tablet? Playing judge? Not failure — data for choosing differently.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — WHEN CHAOS WINS",
    prompt:
      "What actually makes the old pattern win in your trigger scenario — not what should, but what does?",
    helper:
      "Running late, dopamine crash, sibling fairness, exhaustion, forgetting the protocol in the moment…",
    firstLabel: "What pulls you off the protocol",
    firstPlaceholder: "What actually happens at 5 PM on a Tuesday…",
    secondPrompt:
      "You'll forget in the moment — that's human. What's one piece of the protocol you'll commit to (not all steps)? What would you forgive yourself for?",
    secondPlaceholder: "One step + your failsafe word…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT (VISUALIZE)",
    intro:
      "Before bed tonight, visualize your trigger scenario. See yourself walking through it calmly — scripts, boundary without threat, failsafe word. Visualization wires your brain for the real moment.",
    helper: "Not magic. Practice. One scenario. One protocol.",
    fields: [
      {
        id: "trySituation",
        label: "Scenario:",
        placeholder: "Which trigger — and when might it happen next?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will you feel in your body when it starts? (jaw, heat, urgency…)",
      },
      {
        id: "tryRegulate",
        label: "Step 1 you'll try:",
        placeholder: "Bridge / touch warning / bridge not judge — your first move",
      },
      {
        id: "tryConnectSupport",
        label: "Key lines + failsafe word:",
        placeholder: "Your scripts and the one word that pulls you back",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage one step:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "If you forget the protocol in the moment — what is true and kind?",
        placeholder: "Optional — forgetting isn't failure…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "MODULE 2 — WHAT SHIFTED",
    prompt: "Mark what feels true for you right now:",
    options: [
      "I know my trigger scenario — and I'm committing to one",
      "Reasoning fails when the upstairs brain is offline — that landed",
      "Attachment → Safety → Cooperation — I can use this in chaos",
      "Connection before instruction — I have a protocol for my scenario",
      "Protective boundaries — 'I won't let you' — feel closer to reachable",
      "I have a failsafe word and scripts in my own voice",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to carry into Module 3:",
    detailPlaceholder: "Restore safety, not control.",
  },
  nextStep: {
    sectionLabel: "ONE SCENARIO — ONE PROTOCOL",
    prompt:
      "The next time your trigger scenario happens, you will use the connection-first protocol — not all three scenarios, just this one. When might that be?",
    helper:
      "Your failsafe word. One step if that's all you manage. Keep practicing one moment at a time.",
    placeholder: "My scenario, when, and my first step…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You completed Module 2. Not perfect — more connected. That changes everything.",
      "Module 3 goes deeper into your nervous system — triggers, repair, becoming the anchor when you're exhausted.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Module 3.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_1_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-1-reflection",
  lessonId: "3.1",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "tiny-win",
    "the-gap",
    "tone-reflect",
    "obstacle-pair",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Think about the last bribe or reward you used — cookie, tablet time, 'stop crying and you get a treat.' Not guilt. Notice: did it work in the moment? What happened next time?",
      "Module 3 is about building a child who can motivate themselves — not one who behaves only when you're watching. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — BRIBES, REWARDS & PATTERNS",
    prompt:
      "Think about the last bribe or reward system you used — sticker chart, negotiation, 'if you… then…' What happened in the moment? What happened the next time?",
    helper:
      "Where have you turned something they might have done willingly into a transaction? If you tracked bribes and threats this week, what patterns emerged?",
    placeholder: "Write what you noticed — no judgment, just data…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE CORE INSIGHT",
    reframe: "External motivation collapses\nwithout supervision.",
    prompt:
      "Have you ever had a system that worked for a week — then fell apart, needed bigger rewards, or made meltdowns worse?",
    options: [
      "I noticed this playing out in my own parenting this week",
      "I understood it intellectually but didn't catch myself in the moment",
      "I'm still sitting with it — it's shifting how I see motivation",
    ],
  },
  tinyWin: {
    sectionLabel: "03 — THREE-DAY OBSERVATION",
    prompt: "Did you track your bribes and threats this week?",
    options: [
      "Yes — I noticed several",
      "I noticed a few but didn't track",
      "I noticed after the fact (awareness is the first win)",
      "I haven't started yet",
    ],
  },
  theGap: {
    sectionLabel: "04 — WHERE I GOT STUCK",
    prompt: "What was the hardest part of this shift for me?",
    helper: "Choose everything that fits. Honesty here is more useful than a flattering answer.",
    options: [
      "Letting go of the 'quick fix' of a bribe in a stressful moment",
      "Trusting that my child will cooperate without external motivation",
      "Not knowing what to replace the reward/punishment with yet",
      "Feeling judged by others who use these systems",
    ],
    detailPrompt: "Something else:",
    detailPlaceholder: "Optional",
  },
  toneReflect: {
    sectionLabel: "05 — CONTROL OR CAPABILITY",
    prompt:
      'The lesson offered this reframe: "Your goal is not to control behavior. Your goal is to build a person who can control themselves." What happened inside you when you read that?',
    helper:
      "Relief — ready to put down the weight of controlling? Overwhelming — 'If I don't control them, what will happen?' Both are valid starting points.",
    placeholder: "Write what arose — relief, fear, both…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE QUICK FIX",
    prompt:
      "What actually makes you reach for a bribe or threat in a stressful moment — not what should, but what does?",
    helper: "Running late, public meltdown, exhaustion, not knowing another way yet…",
    firstLabel: "What pulls you toward external motivation",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "When you catch yourself reaching for a bribe, what do you notice in your body? What is one pause you could try instead — even noticing counts?",
    secondPlaceholder: "Tight chest, urgency, heat — and one small pause…",
    maxLength: 400,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "External motivation collapses without supervision — that landed",
      "I see where rewards hijacked intrinsic motivation",
      "I noticed my bribe-and-threat patterns this week",
      "The control vs capability reframe shifted something for me",
      "I'm clearer on what I was building — compliance or character",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Build capability, not compliance when watched.",
  },
  nextStep: {
    sectionLabel: "THREE-DAY OBSERVATION",
    prompt:
      "For the next three days, watch for bribes and threats. When you catch one: note the situation and what you felt in your body. NOTICED or PAUSED — which will you aim for first?",
    helper: "Awareness is the first win. You don't need to replace the system yet — just see it.",
    placeholder: "What I'll watch for and when…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You weren't doing something wrong. You were doing something ineffective long-term.",
      "Next up: what actually works instead of rewards and punishment.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.2.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_2_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-2-reflection",
  lessonId: "3.2",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "If you don't use rewards or punishment — what do you use when they flat-out refuse? Today: Autonomy, Competence, and Meaning — the three needs behind intrinsic motivation.",
      "Manager gets compliance. Witness builds self-direction. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — MANAGER OR WITNESS",
    prompt:
      "Think about the last time your child resisted a task — homework, chores, getting ready. Did you show up as Manager or Witness?",
    helper:
      "Manager: do it this way, here's the reward, here's the consequence. Witness: I see you, I'm curious how your brain works.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — AUTONOMY, COMPETENCE, MEANING",
    prompt: "Which of these three needs feels hardest to speak to when your child resists?",
    helper:
      "Autonomy: choice and agency. Competence: capable and effective. Meaning: connected to something bigger than the task.",
    options: [
      "Autonomy — choice and agency",
      "Competence — capable and effective",
      "Meaning — why this matters",
    ],
    followUpPrompt: "What comes up when you think about that need in your child's last resistance?",
    followUpPlaceholder: "Blocked choice, feeling stupid, 'why does this matter'…",
    secondFollowUpPrompt: "Have you ever pivoted to curiosity instead of evaluation — even once?",
    secondFollowUpPlaceholder: "'I notice…' instead of 'Good job' — a small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — THE CURIOSITY PIVOT",
    prompt:
      'Instead of "Good job" or "If you don\'t…," the lesson offered observation: "I notice…" Could you reach for that in a real moment?',
    helper:
      "Evaluation creates pressure. Observation creates connection. No reward. No threat. Just noticing.",
    options: [
      "Yes — I can picture saying 'I notice…'",
      "Partly — I'd need my own words",
      "No — praise and threats still feel automatic",
    ],
    followUpPrompt:
      "Write an 'I notice…' line about something your child did recently — no evaluation, no judgment.",
    followUpPlaceholder: "I notice you…",
    embodimentPrompt:
      "Say your 'I notice…' line out loud. Then say 'Good job' about the same thing. What shifted in your body — performance or discovery?",
    embodimentPlaceholder: "What felt different…",
  },
  toneReflect: {
    sectionLabel: "04 — FAST OR DURABLE",
    prompt:
      "When you watched the Witness approach — validate, reduce scope, reframe for curiosity — did part of you think 'That's too much work at 5 PM'?",
    helper:
      "The Old Way feels faster in the moment. The Neuroscience Way builds self-motivation over time. You're choosing a trajectory, not a technique.",
    placeholder: "Write what you notice — urgency, hope, both…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE MANAGER REFLEX",
    prompt:
      "What actually makes you jump in, prompt, remind, nudge, or manage — not what should, but what does?",
    helper:
      "Running late, fear they won't do it, your own Manager upbringing, discomfort with waiting…",
    firstLabel: "What pulls you toward managing",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For a 10-Minute Autonomy Window tonight: what is a good-enough version if you only witness and don't solve? What would you forgive yourself for?",
    secondPlaceholder: "Realistic, messy, and kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT: 10-MINUTE AUTONOMY WINDOW",
    intro:
      "Pick one task your child usually resists. Remove all rewards and threats for ten minutes. Use the Curiosity Pivot — witness, don't manage.",
    helper: "Not the ideal version. Sitting in the discomfort of not taking over is the practice.",
    fields: [
      {
        id: "trySituation",
        label: "Task:",
        placeholder: "Clearing table, homework, bath — which one tonight?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to reward, threaten, or jump in?",
      },
      {
        id: "tryRegulate",
        label: "Curiosity Pivot:",
        placeholder: "\"I'm curious — what's your plan for getting this done?\"",
      },
      {
        id: "tryConnectSupport",
        label: "If they say 'I don't have one':",
        placeholder: "\"Let's watch the clock for two minutes. I'm curious what you'll decide.\"",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage one 'I notice…':",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "When the urge to take over hits — what is true and kind?",
        placeholder: "Optional — waiting is harder than managing…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Autonomy, Competence, Meaning — I see the three needs",
      "Manager vs Witness — that distinction landed",
      "Evaluation vs observation — 'I notice' feels reachable",
      "I felt the difference between performance and discovery mindset",
      "I have a 10-Minute Autonomy Window planned for tonight",
      "The Old Way feels faster — and I see the long-game trade-off",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Witness, don't manage.",
  },
  nextStep: {
    sectionLabel: "ONE TASK — TEN MINUTES",
    prompt:
      "Tonight: one resistant task, ten minutes, no rewards or threats. Curiosity Pivot only. Which task?",
    helper:
      "Don't solve it. Don't prompt. Just witness. What will be harder — the waiting or the urge to take over?",
    placeholder: "My task and when I'll try it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're not choosing a technique. You're choosing a trajectory.",
      "Next up: speaking to Autonomy, Competence, and Relatedness when they refuse.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.3.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_3_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-3-reflection",
  lessonId: "3.3",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "When you're the engine, your child is the passenger — and passengers don't build motivation. Today: The Motivation Shift — from being told to choosing to act.",
      "Either/Or Framing: same non-negotiable outcome, choice in the how. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper: "Not how you think you should feel. Just an honest check-in before you reflect.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — ENGINE OR GUIDE",
    prompt:
      "Think of one task your child resists. When you push them through it, are you the engine — or helping them turn on their own?",
    helper:
      "What would it look like if they owned it? Not whether the task happens — who provides the drive.",
    placeholder: "The task and who has been the engine…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — THE THREE PILLARS IN THE FRAME",
    prompt:
      "Either/Or Framing hits Autonomy, Competence, and Meaning. Which pillar is hardest for you to build into a real script?",
    helper:
      "Autonomy: choice in the how. Competence: 'I can do this.' Meaning: why it matters to them, not just to you.",
    options: [
      "Autonomy — offering real choice in the how",
      "Competence — making it feel achievable or skill-based",
      "Meaning — connecting to fun, challenge, or their why",
    ],
    followUpPrompt: "What comes up when you think about framing instead of commanding?",
    followUpPlaceholder: "Takes too long, they'll pick wrong, I need it done now…",
    secondFollowUpPrompt:
      "Have you ever used 'Do you want A or B?' when both lead to the same outcome — even once?",
    secondFollowUpPlaceholder: "Race to door, beat your record, monkey vs rocket…",
  },
  scriptVoice: {
    sectionLabel: "03 — YOUR EITHER/OR FRAME",
    prompt:
      'Formula: "We need to [task]. Do you want to [Option A] or [Option B]?" Write one for a transition that is usually a power struggle. Does it feel possible?',
    helper: "You're not being permissive. The expectation stays. You're changing the entry point.",
    options: [
      "Yes — I can picture saying that",
      "Partly — I'd need to tweak the options",
      "No — commands still feel faster and safer",
    ],
    followUpPrompt:
      "Write your Either/Or Frame for that transition — both options must reach the same necessary outcome.",
    followUpPlaceholder: "We need to… Do you want to… or…?",
    embodimentPrompt:
      "Say your frame once flat: 'Go do it now.' Then once warm and curious with your Either/Or. What shifted in your body — pressure or partnership?",
    embodimentPlaceholder: "Tone is 80% of the message…",
  },
  toneReflect: {
    sectionLabel: "04 — COMMAND OR PARTNERSHIP",
    prompt:
      "Compare: 'Go clean your room' versus 'Let's figure out the game plan — LEGOs or books first?' Which tone does your child usually get in power-struggle transitions?",
    helper:
      "The first creates pressure. The second creates partnership. Not what you intend — what lands.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE DIRECT COMMAND",
    prompt:
      "What actually makes you skip the frame and give a direct command — not what should, but what does?",
    helper: "Running late, fear they'll refuse both options, habit, your own parents' voice…",
    firstLabel: "What pulls you toward commanding",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Given that, what is a good-enough Either/Or for one transition tonight? What would you forgive yourself for if the tone isn't perfect?",
    secondPlaceholder: "Realistic options + kind to future-you…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT: EITHER/OR ONCE",
    intro:
      "Pick one power-struggle transition — bedtime, dinner, leaving, homework. Once tonight, replace the command with your Either/Or Frame. Watch their face.",
    helper: "Just once. Same outcome. Choice in the how.",
    fields: [
      {
        id: "trySituation",
        label: "Transition:",
        placeholder: "Bedtime, leaving the park, homework — which one tonight?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to command instead of frame?",
      },
      {
        id: "tryRegulate",
        label: "Either/Or Frame:",
        placeholder: "We need to [task]. Do you want to [A] or [B]?",
      },
      {
        id: "tryConnectSupport",
        label: "Pillar you're targeting:",
        placeholder: "Autonomy, Competence, or Meaning — how does your frame speak to it?",
      },
      {
        id: "tryMinimumStep",
        label: "If they hesitate — what will you do without threatening?",
        placeholder: "Wait, re-offer, stay calm…",
      },
      {
        id: "trySelfCompassion",
        label: "If they refuse both options — what is true and kind?",
        placeholder: "Optional — that's what the next lesson is for…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Engine vs guide — that shift landed",
      "Autonomy, Competence, Meaning — I see them in the Frame",
      "Either/Or Framing feels closer to reachable",
      "I felt command tone vs partnership tone in my body",
      "I wrote an Either/Or for a real power struggle",
      "I have one transition picked for tonight",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Hand them the key, don't drag them along.",
  },
  nextStep: {
    sectionLabel: "ONE TRANSITION — ONE FRAME",
    prompt:
      "Tonight: one power-struggle transition, one Either/Or Frame, no direct command. Which transition?",
    helper: "Watch their face. Resistance to decision-making is data — not failure.",
    placeholder: "My transition and my A/B options…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're moving from being the engine to being the guide.",
      "Next up: when they refuse both options — firm without breaking their drive.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.4.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_4_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-4-reflection",
  lessonId: "3.4",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Every time you answer a question your child could answer themselves, you rescue — and their prefrontal cortex gets less practice. Agency begets agency.",
      "Three language shifts: now or later, what's your plan, what's your job here. Pick one to practice. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE NOW",
    prompt: "Right now, how regulated do you feel?",
    helper:
      "Before you ask 'What's your plan?' — check your nervous system. Curiosity or skepticism? They feel the difference.",
    min: 1,
    max: 10,
    minLabel: "Very flooded",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Only if it helps to name it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHERE YOU RESCUE",
    prompt:
      "Where in your household do you answer questions your child could answer themselves — 'What should I play with?' 'What's for snack?' 'When should I do homework?'",
    helper:
      "Not judgment — awareness. Every rescue is one less chance to build their neural architecture for independence.",
    placeholder: "Write what you noticed…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — YOUR PRACTICE SCRIPT",
    prompt: "Pick one script to practice for the next three days — just one.",
    helper: "Autonomy: now or later. Competence: what's your plan. Meaning: what's your job here.",
    options: [
      "Autonomy — 'Do you want to start now or later?'",
      "Competence — 'What's your plan?'",
      "Meaning — 'What's your job here?'",
    ],
    followUpPrompt:
      "What comes up when you think about handing the question back instead of answering?",
    followUpPlaceholder: "Urge to rescue, fear they'll fail, it'll take too long…",
    secondFollowUpPrompt: "Have you ever used one of these scripts — even once, even imperfectly?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "03 — YOUR SCRIPT IN CONTEXT",
    prompt: "Write your chosen script for a real moment in your home — the exact words you'll use.",
    helper:
      "If they say 'neither' to now/later: 'Those are the two options. I can choose for you.' If bored: 'What's your plan for that?'",
    options: [
      "Yes — I have a specific moment in mind",
      "Partly — I need to find the right situation",
      "No — answering still feels automatic",
    ],
    followUpPrompt:
      "Write the full exchange — your script and what you'll do when you want to jump in and rescue.",
    followUpPlaceholder: "Your script in your voice…",
    embodimentPrompt:
      "Say your script out loud once from skepticism ('figure it out yourself') and once from genuine curiosity. What shifted?",
    embodimentPlaceholder: "They answer the question in your tone…",
  },
  toneReflect: {
    sectionLabel: "04 — RESCUE OR HAND BACK",
    prompt:
      "Recall 'I'm bored' or a similar moment. Did you rescue with a list of options — or hand it back with 'What's your plan?' What happened?",
    helper:
      "Rescue teaches: you solve my problems and I still feel powerless. Handing back builds autonomy, competence, and meaning.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE URGE TO ANSWER",
    prompt: "What actually makes you answer, solve, or rescue — not what should, but what does?",
    helper:
      "Faster in the moment, fear of meltdown, don't trust they can figure it out, your Manager reflex…",
    firstLabel: "What pulls you toward rescuing",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For three days with your one script: what is good-enough if you hand it back once and bite your tongue? What will you forgive yourself for?",
    secondPlaceholder: "One hand-back counts. Waiting is the practice…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY TONIGHT",
    intro:
      "Two parts tonight: use your practice script once, and at dinner or bedtime ask — 'What's something you figured out on your own today?' Listen. Don't add. Don't evaluate.",
    helper: "I see you as capable. I trust you. Your agency matters — more than any sticker chart.",
    fields: [
      {
        id: "trySituation",
        label: "Script moment:",
        placeholder: "When will you use your chosen script tonight?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to answer, list options, or take over?",
      },
      {
        id: "tryRegulate",
        label: "Your script:",
        placeholder: "The exact line you'll say — now/later, plan, or job",
      },
      {
        id: "tryConnectSupport",
        label: "Capability conversation:",
        placeholder: "'What's something you figured out on your own today?' — then just listen",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage the question:",
        placeholder: "What still counts as enough?",
      },
      {
        id: "trySelfCompassion",
        label: "If the discomfort of not answering is intense — what is true and kind?",
        placeholder: "Optional — tolerating discomfort builds their capacity…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "MODULE 3 — WHAT SHIFTED",
    prompt: "Mark what feels true for you right now:",
    options: [
      "External motivation collapses without supervision — I see it",
      "Autonomy, Competence, Meaning — the three needs landed",
      "I chose one agency script to practice for three days",
      "Agency begets agency — I'm willing to stop rescuing",
      "I felt curiosity vs skepticism when handing questions back",
      "I had the 'figured out on your own' conversation planned",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to carry forward:",
    detailPlaceholder: "Build a person, not manage behavior.",
  },
  nextStep: {
    sectionLabel: "THREE DAYS — ONE SCRIPT",
    prompt:
      "For the next three days, use only your chosen script in its situations. Which script, and when will you start?",
    helper:
      "What will be harder — the waiting, or the urge to rescue? Bite your tongue. Trust the process.",
    placeholder: "My script and my first moment…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "From control to trust. From external motivation to internal drive.",
      "Next up: when 'I can't' means the cognitive load is too high.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.5.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_5_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-5-reflection",
  lessonId: "3.5",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "loop-break",
    "noticing",
    "obstacle-pair",
    "tone-reflect",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "When they collapse over 'clean your room' or homework — their brain sees a mountain, not small steps. That's cognitive load, not laziness.",
      "Three strategies: break tasks, find entry points, reduce friction. Pick one to practice. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHEN THEY SAID 'I CAN'T'",
    prompt:
      "Think about the last time your child melted down over a task that seemed reasonable to you. What happened in your body?",
    helper:
      "What story did you tell yourself — dramatic, manipulating, lazy? No judgment. That story shaped your response.",
    min: 1,
    max: 10,
    minLabel: "Very activated",
    maxLabel: "Steady and calm",
    followUpPrompt: "Optional: what was present in you at that number?",
    followUpPlaceholder: "Frustration, disbelief, heat, urgency…",
    followUpOptional: true,
  },
  loopBreak: {
    sectionLabel: "01 — THE STRATEGY I PRACTICED",
    prompt: "This week, I focused on one resistance-reduction strategy:",
    helper: "Just one — not all three. The one most doable for you right now.",
    options: [
      "Breaking Tasks — smallest possible first step",
      "Entry Points — 'Let's just [tiny first step]'",
      "Friction Reduction — change the environment",
    ],
    followUpPrompt:
      "For a task your child resists, what is your 'let's just' entry point or friction fix?",
    followUpPlaceholder: "Red Legos in the bin, read first problem, shoes by the door…",
    secondFollowUpPrompt:
      "Have you moved toward them instead of calling from across the room — even once?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  noticing: {
    sectionLabel: "02 — WHAT I NOTICED",
    prompt:
      "Describe one moment this week where you used your chosen strategy — or could have. What happened? How did your child respond?",
    helper: "You're not lowering expectations. You're lowering the barrier to entry.",
    placeholder: "Write what you noticed…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "03 — WHERE I GOT STUCK",
    prompt:
      "Describe a moment you knew you could reduce resistance — but gave the big ask or called from across the room anyway.",
    helper: "When you're rushed, tired, or you've asked ten times. No shame — data.",
    firstLabel: "What happened",
    firstPlaceholder: "The task, what you said, how they responded…",
    secondPrompt: "What was happening in you in that moment?",
    secondPlaceholder: "Rushed, depleted, story about defiance…",
    maxLength: 400,
  },
  toneReflect: {
    sectionLabel: "04 — OVERWHELM OR DEFIANCE",
    prompt:
      "Looking at your child's resistance this week: how often was it overwhelm versus defiance? If you misread overwhelm as defiance — what would have shifted?",
    helper:
      "When they say 'I can't,' they're often saying: the cognitive load is too high. Be their external prefrontal cortex.",
    placeholder: "Write what you notice…",
    maxLength: 500,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Cognitive load — 'I can't' often means overwhelmed, not lazy",
      "I chose one strategy: break, entry point, or friction",
      "I noticed a moment where a smaller step changed the response",
      "I see when I call commands from across the room",
      "Overwhelm vs defiance — that distinction is shifting for me",
      "I have a 'let's just' first step ready for a resisted task",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember this week:",
    detailPlaceholder: "Lower the barrier, not the expectation.",
  },
  nextStep: {
    sectionLabel: "05 — ONE INTENTION FOR NEXT WEEK",
    prompt:
      "What's one task your child regularly resists? What's the smallest possible first step you'll offer next time?",
    helper:
      "Say it out loud: 'This week, I'm going to practice ___.' That's your commitment — to yourself.",
    placeholder: "The task and the smallest first step…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "Starting is one skill. Finishing is another — both are built by how you show up alongside them.",
      "Next up: supporting follow-through when motivation fades.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.6.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_6_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-6-reflection",
  lessonId: "3.6",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "They started — then stalled. Jump in and solve, or coach with pressure? Today: stay present without taking over. Ask instead of tell.",
      "Two scripts: 'What's your next step?' and 'How can I support you?' Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — BEFORE YOU SPEAK",
    prompt: "Right now, how regulated do you feel — enough to ask with warmth, not an edge?",
    helper:
      "If you ask with impatience, 'What's your next step?' becomes a test. Check your nervous system first.",
    min: 1,
    max: 10,
    minLabel: "Too activated to ask well",
    maxLabel: "Calm enough for curiosity",
    followUpPrompt: "Optional: what is present in you at that number?",
    followUpPlaceholder: "Urge to fix, frustration, genuine calm…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE MID-TASK COLLAPSE",
    prompt:
      "Think about the last time your child started a task — then stalled three minutes later. What did you do?",
    helper: "Take over? Coach with pressure? Stepping in too early robs them of competence.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — ASKING OR TELLING",
    prompt: "When your child is stuck, what do you usually do first?",
    helper:
      "Scaffolding: enough support to make it possible — not so much that you do the thinking for them.",
    options: [
      "Take over — 'Here, let me show you'",
      "Coach with pressure — 'Come on, you know this'",
      "Tell them the next step",
      "Ask — 'What's your next step?' or 'How can I support you?'",
    ],
    followUpPrompt: "What comes up when you think about not rescuing — just asking?",
    followUpPlaceholder: "Faster to do it myself, they'll never finish, they'll fail…",
    secondFollowUpPrompt: "Have you asked instead of told — even once — when they got stuck?",
    secondFollowUpPlaceholder: "Sat beside them while they tried…",
  },
  scriptVoice: {
    sectionLabel: "03 — THE TWO SCRIPTS",
    prompt:
      "Could you say these when they're stuck — with genuine trust, not frustration? 'What's your next step?' and 'How can I support you?'",
    helper:
      "Supporting says: I trust you to know what you need. Directing says: I know what's best for you.",
    options: [
      "Yes — both could sound like me when I'm calm",
      "Partly — one feels easier than the other",
      "No — telling or rescuing still feels automatic",
    ],
    followUpPrompt:
      "Write both lines for a task they often stall on — homework, chores, getting ready.",
    followUpPlaceholder: "What's your next step… / How can I support you…",
    embodimentPrompt:
      "Say 'What's your next step?' once with an edge, once with warmth. What shifted — test or trust?",
    embodimentPlaceholder: "Practice calm so it's available when things get hard…",
  },
  toneReflect: {
    sectionLabel: "04 — SUPPORTING OR DIRECTING",
    prompt:
      "When your child is struggling, do you usually ask what they need — or tell them what you think they need?",
    helper: "The child who said 'Can you just sit here while I try?' needed presence, not answers.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — THE URGE TO TAKE OVER",
    prompt: "What actually makes you solve it for them — not what should, but what does?",
    helper: "It's faster, dinner is burning, you can't watch them struggle…",
    firstLabel: "What pulls you toward rescuing",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For the next stall: pause, breathe, ask once, sit beside them. What would you forgive yourself for?",
    secondPlaceholder: "Presence without answers counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "06 — TRY AT THE NEXT STALL",
    intro:
      "Plan for the next mid-task collapse. Only these two questions — no telling, no rescuing.",
    helper: "The goal is possible, not easy — so they experience their own competence.",
    fields: [
      {
        id: "trySituation",
        label: "Situation:",
        placeholder: "Homework, chores, getting ready — when might they stall?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to show, fix, or pressure?",
      },
      {
        id: "tryRegulate",
        label: "Pause:",
        placeholder: "Breath, check tone — before you speak",
      },
      {
        id: "tryConnectSupport",
        label: "Your two questions:",
        placeholder: "What's your next step? / How can I support you?",
      },
      {
        id: "tryMinimumStep",
        label: "If they say 'I don't know':",
        placeholder: "What's the first thing the problem is asking?",
      },
      {
        id: "trySelfCompassion",
        label: "If you slip and take over — what is true and kind?",
        placeholder: "Optional — try again at the next step…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Scaffolding — present without taking over — that landed",
      "I know whether I usually tell or ask when they're stuck",
      "The two scripts feel closer when I'm calm",
      "I felt asking with an edge vs warmth in my body",
      "Supporting vs directing — that distinction is shifting",
      "I have a plan for the next mid-task stall",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Ask instead of tell.",
  },
  nextStep: {
    sectionLabel: "THREE DAYS — TWO QUESTIONS ONLY",
    prompt:
      "For three days when they get stuck: only 'What's your next step?' and 'How can I support you?' Which task?",
    helper: "When my child gets stuck, I will pause, breathe, and ask.",
    placeholder: "The task and when you'll start…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You know how to start. Now you know how to stay present when motivation fades.",
      "Next up: homework, quitting, and boredom — real life.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 3.7.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_3_7_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-3-7-reflection",
  lessonId: "3.7",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "loop-break",
    "moment-try",
    "tone-reflect",
    "obstacle-pair",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Homework, quitting, or 'I'm bored' — the moment your stomach clenches. Today: no theory. Scripts, steps, and what to say when stakes feel high.",
      "Pick one scenario. Write your plan. This is Module 3's capstone. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHAT'S UNDERNEATH",
    prompt:
      "For your trigger scenario — what's at stake for you? Fear they'll fall behind? Become a 'quitter'? Your discomfort with their discomfort?",
    helper: "Your reactivity isn't random. Name what's underneath before you choose the scripts.",
    min: 1,
    max: 10,
    minLabel: "Very activated",
    maxLabel: "Steady enough to choose well",
    followUpPrompt: "Optional: what fear or story is driving that number?",
    followUpPlaceholder: "Money, time, your own history, the noise…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — YOUR STOMACH-CLENCH MOMENT",
    prompt:
      "Describe the last time this scenario showed up — homework sobbing, wanting to quit, endless boredom. What did you say or do?",
    helper: "Not judgment — data. Old way or new way? What happened next?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  loopBreak: {
    sectionLabel: "02 — YOUR TRIGGER SCENARIO",
    prompt: "Which scenario makes you question everything — and triggers you most?",
    helper: "You're preparing for one, not all three. Homework, quitting, or boredom.",
    options: ["Homework resistance", "Quitting an activity", "Boredom — 'I'm bored'"],
    followUpPrompt: "What comes up when you think about using the protocol instead of surviving?",
    followUpPlaceholder: "Fear, urgency, need to fill silence, rescue…",
    secondFollowUpPrompt:
      "Have you used any piece of the Module 3 toolkit in this scenario — even once?",
    secondFollowUpPlaceholder: "Now/later, what's your plan, let's just, what's your next step…",
  },
  momentTry: {
    sectionLabel: "03 — YOUR SCRIPTS & BOUNDARY",
    intro:
      "Pick your trigger scenario. Write: opening script, script when they resist, boundary you will hold. Keep it visible — fridge or phone notes.",
    helper: "You're not memorizing. You're preparing.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "When might homework, quitting, or boredom show up next?",
      },
      {
        id: "tryNotice",
        label: "Opening script:",
        placeholder:
          "Homework: now/later. Quitting: validate feeling. Boredom: 'What's your plan?'",
      },
      {
        id: "tryRegulate",
        label: "When they resist:",
        placeholder: "Next step / support / 'What's one thing you could try?' / get curious",
      },
      {
        id: "tryConnectSupport",
        label: "Boundary I will hold:",
        placeholder: "What I will not do — bribe, take over, list activities, force, fill silence…",
      },
      {
        id: "tryMinimumStep",
        label: "One friction fix (homework):",
        placeholder: "Optional — pencil ready, snack, clear workspace…",
      },
      {
        id: "trySelfCompassion",
        label: "If I slip into the old way — what is true and kind?",
        placeholder: "Optional — you can return to the script next time…",
      },
    ],
    maxLength: 300,
  },
  toneReflect: {
    sectionLabel: "04 — OLD WAY OR NEW WAY",
    prompt:
      "For your scenario: what is the hardest part — sitting in silence (homework), getting curious instead of 'no' (quitting), or tolerating boredom without rescuing?",
    helper:
      "Homework: conditions for capability, not doing it for them. Quitting: thoughtful decisions, not force. Boredom: not an emergency — invitation to creativity.",
    placeholder: "Write what you notice in yourself…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "05 — WHAT YOU WON'T DO",
    prompt: "What will you not do in this scenario — even when it's hard?",
    helper: "The boundary you hold is as important as the script you say.",
    firstLabel: "Boundary I will hold",
    firstPlaceholder: "Bribe, take over, list ten activities, 'no way you're quitting'…",
    secondPrompt:
      "When validation skipped — what were you afraid to hear? What would shift if you validated first?",
    secondPlaceholder: "Coach, friend, your push, solvable problem underneath…",
    maxLength: 400,
  },
  whatShifted: {
    sectionLabel: "MODULE 3 — WHAT YOU BUILT",
    prompt: "Mark what feels true for you right now:",
    options: [
      "External motivation collapses without supervision — I see it",
      "Autonomy, Competence, Meaning — the three needs landed",
      "Agency scripts — now/later, plan, job — are in my toolkit",
      "I can break tasks, find entry points, or reduce friction",
      "I ask instead of tell — next step, how can I support you",
      "I wrote scripts for homework, quitting, or boredom",
      "I'm moving from managing to trusting — not perfect, practicing",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to carry into Module 4:",
    detailPlaceholder: "From doing for to supporting alongside.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT",
    prompt:
      "Share a time you felt bored as a kid — what did you do? Ask what they might try next time. Or use your opening script if your scenario appears tonight.",
    helper: "Boredom is not an emergency. It's an invitation to creativity.",
    placeholder: "What I'll say and when…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You completed Module 3. From external motivation to internal drive. From doing for to supporting alongside.",
      "You're building a self-directed human being — not controlling behavior.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.1.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_1_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-1-reflection",
  lessonId: "4.1",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Think about the last time your child succeeded — a test, a game, a drawing. What came out of your mouth? If it was 'You're so smart!' or 'I'm so proud of you!' — you're normal. That's what most of us were taught.",
      "Today: not shame. Curiosity. What if that script accidentally wires fragility? Module 4 begins here. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — OPENNESS",
    prompt: "Right now, how open do you feel to questioning a praise script that sounds like love?",
    helper: "This can land uncomfortably. You don't have to agree yet — just notice where you are.",
    min: 1,
    max: 10,
    minLabel: "Very defensive or shut down",
    maxLabel: "Curious and willing to look",
    followUpPrompt: "Optional: what is present at that number?",
    followUpPlaceholder: "Protective, skeptical, tender, ready…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE LAST SUCCESS MOMENT",
    prompt:
      "Recall the last time your child brought you something they were proud of — a grade, a drawing, a win. What did you say? What did it feel like in the moment?",
    helper:
      "Not judgment — data. On the surface it may have felt like love. What might have gotten wired underneath?",
    placeholder: "Write what you actually said…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFRAME",
    reframe: "Performance-based identity\nis unstable.",
    prompt:
      "Your child gets an A+. You say 'You're so smart!' Six weeks later — a C. 'I guess I'm not a math person.' Does that arc feel familiar?",
    options: [
      "Yes — I've seen identity collapse after one hard moment",
      "I understand it intellectually but haven't noticed it live yet",
      "I'm still sitting with it — it's shifting how I hear my own praise",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — FRAGILITY OR CONDITIONAL WORTH",
    prompt:
      "Which pattern do you see more clearly — in your child, in yourself, or in how you were raised?",
    helper:
      "Fragility: avoid challenge because failure threatens identity. Conditional worth: love feels tied to what they produce.",
    options: [
      "Fragility — crumbling or avoiding when things get hard",
      "Conditional self-worth — scanning for external validation",
      "Both — they show up together for us",
      "I'm not sure yet — I'm still noticing",
    ],
    followUpPrompt:
      "Think back to your childhood. When you were praised for performance vs character — what felt different the next time?",
    followUpPlaceholder: "More pressure, more fear, or steadier…",
    secondFollowUpPrompt:
      "Did your parents' love ever feel conditional — grades, behavior, achievement?",
    secondFollowUpPlaceholder: "Only if you're willing to go there…",
  },
  scriptVoice: {
    sectionLabel: "04 — THREE ALTERNATIVE SCRIPTS",
    prompt: "Which script feels most reachable when your child succeeds next?",
    helper:
      "1) 'How do you feel about it?' 2) 'I noticed you…' (effort/strategy) 3) 'That shows…' (persistence, kindness, care)",
    options: [
      "How do you feel about it? — invite their own assessment",
      "I noticed you… — describe effort or strategy",
      "That shows… — connect to a stable quality",
    ],
    followUpPrompt: "Write your script for a real upcoming moment — the exact words.",
    followUpPlaceholder: "I noticed you kept going when fractions got tricky…",
    embodimentPrompt:
      "Say 'You're so smart!' once, then 'How do you feel about it?' What shifts in chest, throat, or shoulders — for you?",
    embodimentPlaceholder: "Evaluation vs invitation — notice the difference…",
  },
  toneReflect: {
    sectionLabel: "05 — LOVE OR CONDITIONALITY",
    prompt:
      "When you imagine dropping 'smart,' 'proud,' and 'good job' for observational language — what comes up? Cold? Loving? Awkward? Relieving?",
    helper:
      "The discomfort of not evaluating may be your brain unlearning a pattern taught to you. No shame — just awareness.",
    placeholder: "Write what you notice in your body and your story…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE URGE TO EVALUATE",
    prompt: "What actually pulls you toward performance praise — not what should, but what does?",
    helper: "It feels like love, you want them to feel good, you're proud, silence feels wrong…",
    firstLabel: "What pulls me toward 'smart' or 'proud'",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For 24 hours of observational language: what is good-enough if you slip once? What will you say to yourself that is true and kind?",
    secondPlaceholder: "Awkward doesn't mean cold. One 'I see that' counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — TRY IN THE NEXT SUCCESS MOMENT",
    intro:
      "Plan for the next time they succeed. No 'good,' 'smart,' 'best,' or 'proud.' Observational language only.",
    helper: "I see that. You did that. Tell me about this.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Next test, game, drawing, chore done well…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to evaluate or gush?",
      },
      {
        id: "tryRegulate",
        label: "Your script:",
        placeholder: "How do you feel about it? / I noticed you… / That shows…",
      },
      {
        id: "tryConnectSupport",
        label: "Observational backup:",
        placeholder: "I see that. / You did that. / Tell me about this.",
      },
      {
        id: "tryMinimumStep",
        label: "If you only manage one line:",
        placeholder: "Which observational phrase still counts?",
      },
      {
        id: "trySelfCompassion",
        label: "If it feels awkward or 'not enough' — what is true and kind?",
        placeholder: "Optional — you're building internal validation, not withholding love…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Performance-based identity is unstable — that landed",
      "I see the difference between praising what they do vs who they believe they are",
      "Fragility or conditional worth — I recognize a pattern",
      "I have an alternative script closer to my voice",
      "I felt the body difference between evaluation and invitation",
      "I'm willing to try 24 hours without smart/proud/good job",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Celebrate process and character — not fragile identity.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT — 24 HOURS",
    prompt:
      "For the next 24 hours: no 'good,' 'smart,' 'best,' or 'proud.' Use observational language. Say 'I see that' out loud once now — that's your practice.",
    helper: "It may feel awkward. That discomfort is unlearning — not being cold.",
    placeholder: "When I'll start and what I'll watch for…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You weren't doing something wrong. You were using a script that sounds like love.",
      "Celebrating without creating pressure — that's the shift.",
      "Next up: what happens in your child's brain when they fail.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.2.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_2_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-2-reflection",
  lessonId: "4.2",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Think about the last time your child failed — a test, a game, something they wanted to be good at. What story did they tell themselves: 'That was hard, but I can figure it out' — or 'I'm just not good at this'?",
      "Today: the Failure Ritual. A repeatable sequence for the red zone — so failure becomes information, not identity. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — BEFORE THE COLLAPSE",
    prompt:
      "Right now, how regulated do you feel — enough to witness a failure without fixing, lecturing, or panicking?",
    helper:
      "In the red zone, your child's brain reads your tone as safety or threat. Check yourself first.",
    min: 1,
    max: 10,
    minLabel: "Too activated to stay present",
    maxLabel: "Steady enough to be a witness",
    followUpPrompt: "Optional: what is present at that number?",
    followUpPlaceholder: "Urge to fix, fear, tenderness, calm…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE LAST FAILURE MOMENT",
    prompt:
      "Recall the last time your child failed or melted down over a mistake. What did you see in their face and body? What did you say or do?",
    helper:
      "Not judgment — data. Did they collapse into identity ('I'm not a math person') — and what might have wired that?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFRAME",
    reframe: "Failure is information,\nnot identity.",
    prompt:
      "When performance-based praise built a fragile identity, one C can feel like 'I'm not smart anymore.' Does that crash feel familiar in your home?",
    options: [
      "Yes — I've watched identity collapse after one hard moment",
      "I see the link to praise — I'm still connecting the dots",
      "I'm sitting with it — failure as data, not verdict",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — JUDGE OR WITNESS",
    prompt: "When your child is in the red zone of a mistake, what do you usually do first?",
    helper:
      "Judge: fix, lecture, minimize, reassure with empty praise, panic. Witness: stay, validate, get curious.",
    options: [
      "Fix it — show them how, take over, solve",
      "Reassure — 'You're still smart' or 'It doesn't matter'",
      "Lecture — explain what they should have done",
      "Shut down or panic — I don't know what to say",
      "Witness — validate, then get curious",
    ],
    followUpPrompt:
      "Which story did your child tell — 'I can figure this out' or 'I'm not good at this'? What might have shaped that?",
    followUpPlaceholder: "Their words, your response, the tone in the room…",
    secondFollowUpPrompt:
      "Have you ever stayed present without fixing — even once — when they failed?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "04 — THE FAILURE RITUAL SCRIPTS",
    prompt: "Which line feels most reachable when they're in the red zone?",
    helper: "Pause → Connect → Separate identity → Curiosity → Forward. Pick one anchor script.",
    options: [
      "Connect — 'That sounds really hard. I'm here.'",
      "Separate — 'One mistake doesn't tell us who you are.'",
      "Curiosity — 'Tell me what happened. What was the hardest part?'",
      "Forward — 'What do you want to try next?'",
    ],
    followUpPrompt:
      "Write your Failure Ritual in order — 2–4 lines for a real scenario (test, game, meltdown).",
    followUpPlaceholder: "Pause… That sounds hard… What was hardest… What next…",
    embodimentPrompt:
      "Say 'Don't worry, you're still smart' once, then 'That sounds really hard — tell me what happened.' What shifts — judge or witness?",
    embodimentPlaceholder: "Notice chest, throat, shoulders — for you and for them…",
  },
  toneReflect: {
    sectionLabel: "05 — WHAT THEY READ IN YOU",
    prompt:
      "When your child fails, what do they read in your face and tone — safety or threat? What did you learn about failure growing up?",
    helper:
      "If failure meant losing connection, they'll safety-seek through performance — or avoid trying altogether.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE URGE TO FIX OR REASSURE",
    prompt:
      "What actually pulls you toward fixing, lecturing, or empty reassurance — not what should, but what does?",
    helper:
      "You can't stand their pain, you're scared for their future, you need them to feel better now…",
    firstLabel: "What pulls me away from the ritual",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For the next failure moment: pause, one connect line, one curious question. What is good-enough? What will you forgive yourself for?",
    secondPlaceholder: "Staying present without fixing counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — PLAN THE NEXT COLLAPSE",
    intro:
      "Plan your Failure Ritual for the next mistake, meltdown, or slumped-shoulder moment. Witness, not judge.",
    helper: "Information, not identity. Connection before correction.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Bad grade, lost game, homework meltdown, quitting mid-task…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to fix, praise away, or lecture?",
      },
      {
        id: "tryRegulate",
        label: "Pause:",
        placeholder: "One breath before you speak — check your tone",
      },
      {
        id: "tryConnectSupport",
        label: "Connect + curious:",
        placeholder: "That sounds hard… / Tell me what happened / What was hardest?",
      },
      {
        id: "tryMinimumStep",
        label: "Separate identity:",
        placeholder: "One line: one mistake ≠ who you are",
      },
      {
        id: "trySelfCompassion",
        label: "If you slip into fixing — what is true and kind?",
        placeholder: "Optional — you can return to witness mode next time…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Failure is information, not identity — that landed",
      "I see judge vs witness when they're in the red zone",
      "I connect fragile identity from praise to collapse after failure",
      "I have a Failure Ritual sequence closer to my voice",
      "I felt the difference between fixing and witnessing in my body",
      "I have a plan for the next failure moment",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Shape the story: hard, not hopeless.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT — NORMALIZE STRUGGLE",
    prompt:
      "At dinner: ask 'What was something today that was hard? What did you do when it got hard?' Share your own struggle first if they hesitate.",
    helper: "Decouple performance from connection. Struggle is normal — not an emergency.",
    placeholder: "What you'll ask and what you might share…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You removed pressure from praise. Now you're learning to meet collapse without making it identity.",
      "Failure can become information — when you're a witness, not a judge.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.3.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_3_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-3-reflection",
  lessonId: "4.3",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Every child will fail. Not every child learns the same thing from it. Today: identity collapse, avoidance loops, and the two stories — 'I'm not good at this' vs 'This was hard, but I can figure it out.'",
      "If this stirs something uncomfortable — that's an old wound being examined. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHERE YOU ARE",
    prompt:
      "Right now, how present do you feel — enough to look at failure without rushing past it?",
    helper:
      "This isn't light work. Feeling heavy after this lesson is okay. You're deciding whether to pass an old pattern on.",
    min: 1,
    max: 10,
    minLabel: "Very flooded or shut down",
    maxLabel: "Present enough to reflect honestly",
    followUpPrompt: "Optional: what is present at that number?",
    followUpPlaceholder: "Heavy, tender, defensive, ready…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHAT I NOTICED",
    prompt:
      "Describe one moment this week when your child failed at something — a test, a game, something they tried. What did you do and say? How did they respond?",
    helper: "Not judgment — data. Did they collapse into identity or stay curious?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — TWO PATHWAYS",
    reframe: "Identity collapse\nor growth frame.",
    prompt:
      "Fixed frame: 'I don't have it — avoid.' Growth frame: 'That didn't work — what next?' Which pathway did your child take in that moment?",
    options: [
      "Identity collapse — 'I'm a failure' / 'I'm not good at this'",
      "Avoidance — quit, refused, or 'I don't care' (self-protection)",
      "Growth frame — disappointment, but stayed curious",
      "I'm still noticing — hard to tell yet",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — THE SHIFT I PRACTICED",
    prompt: "Which shift did you focus on this week — or want to focus on next?",
    helper: "Avoidance isn't laziness. It's self-protection from identity collapse.",
    options: [
      "Separate identity from problem — 'The problem isn't you. The problem is…'",
      "Reframe failure as data — 'This is just information.'",
      "Problem-solve with curiosity — 'What was the hardest part?'",
      "Share my own failure with my child",
    ],
    followUpPrompt:
      "Do you see avoidance in your child — quitting when hard, refusing to try, 'I don't care'?",
    followUpPlaceholder: "What might their brain be protecting…",
    secondFollowUpPrompt:
      "When you failed as a child — did identity collapse? Who taught you failure meant something about your worth?",
    secondFollowUpPlaceholder: "Only if you're willing to go there…",
  },
  scriptVoice: {
    sectionLabel: "04 — GROWTH-FRAME SCRIPTS",
    prompt: "Which script feels most reachable at the next setback?",
    helper: "Name feeling → separate identity → reframe as data → curious problem-solving.",
    options: [
      "Name + separate — 'That's disappointing. Let's figure out what was hard.'",
      "Data — 'This is just information. What is it telling us?'",
      "Curiosity — 'What was the hardest part? What would help next time?'",
    ],
    followUpPrompt:
      "Write your full script for a real scenario — word problems, lost game, meltdown.",
    followUpPlaceholder: "That's disappointing… the problem isn't math, it's word problems…",
    embodimentPrompt:
      "Say 'You're smarter than this' once, then 'That's disappointing — what was hardest?' What shifts — fixed or growth?",
    embodimentPlaceholder: "Sit in disappointment vs rush to fix — notice your body…",
  },
  toneReflect: {
    sectionLabel: "05 — IDENTITY COLLAPSE REFLECTION",
    prompt:
      "Look honestly: when you were a child, did failure feel like identity collapse? Do you ever accidentally communicate that failure reflects who your child is — not just what they did?",
    helper:
      "If you carry that wound, it's hard not to pass it on. Awareness is the first step to breaking the pattern.",
    placeholder: "Write what you notice — in yourself, in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I GOT STUCK",
    prompt:
      "Describe a moment you wanted to respond with curiosity but rushed to fix, minimize, or show disappointment. What was happening in you?",
    helper:
      "Rushing to fix can say failure is intolerable. Sitting with them says: we can handle hard together.",
    firstLabel: "When I rushed instead of sat",
    firstPlaceholder: "What actually happened in your real life…",
    secondPrompt:
      "SAT or RUSHED — when failure shows up next, what is one thing you'll do differently?",
    secondPlaceholder: "Sit in disappointment first… one curious question…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — NEXT SETBACK PLAN",
    intro:
      "Plan for the next failure. Goal: not make them feel better fast — help them build a framework for growth, not collapse.",
    helper: "Connection first. Then separate identity from problem.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Next test, game, hard task, quitting moment…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "Will you rush to fix, minimize, or show disappointment?",
      },
      {
        id: "tryRegulate",
        label: "Sit first:",
        placeholder: "Pause. Connection before problem-solving.",
      },
      {
        id: "tryConnectSupport",
        label: "Your script:",
        placeholder: "That's disappointing… / This is data… / What was hardest?",
      },
      {
        id: "tryMinimumStep",
        label: "Separate identity:",
        placeholder: "The problem isn't you. The problem is…",
      },
      {
        id: "trySelfCompassion",
        label: "If you slip into fixing — what is true and kind?",
        placeholder: "Optional — examining this wound is deep work…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "I see identity collapse vs growth frame more clearly",
      "Avoidance reads as self-protection — not laziness",
      "I connect my praise and failure responses to fixed vs growth wiring",
      "I know whether I SAT or RUSHED when failure showed up",
      "I have a growth-frame script closer to my voice",
      "I'm examining my own childhood wound around failure",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Separate who they are from what happened.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT + ONE INTENTION",
    prompt:
      "Share a failure from your own life — how it felt, what you learned, that you kept going. Plus: one script you'll practice more intentionally at the next setback.",
    helper:
      "Let them see failure isn't hidden. Identity isn't defined by success or failure — but by how we respond.",
    placeholder: "The story you'll share and the script you'll use…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're not just learning a technique. You're examining how failure was taught to you — and deciding consciously whether to pass it on.",
      "That's deep work. And you're doing it.",
      "Next up: naming disappointment — sitting with discomfort instead of rushing to fix.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.4.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_4_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-4-reflection",
  lessonId: "4.4",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Think about the last time your child was truly disappointed. If you said 'It's okay' or 'There will be other chances' — your instinct was to rescue. That's love.",
      "Today: what if rushing to fix robs them of what they need most? Name the feeling. Stay present. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — YOUR RELATIONSHIP WITH DISCOMFORT",
    prompt:
      "Right now, how willing are you to sit in discomfort — yours or theirs — without fixing it?",
    helper:
      "If this lesson made you uncomfortable, that's your growth edge. Presence is practice, not performance.",
    min: 1,
    max: 10,
    minLabel: "Very urge to fix or escape",
    maxLabel: "Willing to name and stay",
    followUpPrompt: "Optional: when you're sad or disappointed, what do you usually do?",
    followUpPlaceholder: "Sit with it, phone, snack, distract, push through…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHAT I NOTICED",
    prompt:
      "Describe one moment this week when your child experienced disappointment — a loss, a letdown, something they really wanted. What did you do and say? How did they respond?",
    helper: "Not judgment — data. Did you offer solutions or presence?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFRAME",
    reframe: "Discomfort is not danger.\nIt's information.",
    prompt:
      "When you rush to make the feeling go away, you may teach: this feeling is intolerable. Can you sit beside them in it instead?",
    options: [
      "Yes — I see how fixing teaches escape",
      "I'm still connecting this to my own childhood",
      "I'm sitting with it — naming without fixing is new for me",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — THE SHIFT I PRACTICED",
    prompt: "Which shift did you focus on — or want to focus on next?",
    helper:
      "Affect labeling: naming the emotion calms the nervous system. You cannot rush this process.",
    options: [
      "Naming without fixing — 'You're so disappointed.'",
      "Sitting in silence — letting pauses be processing",
      "Resisting solve or bright-side — presence over rescue",
      "Practicing sitting with my own discomfort",
    ],
    followUpPrompt:
      "When you were a child, were you allowed to feel disappointment — or told to get over it?",
    followUpPlaceholder: "Stop crying, not that big a deal, look on the bright side…",
    secondFollowUpPrompt:
      "Have you named a feeling once and stayed — even briefly — without fixing?",
    secondFollowUpPlaceholder: "A small moment counts…",
  },
  scriptVoice: {
    sectionLabel: "04 — NAME AND STAY SCRIPTS",
    prompt: "Which approach feels most reachable when they're flooded?",
    helper: "Name → pause → stay. After the flood settles: one reflection question at a time.",
    options: [
      "Name — 'You're so disappointed. That was something you really wanted.'",
      "Stay — sit together, hand on back, no words needed",
      "One question later — 'What was the hardest part about that?'",
    ],
    followUpPrompt: "Write your naming script for a real upcoming disappointment — exact words.",
    followUpPlaceholder: "That's really hard. I see how much this matters…",
    embodimentPrompt:
      "Say 'It's okay, don't cry' once, then 'You're so disappointed.' What shifts in your body — rescue or presence?",
    embodimentPlaceholder: "Notice chest, stomach — attachment system activating…",
  },
  toneReflect: {
    sectionLabel: "05 — DISCOMFORT REFLECTION",
    prompt:
      "Look honestly: do you accidentally communicate that their feelings are too much for you? What's one thing you'll do differently when the urge to rescue hits?",
    helper:
      "Your job isn't to take pain away. It's to show them they're safe even when they feel terrible.",
    placeholder: "Write what you notice — in yourself, in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I GOT STUCK",
    prompt:
      "Describe a moment you wanted to sit with the feeling but rushed to fix, minimize, or distract. What was happening in you? What was the urge?",
    helper: "That urge isn't weakness — it's your attachment system. Pause is the practice.",
    firstLabel: "When I FIXED instead of NAMED",
    firstPlaceholder: "What actually happened in your real life…",
    secondPrompt:
      "NAMED or FIXED — next time, what is good-enough? What will you say to yourself if you slip?",
    secondPlaceholder: "Presence is practice. One pause counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — NAME AND STAY PLAN",
    intro:
      "Plan for the next disappointment. Only job: name the feeling once, then stay present. No fixing. No bright-siding.",
    helper: "Am I helping them process — or rescuing them from their own feelings?",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Next loss, letdown, didn't make the team…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to fix, minimize, or positive-attitude?",
      },
      {
        id: "tryRegulate",
        label: "Pause:",
        placeholder: "One breath — am I rescuing or processing?",
      },
      {
        id: "tryConnectSupport",
        label: "Name + stay:",
        placeholder: "You're so disappointed… / I'm here. We can sit with this.",
      },
      {
        id: "tryMinimumStep",
        label: "After flood settles — one question:",
        placeholder: "What was the hardest part? (One only. Wait. Listen.)",
      },
      {
        id: "trySelfCompassion",
        label: "If you fixed instead of stayed — what is true and kind?",
        placeholder: "Optional — every pause builds a new pathway…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Discomfort is not danger — that landed",
      "Naming calms the nervous system — affect labeling makes sense",
      "I see solutions vs presence — two different messages",
      "I know whether I NAMED or FIXED when disappointment showed up",
      "I have a name-and-stay script closer to my voice",
      "I'm practicing sitting with my own discomfort too",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Sit beside them in it — don't take it away.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT + ONE INTENTION",
    prompt:
      "Practice your own discomfort: sit with a feeling without distraction. Name it. Then one script you'll use when your child is in emotional pain.",
    helper:
      "You can't teach tolerance if you can't tolerate it yourself. Step 1: sit. Step 2: one question later. Step 3: listen.",
    placeholder: "Your practice tonight and your script…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You're not trying to be perfect. You're trying to be present.",
      "Every time you pause instead of fix, you build a new pathway — in you and in them.",
      "Next up: building reflection loops — from processing to learning.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.5.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_5_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-5-reflection",
  lessonId: "4.5",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "You sat with them. You named the feeling. And then… did everyone just move on? Today: the reflection loop — the bridge between surviving disappointment and learning from it.",
      "Experience → Reflection → Iteration. Don't skip the middle step. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — REFLECTION PARTNER",
    prompt:
      "Right now, how calm do you feel — enough to be curious after the flood, not while they're still in it?",
    helper: "You cannot reflect when the child is flooded. Timing is everything.",
    min: 1,
    max: 10,
    minLabel: "Too activated or rushed",
    maxLabel: "Calm enough to ask one question",
    followUpPrompt: "Optional: what is present at that number?",
    followUpPlaceholder: "Urge to fix, patience, curiosity…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE MISSED OPPORTUNITY",
    prompt:
      "Think about a recent failure your child experienced. Did you help them complete the loop — or stop at experience and move on?",
    helper:
      "If you stopped at experience, you weren't wrong. You just didn't know there was more. What happened after the feeling passed?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFLECTION LOOP",
    reframe: "Experience → Reflection\n→ Iteration",
    prompt:
      "Something you're good at now — did you try once and succeed, or try, fail, reflect, adjust, and try again?",
    options: [
      "Yes — that loop is how I built mastery",
      "I see it intellectually but skip reflection with my child",
      "I'm sitting with it — this is the missing middle step",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — READY OR NOT READY",
    prompt: "When your child fails, what usually happens after emotional processing?",
    helper:
      "Ready: breathing slowed, body softened, no longer in full flood. Not ready: still crying, tense, pushing away.",
    options: [
      "I move on — we never reflect",
      "I ask too early — while they're still flooded",
      "I wait too long — the learning moment passes",
      "I wait for calm, then ask one question",
      "We haven't had a failure to practice on yet",
    ],
    followUpPrompt:
      "Think of something you're good at now. How did reflection and iteration show up in your own learning?",
    followUpPlaceholder: "Try, fail, adjust, try again…",
    secondFollowUpPrompt:
      "Have you completed even one reflection question after a setback — even imperfectly?",
    secondFollowUpPlaceholder: "One question counts…",
  },
  scriptVoice: {
    sectionLabel: "04 — REFLECTION QUESTIONS",
    prompt: "Which question will you try first — after the flood has subsided?",
    helper:
      "One question at a time. Wait for the answer. Silence is where their brain does the work.",
    options: [
      "What was the hardest part about that?",
      "What do you think went well?",
      "What would you want to do differently next time?",
      "What did you learn from this?",
      "What's one thing you might try next time?",
    ],
    followUpPrompt: "Write the full exchange — process first, then your one question, then listen.",
    followUpPlaceholder: "You're feeling calmer… What was hardest… / What went well…",
    embodimentPrompt:
      "Say 'What was the hardest part?' once like a test, once with genuine curiosity. What shifts?",
    embodimentPlaceholder: "Reflection vs interrogation — they feel the difference…",
  },
  toneReflect: {
    sectionLabel: "05 — REFLECTION PARTNER",
    prompt:
      "When you guide reflection, do you force positivity — or let them discover what went well and what to try next?",
    helper: "The goal: they leave feeling capable, with a plan for growth — not just comforted.",
    placeholder: "Write what you notice in yourself and in your child…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — TIMING TRAPS",
    prompt:
      "What actually pulls you to skip reflection, ask too early, or rush to iteration — not what should, but what does?",
    helper: "Everyone feels better — move on. Uncomfortable with silence. Want to fix it fast…",
    firstLabel: "What gets in the way of the loop",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For one experience this week: sit first, then one question when calm. What is good-enough?",
    secondPlaceholder: "One question. Wait. Listen. That's the loop…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — FULL LOOP PLAN",
    intro:
      "Plan the full loop for one experience this week. Phase 1: process. Phase 2: one reflection question. Phase 3: iteration forward.",
    helper: "Don't ask while flooded. Your calm presence makes reflection possible.",
    fields: [
      {
        id: "trySituation",
        label: "Experience:",
        placeholder: "What failure or setback might show up?",
      },
      {
        id: "tryNotice",
        label: "Process first:",
        placeholder: "Name, stay, wait for breathing to slow…",
      },
      {
        id: "tryRegulate",
        label: "Ready check:",
        placeholder: "Body softened? No longer in full flood?",
      },
      {
        id: "tryConnectSupport",
        label: "One reflection question:",
        placeholder: "What was hardest? / What went well? / What next time?",
      },
      {
        id: "tryMinimumStep",
        label: "Iteration — looking forward:",
        placeholder: "What would you do differently? One thing to try?",
      },
      {
        id: "trySelfCompassion",
        label: "If you skip reflection or ask too early — what is true and kind?",
        placeholder: "Optional — you can complete the loop next time…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "MODULE 4 — WHAT YOU BUILT",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Performance-based praise creates fragile identity — I see it",
      "Failure as information — identity collapse vs growth frame",
      "I can name disappointment and sit without fixing",
      "Experience → Reflection → Iteration — the loop landed",
      "I know when they're ready to reflect vs still flooded",
      "I have one reflection question ready for the next setback",
      "I'm moving from surviving failure to learning from it",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to carry forward:",
    detailPlaceholder: "Complete the loop — don't stop at experience.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT — MODEL THE LOOP",
    prompt:
      "Reflect on your own recent setback: What was hardest? What went well? What would you do differently? Then: one experience this week where you'll sit first, then ask one reflection question.",
    helper: "You're modeling the loop for yourself — and becoming their reflection partner.",
    placeholder: "Your own reflection and the experience you'll use…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "The reflection loop is the bridge — don't stop at experience.",
      "Next up: losing, academic failure, and social rejection — the scenarios that break your heart.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 4.6.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_4_6_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-4-6-reflection",
  lessonId: "4.6",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "loop-break",
    "moment-try",
    "noticing",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "The moment you dread — losing, a report card, social rejection. The one that makes your chest tight. Pick one. Today we apply everything from Module 4 to that exact moment.",
      "This one might be tender. Come in with self-compassion. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — WHEN YOUR HEART BREAKS",
    prompt: "Right now, thinking about your trigger scenario — how regulated do you feel?",
    helper: "Your own wounds may activate. Check your body before you imagine responding.",
    min: 1,
    max: 10,
    minLabel: "Chest tight, very activated",
    maxLabel: "Steady enough to prepare",
    followUpPrompt: "Optional: what fear or memory comes up?",
    followUpPlaceholder: "Their loneliness, your grades, being left out…",
    followUpOptional: true,
  },
  loopBreak: {
    sectionLabel: "01 — YOUR TRIGGER SCENARIO",
    prompt: "Which scenario makes your stomach clench just thinking about it?",
    helper: "You're preparing for one, not all three. Losing. Academic failure. Social rejection.",
    options: [
      "Losing — tournament, tryouts, game that mattered",
      "Academic failure — grade says 'not good enough'",
      "Social rejection — left out, excluded, hurt by friends",
    ],
    followUpPrompt:
      "For your scenario — which protocol step is hardest? Silence, naming, identity separation, reflection, or holding complexity?",
    followUpPlaceholder: "Rush to fix, blame, distract, problem-solve too fast…",
    secondFollowUpPrompt: "Did this scenario show up this week? If yes — did you use the protocol?",
    secondFollowUpPlaceholder: "Even one step counts…",
  },
  momentTry: {
    sectionLabel: "02 — MAP YOUR FOUR PHASES",
    intro:
      "Write your response for four phases. Phone notes, sticky note — wherever you'll see it when your heart is breaking for them.",
    helper: "You're not memorizing. You're preparing.",
    fields: [
      {
        id: "trySituation",
        label: "Phase 1 — Flood hits:",
        placeholder: "Come here. I'm here. You're safe.",
      },
      {
        id: "tryNotice",
        label: "Phase 2 — Process:",
        placeholder: "You're so disappointed / That sounds so painful…",
      },
      {
        id: "tryRegulate",
        label: "Phase 3 — Reflect (when calm):",
        placeholder: "What was hardest? / What do you need right now?",
      },
      {
        id: "tryConnectSupport",
        label: "Phase 4 — Identity separation:",
        placeholder: "This doesn't define you. You are still you.",
      },
      {
        id: "tryMinimumStep",
        label: "Scenario-specific script:",
        placeholder:
          "Loss: separate player from game / Grade: one grade is data / Social: worth not up for negotiation",
      },
      {
        id: "trySelfCompassion",
        label: "If I react from my wound — what is true and kind?",
        placeholder: "Optional — respond from who you are now, not who you were…",
      },
    ],
    maxLength: 300,
  },
  noticing: {
    sectionLabel: "03 — WHAT SHIFTED",
    prompt:
      "Describe one moment this module where you handled something differently than you would have before. What did you do? How did it land?",
    helper: "Not perfect — different. One shift counts.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  scriptVoice: {
    sectionLabel: "04 — YOUR ANCHOR SCRIPT",
    prompt: "For your trigger scenario — which anchor script will you reach for first?",
    helper: "Your body and tone matter as much as words — especially for social rejection.",
    options: [
      "Losing — 'That loss doesn't define you as a player.'",
      "Academic — 'This is one grade. It's information. It doesn't tell me who you are.'",
      "Social — 'What happened says something about that situation — not who you are.'",
      "Safety first — 'Come here. You're safe. I've got you.'",
    ],
    followUpPrompt: "Write the full script in your voice — including a pause before you speak.",
    followUpPlaceholder: "One breath… then your line…",
    embodimentPrompt:
      "Say your script once from urgency, once steady. What would your child read in your face?",
    embodimentPlaceholder: "Tense = threat. Steady = safety…",
  },
  toneReflect: {
    sectionLabel: "05 — THE WOUND I'M NOT PASSING ON",
    prompt:
      "Reflect on your own childhood — a big loss, bad grade, or social rejection. What did you need? What did you get? What's one thing you're committed to doing differently for your child?",
    helper: "Not about blaming your parents. About understanding what's activated in you.",
    placeholder: "Write what you notice — the wound and your choice…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I'M STILL STUCK",
    prompt:
      "Describe one scenario where you still default to the old way. What's happening in you? What's the trigger?",
    helper: "Fix, blame, distract, minimize, impose solutions — what's your default?",
    firstLabel: "Where the old way still wins",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "When your trigger scenario hits — regulate first, then Phase 1. What will you forgive yourself for?",
    secondPlaceholder: "Preparation lets you stay calm when it matters…",
    maxLength: 400,
  },
  whatShifted: {
    sectionLabel: "MODULE 4 — SKILLS I PRACTICED",
    prompt: "Which skills from this module did you use — or want to use? Mark what fits:",
    options: [
      "Process praise instead of performance praise",
      "Sat in disappointment instead of rushing to fix",
      "Named emotions to calm the nervous system",
      "Separated identity from outcome, failure, or rejection",
      "Used reflection loops — experience, reflection, iteration",
      "Co-created plans instead of imposing solutions",
      "Regulated myself before responding",
      "I mapped my four-phase response for my trigger scenario",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence for Module 4:",
    detailPlaceholder: "Comfort and build capacity — not either/or.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT + MODULE 5 INTENTION",
    prompt:
      "Tonight: reflect on your own history with your trigger scenario — what you needed vs what you got. Plus: one thing you want to deepen or explore in Module 5.",
    helper: "When we understand our triggers, we're less likely to react from them.",
    placeholder: "Your childhood reflection and Module 5 intention…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You completed Module 4. Praise, failure, processing, reflection — applied to the moments that break your heart.",
      "You looked at wounds you might have carried for decades — and chose consciously whether to pass them on.",
      "That's deep work. And you did it.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.1.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_1_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-1-reflection",
  lessonId: "5.1",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Blocks flying. 'I'm so bad at this!' In that split second — Door #1 Fixer or Door #2 Mirror? You're not managing a tantrum. You're building a human being.",
      "Module 5 begins: how identity is formed. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — YOUR MIRROR",
    prompt: "Right now, how regulated do you feel — enough to reflect stability, not rescue?",
    helper: "When their amygdala fires, their nervous system scans yours. Check yourself first.",
    min: 1,
    max: 10,
    minLabel: "Alarm blaring — Fixer reflex ready",
    maxLabel: "Calm enough to be the mirror",
    followUpPrompt: "Optional: when they melt down, what's your internal script about yourself?",
    followUpPlaceholder: "I can't handle this, I'm a mess, this is chaos…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — FIXER OR MIRROR",
    prompt:
      "Think of a recent frustration moment — tower, puzzle, 'I can't do anything right.' Which door did you walk through? What did you say?",
    helper:
      "Not judgment — data. Fixer: rescue, fix, 'you're so smart.' Mirror: name frustration, stay, co-regulate.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFRAME",
    reframe: "Children become what\nis reflected back to them.",
    prompt:
      "In moments of stress, their brain asks: 'Who am I?' What identity were you reflecting — fragile and needing rescue, or safe in struggle?",
    options: [
      "Fixer — I see myself rescuing more than mirroring",
      "Mirror — I've paused and co-regulated, even once",
      "I'm sitting with it — this reframes everything",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — DOOR #1 OR DOOR #2",
    prompt: "When they're dysregulated, what does your reflex usually do?",
    helper:
      "You cannot reason with them. You can only co-regulate. The upset is raw material for resilient identity.",
    options: [
      "Door #1 Fixer — swoop in, fix it, 'you're so smart'",
      "Door #1 — calm down, make discomfort go away",
      "Door #2 Mirror — name frustration, pause, stay present",
      "Door #2 — anchor to trait, 'what's your next move?'",
    ],
    followUpPrompt:
      "What identity trait do you most want them to carry — perseverance, kindness, curiosity?",
    followUpPlaceholder: "Turn it into: You're someone who…",
    secondFollowUpPrompt: "Have you used a mirror script — even once — instead of fixing?",
    secondFollowUpPlaceholder: "Frustration is part of learning…",
  },
  scriptVoice: {
    sectionLabel: "04 — YOUR IDENTITY SCRIPTS",
    prompt: "Which script feels most like you when they're in the messy middle?",
    helper: "Process + trait, not outcome. Neural scaffolding for perseverance and self-trust.",
    options: [
      "You're someone who keeps trying.",
      "You're figuring things out. What's your next move?",
      "It's okay to be frustrated. Frustration is part of learning.",
    ],
    followUpPrompt:
      "Finish the sentence: 'You're someone who…' — your personal script for your child.",
    followUpPlaceholder: "You're someone who keeps going when it's hard…",
    embodimentPrompt:
      "Say your script once rushed (Fixer tone), once calm and low (Mirror tone). What would they learn about who they are?",
    embodimentPlaceholder: "Eye level, breath, grounded — not high-pitched rescue…",
  },
  toneReflect: {
    sectionLabel: "05 — THE PARENT'S MIRROR",
    prompt:
      "When your child melts down, what reflection do you give yourself? Can you hold calm if your internal mirror says 'I can't handle this'?",
    helper:
      "Your script: 'I am someone who stays calm. I am figuring this out.' You can't reflect from a shattered mirror.",
    placeholder: "Write what you notice in your body and your inner voice…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE URGE TO FIX",
    prompt: "What actually pulls you through Door #1 — not what should, but what does?",
    helper: "Exhaustion, fear of their pain, need for quiet, your own alarm system…",
    firstLabel: "What pulls me toward fixing",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "For 24 hours: resist fixing a small frustration. Eye level, breath, one script. What is good-enough?",
    secondPlaceholder: "Spilled cup, zipper, lost shoe — one script counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — TRY TONIGHT",
    intro:
      "Plan for the next small frustration. Resist fixing. Eye level. Breath. One mirror script.",
    helper: "You're sculpting neural pathways with your syllables.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Spilled cup, tricky zipper, lost shoe, block tower…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to swoop in and fix?",
      },
      {
        id: "tryRegulate",
        label: "Your regulation script:",
        placeholder: "I am someone who stays calm. I am figuring this out.",
      },
      {
        id: "tryConnectSupport",
        label: "Your mirror script:",
        placeholder: "You're someone who keeps trying / You're figuring things out",
      },
      {
        id: "tryMinimumStep",
        label: "If frustration spikes — one line:",
        placeholder: "Frustration is part of learning. What's your next move?",
      },
      {
        id: "trySelfCompassion",
        label: "If you walk through Door #1 — what is true and kind?",
        placeholder: "Optional — you can reach for the mirror next time…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Children become what is reflected — that landed",
      "I see Fixer vs Mirror — two different identities wired",
      "Co-regulate, don't reason — when they're dysregulated",
      "I have a 'You're someone who…' script in my voice",
      "I noticed my internal mirror when they melt down",
      "I'm willing to try one mirror script in 24 hours",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want on your fridge:",
    detailPlaceholder: "What identity am I reflecting right now?",
  },
  nextStep: {
    sectionLabel: "24 HOURS — ONE SCRIPT",
    prompt:
      "When a small frustration hits tonight: get eye level, breathe, say one script. Which trait are you naming — and when will you start?",
    helper: "From commenting on behavior to naming character. You are becoming their mirror.",
    placeholder: "Your script and your first moment…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You gave them a foundation for internal stability — safe in struggle, not fragile.",
      "The question isn't how to stop the behavior. It's what identity you're reflecting.",
      "Module 5 has begun.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.2.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_2_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-2-reflection",
  lessonId: "5.2",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Your child struggling — you swoop in to fix. Normal. But you weren't just managing a tantrum. You were holding up a mirror.",
      "Today: linguistic scaffolding — identity statements instead of behavior commands. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — THE STABLE MIRROR",
    prompt:
      "Right now, how regulated do you feel — enough to name identity instead of command behavior?",
    helper:
      "You can't reflect calm if your internal mirror says 'I can't handle this.' Check yourself first.",
    min: 1,
    max: 10,
    minLabel: "Dysregulated — Fixer reflex ready",
    maxLabel: "Steady enough to scaffold identity",
    followUpPrompt: "Optional: what's your reflection to yourself when they're struggling?",
    followUpPlaceholder: "I can't handle this, just do what I say…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHAT I NOTICED",
    prompt:
      "Describe one moment this week where you used an identity script — or defaulted to a behavior command. What happened? How did your child respond?",
    helper: "Commands get compliance now. Identity statements build internal stability long-term.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — LINGUISTIC SCAFFOLDING",
    reframe: "Name the identity,\nnot the behavior.",
    prompt:
      "'Go set the table' = external task. 'You're someone who helps the family' = title to grow into. Which do you use more?",
    options: [
      "Behavior commands — I nag the behavior more than name identity",
      "I've tried identity statements — even once",
      "I'm sitting with it — this shifts how I hear my own words",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — THE SHIFT I PRACTICED",
    prompt: "Which shift did you focus on — or want to focus on next?",
    helper: "Good job is a transaction. 'You're someone who…' is an identity.",
    options: [
      "Door #2 Mirror instead of Door #1 Fixer",
      "Script: 'You're someone who keeps trying'",
      "Script: 'You're figuring things out'",
      "Frustration as opportunity to build identity",
      "Regulating myself before reflecting calm",
    ],
    followUpPrompt:
      "The core identity trait you want your child to carry — and your 'You're someone who…' script:",
    followUpPlaceholder: "Perseverance, kindness, curiosity… / You're someone who…",
    secondFollowUpPrompt:
      "Script A (command) vs Script B (identity) — which landed in your home this week?",
    secondFollowUpPlaceholder: "Just finish the page vs you're someone who keeps trying…",
  },
  scriptVoice: {
    sectionLabel: "04 — IDENTITY STATEMENTS",
    prompt:
      "Pick one script to practice intentionally tonight — then stop talking. Let the silence land.",
    helper: "Say it out loud. Your mouth needs to get used to the shape of these words.",
    options: [
      "You're someone who keeps trying.",
      "You're figuring things out.",
      "You're figuring out how to handle a big ouch.",
      "Frustration is part of learning.",
    ],
    followUpPrompt: "Write your script for a real moment — dinner, bath, socks, math worksheet.",
    followUpPlaceholder: "Whoa. Look at you. You're someone who…",
    embodimentPrompt:
      "Say 'Come on, just finish it' once, then 'You're someone who keeps trying.' What does each one wire?",
    embodimentPlaceholder: "Command = pressure. Identity = title to grow into…",
  },
  toneReflect: {
    sectionLabel: "05 — THE PARENT'S MIRROR",
    prompt:
      "When your child struggles, what narrative is your presence writing? What reflection do you give yourself when dysregulated? One way to regulate so you can be their stable mirror?",
    helper:
      "From manager of behaviors to architect of self-concept. Same moment — two different identities built.",
    placeholder: "Write what you notice — in you, in them…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I GOT STUCK",
    prompt:
      "Describe a moment you defaulted to Door #1 — the fixer or behavior command. What was happening in you? What made it hard to pause and reflect?",
    helper: "Long day, dinner on the table, need compliance now — all real.",
    firstLabel: "When Fixer or commands won",
    firstPlaceholder: "What actually happened in your real life…",
    secondPrompt:
      "Tonight: one script, then silence. What is good-enough if you slip into a command?",
    secondPlaceholder: "One identity line counts. Sticky note on the fridge…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — TRY TONIGHT",
    intro:
      "Pick one script. Use it when they struggle with something small. Then stop talking — let the identity settle.",
    helper: "Water the roots, don't nag the plant.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Dinner, bath, socks, worksheet, scraped knee…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to command, fix, or say 'you're fine'?",
      },
      {
        id: "tryRegulate",
        label: "Your regulation:",
        placeholder: "I am someone who stays calm. I am figuring this out.",
      },
      {
        id: "tryConnectSupport",
        label: "Identity script:",
        placeholder: "You're someone who keeps trying / You're figuring things out",
      },
      {
        id: "tryMinimumStep",
        label: "Then — silence:",
        placeholder: "Stop talking. Let it land. That's the hard part.",
      },
      {
        id: "trySelfCompassion",
        label: "If you command or fix — what is true and kind?",
        placeholder: "Optional — architect, not manager. Practice counts…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Linguistic scaffolding — name identity, not behavior — landed",
      "I hear the difference between commands and identity statements",
      "I have a 'You're someone who…' script for a real moment",
      "I practiced saying it out loud — it feels different",
      "I noticed Fixer vs Mirror in a real moment",
      "I'm willing to use one script tonight and stop talking",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Give them a title to grow into.",
  },
  nextStep: {
    sectionLabel: "ONE INTENTION",
    prompt:
      "One script you'll practice more intentionally this week. Write it on a sticky note. Which trait, which moment?",
    helper: "You're building a human — not just managing behavior.",
    placeholder: "Your script and when you'll use it…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You moved from nagging behavior to naming identity.",
      "Every frustrated moment is a chance to wire who they believe they are.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.3.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_3_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-3-reflection",
  lessonId: "5.3",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Empty pancake box. Broken toy. Change in plans. They weren't asking for pancakes — they were asking for the world to make sense again.",
      "Today: stop being the Fixer. Be the Anchor. Sit in the 'not knowing.' Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — THE ANCHOR",
    prompt:
      "Right now, how steady do you feel — enough to sit in uncertainty without rushing to fix?",
    helper:
      "To a child's brain, uncertainty feels like danger. Your tone settles their alarm before they process your words.",
    min: 1,
    max: 10,
    minLabel: "Frantic — Fixer reflex ready",
    maxLabel: "Steady enough to anchor",
    followUpPrompt: "Optional: when plans change, what do you usually feel?",
    followUpPlaceholder: "Urge to restore order, frustration, panic…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — WHAT I NOTICED",
    prompt:
      "Describe one moment this week when your child melted down over something minor — broken toy, plan change, empty box. What did you do? How did they respond?",
    helper:
      "Not defiance or drama — cognitive dissonance. Reality didn't match the script in their head.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE REFRAME",
    reframe: "Uncertainty feels like danger.\nThe anchor stays steady.",
    prompt:
      "When you always rush to fix ambiguity, they learn: I cannot sit with discomfort. Can you be steady in the storm instead?",
    options: [
      "Yes — I see how fixing robs ambiguity tolerance",
      "I'm still shifting from Fixer to Anchor",
      "I'm sitting with it — 'not knowing' is new for me too",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — FIXER OR ANCHOR",
    prompt: "When there's no immediate answer or plans change, what do you usually do first?",
    helper:
      "Fixer: glue it, drive to the store, distract. Anchor: name feeling, stay, sit in 'not knowing.'",
    options: [
      "Fixer — restore order immediately",
      "Fixer — distract or minimize ('it's not a big deal')",
      "Anchor — name feeling, pause, stay present",
      "Anchor — Wait Hand, count to 20, don't solve",
    ],
    followUpPrompt:
      "Did you see defiance, manipulation, or drama — or a brain that couldn't hold two truths at once?",
    followUpPlaceholder: "Saturday + morning = pancakes… empty box…",
    secondFollowUpPrompt: "Have you sat in 'not knowing' with them — even once — without fixing?",
    secondFollowUpPlaceholder: "We don't have an answer yet…",
  },
  scriptVoice: {
    sectionLabel: "04 — ANCHOR SCRIPTS",
    prompt: "Which script feels most reachable when ambiguity hits?",
    helper: "Low, steady, warm — not high-pitched or frantic. Co-regulation through tone.",
    options: [
      "We are in the 'not knowing.' I'm here. That feels yucky, doesn't it?",
      "Wait Hand — 'I hear you. We're waiting for the answer. Let's wait together.'",
      "I don't know. Let's wonder about that together for a minute.",
    ],
    followUpPrompt:
      "Write your anchor script for a real scenario — broken toy, plan change, no answer yet.",
    followUpPlaceholder: "Your heart is so sad… we don't have glue yet… I'm staying right here…",
    embodimentPrompt:
      "Say 'Okay okay we'll fix it stop crying!' then 'We are in the not knowing. I'm here.' What shifts in your body — frantic or steady?",
    embodimentPlaceholder: "Their alarm reads your tone before your words…",
  },
  toneReflect: {
    sectionLabel: "05 — YOUR GROWTH EDGE",
    prompt:
      "When your rush to fix uncertainty — what's happening in you? What did you learn about sitting with discomfort growing up?",
    helper:
      "If fixing made you uncomfortable — good. You're learning to sit in uncertainty so they can too.",
    placeholder: "Write what you notice — in you, in them…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I GOT STUCK",
    prompt:
      "Describe a moment you wanted to anchor but rushed to fix, distract, or resolve. What was the urge?",
    helper: "Drive to the store, Google immediately, glue it now — all understandable.",
    firstLabel: "When Fixer won over Anchor",
    firstPlaceholder: "What actually happened in your real life…",
    secondPrompt:
      "Next ambiguity moment: Wait Hand, count to 20, don't solve. What is good-enough?",
    secondPlaceholder: "Hand on shoulder, wait together — that's the muscle…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — WAIT HAND PLAN",
    intro:
      "Plan for the next plan change or question with no answer. Anchor, don't fix. Count to 20 in your head.",
    helper: "Ambiguity is survivable — when you're steady beside them.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Plan change, broken toy, empty box, question you don't know…",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to fix, distract, or restore order?",
      },
      {
        id: "tryRegulate",
        label: "Steady tone:",
        placeholder: "Low, warm, unhurried — before you speak",
      },
      {
        id: "tryConnectSupport",
        label: "Wait Hand + script:",
        placeholder: "Hand on shoulder — We're waiting for the answer. Let's wait together.",
      },
      {
        id: "tryMinimumStep",
        label: "Sit in not knowing:",
        placeholder: "We don't have an answer yet. I'm here.",
      },
      {
        id: "trySelfCompassion",
        label: "If you fix immediately — what is true and kind?",
        placeholder: "Optional — one wait together counts…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Uncertainty feels like danger — I understand the meltdown differently",
      "Fixer vs Anchor — that distinction landed",
      "I have a 'not knowing' or Wait Hand script",
      "I felt frantic vs steady tone in my body",
      "I'm willing to wait 20 seconds without solving",
      "I tried 'I don't know — let's wonder together'",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "They don't need a perfect world — they need you steady.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT",
    prompt:
      "When they ask something you don't know — don't Google yet. Hand on back: 'I don't know. Let's wonder about that together for a minute.' Or use Wait Hand when plans change.",
    helper: "You're building ambiguity tolerance — in them and in you.",
    placeholder: "Which moment tonight and which script…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You taught them they don't need a perfect world to be okay — just you, steady.",
      "Next up: from waiting for answers to finding them — independent thinking.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.4.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_4_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-4-reflection",
  lessonId: "5.4",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Why? Why? Why? They aren't asking for information — they're asking permission to stop thinking. You're doing cognitive labor that doesn't belong to you.",
      "Today: compass, not GPS. Return the question. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — BEFORE YOU ANSWER",
    prompt: "Right now, how willing do you feel to pause instead of reflexively answering?",
    helper:
      "Every answer you give for a question they could solve uses your prefrontal cortex instead of theirs.",
    min: 1,
    max: 10,
    minLabel: "Exhausted — auto-answer mode",
    maxLabel: "Curious enough to return the question",
    followUpPrompt: "Optional: what is present at that number?",
    followUpPlaceholder: "Brain sizzle, hurry, guilt about doing less…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE QUESTION LOOP",
    prompt:
      "Describe one moment this week when your child asked a question they could have answered — jacket, snack, shoes, 'why' loop. What did you do?",
    helper: "Not judgment — data. Did you answer, manage, or return the question?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — COGNITIVE OFFLOADING",
    reframe: "Compass, not GPS.\nReturn the question.",
    prompt:
      "When confusion arises, does their brain learn: mom's brain works, mine shuts off — or: space is held for me to think?",
    options: [
      "Yes — I see myself as their external hard drive",
      "I've returned a question — even once",
      "I'm sitting with it — doing less feels uncomfortable",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — ANSWER OR RETURN",
    prompt: "When they ask 'Why?' or 'Can you…' repeatedly, what do you usually do?",
    helper: "GPS: turn-by-turn directions. Compass: direction, they take the steps.",
    options: [
      "Answer — explain, justify, 'because I said so'",
      "Answer until I'm exhausted",
      "Pause — then 'What do you think?'",
      "Return — 'How would you approach this?'",
    ],
    followUpPrompt: "Which questions this week were truly yours to answer vs theirs to figure out?",
    followUpPlaceholder: "Jacket, snack, dinner, shoes…",
    secondFollowUpPrompt: "Have you used the 3-second pause before speaking — even once?",
    secondFollowUpPlaceholder: "Pause, breath, return…",
  },
  scriptVoice: {
    sectionLabel: "04 — RETURN QUESTION SCRIPTS",
    prompt: "Which script feels most reachable — genuinely curious, not a pop quiz?",
    helper: "Accusatory 'Well, what do YOU think?' shuts down. Playful curiosity opens up.",
    options: [
      "I'm curious about that too. What do you think?",
      "How would you approach this?",
      "I'd love to hear your idea first.",
      "Great question — how can we figure that out?",
    ],
    followUpPrompt: "Write the full exchange for a real question — jacket, snack, or 'why' loop.",
    followUpPlaceholder: "What do you think… / How can we check… / You go look, I'll wait…",
    embodimentPrompt:
      "Say 'Well, what do YOU think?' once accusatory, once curious: 'Huh. I wonder. What do you think?' What would they hear?",
    embodimentPlaceholder: "Your opinion has value. I trust your logic…",
  },
  toneReflect: {
    sectionLabel: "05 — DOING LESS",
    prompt:
      "If this lesson made you feel like you've been doing too much — what comes up? What makes it hard to hand cognitive labor back?",
    helper: "Doing less is often exactly what they need to do more. Awareness is the first step.",
    placeholder: "Write what you notice — in you, in them…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE REFLEX TO RESCUE",
    prompt: "What actually pulls you to answer instead of return — not what should, but what does?",
    helper: "Faster, less whining, you're tired, guilt, need peace now…",
    firstLabel: "What pulls me toward answering",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Next 'Can you…' or 'Why do I have to…' — 3-second pause, then return. What is good-enough?",
    secondPlaceholder: "One returned question counts. They solved it — you conserved energy…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — THE 3-SECOND PAUSE",
    intro:
      "Plan for the next question they could answer themselves. Pause three seconds. Breath. Return the question.",
    helper: "Space is being held for them to think. They are expected to contribute.",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Can I have a snack? Why jacket? Where are my shoes?",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to answer, explain, or 'because I said so'?",
      },
      {
        id: "tryRegulate",
        label: "3-second pause:",
        placeholder: "Breath before you speak — break your rescue reflex",
      },
      {
        id: "tryConnectSupport",
        label: "Return script:",
        placeholder: "What do you think? / How would you approach this?",
      },
      {
        id: "tryMinimumStep",
        label: "Follow-up (if needed):",
        placeholder: "How can we figure that out? You check — I'll wait.",
      },
      {
        id: "trySelfCompassion",
        label: "If you answer anyway — what is true and kind?",
        placeholder: "Optional — try the pause next question…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Cognitive offloading — I see myself as their GPS",
      "Compass not GPS — return the question landed",
      "I hear accusatory vs curious tone in 'What do you think?'",
      "I'm willing to try the 3-second pause",
      "I returned a question they could answer — even once",
      "Doing less might be what they need to do more",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence you want to remember:",
    detailPlaceholder: "Return the question. Let their brain work.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT",
    prompt:
      "Next 'Can you…' or 'Why do I have to…' — pause three seconds, then: 'I'd love to hear your idea first. How would you approach this?'",
    helper: "They solved it. They owned it. You conserved energy.",
    placeholder: "Which question type and when…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You gave them independent thinking — and gave yourself your energy back.",
      "Next up: meaning-driven motivation — beyond 'good job'.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.5.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_5_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-5-reflection",
  lessonId: "5.5",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "noticing",
    "reframe",
    "loop-break",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "moment-try",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Lego spaceship. 'Good job!' feels like love — but it's a judgment. It teaches them to ask 'Did you like it?' instead of 'Am I proud of it?'",
      "Today: meaning-driven motivation. Evaluator to Witness. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — EVALUATOR OR WITNESS",
    prompt:
      "Right now, how open do you feel to shifting from 'good job' to observational language?",
    helper: "Positive judgments still train external validation. Curiosity, not shame.",
    min: 1,
    max: 10,
    minLabel: "Defensive or shut down",
    maxLabel: "Curious and willing to try",
    followUpPrompt: "Optional: Evaluator or Observer — which sounds more like you lately?",
    followUpPlaceholder: "Great job, I'm proud vs you stuck with it, tell me about it…",
    followUpOptional: true,
  },
  noticing: {
    sectionLabel: "01 — THE LAST 'GOOD JOB'",
    prompt:
      "Think of a moment this week you said 'Good job' or 'I'm so proud of you.' What did they show you? What did you say?",
    helper: "Rewind it: what process could you have described instead?",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  reframeRecall: {
    cardTitle: "02 — THE INTERNAL COMPASS",
    reframe: "Witness, not evaluator.\nMeaning, not dopamine.",
    prompt:
      "Dopamine: perform, get a hit, motivation collapses when reward is gone. Serotonin/oxytocin: I chose this, I got better, it mattered. Which are you wiring?",
    options: [
      "I see myself as Evaluator — 'I like it' more than 'I see you'",
      "I'm shifting toward Witness — describe process and effort",
      "I'm sitting with it — 'good job' is deeply automatic",
    ],
  },
  loopBreak: {
    sectionLabel: "03 — REWARD TRAP OR MEANING",
    prompt: "When you want to encourage, what do you usually reach for?",
    helper: "Autonomy, competence, relatedness — not evaluation.",
    options: [
      "Evaluator — 'Good job!' / 'I'm so proud of you!'",
      "Bribe — cookie if you clean up, sticker, treat",
      "Observer — describe what I see, ask about process",
      "Witness — 'Tell me more' / connect effort to identity",
    ],
    followUpPrompt: "Are you raising a dopamine-seeker or a meaning-driven human?",
    followUpPlaceholder: "Needs gold star vs internal evidence…",
    secondFollowUpPrompt:
      "Have you replaced one 'good job' with observational language — even once?",
    secondFollowUpPlaceholder: "I see you used… / how did you figure out…",
  },
  scriptVoice: {
    sectionLabel: "04 — WITNESS SCRIPTS",
    prompt: "Which script feels most reachable when they show you something they made or did?",
    helper:
      "Don't say 'good.' Describe what you see. Point to process and effort. Hand the microphone back.",
    options: [
      "I see you used… How did you figure that out?",
      "You worked on that for a long time. That took serious focus.",
      "Tell me about it. / Tell me more about that.",
      "You stuck with that even when it got tricky.",
    ],
    followUpPrompt: "Rewrite your last 'good job' moment — witness script, exact words.",
    followUpPlaceholder: "I see the grey pieces for the wings… how did you angle them…",
    embodimentPrompt:
      "Say 'Wow, good job, you're such a good builder' once, then your witness script. What does each one wire?",
    embodimentPlaceholder: "Does she like it vs she sees my process…",
  },
  toneReflect: {
    sectionLabel: "05 — INTERNAL VS EXTERNAL",
    prompt:
      "When you imagine stopping 'good job' — what comes up? Cold? Loving? What does your child currently ask: 'Did you like it?' or 'Am I proud of it?'",
    helper: "Value isn't in performance. It's in effort, persistence, and character.",
    placeholder: "Write what you notice — in you, in them…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — THE URGE TO EVALUATE",
    prompt: "What actually pulls you toward 'good job' or bribes — not what should, but what does?",
    helper: "Automatic, feels loving, want them to feel good, quick fix…",
    firstLabel: "What pulls me toward evaluation or rewards",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt:
      "Rewind one 'good job' — what would you say instead? What is good-enough at dinner tonight?",
    secondPlaceholder: "One process question + tell me more counts…",
    maxLength: 400,
  },
  momentTry: {
    sectionLabel: "07 — TRY AT DINNER",
    intro:
      "Plan tonight: process question, then witness — don't solve. Build the internal compass.",
    helper: "Did that align with who I want to be? — not Will I get a gold star?",
    fields: [
      {
        id: "trySituation",
        label: "When:",
        placeholder: "Dinner — they show something or answer your question",
      },
      {
        id: "tryNotice",
        label: "Notice:",
        placeholder: "What will pull you to evaluate, praise, or fix?",
      },
      {
        id: "tryRegulate",
        label: "Process question:",
        placeholder: "What did you try that was hard? / What did you figure out?",
      },
      {
        id: "tryConnectSupport",
        label: "Witness response:",
        placeholder: "Tell me more about that. / I see you stuck with it…",
      },
      {
        id: "tryMinimumStep",
        label: "If they say 'nothing' — one follow-up:",
        placeholder: "What was one small thing today, even boring?",
      },
      {
        id: "trySelfCompassion",
        label: "If 'good job' slips out — what is true and kind?",
        placeholder: "Optional — witness the next moment…",
      },
    ],
    maxLength: 300,
  },
  whatShifted: {
    sectionLabel: "WHAT SHIFTED AFTER THIS LESSON",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Good job is a judgment — that landed",
      "Evaluator vs Witness — I see the difference",
      "Dopamine-seeker vs meaning-driven — I'm noticing which I wire",
      "I rewound a 'good job' moment with witness language",
      "Autonomy, competence, relatedness — not evaluation",
      "I have a dinner process question ready",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence for the internal compass:",
    detailPlaceholder: "I see you. Your process matters.",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT",
    prompt:
      "At dinner: 'What's something you tried that was hard?' or 'What's something you figured out?' When they answer — witness: 'Tell me more about that.'",
    helper: "Not solve. Witness. Wire meaning, not dopamine.",
    placeholder: "Your questions and when…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You shifted from 'Did you like it?' to building internal evidence.",
      "Their value is in effort, persistence, and character — not performance.",
      "Next up: integration — making this your family's default.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "See you in Lesson 5.6.",
    ctaLabel: "Save entry",
  },
};

export const LESSON_5_6_SELF_CHECK: SelfCheckRitual = {
  id: "lesson-5-6-reflection",
  lessonId: "5.6",
  title: "Your reflection",
  steps: [
    "arrival",
    "honest-inventory",
    "loop-break",
    "moment-try",
    "noticing",
    "script-voice",
    "tone-reflect",
    "obstacle-pair",
    "what-shifted",
    "next-step",
    "closure",
  ],
  arrival: {
    lines: [
      "Before you answer anything: take one slow breath. You don't need to get this right.",
      "Parenting book hero for three days — then 'No tablet!' from the kitchen. Knowledge doesn't change behavior. Systems, rituals, and culture do.",
      "Module 5 capstone: make it effortless. From doing motivation to being a family with stable identity. Take 5–10 minutes. All entries are private to you.",
    ],
    ctaLabel: "Begin reflecting",
  },
  honestInventory: {
    sectionLabel: "GROUND — CULTURE OR INTERVENTION",
    prompt:
      "Right now, how intentional do you feel about making Module 5 stick — not perfect, but ritual by ritual?",
    helper: "You didn't sign up to be perfect. You signed up to be more intentional.",
    min: 1,
    max: 10,
    minLabel: "Overwhelmed — will default when tired",
    maxLabel: "Ready to pick one ritual tonight",
    followUpPrompt: "Optional: when does conflict most often erupt in your house?",
    followUpPlaceholder: "Morning rush, after school, bedtime…",
    followUpOptional: true,
  },
  loopBreak: {
    sectionLabel: "01 — THE SHIFT I PRACTICED MOST",
    prompt: "Which shift from Module 5 did you focus on most — or want to carry forward?",
    helper: "Culture > intervention. Identity is forged in mundane, repeated interactions.",
    options: [
      "Mirror instead of Fixer (Door #2)",
      "Anchor in uncertainty — 'not knowing'",
      "Compass not GPS — return the question",
      "Witness not evaluator — meaning over dopamine",
      "Building family rituals and culture",
    ],
    followUpPrompt:
      "Pick one ritual to start — not all three. High/Low, family motto, or transition anchor?",
    followUpPlaceholder: "High/Low at dinner / In this family, we… / handshake before drop-off…",
    secondFollowUpPrompt: "When will you implement it tonight?",
    secondFollowUpPlaceholder: "Before bed, dinner, morning transition…",
  },
  momentTry: {
    sectionLabel: "02 — YOUR ONE RITUAL",
    intro:
      "Choose one ritual. Write when, where, and the exact words. Don't do all three — pick one and make it permanent.",
    helper: "Rituals lower cortisol and prime the brain for connection.",
    fields: [
      {
        id: "trySituation",
        label: "Ritual I chose:",
        placeholder: "High/Low / In this family, we… / transition handshake",
      },
      {
        id: "tryNotice",
        label: "When:",
        placeholder: "Dinner, before bed, school drop-off, after shoes off…",
      },
      {
        id: "tryRegulate",
        label: "Trigger moment:",
        placeholder: "Morning rush, after school, sibling fight, bedtime…",
      },
      {
        id: "tryConnectSupport",
        label: "My script (calm, low tone):",
        placeholder: "High and low? / We are on the same team. / In this family, we…",
      },
      {
        id: "tryMinimumStep",
        label: "Rule:",
        placeholder: "High/Low: I go first. Model vulnerability.",
      },
      {
        id: "trySelfCompassion",
        label: "Family motto (optional):",
        placeholder: "In this family, we use our strong voices / we're on the same team",
      },
    ],
    maxLength: 300,
  },
  noticing: {
    sectionLabel: "03 — WHAT SHIFTED",
    prompt:
      "Describe one moment this module where you handled something differently — mirror, anchor, return question, witness, or ritual. What did you do? How did it land?",
    helper: "One shift counts. You're building identity, not managing behavior.",
    placeholder: "Write what actually happened…",
    maxLength: 500,
  },
  scriptVoice: {
    sectionLabel: "04 — SCRIPTS THAT LANDED",
    prompt: "Which Module 5 script do you want in your family's shared language?",
    helper: "Tone is culture. Firm but kind — not exasperated or shaming.",
    options: [
      "You're someone who keeps trying.",
      "We are in the 'not knowing.' I'm here.",
      "What do you think? / How would you approach this?",
      "I noticed you… / Tell me more.",
      "High/Low — what was your high and low?",
      "In this family, we… (motto)",
    ],
    followUpPrompt: "Write your family motto or High/Low opener — exact words, calm tone.",
    followUpPlaceholder: "In this family, we… / Okay, shoes off — High/Low time…",
    embodimentPrompt:
      "Say your motto once as a weapon ('STOP IT, we're on the same team!'), once as a container (low voice, pause, breath). What shifts?",
    embodimentPlaceholder: "Shame vs safety — same words, different culture…",
  },
  toneReflect: {
    sectionLabel: "05 — THE IDENTITY I'M BUILDING",
    prompt:
      "What's one identity trait you're intentionally reflecting through your scripts and rituals? What story are you telling about who your family is?",
    helper:
      "Stop asking 'How do I make them behave?' Start asking 'What is the story we tell about who we are?'",
    placeholder: "Write the trait and how you'll reflect it…",
    maxLength: 500,
  },
  obstaclePair: {
    sectionLabel: "06 — WHERE I'M STILL STUCK",
    prompt:
      "Describe one scenario where you still default to the old way — fixer, GPS, evaluator, bribe. What's happening in you?",
    helper:
      "Transitions are cognitively expensive. They need a script that embodies identity, not a lecture.",
    firstLabel: "Where the old way still wins",
    firstPlaceholder: "What actually happens in your real life…",
    secondPrompt: "Which ritual will support that moment — and what will you forgive yourself for?",
    secondPlaceholder: "One ritual, one moment — intentionality builds over time…",
    maxLength: 400,
  },
  whatShifted: {
    sectionLabel: "MODULE 5 — WHAT YOU BUILT",
    prompt: "Mark what feels true for you right now:",
    options: [
      "Children become what is reflected — that foundation landed",
      "Mirror, anchor, compass, witness — I used at least one",
      "Identity statements — You're someone who…",
      "Meaning-driven motivation — not dopamine-seeking",
      "I chose one ritual to make permanent",
      "Culture over intervention — that reframe landed",
      "I'm building identity, not just managing behavior",
      "I feel overwhelmed — that's okay too",
      "Nothing shifted yet — I'm still taking it in",
    ],
    exclusiveOption: "Nothing shifted yet — I'm still taking it in",
    detailPrompt: "Optional — one sentence for your family culture:",
    detailPlaceholder: "In this family, we…",
  },
  nextStep: {
    sectionLabel: "TRY TONIGHT — HIGH/LOW",
    prompt:
      "Before bed: initiate High/Low in a low-stakes moment. Rule: you go first. Share your high and your low. Model vulnerability.",
    helper: "Watch how they mirror you when you're sharing, not interrogating.",
    placeholder: "When tonight and what you'll share…",
    maxLength: 300,
  },
  closure: {
    lines: [
      "Thank you for showing up.",
      "You completed Module 5. Mirror, anchor, compass, witness, ritual — from doing motivation to building identity.",
      "Intentionality is built ritual by ritual, script by script, moment by moment.",
      "You're not just managing behavior. You're building a human.",
      "All entries are private to you.",
    ],
    nextLessonLabel: "Module 5 complete.",
    ctaLabel: "Save entry",
  },
};

const RITUALS_BY_LESSON: Record<string, SelfCheckRitual> = {
  [WEEK1_SELF_CHECK.lessonId]: WEEK1_SELF_CHECK,
  [LESSON_1_2_SELF_CHECK.lessonId]: LESSON_1_2_SELF_CHECK,
  [LESSON_1_3_SELF_CHECK.lessonId]: LESSON_1_3_SELF_CHECK,
  [LESSON_1_4_SELF_CHECK.lessonId]: LESSON_1_4_SELF_CHECK,
  [LESSON_1_5_SELF_CHECK.lessonId]: LESSON_1_5_SELF_CHECK,
  [LESSON_1_6_SELF_CHECK.lessonId]: LESSON_1_6_SELF_CHECK,
  [LESSON_2_1_SELF_CHECK.lessonId]: LESSON_2_1_SELF_CHECK,
  [LESSON_2_2_SELF_CHECK.lessonId]: LESSON_2_2_SELF_CHECK,
  [LESSON_2_3_SELF_CHECK.lessonId]: LESSON_2_3_SELF_CHECK,
  [LESSON_2_4_SELF_CHECK.lessonId]: LESSON_2_4_SELF_CHECK,
  [LESSON_2_5_SELF_CHECK.lessonId]: LESSON_2_5_SELF_CHECK,
  [LESSON_2_6_SELF_CHECK.lessonId]: LESSON_2_6_SELF_CHECK,
  [LESSON_3_1_SELF_CHECK.lessonId]: LESSON_3_1_SELF_CHECK,
  [LESSON_3_2_SELF_CHECK.lessonId]: LESSON_3_2_SELF_CHECK,
  [LESSON_3_3_SELF_CHECK.lessonId]: LESSON_3_3_SELF_CHECK,
  [LESSON_3_4_SELF_CHECK.lessonId]: LESSON_3_4_SELF_CHECK,
  [LESSON_3_5_SELF_CHECK.lessonId]: LESSON_3_5_SELF_CHECK,
  [LESSON_3_6_SELF_CHECK.lessonId]: LESSON_3_6_SELF_CHECK,
  [LESSON_3_7_SELF_CHECK.lessonId]: LESSON_3_7_SELF_CHECK,
  [LESSON_4_1_SELF_CHECK.lessonId]: LESSON_4_1_SELF_CHECK,
  [LESSON_4_2_SELF_CHECK.lessonId]: LESSON_4_2_SELF_CHECK,
  [LESSON_4_3_SELF_CHECK.lessonId]: LESSON_4_3_SELF_CHECK,
  [LESSON_4_4_SELF_CHECK.lessonId]: LESSON_4_4_SELF_CHECK,
  [LESSON_4_5_SELF_CHECK.lessonId]: LESSON_4_5_SELF_CHECK,
  [LESSON_4_6_SELF_CHECK.lessonId]: LESSON_4_6_SELF_CHECK,
  [LESSON_5_1_SELF_CHECK.lessonId]: LESSON_5_1_SELF_CHECK,
  [LESSON_5_2_SELF_CHECK.lessonId]: LESSON_5_2_SELF_CHECK,
  [LESSON_5_3_SELF_CHECK.lessonId]: LESSON_5_3_SELF_CHECK,
  [LESSON_5_4_SELF_CHECK.lessonId]: LESSON_5_4_SELF_CHECK,
  [LESSON_5_5_SELF_CHECK.lessonId]: LESSON_5_5_SELF_CHECK,
  [LESSON_5_6_SELF_CHECK.lessonId]: LESSON_5_6_SELF_CHECK,
};

export function getSelfCheckRitual(lessonId: string): SelfCheckRitual | null {
  const ritual = RITUALS_BY_LESSON[lessonId] ?? null;
  return ritual ? applyTherapeuticDefaults(ritual) : null;
}
