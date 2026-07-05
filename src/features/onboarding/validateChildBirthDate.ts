import { ageInFullYears, parseBirthDate } from "@/shared/sanctuary/well/computeAgeBand";

export type BirthDateValidation =
  | { ok: true; isoDate: string }
  | { ok: false; error: "invalid" | "too_young" | "too_old" };

export function formatChildBirthIsoDate(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Allowed year range for month+year pickers (children roughly 4–12). */
export function childBirthYearRange(today = new Date()): { minYear: number; maxYear: number } {
  const currentYear = today.getFullYear();
  return { minYear: currentYear - 12, maxYear: currentYear - 4 };
}

export function validateChildBirthMonthYear(
  month: number,
  year: number,
  today = new Date(),
): BirthDateValidation {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, error: "invalid" };
  }

  const currentYear = today.getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
    return { ok: false, error: "invalid" };
  }

  const isoDate = formatChildBirthIsoDate(month, year);
  const birthDate = parseBirthDate(isoDate);
  if (!birthDate) {
    return { ok: false, error: "invalid" };
  }

  const age = ageInFullYears(birthDate, today);
  if (age < 4) return { ok: false, error: "too_young" };
  if (age > 12) return { ok: false, error: "too_old" };

  return { ok: true, isoDate };
}
