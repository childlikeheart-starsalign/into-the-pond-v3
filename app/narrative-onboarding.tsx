import { useRouter } from "expo-router";
import { View } from "react-native";

import { routes } from "@/src/navigation/routes";
import { NarrativeOnboardingScreen } from "@/src/screens/Narrative/NarrativeOnboardingScreen";

export default function NarrativeOnboardingRoute() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <NarrativeOnboardingScreen onComplete={() => router.replace(routes.sanctuary)} />
    </View>
  );
}
