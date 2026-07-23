import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";

import { routes } from "@/src/navigation/routes";
import { isAnonymousAuthUser, subscribeToAuthState } from "@/src/services/firebase/auth";

export default function ModalsLayout() {
  const [session, setSession] = useState<{ uid: string | null; ready: boolean }>(() => ({
    uid: null,
    ready: false,
  }));

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      const signedIn = user != null && !isAnonymousAuthUser(user);
      setSession({ uid: signedIn ? user.uid : null, ready: true });
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
      <Stack.Screen name="child-atlas" />
      <Stack.Screen name="practice-moment" />
      <Stack.Screen name="customer-center" />
    </Stack>
  );
}
