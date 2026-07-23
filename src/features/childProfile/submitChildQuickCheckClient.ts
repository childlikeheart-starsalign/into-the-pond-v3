import { httpsCallable } from "firebase/functions";

import type { RecentDeepCheckPoint } from "@/shared/childProfile/archetypeDeepCheck";
import type {
  DisplayArchetypeName,
  QuickCheckArchetype,
} from "@/shared/childProfile/archetypeQuickCheck";
import { functions } from "@/src/services/firebase/client";

export type SubmitChildQuickCheckResult = {
  status: "ok";
  childId: string;
  primaryArchetype: QuickCheckArchetype;
  displayArchetypeName: DisplayArchetypeName;
  tieOccurred: boolean;
  tiedArchetypes: QuickCheckArchetype[];
  ageBandAtCheck: "4-6" | "6-12";
  recentDeepChecks: RecentDeepCheckPoint[];
};

export async function callSubmitChildQuickCheck(input: {
  childId: string;
  quickCheckTally: QuickCheckArchetype[];
}): Promise<SubmitChildQuickCheckResult> {
  const callable = httpsCallable(functions, "submitChildQuickCheck");
  const result = await callable(input);
  return result.data as SubmitChildQuickCheckResult;
}
