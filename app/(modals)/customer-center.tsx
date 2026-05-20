import { router } from "expo-router";
import { View } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";

import { syncSubscriptionWithBackendAfterPurchase } from "@/src/services/iap/purchaseFlow";

/** Embedded Customer Center — use this route when `presentCustomerCenter()` fails inside another modal. */
export default function CustomerCenterModalScreen() {
  return (
    <View style={{ flex: 1 }}>
      <RevenueCatUI.CustomerCenterView
        style={{ flex: 1 }}
        shouldShowCloseButton
        onDismiss={() => router.back()}
        onRestoreCompleted={() => {
          void syncSubscriptionWithBackendAfterPurchase().catch(() => undefined);
        }}
        onPromotionalOfferSucceeded={() => {
          void syncSubscriptionWithBackendAfterPurchase().catch(() => undefined);
        }}
      />
    </View>
  );
}
