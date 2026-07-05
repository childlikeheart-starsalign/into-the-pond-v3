import { getDocument } from "@/src/services/firebase/firestore";
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
