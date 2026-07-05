import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";
import { isRodOwnedForFishing } from "@/shared/sanctuary/progression";
import { uiRodIdToDomain } from "@/src/features/fishing/rodIdMap";

export function isUiRodOwnedForFishing(
  uiRodId: string,
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): boolean {
  const domainId = uiRodIdToDomain(uiRodId);
  if (domainId === "basic") return true;
  return isRodOwnedForFishing(playerRods[domainId]?.state);
}
