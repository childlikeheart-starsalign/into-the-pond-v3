import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { layout, spacing } from "@/src/constants/theme";

/** Craft Bench — modal landmark */
export default function CraftModalScreen() {
  return (
    <SafeAreaView style={[layout.screen, { paddingHorizontal: spacing.inner }]}>
      <View
        style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: spacing.inner }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Craft Bench"
          style={[layout.btnSecondary, { minHeight: 48, paddingHorizontal: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={layout.btnSecondaryText}>Close</Text>
        </Pressable>
      </View>
      <View style={{ gap: spacing.section }}>
        <Text style={layout.screenTitle}>Craft Bench</Text>
        <Text style={layout.subtitle}>
          Combine materials and prepare bait—gameplay hooks will attach here.
        </Text>
        <View style={layout.card}>
          <Text style={layout.muted}>
            Placeholder: crafting recipes and inventory actions will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
