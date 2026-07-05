import type { User } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { getDocument } from "@/src/services/firebase/firestore";
import { UserDoc } from "@/src/services/firebase/types";

const USERS_COLLECTION = "users";

const LEGACY_SUBCOLLECTIONS = ["creatures", "diaryEntries", "wellQuestions"] as const;

/** Accounts older than this are treated as legacy when Firestore is temporarily unavailable. */
const ESTABLISHED_ACCOUNT_MS = 2 * 60 * 1000;

const RETRYABLE_FIRESTORE_CODES = new Set(["unavailable", "deadline-exceeded"]);

function firestoreErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: string }).code);
  }
  return "unknown";
}

async function ensureAuthTokenReady(): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) return;
  try {
    await user.getIdToken();
  } catch {
    // Non-fatal — Firestore may still work with cached credentials.
  }
}

async function getUserDocumentWithRetry(uid: string): Promise<UserDoc | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await getDocument<UserDoc>(USERS_COLLECTION, uid);
    } catch (error) {
      lastError = error;
      const code = firestoreErrorCode(error);
      if (!RETRYABLE_FIRESTORE_CODES.has(code) || attempt === 2) {
        throw error;
      }
    }
  }
  throw lastError;
}

function isEstablishedAuthAccount(): boolean {
  const createdAt = firebaseAuth.currentUser?.metadata?.creationTime;
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > ESTABLISHED_ACCOUNT_MS;
}

async function userHasLegacySubcollectionData(uid: string): Promise<boolean> {
  for (const sub of LEGACY_SUBCOLLECTIONS) {
    try {
      const snap = await getDocs(
        query(collection(firestore, USERS_COLLECTION, uid, sub), limit(1)),
      );
      if (!snap.empty) return true;
    } catch {
      // Rules may deny or subcollection empty — try next.
    }
  }
  return false;
}

export async function userProfileExists(uid: string): Promise<boolean> {
  try {
    const doc = await getUserDocumentWithRetry(uid);
    return doc !== null;
  } catch {
    return false;
  }
}

export async function userProfileExistsByEmail(email: string): Promise<boolean> {
  const normalized = email.trim();
  if (!normalized) return false;

  try {
    const snap = await getDocs(
      query(collection(firestore, USERS_COLLECTION), where("email", "==", normalized), limit(1)),
    );
    return !snap.empty;
  } catch {
    return false;
  }
}

export type ProfileCheckResult = {
  exists: boolean;
  byUid: boolean;
  byEmail: boolean;
  bySubcollection: boolean;
  unavailableLegacyFallback: boolean;
  uidErrorCode: string | null;
  emailErrorCode: string | null;
};

export async function resolveExistingUserProfile(
  user: Pick<User, "uid" | "email">,
): Promise<ProfileCheckResult> {
  await ensureAuthTokenReady();

  let byUid = false;
  let uidErrorCode: string | null = null;

  try {
    const doc = await getUserDocumentWithRetry(user.uid);
    byUid = doc !== null;
  } catch (error) {
    uidErrorCode = firestoreErrorCode(error);
  }

  let byEmail = false;
  let emailErrorCode: string | null = null;

  if (!byUid && user.email) {
    const normalized = user.email.trim();
    try {
      const snap = await getDocs(
        query(collection(firestore, USERS_COLLECTION), where("email", "==", normalized), limit(1)),
      );
      byEmail = !snap.empty;
    } catch (error) {
      emailErrorCode = firestoreErrorCode(error);
    }

    if (!byEmail && normalized !== normalized.toLowerCase()) {
      try {
        const snap = await getDocs(
          query(
            collection(firestore, USERS_COLLECTION),
            where("email", "==", normalized.toLowerCase()),
            limit(1),
          ),
        );
        byEmail = !snap.empty;
      } catch (error) {
        emailErrorCode = emailErrorCode ?? firestoreErrorCode(error);
      }
    }
  }

  let bySubcollection = false;
  if (!byUid && !byEmail) {
    bySubcollection = await userHasLegacySubcollectionData(user.uid);
  }

  let unavailableLegacyFallback = false;
  let exists = byUid || byEmail || bySubcollection;

  if (
    !exists &&
    uidErrorCode !== null &&
    RETRYABLE_FIRESTORE_CODES.has(uidErrorCode) &&
    isEstablishedAuthAccount()
  ) {
    unavailableLegacyFallback = true;
    exists = true;
  }

  return {
    exists,
    byUid,
    byEmail,
    bySubcollection,
    unavailableLegacyFallback,
    uidErrorCode,
    emailErrorCode,
  };
}

export async function userProfileExistsForAuthUser(
  user: Pick<User, "uid" | "email">,
): Promise<boolean> {
  const result = await resolveExistingUserProfile(user);
  return result.exists;
}

export function canAccessMainApp(
  user: Pick<User, "emailVerified" | "isAnonymous"> | null,
): boolean {
  if (!user) return false;
  if (user.isAnonymous) return false;
  return user.emailVerified;
}
