import { Audio } from "expo-av";

import { media } from "@/src/constants/media";
import { reassertEveningPondPlayback } from "@/src/services/audio/eveningPondPlayer";

let unlockPlaying = false;

/** One-shot gate unlock on cold gate key tap; respects iOS silent switch. */
export async function playGateUnlock(): Promise<void> {
  if (unlockPlaying) return;

  unlockPlaying = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(media.audio.unlock, {
      shouldPlay: true,
      volume: 0.85,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || !status.didJustFinish) return;
      void (async () => {
        await sound.unloadAsync().catch(() => undefined);
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        }).catch(() => undefined);
        unlockPlaying = false;
        reassertEveningPondPlayback();
      })();
    });
  } catch {
    unlockPlaying = false;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => undefined);
    reassertEveningPondPlayback();
  }
}
