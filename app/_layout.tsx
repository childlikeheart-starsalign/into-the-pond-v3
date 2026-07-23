import "react-native-reanimated";
import "@/src/services/sentry/init";
import "@/src/services/analytics/initAnalytics";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { assertRequiredEnv } from "@/src/config/env";
import { AuthBootScreen } from "@/src/components/auth/AuthBootScreen";
import { SignInArrivalOverlay } from "@/src/components/auth/SignInArrivalOverlay";
import { AuthBootProvider, useAuthBoot } from "@/src/contexts/AuthBootContext";
import {
  EveningPondSessionController,
  EveningPondSessionProvider,
} from "@/src/contexts/EveningPondSessionContext";
import { CurtainLiftProvider } from "@/src/contexts/CurtainLiftContext";
import { SignInArrivalProvider, useSignInArrival } from "@/src/contexts/SignInArrivalContext";
import { useAuthDeepLink } from "@/src/hooks/useAuthDeepLink";
import { useAuthAccess } from "@/src/hooks/useAuthAccess";
import { useEmailVerifiedCelebration } from "@/src/hooks/useEmailVerifiedCelebration";
import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { mergeCelebrationState } from "@/src/navigation/mergeCelebrationState";
import { resolveNewOnboardingRouting } from "@/src/navigation/newOnboardingRouting";
import { resolveAuthenticatedDestination } from "@/src/navigation/resolveAuthenticatedDestination";
import type { SignInArrivalReadiness } from "@/src/navigation/resolveSignInArrivalDestination";
import {
  CHILD_PROFILE_FLAG_NAMES,
  useChildProfileFeatureFlags,
} from "@/src/features/childProfile/featureFlags";
import { useActiveChild } from "@/src/features/childProfile/useActiveChild";
import { clearCelebrationSessionComplete } from "@/src/services/onboarding/emailVerifiedCelebrationStorage";
import { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { reloadAuthOnce } from "@/src/services/auth/authReloadCoordinator";
import { isAnonymousAuthUser, signOutCurrentUser } from "@/src/services/firebase/auth";
import {
  clearFeatureFlagsSession,
  hydrateSessionFeatureFlags,
} from "@/src/services/featureFlags/sessionFlags";
import { hideAppSplashOnce } from "@/src/services/splash/hideAppSplashOnce";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { usePostHogIdentify } from "@/src/hooks/usePostHogIdentify";
import { useRodProgressionSync } from "@/src/hooks/useRodProgressionSync";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { UserDoc, type DeletionStatus } from "@/src/services/firebase/types";
import { requestSubscriptionSync } from "@/src/services/firebase/serverActions";
import {
  ensureRevenueCatConfigured,
  getSubscriptionStatus,
  syncRevenueCatIdentity,
} from "@/src/services/revenuecat/client";
import { Sentry } from "@/src/services/sentry/init";
import {
  hydrateAuthInitPhase,
  isSanctuaryInitialized,
  resetAuthInitStore,
  setSanctuaryInitializedFromRemote,
  subscribeAuthInit,
} from "@/src/state/authInitStore";

SplashScreen.preventAutoHideAsync();

ensureRevenueCatConfigured();

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
  prologueOnboarding: {
    ready: boolean;
    hasCompletedPrologueOnboarding: boolean;
    hasCompletedDay1Narrative: boolean;
  };
};

function RootLayoutShell({
  fontsLoaded,
  authState,
  sanctuaryInitialized,
  authAccessReady,
  deletionStatus,
  celebration,
  narrativeOnboarding,
  prologueOnboarding,
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
          prologueOnboarding={prologueOnboarding}
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
  prologueOnboarding,
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
  const activeChild = useActiveChild();
  const childProfileFlags = useChildProfileFeatureFlags();

  const { legacyComplete, needsContinuation } = resolveNewOnboardingRouting({
    newOnboardingEnabled: childProfileFlags.newOnboardingEnabled,
    hasCompletedDay1Narrative: prologueOnboarding.hasCompletedDay1Narrative,
    hasCompletedPrologueOnboarding: prologueOnboarding.hasCompletedPrologueOnboarding,
    existingChildCount: activeChild.ready ? activeChild.childrenSummary.length : 0,
  });

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
      childProfile: {
        flagEnabled: childProfileFlags.createChildProfileUi,
        ready: !authState.uid || activeChild.ready,
        needsCreate:
          childProfileFlags.createChildProfileUi &&
          activeChild.ready &&
          activeChild.childrenSummary.length === 0 &&
          // When new onboarding owns first-run child creation, skip Flag B route.
          !needsContinuation,
      },
      newOnboarding: {
        flagEnabled: childProfileFlags.newOnboardingEnabled,
        ready: !authState.uid || prologueOnboarding.ready,
        needsContinuation,
        legacyComplete,
      },
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
    activeChild.ready,
    activeChild.childrenSummary.length,
    childProfileFlags.createChildProfileUi,
    childProfileFlags.newOnboardingEnabled,
    prologueOnboarding.ready,
    prologueOnboarding.hasCompletedDay1Narrative,
    prologueOnboarding.hasCompletedPrologueOnboarding,
  ]);

  return (
    <EveningPondSessionProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="prologue" />
            <Stack.Screen name="prologue-continuation" />
            <Stack.Screen name="child-profile-limit" />
            <Stack.Screen name="narrative-onboarding" />
            <Stack.Screen
              name="well"
              options={{
                presentation: "fullScreenModal",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="craft"
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
          <EveningPondSessionController uid={authState.uid} pathname={pathname} />
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
    </EveningPondSessionProvider>
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
  const [prologueOnboarding, setPrologueOnboarding] = useState({
    ready: false,
    hasCompletedPrologueOnboarding: false,
    hasCompletedDay1Narrative: false,
  });
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

  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CrustaceansSignatureDemo: require("@/assets/fonts/Crustaceans-SignatureDEMO-Regular.otf"),
  });

  useEffect(() => {
    if (fontError) {
      console.warn("[fonts] Failed to load app fonts; continuing without blocking boot", fontError);
    }
  }, [fontError]);

  const fontsReady = fontsLoaded || fontError != null;

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
        void syncRevenueCatIdentity(null);
        return;
      }

      if (!user) {
        clearCelebrationSessionComplete();
        resetAuthInitStore();
        setSanctuaryInitialized(false);
        setDeletionStatus("active");
        clearFeatureFlagsSession();
        setPrologueOnboarding({
          ready: true,
          hasCompletedPrologueOnboarding: false,
          hasCompletedDay1Narrative: false,
        });
      }
      setAuthState({
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        ready: true,
      });
      void syncRevenueCatIdentity(user?.uid ?? null);
      if (user) {
        void hydrateAuthInitPhase(user.uid);
        void (async () => {
          try {
            // Piggyback flag reads with the existing launch user-doc fetch (parallel, one UI gate).
            const [snap] = await Promise.all([
              getDoc(doc(firestore, "users", user.uid)),
              hydrateSessionFeatureFlags(user.uid, [
                CHILD_PROFILE_FLAG_NAMES.childMigrationDualRead,
                CHILD_PROFILE_FLAG_NAMES.createChildProfileUi,
                CHILD_PROFILE_FLAG_NAMES.newOnboardingEnabled,
                CHILD_PROFILE_FLAG_NAMES.childResultPeek,
                CHILD_PROFILE_FLAG_NAMES.catalogRarityRingUi,
              ]),
            ]);
            if (snap.exists()) {
              const data = snap.data() as UserDoc;
              const initialized = data.authFunnel?.sanctuaryInitialized === true;
              setSanctuaryInitialized(initialized);
              setDeletionStatus(data.deletionStatus ?? "active");
              setPrologueOnboarding({
                ready: true,
                hasCompletedPrologueOnboarding: data.hasCompletedPrologueOnboarding === true,
                hasCompletedDay1Narrative: data.hasCompletedDay1Narrative === true,
              });
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
              setPrologueOnboarding({
                ready: true,
                hasCompletedPrologueOnboarding: false,
                hasCompletedDay1Narrative: false,
              });
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
        if (user?.uid && (Platform.OS === "ios" || Platform.OS === "android")) {
          void getSubscriptionStatus();
          void requestSubscriptionSync(user.uid).catch((err) => {
            Sentry.captureException(err, {
              tags: { area: "revenuecat", flow: "foreground_sync" },
            });
          });
        }
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
      setPrologueOnboarding({
        ready: true,
        hasCompletedPrologueOnboarding: false,
        hasCompletedDay1Narrative: false,
      });
      return;
    }

    const userRef = doc(firestore, "users", authState.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setSanctuaryInitialized(false);
          setDeletionStatus("active");
          setPrologueOnboarding({
            ready: true,
            hasCompletedPrologueOnboarding: false,
            hasCompletedDay1Narrative: false,
          });
          return;
        }
        const data = snap.data() as UserDoc;
        const initialized = data.authFunnel?.sanctuaryInitialized === true;
        setSanctuaryInitialized(initialized);
        setDeletionStatus(data.deletionStatus ?? "active");
        setPrologueOnboarding({
          ready: true,
          hasCompletedPrologueOnboarding: data.hasCompletedPrologueOnboarding === true,
          hasCompletedDay1Narrative: data.hasCompletedDay1Narrative === true,
        });
        if (initialized) {
          setSanctuaryInitializedFromRemote(true);
        }
      },
      (error) => {
        console.warn("[RootLayout] user snapshot failed", error);
        Sentry.captureException(error, {
          tags: { area: "firebase", flow: "root_user_snapshot" },
        });
      },
    );

    return () => unsub();
  }, [authState.uid]);

  const syncNarrativeNeeds = getSyncNarrativeNeeds();
  const narrativeGateReady =
    authState.uid === null || narrativeOnboarding.ready || syncNarrativeNeeds != null;

  return (
    <AuthBootProvider
      fontsLoaded={fontsReady}
      authReady={authState.ready}
      uid={authState.uid}
      emailVerified={authState.emailVerified}
      narrativeGateReady={narrativeGateReady}
    >
      <RootLayoutShell
        fontsLoaded={fontsReady}
        authState={authState}
        sanctuaryInitialized={effectiveSanctuaryInitialized}
        authAccessReady={authAccess.ready}
        deletionStatus={deletionStatus}
        celebration={celebration}
        narrativeOnboarding={narrativeOnboarding}
        prologueOnboarding={prologueOnboarding}
      />
    </AuthBootProvider>
  );
}

export default Sentry.wrap(RootLayout);
