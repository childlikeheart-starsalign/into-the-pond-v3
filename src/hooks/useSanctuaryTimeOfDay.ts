import { useEffect, useState } from "react";

import type { SanctuaryTimeOfDay } from "@/src/constants/sanctuaryAssets";
import { getSanctuaryTimeOfDay, subscribeSanctuaryTimeOfDay } from "@/src/state/sanctuaryTimeOfDay";

/** Reads the sanctuary tab's current time-of-day for cross-tab art routing. */
export function useSanctuaryTimeOfDay(): SanctuaryTimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<SanctuaryTimeOfDay>(getSanctuaryTimeOfDay);

  useEffect(() => subscribeSanctuaryTimeOfDay(setTimeOfDay), []);

  return timeOfDay;
}
