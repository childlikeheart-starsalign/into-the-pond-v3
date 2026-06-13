import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { TAB_SCREEN_BOTTOM_PADDING } from "@/src/constants/tabScreenLayout";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { AccountFooter } from "@/src/features/gate/components/AccountFooter";
import { CurrentAccessCard } from "@/src/features/gate/components/CurrentAccessCard";
import { GateBackgroundLayer } from "@/src/features/gate/components/GateBackgroundLayer";
import { PricingCard } from "@/src/features/gate/components/PricingCard";
import { StickyCurrentTierHeader } from "@/src/features/gate/components/StickyCurrentTierHeader";
import { useGateViewModels } from "@/src/features/gate/buildGateViewModels";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import { GateLayoutDebugProvider } from "@/src/features/gate/gateLayoutDebug";
import type { GateEntitlementContext } from "@/src/features/gate/types";
import {
  useGateTiersConfig,
  useRecommendedTierId,
  useUnavailableTierIds,
} from "@/src/features/gate/useGateTiers";
import { useRevenueCatCustomerInfo } from "@/src/hooks/useRevenueCatCustomerInfo";
import { routes } from "@/src/navigation/routes";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  DEFAULT_SUBSCRIPTION_STATE,
  subscribeToUserSubscription,
  toDerivedSubscriptionState,
} from "@/src/services/firebase/entitlements";
import { signOutCurrentUser } from "@/src/services/firebase/auth";
import { LogicalProductId, LOGICAL_PRODUCTS } from "@/src/services/iap/catalog";
import { runPurchase, runRestore } from "@/src/services/iap/purchaseFlow";
import { listPackagesByProductId } from "@/src/services/revenuecat/client";

const isNativeStore = Platform.OS === "ios" || Platform.OS === "android";
const STICKY_THRESHOLD_PX = 8;

export function GateScreen() {
  const insets = useSafeAreaInsets();
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const config = useGateTiersConfig();
  const recommendedTierId = useRecommendedTierId(config);
  const unavailableTierIds = useUnavailableTierIds(config);

  const [subscription, setSubscription] = useState(
    toDerivedSubscriptionState(DEFAULT_SUBSCRIPTION_STATE),
  );
  const [storeAvailability, setStoreAvailability] = useState<
    Partial<Record<LogicalProductId, boolean>>
  >({});
  const [busyProductId, setBusyProductId] = useState<LogicalProductId | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [currentAccessHeight, setCurrentAccessHeight] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [layoutDebug, setLayoutDebug] = useState(false);
  const titleTapCountRef = useRef(0);
  const titleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { customerInfo } = useRevenueCatCustomerInfo(!!uid && isNativeStore);

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserSubscription(uid, setSubscription);
  }, [uid]);

  useEffect(() => {
    if (!isNativeStore) return;
    let mounted = true;
    void (async () => {
      const packages = await listPackagesByProductId();
      if (!mounted) return;
      const availability: Partial<Record<LogicalProductId, boolean>> = {};
      for (const product of LOGICAL_PRODUCTS) {
        availability[product.id] = packages.has(product.id);
      }
      setStoreAvailability(availability);
    })();
    return () => {
      mounted = false;
    };
  }, [customerInfo]);

  const entitlementContext: GateEntitlementContext = useMemo(
    () => ({
      subscriptionStatus: subscription.subscriptionStatus,
      isLifetime: subscription.isLifetime,
      hasPaidRod: subscription.hasPaidRod,
      recommendedTierId,
      unavailableTierIds,
      storeAvailability,
    }),
    [recommendedTierId, storeAvailability, subscription, unavailableTierIds],
  );

  const { currentAccess, pricingCards } = useGateViewModels(config, entitlementContext);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const shouldStick = y > currentAccessHeight - STICKY_THRESHOLD_PX;
      setShowStickyHeader((prev) => (prev === shouldStick ? prev : shouldStick));
    },
    [currentAccessHeight],
  );

  const handlePurchase = useCallback(async (productId: LogicalProductId) => {
    setBusyProductId(productId);
    setStatusMessage(null);
    const result = await runPurchase(productId);
    setStatusMessage(result.message);
    setBusyProductId(null);
  }, []);

  const handleRestore = useCallback(async () => {
    if (!uid) return;
    setIsRestoring(true);
    setStatusMessage(null);
    const result = await runRestore(LOGICAL_PRODUCTS[0].id);
    setStatusMessage(result.message);
    setIsRestoring(false);
  }, [uid]);

  const handleTitlePress = useCallback(() => {
    if (!__DEV__) return;
    titleTapCountRef.current += 1;
    if (titleTapTimerRef.current) clearTimeout(titleTapTimerRef.current);
    titleTapTimerRef.current = setTimeout(() => {
      titleTapCountRef.current = 0;
    }, 600);
    if (titleTapCountRef.current >= 3) {
      titleTapCountRef.current = 0;
      setLayoutDebug((prev) => !prev);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOutCurrentUser();
      router.replace(routes.login);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <GateLayoutDebugProvider value={layoutDebug}>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <Portrait916Frame mode="contain">
          <GateBackgroundLayer />

          <StickyCurrentTierHeader
            visible={showStickyHeader}
            activeTierLabel={currentAccess.activeTierLabel}
          />

          <ScrollView
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + spacing.section,
                paddingBottom: TAB_SCREEN_BOTTOM_PADDING + spacing.section,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={handleTitlePress}
              accessibilityRole="header"
              accessibilityLabel={translateGateCopy(config.screenTitleKey)}
            >
              <Text style={styles.screenTitle}>{translateGateCopy(config.screenTitleKey)}</Text>
            </Pressable>

            {__DEV__ && layoutDebug ? (
              <Text style={styles.debugHint}>Layout debug on — triple-tap title to hide</Text>
            ) : null}

            <CurrentAccessCard
              model={currentAccess}
              onLayout={(height) => setCurrentAccessHeight(height)}
            />

            <View style={styles.pricingStack}>
              {pricingCards.map((card) => (
                <PricingCard
                  key={card.tier.id}
                  model={card}
                  busyProductId={busyProductId}
                  onPurchaseMonthly={(productId) => void handlePurchase(productId)}
                  onPurchaseLifetime={(productId) => void handlePurchase(productId)}
                />
              ))}
            </View>

            {statusMessage ? (
              <Text style={styles.status} accessibilityLiveRegion="polite">
                {statusMessage}
              </Text>
            ) : null}

            <AccountFooter
              accountId={uid}
              signingOut={signingOut}
              restoring={isRestoring}
              onSignOut={() => void handleSignOut()}
              onRestore={() => void handleRestore()}
            />
          </ScrollView>
        </Portrait916Frame>
      </View>
    </GateLayoutDebugProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.inner,
    gap: spacing.section,
  },
  screenTitle: {
    fontFamily: fontFamilies.gateTitle,
    fontSize: 26,
    letterSpacing: -0.52,
    color: colors.textPrimary,
    textAlign: "center",
  },
  pricingStack: {
    gap: spacing.section,
  },
  status: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugHint: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.secondary,
    textAlign: "center",
  },
});
