"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageInFullYears = ageInFullYears;
exports.computeAgeBand = computeAgeBand;
exports.parseBirthDate = parseBirthDate;
/** Full calendar years between birth date and today. */
function ageInFullYears(birthDate, today = new Date()) {
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}
function computeAgeBand(birthDate, today = new Date()) {
  return ageInFullYears(birthDate, today) <= 6 ? "4-6" : "6-12";
}
/** Parse ISO date string "YYYY-MM-DD" safely in local time. */
function parseBirthDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
