import { httpsCallable } from "firebase/functions";

import type { ChildrenSummaryEntry } from "@/shared/childProfile/childrenSummary";
import { withCallableAuth } from "@/src/services/firebase/callableAuth";
import { functions } from "@/src/services/firebase/client";

export type SwitchActiveChildResult = {
  status: "ok";
  activeChildId: string;
  childrenSummary: ChildrenSummaryEntry[];
};

export async function callSwitchActiveChild(input: {
  childId: string;
}): Promise<SwitchActiveChildResult> {
  return withCallableAuth(async () => {
    const callable = httpsCallable(functions, "switchActiveChild");
    const result = await callable(input);
    return result.data as SwitchActiveChildResult;
  });
}
