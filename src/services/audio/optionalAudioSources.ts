/** Recycled audio sources for gate/auth/profile SFX — intentional reuse of existing assets. */
export const optionalAudioSources = {
  /** Cold gate idle — recycles evening-pond at lower volume in useGateAmbientSound. */
  gateAmbient: require("@/assets/audio/evening-pond.mp3"),
  /** Login/signup success — recycles field-journal open-book SFX. */
  authWelcome: require("@/assets/audio/journal/open-book.mp3"),
  /** Auth form errors — recycles softest fishing miss SFX. */
  authSoftDeny: require("@/assets/audio/fishing/claim-miss-wonder-gate.mp3"),
  /** Child profile seal success — recycles diary closure wind-down. */
  profilePlanted: require("@/assets/audio/closing-the-journal.mp3"),
} as const;

export type OptionalAudioKey = keyof typeof optionalAudioSources;
