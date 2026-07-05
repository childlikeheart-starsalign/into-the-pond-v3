import { useRouter } from "expo-router";
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
import { BackHandler } from "react-native";

import { SIGN_IN_ARRIVAL_FADE_MS, SIGN_IN_ARRIVAL_MIN_MS } from "@/src/constants/signInArrival";
import { useCurtainLift } from "@/src/contexts/CurtainLiftContext";
import { mergeCelebrationState } from "@/src/navigation/mergeCelebrationState";
import { postAuthBreathMoment } from "@/src/navigation/postAuthBreathMoment";
import {
  resolveSignInArrivalDestination,
  type SignInArrivalReadiness,
} from "@/src/navigation/resolveSignInArrivalDestination";
import { routes } from "@/src/navigation/routes";
import { playGateChime } from "@/src/services/audio/playGateChime";
import { completeSanctuaryInitWithLegacyFallback } from "@/src/services/auth/completeSanctuaryInit";
import { maybeMarkCelebrationForReturningUser } from "@/src/services/onboarding/maybeMarkCelebrationForReturningUser";
import { isSanctuaryInitialized } from "@/src/state/authInitStore";

export type SignInArrivalPhase = "idle" | "artboard" | "video" | "curtainLift" | "fadeOut";

type SignInArrivalContextValue = {
  phase: SignInArrivalPhase;
  active: boolean;
  startedAt: number;
  initError: string | null;
  startArtboard: () => void;
  startVideo: (expectedUid: string, markUnknown: boolean) => void;
  cancel: () => void;
};

const SignInArrivalContext = createContext<SignInArrivalContextValue | null>(null);

type SignInArrivalProviderProps = {
  children: ReactNode;
  readiness: SignInArrivalReadiness;
  completeColdStartBoot: () => void;
};

export function SignInArrivalProvider({
  children,
  readiness,
  completeColdStartBoot,
}: SignInArrivalProviderProps) {
  const router = useRouter();
  const { beginCurtainLift, startPrefetch, completeCurtainLift } = useCurtainLift();
  const [phase, setPhase] = useState<SignInArrivalPhase>("idle");
  const [expectedUid, setExpectedUid] = useState<string | null>(null);
  const [markUnknown, setMarkUnknown] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const startedAtRef = useRef(0);
  const navigatedRef = useRef(false);
  const initDoneRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = phase !== "idle";

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const resetArrivalState = useCallback(() => {
    navigatedRef.current = false;
    initDoneRef.current = false;
    setInitError(null);
    setExpectedUid(null);
    setMarkUnknown(false);
    setStartedAt(0);
    startedAtRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    clearFadeTimer();
    completeCurtainLift();
    resetArrivalState();
    setPhase("idle");
  }, [clearFadeTimer, completeCurtainLift, resetArrivalState]);

  const startArtboard = useCallback(() => {
    clearFadeTimer();
    resetArrivalState();
    const now = Date.now();
    startedAtRef.current = now;
    setStartedAt(now);
    completeColdStartBoot();
    setPhase("artboard");
  }, [clearFadeTimer, completeColdStartBoot, resetArrivalState]);

  const startVideo = useCallback(
    (uid: string, unknownMark: boolean) => {
      setExpectedUid(uid);
      setMarkUnknown(unknownMark);
      setPhase("video");
      startPrefetch();
    },
    [startPrefetch],
  );

  useEffect(() => {
    if (!active) return undefined;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [active]);

  useEffect(() => {
    if (phase !== "video" || !expectedUid) return undefined;

    let cancelled = false;

    const finishArrival = () => {
      setPhase("idle");
      resetArrivalState();
      navigatedRef.current = false;
    };

    const tick = async () => {
      if (cancelled || navigatedRef.current) return;

      if (markUnknown) {
        const markResult = await maybeMarkCelebrationForReturningUser(expectedUid);
        if (cancelled || navigatedRef.current) return;
        if (markResult === false) {
          cancel();
          return;
        }
        if (markResult === "unknown") {
          return;
        }
        setMarkUnknown(false);
      }

      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed < SIGN_IN_ARRIVAL_MIN_MS) return;

      if (!initDoneRef.current) {
        if (isSanctuaryInitialized()) {
          initDoneRef.current = true;
          setInitError(null);
        } else {
          const initResult = await completeSanctuaryInitWithLegacyFallback(expectedUid);
          if (cancelled || navigatedRef.current) return;
          if (initResult.status === "success" || initResult.status === "already_initialized") {
            initDoneRef.current = true;
            setInitError(null);
          } else {
            if (initResult.status === "error") {
              setInitError(initResult.message);
            } else {
              setInitError("Could not prepare your sanctuary.");
            }
            return;
          }
        }
      }

      const postInitReadiness: SignInArrivalReadiness = {
        ...readiness,
        sanctuaryInitialized: readiness.sanctuaryInitialized || isSanctuaryInitialized(),
      };

      let destination = resolveSignInArrivalDestination(postInitReadiness, expectedUid);

      if (!destination) {
        const mergedCelebration = mergeCelebrationState(expectedUid, postInitReadiness.celebration);
        if (mergedCelebration.hasCompleted) {
          destination = routes.sanctuary;
        }
      }

      if (!destination) return;

      await postAuthBreathMoment();
      if (cancelled || navigatedRef.current) return;

      navigatedRef.current = true;
      router.replace(destination);
      void playGateChime();

      if (destination === routes.sanctuary) {
        beginCurtainLift({
          startedAt: startedAtRef.current,
          onComplete: finishArrival,
        });
        setPhase("curtainLift");
        return;
      }

      setPhase("fadeOut");
      fadeTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        finishArrival();
        fadeTimerRef.current = null;
      }, SIGN_IN_ARRIVAL_FADE_MS);
    };

    const interval = setInterval(() => {
      void tick();
    }, 100);
    void tick();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    phase,
    expectedUid,
    markUnknown,
    readiness,
    router,
    cancel,
    beginCurtainLift,
    resetArrivalState,
  ]);

  useEffect(() => () => clearFadeTimer(), [clearFadeTimer]);

  const value = useMemo(
    () => ({
      phase,
      active,
      startedAt,
      initError,
      startArtboard,
      startVideo,
      cancel,
    }),
    [phase, active, startedAt, initError, startArtboard, startVideo, cancel],
  );

  return <SignInArrivalContext.Provider value={value}>{children}</SignInArrivalContext.Provider>;
}

export function useSignInArrival(): SignInArrivalContextValue {
  const ctx = useContext(SignInArrivalContext);
  if (!ctx) {
    throw new Error("useSignInArrival must be used within SignInArrivalProvider");
  }
  return ctx;
}
