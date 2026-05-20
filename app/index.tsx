import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";

import { media } from "@/src/constants/media";
import { routes } from "@/src/navigation/routes";

const STORAGE_KEY = "gate.keyBox.v1";

/**
 * Gate screen: tap anywhere to animate the key, then enter Sanctuary.
 * Long press logs tap coordinates to help calibrate key placement.
 */
export default function GateScreen() {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Calibration values for the animated key overlay.
  const [keyBox, setKeyBox] = useState({
    leftPct: 22,
    topPct: 46,
    width: 90,
    height: 50,
  });

  useEffect(() => {
    if (!__DEV__) return;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as {
          leftPct?: number;
          topPct?: number;
          width?: number;
          height?: number;
        };
        if (
          typeof parsed.leftPct === "number" &&
          typeof parsed.topPct === "number" &&
          typeof parsed.width === "number" &&
          typeof parsed.height === "number"
        ) {
          setKeyBox({
            leftPct: parsed.leftPct,
            topPct: parsed.topPct,
            width: parsed.width,
            height: parsed.height,
          });
        }
      } catch {
        // ignore bad storage entries
      }
    })();
  }, []);

  const handleScreenTap = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace(routes.sanctuary);
    });
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleCalibrationTap = (e: GestureResponderEvent) => {
    if (!__DEV__) return;
    if (!screenSize.width || !screenSize.height) return;
    const { locationX, locationY } = e.nativeEvent;
    const leftPct = ((locationX - keyBox.width / 2) / screenSize.width) * 100;
    const topPct = ((locationY - keyBox.height / 2) / screenSize.height) * 100;
    const next = {
      ...keyBox,
      leftPct: Number(leftPct.toFixed(2)),
      topPct: Number(topPct.toFixed(2)),
    };
    setKeyBox(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    console.log("Key box updated:", next);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handleScreenTap}
      onLongPress={handleCalibrationTap}
      onLayout={(event: LayoutChangeEvent) => setScreenSize(event.nativeEvent.layout)}
    >
      <ImageBackground
        source={media.gate.splash}
        style={styles.background}
        resizeMode="cover"
      >
        <Animated.Image
          source={require("@/assets/images/gate-key.png")}
          resizeMode="contain"
          style={[
            styles.key,
            {
              left: `${keyBox.leftPct}%`,
              top: `${keyBox.topPct}%`,
              width: keyBox.width,
              height: keyBox.height,
              opacity,
              transform: [{ scale }, { rotate: spin }],
            },
          ]}
        />
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  key: {
    position: "absolute",
  },
});
