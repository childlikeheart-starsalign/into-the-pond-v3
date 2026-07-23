import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { type ChildrenSummaryEntry } from "../childProfile/childrenSummary";
import { axesFromDisplayArchetype } from "../childProfile/archetypeCaptionBank";
import {
  MAP_CHECK_HISTORY_CAP,
  rebuildRecentMapChecks,
  type RecentDeepCheckPoint,
} from "../childProfile/archetypeDeepCheck";
import {
  isQuickCheckArchetype,
  QUICK_CHECK_ANSWER_COUNT,
  scoreQuickCheckTally,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
} from "../childProfile/archetypeQuickCheck";
import { computeAgeBand, parseBirthDate } from "../sanctuary/well/computeAgeBand";
import type { AgeBand } from "../sanctuary/well/types";
import { db } from "../init";

export type SubmitChildQuickCheckInput = {
  childId?: string;
  quickCheckTally?: unknown;
};

export type SubmitChildQuickCheckSuccess = {
  status: "ok";
  childId: string;
  primaryArchetype: QuickCheckArchetype;
  displayArchetypeName: DisplayArchetypeName;
  tieOccurred: boolean;
  tiedArchetypes: QuickCheckArchetype[];
  ageBandAtCheck: AgeBand;
  recentDeepChecks: RecentDeepCheckPoint[];
};

function parseQuickCheckTally(raw: unknown): QuickCheckArchetype[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpsError("invalid-argument", "quickCheckTally must be a non-empty array");
  }
  if (raw.length !== QUICK_CHECK_ANSWER_COUNT) {
    throw new HttpsError(
      "invalid-argument",
      `quickCheckTally must contain exactly ${QUICK_CHECK_ANSWER_COUNT} answers`,
    );
  }
  const answers: QuickCheckArchetype[] = [];
  for (const item of raw) {
    if (!isQuickCheckArchetype(item)) {
      throw new HttpsError("invalid-argument", "quickCheckTally contains an invalid archetype");
    }
    answers.push(item);
  }
  return answers;
}

/**
 * Persist a post-onboarding Quick Check for an existing sealed child.
 * Updates child archetype fields, childrenSummary, shared map trail, and appends archetypeChecks.
 */
export async function submitChildQuickCheckCallable(
  uid: string,
  raw: SubmitChildQuickCheckInput,
): Promise<SubmitChildQuickCheckSuccess> {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new HttpsError("invalid-argument", "childId is required");
  }

  const tally = parseQuickCheckTally(raw.quickCheckTally);
  const scored = scoreQuickCheckTally(tally);
  const completedAt = new Date().toISOString();
  const axes = axesFromDisplayArchetype(scored.displayArchetypeName);
  const newestPoint: RecentDeepCheckPoint = {
    axisA: axes.axisA,
    axisB: axes.axisB,
    completedAt,
    source: "quick",
  };

  const userRef = db.collection("users").doc(uid);
  const childRef = userRef.collection("children").doc(childId);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "User profile missing");
    }

    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) {
      throw new HttpsError("not-found", "Child profile not found");
    }

    const childData = childSnap.data() as { dob?: string };
    const dob = typeof childData.dob === "string" ? childData.dob.trim() : "";
    const birthDate = parseBirthDate(dob);
    if (!birthDate) {
      throw new HttpsError("failed-precondition", "Child dob missing or invalid for age band");
    }
    const ageBandAtCheck = computeAgeBand(birthDate);

    const checksQuery = childRef
      .collection("archetypeChecks")
      .orderBy("createdAt", "desc")
      .limit(MAP_CHECK_HISTORY_CAP * 4);
    const checksSnap = await tx.get(checksQuery);
    const existingChecksNewestFirst = checksSnap.docs.map((d) => d.data());
    const recentDeepChecks = rebuildRecentMapChecks({
      existingChecksNewestFirst,
      newest: newestPoint,
    });

    tx.update(childRef, {
      archetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      hasSeenArchetypeDisclaimer: true,
      recentDeepChecks,
    });

    const userData = userSnap.data() as { childrenSummary?: ChildrenSummaryEntry[] };
    const summary = Array.isArray(userData.childrenSummary) ? [...userData.childrenSummary] : [];
    const idx = summary.findIndex((entry) => entry.childId === childId);
    if (idx >= 0) {
      summary[idx] = {
        ...summary[idx],
        displayArchetypeName: scored.displayArchetypeName,
        recentDeepChecks,
      };
      tx.set(userRef, { childrenSummary: summary }, { merge: true });
    }

    const checkRef = childRef.collection("archetypeChecks").doc();
    tx.set(checkRef, {
      type: "quick",
      createdAt: Timestamp.now(),
      quickCheckTally: tally,
      primaryArchetype: scored.primaryArchetype,
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
    });

    return {
      status: "ok" as const,
      childId,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      ageBandAtCheck,
      recentDeepChecks,
    };
  });
}

/** Pure tally parse + score for unit tests (no Firestore). */
export function validateAndScoreQuickCheckTally(raw: unknown): {
  tally: QuickCheckArchetype[];
  scored: ReturnType<typeof scoreQuickCheckTally>;
} {
  const tally = parseQuickCheckTally(raw);
  return { tally, scored: scoreQuickCheckTally(tally) };
}
