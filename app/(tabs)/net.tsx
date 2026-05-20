import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TAB_SCREEN_BOTTOM_PADDING } from "@/src/constants/tabScreenLayout";
import { layout, spacing } from "@/src/constants/theme";

/** Creatures collection — Net placeholder */
export default function NetScreen() {
  return (
    <SafeAreaView
      style={[
        layout.screen,
        { paddingHorizontal: spacing.inner, paddingBottom: TAB_SCREEN_BOTTOM_PADDING },
      ]}
    >
      <View style={{ gap: spacing.section, paddingTop: spacing.section }}>
        <Text style={layout.screenTitle}>Net</Text>
        <Text style={layout.subtitle}>
          Creatures you have met and caught will appear here, synced when you are online.
        </Text>
        <View style={layout.card}>
          <Text style={layout.muted}>
            Local cache: use WatermelonDB creatures table for offline viewing.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
