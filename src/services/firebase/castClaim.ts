import { httpsCallable } from "firebase/functions";

import { functions } from "@/src/services/firebase/client";

export async function requestCastClaim() {
  const callable = httpsCallable(functions, "castClaim");
  const result = await callable();
  return result.data as { success: boolean; message?: string };
}

