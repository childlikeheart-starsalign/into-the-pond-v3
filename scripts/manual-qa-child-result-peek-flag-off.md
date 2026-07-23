# Manual QA — childResultPeek flag-off parity

Use this after Phase 2 lands, with a signed-in account that is **not** on the
`childResultPeek` allowlist (flag doc `rolloutState: "off"` or allowlist without your UID).

## Preconditions

- [ ] Firestore `featureFlags/childResultPeek` is `off`, or your UID is absent from `allowlistUids`
- [ ] App has hydrated session flags after sign-in
- [ ] Sanctuary header switcher opens with at least one child marked current (✿ / brass tick)

## Steps

1. Open the child switcher.
2. Confirm the **active** child row does **not** respond to taps (same as production before Phase 2).
3. Tap a **non-active**, accessible sibling → should switch active child and dismiss (today’s end state). Do **not** see a “Peeking into…” plate.
4. Force-kill and reopen the app; repeat steps 1–2 to confirm hydrate still leaves peek off.

## Pass criteria

- Active row remains non-tappable while the flag is off for this UID.
- No peek plate, unwritten plate, or Deep Check stub appears.
