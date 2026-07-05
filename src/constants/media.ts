import {
  getSanctuaryFrame,
  SANCTUARY_DEFAULT_FRAME_ID,
  sanctuaryFrameSources,
} from "@/src/constants/sanctuaryFrames";

export const media = {
  gate: {
    background: require("@/assets/images/gate-home.png"),
    splash: require("@/assets/images/gate-splash.png"),
    key: require("@/assets/images/gate-key-sprite.png"),
    showPassword: require("@/assets/images/show-password.png"),
    hidePassword: require("@/assets/images/hide-password.png"),
  },
  /** Garden / narrative illustrations (frames 41–46, 58–76) */
  narrative: {
    sanctuaryBg: getSanctuaryFrame(SANCTUARY_DEFAULT_FRAME_ID),
    gateSplash: require("@/assets/images/gate-splash.png"),
    sanctuaryFrames: sanctuaryFrameSources,
    scenes: {
      1: require("@/assets/video/narrative/scene-01-finding.mp4"),
      2: require("@/assets/video/narrative/scene-02-child.mp4"),
      3: require("@/assets/video/narrative/scene-03-question.mp4"),
      4: require("@/assets/video/narrative/scene-04-others.mp4"),
      5: require("@/assets/video/narrative/scene-05-path.mp4"),
      6: require("@/assets/video/narrative/scene-06-exit.mp4"),
    },
    /** Archetype-specific branch scenes — play after shared Scene 6. */
    archetypeScenes: {
      storm: [
        require("@/assets/video/narrative/storm-scene-01.mp4"),
        require("@/assets/video/narrative/storm-scene-02.mp4"),
        require("@/assets/video/narrative/storm-scene-03.mp4"),
        require("@/assets/video/narrative/storm-scene-04.mp4"),
        require("@/assets/video/narrative/storm-scene-05.mp4"),
        require("@/assets/video/narrative/storm-scene-06.mp4"),
        require("@/assets/video/narrative/storm-scene-07.mp4"),
        require("@/assets/video/narrative/storm-scene-08.mp4"),
        require("@/assets/video/narrative/storm-scene-09.mp4"),
        require("@/assets/video/narrative/storm-scene-10.mp4"),
      ],
      wall: [
        require("@/assets/video/narrative/wall-scene-01.mp4"),
        require("@/assets/video/narrative/wall-scene-02.mp4"),
        require("@/assets/video/narrative/wall-scene-03.mp4"),
        require("@/assets/video/narrative/wall-scene-04.mp4"),
        require("@/assets/video/narrative/wall-scene-05.mp4"),
        require("@/assets/video/narrative/wall-scene-06.mp4"),
        require("@/assets/video/narrative/wall-scene-07.mp4"),
        require("@/assets/video/narrative/wall-scene-08.mp4"),
        require("@/assets/video/narrative/wall-scene-09.mp4"),
      ],
      spark: [
        require("@/assets/video/narrative/spark-scene-01.mp4"),
        require("@/assets/video/narrative/spark-scene-02.mp4"),
        require("@/assets/video/narrative/spark-scene-03.mp4"),
        require("@/assets/video/narrative/spark-scene-04.mp4"),
        require("@/assets/video/narrative/spark-scene-05.mp4"),
        require("@/assets/video/narrative/spark-scene-06.mp4"),
        require("@/assets/video/narrative/spark-scene-07.mp4"),
        require("@/assets/video/narrative/spark-scene-08.mp4"),
        require("@/assets/video/narrative/spark-scene-09.mp4"),
      ],
    },
    /** Mood variants — tired / fishing / resting */
    sanctuaryTired: getSanctuaryFrame(75),
    sanctuaryFishing: getSanctuaryFrame(71),
    sanctuaryResting: getSanctuaryFrame(60),
    /**
     * Scene 2 archetype-specific backgrounds.
     * Placeholders using existing sanctuary frames until final art arrives.
     * Replace with: require("@/assets/images/scene-2-storm-child.png") etc.
     */
    scene2: {
      storm: getSanctuaryFrame(75),
      wall: getSanctuaryFrame(60),
      spark: getSanctuaryFrame(71),
    },
  },
  /** Auth artboard PNGs (576×1024 canvas); tweak hit rects in artboard config files. */
  auth: {
    signIn: {
      /** Full sign-in screen: gate background + parchment card with all UI elements drawn. */
      background: require("@/assets/images/auth/14.png"),
      invalidEmailBg: require("@/assets/images/auth/22.png"),
      invalidPasswordBg: require("@/assets/images/auth/23.png"),
      loading: require("@/assets/images/auth/24.png"),
    },
    signUp: {
      /** Full sign-up screen: gate background + parchment card with all UI elements drawn. */
      background: require("@/assets/images/25.png"),
    },
    forgotPassword: {
      /** Forgot/reset password screen: gate background + parchment card with email field + Reset Password button. */
      background: require("@/assets/images/auth/reset-password.png"),
      /** Confirmation screen shown after reset email is sent; has Resend button + countdown. */
      linkSent: require("@/assets/images/auth/reset-password-sent.png"),
    },
    resetPassword: {
      /** Enter new password screen: parchment card with password field + Enter button. */
      background: require("@/assets/images/auth/enter-new-password.png"),
    },
    verifyEmail: {
      /** Verify-email sent screen: shows resend button with cooldown. */
      linkSent: require("@/assets/images/auth/verify-email-sent.png"),
    },
    emailVerified: {
      /** Email verified success screen: shows Enter button. */
      background: require("@/assets/images/auth/email-verified.png"),
    },
  },
  audio: {
    chime: require("@/assets/audio/gate-chime.mp4"),
    unlock: require("@/assets/audio/gate-unlock.mp4"),
  },
  /** Cold-start boot + shared waiting loop (PR2 ops checkpoint 4). */
  startup: {
    waitingScreen: require("@/assets/video/startup/waiting-screen.mp4"),
  },
} as const;
