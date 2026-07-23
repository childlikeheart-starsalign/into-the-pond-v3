import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  createDefaultTuningState,
  parseTuningStateJson,
  pickHeaderRefWidth,
  SANCTUARY_HEADER_TUNING_STORAGE_KEY,
  type HeaderOverlayTuning,
  type SanctuaryHeaderSlotKey,
  type SanctuaryHeaderTuningState,
  type SanctuaryHeaderTuningTarget,
} from "@/src/features/sanctuary/sanctuaryHeaderTuning";

type SanctuaryHeaderTuningContextValue = {
  state: SanctuaryHeaderTuningState;
  refWidth: number;
  panelOpen: boolean;
  activeTarget: SanctuaryHeaderTuningTarget;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setActiveTarget: (target: SanctuaryHeaderTuningTarget) => void;
  setOverlayField: <K extends keyof HeaderOverlayTuning>(
    key: K,
    value: HeaderOverlayTuning[K],
  ) => void;
  nudgeOverlay: (field: keyof HeaderOverlayTuning, delta: number) => void;
  setBandHeight: (value: number) => void;
  setAvatarCenterY: (value: number) => void;
  nudgeSlot: (slot: SanctuaryHeaderSlotKey, axis: "x" | "y", delta: number) => void;
  nudgeOverlayPan: (dx: number, dy: number) => void;
  reset: () => void;
};

const noop = () => {};

const defaultContext: SanctuaryHeaderTuningContextValue = {
  state: createDefaultTuningState(),
  refWidth: 375,
  panelOpen: false,
  activeTarget: "overlay",
  setPanelOpen: noop,
  togglePanel: noop,
  setActiveTarget: noop,
  setOverlayField: noop,
  nudgeOverlay: noop,
  setBandHeight: noop,
  setAvatarCenterY: noop,
  nudgeSlot: noop,
  nudgeOverlayPan: noop,
  reset: noop,
};

const SanctuaryHeaderTuningContext =
  createContext<SanctuaryHeaderTuningContextValue>(defaultContext);

const SAVE_DEBOUNCE_MS = 400;

type SanctuaryHeaderTuningProviderProps = {
  frameWidth: number;
  children: ReactNode;
};

export function SanctuaryHeaderTuningProvider({
  frameWidth,
  children,
}: SanctuaryHeaderTuningProviderProps) {
  const refWidth = pickHeaderRefWidth(frameWidth);
  const [state, setState] = useState<SanctuaryHeaderTuningState>(createDefaultTuningState);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<SanctuaryHeaderTuningTarget>("overlay");
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!__DEV__) return;
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(SANCTUARY_HEADER_TUNING_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = parseTuningStateJson(raw);
          if (parsed) setState(parsed);
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!__DEV__ || !hydrated) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void AsyncStorage.setItem(SANCTUARY_HEADER_TUNING_STORAGE_KEY, JSON.stringify(state));
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hydrated, state]);

  const setOverlayField = useCallback(
    <K extends keyof HeaderOverlayTuning>(key: K, value: HeaderOverlayTuning[K]) => {
      setState((prev) => ({
        ...prev,
        overlay: { ...prev.overlay, [key]: value },
      }));
    },
    [],
  );

  const nudgeOverlay = useCallback((field: keyof HeaderOverlayTuning, delta: number) => {
    setState((prev) => ({
      ...prev,
      overlay: { ...prev.overlay, [field]: prev.overlay[field] + delta },
    }));
  }, []);

  const nudgeOverlayPan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({
      ...prev,
      overlay: {
        ...prev.overlay,
        offsetX: prev.overlay.offsetX + dx,
        offsetY: prev.overlay.offsetY + dy,
      },
    }));
  }, []);

  const setBandHeight = useCallback((value: number) => {
    setState((prev) => ({ ...prev, bandHeight: value }));
  }, []);

  const setAvatarCenterY = useCallback((value: number) => {
    setState((prev) => ({ ...prev, avatarCenterY: value }));
  }, []);

  const nudgeSlot = useCallback((slot: SanctuaryHeaderSlotKey, axis: "x" | "y", delta: number) => {
    setState((prev) => ({
      ...prev,
      slotOffsets: {
        ...prev.slotOffsets,
        [slot]: {
          ...prev.slotOffsets[slot],
          [axis]: prev.slotOffsets[slot][axis] + delta,
        },
      },
    }));
  }, []);

  const reset = useCallback(() => {
    const defaults = createDefaultTuningState();
    setState(defaults);
    void AsyncStorage.removeItem(SANCTUARY_HEADER_TUNING_STORAGE_KEY);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    (): SanctuaryHeaderTuningContextValue => ({
      state,
      refWidth,
      panelOpen,
      activeTarget,
      setPanelOpen,
      togglePanel,
      setActiveTarget,
      setOverlayField,
      nudgeOverlay,
      setBandHeight,
      setAvatarCenterY,
      nudgeSlot,
      nudgeOverlayPan,
      reset,
    }),
    [
      state,
      refWidth,
      panelOpen,
      activeTarget,
      togglePanel,
      setOverlayField,
      nudgeOverlay,
      setBandHeight,
      setAvatarCenterY,
      nudgeSlot,
      nudgeOverlayPan,
      reset,
    ],
  );

  if (!__DEV__) {
    return <>{children}</>;
  }

  return (
    <SanctuaryHeaderTuningContext.Provider value={value}>
      {children}
    </SanctuaryHeaderTuningContext.Provider>
  );
}

export function useSanctuaryHeaderTuning(): SanctuaryHeaderTuningContextValue {
  return useContext(SanctuaryHeaderTuningContext);
}

export function useSanctuaryHeaderTuningEnabled(): boolean {
  const ctx = useContext(SanctuaryHeaderTuningContext);
  return __DEV__ && ctx.panelOpen;
}
