import { httpsCallable } from "firebase/functions";

import type { ChildCompanionId, ChildInterestId } from "@/shared/childProfile/tierAccess";
import {
  ChildLimitReachedError,
  isChildLimitReachedError,
} from "@/src/features/childProfile/childLimitReached";
import { functions } from "@/src/services/firebase/client";

export type CreateChildProfileResult = {
  status: "ok";
  childId: string;
  childOrder: number;
  name: string;
  dob: string;
  companionId: ChildCompanionId;
  interests: ChildInterestId[];
  profileLocked: true;
  primaryArchetype?: "storm" | "wall" | "spark";
  displayArchetypeName?: string;
  tieOccurred?: boolean;
  tiedArchetypes?: Array<"storm" | "wall" | "spark">;
  ageBandAtCheck?: "4-6" | "6-12";
};

export { ChildLimitReachedError, isChildLimitReachedError };

export async function callCreateChildProfile(input: {
  draftId: string;
  name: string;
  dob: string;
  companionId: ChildCompanionId;
  interests: ChildInterestId[];
  archetype?: "storm" | "wall" | "spark";
  onboardingComplete?: boolean;
  quickCheckTally?: Array<"storm" | "wall" | "spark">;
}): Promise<CreateChildProfileResult> {
  const callable = httpsCallable(functions, "createChildProfile");
  try {
    const result = await callable(input);
    return result.data as CreateChildProfileResult;
  } catch (err) {
    if (isChildLimitReachedError(err)) {
      throw new ChildLimitReachedError();
    }
    throw err;
  }
}
