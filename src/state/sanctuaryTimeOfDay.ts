import type { SanctuaryTimeOfDay } from "@/src/constants/sanctuaryAssets";

let currentTimeOfDay: SanctuaryTimeOfDay = "afternoon";
const listeners = new Set<(value: SanctuaryTimeOfDay) => void>();

export function getSanctuaryTimeOfDay(): SanctuaryTimeOfDay {
  return currentTimeOfDay;
}

export function setSanctuaryTimeOfDay(value: SanctuaryTimeOfDay): void {
  if (currentTimeOfDay === value) return;
  currentTimeOfDay = value;
  listeners.forEach((listener) => listener(value));
}

export function subscribeSanctuaryTimeOfDay(
  listener: (value: SanctuaryTimeOfDay) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
