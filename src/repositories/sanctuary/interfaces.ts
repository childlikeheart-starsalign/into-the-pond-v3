import type {
  BaitCraftJob,
  BaitInventory,
  BaitTier,
  CatchEncounter,
  CreatureCollection,
  DiaryEntry,
  FishingClaim,
  FishingRodId,
  PracticeCompletion,
  PracticeKind,
  Rod,
  RodCraftJob,
  SanctuaryResonance,
  WellAnswer,
  WellQuestion,
  WonderAccount,
  WonderTransaction,
} from "@/src/domain/sanctuary";
import type { DiaryReflectionDepth } from "../../../shared/sanctuary/types";

export interface WonderRepository {
  getAccount(userId: string): Promise<WonderAccount>;
  saveAccount(account: WonderAccount): Promise<void>;
  appendTransaction(transaction: WonderTransaction): Promise<void>;
  listTransactions(userId: string, limit?: number): Promise<WonderTransaction[]>;
  earnFromDiary(
    userId: string,
    depth: DiaryReflectionDepth,
    entry: Omit<DiaryEntry, "wonderAwarded" | "id">,
  ): Promise<{ entry: DiaryEntry; transaction: WonderTransaction }>;
  earnFromWellQuestion(
    userId: string,
    question: Omit<WellQuestion, "wonderAwarded" | "id">,
  ): Promise<{ question: WellQuestion; transaction: WonderTransaction }>;
  earnFromWellAnswer(
    userId: string,
    answer: Omit<WellAnswer, "wonderAwarded">,
  ): Promise<{ answer: WellAnswer; transaction: WonderTransaction }>;
  earnFromPractice(
    userId: string,
    kind: PracticeKind,
    note?: string,
  ): Promise<{ completion: PracticeCompletion; transaction: WonderTransaction }>;
}

export interface FishingRepository {
  getCollection(userId: string): Promise<CreatureCollection>;
  saveCollection(collection: CreatureCollection): Promise<void>;
  getBaitInventory(userId: string): Promise<BaitInventory>;
  saveBaitInventory(userId: string, inventory: BaitInventory): Promise<void>;
  createEncounter(encounter: CatchEncounter): Promise<void>;
  getEncounter(userId: string, encounterId: string): Promise<CatchEncounter | null>;
  claimEncounter(userId: string, encounterId: string): Promise<FishingClaim>;
  craftBait(userId: string, tier: BaitTier): Promise<BaitCraftJob>;
}

export interface RodRepository {
  listRods(userId: string): Promise<Rod[]>;
  saveRod(userId: string, rod: Rod): Promise<void>;
  startCraft(userId: string, rodId: FishingRodId): Promise<RodCraftJob>;
  collectCraft(userId: string, jobId: string): Promise<Rod>;
}

export interface ResonanceRepository {
  getResonance(userId: string): Promise<SanctuaryResonance>;
  touchReflection(userId: string, timestamp?: number): Promise<SanctuaryResonance>;
}

export interface SanctuaryEconomyRepository {
  wonder: WonderRepository;
  fishing: FishingRepository;
  rods: RodRepository;
  resonance: ResonanceRepository;
}
