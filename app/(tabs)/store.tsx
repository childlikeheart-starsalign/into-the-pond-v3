import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ILLUSTRATED_TAB_BAR_HEIGHT } from "@/src/constants/illustratedTabBar";
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
          <Text style={layout.muted}>Store inventory UI will connect to RevenueCat and Firestore.</Text>
          <Pressable
            accessibilityRole="button"
            style={[layout.btnPrimary, styles.cta]}
            onPress={() => router.push(routes.customerCenter)}
          >
            <Text style={layout.btnPrimaryText}>Manage subscription</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.inner,
    paddingBottom: ILLUSTRATED_TAB_BAR_HEIGHT + spacing.section,
  },
  content: {
    gap: spacing.section,
    paddingTop: spacing.section,
  },
  cta: {
    marginTop: spacing.inner,
  },
});
