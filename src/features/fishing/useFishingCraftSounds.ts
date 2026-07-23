import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackSource,
} from "expo-av";

import {
  fishingCraftAudio,
  type FishingCraftSoundSlot,
} from "@/src/features/fishing/fishingCraftAudio";

async function loadSound(
  source: AVPlaybackSource | null,
  options?: { loop?: boolean; volume?: number },
): Promise<Audio.Sound | null> {
  if (source == null) return null;
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

async function replaySound(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    await sound.replayAsync();
  } catch {
    // ignore
  }
}

async function stopSound(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  try {
    const status = await sound.getStatusAsync();
    if (!status.isLoaded || !status.isPlaying) return;
    await sound.stopAsync();
    await sound.setPositionAsync(0);
  } catch {
    // ignore
  }
}

const VOLUME: Partial<Record<FishingCraftSoundSlot, number>> = {
  castSplash: 0.6,
  pondWaitingAmbient: 0.15,
  claimCatch: 0.5,
  claimDuplicate: 0.45,
  claimMissChance: 0.4,
  claimMissWonderGate: 0.35,
  craftBegin: 0.5,
  craftReady: 0.5,
  craftEquip: 0.5,
};

export function useFishingCraftSounds() {
  const soundsRef = useRef<Partial<Record<FishingCraftSoundSlot, Audio.Sound | null>>>({});
  const readyRef = useRef(false);
  const queueRef = useRef(Promise.resolve());
  const pendingPlaysRef = useRef(new Set<FishingCraftSoundSlot>());

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
      } catch {
        // ignore
      }

      const entries = Object.entries(fishingCraftAudio) as [FishingCraftSoundSlot, number | null][];
      const loaded: Partial<Record<FishingCraftSoundSlot, Audio.Sound | null>> = {};
      for (const [slot, source] of entries) {
        loaded[slot] = await loadSound(source, {
          loop: slot === "pondWaitingAmbient",
          volume: VOLUME[slot] ?? 0.5,
        });
      }
      if (!alive) {
        await Promise.all(
          Object.values(loaded).map(async (sound) => {
            try {
              await sound?.unloadAsync();
            } catch {
              // ignore
            }
          }),
        );
        return;
      }
      soundsRef.current = loaded;
      readyRef.current = true;

      const pending = [...pendingPlaysRef.current];
      pendingPlaysRef.current.clear();
      for (const slot of pending) {
        await replaySound(loaded[slot] ?? null);
      }
    })();

    return () => {
      alive = false;
      readyRef.current = false;
      pendingPlaysRef.current.clear();
      const sounds = soundsRef.current;
      soundsRef.current = {};
      void Promise.all(
        Object.values(sounds).map(async (sound) => {
          try {
            await sound?.unloadAsync();
          } catch {
            // ignore
          }
        }),
      );
    };
  }, []);

  const play = useCallback((slot: FishingCraftSoundSlot) => {
    queueRef.current = queueRef.current.then(async () => {
      if (!readyRef.current) {
        pendingPlaysRef.current.add(slot);
        return;
      }
      await replaySound(soundsRef.current[slot] ?? null);
    });
  }, []);

  const stopAmbient = useCallback(() => {
    queueRef.current = queueRef.current.then(async () => {
      pendingPlaysRef.current.delete("pondWaitingAmbient");
      await stopSound(soundsRef.current.pondWaitingAmbient ?? null);
    });
  }, []);

  const playClaimOutcome = useCallback(
    (claim: { outcome: string; metadata?: { reason?: string } | Record<string, unknown> }) => {
      if (claim.outcome === "catch") {
        play("claimCatch");
        return;
      }
      if (claim.outcome === "duplicate") {
        play("claimDuplicate");
        return;
      }
      const reason =
        claim.metadata && typeof claim.metadata === "object" && "reason" in claim.metadata
          ? String((claim.metadata as { reason?: string }).reason ?? "")
          : "";
      if (reason === "wonder_gate") {
        play("claimMissWonderGate");
        return;
      }
      play("claimMissChance");
    },
    [play],
  );

  return useMemo(
    () => ({ play, stopAmbient, playClaimOutcome }),
    [play, playClaimOutcome, stopAmbient],
  );
}
