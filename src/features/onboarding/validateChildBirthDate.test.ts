import {
  childBirthYearRange,
  validateChildBirthMonthYear,
} from "@/src/features/onboarding/validateChildBirthDate";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message);
}

export function runValidateChildBirthDateSelfTest(): void {
  const today = new Date(2026, 5, 14);

  expectEqual(childBirthYearRange(today).minYear, 2014, "min year");
  expectEqual(childBirthYearRange(today).maxYear, 2022, "max year");

  const age6 = validateChildBirthMonthYear(6, 2020, today);
  expectTrue(age6.ok, "age 6 valid");
  if (age6.ok) expectEqual(age6.isoDate, "2020-06-01", "iso date");

  const age7 = validateChildBirthMonthYear(6, 2019, today);
  expectTrue(age7.ok, "age 7 valid");

  const tooYoung = validateChildBirthMonthYear(12, 2022, today);
  expectTrue(!tooYoung.ok && tooYoung.error === "too_young", "too young rejected");

  const tooOld = validateChildBirthMonthYear(1, 2010, today);
  expectTrue(!tooOld.ok && tooOld.error === "too_old", "too old rejected");

  expectTrue(validateChildBirthMonthYear(0, 2020, today).ok === false, "month 0 invalid");
  expectTrue(validateChildBirthMonthYear(13, 2020, today).ok === false, "month 13 invalid");
}
