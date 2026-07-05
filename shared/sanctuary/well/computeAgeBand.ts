import type { AgeBand } from "./types";

/** Full calendar years between birth date and today. */
export function ageInFullYears(birthDate: Date, today = new Date()): number {
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

export function computeAgeBand(birthDate: Date, today = new Date()): AgeBand {
  return ageInFullYears(birthDate, today) <= 6 ? "4-6" : "6-12";
}

/** Parse ISO date string "YYYY-MM-DD" safely in local time. */
export function parseBirthDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
