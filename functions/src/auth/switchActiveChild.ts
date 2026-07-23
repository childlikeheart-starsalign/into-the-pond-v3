import { HttpsError } from "firebase-functions/v2/https";

import {
  buildChildrenSummaryEntry,
  stampLastVisited,
  type ChildrenSummaryEntry,
  type RecentDeepCheckPoint,
} from "../childProfile/childrenSummary";
import {
  canAccessChild,
  isChildCompanionId,
  resolveAccountTier,
  type ChildCompanionId,
} from "../childProfile/tierAccess";
import {
  isQuickCheckArchetype,
  resolveDisplayArchetypeName,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
} from "../childProfile/archetypeQuickCheck";
import { db } from "../init";

export type SwitchActiveChildInput = {
  childId?: string;
};

export type SwitchActiveChildSuccess = {
  status: "ok";
  activeChildId: string;
  childrenSummary: ChildrenSummaryEntry[];
};

type ChildDocData = {
  name?: string;
  dob?: string;
  companionId?: string;
  childOrder?: number;
  archetype?: QuickCheckArchetype | null;
  displayArchetypeName?: DisplayArchetypeName | null;
  recentDeepChecks?: RecentDeepCheckPoint[] | null;
};

function displayNameFromChild(data: ChildDocData): string | null {
  if (typeof data.displayArchetypeName === "string" && data.displayArchetypeName.trim()) {
    return data.displayArchetypeName;
  }
  if (isQuickCheckArchetype(data.archetype)) {
    return resolveDisplayArchetypeName({
      primaryArchetype: data.archetype,
      tieOccurred: false,
      tiedArchetypes: [],
    });
  }
  return null;
}

function entryFromChildDoc(
  childId: string,
  data: ChildDocData,
  previous: ChildrenSummaryEntry | undefined,
): ChildrenSummaryEntry | null {
  if (
    typeof data.name !== "string" ||
    !isChildCompanionId(data.companionId) ||
    typeof data.childOrder !== "number"
  ) {
    return null;
  }
  return buildChildrenSummaryEntry({
    childId,
    name: data.name,
    companionId: data.companionId as ChildCompanionId,
    childOrder: data.childOrder,
    displayArchetypeName: displayNameFromChild(data),
    dob: typeof data.dob === "string" ? data.dob : null,
    lastVisitedAt: previous?.lastVisitedAt ?? null,
    recentDeepChecks: Array.isArray(data.recentDeepChecks)
      ? data.recentDeepChecks
      : (previous?.recentDeepChecks ?? null),
  });
}

/**
 * Sets activeChildId and stamps lastVisitedAt on the selected summary entry.
 * Rebuilds childrenSummary from children docs so older accounts gain identity fields.
 */
export async function switchActiveChildCallable(
  uid: string,
  raw: SwitchActiveChildInput,
): Promise<SwitchActiveChildSuccess> {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new HttpsError("invalid-argument", "childId is required");
  }

  const userRef = db.collection("users").doc(uid);
  const childrenCol = userRef.collection("children");

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "User profile missing");
    }
    const userData = userSnap.data() as {
      subscription?: { subscriptionStatus?: string | null; isLifetime?: boolean | null };
      childrenSummary?: ChildrenSummaryEntry[];
    };
    const tier = resolveAccountTier(userData.subscription);
    const previousSummary = Array.isArray(userData.childrenSummary) ? userData.childrenSummary : [];
    const previousById = new Map(previousSummary.map((e) => [e.childId, e]));

    const childRef = childrenCol.doc(childId);
    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) {
      throw new HttpsError("not-found", "Child profile not found");
    }
    const childData = childSnap.data() as ChildDocData;
    if (typeof childData.childOrder !== "number" || !canAccessChild(childData.childOrder, tier)) {
      throw new HttpsError("permission-denied", "Child is not accessible on this path");
    }

    const childrenSnap = await tx.get(childrenCol);
    const rebuilt: ChildrenSummaryEntry[] = [];
    for (const docSnap of childrenSnap.docs) {
      const entry = entryFromChildDoc(
        docSnap.id,
        docSnap.data() as ChildDocData,
        previousById.get(docSnap.id),
      );
      if (entry) rebuilt.push(entry);
    }
    rebuilt.sort((a, b) => a.childOrder - b.childOrder);

    if (!rebuilt.some((e) => e.childId === childId)) {
      throw new HttpsError("failed-precondition", "Child missing from summary rebuild");
    }

    const atIso = new Date().toISOString();
    const childrenSummary = stampLastVisited(rebuilt, childId, atIso);

    tx.set(
      userRef,
      {
        activeChildId: childId,
        childrenSummary,
      },
      { merge: true },
    );

    return {
      status: "ok" as const,
      activeChildId: childId,
      childrenSummary,
    };
  });
}
