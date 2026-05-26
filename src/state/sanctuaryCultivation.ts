import type { SanctuaryCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { EMPTY_CULTIVATION, normalizeCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { loadSanctuaryCultivation } from "@/src/features/sanctuary/cultivationStorage";

type CultivationListener = (value: SanctuaryCultivation) => void;

let current: SanctuaryCultivation = normalizeCultivation(EMPTY_CULTIVATION);
let pendingArrivalBloomId: string | null = null;
const listeners = new Set<CultivationListener>();

function emit() {
  listeners.forEach((listener) => listener(current));
}

export function getSanctuaryCultivationState(): SanctuaryCultivation {
  return normalizeCultivation(current);
}

export function getPendingArrivalBloomId(): string | null {
  return pendingArrivalBloomId;
}

export function setPendingArrivalBloomId(id: string | null): void {
  pendingArrivalBloomId = id;
}

export function setSanctuaryCultivationState(next: SanctuaryCultivation): void {
  current = normalizeCultivation(next);
  emit();
}

export async function refreshSanctuaryCultivation(): Promise<SanctuaryCultivation> {
  const loaded = normalizeCultivation(await loadSanctuaryCultivation());
  current = loaded;
  emit();
  return loaded;
}

export function subscribeSanctuaryCultivation(listener: CultivationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
