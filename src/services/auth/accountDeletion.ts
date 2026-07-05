import { httpsCallable } from "firebase/functions";

import { database } from "@/src/db/index";
import { functions } from "@/src/services/firebase/client";
import { signOutCurrentUser } from "@/src/services/firebase/auth";
import { logOutRevenueCat } from "@/src/services/revenuecat/client";

export type AccountDeletionStatus = {
  status: "active" | "pending" | "purging" | "purged";
  purgeAt: string | null;
  requestedAt: string | null;
};

export type RequestAccountDeletionResult = AccountDeletionStatus & {
  success: true;
};

function createDeletionRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `del_${globalThis.crypto.randomUUID()}`;
  }
  return `del_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export async function resetLocalUserCache(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    database.adapter.unsafeResetDatabase((result) => {
      if ("error" in result && result.error) {
        reject(result.error);
        return;
      }
      resolve();
    });
  });
}

export async function requestAccountDeletion(): Promise<RequestAccountDeletionResult> {
  const callable = httpsCallable<{ requestId: string }, RequestAccountDeletionResult>(
    functions,
    "requestAccountDeletion",
  );
  const result = await callable({ requestId: createDeletionRequestId() });
  return result.data;
}

export async function cancelAccountDeletion(): Promise<{ success: true; status: "active" }> {
  const callable = httpsCallable<Record<string, never>, { success: true; status: "active" }>(
    functions,
    "cancelAccountDeletion",
  );
  const result = await callable({});
  return result.data;
}

export async function getAccountDeletionStatus(): Promise<AccountDeletionStatus> {
  const callable = httpsCallable<Record<string, never>, AccountDeletionStatus>(
    functions,
    "getAccountDeletionStatus",
  );
  const result = await callable({});
  return result.data;
}

/** Signs out, clears local cache, and disconnects RevenueCat after deletion request. */
export async function completeAccountDeletionSignOut(): Promise<void> {
  await resetLocalUserCache();
  try {
    await logOutRevenueCat();
  } catch {
    // RevenueCat may be unavailable on web — deletion still proceeds.
  }
  await signOutCurrentUser();
}

export async function requestAccountDeletionAndSignOut(): Promise<RequestAccountDeletionResult> {
  const result = await requestAccountDeletion();
  await completeAccountDeletionSignOut();
  return result;
}
