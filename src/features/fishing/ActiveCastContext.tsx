import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";

import { useActiveCast, type UseActiveCastResult } from "@/src/features/fishing/useActiveCast";
import { isAnonymousAuthUser, subscribeToAuthState } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";

const ActiveCastContext = createContext<UseActiveCastResult | null>(null);

function resolveUid(user: User | null): string | null {
  if (!user || isAnonymousAuthUser(user)) return null;
  return user.uid;
}

/**
 * Tabs-shell owner of fishing cast state. Claim runs regardless of which tab is focused;
 * ceremony UI remains on Sanctuary.
 */
export function ActiveCastProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(() => resolveUid(firebaseAuth.currentUser));
  const activeCast = useActiveCast(uid);

  useEffect(() => {
    return subscribeToAuthState((user) => {
      setUid(resolveUid(user));
    });
  }, []);

  return <ActiveCastContext.Provider value={activeCast}>{children}</ActiveCastContext.Provider>;
}

export function useActiveCastContext(): UseActiveCastResult {
  const value = useContext(ActiveCastContext);
  if (!value) {
    throw new Error("useActiveCastContext must be used within ActiveCastProvider");
  }
  return value;
}
