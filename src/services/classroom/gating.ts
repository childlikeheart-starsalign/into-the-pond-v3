import { SubscriptionStatus } from "@/src/services/firebase/types";

export type LessonGateState = "open" | "locked_paywall";

function parseLessonId(lessonId: string) {
  const [moduleRaw, lessonRaw] = lessonId.split(".");
  const module = Number(moduleRaw);
  const lesson = Number(lessonRaw);
  return { module, lesson };
}

export function canAccessLesson(lessonId: string, tier: SubscriptionStatus) {
  const { module, lesson } = parseLessonId(lessonId);
  if (!Number.isFinite(module) || !Number.isFinite(lesson)) return false;

  if (module === 1 && lesson <= 3) return true;
  if (tier === "free") return false;
  if (tier === "wooden") return module <= 3;
  return true;
}

export function getLessonGateState(lessonId: string, tier: SubscriptionStatus): LessonGateState {
  return canAccessLesson(lessonId, tier) ? "open" : "locked_paywall";
}

export function getPaywallLockCopy() {
  return {
    label: "Locked - membership required",
    cta: "See membership options",
  };
}

export const MARKETING_TIER_NAME: Record<SubscriptionStatus, string> = {
  free: "Explorer",
  wooden: "Wooden Rod",
  fiberglass: "Fiberglass Rod",
};

