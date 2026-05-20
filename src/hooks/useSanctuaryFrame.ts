import { useCallback, useMemo, useState } from "react";

import {
  getSanctuaryFrame,
  SANCTUARY_DEFAULT_FRAME_ID,
  SANCTUARY_FRAME_IDS,
  type SanctuaryFrameId,
} from "@/src/constants/sanctuaryFrames";

export function useSanctuaryFrame(initialFrameId: SanctuaryFrameId = SANCTUARY_DEFAULT_FRAME_ID) {
  const [frameId, setFrameId] = useState<SanctuaryFrameId>(initialFrameId);

  const source = useMemo(() => getSanctuaryFrame(frameId), [frameId]);

  const setFrameByIndex = useCallback((index: number) => {
    const id = SANCTUARY_FRAME_IDS[index];
    if (id != null) setFrameId(id);
  }, []);

  const nextFrame = useCallback(() => {
    const idx = SANCTUARY_FRAME_IDS.indexOf(frameId);
    const next = (idx + 1) % SANCTUARY_FRAME_IDS.length;
    setFrameId(SANCTUARY_FRAME_IDS[next]);
  }, [frameId]);

  return { frameId, source, setFrameId, setFrameByIndex, nextFrame };
}
