import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { assertRequiredEnv } from "@/src/config/env";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";
import { firebaseAuth } from "@/src/services/firebase/client";
import { configureRevenueCat } from "@/src/services/revenuecat/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  useOfflineSync(uid);

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
      setUid(user?.uid ?? null);
      void configureRevenueCat(user?.uid);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
