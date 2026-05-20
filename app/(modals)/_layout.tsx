import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";

import { routes } from "@/src/navigation/routes";
import { subscribeToAuthState } from "@/src/services/firebase/auth";

export default function ModalsLayout() {
  const [session, setSession] = useState<{ uid: string | null; ready: boolean }>(() => ({
    uid: null,
    ready: false,
  }));

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setSession({ uid: user?.uid ?? null, ready: true });
    });
    return unsub;
  }, []);

  if (!session.ready) {
    return null;
  }

  if (!session.uid) {
    return <Redirect href={routes.login} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="well" />
      <Stack.Screen name="craft" />
      <Stack.Screen name="customer-center" />
    </Stack>
  );
}
