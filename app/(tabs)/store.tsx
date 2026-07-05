import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { TAB_SCREEN_BOTTOM_PADDING } from "@/src/constants/tabScreenLayout";
import { layout, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";

/** Store — shop and subscriptions */
export default function StoreScreen() {
  return (
    <SafeAreaView style={[layout.screen, styles.screen]}>
      <View style={styles.content}>
        <Text style={layout.screenTitle}>Store</Text>
        <Text style={layout.subtitle}>
          Browse bait, materials, and pond passes. Purchases sync when you are online.
        </Text>
        <View style={layout.card}>
          <Text style={layout.muted}>
            Store inventory UI will connect to RevenueCat and Firestore.
          </Text>
          <PrimaryButton
            label="Manage subscription"
            accessibilityLabel="Manage subscription"
            style={styles.cta}
            onPress={() => router.push(routes.customerCenter)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.inner,
    paddingBottom: TAB_SCREEN_BOTTOM_PADDING + spacing.section,
  },
  content: {
    gap: spacing.section,
    paddingTop: spacing.section,
  },
  cta: {
    marginTop: spacing.inner,
  },
});
