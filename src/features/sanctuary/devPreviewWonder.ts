import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_PREFIX = "sanctuary:dev-preview-wonder:";
const CREDITS_KEY_PREFIX = "sanctuary:dev-preview-wonder-credits:";

type Listener = () => void;
const listeners = new Set<Listener>();

function storageKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}${uid}`;
}

function creditsStorageKey(uid: string): string {
  return `${CREDITS_KEY_PREFIX}${uid}`;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

async function readBalance(uid: string): Promise<number> {
  if (!__DEV__) return 0;
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

async function writeBalance(uid: string, balance: number): Promise<void> {
  if (!__DEV__) return;
  const next = Math.max(0, Math.floor(balance));
  if (next === 0) {
    await AsyncStorage.removeItem(storageKey(uid));
  } else {
    await AsyncStorage.setItem(storageKey(uid), String(next));
  }
  notifyListeners();
}

async function loadCreditedKeys(uid: string): Promise<Set<string>> {
  if (!__DEV__) return new Set();
  const raw = await AsyncStorage.getItem(creditsStorageKey(uid));
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

async function saveCreditedKeys(uid: string, keys: Set<string>): Promise<void> {
  if (!__DEV__) return;
  if (keys.size === 0) {
    await AsyncStorage.removeItem(creditsStorageKey(uid));
    return;
  }
  await AsyncStorage.setItem(creditsStorageKey(uid), JSON.stringify([...keys]));
}

/** Pure helper — whether a credit key should be applied. */
export function mergePreviewCreditKey(
  existing: string[],
  creditKey: string,
): { keys: string[]; isNew: boolean } {
  if (existing.includes(creditKey)) {
    return { keys: existing, isNew: false };
  }
  return { keys: [...existing, creditKey], isNew: true };
}

/** Pure reconcile — subtract Firestore increases from preview balance to avoid double-counting. */
export function reconcilePreviewBalance(previewBalance: number, firestoreDelta: number): number {
  if (firestoreDelta <= 0) return previewBalance;
  return Math.max(0, previewBalance - firestoreDelta);
}

export async function getDevPreviewWonder(uid: string): Promise<number> {
  return readBalance(uid);
}

export async function addDevPreviewWonder(uid: string, amount: number): Promise<void> {
  if (!__DEV__ || amount <= 0) return;
  const current = await readBalance(uid);
  await writeBalance(uid, current + amount);
}

export async function creditDevPreviewWonderIdempotent(
  uid: string,
  amount: number,
  creditKey: string,
): Promise<boolean> {
  if (!__DEV__ || amount <= 0 || !creditKey.trim()) return false;

  const credited = await loadCreditedKeys(uid);
  if (credited.has(creditKey)) return false;

  credited.add(creditKey);
  await addDevPreviewWonder(uid, amount);
  await saveCreditedKeys(uid, credited);
  return true;
}

export async function reconcileDevPreviewWonder(
  uid: string,
  firestoreDelta: number,
): Promise<void> {
  if (!__DEV__ || firestoreDelta <= 0) return;
  const current = await readBalance(uid);
  const next = reconcilePreviewBalance(current, firestoreDelta);
  if (next !== current) {
    await writeBalance(uid, next);
  }
}

/** Notify subscribers to re-read preview balance from storage. */
export function refreshDevPreviewWonder(): void {
  notifyListeners();
}

export function subscribeDevPreviewWonder(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
