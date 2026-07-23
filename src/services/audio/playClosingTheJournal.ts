import { Audio } from "expo-av";

import { media } from "@/src/constants/media";

const CLOSING_VOLUME = 0.3;

let closingPlaying = false;

/** One-shot wind-down when a parent completes a diary/reflection entry. */
export async function playClosingTheJournal(): Promise<void> {
  if (closingPlaying) return;

  closingPlaying = true;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(media.audio.closingTheJournal, {
      shouldPlay: true,
      isLooping: false,
      volume: CLOSING_VOLUME,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || !status.didJustFinish) return;
      void sound.unloadAsync().catch(() => undefined);
      closingPlaying = false;
    });
  } catch {
    closingPlaying = false;
  }
}
