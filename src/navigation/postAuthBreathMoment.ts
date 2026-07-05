import * as Haptics from "expo-haptics";
import { AccessibilityInfo } from "react-native";

import { POST_AUTH_BREATH_MS } from "@/src/constants/postAuthBreath";

/** Success haptic + short pause before routing to sanctuary/narrative after auth. */
export async function postAuthBreathMoment(): Promise<void> {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
  if (reduceMotion) return;
  await new Promise<void>((resolve) => setTimeout(resolve, POST_AUTH_BREATH_MS));
}
