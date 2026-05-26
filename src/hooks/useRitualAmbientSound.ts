import { useEffect, useRef } from "react";
import { Audio } from "expo-av";

type UseRitualAmbientSoundOptions = {
  enabled: boolean;
  /** 0–1 */
  volume?: number;
};

/**
 * Prepares soft evening ambience during ritual arrival and closure.
 * Playback activates when a bundled local track is added to assets.
 */
export function useRitualAmbientSound({ enabled, volume = 0.18 }: UseRitualAmbientSoundOptions) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!enabled) {
      void soundRef.current?.stopAsync().catch(() => undefined);
      return undefined;
    }

    let alive = true;

    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        // Local ambient track can be wired here, e.g.:
        // const { sound } = await Audio.Sound.createAsync(require('@/assets/audio/evening-pond.mp3'), ...)
        if (!alive) return;
      } catch {
        // Ambient audio is optional.
      }
    })();

    return () => {
      alive = false;
      void soundRef.current?.stopAsync().catch(() => undefined);
      void soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
    };
  }, [enabled, volume]);

  useEffect(() => {
    if (!enabled) return;
    void soundRef.current?.setVolumeAsync(volume).catch(() => undefined);
  }, [enabled, volume]);
}
