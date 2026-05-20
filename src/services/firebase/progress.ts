import { getDocument, setDocument } from "@/src/services/firebase/firestore";
import {
  ActiveCast,
  RodTier,
  UserDoc,
  UserInventory,
  WellQuestionDoc,
} from "@/src/services/firebase/types";

const USERS_COLLECTION = "users";

export type RodStatus = {
  activeRod: RodTier;
  rodDullnessCount: number;
  isRodDull: boolean;
  activeCast: ActiveCast | null;
};

export type InventoryItem = {
  parts: number;
  baits: UserInventory["baits"];
  baitMaterials: UserInventory["baitMaterials"];
};

export type UserProgress = UserDoc;
export type WellQuestion = WellQuestionDoc;

export async function getUserProgress(uid: string): Promise<UserProgress | null> {
  return getDocument<UserProgress>(USERS_COLLECTION, uid);
}

export async function setUserProgress(
  uid: string,
  patch: Partial<UserProgress>,
): Promise<void> {
  await setDocument(USERS_COLLECTION, uid, patch as Record<string, unknown>);
}

export async function setRodStatus(uid: string, rod: RodStatus): Promise<void> {
  await setUserProgress(uid, {
    activeRod: rod.activeRod,
    rodDullnessCount: rod.rodDullnessCount,
    isRodDull: rod.isRodDull,
    activeCast: rod.activeCast,
  });
}

export async function setInventory(uid: string, inventory: InventoryItem): Promise<void> {
  await setUserProgress(uid, {
    inventory: {
      parts: inventory.parts,
      baits: inventory.baits,
      baitMaterials: inventory.baitMaterials,
    },
  } as Partial<UserProgress>);
}
