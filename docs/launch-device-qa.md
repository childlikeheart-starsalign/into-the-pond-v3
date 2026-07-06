# Launch device QA matrix

Physical device and simulator sign-off for preview. Copy pass/fail into the tables as you test.

**Build:** preview profile (`npm run eas:build:preview`)  
**Refs:** [`RELEASE.md`](../RELEASE.md), [`TESTING_IAP.md`](../TESTING_IAP.md), [`docs/posthog-verification.md`](posthog-verification.md)

---

## Responsive P0 (simulators)

Fill [`responsive-qa.md`](responsive-qa.md) — iPhone SE, iPhone 15, Pro Max minimum.

| Flow                  | SE  | 15  | Pro Max | Pass? |
| --------------------- | --- | --- | ------- | ----- |
| Auth sign-in          |     |     |         |       |
| Auth sign-up          |     |     |         |       |
| Gate / paywall scroll |     |     |         |       |
| Archetype selector    |     |     |         |       |
| Delete account sheet  |     |     |         |       |

---

## Auth deep links (physical device)

| Test                                                      | Pass? | Notes |
| --------------------------------------------------------- | ----- | ----- |
| Email verify → `/finish-email` → sanctuary path           |       |       |
| Expired verify link → friendly error                      |       |       |
| Password reset → `/reset-password` → sign in              |       |       |
| Universal link URL shape matches `firebaseAuthDomain`     |       |       |
| Sentry wrong-password: `area: auth`, no raw email in body |       |       |

---

## IAP sandbox ([`TESTING_IAP.md`](../TESTING_IAP.md))

| Test                                                 | Pass? | Notes |
| ---------------------------------------------------- | ----- | ----- |
| Wooden_Rod_Monthly purchase → Firestore subscription |       |       |
| Restore purchases (no duplicate transaction docs)    |       |       |
| Foreground refresh after cancel in Settings          |       |       |

---

## PostHog ([`posthog-verification.md`](posthog-verification.md))

| Test                                               | Pass? | Notes |
| -------------------------------------------------- | ----- | ----- |
| `auth_gate_interaction` viewed on cold launch      |       |       |
| `auth_signin_success` → `sanctuary_arrived` funnel |       |       |
| Session replay: masked inputs/images               |       |       |
| Analytics opt-out stops Live events                |       |       |

---

## Account deletion

| Test                                            | Pass?            | Notes |
| ----------------------------------------------- | ---------------- | ----- |
| Gate → Delete account → confirm → sign out      |                  |       |
| Grace period → Cancel deletion restores profile |                  |       |
| Web form at intothepond.app/delete-account      | N/A until hosted |       |

---

## Cold start path

| Step                         | Pass? |
| ---------------------------- | ----- |
| Cold start → gate            |       |
| Sign up / sign in            |       |
| Reach sanctuary tab          |       |
| No `127.0.0.1` network calls |       |

---

## Tester / date

- **Tester:**
- **Build ID:**
- **Date:**
- **Preview sign-off:** pass / fail
