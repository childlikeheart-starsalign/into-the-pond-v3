import AsyncStorage from "@react-native-async-storage/async-storage";

import { uiRodIdToDomain } from "@/shared/sanctuary/fishing/castMapping";
import { FIRST_CAST_ROD_MESSAGES } from "@/shared/sanctuary/fishing/fishingOutcomeMessages";

const FIRST_CAST_SEEN_KEY = "fishing:first-cast-seen-v1";
export const DEFAULT_CASTING_LABEL = "casting...";

/**
 * Once-per-domain-rod first-cast copy for the pond waiting overlay.
 * Marks the rod as seen when a first-cast message is returned.
 */
export async function resolveFirstCastPondLabel(
  uiRodId: string | null | undefined,
): Promise<string> {
  const domainRodId = uiRodIdToDomain(uiRodId ?? "basic");
  const firstCastCopy = FIRST_CAST_ROD_MESSAGES[domainRodId];
  if (!firstCastCopy) return DEFAULT_CASTING_LABEL;

  try {
    const raw = await AsyncStorage.getItem(FIRST_CAST_SEEN_KEY);
    const seen = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    if (seen[domainRodId]) return DEFAULT_CASTING_LABEL;

    await AsyncStorage.setItem(
      FIRST_CAST_SEEN_KEY,
      JSON.stringify({ ...seen, [domainRodId]: true }),
    );
    return firstCastCopy;
  } catch {
    return DEFAULT_CASTING_LABEL;
  }
}
