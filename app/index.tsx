import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout, spacing } from "@/src/constants/theme";
import { firebaseAuth } from "@/src/services/firebase/client";
import { requestCastClaim } from "@/src/services/firebase/castClaim";
import { MARKETING_TIER_NAME } from "@/src/services/classroom/gating";
import {
  DEFAULT_SUBSCRIPTION_STATE,
  subscribeToUserSubscription,
  toDerivedSubscriptionState,
} from "@/src/services/firebase/entitlements";
import { LogicalProductId, LOGICAL_PRODUCTS, PRODUCT_IDS } from "@/src/services/iap/catalog";
import { runPurchase, runRestore } from "@/src/services/iap/purchaseFlow";
import { listPackagesByProductId } from "@/src/services/revenuecat/client";

export default function HomeScreen() {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const [busyProductId, setBusyProductId] = useState<LogicalProductId | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCheckingGate, setIsCheckingGate] = useState(false);
  const [storeAvailability, setStoreAvailability] = useState<Record<string, boolean>>({});
  const [subscription, setSubscription] = useState(toDerivedSubscriptionState(DEFAULT_SUBSCRIPTION_STATE));

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserSubscription(uid, setSubscription);
  }, [uid]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const packages = await listPackagesByProductId();
      if (!mounted) return;
      const availability: Record<string, boolean> = {};
      for (const product of LOGICAL_PRODUCTS) {
        availability[product.id] = packages.has(product.id);
      }
      setStoreAvailability(availability);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const subscriptionSummary = useMemo(() => {
    if (subscription.isLifetime) return "Lifetime active";
    if (subscription.hasPaidRod) {
      return `${MARKETING_TIER_NAME[subscription.subscriptionStatus]} active`;
    }
    return `${MARKETING_TIER_NAME.free} (free)`;
  }, [subscription]);

  const handlePurchase = async (productId: LogicalProductId) => {
    setBusyProductId(productId);
    setStatusMessage("Starting purchase...");
    const result = await runPurchase(productId);
    setStatusMessage(result.message);
    setBusyProductId(null);
  };

  const handleRestore = async () => {
    if (!uid) {
      setStatusMessage("Please sign in to restore purchases.");
      return;
    }
    setIsRestoring(true);
    setStatusMessage("Restoring purchases...");
    const result = await runRestore(PRODUCT_IDS.tier1Monthly);
    setStatusMessage(result.message);
    setIsRestoring(false);
  };

  const handleGateCheck = async () => {
    setIsCheckingGate(true);
    try {
      const result = await requestCastClaim();
      setStatusMessage(result.message ?? "Server gate check passed.");
    } catch (error) {
      setStatusMessage(String(error));
    } finally {
      setIsCheckingGate(false);
    }
  };

  return (
    <SafeAreaView style={[layout.screen, { paddingHorizontal: spacing.inner }]}>
      <ScrollView contentContainerStyle={{ gap: spacing.section, paddingVertical: spacing.section }}>
        <View style={{ gap: spacing.inner }}>
          <Text style={layout.screenTitle}>Store</Text>
          <Text style={layout.subtitle}>
            Choose a rod plan or unlock lifetime access. Subscription state syncs from Firestore in real time.
          </Text>
        </View>

        <View style={layout.card}>
          <Text style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}>Current Access</Text>
          <Text style={layout.subtitle}>{subscriptionSummary}</Text>
          <Text style={layout.muted}>Unlock lessons 1.4-5.6 with Wooden or Fiberglass membership.</Text>
          <Text style={layout.muted}>{statusMessage}</Text>
          <Text style={layout.muted}>
            {uid ? `Signed in as: ${uid}` : "Sign in required before purchases can be verified."}
          </Text>
        </View>

        {LOGICAL_PRODUCTS.map((product) => {
          const isBusy = busyProductId === product.id;
          const isAvailable = storeAvailability[product.id] ?? false;
          const label = product.type === "subscription" ? "Monthly Subscription" : "One-time Purchase";
          return (
            <View key={product.id} style={[layout.card, { borderColor: colors.primarySoft }]}>
              <Text style={[layout.screenTitle, { fontSize: 20 }]}>{product.title}</Text>
              <Text style={layout.subtitle}>{product.description}</Text>
              <Text style={layout.muted}>{label}</Text>
              <Text style={[layout.subtitle, { color: colors.textPrimary }]}>{`HKD ${product.priceHkd}`}</Text>
              <Text style={layout.muted}>
                {isAvailable ? `Store ID: ${product.id}` : `Not available in current offering (${product.id})`}
              </Text>
              {subscription.subscriptionStatus === "wooden" && product.id === PRODUCT_IDS.tier2Monthly ? (
                <Text style={layout.muted}>Upgrade to Tier 2 for premium gameplay benefits.</Text>
              ) : null}
              <Pressable
                style={[layout.btnPrimary, (!uid || isBusy || !isAvailable) && { opacity: 0.6 }]}
                onPress={() => void handlePurchase(product.id)}
                disabled={!uid || isBusy || !isAvailable}
              >
                <Text style={layout.btnPrimaryText}>{isBusy ? "Processing..." : "Purchase"}</Text>
              </Pressable>
            </View>
          );
        })}

        <View style={layout.card}>
          <Text style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}>Already subscribed?</Text>
          <Pressable
            style={[layout.btnSecondary, (!uid || isRestoring) && { opacity: 0.6 }]}
            onPress={() => void handleRestore()}
            disabled={!uid || isRestoring}
          >
            <Text style={layout.btnSecondaryText}>{isRestoring ? "Restoring..." : "Restore Purchases"}</Text>
          </Pressable>
          <Pressable
            style={[layout.btnSecondary, (!uid || isCheckingGate) && { opacity: 0.6 }]}
            onPress={() => void handleGateCheck()}
            disabled={!uid || isCheckingGate}
          >
            <Text style={layout.btnSecondaryText}>{isCheckingGate ? "Checking..." : "Test Server Gate"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
