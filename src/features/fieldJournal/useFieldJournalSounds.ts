import { useCallback, useEffect, useRef } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackSource,
} from "expo-av";

import { fieldJournalMedia } from "@/src/features/fieldJournal/fieldJournalMedia";

const PAGE_TURN_MIN_MS = 250;
const AMBIENT_VOLUME = 0.15;

type SoundSlot = "openBook" | "pageTurn" | "candleAmbient";

async function loadSound(
  source: AVPlaybackSource,
  options?: { loop?: boolean; volume?: number },
): Promise<Audio.Sound | null> {
  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
      isLooping: options?.loop ?? false,
      volume: options?.volume ?? 1,
    });
    return sound;
  } catch {
    return null;
  }
}

async function isSoundPlaying(sound: Audio.Sound): Promise<boolean> {
  try {
    const status = await sound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch {
    return false;
  }
}

async function replaySound(sound: Audio.Sound): Promise<void> {
  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    await sound.replayAsync();
  } catch {
    // Player can be invalidated while looping or unloading — safe to ignore.
  }
}

async function stopSound(sound: Audio.Sound): Promise<void> {
  try {
    if (!(await isSoundPlaying(sound))) return;
    await sound.stopAsync();
    await sound.setPositionAsync(0);
  } catch {
    // ignore
  }
}

export function useFieldJournalSounds() {
  const soundsRef = useRef<Partial<Record<SoundSlot, Audio.Sound>>>({});
  const readyRef = useRef(false);
  const lastPageTurnAtRef = useRef(0);
  const ambientStartedRef = useRef(false);
  const sfxQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
        });

        const [openBook, pageTurn, candleAmbient] = await Promise.all([
          loadSound(fieldJournalMedia.audio.openBook),
          loadSound(fieldJournalMedia.audio.pageTurn),
          loadSound(fieldJournalMedia.audio.candleAmbient, {
            loop: true,
            volume: AMBIENT_VOLUME,
          }),
        ]);

        if (!alive) {
          await Promise.all(
            [openBook, pageTurn, candleAmbient]
              .filter(Boolean)
              .map((sound) => sound!.unloadAsync().catch(() => undefined)),
          );
          return;
        }

        if (openBook) soundsRef.current.openBook = openBook;
        if (pageTurn) soundsRef.current.pageTurn = pageTurn;
        if (candleAmbient) soundsRef.current.candleAmbient = candleAmbient;
        readyRef.current = true;
      } catch {
        // Audio is optional for journal usability.
      }
    })();

    return () => {
      alive = false;
      readyRef.current = false;
      ambientStartedRef.current = false;
      void (async () => {
        for (const sound of Object.values(soundsRef.current)) {
          await sound?.stopAsync().catch(() => undefined);
          await sound?.unloadAsync().catch(() => undefined);
        }
        soundsRef.current = {};
      })();
    };
  }, []);

  const enqueueSfx = useCallback((play: () => Promise<void>) => {
    sfxQueueRef.current = sfxQueueRef.current.then(play).catch(() => undefined);
  }, []);

  const playBookOpen = useCallback(async () => {
    if (!readyRef.current) return;
    const sound = soundsRef.current.openBook;
    if (!sound) return;

    enqueueSfx(async () => {
      await replaySound(sound);
    });
  }, [enqueueSfx]);

  const playPageTurn = useCallback(async () => {
    const now = Date.now();
    if (!readyRef.current || now - lastPageTurnAtRef.current < PAGE_TURN_MIN_MS) return;
    lastPageTurnAtRef.current = now;

    const sound = soundsRef.current.pageTurn;
    if (!sound) return;

    enqueueSfx(async () => {
      await replaySound(sound);
    });
  }, [enqueueSfx]);

  const startAmbient = useCallback(async () => {
    if (!readyRef.current || ambientStartedRef.current) return;
    const sound = soundsRef.current.candleAmbient;
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded || status.isPlaying) {
        ambientStartedRef.current = status.isLoaded && status.isPlaying;
        return;
      }
      await sound.playAsync();
      ambientStartedRef.current = true;
    } catch {
      ambientStartedRef.current = false;
    }
  }, []);

  const stopAmbient = useCallback(async () => {
    ambientStartedRef.current = false;
    const sound = soundsRef.current.candleAmbient;
    if (!sound) return;
    await stopSound(sound);
  }, []);

  const stopAll = useCallback(async () => {
    await stopAmbient();
    await soundsRef.current.openBook?.stopAsync().catch(() => undefined);
    await soundsRef.current.pageTurn?.stopAsync().catch(() => undefined);
  }, [stopAmbient]);

  return {
    playBookOpen,
    playPageTurn,
    startAmbient,
    stopAmbient,
    stopAll,
  };
}
