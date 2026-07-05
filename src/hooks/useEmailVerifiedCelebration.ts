import { useEffect, useState } from "react";

import {
  readCelebrationCache,
  readCelebrationFromFirestore,
} from "@/src/services/onboarding/emailVerifiedCelebrationStorage";

type CelebrationState = {
  ready: boolean;
  hasCompleted: boolean;
};

/**
 * Dual-layer celebration flag: AsyncStorage fast-path, then Firestore hydrate.
 */
export function useEmailVerifiedCelebration(
  uid: string | null,
  emailVerified: boolean,
): CelebrationState {
  const [state, setState] = useState<CelebrationState>({
    ready: !uid || !emailVerified,
    hasCompleted: false,
  });

  useEffect(() => {
    let alive = true;

    if (!uid || !emailVerified) {
      setState({ ready: true, hasCompleted: false });
      return () => {
        alive = false;
      };
    }

    setState({ ready: false, hasCompleted: false });

    void (async () => {
      const cached = await readCelebrationCache(uid);
      if (!alive) return;
      if (cached) {
        setState({ ready: true, hasCompleted: true });
        return;
      }

      const remote = await readCelebrationFromFirestore(uid);
      if (!alive) return;
      setState({ ready: true, hasCompleted: remote });
    })();

    return () => {
      alive = false;
    };
  }, [uid, emailVerified]);

  return state;
}
