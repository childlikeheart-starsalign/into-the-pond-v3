import type { UserDoc } from "@/src/services/firebase/types";

/**
 * Whether a loaded user profile may enter sanctuary gameplay.
 * Legacy docs pre-C8 lack authFunnel.sanctuaryInitialized; client cannot create users/{uid}.
 */
export function isPlayableUserDoc(data: UserDoc | null | undefined): boolean {
  if (!data) return false;
  if (data.authFunnel?.sanctuaryInitialized === true) return true;
  return true;
}
