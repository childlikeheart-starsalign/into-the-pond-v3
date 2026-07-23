import { Audio } from "expo-av";

import {
  optionalAudioSources,
  type OptionalAudioKey,
} from "@/src/services/audio/optionalAudioSources";

const playingKeys = new Set<OptionalAudioKey>();

/** One-shot from the recycled optional-audio registry; no-op if source is missing. */
export async function playOptionalOneShot(key: OptionalAudioKey, volume: number): Promise<void> {
  const source = optionalAudioSources[key];
  if (source == null || playingKeys.has(key)) return;

  playingKeys.add(key);
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || !status.didJustFinish) return;
      void sound.unloadAsync().catch(() => undefined);
      playingKeys.delete(key);
    });
  } catch {
    playingKeys.delete(key);
  }
}
