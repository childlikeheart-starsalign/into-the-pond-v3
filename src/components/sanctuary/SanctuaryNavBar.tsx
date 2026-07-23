import { usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from "react-native";

import { SANCTUARY_NAV_TABS, type SanctuaryNavTab } from "@/src/constants/sanctuaryAssets";
import { NAV_ICON_LAYOUT } from "@/src/constants/sanctuaryNavLayout";
import { routes } from "@/src/navigation/routes";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

const TAB_ROUTES = {
  net: routes.net,
  classroom: routes.classroom,
  sanctuary: routes.sanctuary,
  store: routes.store,
  gate: routes.gate,
} as const;

function activeTabFromPath(pathname: string): SanctuaryNavTab["id"] | null {
  if (pathname.includes("/net")) return "net";
  if (pathname.includes("/classroom")) return "classroom";
  if (pathname.includes("/sanctuary")) return "sanctuary";
  if (pathname.includes("/store")) return "store";
  if (pathname.includes("/gate")) return "gate";
  return null;
}

type NavIconButtonProps = {
  tab: SanctuaryNavTab;
  isActive: boolean;
  embedded: boolean;
  onPress: () => void;
};

function NavIconButton({ tab, isActive, embedded, onPress }: NavIconButtonProps) {
  const source: ImageSourcePropType = isActive ? tab.icons.active : tab.icons.default;
  const position = NAV_ICON_LAYOUT[tab.id];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slot,
        {
          left: position.centerX,
          bottom: position.centerBottom,
        },
        pressed && styles.slotPressed,
        isActive && !embedded && styles.slotActive,
      ]}
    >
      {!embedded ? (
        <Image
          source={source}
          style={[styles.icon, isActive ? styles.iconActive : styles.iconInactive]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </Pressable>
  );
}

/**
 * Bottom navigation row aligned to the sanctuary artboard parchment bar.
 * Renders icon PNGs over the parchment bar and keeps the full slot tappable.
 */
export function SanctuaryNavBar({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = activeTabFromPath(pathname);

  const navigate = useCallback(
    (id: SanctuaryNavTab["id"]) => {
      if (id !== activeTab) {
        playPaperClick();
      }
      router.replace(TAB_ROUTES[id]);
    },
    [router, activeTab],
  );

  return (
    <View style={styles.bar} pointerEvents="box-none">
      {SANCTUARY_NAV_TABS.map((tab) => (
        <NavIconButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          embedded={embedded}
          onPress={() => navigate(tab.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  slot: {
    position: "absolute",
    width: 72,
    height: 72,
    marginLeft: -36,
    marginBottom: -36,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  slotPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  slotActive: {
    opacity: 1,
  },
  icon: {
    width: 52,
    height: 52,
  },
  iconActive: {
    opacity: 1,
  },
  iconInactive: {
    opacity: 0.55,
  },
});
