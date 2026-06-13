import { useMemo } from "react";

import type { GateTiersConfig } from "@/src/features/gate/types";

const tiersJson = require("@/assets/gate/tiers.json") as GateTiersConfig;

export function getGateTiersConfig(): GateTiersConfig {
  return tiersJson;
}

export function useGateTiersConfig(): GateTiersConfig {
  return useMemo(() => getGateTiersConfig(), []);
}

/**
 * Remote-config hook — override `defaultRecommendedTierId` from tiers.json when wired.
 * Firebase key: tiersJson.remoteConfigKeys.recommendedTierId
 */
export function useRecommendedTierId(config: GateTiersConfig): string {
  // TODO: read Firebase Remote Config value for config.remoteConfigKeys.recommendedTierId
  return config.defaultRecommendedTierId;
}

/**
 * Tier IDs hidden by remote config (e.g. sold-out or regional).
 */
export function useUnavailableTierIds(_config: GateTiersConfig): string[] {
  // TODO: remote config list e.g. gate_unavailable_tier_ids
  return [];
}
