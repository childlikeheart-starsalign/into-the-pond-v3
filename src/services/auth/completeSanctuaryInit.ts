import {
  getOrCreateInitRequestId,
  persistAuthInitPhase,
  setAuthInitPhase,
  setSanctuaryInitializedFromRemote,
} from "@/src/state/authInitStore";
import {
  identifyReturningUser,
  resolveAuthMethodFromUser,
  stitchPostHogIdentityAndAuthSuccess,
} from "@/src/services/analytics/authFunnel";
import { reloadAuthOnce } from "@/src/services/auth/authReloadCoordinator";
import { confirmSanctuaryReadyForReturningUser } from "@/src/services/auth/sanctuaryReadiness";
import { initializeSanctuary } from "@/src/services/firebase/serverActions";

export type CompleteSanctuaryInitResult =
  | { status: "not_verified" }
  | { status: "success" | "already_initialized" }
  | { status: "error"; message: string };

let initPromise: Promise<CompleteSanctuaryInitResult> | null = null;

export async function completeSanctuaryInit(): Promise<CompleteSanctuaryInitResult> {
  if (initPromise) return initPromise;

  initPromise = runCompleteSanctuaryInit().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

/** Callable first; on failure, confirm returning user via Firestore read (Spark-safe). */
export async function completeSanctuaryInitWithLegacyFallback(
  uid: string,
): Promise<CompleteSanctuaryInitResult> {
  const initResult = await completeSanctuaryInit();
  if (initResult.status === "success" || initResult.status === "already_initialized") {
    return initResult;
  }

  if (initResult.status === "not_verified") {
    return initResult;
  }

  const legacyReady = await confirmSanctuaryReadyForReturningUser(uid);
  if (legacyReady) {
    void completeSanctuaryInit();
    return { status: "already_initialized" };
  }

  return initResult;
}

async function runCompleteSanctuaryInit(): Promise<CompleteSanctuaryInitResult> {
  const user = await reloadAuthOnce();
  if (!user?.emailVerified) {
    return { status: "not_verified" };
  }

  setAuthInitPhase("initializing");
  await persistAuthInitPhase(user.uid, "initializing");

  try {
    const requestId = await getOrCreateInitRequestId(user.uid);
    const result = await initializeSanctuary(user.uid, { requestId });

    if (result.status === "success" || result.status === "already_initialized") {
      setAuthInitPhase("initialized");
      setSanctuaryInitializedFromRemote(true);
      await persistAuthInitPhase(user.uid, "initialized");

      const authMethod = resolveAuthMethodFromUser();
      if (result.status === "success") {
        stitchPostHogIdentityAndAuthSuccess(authMethod);
      } else {
        identifyReturningUser();
      }

      return { status: result.status };
    }

    setAuthInitPhase("init_failed");
    await persistAuthInitPhase(user.uid, "init_failed");
    return { status: "error", message: "Could not prepare your sanctuary." };
  } catch (error) {
    setAuthInitPhase("init_failed");
    await persistAuthInitPhase(user.uid, "init_failed");
    const message = error instanceof Error ? error.message : "Could not prepare your sanctuary.";
    return { status: "error", message };
  }
}
