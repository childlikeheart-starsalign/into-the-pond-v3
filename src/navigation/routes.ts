import type { Href } from "expo-router";

/** Paths used before typed-route codegen includes auth/tab routes (`npx expo start`). */
function href(path: string): Href {
  return path as unknown as Href;
}

export const routes = {
  login: href("/login"),
  signup: href("/signup"),
  forgotPassword: href("/forgot-password"),
  resetPassword: href("/reset-password"),
  finishEmail: href("/finish-email"),
  verifyRequired: href("/verify-required"),
  narrativeOnboarding: href("/narrative-onboarding"),
  /** Default tab after sign-in */
  sanctuary: href("/sanctuary"),
  classroom: href("/classroom"),
  net: href("/net"),
  store: href("/store"),
  gate: href("/gate"),
  well: href("/well"),
  craft: href("/craft"),
  customerCenter: href("/customer-center"),
};
