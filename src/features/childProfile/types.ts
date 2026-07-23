import type { ChildCompanionId, ChildInterestId } from "@/shared/childProfile/tierAccess";
import type { ChildrenSummaryEntry } from "@/shared/childProfile/childrenSummary";
import type { ChildArchetype } from "@/src/constants/narrative/types";

export type { ChildrenSummaryEntry };

export type ChildProfileDoc = {
  name: string;
  dob: string;
  companionId: ChildCompanionId;
  interests: ChildInterestId[];
  profileLocked: boolean;
  childOrder: number;
  childProfileSealDraftId?: string;
  createdAt?: unknown;
  archetype?: ChildArchetype | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  } | null;
};
