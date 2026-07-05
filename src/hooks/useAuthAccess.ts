import { canAccessMainApp as computeCanAccessMainApp } from "@/src/services/firebase/userAccess";

type UseAuthAccessOptions = {
  uid: string | null;
  emailVerified: boolean;
  isAnonymous?: boolean;
};

type UseAuthAccessReturn = {
  ready: boolean;
  canAccessMainApp: boolean;
};

/** Whether a signed-in user may enter the main app (email verified only). */
export function useAuthAccess({
  uid,
  emailVerified,
  isAnonymous = false,
}: UseAuthAccessOptions): UseAuthAccessReturn {
  const ready = uid === null || true;
  const canAccessMainApp =
    uid !== null && ready && computeCanAccessMainApp({ emailVerified, isAnonymous });

  return {
    ready,
    canAccessMainApp,
  };
}
