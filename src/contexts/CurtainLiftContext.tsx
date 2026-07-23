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
import { AccessibilityInfo, Animated } from "react-native";

import {
  CURTAIN_BRIDGE_FADE_MS,
  CURTAIN_MIN_DWELL_MS,
  CURTAIN_REVEAL_FADE_MS,
  CURTAIN_SLOW_LOAD_MS,
  SANCTUARY_SCENE_LAYERS,
  type SanctuarySceneLayer,
} from "@/src/constants/curtainLift";
import { prefetchSanctuaryScene } from "@/src/services/sanctuary/prefetchSanctuaryScene";
import {
  maybePlaySanctuaryFirstRevealTheme,
  stopSanctuaryFirstRevealTheme,
} from "@/src/services/audio/sanctuaryThemeSound";
import { firebaseAuth } from "@/src/services/firebase/client";

export type CurtainPhase = "idle" | "video" | "bridge" | "reveal";

type BeginCurtainLiftOptions = {
  startedAt: number;
  onComplete?: () => void;
};

type CurtainLiftContextValue = {
  phase: CurtainPhase;
  active: boolean;
  sanctuarySceneReady: boolean;
  sanctuaryRevealOpacity: Animated.Value;
  curtainOpacity: Animated.Value;
  videoOpacity: Animated.Value;
  beginCurtainLift: (options: BeginCurtainLiftOptions) => void;
  completeCurtainLift: () => void;
  startPrefetch: () => void;
  reportLayerLoad: (layer: SanctuarySceneLayer) => void;
  setVideoRef: (ref: { freezeAtStart: () => Promise<void> } | null) => void;
};

export const CurtainLiftContext = createContext<CurtainLiftContextValue | null>(null);

export function CurtainLiftProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<CurtainPhase>("idle");
  const [sanctuarySceneReady, setSanctuarySceneReady] = useState(false);

  const sanctuaryRevealOpacity = useRef(new Animated.Value(0)).current;
  const curtainOpacity = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(1)).current;

  const startedAtRef = useRef(0);
  const navigatedAtRef = useRef(0);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const prefetchStartedRef = useRef(false);
  const prefetchDoneRef = useRef(false);
  const loadedLayersRef = useRef(new Set<SanctuarySceneLayer>());
  const bridgeStartedRef = useRef(false);
  const bridgeCompleteRef = useRef(false);
  const revealStartedRef = useRef(false);
  const videoRef = useRef<{ freezeAtStart: () => Promise<void> } | null>(null);

  const active = phase !== "idle";

  const updateSceneReady = useCallback(() => {
    const allLayersLoaded = SANCTUARY_SCENE_LAYERS.every((layer) =>
      loadedLayersRef.current.has(layer),
    );
    const ready = prefetchDoneRef.current && allLayersLoaded;
    setSanctuarySceneReady(ready);
    return ready;
  }, []);

  const completeCurtainLift = useCallback(() => {
    const callback = onCompleteRef.current;
    onCompleteRef.current = null;
    sanctuaryRevealOpacity.setValue(1);
    curtainOpacity.setValue(0);
    setPhase("idle");
    setSanctuarySceneReady(false);
    startedAtRef.current = 0;
    navigatedAtRef.current = 0;
    prefetchStartedRef.current = false;
    prefetchDoneRef.current = false;
    loadedLayersRef.current = new Set();
    bridgeStartedRef.current = false;
    bridgeCompleteRef.current = false;
    revealStartedRef.current = false;
    videoOpacity.setValue(1);
    void stopSanctuaryFirstRevealTheme();
    callback?.();
  }, [curtainOpacity, sanctuaryRevealOpacity, videoOpacity]);

  const startPrefetch = useCallback(() => {
    if (prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;

    void (async () => {
      const result = await prefetchSanctuaryScene();
      prefetchDoneRef.current = true;
      if (!result.criticalReady) {
        console.warn("[CurtainLift] sanctuary prefetch incomplete", result.layerResults);
      }
      updateSceneReady();
    })();
  }, [updateSceneReady]);

  const reportLayerLoad = useCallback(
    (layer: SanctuarySceneLayer) => {
      if (phase === "idle") return;
      loadedLayersRef.current.add(layer);
      updateSceneReady();
    },
    [phase, updateSceneReady],
  );

  const beginCurtainLift = useCallback(
    ({ startedAt, onComplete }: BeginCurtainLiftOptions) => {
      startedAtRef.current = startedAt;
      navigatedAtRef.current = Date.now();
      onCompleteRef.current = onComplete ?? null;
      loadedLayersRef.current = new Set();
      bridgeStartedRef.current = false;
      bridgeCompleteRef.current = false;
      revealStartedRef.current = false;
      sanctuaryRevealOpacity.setValue(0);
      curtainOpacity.setValue(1);
      videoOpacity.setValue(1);
      setSanctuarySceneReady(false);
      setPhase("video");
      startPrefetch();
    },
    [curtainOpacity, sanctuaryRevealOpacity, startPrefetch, videoOpacity],
  );

  const setVideoRef = useCallback((ref: { freezeAtStart: () => Promise<void> } | null) => {
    videoRef.current = ref;
  }, []);

  const startBridge = useCallback(async () => {
    if (bridgeStartedRef.current) return;
    bridgeStartedRef.current = true;

    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    const duration = reduceMotion ? 0 : CURTAIN_BRIDGE_FADE_MS;

    setPhase("bridge");

    if (duration === 0) {
      videoOpacity.setValue(0);
      bridgeCompleteRef.current = true;
      return;
    }

    Animated.timing(videoOpacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        bridgeCompleteRef.current = true;
      }
    });
  }, [videoOpacity]);

  const startReveal = useCallback(async () => {
    if (revealStartedRef.current) return;
    revealStartedRef.current = true;
    setPhase("reveal");

    await videoRef.current?.freezeAtStart();
    videoOpacity.setValue(0);

    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    const uid = firebaseAuth.currentUser?.uid;
    void maybePlaySanctuaryFirstRevealTheme(uid, { skipForReduceMotion: reduceMotion });
    const duration = reduceMotion ? 0 : CURTAIN_REVEAL_FADE_MS;

    if (duration === 0) {
      sanctuaryRevealOpacity.setValue(1);
      curtainOpacity.setValue(0);
      completeCurtainLift();
      return;
    }

    Animated.timing(curtainOpacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        sanctuaryRevealOpacity.setValue(1);
        completeCurtainLift();
      }
    });
  }, [completeCurtainLift, curtainOpacity, sanctuaryRevealOpacity, videoOpacity]);

  useEffect(() => {
    if (!active || phase === "reveal") return undefined;

    const tick = () => {
      const now = Date.now();
      const elapsedSinceStart = now - startedAtRef.current;
      const elapsedSinceNavigate = now - navigatedAtRef.current;
      const sceneReady = updateSceneReady();

      if (!bridgeStartedRef.current && !sceneReady && elapsedSinceStart >= CURTAIN_SLOW_LOAD_MS) {
        void startBridge();
      }

      const bridgeSatisfied = !bridgeStartedRef.current || bridgeCompleteRef.current;
      const dwellSatisfied = elapsedSinceNavigate >= CURTAIN_MIN_DWELL_MS;

      if (sceneReady && dwellSatisfied && bridgeSatisfied && !revealStartedRef.current) {
        void startReveal();
      }
    };

    const interval = setInterval(tick, 100);
    tick();

    return () => clearInterval(interval);
  }, [active, phase, startBridge, startReveal, updateSceneReady]);

  const value = useMemo(
    () => ({
      phase,
      active,
      sanctuarySceneReady,
      sanctuaryRevealOpacity,
      curtainOpacity,
      videoOpacity,
      beginCurtainLift,
      completeCurtainLift,
      startPrefetch,
      reportLayerLoad,
      setVideoRef,
    }),
    [
      phase,
      active,
      sanctuarySceneReady,
      sanctuaryRevealOpacity,
      curtainOpacity,
      videoOpacity,
      beginCurtainLift,
      completeCurtainLift,
      startPrefetch,
      reportLayerLoad,
      setVideoRef,
    ],
  );

  return <CurtainLiftContext.Provider value={value}>{children}</CurtainLiftContext.Provider>;
}

export function useCurtainLift(): CurtainLiftContextValue {
  const ctx = useContext(CurtainLiftContext);
  if (!ctx) {
    throw new Error("useCurtainLift must be used within CurtainLiftProvider");
  }
  return ctx;
}

/** Safe optional access for sanctuary tab when provider may not wrap tests. */
export function useCurtainLiftOptional(): CurtainLiftContextValue | null {
  return useContext(CurtainLiftContext);
}
