# Economy Invariant 2 — Verification

Invariant 2: **Client cannot write economy fields.** All economy mutations flow through Cloud Functions (`commitEconomyAction`).

## Enforcement layers

| Layer                 | Location                                                                                                              | Status                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Firestore rules       | [`firestore.rules`](../firestore.rules)                                                                               | **Live in production** — verified 2026-06-29    |
| Field registry        | [`shared/firestore/economyFieldRegistry.ts`](../shared/firestore/economyFieldRegistry.ts)                             | Implemented                                     |
| Registry ↔ rules sync | [`functions/scripts/validate-firestore-rules-registry.js`](../functions/scripts/validate-firestore-rules-registry.js) | Runs in `functions npm run build`               |
| Client runtime guard  | [`src/services/firebase/firestore.ts`](../src/services/firebase/firestore.ts)                                         | `assertClientSafeUserPayload` on `users` writes |
| ESLint                | [`eslint-rules/no-client-economy-writes.js`](../eslint-rules/no-client-economy-writes.js)                             | `local/no-client-economy-writes`                |
| Rules emulator tests  | [`tests/firestore.rules.test.ts`](../tests/firestore.rules.test.ts)                                                   | `npm run test:firestore-rules`                  |

## Local test commands

```bash
# Registry sync (also part of functions build)
node functions/scripts/validate-firestore-rules-registry.js

# Rules emulator tests (requires JDK 21+ for Firestore emulator)
npm run test:firestore-rules

# Client economy lint
npm run lint:economy

# Functions regression
cd functions && npm run build
```

## Rules emulator coverage

- Deny client `update` of `currentWonder`
- Allow client `update` of `hasSeenTutorial`
- Deny client writes to `creatures` and `economyLedger` subcollections
- Allow client `create` with CLIENT_SAFE fields only
- Deny client `create` with `currentWonder: 0`
- Deny unauthenticated and cross-user reads

## Production deploy checklist

**Prerequisite:** Cloud Firestore database (default) must exist in Firebase Console for project `into-the-pond`.

1. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `functions/.env` (see `.env.example`)
2. Deploy rules:
   ```bash
   cd functions && npm run deploy:firestore-rules
   ```
3. Record deploy metadata below after successful publish
4. Smoke test in Firebase Console → Firestore → Rules Playground:
   - Path: `users/{your-uid}`
   - Auth: signed in as owner
   - Operation: `update` with `currentWonder: 99` → **Denied**
   - Operation: `update` with `hasSeenTutorial: true` → **Allowed**

## Deploy log

| Field              | Value                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Verified date      | 2026-06-29                                                                                       |
| Active ruleset     | `16139b6b-6495-456f-83e5-b8378c98c57a`                                                           |
| Prod vs repo       | **MATCH** — `cd functions && npm run get:firestore-rules` (full rules + economy blocks)          |
| Deploy required    | **No** — production already matches [`firestore.rules`](../firestore.rules); no republish needed |
| Emulator smoke     | **Pass** — `npm run test:firestore-rules` (15/15)                                                |
| Console playground | Optional spot-check — same rules source as emulator tests                                        |

### Verification run (2026-06-29)

Local gates before prod check:

- `node functions/scripts/validate-firestore-rules-registry.js` — pass
- `npm run test:firestore-rules` — 15/15 pass
- `cd functions && npm run build` — pass (70 tests)

Prod check:

```bash
cd functions && npm run get:firestore-rules
# MATCH: full firestore.rules matches production (normalized).
```

### Historical — deploy attempt (2026-06-26)

`firebase-tools` deploy was blocked (`serviceusage.services.use`). Rules were subsequently published via Admin SDK (`npm run deploy:firestore-rules`) or an equivalent release; prod now matches repo.

```
PrefixedFirebaseError: Caller does not have required permission to use project into-the-pond.
Grant roles/serviceusage.serviceUsageConsumer ...
```

**Future rule changes:** use `cd functions && npm run deploy:firestore-rules` (Admin SDK), then re-run `get:firestore-rules` and `npm run test:firestore-rules`.

## Notes

- Invariant 2 **is enforced in production** — client economy writes are denied by Firestore rules (verified 2026-06-29).
- DEV previews (`resolveDevFishingClaim`, `wellDevPreview`) are preview-only and do not write economy state to Firestore.
- Server mutations via Admin SDK bypass rules by design.
