/** Routes where the continuous evening-pond session bed plays (signed-in main app). */
const POND_SESSION_PATHS = new Set([
  "/sanctuary",
  "/classroom",
  "/net",
  "/store",
  "/folio",
  "/gate",
  "/well",
  "/craft",
  "/diary-entry",
  "/practice-moment",
  "/lesson-complete",
  "/child-atlas",
  "/customer-center",
]);

/**
 * Prologue story bed — plays for signed-out Part 1 and signed-in Part 2.
 * Uses the shared evening-pond player (same family as gate ambient).
 */
const PROLOGUE_AMBIENT_PATHS = new Set(["/prologue", "/prologue-continuation"]);

const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/finish-email",
  "/verify-required",
  "/email-verified",
  "/deletion-pending",
  "/narrative-onboarding",
  "/create-child-profile",
  "/child-profile-limit",
  "/archetype-map-fixture",
  "/pond-ripple-fixture",
  "/cast-finish-fixture",
  "/sentry-verification-crash",
];

function normalizePathname(pathname: string): string {
  const base = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (base.length > 1 && base.endsWith("/")) {
    return base.slice(0, -1);
  }
  return base || "/";
}

export function isPondSessionRoute(pathname: string, uid: string | null): boolean {
  const path = normalizePathname(pathname);
  if (path === "/") return false;

  if (EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return false;
  }

  // Part 1 is signed-out; Part 2 is usually signed-in — both keep the story bed.
  if (PROLOGUE_AMBIENT_PATHS.has(path)) return true;

  if (!uid) return false;

  return POND_SESSION_PATHS.has(path);
}
