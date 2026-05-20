import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { layout, spacing } from "@/src/constants/theme";

/** Diary reflections — Folio view placeholder */
export default function FolioScreen() {
  return (
    <SafeAreaView style={[layout.screen, { paddingHorizontal: spacing.inner }]}>
      <View style={{ gap: spacing.section, paddingTop: spacing.section }}>
        <Text style={layout.screenTitle}>Folio</Text>
        <Text style={layout.subtitle}>
          Your diary entries and lesson reflections will appear here, including offline drafts.
        </Text>
        <View style={layout.card}>
          <Text style={layout.muted}>Queued submissions retry when you are back online.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
