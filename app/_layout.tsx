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
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { assertRequiredEnv } from "@/src/config/env";
import { useAuthDeepLink } from "@/src/hooks/useAuthDeepLink";
import { routes } from "@/src/navigation/routes";
import { reloadCurrentUser } from "@/src/services/firebase/auth";
import { ensureUserProfileDocument } from "@/src/services/firebase/ensureUserProfile";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { firebaseAuth } from "@/src/services/firebase/client";
import { configureRevenueCat } from "@/src/services/revenuecat/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<{
    uid: string | null;
    emailVerified: boolean;
    ready: boolean;
  }>({
    uid: firebaseAuth.currentUser?.uid ?? null,
    emailVerified: firebaseAuth.currentUser?.emailVerified ?? false,
    ready: false,
  });
  const [guardProcessing, setGuardProcessing] = useState(true);
  useOfflineSync(authState.uid);
  useAuthDeepLink();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
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
        emailVerified: user?.emailVerified ?? false,
        ready: true,
      });
      void configureRevenueCat(user?.uid);
      setGuardProcessing(false);
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        await reloadCurrentUser();
        const user = firebaseAuth.currentUser;
        setAuthState((prev) => ({
          uid: user?.uid ?? null,
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
  // Runs in the background — never blocks navigation.
  useEffect(() => {
    if (!authState.ready || !authState.uid) return;
    const user = firebaseAuth.currentUser;
    if (!user) return;
    void ensureUserProfileDocument(user).catch((error) => {
      console.warn("[ensureUserProfile] failed", error);
    });
  }, [authState.ready, authState.uid]);

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

    if (!authState.uid) {
      if (!isAuthRoute) router.replace(routes.login);
      return;
    }

    if (!authState.emailVerified) {
      if (!isAuthActionRoute && pathname !== routes.verifyRequired) {
        router.replace(routes.verifyRequired);
      }
      return;
    }

    if (isAuthRoute) {
      router.replace(routes.sanctuary);
    }
  }, [
    authState.emailVerified,
    authState.ready,
    authState.uid,
    fontsLoaded,
    guardProcessing,
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
