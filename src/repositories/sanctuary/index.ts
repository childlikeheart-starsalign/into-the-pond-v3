export type { SanctuaryEconomyRepository, WonderRepository, FishingRepository } from "./interfaces";
export { createInMemoryWonderRepository, seedWonderFromLegacy } from "./inMemoryWonderRepository";
export { createStubFishingRepository } from "./stubFishingRepository";
export { createInMemoryRodRepository, resetInMemoryRodStore } from "./inMemoryRodRepository";
export {
  createInMemoryResonanceRepository,
  resetInMemoryResonanceStore,
} from "./inMemoryResonanceRepository";

import { createStubFishingRepository } from "./stubFishingRepository";
import { createInMemoryResonanceRepository } from "./inMemoryResonanceRepository";
import { createInMemoryRodRepository } from "./inMemoryRodRepository";
import { createInMemoryWonderRepository } from "./inMemoryWonderRepository";
import type { SanctuaryEconomyRepository } from "./interfaces";

export function createInMemorySanctuaryEconomy(): SanctuaryEconomyRepository {
  const wonder = createInMemoryWonderRepository();
  return {
    wonder,
    fishing: createStubFishingRepository(),
    rods: createInMemoryRodRepository(wonder),
    resonance: createInMemoryResonanceRepository(),
  };
}
