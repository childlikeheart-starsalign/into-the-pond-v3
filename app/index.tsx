import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { doc, getDoc } from "firebase/firestore";

import {
  GATE_FADE_DELAY_MS,
  GATE_FADE_DURATION_MS,
  GATE_KEY_OPACITY_DIP_MS,
  GATE_KEY_OPACITY_RESTORE_MS,
  GATE_KEY_PULSE_DOWN_MS,
  GATE_KEY_PULSE_UP_MS,
  GATE_KEY_SETTLE_MS,
} from "@/src/constants/gateTransition";
import {
  clampGateKeyCalibration,
  GATE_KEY_DEFAULT,
  GATE_KEY_STORAGE_KEY,
  GATE_KEY_WIDTH_RATIO,
  parseGateKeyCalibration,
  resolveGateKeyIntrinsic,
  resolveGateKeyPosition,
  resolveGateKeySize,
  STALE_GATE_KEY_STORAGE_KEYS,
  type GateKeyCalibration,
} from "@/src/constants/gateKeyLayout";
import { media } from "@/src/constants/media";
import { fontFamilies } from "@/src/constants/theme";
import { parseFeatureFlagDoc } from "@/shared/featureFlags/evaluateFeatureFlag";
import { FEATURE_FLAG_NAMES } from "@/shared/featureFlags/types";
import { useAuthBoot } from "@/src/hooks/useAuthBoot";
import { useGateAmbientSound } from "@/src/hooks/useGateAmbientSound";
import { trackAuthGateViewed } from "@/src/services/analytics/authFunnel";
import { playGateUnlock } from "@/src/services/audio/playGateUnlock";
import { firestore } from "@/src/services/firebase/client";
import { hasCompletedPreAuthPrologue } from "@/src/services/onboarding/narrativeOnboardingStorage";

const defaultCalibration: GateKeyCalibration = {
  leftPct: GATE_KEY_DEFAULT.leftPct,
  topPct: GATE_KEY_DEFAULT.topPct,
  widthRatio: GATE_KEY_WIDTH_RATIO,
};

/**
 * Gate screen: tap key to unlock sign-up (signed-out cold-start funnel).
 * Long press (dev only) saves key center position to AsyncStorage for alignment tuning.
 */
export default function GateScreen() {
  const { unlockGateAndGoToSignup, unlockGateAndGoToLogin, unlockGateAndGoToPrologue } =
    useAuthBoot();
  const keyScale = useSharedValue(1);
  const keyOpacity = useSharedValue(1);
  const gateOpacity = useSharedValue(1);
  const [isAnimating, setIsAnimating] = useState(false);
  useGateAmbientSound({ active: !isAnimating });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [calibration, setCalibration] = useState<GateKeyCalibration>(defaultCalibration);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateToSignup = useCallback(async () => {
    const alreadyDidPart1 = await hasCompletedPreAuthPrologue();
    let newOnboardingAll = false;
    try {
      // Signed-out Gate: only `rolloutState: "all"` can unlock Part 1 (no uid for allowlist).
      const snap = await getDoc(
        doc(firestore, "featureFlags", FEATURE_FLAG_NAMES.newOnboardingEnabled),
      );
      const flag = snap.exists() ? parseFeatureFlagDoc(snap.data()) : null;
      newOnboardingAll = flag?.rolloutState === "all";
    } catch {
      newOnboardingAll = false;
    }
    // Key → /prologue only when flag is fully on and this device hasn't finished Part 1.
    if (newOnboardingAll && !alreadyDidPart1) {
      unlockGateAndGoToPrologue();
      return;
    }
    unlockGateAndGoToSignup();
  }, [unlockGateAndGoToPrologue, unlockGateAndGoToSignup]);

  useEffect(() => {
    trackAuthGateViewed();
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  const keyIntrinsic = useMemo(() => resolveGateKeyIntrinsic(), []);

  const keySize = useMemo(
    () =>
      resolveGateKeySize(
        screenSize.width,
        calibration.widthRatio ?? GATE_KEY_WIDTH_RATIO,
        keyIntrinsic.width,
        keyIntrinsic.height,
      ),
    [calibration.widthRatio, keyIntrinsic.height, keyIntrinsic.width, screenSize.width],
  );

  const keyPosition = useMemo(
    () => resolveGateKeyPosition(screenSize.width, screenSize.height, calibration, keySize),
    [calibration, keySize, screenSize.height, screenSize.width],
  );

  const keyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: keyScale.value }],
    opacity: keyOpacity.value,
  }));

  const gateStyle = useAnimatedStyle(() => ({
    opacity: gateOpacity.value,
  }));

  useEffect(() => {
    if (!__DEV__) return;
    void (async () => {
      try {
        await AsyncStorage.multiRemove([...STALE_GATE_KEY_STORAGE_KEYS]);
        const stored = await AsyncStorage.getItem(GATE_KEY_STORAGE_KEY);
        if (!stored) return;
        const parsed = parseGateKeyCalibration(JSON.parse(stored));
        if (parsed) {
          setCalibration(parsed);
        }
      } catch {
        // ignore bad storage entries
      }
    })();
  }, []);

  const startGateFadeAndNavigate = useCallback(() => {
    gateOpacity.value = withTiming(0, { duration: GATE_FADE_DURATION_MS }, (finished) => {
      if (finished) {
        runOnJS(navigateToSignup)();
      }
    });
  }, [gateOpacity, navigateToSignup]);

  const handleKeyTap = useCallback(() => {
    if (isAnimating) return;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      void playGateUnlock();

      if (reduceMotion) {
        navigateToSignup();
        return;
      }

      setIsAnimating(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      keyScale.value = 1;
      keyOpacity.value = 1;

      keyScale.value = withSequence(
        withTiming(0.92, {
          duration: GATE_KEY_PULSE_DOWN_MS,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1.04, {
          duration: GATE_KEY_PULSE_UP_MS,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: GATE_KEY_SETTLE_MS,
          easing: Easing.out(Easing.quad),
        }),
      );

      keyOpacity.value = withSequence(
        withTiming(0.6, { duration: GATE_KEY_OPACITY_DIP_MS }),
        withTiming(1, { duration: GATE_KEY_OPACITY_RESTORE_MS }),
      );

      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        fadeTimeoutRef.current = null;
        startGateFadeAndNavigate();
      }, GATE_FADE_DELAY_MS);
    });
  }, [isAnimating, keyOpacity, keyScale, navigateToSignup, startGateFadeAndNavigate]);

  const handleCalibrationTap = (e: GestureResponderEvent) => {
    if (!__DEV__ || isAnimating) return;
    if (!screenSize.width || !screenSize.height) return;
    const { pageX, pageY } = e.nativeEvent;
    const next = clampGateKeyCalibration({
      leftPct: Number((pageX / screenSize.width).toFixed(4)),
      topPct: Number((pageY / screenSize.height).toFixed(4)),
      widthRatio: calibration.widthRatio ?? GATE_KEY_WIDTH_RATIO,
    });
    setCalibration(next);
    keyOpacity.value = 1;
    keyScale.value = 1;
    void AsyncStorage.setItem(GATE_KEY_STORAGE_KEY, JSON.stringify(next));
    console.log("Gate key calibration updated:", next);
  };

  return (
    <View
      style={styles.container}
      onLayout={(event: LayoutChangeEvent) => setScreenSize(event.nativeEvent.layout)}
    >
      <Animated.View style={[styles.gateLayer, gateStyle]}>
        <ImageBackground source={media.gate.splash} style={styles.background} resizeMode="cover">
          {keySize.width > 0 && keySize.height > 0 ? (
            <Pressable
              style={[
                styles.keyPressable,
                {
                  left: keyPosition.left,
                  top: keyPosition.top,
                  width: keySize.width,
                  height: keySize.height,
                },
              ]}
              onPress={handleKeyTap}
              onLongPress={handleCalibrationTap}
              disabled={isAnimating}
              accessibilityRole="button"
              accessibilityLabel="Key to enter"
              accessibilityState={{ disabled: isAnimating }}
            >
              <Animated.View
                style={[
                  keyStyle,
                  {
                    width: keySize.width,
                    height: keySize.height,
                  },
                ]}
              >
                <Image
                  source={media.gate.key}
                  resizeMode="contain"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.key,
                    {
                      width: keySize.width,
                      height: keySize.height,
                    },
                  ]}
                />
              </Animated.View>
            </Pressable>
          ) : null}

          <Text style={styles.hintText} accessibilityElementsHidden>
            Tap the key when you&apos;re ready.
          </Text>

          <Pressable
            onPress={unlockGateAndGoToLogin}
            disabled={isAnimating}
            style={styles.signInLink}
            accessibilityLabel="Already have a pond? Sign in"
            accessibilityRole="link"
            accessibilityState={{ disabled: isAnimating }}
            hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          >
            <Text style={styles.signInLinkText}>
              Already have a pond? <Text style={styles.signInEmphasis}>Sign in</Text>
            </Text>
          </Pressable>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gateLayer: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  keyPressable: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  key: {
    backgroundColor: "transparent",
  },
  hintText: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 19,
    color: "#2C1810",
    opacity: 0.45,
    textAlign: "center",
    position: "absolute",
    bottom: "22%",
    alignSelf: "center",
    letterSpacing: 0.3,
  },
  signInLink: {
    position: "absolute",
    bottom: "16%",
    alignSelf: "center",
    padding: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  signInLinkText: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 18,
    color: "#2C1810",
    opacity: 0.55,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  signInEmphasis: {
    opacity: 1,
  },
});
