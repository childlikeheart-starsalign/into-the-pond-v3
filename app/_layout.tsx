import "react-native-reanimated";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { assertRequiredEnv } from "@/src/config/env";
import { useAuthDeepLink } from "@/src/hooks/useAuthDeepLink";
import { useAuthAccess } from "@/src/hooks/useAuthAccess";
import { useNarrativeOnboarding } from "@/src/hooks/useNarrativeOnboarding";
import { routes } from "@/src/navigation/routes";
import { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { reloadCurrentUser } from "@/src/services/firebase/auth";
import { ensureUserProfileDocument } from "@/src/services/firebase/ensureUserProfile";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { UserDoc } from "@/src/services/firebase/types";
import { configureRevenueCat } from "@/src/services/revenuecat/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<{
    uid: string | null;
    email: string | null;
    emailVerified: boolean;
    ready: boolean;
  }>({
    uid: firebaseAuth.currentUser?.uid ?? null,
    email: firebaseAuth.currentUser?.email ?? null,
    emailVerified: firebaseAuth.currentUser?.emailVerified ?? false,
    ready: false,
  });
  const [guardProcessing, setGuardProcessing] = useState(true);
  const authAccess = useAuthAccess({
    uid: authState.uid,
    email: authState.email,
    emailVerified: authState.emailVerified,
  });
  const narrativeOnboarding = useNarrativeOnboarding();
  useOfflineSync(authState.uid);
  useAuthDeepLink();

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    CrustaceansSignatureDemo: require("@/assets/fonts/Crustaceans-SignatureDEMO-Regular.otf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    let cancelled = false;
    void (async () => {
      if (!cancelled) await SplashScreen.hideAsync();
    })();
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded]);

  useEffect(() => {
    const missing = assertRequiredEnv();
    if (missing.length > 0) {
      console.warn(`Missing app config keys: ${missing.join(", ")}`);
    }
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setAuthState({
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        emailVerified: user?.emailVerified ?? false,
        ready: true,
      });
      void configureRevenueCat(user?.uid);
      setGuardProcessing(false);
      if (user) {
        void (async () => {
          try {
            const snap = await getDoc(doc(firestore, "users", user.uid));
            if (snap.exists()) {
              const data = snap.data() as UserDoc;
              narrativeOnboarding.hydrateFromRemote({
                childArchetype: data.childArchetype,
                hasCompletedDay1Narrative: data.hasCompletedDay1Narrative,
                narrativeProgress: data.narrativeProgress,
              });
            }
          } catch (err) {
            console.warn("[narrative hydrate] failed to load user profile", err);
          }
        })();
      }
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        await reloadCurrentUser();
        const user = firebaseAuth.currentUser;
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

  // Idempotent: create users/{uid} with defaults if missing.
  // Deferred until email is verified or user already has a Firestore profile (legacy bypass).
  useEffect(() => {
    if (!authState.ready || !authState.uid) return;
    if (!authAccess.ready) return;
    if (!authState.emailVerified && !authAccess.hasExistingProfile) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;
    void ensureUserProfileDocument(user).catch((error) => {
      console.warn("[ensureUserProfile] failed", error);
    });
  }, [
    authAccess.hasExistingProfile,
    authAccess.ready,
    authState.emailVerified,
    authState.ready,
    authState.uid,
  ]);

  useEffect(() => {
    if (!fontsLoaded || guardProcessing) return;
    if (!authState.ready) return;
    const isAuthRoute =
      pathname === "/" ||
      pathname === routes.login ||
      pathname === routes.signup ||
      pathname === routes.forgotPassword ||
      pathname === routes.resetPassword ||
      pathname === routes.finishEmail ||
      pathname === routes.verifyRequired;
    const isAuthActionRoute = pathname === routes.finishEmail || pathname === routes.resetPassword;
    const isNarrativeRoute = pathname === routes.narrativeOnboarding;

    if (!authState.uid) {
      if (!isAuthRoute) router.replace(routes.login);
      return;
    }

    if (!authAccess.ready) {
      return;
    }

    if (!authAccess.canAccessMainApp) {
      if (!isAuthActionRoute && pathname !== routes.verifyRequired) {
        router.replace(routes.verifyRequired);
      }
      return;
    }

    // Allowed in — never remain on verify-required once access is resolved.
    if (pathname === routes.verifyRequired) {
      const syncNarrativeNeeds = getSyncNarrativeNeeds();
      const needsArchetype =
        syncNarrativeNeeds?.needsArchetype ?? narrativeOnboarding.needsArchetype;
      const needsNarrative =
        syncNarrativeNeeds?.needsNarrative ?? narrativeOnboarding.needsNarrative;

      if (!narrativeOnboarding.ready && !syncNarrativeNeeds) {
        router.replace(routes.sanctuary);
        return;
      }
      if (needsArchetype || needsNarrative) {
        router.replace(routes.narrativeOnboarding);
        return;
      }
      router.replace(routes.sanctuary);
      return;
    }

    const syncNarrativeNeeds = getSyncNarrativeNeeds();
    const needsArchetype = syncNarrativeNeeds?.needsArchetype ?? narrativeOnboarding.needsArchetype;
    const needsNarrative = syncNarrativeNeeds?.needsNarrative ?? narrativeOnboarding.needsNarrative;

    // Wait for narrative state before routing elsewhere.
    if (!narrativeOnboarding.ready && !syncNarrativeNeeds) return;

    if (needsArchetype || needsNarrative) {
      if (!isNarrativeRoute) router.replace(routes.narrativeOnboarding);
      return;
    }

    // Narrative complete (or not needed): redirect out of auth/narrative routes.
    if (isAuthRoute || isNarrativeRoute) {
      router.replace(routes.sanctuary);
    }
  }, [
    authAccess.canAccessMainApp,
    authAccess.ready,
    authState.ready,
    authState.uid,
    fontsLoaded,
    guardProcessing,
    narrativeOnboarding.needsArchetype,
    narrativeOnboarding.needsNarrative,
    narrativeOnboarding.ready,
    pathname,
    router,
  ]);

  if (!fontsLoaded || guardProcessing) {
    return null;
  }

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
            name="(modals)"
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
