import type { Href } from "expo-router";

/** Paths used before typed-route codegen includes auth/tab routes (`npx expo start`). */
function href(path: string): Href {
  return path as unknown as Href;
}

export const routes = {
  /** Gate entry screen (app/index.tsx) */
  gateEntry: href("/"),
  login: href("/login"),
  signup: href("/signup"),
  forgotPassword: href("/forgot-password"),
  resetPassword: href("/reset-password"),
  finishEmail: href("/finish-email"),
  verifyRequired: href("/verify-required"),
  emailVerified: href("/email-verified"),
  deletionPending: href("/deletion-pending"),
  narrativeOnboarding: href("/narrative-onboarding"),
  createChildProfile: href("/create-child-profile"),
  /** Free-tier / at-cap add-child storybook (avatar switcher only). */
  childProfileLimit: href("/child-profile-limit"),
  /** Pre-auth dialogue prologue (Part 1) */
  prologue: href("/prologue"),
  /** Post-auth dialogue continuation (Part 2) */
  prologueContinuation: href("/prologue-continuation"),
  /** Alias — Garden = Sanctuary */
  garden: href("/sanctuary"),
  /** Default tab after sign-in */
  sanctuary: href("/sanctuary"),
  classroom: href("/classroom"),
  net: href("/net"),
  store: href("/store"),
  gate: href("/gate"),
  diaryEntry: href("/diary-entry"),
  lessonComplete: href("/lesson-complete"),
  well: href("/well"),
  childAtlas: href("/child-atlas"),
  craft: href("/craft"),
  practiceMoment: href("/practice-moment"),
  customerCenter: href("/customer-center"),
  /** Dev-only ArchetypeResultMap visual QA (see app/archetype-map-fixture.tsx) */
  archetypeMapFixture: href("/archetype-map-fixture"),
  /** Dev-only CatalogRarityRing visual QA (see app/pond-ripple-fixture.tsx) */
  pondRippleFixture: href("/pond-ripple-fixture"),
  /** Dev-only full cast-finish ceremony (rings + Focus card) */
  castFinishFixture: href("/cast-finish-fixture"),
};
