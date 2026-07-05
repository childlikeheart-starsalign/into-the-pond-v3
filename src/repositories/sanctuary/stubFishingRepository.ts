import type {
  BaitCraftJob,
  BaitInventory,
  BaitTier,
  CatchEncounter,
  CreatureCollection,
  FishingClaim,
} from "@/src/domain/sanctuary";
import type { FishingRepository } from "./interfaces";
import { createEmptyBaitInventory } from "../../../shared/sanctuary/bait/catalog";

/** In-memory prototype stub — fishing claims are server-authoritative in production. */
export function createStubFishingRepository(): FishingRepository {
  return {
    async getCollection(userId): Promise<CreatureCollection> {
      return {
        userId,
        caughtCreatureIds: [],
        poolCompletionFlags: {},
        updatedAt: Date.now(),
      };
    },
    async saveCollection() {
      throw new Error("Fishing persistence is server-only");
    },
    async getBaitInventory(): Promise<BaitInventory> {
      return createEmptyBaitInventory();
    },
    async saveBaitInventory() {
      throw new Error("Fishing persistence is server-only");
    },
    async createEncounter() {
      throw new Error("Fishing encounters are server-only");
    },
    async getEncounter(): Promise<CatchEncounter | null> {
      return null;
    },
    async claimEncounter(): Promise<FishingClaim> {
      throw new Error("Fishing claims are server-only");
    },
    async craftBait(): Promise<BaitCraftJob> {
      throw new Error("Bait crafting is server-only");
    },
  };
}
