import { AccessibilityInfo } from "react-native";
import { Audio } from "expo-av";

import { paperClickSources } from "@/src/constants/paperClickAudio";
import { reassertEveningPondPlayback } from "@/src/services/audio/eveningPondPlayer";

const VOLUME = 0.18;
const MIN_INTERVAL_MS = 120;

let nextIndex = 0;
let lastPlayedAt = 0;
let reduceMotionCached: boolean | null = null;

/** Subtle paper click for visual-only confirmations — round-robin across 3 variants. */
export function playPaperClick(): void {
  void (async () => {
    const now = Date.now();
    if (now - lastPlayedAt < MIN_INTERVAL_MS) return;

    if (reduceMotionCached == null) {
      reduceMotionCached = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    }
    if (reduceMotionCached) return;

    lastPlayedAt = now;
    const source = paperClickSources[nextIndex % paperClickSources.length];
    nextIndex += 1;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
        volume: VOLUME,
      });
      reassertEveningPondPlayback();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || !status.didJustFinish) return;
        void sound.unloadAsync().catch(() => undefined);
        reassertEveningPondPlayback();
      });
    } catch {
      // UI feedback is optional
      reassertEveningPondPlayback();
    }
  })();
}

/** Call when reduce-motion preference may have changed (e.g. app foreground). */
export function resetPaperClickReduceMotionCache(): void {
  reduceMotionCached = null;
}
