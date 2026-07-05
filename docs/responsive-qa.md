# Responsive layout QA (P0)

Pre-launch sign-off for FTUE and paywall flows on small and large iPhones. Most screens scale via [`Portrait916Frame`](../src/components/layout/Portrait916Frame.tsx) and norm-rect artboards; this doc covers manual verification and known outliers.

## Device matrix (iOS P0)

| Device              | Logical size | Simulator         |
| ------------------- | ------------ | ----------------- |
| iPhone SE (3rd gen) | 375×667      | iPhone SE         |
| iPhone 15           | 393×852      | iPhone 15         |
| iPhone 15 Pro Max   | 430×932      | iPhone 15 Pro Max |

Run at least one **physical device** before store submission (see [`RELEASE.md`](../RELEASE.md)).

## Screen checklist

Record pass/fail per device. Use the rubric below.

| Flow            | Route / component                       | SE  | iPhone 15 | Pro Max | Notes                              |
| --------------- | --------------------------------------- | --- | --------- | ------- | ---------------------------------- |
| Auth sign-in    | `app/(auth)/login.tsx`                  |     |           |         | Keyboard does not hide submit      |
| Auth sign-up    | `app/(auth)/signup.tsx`                 |     |           |         | OAuth + email CTAs tappable        |
| Email verify    | `app/(auth)/verify-required.tsx`        |     |           |         | Resend + continue reachable        |
| Gate / paywall  | `GateScreen`                            |     |           |         | Scroll to pricing + account footer |
| Delete account  | Gate footer                             |     |           |         | Confirm sheet opens                |
| Archetype FTUE  | `app/onboarding/archetype-selector.tsx` |     |           |         | All three cards reachable          |
| Sanctuary entry | `app/(tabs)/sanctuary.tsx`              |     |           |         | Primary CTA tappable               |

## Pass / fail rubric

**Fail (block preview sign-off)**

- Primary CTA off-screen without scroll
- Purchase or restore blocked on gate
- Auth submit blocked by keyboard
- Any required action not reachable on SE

**Pass with P1 deferral (ship preview; track in [`TECH_DEBT.md`](../TECH_DEBT.md))**

- Decorative crop inside pillarbox bars
- Non-critical illustration overlap
- Minor spacing on Pro Max only

## Keyboard checks

On auth and well forms:

- [ ] Submit / primary action remains reachable when keyboard is open
- [ ] ScrollView or artboard scroll exposes covered fields

## Screenshot template (optional)

When filing issues, include:

1. Device name and logical size
2. Route name
3. Pass / fail
4. Screenshot (store locally; do not commit to git unless needed for design review)

## P1 backlog (post-preview)

- Sample iPad Mini + 2 Android devices
- Secondary routes: child atlas, classroom dial, well reveal animation
- Dynamic Type / large accessibility text (document limitation or add `maxFontSizeMultiplier`)

## Related docs

- [`RELEASE.md`](../RELEASE.md) — physical device + responsive P0 checklist
- [`TECH_DEBT.md`](../TECH_DEBT.md) — P6-D P1/P2 backlog
