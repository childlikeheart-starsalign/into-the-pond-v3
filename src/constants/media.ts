import {
  getSanctuaryFrame,
  SANCTUARY_DEFAULT_FRAME_ID,
  sanctuaryFrameSources,
} from "@/src/constants/sanctuaryFrames";

export const media = {
  gate: {
    background: require("@/assets/images/gate-home.png"),
    splash: require("@/assets/images/gate-splash.png"),
    key: require("@/assets/images/gate-key-transparent.png"),
    showPassword: require("@/assets/images/show-password.png"),
    hidePassword: require("@/assets/images/hide-password.png"),
  },
  /** Garden / narrative illustrations (frames 41–46, 58–76) */
  narrative: {
    sanctuaryBg: getSanctuaryFrame(SANCTUARY_DEFAULT_FRAME_ID),
    gateSplash: require("@/assets/images/gate-splash.png"),
    sanctuaryFrames: sanctuaryFrameSources,
    /** Mood variants — tired / fishing / resting */
    sanctuaryTired: getSanctuaryFrame(75),
    sanctuaryFishing: getSanctuaryFrame(71),
    sanctuaryResting: getSanctuaryFrame(60),
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
} as const;
