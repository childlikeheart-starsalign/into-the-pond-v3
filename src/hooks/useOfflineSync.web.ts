import { useEffect } from "react";

export function useOfflineSync(uid: string | null) {
  useEffect(() => {
    void uid;
  }, [uid]);
}
