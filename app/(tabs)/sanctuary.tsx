import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { SanctuaryScreen } from "@/src/components/sanctuary";
import {
  SANCTUARY_TIME_OF_DAY_ORDER,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { layout, spacing } from "@/src/constants/theme";
import { getUnseenBloom, markBloomArrivalSeen } from "@/src/features/sanctuary/cultivationStorage";
import { useSanctuaryCultivation } from "@/src/hooks/useSanctuaryCultivation";
import { routes } from "@/src/navigation/routes";
import { signInAnonymouslyUser, subscribeToAuthState } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  getPendingArrivalBloomId,
  setPendingArrivalBloomId,
  setSanctuaryCultivationState,
} from "@/src/state/sanctuaryCultivation";
import { setSanctuaryTimeOfDay } from "@/src/state/sanctuaryTimeOfDay";

/** Garden — asset-driven sanctuary with time-of-day backgrounds and pose-cycling avatar. */
export default function SanctuaryTabScreen() {
  const [timeOfDay, setTimeOfDay] = useState<SanctuaryTimeOfDay>("afternoon");
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [arrivalBloomId, setArrivalBloomId] = useState<string | null>(null);
  const { cultivation, reload } = useSanctuaryCultivation();

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (uid === null) {
      setShowOnboarding(true);
    }
  }, [uid]);

  useEffect(() => {
    setSanctuaryTimeOfDay(timeOfDay);
  }, [timeOfDay]);

  useFocusEffect(
    useCallback(() => {
      void reload()
        .then((loaded) => {
          const pending = getPendingArrivalBloomId();
          if (pending) {
            setArrivalBloomId(pending);
            return;
          }
          const unseen = getUnseenBloom(loaded);
          setArrivalBloomId(unseen?.id ?? null);
        })
        .catch((error) => {
          console.warn("[Sanctuary] failed to reload cultivation", error);
          setArrivalBloomId(null);
        });
    }, [reload]),
  );

  const handleBloomArrivalComplete = useCallback(async (bloomId: string) => {
    const next = await markBloomArrivalSeen(bloomId);
    setSanctuaryCultivationState(next);
    setPendingArrivalBloomId(null);
    setArrivalBloomId(null);
  }, []);

  const cycleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => {
      const idx = SANCTUARY_TIME_OF_DAY_ORDER.indexOf(prev);
      const next = SANCTUARY_TIME_OF_DAY_ORDER[(idx + 1) % SANCTUARY_TIME_OF_DAY_ORDER.length];
      return next;
    });
  }, []);

  const openWell = () => {
    if (!uid) return;
    router.push(routes.well);
  };

  const openCraft = () => {
    if (!uid) return;
    router.push(routes.craft);
  };

  return (
    <>
      <SanctuaryScreen
        timeOfDay={timeOfDay}
        cultivation={cultivation}
        arrivalBloomId={arrivalBloomId}
        onBloomArrivalComplete={handleBloomArrivalComplete}
        onWellPress={openWell}
        onCraftPress={openCraft}
        wellDisabled={!uid}
        craftDisabled={!uid}
        onDevCycleTimeOfDay={cycleTimeOfDay}
      />

      <Modal
        visible={showOnboarding}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOnboarding(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={layout.screenTitle}>Welcome to the garden</Text>
            <Text style={layout.subtitle}>
              Would you like to continue as a guest, or sign in to save your wonders?
            </Text>

            <Pressable
              accessibilityRole="button"
              style={layout.btnPrimary}
              onPress={async () => {
                try {
                  await signInAnonymouslyUser();
                  setShowOnboarding(false);
                } catch {
                  // best-effort; user can retry
                }
              }}
            >
              <Text style={layout.btnPrimaryText}>Continue as guest</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={layout.btnSecondary}
              onPress={() => {
                setShowOnboarding(false);
                router.push(routes.login);
              }}
            >
              <Text style={layout.btnSecondaryText}>Sign in / Sign up</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(31,26,23,0.25)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.section + 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.inner,
  },
});
