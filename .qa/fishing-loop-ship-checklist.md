# Fishing loop ship checklist (Gaps 1–2)

**Purpose:** Gate deploy of cancel cast + cast-ready local notifications before calling Gaps 1–2 done in production.  
**Related:** [live-sanctuary-claim-qa.md](./live-sanctuary-claim-qa.md), [docs/posthog-verification.md](../docs/posthog-verification.md)

Notification body (final): _Something's waiting at the pond_

---

## 1. Deploy functions (`asia-east2`)

- [ ] Deploy Cloud Functions including updated `createCast` and new `cancelCast`
- [ ] Confirm live `createCast` writes `activeCast.createdAt` and `activeCast.baitDeducted`
- [ ] Confirm `cancelCast` is invokable (not `not-found`)
- [ ] `npm run smoke:claim-cast` passes against deployed project
- [ ] Cancel smoke: create cast → within ~15s call `cancelCast` → `activeCast` cleared; consumable bait refunded if deducted; `fishingPity` unchanged

Example (adjust to your usual functions deploy command):

```bash
cd functions && npm run deploy
# or project-specific: firebase deploy --only functions:createCast,functions:cancelCast,functions:claimCast
```

---

## 2. Native rebuild (`expo-notifications`)

- [ ] Dev client / EAS build includes `expo-notifications` plugin from `app.json` (Expo Go is insufficient)
- [ ] Fresh install or rebuild after adding the dependency
- [ ] First successful cast prompts notification permission once; deny → no nag (landmark cue still works)

---

## 3. Device QA

### Claim ceremony (existing)

- [ ] UI claim path in [live-sanctuary-claim-qa.md](./live-sanctuary-claim-qa.md) §3–4 signed off on device
- [ ] PostHog always-on ring events + wonder-gate miss SFX row in [docs/posthog-verification.md](../docs/posthog-verification.md)

### Cancel (Gap 1)

- [ ] After cast, **Recall the line** appears near pond (quiet text link, no timer)
- [ ] Affordance disappears after grace (~15s) with no countdown UI
- [ ] Tap within grace → cast clears, pond idle; consumable bait refunded
- [ ] Past grace → recall unavailable; cast must wait out

### Ready notification + landmark (Gap 2)

- [ ] After cast (permission granted), local notification scheduled for `readyAt`
- [ ] At ready: notification shows _Something's waiting at the pond_
- [ ] Successful claim or cancel clears the scheduled notification
- [ ] Ready but claim pending: pond shows _Something has been waiting._ (no badge/modal)
- [ ] Multi-device: after claim/cancel on device A, opening sanctuary on device B reconciles and drops orphaned local schedules (if B never opens, OS may still fire once — accepted)

**Note:** Notifications are device-local. Cross-device cancel is best-effort via `reconcileServerCastCache` → `syncCastReadyNotificationsWithServer`, not FCM.

---

## Sign-off

| Gate             | Owner | Date | Notes |
| ---------------- | ----- | ---- | ----- |
| Functions deploy |       |      |       |
| Native rebuild   |       |      |       |
| Device QA        |       |      |       |
