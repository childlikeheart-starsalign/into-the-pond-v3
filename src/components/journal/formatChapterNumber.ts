/**
 * Chapter labels for Create Child Profile (Surface 3).
 * Roman numerals only for en* locales — Western typographic affectation.
 */

export type ChildProfileChapterStep = "name" | "age" | "companion" | "interests";

const CHAPTER_TITLES: Record<ChildProfileChapterStep, string> = {
  name: "The Name",
  age: "The Season",
  companion: "The Companion",
  interests: "The Curiosities",
};

const ROMAN: Record<ChildProfileChapterStep, string> = {
  name: "I",
  age: "II",
  companion: "III",
  interests: "IV",
};

const ARABIC: Record<ChildProfileChapterStep, string> = {
  name: "1",
  age: "2",
  companion: "3",
  interests: "4",
};

export function usesRomanChapterNumerals(locale: string): boolean {
  const normalized = locale.trim().toLowerCase();
  return normalized === "en" || normalized.startsWith("en-") || normalized.startsWith("en_");
}

/**
 * Formats a chapter margin label for a Create Child Profile step.
 * @param step - Flow step (name/age/companion/interests only)
 * @param locale - BCP-47 locale string (e.g. "en-US", "fr-FR")
 */
export function formatChapterLabel(step: ChildProfileChapterStep, locale: string): string {
  const title = CHAPTER_TITLES[step];
  const number = usesRomanChapterNumerals(locale) ? ROMAN[step] : ARABIC[step];
  return `Chapter ${number} — ${title}`;
}

/** 1-based index (1–4) → step; returns null when outside the numbered ceremony. */
export function chapterStepFromIndex(index: number): ChildProfileChapterStep | null {
  if (index === 1) return "name";
  if (index === 2) return "age";
  if (index === 3) return "companion";
  if (index === 4) return "interests";
  return null;
}
