import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import {
  DEEP_CHECK_HISTORY_CAP,
  DEEP_CHECK_SCENARIO_COUNT,
  isDeepCheckAxisPair,
  MAP_CHECK_HISTORY_CAP,
  rebuildRecentMapChecks,
  scoreDeepCheck,
  type DeepCheckAxisPair,
  type RecentDeepCheckPoint,
} from "../childProfile/archetypeDeepCheck";
import type { ChildrenSummaryEntry } from "../childProfile/childrenSummary";
import type {
  DisplayArchetypeName,
  QuickCheckArchetype,
} from "../childProfile/archetypeQuickCheck";
import { computeAgeBand, parseBirthDate } from "../sanctuary/well/computeAgeBand";
import type { AgeBand } from "../sanctuary/well/types";
import { db } from "../init";

export type SubmitChildDeepCheckInput = {
  childId?: string;
  deepCheckAnswers?: unknown;
};

export type SubmitChildDeepCheckSuccess = {
  status: "ok";
  childId: string;
  axisA: number;
  axisB: number;
  primaryArchetype: QuickCheckArchetype;
  displayArchetypeName: DisplayArchetypeName;
  ageBandAtCheck: AgeBand;
  recentDeepChecks: RecentDeepCheckPoint[];
};

function parseDeepCheckAnswers(raw: unknown): DeepCheckAxisPair[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpsError("invalid-argument", "deepCheckAnswers must be a non-empty array");
  }
  if (raw.length !== DEEP_CHECK_SCENARIO_COUNT) {
    throw new HttpsError(
      "invalid-argument",
      `deepCheckAnswers must contain exactly ${DEEP_CHECK_SCENARIO_COUNT} pairs`,
    );
  }
  const answers: DeepCheckAxisPair[] = [];
  for (const item of raw) {
    if (!isDeepCheckAxisPair(item)) {
      throw new HttpsError("invalid-argument", "deepCheckAnswers contains an invalid pair");
    }
    answers.push({
      expression: item.expression,
      driver: item.driver,
    });
  }
  return answers;
}

/**
 * Persist a Deep Check for an existing sealed child.
 * Updates archetype fields, rebuilds shared map trail (max 5 QC+DC), appends archetypeChecks.
 * Prunes older deep check docs after the transaction.
 */
export async function submitChildDeepCheckCallable(
  uid: string,
  raw: SubmitChildDeepCheckInput,
): Promise<SubmitChildDeepCheckSuccess> {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new HttpsError("invalid-argument", "childId is required");
  }

  const answers = parseDeepCheckAnswers(raw.deepCheckAnswers);
  const scored = scoreDeepCheck(answers);
  const completedAt = new Date().toISOString();
  const newestPoint: RecentDeepCheckPoint = {
    axisA: scored.axisA,
    axisB: scored.axisB,
    completedAt,
    source: "deep",
  };

  const userRef = db.collection("users").doc(uid);
  const childRef = userRef.collection("children").doc(childId);

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "User profile missing");
    }

    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) {
      throw new HttpsError("not-found", "Child profile not found");
    }

    const childData = childSnap.data() as {
      dob?: string;
    };
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
      tieOccurred: false,
      tiedArchetypes: [],
      hasSeenArchetypeDisclaimer: true,
      recentDeepChecks,
      lastDeepCheckAt: completedAt,
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
      type: "deep",
      createdAt: Timestamp.now(),
      deepCheckAnswers: answers,
      axisA: scored.axisA,
      axisB: scored.axisB,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
    });

    return {
      status: "ok" as const,
      childId,
      axisA: scored.axisA,
      axisB: scored.axisB,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
      recentDeepChecks,
    };
  });

  // Prune deep check docs beyond the retention cap (outside transaction).
  try {
    const deepSnap = await childRef
      .collection("archetypeChecks")
      .where("type", "==", "deep")
      .orderBy("createdAt", "desc")
      .get();
    const overflow = deepSnap.docs.slice(DEEP_CHECK_HISTORY_CAP);
    if (overflow.length > 0) {
      const batch = db.batch();
      for (const doc of overflow) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  } catch {
    // Index may be missing in some envs; denormalized recentDeepChecks still caps at 5.
  }

  return result;
}

/** Pure parse + score for unit tests (no Firestore). */
export function validateAndScoreDeepCheckAnswers(raw: unknown): {
  answers: DeepCheckAxisPair[];
  scored: ReturnType<typeof scoreDeepCheck>;
} {
  const answers = parseDeepCheckAnswers(raw);
  return { answers, scored: scoreDeepCheck(answers) };
}
