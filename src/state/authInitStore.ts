import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthInitPhase =
  | "awaiting_verification"
  | "initializing"
  | "initialized"
  | "init_failed";

const PHASE_PREFIX = "@itp/auth-init-phase-v1:";
const REQUEST_ID_PREFIX = "@itp/auth-init-request-id-v1:";

type Listener = () => void;

let phase: AuthInitPhase = "awaiting_verification";
let sanctuaryInitialized = false;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getAuthInitPhase(): AuthInitPhase {
  return phase;
}

export function isSanctuaryInitialized(): boolean {
  return sanctuaryInitialized;
}

export function setAuthInitPhase(next: AuthInitPhase): void {
  phase = next;
  if (next === "initialized") {
    sanctuaryInitialized = true;
  }
  notify();
}

export function setSanctuaryInitializedFromRemote(initialized: boolean): void {
  sanctuaryInitialized = initialized;
  if (initialized && phase !== "initialized") {
    phase = "initialized";
  }
  notify();
}

export function subscribeAuthInit(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAuthInitStore(): void {
  phase = "awaiting_verification";
  sanctuaryInitialized = false;
  notify();
}

export async function persistAuthInitPhase(uid: string, next: AuthInitPhase): Promise<void> {
  await AsyncStorage.setItem(`${PHASE_PREFIX}${uid}`, next);
}

export async function hydrateAuthInitPhase(uid: string): Promise<void> {
  const stored = await AsyncStorage.getItem(`${PHASE_PREFIX}${uid}`);
  if (stored === "initialized") {
    phase = "initialized";
    sanctuaryInitialized = true;
    notify();
    return;
  }
  if (stored === "initializing" || stored === "init_failed") {
    phase = stored;
    notify();
  }
}

export async function getOrCreateInitRequestId(uid: string): Promise<string> {
  const key = `${REQUEST_ID_PREFIX}${uid}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;

  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? `init_${globalThis.crypto.randomUUID()}`
      : `init_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  await AsyncStorage.setItem(key, id);
  return id;
}

export async function clearAuthInitPersistence(uid: string): Promise<void> {
  await AsyncStorage.multiRemove([`${PHASE_PREFIX}${uid}`, `${REQUEST_ID_PREFIX}${uid}`]);
}
