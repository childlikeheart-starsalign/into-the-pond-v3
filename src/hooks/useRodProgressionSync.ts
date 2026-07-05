import { useEffect } from "react";

import {
  acquireRodProgressionSync,
  releaseRodProgressionSync,
} from "@/src/services/firebase/rodProgressionSync";

/** Start the singleton Firestore reconciler for rod progression (app root). */
export function useRodProgressionSync(uid: string | null, enabled = false): void {
  useEffect(() => {
    if (!uid || !enabled) return;
    acquireRodProgressionSync(uid);
    return () => releaseRodProgressionSync(uid);
  }, [enabled, uid]);
}
