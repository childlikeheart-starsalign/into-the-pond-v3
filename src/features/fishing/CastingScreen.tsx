import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { getSanctuaryBackground } from "@/src/constants/sanctuaryAssets";
import { colors, fontFamilies } from "@/src/constants/theme";
import { getRodById } from "@/src/features/fishing/fishingData";
import { useSanctuaryTimeOfDay } from "@/src/hooks/useSanctuaryTimeOfDay";
import { routes } from "@/src/navigation/routes";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function CastingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rodId?: string; baitId?: string }>();
  const timeOfDay = useSanctuaryTimeOfDay();
  const backgroundSource = getSanctuaryBackground(timeOfDay);
  const selectedRod = getRodById(firstParam(params.rodId));

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Portrait916Frame mode="contain">
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          accessibilityLabel={`Fishing in the sanctuary, ${timeOfDay}`}
        >
          <View style={styles.castLayer} pointerEvents="none">
            <Image
              source={selectedRod.asset}
              style={styles.castRod}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.castLine} />
          </View>

          <View style={styles.indicator}>
            <Text style={styles.label}>Waiting for a bite...</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reel in and return to sanctuary"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.replace(routes.sanctuary)}
          >
            <Text style={styles.backLabel}>← Reel in</Text>
          </Pressable>
        </ImageBackground>
      </Portrait916Frame>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  background: {
    flex: 1,
  },
  castLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  castRod: {
    position: "absolute",
    left: "55%",
    bottom: "18%",
    width: "30%",
    height: "24%",
    transform: [{ rotate: "-24deg" }],
  },
  castLine: {
    position: "absolute",
    left: "48%",
    bottom: "25%",
    width: 1,
    height: "20%",
    backgroundColor: "rgba(31, 26, 23, 0.45)",
    transform: [{ rotate: "28deg" }],
  },
  indicator: {
    position: "absolute",
    bottom: "17%",
    alignSelf: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.headingRegular,
    fontSize: 18,
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    paddingHorizontal: 14,
  },
  backLabel: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
