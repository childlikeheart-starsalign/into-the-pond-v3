import { usePathname } from "expo-router";
import { useCallback, useSyncExternalStore } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { SanctuaryTabBarOverlay } from "@/src/components/sanctuary/SanctuaryTabBarOverlay";
import { useCurtainLiftOptional } from "@/src/contexts/CurtainLiftContext";
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
 * Persistent frame-aligned tab bar for all main tabs — single mount avoids
 * strip/icon flicker when switching Sanctuary ↔ Journal and other tabs.
 */
export function IllustratedTabBar() {
  const pathname = usePathname();
  const frame = usePortrait916Layout("contain");
  const activeTab = activeTabFromPath(pathname);
  const curtain = useCurtainLiftOptional();
  const classroomView = useSyncExternalStore(
    subscribeClassroomView,
    getClassroomView,
    getClassroomView,
  );

  const handleStripLoad = useCallback(() => {
    curtain?.reportLayerLoad("tabStrip");
  }, [curtain]);

  if (!activeTab) {
    return null;
  }

  if (activeTab === "classroom" && classroomView === "menu") {
    return null;
  }

  if (frame.width <= 0 || frame.height <= 0) {
    return null;
  }

  const frameStyle = {
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
  };

  const overlay = (
    <SanctuaryTabBarOverlay
      frameHeight={frame.height}
      onStripLoad={curtain?.active ? handleStripLoad : undefined}
    />
  );

  const useCurtainFade = curtain?.active && activeTab === "sanctuary";

  if (useCurtainFade) {
    return (
      <Animated.View
        style={[styles.frameHost, frameStyle, { opacity: curtain.sanctuaryRevealOpacity }]}
        pointerEvents="box-none"
      >
        {overlay}
      </Animated.View>
    );
  }

  return (
    <View style={[styles.frameHost, frameStyle]} pointerEvents="box-none">
      {overlay}
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
