import { Audio } from "expo-av";

import { media } from "@/src/constants/media";

let chimePlaying = false;

/** One-shot gate chime on sanctuary arrival; respects iOS silent switch. */
export async function playGateChime(): Promise<void> {
  if (chimePlaying) return;

  chimePlaying = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(media.audio.chime, {
      shouldPlay: true,
      volume: 0.85,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || !status.didJustFinish) return;
      void sound.unloadAsync().catch(() => undefined);
      chimePlaying = false;
    });
  } catch {
    chimePlaying = false;
  }
}
