import { identifyReturningUser } from "@/src/services/analytics/authFunnel";
import { getDocument } from "@/src/services/firebase/firestore";
import type { UserDoc } from "@/src/services/firebase/types";
import { isPlayableUserDoc } from "@/src/services/auth/sanctuaryPlayable";
import {
  persistAuthInitPhase,
  setAuthInitPhase,
  setSanctuaryInitializedFromRemote,
} from "@/src/state/authInitStore";

export { isPlayableUserDoc } from "@/src/services/auth/sanctuaryPlayable";

/** Firestore read — mark local init store for returning users when callable is unavailable. */
export async function confirmSanctuaryReadyForReturningUser(uid: string): Promise<boolean> {
  try {
    const doc = await getDocument<UserDoc>("users", uid);
    if (!isPlayableUserDoc(doc)) return false;

    setAuthInitPhase("initialized");
    setSanctuaryInitializedFromRemote(true);
    await persistAuthInitPhase(uid, "initialized");
    identifyReturningUser();
    return true;
  } catch {
    return false;
  }
}
