"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ageYearsFromBirthDate = ageYearsFromBirthDate;
exports.parseDobToDate = parseDobToDate;
exports.ageYearsFromDob = ageYearsFromDob;
exports.buildChildrenSummaryEntry = buildChildrenSummaryEntry;
exports.formatLastExploredLabel = formatLastExploredLabel;
exports.stampLastVisited = stampLastVisited;
/** Full calendar years between birth date and today. */
function ageYearsFromBirthDate(birthDate, today = new Date()) {
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}
/** Parse ISO date string "YYYY-MM-DD" safely in local time. */
function parseDobToDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
function ageYearsFromDob(dob, today = new Date()) {
  const birth = parseDobToDate(dob);
  if (!birth) return null;
  const years = ageYearsFromBirthDate(birth, today);
  return years >= 0 && years < 130 ? years : null;
}
function buildChildrenSummaryEntry(args) {
  const ageYears =
    typeof args.dob === "string" && args.dob.trim()
      ? ageYearsFromDob(args.dob, args.today ?? new Date())
      : null;
  return {
    childId: args.childId,
    name: args.name,
    companionId: args.companionId,
    childOrder: args.childOrder,
    displayArchetypeName: args.displayArchetypeName ?? null,
    ageYears,
    lastVisitedAt: args.lastVisitedAt ?? null,
    recentDeepChecks: args.recentDeepChecks ?? null,
  };
}
function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function timeOfDayPhrase(hour) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
/**
 * Warm relative label for journal cards — never technical timestamps.
 * Returns null when unknown so the UI can omit the line.
 */
function formatLastExploredLabel(iso, now = new Date()) {
  if (typeof iso !== "string" || !iso.trim()) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = startOfLocalDay(now).getTime();
  const thenStart = startOfLocalDay(then).getTime();
  const dayDiff = Math.round((todayStart - thenStart) / dayMs);
  const tod = timeOfDayPhrase(then.getHours());
  if (dayDiff === 0) {
    if (tod === "morning") return "This morning";
    if (tod === "afternoon") return "This afternoon";
    return "This evening";
  }
  if (dayDiff === 1) {
    if (tod === "morning") return "Yesterday morning";
    if (tod === "afternoon") return "Yesterday afternoon";
    return "Yesterday evening";
  }
  if (dayDiff >= 2 && dayDiff <= 6) return "Earlier this week";
  if (dayDiff >= 7 && dayDiff <= 20) return "A little while ago";
  return "Some time ago";
}
function stampLastVisited(summary, childId, atIso) {
  return summary.map((entry) =>
    entry.childId === childId ? { ...entry, lastVisitedAt: atIso } : entry,
  );
}
