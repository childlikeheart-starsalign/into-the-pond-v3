import { useEffect, useLayoutEffect, useState } from "react";

import {
  canAccessMainApp as computeCanAccessMainApp,
  resolveExistingUserProfile,
} from "@/src/services/firebase/userAccess";

type UseAuthAccessOptions = {
  uid: string | null;
  email: string | null;
  emailVerified: boolean;
};

type UseAuthAccessReturn = {
  ready: boolean;
  hasExistingProfile: boolean;
  canAccessMainApp: boolean;
};

/**
 * Resolves whether a signed-in user may enter the main app without email verification.
 * Legacy users with an existing users/{uid} Firestore document (or matching email) bypass verify-required.
 */
export function useAuthAccess({
  uid,
  email,
  emailVerified,
}: UseAuthAccessOptions): UseAuthAccessReturn {
  const [ready, setReady] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Sync reset before paint when uid appears — prevents stale ready=true from no-uid phase.
  useLayoutEffect(() => {
    if (uid && !emailVerified) {
      setReady(false);
      setHasExistingProfile(false);
    }
  }, [uid, emailVerified]);

  useEffect(() => {
    let alive = true;

    if (!uid) {
      setHasExistingProfile(false);
      setReady(true);
      return () => {
        alive = false;
      };
    }

    if (emailVerified) {
      setHasExistingProfile(false);
      setReady(true);
      return () => {
        alive = false;
      };
    }

    setHasExistingProfile(false);
    setReady(false);

    void (async () => {
      try {
        const result = await resolveExistingUserProfile({ uid, email });
        if (alive) setHasExistingProfile(result.exists);
      } catch {
        if (alive) setHasExistingProfile(false);
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid, email, emailVerified]);

  const canAccessMainApp =
    uid !== null && ready && computeCanAccessMainApp({ emailVerified }, hasExistingProfile);

  return {
    ready,
    hasExistingProfile,
    canAccessMainApp,
  };
}
