/**
 * Field-journal fishing outcome copy (Phase 1).
 * Variant A miss strings match the live placeholders from CURRENT_ENGINE_SUMMARY.
 */

export const NEW_CATCH_MESSAGES = [
  "Something new surfaced today. {creatureName} came up quietly, as if it had been waiting for the right moment.",
  "The line pulled gently, and {creatureName} rose into the light. It was the first time I had seen one like it.",
  "{creatureName} appeared at the surface today, unhurried and curious. I noted it carefully before it slipped back under.",
  "There was a small splash, then {creatureName}. It felt like the pond had been keeping it as a secret.",
  "Today the water gave up {creatureName}. It lingered just long enough to be remembered.",
] as const;

export const DUPLICATE_CATCH_MESSAGES = [
  "{creatureName} again — I recognized it right away. It seemed to know me too.",
  "The same visitor returned today: {creatureName}. Some friendships settle into rhythm.",
  "{creatureName} surfaced once more, familiar as an old page in the journal. I let it go with a nod.",
  "I had met {creatureName} before, and today it found me again. There was comfort in that.",
  "{creatureName} came back to the line today. Not every visit needs to be new to matter.",
] as const;

/** Variant A is the existing live wonder-gate miss string. */
export const MISS_WONDER_GATE_MESSAGES = [
  "The pond is still. Reflect, and return when you are ready.",
  "Nothing stirred today, and that felt alright. Some days the pond simply asks for patience.",
  "The water stayed quiet, holding its secrets a little longer. I sat with that instead of pushing past it.",
  "There was nothing to find here yet, only stillness. I made a note to come back after some reflection.",
  "The pond didn't answer today. It felt less like absence and more like an invitation to wait.",
] as const;

/** Variant A is the existing live chance-miss string. */
export const MISS_CHANCE_MESSAGES = [
  "Not this time. The water remembers your patience.",
  "The line came back empty today, but the water still felt full of possibility.",
  "Nothing bit this time, though I sensed something moving just out of reach. Tomorrow felt worth trying again.",
  "The pond stayed quiet on this cast. I didn't mind, patience has its own rhythm.",
  "I felt a tug that came to nothing. Still, the waiting itself felt worthwhile.",
] as const;

/** First cast with each domain rod — keyed by FishingRodId. */
export const FIRST_CAST_ROD_MESSAGES: Record<string, string> = {
  basic:
    "The first cast went out plain and unadorned, just wood and line meeting water. It felt like the beginning of something patient.",
  rare_fire:
    "The fire rod warmed in my hand before the line even left it. Casting it felt like tending a flame we were learning to hold steady together.",
  rare_water:
    "The water rod slipped in smooth, like it already knew the give and take of the pond. Some things go better when two are working with the current, not against it.",
  rare_wind:
    "The wind rod carried the line further than I expected, like it wanted to go on its own. I let it lead a little today.",
  rare_electric:
    "The electric rod crackled faintly at the first cast, unpredictable in a way that felt honest. Some days the pond teaches best through the mistakes.",
  rare_wildcard:
    "The pond felt wider the moment this rod touched water, like a gift I hadn't asked for. Every element seemed to answer at once.",
  epic_fire:
    "This cast went deeper than the others, past the shallow fire pool into something older. It felt like returning to a flame we'd already learned to tend, now asked to go further.",
  epic_water:
    "The line sank further than before, into a stiller, deeper water. It felt like continuing a conversation we'd only started.",
  epic_wind:
    "The wind rod pulled the line out past where I'd cast before. Something about going further felt like trusting what we'd already built.",
  epic_electric:
    "This cast reached past the familiar current into deeper, less certain water. Growth, it turned out, kept asking for one more try.",
};

export function fillCreatureName(template: string, creatureDisplayName: string): string {
  return template.replaceAll("{creatureName}", creatureDisplayName);
}

export function pickMessageVariant(seed: string, variants: readonly string[]): string {
  if (variants.length === 0) return "";
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const idx = (h >>> 0) % variants.length;
  return variants[idx]!;
}
