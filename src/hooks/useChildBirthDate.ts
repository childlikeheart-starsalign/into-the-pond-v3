import { useCallback } from "react";

import { validateChildBirthMonthYear } from "@/src/features/onboarding/validateChildBirthDate";
import {
  setChildBirthDate as persistChildBirthDate,
  syncNarrativeToFirestore,
} from "@/src/services/onboarding/narrativeOnboardingStorage";
import { firebaseAuth } from "@/src/services/firebase/client";

export type SetChildBirthDateResult =
  | { ok: true; isoDate: string }
  | { ok: false; error: "invalid" | "too_young" | "too_old" | "sync_failed" };

export async function persistChildBirthMonthYear(
  month: number,
  year: number,
): Promise<SetChildBirthDateResult> {
  const validation = validateChildBirthMonthYear(month, year);
  if (!validation.ok) {
    return validation;
  }

  await persistChildBirthDate(validation.isoDate);

  const uid = firebaseAuth.currentUser?.uid;
  if (uid) {
    try {
      await syncNarrativeToFirestore(
        uid,
        { childBirthDate: validation.isoDate },
        { throwOnError: true },
      );
    } catch {
      return { ok: false, error: "sync_failed" };
    }
  }

  return { ok: true, isoDate: validation.isoDate };
}

/** Shared birth-date persistence for onboarding and Well gate. */
export function useChildBirthDate() {
  const setBirthDate = useCallback(async (month: number, year: number) => {
    return persistChildBirthMonthYear(month, year);
  }, []);

  return { setBirthDate };
}
