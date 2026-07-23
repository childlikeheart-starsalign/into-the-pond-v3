import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { media } from "@/src/constants/media";

export type EveningPondPlaybackState = {
  enabled: boolean;
  paused: boolean;
  volume: number;
  /** Fade duration when leaving session (enabled → false). Default 400 ms. */
  fadeMs?: number;
};

const DEFAULT_VOLUME = 0.18;
const SESSION_EXIT_FADE_MS = 400;

const MIX_AUDIO_MODE = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
} as const;

let sharedSound: Audio.Sound | null = null;
let loadPromise: Promise<Audio.Sound | null> | null = null;
let syncPromise = Promise.resolve();
let lastState: EveningPondPlaybackState = {
  enabled: false,
  paused: false,
  volume: DEFAULT_VOLUME,
};

async function ensureSound(): Promise<Audio.Sound | null> {
  if (sharedSound) return sharedSound;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await Audio.setAudioModeAsync(MIX_AUDIO_MODE);

      const { sound } = await Audio.Sound.createAsync(media.audio.eveningPond, {
        shouldPlay: false,
        isLooping: true,
        volume: DEFAULT_VOLUME,
      });
      sharedSound = sound;
      return sound;
    } catch {
      sharedSound = null;
      return null;
    }
  })();

  return loadPromise;
}

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

async function hardStopAndUnload(sound: Audio.Sound | null, fadeMs: number): Promise<void> {
  if (!sound) {
    sharedSound = null;
    loadPromise = null;
    return;
  }

  try {
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      if (fadeMs > 0 && status.isPlaying) {
        const currentVolume = status.volume ?? DEFAULT_VOLUME;
        await fadeVolume(sound, currentVolume, 0, fadeMs);
      }
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    }
  } catch {
    // ignore
  }

  await sound.unloadAsync().catch(() => undefined);
  sharedSound = null;
  loadPromise = null;
}

async function applyPlayback(state: EveningPondPlaybackState, exitFadeMs: number): Promise<void> {
  if (!state.enabled) {
    await hardStopAndUnload(sharedSound, exitFadeMs);
    return;
  }

  // Re-assert mix + silent-mode every enable so one-shots cannot leave the bed muted.
  await Audio.setAudioModeAsync(MIX_AUDIO_MODE).catch(() => undefined);

  const sound = await ensureSound();
  if (!sound) return;

  const status = await sound.getStatusAsync();
  if (!status.isLoaded) return;

  const currentVolume = status.volume ?? DEFAULT_VOLUME;
  if (Math.abs(currentVolume - state.volume) > 0.001) {
    await fadeVolume(sound, currentVolume, state.volume, 200);
  }

  if (state.paused) {
    if (status.isPlaying) {
      await sound.pauseAsync().catch(() => undefined);
    }
    return;
  }

  if (!status.isPlaying) {
    await sound.playAsync().catch(() => undefined);
  }
}

/** Single controller-owned API for the shared evening-pond bed. */
export function setEveningPondPlayback(next: EveningPondPlaybackState): void {
  const wasEnabled = lastState.enabled;
  const exitFadeMs = wasEnabled && !next.enabled ? (next.fadeMs ?? SESSION_EXIT_FADE_MS) : 0;

  lastState = {
    enabled: next.enabled,
    paused: next.paused,
    volume: next.volume,
  };

  syncPromise = syncPromise.then(() => applyPlayback(lastState, exitFadeMs)).catch(() => undefined);
}

/**
 * Re-apply last enabled session state after UI one-shots that may have
 * interrupted the loop (DoNotMix legacy / race with createAsync).
 */
export function reassertEveningPondPlayback(): void {
  if (!lastState.enabled) return;
  syncPromise = syncPromise.then(() => applyPlayback(lastState, 0)).catch(() => undefined);
}
