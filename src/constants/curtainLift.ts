/** Minimum opaque curtain time after navigate before reveal (ms). */
export const CURTAIN_MIN_DWELL_MS = 200;

/** Elapsed sign-in wait before video→breathing bridge when scene not ready (ms). */
export const CURTAIN_SLOW_LOAD_MS = 2000;

/** Inner crossfade from waiting video to breathing frames (ms). */
export const CURTAIN_BRIDGE_FADE_MS = 500;

/** Final monolithic curtain lift crossfade (ms). */
export const CURTAIN_REVEAL_FADE_MS = 400;

export const SANCTUARY_SCENE_LAYERS = ["background", "mood", "avatar", "tabStrip"] as const;

export type SanctuarySceneLayer = (typeof SANCTUARY_SCENE_LAYERS)[number];

/** Critical prefetch targets — must match afternoon tableau layers in SanctuaryScreen. */
export const CRITICAL_PREFETCH_LAYERS = [
  "background",
  "mood",
  "avatar",
  "tabStrip",
] as const satisfies readonly SanctuarySceneLayer[];

export type CriticalPrefetchLayer = (typeof CRITICAL_PREFETCH_LAYERS)[number];
