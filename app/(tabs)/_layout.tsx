import { Tabs } from "expo-router";
import { View } from "react-native";

import { IllustratedTabBar } from "@/src/components/navigation/IllustratedTabBar";
import { TutorialManager } from "@/src/components/tutorial/TutorialManager";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="net" options={{ title: "Fish collection" }} />
        <Tabs.Screen name="classroom" options={{ title: "Classroom" }} />
        <Tabs.Screen name="sanctuary" options={{ title: "Sanctuary" }} />
        <Tabs.Screen name="store" options={{ title: "Store" }} />
        <Tabs.Screen name="gate" options={{ title: "Gate" }} />
        <Tabs.Screen name="folio" options={{ href: null }} />
      </Tabs>
      <IllustratedTabBar />
      <TutorialManager />
    </View>
  );
}
