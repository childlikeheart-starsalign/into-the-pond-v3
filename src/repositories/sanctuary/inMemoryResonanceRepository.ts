import { computeSanctuaryResonance } from "@/src/domain/sanctuary";
import type { ResonanceRepository } from "./interfaces";

const lastReflection = new Map<string, number | null>();

export function createInMemoryResonanceRepository(): ResonanceRepository {
  return {
    async getResonance(userId) {
      return computeSanctuaryResonance(userId, {
        lastReflectionAt: lastReflection.get(userId) ?? null,
      });
    },
    async touchReflection(userId, timestamp = Date.now()) {
      lastReflection.set(userId, timestamp);
      return computeSanctuaryResonance(userId, { lastReflectionAt: timestamp });
    },
  };
}

export function resetInMemoryResonanceStore() {
  lastReflection.clear();
}
