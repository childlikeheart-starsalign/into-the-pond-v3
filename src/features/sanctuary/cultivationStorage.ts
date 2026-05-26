import AsyncStorage from "@react-native-async-storage/async-storage";

import { slotForReflectionIndex } from "@/src/features/sanctuary/bloomCatalog";
import type {
  SanctuaryBloom,
  SanctuaryCultivation,
} from "@/src/features/sanctuary/cultivationTypes";
import { EMPTY_CULTIVATION, normalizeCultivation } from "@/src/features/sanctuary/cultivationTypes";

const STORAGE_KEY = "sanctuary:cultivation";

function createBloomId() {
  return `bloom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadSanctuaryCultivation(): Promise<SanctuaryCultivation> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...EMPTY_CULTIVATION, blooms: [] };

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeCultivation(parsed);
  } catch {
    return { ...EMPTY_CULTIVATION, blooms: [] };
  }
}

async function saveSanctuaryCultivation(cultivation: SanctuaryCultivation): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cultivation));
}

export async function addReflectionBloom(
  lessonId: string,
  ritualId: string,
): Promise<SanctuaryBloom> {
  const cultivation = await loadSanctuaryCultivation();
  const slot = slotForReflectionIndex(cultivation.reflectionCount);

  const bloom: SanctuaryBloom = {
    id: createBloomId(),
    lessonId,
    ritualId,
    kind: slot.kind,
    x: slot.x,
    y: slot.y,
    createdAt: new Date().toISOString(),
    seenArrival: false,
  };

  const next: SanctuaryCultivation = {
    reflectionCount: cultivation.reflectionCount + 1,
    blooms: [...cultivation.blooms, bloom],
  };

  await saveSanctuaryCultivation(next);
  return bloom;
}

export async function markBloomArrivalSeen(bloomId: string): Promise<SanctuaryCultivation> {
  const cultivation = await loadSanctuaryCultivation();
  const blooms = cultivation.blooms.map((bloom) =>
    bloom.id === bloomId ? { ...bloom, seenArrival: true } : bloom,
  );
  const next = { ...cultivation, blooms };
  await saveSanctuaryCultivation(next);
  return next;
}

export function getUnseenBloom(
  cultivation: SanctuaryCultivation | null | undefined,
): SanctuaryBloom | null {
  const normalized = normalizeCultivation(cultivation);
  return normalized.blooms.find((bloom) => !bloom.seenArrival) ?? null;
}
