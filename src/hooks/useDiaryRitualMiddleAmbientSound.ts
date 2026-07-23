import { useEffect, useRef } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { media } from "@/src/constants/media";

const VOLUME = 0.15;
const FADE_MS = 450;

type UseDiaryRitualMiddleAmbientSoundOptions = {
  active: boolean;
  reduceMotion?: boolean;
};

async function fadeVolume(sound: Audio.Sound, from: number, to: number, ms: number): Promise<void> {
  if (ms <= 0 || Math.abs(from - to) < 0.001) {
    await sound.setVolumeAsync(to).catch(() => undefined);
    return;
  }

  const steps = 8;
  const stepMs = ms / steps;
  for (let i = 1; i <= steps; i++) {
    const next = from + (to - from) * (i / steps);
    await sound.setVolumeAsync(next).catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
}

async function pauseAmbient(sound: Audio.Sound | null, fadeMs: number): Promise<void> {
  if (!sound) return;
  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    const currentVolume = status.volume ?? VOLUME;
    if (fadeMs > 0 && status.isPlaying) {
      await fadeVolume(sound, currentVolume, 0, fadeMs);
    }
    if (status.isPlaying) {
      await sound.pauseAsync();
    }
  } catch {
    // ignore
  }
}

/** Soft loop during diary ritual middle steps — fades in/out; no restart between prompts. */
export function useDiaryRitualMiddleAmbientSound({
  active,
  reduceMotion = false,
}: UseDiaryRitualMiddleAmbientSoundOptions) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadingRef = useRef(false);
  const fadeMs = reduceMotion ? 0 : FADE_MS;

  useEffect(() => {
    let alive = true;

    void (async () => {
      if (!active) {
        await pauseAmbient(soundRef.current, fadeMs);
        return;
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
        });

        if (!soundRef.current && !loadingRef.current) {
          loadingRef.current = true;
          const { sound } = await Audio.Sound.createAsync(media.audio.diaryRitualMiddleSteps, {
            shouldPlay: false,
            isLooping: true,
            volume: 0,
          });
          if (!alive) {
            await sound.unloadAsync().catch(() => undefined);
            loadingRef.current = false;
            return;
          }
          soundRef.current = sound;
          loadingRef.current = false;
        }

        const sound = soundRef.current;
        if (!sound) return;

        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;

        if (!status.isPlaying) {
          await sound.setVolumeAsync(0);
          await sound.playAsync();
          await fadeVolume(sound, 0, VOLUME, fadeMs);
          return;
        }

        const currentVolume = status.volume ?? 0;
        if (Math.abs(currentVolume - VOLUME) > 0.001) {
          await fadeVolume(sound, currentVolume, VOLUME, fadeMs);
        }
      } catch {
        loadingRef.current = false;
      }
    })();

    return () => {
      alive = false;
    };
  }, [active, fadeMs]);

  useEffect(() => {
    return () => {
      const sound = soundRef.current;
      soundRef.current = null;
      loadingRef.current = false;
      void (async () => {
        await pauseAmbient(sound, FADE_MS);
        await sound?.unloadAsync().catch(() => undefined);
      })();
    };
  }, []);
}
