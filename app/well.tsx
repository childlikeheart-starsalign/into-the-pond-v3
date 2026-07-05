import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import {
  mergeWellChildBirthDate,
  shouldShowWellBirthDateGate,
} from "@/src/features/well/resolveWellChildBirthDate";
import { WellModalContent } from "@/src/features/well/WellModalContent";
import { useChildBirthDate } from "@/src/hooks/useChildBirthDate";
import { ChildBirthDateStep } from "@/src/screens/Narrative/ChildBirthDateStep";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import { getNarrativeOnboardingState } from "@/src/services/onboarding/narrativeOnboardingStorage";
import type { UserDoc } from "@/src/services/firebase/types";

/** Well of Questions — full-screen modal landmark */
export default function WellModalScreen() {
  const { setBirthDate } = useChildBirthDate();
  const gateCompletedRef = useRef<string | null>(null);

  const [localBirthDate, setLocalBirthDate] = useState<string | null>(null);
  const [remoteBirthDate, setRemoteBirthDate] = useState<string | null | undefined>(undefined);
  const [sessionBirthDate, setSessionBirthDate] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getNarrativeOnboardingState().then((state) => {
      if (cancelled) return;
      setLocalBirthDate(state.childBirthDate);
      setLocalReady(true);
    });

    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      setRemoteBirthDate(null);
      setRemoteReady(true);
      return () => {
        cancelled = true;
      };
    }

    const ref = doc(firestore, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        const data = snap.data() as UserDoc | undefined;
        const remote = data?.childBirthDate ?? null;
        setRemoteBirthDate((prev) => {
          if (remote) return remote;
          if (gateCompletedRef.current) return gateCompletedRef.current;
          if (prev) return prev;
          return null;
        });
        setRemoteReady(true);
      },
      () => {
        if (cancelled) return;
        setRemoteReady(true);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const childBirthDate = useMemo(
    () =>
      mergeWellChildBirthDate({
        local: localBirthDate,
        remote: remoteBirthDate,
        sessionConfirmed: sessionBirthDate,
      }),
    [localBirthDate, remoteBirthDate, sessionBirthDate],
  );

  const profileReady = localReady && remoteReady;
  const gateCompletedInSession = sessionBirthDate != null || gateCompletedRef.current != null;
  const showBirthDateGate = shouldShowWellBirthDateGate(
    profileReady,
    childBirthDate,
    gateCompletedInSession,
  );

  if (!profileReady) {
    return <View style={{ flex: 1 }} />;
  }

  if (showBirthDateGate) {
    return (
      <ChildBirthDateStep
        variant="well_gate"
        onClose={() => router.back()}
        onSubmit={async (month, year) => {
          const result = await setBirthDate(month, year);
          if (!result.ok) {
            throw new Error(result.error);
          }
          gateCompletedRef.current = result.isoDate;
          setSessionBirthDate(result.isoDate);
          setLocalBirthDate(result.isoDate);
          setRemoteBirthDate(result.isoDate);
        }}
      />
    );
  }

  return <WellModalContent onClose={() => router.back()} />;
}
