import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ILLUSTRATED_TAB_BAR_HEIGHT,
  ILLUSTRATED_TABS,
  type IllustratedTabId,
} from "@/src/constants/illustratedTabBar";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { routes } from "@/src/navigation/routes";

const TAB_ROUTES: Record<IllustratedTabId, (typeof routes)[keyof typeof routes]> = {
  net: routes.net,
  classroom: routes.classroom,
  sanctuary: routes.sanctuary,
  store: routes.store,
  gate: routes.gate,
};

function activeTabFromPath(pathname: string): IllustratedTabId | null {
  if (pathname.includes("/net")) return "net";
  if (pathname.includes("/classroom")) return "classroom";
  if (pathname.includes("/sanctuary")) return "sanctuary";
  if (pathname.includes("/store")) return "store";
  if (pathname.includes("/gate")) return "gate";
  return null;
}

/**
 * Invisible tap targets over the illustrated bottom tab bar in sanctuary art.
 * Replaces the native Expo tab bar.
 */
export function IllustratedTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const frame = usePortrait916Layout();
  const activeTab = activeTabFromPath(pathname);
  const onSanctuary = activeTab === "sanctuary";
  const frameBottomInset = Math.max(0, windowHeight - frame.top - frame.height);

  return (
    <View
      style={[
        styles.bar,
        {
          height: ILLUSTRATED_TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        onSanctuary
          ? {
              left: frame.left,
              width: frame.width,
              bottom: frameBottomInset,
            }
          : null,
        !onSanctuary && styles.barOffSanctuary,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {ILLUSTRATED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              style={[styles.slot, { flex: tab.widthShare }]}
              onPress={() => router.replace(TAB_ROUTES[tab.id])}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  barOffSanctuary: {
    backgroundColor: "rgba(250,247,242,0.92)",
    borderTopWidth: 1,
    borderTopColor: "#E8DDD3",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    height: ILLUSTRATED_TAB_BAR_HEIGHT,
  },
  slot: {
    minHeight: 48,
  },
});
