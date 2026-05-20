import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { layout, spacing } from "@/src/constants/theme";

/** Well of Questions — modal landmark */
export default function WellModalScreen() {
  return (
    <SafeAreaView style={[layout.screen, { paddingHorizontal: spacing.inner }]}>
      <View
        style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: spacing.inner }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Well"
          style={[layout.btnSecondary, { minHeight: 48, paddingHorizontal: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={layout.btnSecondaryText}>Close</Text>
        </Pressable>
      </View>
      <View style={{ gap: spacing.section }}>
        <Text style={layout.screenTitle}>Well of Questions</Text>
        <Text style={layout.subtitle}>
          Ask the pond what you need—daily limits and Wonder rewards apply when this flow is
          connected to the server.
        </Text>
        <View style={layout.card}>
          <Text style={layout.muted}>
            Placeholder: question prompts and submission will live here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
