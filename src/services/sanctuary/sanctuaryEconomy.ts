import {
  accumulateMetrics,
  trackWonderEarned,
  type SanctuaryAnalyticsEvent,
} from "@/src/domain/sanctuary";
import {
  createStubFishingRepository,
  createInMemoryWonderRepository,
  createInMemoryRodRepository,
  createInMemoryResonanceRepository,
  type SanctuaryEconomyRepository,
} from "@/src/repositories/sanctuary";

const analyticsEvents: SanctuaryAnalyticsEvent[] = [];

function track(event: SanctuaryAnalyticsEvent) {
  analyticsEvents.unshift(event);
  if (analyticsEvents.length > 500) analyticsEvents.pop();
}

let economy: SanctuaryEconomyRepository | null = null;

export function getSanctuaryEconomy(): SanctuaryEconomyRepository {
  if (!__DEV__) {
    throw new Error("getSanctuaryEconomy is DEV/test only (Invariant 6)");
  }
  if (!economy) {
    const wonder = createInMemoryWonderRepository();
    economy = {
      wonder,
      fishing: createStubFishingRepository(),
      rods: createInMemoryRodRepository(wonder),
      resonance: createInMemoryResonanceRepository(),
    };
  }
  return economy;
}

export function recordWonderAnalytics(
  userId: string,
  source: Parameters<typeof trackWonderEarned>[1],
  amount: number,
) {
  track(trackWonderEarned(userId, source, amount));
}

export function getReflectionVsFarmingMetrics() {
  return accumulateMetrics(analyticsEvents);
}

export function resetSanctuaryAnalytics() {
  analyticsEvents.length = 0;
}
