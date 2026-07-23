/**
 * Shared archetype caption bank for Quick Check + Deep Check parent-facing results.
 * Spirit voice is the front-of-card copy; psychology + needs appear on flip back.
 */

import type { DisplayArchetypeName } from "./archetypeQuickCheck";

/** Must stay aligned with CAPTION_THRESHOLDS_V1 in src/constants/archetypeMapCopy.ts */
const CENTER_BLEND_RADIUS = 18;
const TIE_BREAK_RATIO = 1.25;

export type ArchetypeCaptionEntry = {
  spiritVoice: string;
  psychologicalInterpretation: string;
  whatTheyNeed: string[];
  neuroscience?: string;
  ageBandNoteDeepCheck: string;
};

export const BOTH_CAN_BE_TRUE =
  "Your child can be all of these at different times – in different situations, moods, or moments. This is just a snapshot. Trust what you see, and reassess whenever things feel like they're shifting.";

export const ARCHETYPE_DISCLAIMER =
  "This is not a diagnosis. It is a tool for reflection – a way to see your child more clearly. If you have concerns about your child's development, behaviour, or emotional well-being, please speak to a qualified professional.";

export const FALLBACK_BLEND_CAPTION =
  "Your child is complex – a beautiful mix of different weathers. Trust what you see, and come back to reassess anytime.";

export const ARCHETYPE_CAPTION_BANK: Record<DisplayArchetypeName, ArchetypeCaptionEntry> = {
  "Still Pond": {
    spiritVoice:
      "Your child's world is deep and still. Ripples come from inside, not from pushing. Watch for the subtle rings.",
    psychologicalInterpretation:
      "This child feels safe enough to pause, but may struggle to articulate their needs. They are not avoiding — they are absorbing. They need gentle invitations, not demands. If pushed too hard, they may become invisible — not because they don't care, but because they don't know how to translate their inner world into words.",
    whatTheyNeed: [
      "Wait 5–10 seconds before repeating a question — silence is processing.",
      'Use indirect invitations: "I wonder if you\'re thinking about that…"',
      "Offer physical presence without verbal demand — sit nearby, read, draw.",
      "Validate their inner world: \"You don't have to say anything. I'm glad to be here with you.\"",
    ],
    neuroscience:
      "PFC moderately engaged (observing). Amygdala low arousal. High parasympathetic tone — quiet alertness, not shutdown.",
    ageBandNoteDeepCheck:
      "At this age, quietness is often a sign of thoughtful processing, not withdrawal. Trust that their inner world is rich.",
  },
  "Ember Child": {
    spiritVoice:
      "Beneath the quiet, a warm glow waits. When they resist, it's because they care deeply. Fan the spark gently.",
    psychologicalInterpretation:
      "This child is not passive — they are waiting with a strong internal compass. They may push back because they want to be heard. If they feel unheard, they may withdraw into a Still Pond state. Their spark needs gentle fuel, not dismissal.",
    whatTheyNeed: [
      'Acknowledge resistance: "I can see this matters to you."',
      'Give them a voice: "What would you like to say about this?"',
      'Offer a small choice within the boundary: "Now, or after a snack?"',
      'Validate their perspective: "I hear you — even if we don\'t agree."',
    ],
    neuroscience:
      "PFC working hard to hold back. Amygdala low–moderate — resistance signals engagement. Frustrated wanting, not overwhelm.",
    ageBandNoteDeepCheck:
      "At this age, resistance often signals engagement, not defiance. They want to understand — and to be understood.",
  },
  "Quiet Storm": {
    spiritVoice:
      "They hold the storm until it breaks. Then they need you to sit with them in the rain, not to stop it.",
    psychologicalInterpretation:
      "This child is not having a tantrum — they are having a stress response. Their explosion communicates overload, not misbehaviour. If met with punishment or shame, they may suppress feelings that erupt later.",
    whatTheyNeed: [
      "Safety first: remove demands, lower your voice, stay still.",
      "Co-regulate: \"I'm here. I'll wait with you.\"",
      'After the storm: reconnect — "That was big. Are you okay now?"',
      "Offer release rituals: movement, breath, sensory tools.",
    ],
    neuroscience:
      "PFC overwhelmed. Amygdala high arousal. Vagal tone unable to downregulate — needs co-regulation.",
    ageBandNoteDeepCheck:
      "At this age, the developing brain struggles to regulate big feelings. Your presence is their anchor.",
  },
  "Storm Child": {
    spiritVoice:
      "Their feelings are a wind that cannot be stilled. You don't calm the storm — you learn to sail it together.",
    psychologicalInterpretation:
      "This child is in fight/flight — they may not hear reason until their nervous system settles. Invalidating their feelings can teach that their inner world is unsafe.",
    whatTheyNeed: [
      "Lower the threat: remove demands, lower your voice, stay still.",
      "Co-regulate: \"I'm here. We'll figure this out together.\"",
      'After the storm: "I love you — even when it\'s hard."',
      "Keep predictable routines and clear, calm boundaries.",
    ],
    neuroscience:
      "PFC offline under high arousal. Amygdala driving survival response. Elevated stress activation.",
    ageBandNoteDeepCheck:
      "At this age, the stress response is powerful. Your calm is their greatest tool for regulation.",
  },
  "Weather Child": {
    spiritVoice: "They are all of these at different times. Your patience is their umbrella.",
    psychologicalInterpretation:
      "This child is context-sensitive — behaviour reflects the situation, not a fixed trait. Parents may misread a moment as a permanent label. Their feelings are real even when they change.",
    whatTheyNeed: [
      "Presence without labels: \"You're having a hard moment — and that's okay.\"",
      "Expect shifts by setting, mood, or fatigue.",
      "Validate feelings even when they change.",
      "Stay steady — your consistency is their sky.",
    ],
    neuroscience:
      "Flexible PFC, modulated amygdala, adaptive vagal tone — struggle is context-dependent, not trait-only.",
    ageBandNoteDeepCheck:
      "At this age, flexibility is a strength. Trust that their ability to adapt is a gift — not a flaw.",
  },
};

/** Alias used by existing callers — same strings as spiritVoice. */
export const DISPLAY_ARCHETYPE_RESULT_COPY: Record<DisplayArchetypeName, string> = {
  "Still Pond": ARCHETYPE_CAPTION_BANK["Still Pond"].spiritVoice,
  "Ember Child": ARCHETYPE_CAPTION_BANK["Ember Child"].spiritVoice,
  "Quiet Storm": ARCHETYPE_CAPTION_BANK["Quiet Storm"].spiritVoice,
  "Storm Child": ARCHETYPE_CAPTION_BANK["Storm Child"].spiritVoice,
  "Weather Child": ARCHETYPE_CAPTION_BANK["Weather Child"].spiritVoice,
};

type MapCornerName = "Storm" | "Wall" | "Spark" | "Quiet Tester";

const CORNER_TO_DISPLAY: Record<MapCornerName, DisplayArchetypeName> = {
  Wall: "Still Pond",
  Storm: "Quiet Storm",
  Spark: "Storm Child",
  "Quiet Tester": "Ember Child",
};

function blendDisplayName(a: MapCornerName, b: MapCornerName): DisplayArchetypeName {
  const set = new Set([a, b]);
  if (set.has("Storm") && set.has("Wall")) return "Quiet Storm";
  if (set.has("Storm") && set.has("Spark")) return "Storm Child";
  if (set.has("Wall") && set.has("Spark")) return "Ember Child";
  if (set.has("Quiet Tester")) return "Ember Child";
  return CORNER_TO_DISPLAY[a];
}

type Corner = { name: MapCornerName; axisA: number; axisB: number };

const CORNERS: readonly Corner[] = [
  { name: "Storm", axisA: 100, axisB: 0 },
  { name: "Wall", axisA: 0, axisB: 0 },
  { name: "Spark", axisA: 100, axisB: 100 },
  { name: "Quiet Tester", axisA: 0, axisB: 100 },
] as const;

function dist(a: number, b: number, x: number, y: number): number {
  return Math.hypot(a - x, b - y);
}

function nearestCorners(axisA: number, axisB: number) {
  const ranked = CORNERS.map((c) => ({
    corner: c,
    d: dist(axisA, axisB, c.axisA, c.axisB),
  })).sort((x, y) => x.d - y.d);
  return {
    nearest: ranked[0]!.corner,
    nearestDist: ranked[0]!.d,
    second: ranked[1]!.corner,
    secondDist: ranked[1]!.d,
  };
}

/**
 * Deep Check axes → parent-facing DisplayArchetypeName.
 * Reuses the same center / nearest / blend thresholds as map captions.
 */
export function resolveDisplayArchetypeFromAxes(
  axisA: number,
  axisB: number,
): DisplayArchetypeName {
  const d = dist(axisA, axisB, 50, 50);
  const { nearest, nearestDist, second, secondDist } = nearestCorners(axisA, axisB);
  if (d <= CENTER_BLEND_RADIUS) {
    return "Weather Child";
  }
  if (secondDist <= nearestDist * TIE_BREAK_RATIO) {
    return blendDisplayName(nearest.name, second.name);
  }
  return CORNER_TO_DISPLAY[nearest.name];
}

/** Quick Check map plot presets (inset from exact corners). */
export function axesFromDisplayArchetype(displayName: DisplayArchetypeName): {
  axisA: number;
  axisB: number;
} {
  switch (displayName) {
    case "Still Pond":
      return { axisA: 5, axisB: 5 };
    case "Ember Child":
      return { axisA: 5, axisB: 95 };
    case "Quiet Storm":
      return { axisA: 95, axisB: 5 };
    case "Storm Child":
      return { axisA: 95, axisB: 95 };
    case "Weather Child":
      return { axisA: 50, axisB: 50 };
  }
}

export function getCaptionEntry(displayName: DisplayArchetypeName): ArchetypeCaptionEntry {
  return ARCHETYPE_CAPTION_BANK[displayName];
}
