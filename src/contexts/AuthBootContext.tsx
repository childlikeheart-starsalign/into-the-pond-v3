import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { routes } from "@/src/navigation/routes";

const MIN_PREPARING_MS = 1200;

type AuthBootProviderProps = {
  children: ReactNode;
  fontsLoaded: boolean;
  authReady: boolean;
  uid: string | null;
  emailVerified: boolean;
  narrativeGateReady: boolean;
};

type AuthBootContextValue = {
  authInitializing: boolean;
  showBootOverlay: boolean;
  hasCompletedColdStartBoot: boolean;
  gateUnlockedThisSession: boolean;
  completeColdStartBoot: () => void;
  unlockGateForSession: () => void;
  unlockGateAndGoToSignup: () => void;
  unlockGateAndGoToLogin: () => void;
};

const AuthBootContext = createContext<AuthBootContextValue | null>(null);

export function AuthBootProvider({
  children,
  fontsLoaded,
  authReady,
  uid,
  emailVerified,
  narrativeGateReady,
}: AuthBootProviderProps) {
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [coldStartBootComplete, setColdStartBootComplete] = useState(false);
  const [gateUnlockedThisSession, setGateUnlockedThisSession] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_PREPARING_MS);
    return () => clearTimeout(timer);
  }, []);

  const authInitializing =
    !fontsLoaded ||
    !authReady ||
    !minDurationElapsed ||
    (uid !== null && emailVerified && !narrativeGateReady);

  const showBootOverlay = authInitializing && !coldStartBootComplete;

  const completeColdStartBoot = useCallback(() => {
    setColdStartBootComplete(true);
  }, []);

  const unlockGateForSession = useCallback(() => {
    setGateUnlockedThisSession(true);
  }, []);

  const unlockGateAndGoToSignup = useCallback(() => {
    setGateUnlockedThisSession(true);
    router.replace(routes.signup);
  }, []);

  const unlockGateAndGoToLogin = useCallback(() => {
    setGateUnlockedThisSession(true);
    router.replace(routes.login);
  }, []);

  const value = useMemo(
    () => ({
      authInitializing,
      showBootOverlay,
      hasCompletedColdStartBoot: coldStartBootComplete,
      gateUnlockedThisSession,
      completeColdStartBoot,
      unlockGateForSession,
      unlockGateAndGoToSignup,
      unlockGateAndGoToLogin,
    }),
    [
      authInitializing,
      showBootOverlay,
      coldStartBootComplete,
      gateUnlockedThisSession,
      completeColdStartBoot,
      unlockGateForSession,
      unlockGateAndGoToSignup,
      unlockGateAndGoToLogin,
    ],
  );

  return <AuthBootContext.Provider value={value}>{children}</AuthBootContext.Provider>;
}

export function useAuthBoot(): AuthBootContextValue {
  const ctx = useContext(AuthBootContext);
  if (!ctx) {
    throw new Error("useAuthBoot must be used within AuthBootProvider");
  }
  return ctx;
}
