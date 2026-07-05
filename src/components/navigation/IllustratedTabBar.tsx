import { usePathname } from "expo-router";
import { useSyncExternalStore } from "react";
import { StyleSheet, View } from "react-native";

import { SanctuaryTabBarOverlay } from "@/src/components/sanctuary/SanctuaryTabBarOverlay";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { getClassroomView, subscribeClassroomView } from "@/src/state/classroomView";

function activeTabFromPath(pathname: string): string | null {
  if (pathname.includes("/net")) return "net";
  if (pathname.includes("/classroom")) return "classroom";
  if (pathname.includes("/sanctuary")) return "sanctuary";
  if (pathname.includes("/store")) return "store";
  if (pathname.includes("/gate")) return "gate";
  return null;
}

/**
 * Frame-aligned sanctuary tab bar for off-sanctuary tab screens.
 * Sanctuary embeds nav in its artboard; all other tabs use this overlay.
 */
export function IllustratedTabBar() {
  const pathname = usePathname();
  const frame = usePortrait916Layout("contain");
  const activeTab = activeTabFromPath(pathname);
  const classroomView = useSyncExternalStore(
    subscribeClassroomView,
    getClassroomView,
    getClassroomView,
  );
  const onSanctuary = activeTab === "sanctuary";

  if (onSanctuary) {
    return null;
  }

  if (activeTab === "classroom" && classroomView === "menu") {
    return null;
  }

  if (frame.width <= 0 || frame.height <= 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.frameHost,
        {
          left: frame.left,
          top: frame.top,
          width: frame.width,
          height: frame.height,
        },
      ]}
      pointerEvents="box-none"
    >
      <SanctuaryTabBarOverlay frameHeight={frame.height} />
    </View>
  );
}

const styles = StyleSheet.create({
  frameHost: {
    position: "absolute",
    zIndex: 100,
    elevation: 8,
  },
});
