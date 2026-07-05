/** English copy catalog — swap locale bundle for i18n without changing tiers.json keys. */
export const gateCopyEn: Record<string, string> = {
  "gate.screen.title": "Sanctuary Gate",

  "gate.currentAccess.title": "Current Access",
  "gate.currentAccess.description": "Your sanctuary grows with you.",
  "gate.currentAccess.activeLabel": "Active tier",

  "gate.tiers.free.title": "Explorer",
  "gate.tiers.free.description": "Begin your journey at the\ncottage gate.",
  "gate.tiers.free.activeLabel": "Explorer (Free)",

  "gate.tiers.wooden.title": "Wooden Rod",
  "gate.tiers.wooden.description": "Steady membership for\ndeepening lessons.",
  "gate.tiers.wooden.lessonRange": "Lessons 1.4 – 3.6",
  "gate.tiers.wooden.features.rareRod": "Rare rod",
  "gate.tiers.wooden.features.lessons": "Lessons 1.4 – 3.6",

  "gate.tiers.fiberglass.title": "Fiberglass Rod",
  "gate.tiers.fiberglass.description": "Full curriculum access\nwith premium tools.",
  "gate.tiers.fiberglass.lessonRange": "Lessons 4.1 – 5.6",
  "gate.tiers.fiberglass.features.epicRod": "Unlock the Epic rod",
  "gate.tiers.fiberglass.features.lessons": "Lessons 4.1 – 5.6",
  "gate.tiers.fiberglass.features.woodenIncluded": "Every rod from\nWooden tier\nincluded",

  "gate.tiers.lifetime.title": "Lifetime Access",
  "gate.tiers.lifetime.description": "Every rod from\nWooden tier\nincluded. Lifetime access.",
  "gate.tiers.lifetime.lessonRange": "All current and future lessons",
  "gate.tiers.lifetime.features.allRods": "All rods & tools",
  "gate.tiers.lifetime.features.allLessons": "All lessons",
  "gate.tiers.lifetime.features.futureUpdates": "Future updates",

  "gate.badges.mostChosen": "Most chosen",
  "gate.badges.bestValue": "Best value",
  "gate.badges.owned": "Yours",
  "gate.badges.currentPlan": "Current plan",

  "gate.pricing.monthly": "Monthly",
  "gate.pricing.lifetime": "Lifetime",
  "gate.pricing.lifetimeAccess": "Lifetime access",
  "gate.pricing.perMonth": "per month",
  "gate.pricing.oneTime": "one-time",

  "gate.cta.chooseMonthly": "Choose",
  "gate.cta.chooseLifetime": "Choose",
  "gate.cta.unavailable": "Unavailable",

  "gate.footer.signOut": "Sign out",
  "gate.footer.accountId": "Account ID",
  "gate.footer.restore": "Restore purchases",

  "gate.delete.open": "Delete account",
  "gate.delete.webLink": "Delete without signing in",
  "gate.delete.sheetTitle": "Delete your account?",
  "gate.delete.sheetBody":
    "Your profile and journal entries will be removed immediately. For the next 30 days you can sign back in and cancel deletion. After that date, deletion is permanent and cannot be undone.",
  "gate.delete.subscriptionNote":
    "Deleting your account does not cancel App Store or Google Play billing. Manage your subscription in your device settings.",
  "gate.delete.confirmLabel": "Type DELETE to confirm",
  "gate.delete.confirm": "Delete account",
  "gate.delete.cancel": "Keep account",
  "gate.delete.scheduled": "Your account is scheduled for deletion on {date}.",
  "gate.delete.scheduledFallback": "Your account is scheduled for deletion.",
  "gate.delete.error": "Unable to delete account. Please try again.",

  "gate.sticky.currentTier": "Current tier",
  "gate.a11y.pricingCard": "Membership tier",
  "gate.a11y.purchaseMonthly": "Purchase monthly membership",
  "gate.a11y.purchaseLifetime": "Purchase lifetime membership",
};

export type GateLocale = "en";

const catalogs: Record<GateLocale, Record<string, string>> = {
  en: gateCopyEn,
};

export function translateGateCopy(key: string, locale: GateLocale = "en"): string {
  return catalogs[locale][key] ?? key;
}

export function formatGatePrice(
  amountHkd: number,
  labelKey: string,
  locale: GateLocale = "en",
): string {
  const label = translateGateCopy(labelKey, locale);
  return `HKD ${amountHkd} · ${label}`;
}
