import { Audio } from "expo-av";

import { media } from "@/src/constants/media";
import {
  hasPlayedSanctuaryTheme,
  markSanctuaryThemePlayed,
} from "@/src/services/onboarding/sanctuaryThemeStorage";

const THEME_VOLUME = 0.25;

let themeSound: Audio.Sound | null = null;
let themeStarting = false;

export async function startSanctuaryFirstRevealTheme(): Promise<void> {
  if (themeSound || themeStarting) return;

  themeStarting = true;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(media.audio.sanctuaryTheme, {
      shouldPlay: true,
      isLooping: true,
      volume: THEME_VOLUME,
    });
    themeSound = sound;
  } catch {
    themeSound = null;
  } finally {
    themeStarting = false;
  }
}

export async function stopSanctuaryFirstRevealTheme(): Promise<void> {
  const sound = themeSound;
  themeSound = null;
  themeStarting = false;
  if (!sound) return;

  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await sound.stopAsync();
      }
      await sound.unloadAsync();
    }
  } catch {
    /* ignore */
  }
}

/** Play loop once per uid during first curtain-lift reveal. */
export async function maybePlaySanctuaryFirstRevealTheme(
  uid: string | null | undefined,
  options?: { skipForReduceMotion?: boolean },
): Promise<void> {
  if (!uid || options?.skipForReduceMotion) return;
  if (await hasPlayedSanctuaryTheme(uid)) return;

  await markSanctuaryThemePlayed(uid);
  await startSanctuaryFirstRevealTheme();
}
