import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

import {
  buildChildrenSummaryEntry,
  type ChildrenSummaryEntry,
} from "../childProfile/childrenSummary";
import {
  canCreateNextChild,
  filterAllowedInterests,
  isChildCompanionId,
  resolveAccountTier,
  type ChildCompanionId,
  type ChildInterestId,
} from "../childProfile/tierAccess";
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

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LEN = 48;

/** Distinct from idempotent draft replay — client must NOT treat as success. */
export const CHILD_LIMIT_REACHED = "CHILD_LIMIT_REACHED";

export type CreateChildProfileInput = {
  draftId?: string;
  name?: string;
  dob?: string;
  companionId?: string;
  interests?: unknown;
  /** Optional prologue onboarding extensions — ignored by legacy callers. */
  archetype?: string;
  onboardingComplete?: boolean;
  quickCheckTally?: unknown;
};

export type CreateChildProfileSuccess = {
  status: "ok";
  childId: string;
  childOrder: number;
  name: string;
  dob: string;
  companionId: ChildCompanionId;
  interests: ChildInterestId[];
  profileLocked: true;
  primaryArchetype?: QuickCheckArchetype;
  displayArchetypeName?: DisplayArchetypeName;
  tieOccurred?: boolean;
  tiedArchetypes?: QuickCheckArchetype[];
  ageBandAtCheck?: AgeBand;
};

export type { ChildrenSummaryEntry };

type ChildDocData = {
  name?: string;
  dob?: string;
  companionId?: string;
  interests?: string[];
  profileLocked?: boolean;
  childOrder?: number;
  childProfileSealDraftId?: string;
  archetype?: QuickCheckArchetype | null;
  displayArchetypeName?: DisplayArchetypeName | null;
};

function validateDob(dob: string): string {
  if (!DOB_RE.test(dob)) {
    throw new HttpsError("invalid-argument", "dob must be YYYY-MM-DD");
  }
  const parsed = new Date(`${dob}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpsError("invalid-argument", "dob is not a valid date");
  }
  const [y, m, d] = dob.split("-").map(Number);
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() + 1 !== m ||
    parsed.getUTCDate() !== d
  ) {
    throw new HttpsError("invalid-argument", "dob is not a valid calendar date");
  }
  const now = new Date();
  if (parsed.getTime() > Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) {
    throw new HttpsError("invalid-argument", "dob cannot be in the future");
  }
  return dob;
}

function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new HttpsError("invalid-argument", "name is required");
  }
  if (trimmed.length > MAX_NAME_LEN) {
    throw new HttpsError("invalid-argument", `name must be ≤ ${MAX_NAME_LEN} characters`);
  }
  return trimmed;
}

function parseQuickCheckTally(
  raw: unknown,
  options?: { requiredLength?: number },
): QuickCheckArchetype[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpsError("invalid-argument", "quickCheckTally must be a non-empty array");
  }
  const requiredLength = options?.requiredLength;
  if (requiredLength != null && raw.length !== requiredLength) {
    throw new HttpsError(
      "invalid-argument",
      `quickCheckTally must contain exactly ${requiredLength} answers`,
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

function successFromChild(childId: string, data: ChildDocData): CreateChildProfileSuccess {
  if (
    typeof data.name !== "string" ||
    typeof data.dob !== "string" ||
    !isChildCompanionId(data.companionId) ||
    typeof data.childOrder !== "number"
  ) {
    throw new HttpsError("internal", "Sealed child document is malformed");
  }
  return {
    status: "ok",
    childId,
    childOrder: data.childOrder,
    name: data.name,
    dob: data.dob,
    companionId: data.companionId,
    interests: filterAllowedInterests(data.interests ?? []),
    profileLocked: true,
    ...(isQuickCheckArchetype(data.archetype)
      ? {
          primaryArchetype: data.archetype,
          displayArchetypeName: data.displayArchetypeName ?? undefined,
        }
      : {}),
  };
}

/**
 * Atomic sealed create/append for users/{uid}/children/{childId}.
 * When onboardingComplete is true, also writes archetypeChecks + prologue flags
 * in the same transaction.
 */
export async function createChildProfileCallable(
  uid: string,
  raw: CreateChildProfileInput,
): Promise<CreateChildProfileSuccess> {
  const draftId = typeof raw.draftId === "string" ? raw.draftId.trim() : "";
  if (!draftId) {
    throw new HttpsError("invalid-argument", "draftId is required");
  }

  const name = validateName(typeof raw.name === "string" ? raw.name : "");
  const dob = validateDob(typeof raw.dob === "string" ? raw.dob.trim() : "");
  if (!isChildCompanionId(raw.companionId)) {
    throw new HttpsError("invalid-argument", "companionId is invalid");
  }
  const companionId = raw.companionId;
  const interests = filterAllowedInterests(raw.interests);
  const onboardingComplete = raw.onboardingComplete === true;
  const tally = parseQuickCheckTally(raw.quickCheckTally, {
    requiredLength: onboardingComplete ? QUICK_CHECK_ANSWER_COUNT : undefined,
  });

  let scored: ReturnType<typeof scoreQuickCheckTally> | null = null;
  let ageBandAtCheck: AgeBand | null = null;

  if (onboardingComplete) {
    if (!tally) {
      throw new HttpsError(
        "invalid-argument",
        "quickCheckTally is required when onboardingComplete is true",
      );
    }
    scored = scoreQuickCheckTally(tally);
    if (raw.archetype != null && raw.archetype !== scored.primaryArchetype) {
      // Client hint is advisory only — server tally wins for branching truth.
      logger.info("createChildProfile archetype hint ignored in favor of tally", {
        uid,
        hint: raw.archetype,
        primary: scored.primaryArchetype,
      });
    }
    const birthDate = parseBirthDate(dob);
    if (!birthDate) {
      throw new HttpsError("invalid-argument", "dob could not be parsed for ageBandAtCheck");
    }
    ageBandAtCheck = computeAgeBand(birthDate);
  } else if (raw.archetype != null && !isQuickCheckArchetype(raw.archetype)) {
    throw new HttpsError("invalid-argument", "archetype is invalid");
  }

  const userRef = db.collection("users").doc(uid);
  const childrenCol = userRef.collection("children");

  try {
    return await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new HttpsError(
          "failed-precondition",
          "User profile missing — initialize sanctuary first",
        );
      }
      const userData = userSnap.data() as {
        subscription?: { subscriptionStatus?: string; isLifetime?: boolean };
        childrenSummary?: ChildrenSummaryEntry[];
      };

      const childrenSnap = await tx.get(childrenCol);

      const draftMatch = childrenSnap.docs.find((docSnap) => {
        const data = docSnap.data() as ChildDocData;
        return data.childProfileSealDraftId === draftId;
      });
      if (draftMatch) {
        return successFromChild(draftMatch.id, draftMatch.data() as ChildDocData);
      }

      const tier = resolveAccountTier(userData.subscription);
      const currentCount = childrenSnap.size;
      const createCheck = canCreateNextChild(currentCount, tier);

      if (!createCheck.ok) {
        throw new HttpsError("failed-precondition", CHILD_LIMIT_REACHED);
      }

      const childOrder = createCheck.nextOrder;
      const childRef = childrenCol.doc();
      const summary: ChildrenSummaryEntry[] = Array.isArray(userData.childrenSummary)
        ? [...userData.childrenSummary]
        : [];
      const visitedAt = new Date().toISOString();
      summary.push(
        buildChildrenSummaryEntry({
          childId: childRef.id,
          name,
          companionId,
          childOrder,
          displayArchetypeName: scored?.displayArchetypeName ?? null,
          dob,
          lastVisitedAt: visitedAt,
        }),
      );
      summary.sort((a, b) => a.childOrder - b.childOrder);

      const childPayload: Record<string, unknown> = {
        name,
        dob,
        companionId,
        interests,
        profileLocked: true,
        childOrder,
        childProfileSealDraftId: draftId,
        createdAt: Timestamp.now(),
        archetype:
          scored?.primaryArchetype ?? (isQuickCheckArchetype(raw.archetype) ? raw.archetype : null),
        hasCompletedDay1Narrative: false,
        narrativeProgress: null,
      };

      if (scored && ageBandAtCheck) {
        childPayload.displayArchetypeName = scored.displayArchetypeName;
        childPayload.tieOccurred = scored.tieOccurred;
        childPayload.tiedArchetypes = scored.tiedArchetypes;
        childPayload.hasSeenArchetypeDisclaimer = true;
      }

      tx.set(childRef, childPayload);

      const rootPatch: Record<string, unknown> = {
        activeChildId: childRef.id,
        childrenSummary: summary,
        ...(childOrder === 1 ? { childBirthDate: dob } : {}),
      };

      if (scored && onboardingComplete) {
        rootPatch.childArchetype = scored.primaryArchetype;
        rootPatch.hasCompletedDay1Narrative = true;
        rootPatch.hasCompletedPrologueOnboarding = true;
        if (childOrder === 1) {
          rootPatch.childBirthDate = dob;
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
      }

      tx.set(userRef, rootPatch, { merge: true });

      return {
        status: "ok" as const,
        childId: childRef.id,
        childOrder,
        name,
        dob,
        companionId,
        interests,
        profileLocked: true as const,
        ...(scored
          ? {
              primaryArchetype: scored.primaryArchetype,
              displayArchetypeName: scored.displayArchetypeName,
              tieOccurred: scored.tieOccurred,
              tiedArchetypes: scored.tiedArchetypes,
              ageBandAtCheck: ageBandAtCheck ?? undefined,
            }
          : {}),
      };
    });
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error("createChildProfile failed", {
      uid,
      area: "profile",
      flow: "create_child_profile",
      err,
    });
    throw new HttpsError("internal", "createChildProfile failed");
  }
}
