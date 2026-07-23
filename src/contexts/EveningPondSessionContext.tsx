import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { setEveningPondPlayback } from "@/src/services/audio/eveningPondPlayer";
import { isPondSessionRoute } from "@/src/services/audio/eveningPondSessionRoutes";

export type EveningPondSuppressionKind = "pause" | "stop";

export type EveningPondSuppression = {
  kind: EveningPondSuppressionKind;
  active: boolean;
  /** When active, overrides session volume (e.g. diary closure 0.12). */
  volume?: number;
  /** When true, only contributes volume — not pause/stop. */
  volumeOnly?: boolean;
};

type EveningPondSessionContextValue = {
  setSuppression: (id: string, suppression: EveningPondSuppression | null) => void;
  suppressions: ReadonlyMap<string, EveningPondSuppression>;
};

const EveningPondSessionContext = createContext<EveningPondSessionContextValue | null>(null);

export function EveningPondSessionProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef(new Map<string, EveningPondSuppression>());
  const [version, setVersion] = useState(0);

  const setSuppression = useCallback((id: string, suppression: EveningPondSuppression | null) => {
    if (suppression == null) {
      mapRef.current.delete(id);
    } else {
      mapRef.current.set(id, suppression);
    }
    setVersion((v) => v + 1);
  }, []);

  const suppressions = useMemo(() => new Map(mapRef.current), [version]);

  const value = useMemo(
    () => ({
      setSuppression,
      suppressions,
    }),
    [setSuppression, suppressions],
  );

  return (
    <EveningPondSessionContext.Provider value={value}>
      {children}
    </EveningPondSessionContext.Provider>
  );
}

type EveningPondSessionControllerProps = {
  uid: string | null;
  pathname: string;
};

/** Drives the shared evening-pond player from route + suppression registry. */
export function EveningPondSessionController({ uid, pathname }: EveningPondSessionControllerProps) {
  const ctx = useContext(EveningPondSessionContext);
  if (!ctx) {
    throw new Error("EveningPondSessionController must be used within EveningPondSessionProvider");
  }

  const { suppressions } = ctx;

  useEffect(() => {
    const inSession = isPondSessionRoute(pathname, uid);
    const entries = [...suppressions.values()];

    const anyStop = entries.some((s) => s.active && s.kind === "stop" && !s.volumeOnly);
    const anyPause = entries.some((s) => s.active && s.kind === "pause" && !s.volumeOnly);

    let volume = 0.18;
    for (const suppression of entries) {
      if (suppression.volume == null) continue;
      if (suppression.volumeOnly || suppression.active) {
        volume = suppression.volume;
      }
    }

    setEveningPondPlayback({
      enabled: inSession && !anyStop,
      paused: anyPause,
      volume,
      fadeMs: inSession ? 0 : 400,
    });
  }, [pathname, suppressions, uid]);

  return null;
}

export function useEveningPondSessionRegistry(): EveningPondSessionContextValue {
  const ctx = useContext(EveningPondSessionContext);
  if (!ctx) {
    throw new Error("useEveningPondSessionRegistry must be used within EveningPondSessionProvider");
  }
  return ctx;
}
