import { httpsCallable } from "firebase/functions";

import type {
  DeepCheckAxisPair,
  RecentDeepCheckPoint,
} from "@/shared/childProfile/archetypeDeepCheck";
import type {
  DisplayArchetypeName,
  QuickCheckArchetype,
} from "@/shared/childProfile/archetypeQuickCheck";
import { functions } from "@/src/services/firebase/client";

export type SubmitChildDeepCheckResult = {
  status: "ok";
  childId: string;
  axisA: number;
  axisB: number;
  primaryArchetype: QuickCheckArchetype;
  displayArchetypeName: DisplayArchetypeName;
  ageBandAtCheck: "4-6" | "6-12";
  recentDeepChecks: RecentDeepCheckPoint[];
};

export async function callSubmitChildDeepCheck(input: {
  childId: string;
  deepCheckAnswers: DeepCheckAxisPair[];
}): Promise<SubmitChildDeepCheckResult> {
  const callable = httpsCallable(functions, "submitChildDeepCheck");
  const result = await callable(input);
  return result.data as SubmitChildDeepCheckResult;
}
