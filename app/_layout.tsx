import "react-native-reanimated";
import "@/src/services/sentry/init";
import "@/src/services/analytics/posthogClient";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppState, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { assertRequiredEnv } from "@/src/config/env";
import { AuthBootScreen } from "@/src/components/auth/AuthBootScreen";
import { SignInArrivalOverlay } from "@/src/components/auth/SignInArrivalOverlay";
import { AuthBootProvider, useAuthBoot } from "@/src/contexts/AuthBootContext";
import { CurtainLiftProvider } from "@/src/contexts/CurtainLiftContext";
import { SignInArrivalProvider, useSignInArrival } from "@/src/contexts/SignInArrivalContext";
import { useAuthDeepLink } from "@/src/hooks/useAuthDeepLink";
import { useAuthAccess } from "@/src/hooks/useAuthAccess";
import { useEmailVerifiedCelebration } from "@/src/hooks/useEmailVerifiedCelebration";
import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { mergeCelebrationState } from "@/src/navigation/mergeCelebrationState";
import { resolveAuthenticatedDestination } from "@/src/navigation/resolveAuthenticatedDestination";
import type { SignInArrivalReadiness } from "@/src/navigation/resolveSignInArrivalDestination";
import { clearCelebrationSessionComplete } from "@/src/services/onboarding/emailVerifiedCelebrationStorage";
import { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { reloadAuthOnce } from "@/src/services/auth/authReloadCoordinator";
import { isAnonymousAuthUser, signOutCurrentUser } from "@/src/services/firebase/auth";
import { hideAppSplashOnce } from "@/src/services/splash/hideAppSplashOnce";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { usePostHogIdentify } from "@/src/hooks/usePostHogIdentify";
import { useRodProgressionSync } from "@/src/hooks/useRodProgressionSync";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { UserDoc, type DeletionStatus } from "@/src/services/firebase/types";
import { configureRevenueCat } from "@/src/services/revenuecat/client";
import { Sentry } from "@/src/services/sentry/init";
import {
  hydrateAuthInitPhase,
  isSanctuaryInitialized,
  resetAuthInitStore,
  setSanctuaryInitializedFromRemote,
  subscribeAuthInit,
} from "@/src/state/authInitStore";

SplashScreen.preventAutoHideAsync();

type RootLayoutShellProps = {
  fontsLoaded: boolean;
  authState: {
    uid: string | null;
    email: string | null;
    emailVerified: boolean;
    ready: boolean;
  };
  sanctuaryInitialized: boolean;
  authAccessReady: boolean;
  deletionStatus: DeletionStatus;
  celebration: ReturnType<typeof useEmailVerifiedCelebration>;
  narrativeOnboarding: ReturnType<typeof useNarrativeOnboarding>;
};

function RootLayoutShell({
  fontsLoaded,
  authState,
  sanctuaryInitialized,
  authAccessReady,
  deletionStatus,
  celebration,
  narrativeOnboarding,
}: RootLayoutShellProps) {
  const { gateUnlockedThisSession, completeColdStartBoot } = useAuthBoot();

  const signInArrivalReadiness = useMemo<SignInArrivalReadiness>(
    () => ({
      uid: authState.uid,
      emailVerified: authState.emailVerified,
      sanctuaryInitialized,
      authReady: authState.ready,
      authAccessReady,
      celebration: {
        ready: celebration.ready,
        hasCompleted: celebration.hasCompleted,
      },
      narrative: {
        ready: narrativeOnboarding.ready,
        needsArchetype: narrativeOnboarding.needsArchetype,
        needsBirthDate: narrativeOnboarding.needsBirthDate,
        needsNarrative: narrativeOnboarding.needsNarrative,
      },
      syncNarrativeNeeds: getSyncNarrativeNeeds(),
      gateUnlockedThisSession,
      deletionStatus,
    }),
    [
      authAccessReady,
      authState.emailVerified,
      authState.ready,
      authState.uid,
      celebration.hasCompleted,
      celebration.ready,
      deletionStatus,
      gateUnlockedThisSession,
      narrativeOnboarding.needsArchetype,
      narrativeOnboarding.needsBirthDate,
      narrativeOnboarding.needsNarrative,
      narrativeOnboarding.ready,
      sanctuaryInitialized,
    ],
  );

  return (
    <CurtainLiftProvider>
      <SignInArrivalProvider
        readiness={signInArrivalReadiness}
        completeColdStartBoot={completeColdStartBoot}
      >
        <RootLayoutShellInner
          fontsLoaded={fontsLoaded}
          authState={authState}
          sanctuaryInitialized={sanctuaryInitialized}
          authAccessReady={authAccessReady}
          deletionStatus={deletionStatus}
          celebration={celebration}
          narrativeOnboarding={narrativeOnboarding}
        />
      </SignInArrivalProvider>
    </CurtainLiftProvider>
  );
}

function RootLayoutShellInner({
  authState,
  sanctuaryInitialized,
  authAccessReady,
  deletionStatus,
  celebration,
  narrativeOnboarding,
}: RootLayoutShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const navigationInFlightRef = useRef(false);
  const {
    authInitializing,
    showBootOverlay,
    hasCompletedColdStartBoot,
    gateUnlockedThisSession,
    completeColdStartBoot,
  } = useAuthBoot();
  const { active: signInArrivalActive } = useSignInArrival();

  useEffect(() => {
    navigationInFlightRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (showBootOverlay) return;
    void hideAppSplashOnce();
  }, [showBootOverlay]);

  useEffect(() => {
    if (signInArrivalActive) return;
    if (authInitializing) return;
    if (!authState.ready) return;
    if (authState.uid && !authAccessReady) return;

    const mergedCelebration = mergeCelebrationState(authState.uid, celebration);

    const destination = resolveAuthenticatedDestination({
      uid: authState.uid,
      emailVerified: authState.emailVerified,
      sanctuaryInitialized,
      pathname,
      narrative: {
        ready: narrativeOnboarding.ready,
        needsArchetype: narrativeOnboarding.needsArchetype,
        needsBirthDate: narrativeOnboarding.needsBirthDate,
        needsNarrative: narrativeOnboarding.needsNarrative,
      },
      syncNarrativeNeeds: getSyncNarrativeNeeds(),
      celebration: mergedCelebration,
      gateUnlockedThisSession,
      deletionStatus,
    });

    if (!destination) {
      if (!hasCompletedColdStartBoot) {
        completeColdStartBoot();
      }
      return;
    }
    if (navigationInFlightRef.current) return;
    if (pathname === destination) {
      if (!hasCompletedColdStartBoot) {
        completeColdStartBoot();
      }
      return;
    }

    navigationInFlightRef.current = true;
    router.replace(destination);
    if (!hasCompletedColdStartBoot) {
      completeColdStartBoot();
    }
  }, [
    authAccessReady,
    authInitializing,
    authState.emailVerified,
    authState.ready,
    authState.uid,
    celebration.hasCompleted,
    celebration.ready,
    completeColdStartBoot,
    deletionStatus,
    gateUnlockedThisSession,
    hasCompletedColdStartBoot,
    narrativeOnboarding.needsArchetype,
    narrativeOnboarding.needsBirthDate,
    narrativeOnboarding.needsNarrative,
    narrativeOnboarding.ready,
    pathname,
    router,
    sanctuaryInitialized,
    signInArrivalActive,
  ]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="narrative-onboarding" />
          <Stack.Screen
            name="well"
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(modals)"
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
        </Stack>
        {showBootOverlay && !signInArrivalActive ? (
          <View
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 1000 }}
          >
            <AuthBootScreen />
          </View>
        ) : null}
        <SignInArrivalOverlay />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayout() {
  const initialUser = firebaseAuth.currentUser;
  const [authState, setAuthState] = useState<{
    uid: string | null;
    email: string | null;
    emailVerified: boolean;
    ready: boolean;
  }>(() => ({
    uid: isAnonymousAuthUser(initialUser) ? null : (initialUser?.uid ?? null),
    email: isAnonymousAuthUser(initialUser) ? null : (initialUser?.email ?? null),
    emailVerified: isAnonymousAuthUser(initialUser) ? false : (initialUser?.emailVerified ?? false),
    ready: false,
  }));
  const authAccess = useAuthAccess({
    uid: authState.uid,
    emailVerified: authState.emailVerified,
  });
  const celebration = useEmailVerifiedCelebration(authState.uid, authState.emailVerified);
  const narrativeOnboarding = useNarrativeOnboarding();
  const [sanctuaryInitialized, setSanctuaryInitialized] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>("active");
  const storeSanctuaryInitialized = useSyncExternalStore(
    subscribeAuthInit,
    isSanctuaryInitialized,
    () => false,
  );
  const effectiveSanctuaryInitialized = sanctuaryInitialized || storeSanctuaryInitialized;

  useOfflineSync(authState.uid, effectiveSanctuaryInitialized);
  useRodProgressionSync(authState.uid, effectiveSanctuaryInitialized);
  usePostHogIdentify(authState.uid, effectiveSanctuaryInitialized);
  useAuthDeepLink();

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CrustaceansSignatureDemo: require("@/assets/fonts/Crustaceans-SignatureDEMO-Regular.otf"),
  });

  useEffect(() => {
    if (authState.uid) {
      Sentry.setUser({ id: authState.uid });
    } else {
      Sentry.setUser(null);
    }
  }, [authState.uid]);

  useEffect(() => {
    if (isAnonymousAuthUser(firebaseAuth.currentUser)) {
      void signOutCurrentUser();
    }
    const missing = assertRequiredEnv();
    if (missing.length > 0) {
      console.warn(`Missing app config keys: ${missing.join(", ")}`);
    }
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (isAnonymousAuthUser(user)) {
        void signOutCurrentUser();
        clearCelebrationSessionComplete();
        setAuthState({
          uid: null,
          email: null,
          emailVerified: false,
          ready: true,
        });
        void configureRevenueCat(undefined);
        return;
      }

      if (!user) {
        clearCelebrationSessionComplete();
        resetAuthInitStore();
        setSanctuaryInitialized(false);
        setDeletionStatus("active");
      }
      setAuthState({
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        ready: true,
      });
      void configureRevenueCat(user?.uid);
      if (user) {
        void hydrateAuthInitPhase(user.uid);
        void (async () => {
          try {
            const snap = await getDoc(doc(firestore, "users", user.uid));
            if (snap.exists()) {
              const data = snap.data() as UserDoc;
              const initialized = data.authFunnel?.sanctuaryInitialized === true;
              setSanctuaryInitialized(initialized);
              setDeletionStatus(data.deletionStatus ?? "active");
              if (initialized) {
                setSanctuaryInitializedFromRemote(true);
              }
              narrativeOnboarding.hydrateFromRemote({
                childArchetype: data.childArchetype,
                childBirthDate: data.childBirthDate,
                hasCompletedDay1Narrative: data.hasCompletedDay1Narrative,
                narrativeProgress: data.narrativeProgress,
              });
            } else {
              setSanctuaryInitialized(false);
              setDeletionStatus("active");
            }
          } catch (err) {
            console.warn("[narrative hydrate] failed to load user profile", err);
            Sentry.captureException(err, {
              tags: { area: "app_shell", flow: "narrative_hydrate" },
            });
          }
        })();
      }
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        const user = await reloadAuthOnce();
        if (isAnonymousAuthUser(user)) {
          await signOutCurrentUser();
          setAuthState((prev) => ({
            uid: null,
            email: null,
            emailVerified: false,
            ready: prev.ready,
          }));
          setSanctuaryInitialized(false);
          return;
        }
        setAuthState((prev) => ({
          uid: user?.uid ?? null,
          email: user?.email ?? null,
          emailVerified: user?.emailVerified ?? false,
          ready: prev.ready,
        }));
      })();
    });
    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!authState.uid) {
      setSanctuaryInitialized(false);
      setDeletionStatus("active");
      return;
    }

    const userRef = doc(firestore, "users", authState.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) {
        setSanctuaryInitialized(false);
        setDeletionStatus("active");
        return;
      }
      const data = snap.data() as UserDoc;
      const initialized = data.authFunnel?.sanctuaryInitialized === true;
      setSanctuaryInitialized(initialized);
      setDeletionStatus(data.deletionStatus ?? "active");
      if (initialized) {
        setSanctuaryInitializedFromRemote(true);
      }
    });

    return () => unsub();
  }, [authState.uid]);

  const syncNarrativeNeeds = getSyncNarrativeNeeds();
  const narrativeGateReady =
    authState.uid === null || narrativeOnboarding.ready || syncNarrativeNeeds != null;

  return (
    <AuthBootProvider
      fontsLoaded={fontsLoaded}
      authReady={authState.ready}
      uid={authState.uid}
      emailVerified={authState.emailVerified}
      narrativeGateReady={narrativeGateReady}
    >
      <RootLayoutShell
        fontsLoaded={fontsLoaded}
        authState={authState}
        sanctuaryInitialized={effectiveSanctuaryInitialized}
        authAccessReady={authAccess.ready}
        deletionStatus={deletionStatus}
        celebration={celebration}
        narrativeOnboarding={narrativeOnboarding}
      />
    </AuthBootProvider>
  );
}

export default Sentry.wrap(RootLayout);
