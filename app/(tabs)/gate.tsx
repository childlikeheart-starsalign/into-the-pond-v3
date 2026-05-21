import { router } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TAB_SCREEN_BOTTOM_PADDING } from "@/src/constants/tabScreenLayout";
import { colors, layout, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";
import { firebaseAuth } from "@/src/services/firebase/client";
import { requestCastClaim } from "@/src/services/firebase/castClaim";
import { MARKETING_TIER_NAME } from "@/src/services/classroom/gating";
import {
  DEFAULT_SUBSCRIPTION_STATE,
  subscribeToUserSubscription,
  toDerivedSubscriptionState,
} from "@/src/services/firebase/entitlements";
import { signOutCurrentUser } from "@/src/services/firebase/auth";
import { resetNarrativeOnboarding } from "@/src/services/onboarding/narrativeOnboardingStorage";

import { useRevenueCatCustomerInfo } from "@/src/hooks/useRevenueCatCustomerInfo";
import { LogicalProductId, LOGICAL_PRODUCTS, PRODUCT_IDS } from "@/src/services/iap/catalog";
import { runPurchase, runRestore } from "@/src/services/iap/purchaseFlow";
import {
  getActiveEntitlementIds,
  hasIntoThePondProEntitlement,
  listPackagesByProductId,
} from "@/src/services/revenuecat/client";
import {
  presentIntoThePondPaywall,
  presentIntoThePondPaywallIfNeeded,
  refreshCustomerInfoBestEffort,
} from "@/src/services/revenuecat/paywall";

const isNativeStore = Platform.OS === "ios" || Platform.OS === "android";

/** Membership (store) + settings — includes sign out */
export default function GateScreen() {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const [busyProductId, setBusyProductId] = useState<LogicalProductId | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready.");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResettingNarrative, setIsResettingNarrative] = useState(false);
  const [isCheckingGate, setIsCheckingGate] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [storeAvailability, setStoreAvailability] = useState<Record<string, boolean>>({});
  const [subscription, setSubscription] = useState(
    toDerivedSubscriptionState(DEFAULT_SUBSCRIPTION_STATE),
  );
  const [paywallBusy, setPaywallBusy] = useState(false);
  const { customerInfo } = useRevenueCatCustomerInfo(!!uid && isNativeStore);

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

  const handlePaywall = async () => {
    setPaywallBusy(true);
    setStatusMessage("Opening paywall...");
    const result = await presentIntoThePondPaywall();
    setStatusMessage(result.message);
    await refreshCustomerInfoBestEffort();
    setPaywallBusy(false);
  };

  const handlePaywallIfNeeded = async () => {
    setPaywallBusy(true);
    const result = await presentIntoThePondPaywallIfNeeded();
    setStatusMessage(result.message);
    await refreshCustomerInfoBestEffort();
    setPaywallBusy(false);
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

  const handleResetNarrative = useCallback(async () => {
    setIsResettingNarrative(true);
    try {
      const uid = firebaseAuth.currentUser?.uid ?? null;
      await resetNarrativeOnboarding(uid);
      setStatusMessage("Day 1 narrative reset. Starting from the beginning.");
      router.replace(routes.narrativeOnboarding);
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsResettingNarrative(false);
    }
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutCurrentUser();
      router.replace(routes.login);
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        layout.screen,
        { paddingHorizontal: spacing.inner, paddingBottom: TAB_SCREEN_BOTTOM_PADDING },
      ]}
    >
      <ScrollView
        contentContainerStyle={{ gap: spacing.section, paddingVertical: spacing.section }}
      >
        <View style={{ gap: spacing.inner }}>
          <Text style={layout.screenTitle}>Gate</Text>
          <Text style={layout.subtitle}>Membership, purchases, and account settings.</Text>
        </View>

        <View style={layout.card}>
          <Text
            style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}
          >
            Account
          </Text>
          <Text style={layout.muted}>{uid ? `Signed in as: ${uid}` : "Not signed in"}</Text>
          <Pressable
            style={[layout.btnSecondary, signingOut && { opacity: 0.6 }]}
            onPress={() => void handleSignOut()}
            disabled={signingOut || !uid}
          >
            <Text style={layout.btnSecondaryText}>
              {signingOut ? "Signing out..." : "Sign out"}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: spacing.inner }}>
          <Text style={[layout.screenTitle, { fontSize: 20 }]}>Store</Text>
          <Text style={layout.subtitle}>
            Choose a rod plan or unlock lifetime access. Subscription state syncs from Firestore in
            real time.
          </Text>
        </View>

        <View style={layout.card}>
          <Text
            style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}
          >
            Current Access
          </Text>
          <Text style={layout.subtitle}>{subscriptionSummary}</Text>
          <Text style={layout.muted}>
            Into the Pond Pro (SDK):{" "}
            {!isNativeStore
              ? "N/A on web"
              : customerInfo
                ? hasIntoThePondProEntitlement(customerInfo)
                  ? "active"
                  : "not active"
                : "loading…"}
          </Text>
          <Text style={layout.muted}>
            RevenueCat active entitlements:{" "}
            {!isNativeStore
              ? "N/A on web"
              : customerInfo
                ? getActiveEntitlementIds(customerInfo).join(", ") || "none"
                : "—"}
          </Text>
          <Text style={layout.muted}>
            Unlock lessons 1.4-5.6 with Wooden or Fiberglass membership.
          </Text>
          <Text style={layout.muted}>{statusMessage}</Text>
        </View>

        {isNativeStore ? (
          <View style={layout.card}>
            <Text
              style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}
            >
              RevenueCat Paywall & Customer Center
            </Text>
            <Text style={layout.muted}>
              Paywalls use your current offering from the RevenueCat dashboard. Requires a
              development or production build (not Expo Go).
            </Text>
            <Pressable
              style={[layout.btnPrimary, (!uid || paywallBusy) && { opacity: 0.6 }]}
              onPress={() => void handlePaywall()}
              disabled={!uid || paywallBusy}
            >
              <Text style={layout.btnPrimaryText}>
                {paywallBusy ? "Opening..." : "Show Paywall"}
              </Text>
            </Pressable>
            <Pressable
              style={[layout.btnSecondary, (!uid || paywallBusy) && { opacity: 0.6 }]}
              onPress={() => void handlePaywallIfNeeded()}
              disabled={!uid || paywallBusy}
            >
              <Text style={layout.btnSecondaryText}>Show Paywall If Needed (Pro)</Text>
            </Pressable>
            <Pressable
              style={[layout.btnSecondary, !uid && { opacity: 0.6 }]}
              onPress={() => {
                router.push(routes.customerCenter);
              }}
              disabled={!uid}
            >
              <Text style={layout.btnSecondaryText}>Customer Center (embedded)</Text>
            </Pressable>
          </View>
        ) : (
          <View style={layout.card}>
            <Text style={layout.muted}>
              RevenueCat paywall and IAP are available on iOS and Android builds only.
            </Text>
          </View>
        )}

        {LOGICAL_PRODUCTS.map((product) => {
          const isBusy = busyProductId === product.id;
          const isAvailable = storeAvailability[product.id] ?? false;
          const label =
            product.type === "subscription" ? "Monthly Subscription" : "One-time Purchase";
          return (
            <View key={product.id} style={[layout.card, { borderColor: colors.primarySoft }]}>
              <Text style={[layout.screenTitle, { fontSize: 20 }]}>{product.title}</Text>
              <Text style={layout.subtitle}>{product.description}</Text>
              <Text style={layout.muted}>{label}</Text>
              <Text
                style={[layout.subtitle, { color: colors.textPrimary }]}
              >{`HKD ${product.priceHkd}`}</Text>
              <Text style={layout.muted}>
                {isAvailable
                  ? `Store ID: ${product.id}`
                  : `Not available in current offering (${product.id})`}
              </Text>
              {subscription.subscriptionStatus === "wooden" &&
              product.id === PRODUCT_IDS.tier2Monthly ? (
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
          <Text
            style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}
          >
            Already subscribed?
          </Text>
          <Pressable
            style={[layout.btnSecondary, (!uid || isRestoring) && { opacity: 0.6 }]}
            onPress={() => void handleRestore()}
            disabled={!uid || isRestoring}
          >
            <Text style={layout.btnSecondaryText}>
              {isRestoring ? "Restoring..." : "Restore Purchases"}
            </Text>
          </Pressable>
          <Pressable
            style={[layout.btnSecondary, (!uid || isCheckingGate) && { opacity: 0.6 }]}
            onPress={() => void handleGateCheck()}
            disabled={!uid || isCheckingGate}
          >
            <Text style={layout.btnSecondaryText}>
              {isCheckingGate ? "Checking..." : "Test Server Gate"}
            </Text>
          </Pressable>
        </View>

        <View style={layout.card}>
          <Text
            style={[layout.muted, { fontFamily: "Inter_600SemiBold", color: colors.textPrimary }]}
          >
            Developer tools
          </Text>
          <Pressable
            style={[layout.btnSecondary, isResettingNarrative && { opacity: 0.6 }]}
            onPress={() => void handleResetNarrative()}
            disabled={isResettingNarrative}
          >
            <Text style={layout.btnSecondaryText}>
              {isResettingNarrative ? "Resetting..." : "Reset Day 1 Narrative"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
