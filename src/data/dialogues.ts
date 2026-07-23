import type { SceneBackgroundKey } from "@/src/constants/dialogueBackgrounds";

export type DialogueSpeaker = "parent" | "child" | "spirit" | "none";

export type DialoguePortraitKey =
  | "parent_frustrated"
  | "parent_tired"
  | "child_defiant"
  | "child_hurt"
  | "child_happy"
  | "spirit_old"
  | "spirit_warm"
  | "spirit_smile"
  | "spirit_wise"
  | "spirit_pointing"
  | "spirit_kneeling";

export type DialogueUiType = "text_input" | "select" | "quick_check" | "birthdate";

export type DialogueDynamicField = "Name" | "ChildName" | "archetype" | "displayArchetypeName";

export type DialogueLine = {
  speaker: DialogueSpeaker;
  text: string;
  portrait: DialoguePortraitKey | null;
  uiType?: DialogueUiType;
  placeholder?: string;
  /** Coach-mark target; used outside Part 2 first-run (content reserved). */
  highlightTarget?: "classroom_tab" | "diary_tab" | "pond_landmark";
};

export type DialogueScene = {
  id: string;
  lines: DialogueLine[];
  dynamicFields?: DialogueDynamicField[];
  backgroundKey?: SceneBackgroundKey;
  /** Stop playback after this inclusive line index (e.g. garden_intro before nav mention). */
  lastLineIndex?: number;
};

/** Part 1 — signed-out, after Gate key */
export const PRE_AUTH_PROLOGUE_SCENE_IDS = [
  "kitchen_argument",
  "spirit_over_kitchen",
  "garden_transition",
  "garden_intro",
  "signup_bridge",
] as const;

/** Part 2 — signed-in. `sanctuary_pond_intro` plays ONLY after callable success. */
export const POST_AUTH_PROLOGUE_SCENE_IDS = [
  "name_prompt",
  "name_confirmation",
  "child_nickname_prompt",
  "birthdate_prompt",
  "archetype_quick_check",
  "archetype_result_confirmation",
  // --- prepare (createChildProfile callable) runs here, not a scene id ---
  "sanctuary_pond_intro",
] as const;

/** Moved out of first-run Part 2 — triggered as coach marks on first sanctuary visit */
export const SANCTUARY_FIRST_VISIT_SCENE_IDS = [
  "classroom_diary_intro",
  "pond_practice_intro",
] as const;

export type PreAuthPrologueSceneId = (typeof PRE_AUTH_PROLOGUE_SCENE_IDS)[number];
export type PostAuthPrologueSceneId = (typeof POST_AUTH_PROLOGUE_SCENE_IDS)[number];
export type SanctuaryFirstVisitSceneId = (typeof SANCTUARY_FIRST_VISIT_SCENE_IDS)[number];

export const dialogues: Record<string, DialogueScene> = {
  kitchen_argument: {
    id: "kitchen_argument",
    backgroundKey: "kitchen_argument",
    lines: [
      {
        speaker: "parent",
        text: "You're not even trying. You just want to be difficult.",
        portrait: "parent_frustrated",
      },
      {
        speaker: "child",
        text: "You don't understand. You never listen.",
        portrait: "child_defiant",
      },
      {
        speaker: "none",
        text: "[Silence. The clock ticks. The child's eyes are wet, but their jaw is tight. The parent rubs their face.]",
        portrait: null,
      },
      {
        speaker: "parent",
        text: "I'm doing this because I love you.",
        portrait: "parent_tired",
      },
      {
        speaker: "child",
        text: "Then why does it feel like you hate me?",
        portrait: "child_hurt",
      },
      {
        speaker: "none",
        text: "[Neither of them moves. The pile of homework sits between them like a wall.]",
        portrait: null,
      },
    ],
  },

  spirit_over_kitchen: {
    id: "spirit_over_kitchen",
    backgroundKey: "kitchen_argument",
    lines: [
      {
        speaker: "spirit",
        text: "You don't want your relationship with your children to be ruined by homework.",
        portrait: "spirit_old",
      },
      {
        speaker: "none",
        text: "[The scene freezes. The colour drains, leaving only the two figures in dim light.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Not because you are bad parents. Because you forgot that the child across the table is not the enemy. And neither are you.",
        portrait: "spirit_warm",
      },
    ],
  },

  garden_transition: {
    id: "garden_transition",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "none",
        text: "[The memory dissolves. The kitchen fades. The garden appears – the pond, the old spirit, the child-avatar sitting alone on a stone.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "That fight happens in a thousand homes tonight. It does not have to happen in yours.",
        portrait: "spirit_wise",
      },
      {
        speaker: "spirit",
        text: "Turn the page. Not the worksheet – the door.",
        portrait: "spirit_pointing",
      },
    ],
  },

  garden_intro: {
    id: "garden_intro",
    backgroundKey: "sanctuary",
    // Trim the bottom-nav narration from Part 1; it plays just before sanctuary replace.
    lastLineIndex: 1,
    lines: [
      {
        speaker: "none",
        text: "[The child-avatar looks up. Not at you. At the pond. A small, tentative smile.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "The garden is not an escape. It is a reminder. You are here to remember how to wonder together.",
        portrait: "spirit_smile",
      },
      {
        speaker: "none",
        text: "[The bottom navigation appears. The journey begins.]",
        portrait: null,
      },
    ],
  },

  signup_bridge: {
    id: "signup_bridge",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "Before the garden can remember you, leave a quiet mark of who you are. Create an account — then we continue together.",
        portrait: "spirit_warm",
      },
    ],
  },

  name_prompt: {
    id: "name_prompt",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "Before you walk further, tell me your name. Not the one on the report card – the one your heart answers to.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[A gentle input field appears, floating like a leaf on water.]",
        portrait: null,
        uiType: "text_input",
        placeholder: "Enter your name",
      },
    ],
  },

  name_confirmation: {
    id: "name_confirmation",
    backgroundKey: "sanctuary",
    dynamicFields: ["Name"],
    lines: [
      {
        speaker: "spirit",
        text: "Thank you, [Name]. Now – look at the child by the pond. They are not your child, and they are also every child.",
        portrait: "spirit_wise",
      },
      {
        speaker: "spirit",
        text: "Their weather changes like the sky.",
        portrait: "spirit_pointing",
      },
    ],
  },

  child_nickname_prompt: {
    id: "child_nickname_prompt",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "What do you call your child when no one else is listening? A nickname is enough — the garden does not need a full name.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[A soft leaf of space waits for a nickname.]",
        portrait: null,
        uiType: "text_input",
        placeholder: "Child's nickname",
      },
    ],
  },

  birthdate_prompt: {
    id: "birthdate_prompt",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "Tell me when they arrived in the world — month and year is enough. The garden will meet them where they are.",
        portrait: "spirit_wise",
      },
      {
        speaker: "none",
        text: "[A gentle birth-month field settles into view.]",
        portrait: null,
        uiType: "birthdate",
      },
    ],
  },

  archetype_quick_check: {
    id: "archetype_quick_check",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "Tell me about your child. Which pattern do you recognise most right now? You can explore all paths later. This just helps us start in the right place.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[Five quiet cards wait — one pattern at a time.]",
        portrait: null,
        uiType: "quick_check",
      },
    ],
  },

  archetype_result_confirmation: {
    id: "archetype_result_confirmation",
    backgroundKey: "sanctuary",
    dynamicFields: ["displayArchetypeName"],
    lines: [
      {
        speaker: "spirit",
        text: "[displayArchetypeName]",
        portrait: "spirit_smile",
      },
    ],
  },

  sanctuary_pond_intro: {
    id: "sanctuary_pond_intro",
    backgroundKey: "sanctuary",
    lines: [
      {
        speaker: "spirit",
        text: "The outside world feels chaotic. Noise, pressure, endless demands. But here – this is the sanctuary.",
        portrait: "spirit_wise",
      },
      {
        speaker: "spirit",
        text: "A place to learn how to build internal stability in your child, from the inside out.",
        portrait: "spirit_kneeling",
      },
      {
        speaker: "none",
        text: "[The pond shimmers. Ripples spread slowly.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Look at the water. It does not shout. It reflects. It holds whatever falls into it and eventually returns to stillness.",
        portrait: "spirit_pointing",
      },
      {
        speaker: "spirit",
        text: "That is what you are learning here – not to control the storm, but to offer a quiet shore.",
        portrait: "spirit_smile",
      },
      {
        speaker: "none",
        text: "[The bottom navigation appears. The journey begins.]",
        portrait: null,
      },
    ],
  },

  classroom_diary_intro: {
    id: "classroom_diary_intro",
    lines: [
      {
        speaker: "none",
        text: "[The camera pans to a wooden lectern with an open book.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Through the classroom, you will learn small, daily practices – ways to motivate your child that are not pushy, yet effective.",
        portrait: "spirit_wise",
        highlightTarget: "classroom_tab",
      },
      {
        speaker: "spirit",
        text: "Methods that do not sacrifice your relationship. That help them maximise their potential and solve problems on their own.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[Pages turn softly. The diary glows briefly.]",
        portrait: null,
        highlightTarget: "diary_tab",
      },
      {
        speaker: "spirit",
        text: "Every lesson ends with a reflection – your reflection. You write down what you tried, what you noticed, what you will do tomorrow.",
        portrait: "spirit_kneeling",
      },
      {
        speaker: "spirit",
        text: "This is not homework. It is a map back to wonder.",
        portrait: "spirit_smile",
      },
    ],
  },

  pond_practice_intro: {
    id: "pond_practice_intro",
    lines: [
      {
        speaker: "none",
        text: "[The camera returns to the pond. A small fishing rod leans against a stone.]",
        portrait: null,
        highlightTarget: "pond_landmark",
      },
      {
        speaker: "spirit",
        text: "And here, at the pond. You will figure out what the pond will do after you finish lessons 1.1 to 1.3. Meanwhile, take your time.",
        portrait: "spirit_wise",
      },
      {
        speaker: "none",
        text: "[The child-avatar looks at the pond curiously.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Begin at the pond when your heart is heavy. Visit the classroom when you need a guide. Write in the diary when you need to remember.",
        portrait: "spirit_warm",
      },
      {
        speaker: "spirit",
        text: "Share with your partner your insights when you feel want to. The garden has no clock. It has only you – and the child you are learning to see.",
        portrait: "spirit_smile",
      },
      {
        speaker: "none",
        text: "[The child-avatar looks up at you and gives a small, tentative wave.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Now, Keeper. Step lightly. The wonder is already here.",
        portrait: "spirit_smile",
      },
    ],
  },

  pond_locked: {
    id: "pond_locked",
    lines: [
      {
        speaker: "spirit",
        text: "The pond is quiet for now. Casting requires a fishing rod – and a rod needs parts.",
        portrait: "spirit_wise",
      },
      {
        speaker: "spirit",
        text: "Complete lessons 1.1, 1.2, and 1.3. Each lesson will give you a piece. After the third lesson, return here, and the rod will be ready.",
        portrait: "spirit_pointing",
      },
    ],
  },

  pond_unlocked_no_rod: {
    id: "pond_unlocked_no_rod",
    lines: [
      {
        speaker: "spirit",
        text: "Ah, you've come to cast your first line. But a rod does not appear by wishing. It must be made – by your own hands.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[He gestures toward the craft bench, a small wooden table beside the pond with tools and twigs.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Go to the craft bench. Gather the parts you earned from the first three lessons. Build your rod.",
        portrait: "spirit_pointing",
      },
      {
        speaker: "spirit",
        text: "Remember: give a man a fish, you feed him for a day. Teach him to fish, you feed him for a lifetime – and broaden his horizon.",
        portrait: "spirit_smile",
      },
      {
        speaker: "spirit",
        text: "You'll see. Parenting is amazing. Now, build your rod. The pond will wait.",
        portrait: "spirit_kneeling",
      },
    ],
  },

  first_cast: {
    id: "first_cast",
    lines: [
      {
        speaker: "none",
        text: "[The child-avatar is sitting by the water, holding the rod.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Look. It is not you who casts the line. It is the child – the one you are learning to see.",
        portrait: "spirit_wise",
      },
      {
        speaker: "none",
        text: "[The child-avatar dips the rod into the water. Ripples spread.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "You built the rod. You taught them how to hold it. Now you step back. You watch. You wait.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[The child-avatar pulls the line gently, curious, patient.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "This is how it works outside the garden too – you give them the tools. You show them the way.",
        portrait: "spirit_kneeling",
      },
      {
        speaker: "spirit",
        text: "But the casting, the wonder, the question itself – that is theirs. You are not here to fish for them.",
        portrait: "spirit_pointing",
      },
      {
        speaker: "spirit",
        text: "You are here to trust that they will learn to fish for themselves.",
        portrait: "spirit_smile",
      },
      {
        speaker: "none",
        text: "[A pause. A warm smile.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Give a man a fish, you feed him for a day. Teach him to fish, you feed him for a lifetime – and broaden his horizon. You'll see. Parenting is amazing.",
        portrait: "spirit_smile",
      },
    ],
  },

  first_catch: {
    id: "first_catch",
    lines: [
      {
        speaker: "none",
        text: "[The child-avatar looks back, beaming. A small fish leaps from the water.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "Now watch. The first catch is always the sweetest.",
        portrait: "spirit_warm",
      },
      {
        speaker: "none",
        text: "[The child-avatar holds up the little creature.]",
        portrait: null,
      },
      {
        speaker: "child",
        text: "Look! I caught it all by myself!",
        portrait: "child_happy",
      },
      {
        speaker: "spirit",
        text: "They will remember this moment. Not because of the fish, but because they did it alone – and you were there. Watching. Trusting.",
        portrait: "spirit_wise",
      },
      {
        speaker: "none",
        text: "[The child-avatar gently releases the creature back into the water. It swims away, glowing softly.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "You are learning, too, Keeper. You are learning to wait without worry. To watch without fixing. To hold space without filling it.",
        portrait: "spirit_kneeling",
      },
      {
        speaker: "none",
        text: "[The child-avatar picks up the rod again, eager for the next cast.]",
        portrait: null,
      },
      {
        speaker: "spirit",
        text: "One catch, and the whole world shifts. Imagine what happens after the next. And the next.",
        portrait: "spirit_smile",
      },
      {
        speaker: "none",
        text: "[The child-avatar looks back at you, beaming.]",
        portrait: null,
      },
    ],
  },
};

export type PondGateDialogueSceneId = "pond_locked" | "pond_unlocked_no_rod";

/**
 * Pond tap gate helper (not wired this pass).
 * Map inventory.rod concepts to completed lessons + basic rod ready|equipped.
 */
export function resolvePondGateDialogueScene(args: {
  completedLessons: Record<string, boolean> | string[] | null | undefined;
  /** `playerRods.basic.state` — ready or equipped counts as "in hand". */
  basicRodState: string | null | undefined;
}): PondGateDialogueSceneId | null {
  const required = ["1.1", "1.2", "1.3"];
  const completed = args.completedLessons;
  const hasLesson = (id: string): boolean => {
    if (!completed) return false;
    if (Array.isArray(completed)) return completed.includes(id);
    return completed[id] === true;
  };
  const lessonsDone = required.every(hasLesson);
  if (!lessonsDone) return "pond_locked";

  const rodInHand = args.basicRodState === "ready" || args.basicRodState === "equipped";
  if (!rodInHand) return "pond_unlocked_no_rod";
  return null;
}

export function getDialogueScene(sceneId: string): DialogueScene | null {
  return dialogues[sceneId] ?? null;
}

export function applyDialogueDynamicFields(
  text: string,
  fields: Partial<Record<DialogueDynamicField, string>>,
): string {
  let out = text;
  if (fields.Name) out = out.replaceAll("[Name]", fields.Name);
  if (fields.ChildName) out = out.replaceAll("[ChildName]", fields.ChildName);
  if (fields.archetype) out = out.replaceAll("[archetype]", fields.archetype);
  if (fields.displayArchetypeName) {
    out = out.replaceAll("[displayArchetypeName]", fields.displayArchetypeName);
  }
  return out;
}
