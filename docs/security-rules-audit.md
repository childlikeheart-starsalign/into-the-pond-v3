# Security Rules Audit — Pre-TestFlight

**Date:** 2026-07-06  
**Threat model:** Modified client app with a valid user JWT (authenticated owner of `users/{theirUid}`).

## Summary

| Severity | Count | Status after Tracks A/B |
| -------- | ----- | ----------------------- |
| Critical | 0     | —                       |
| High     | 3     | Fixed in Tracks A + B   |
| Medium   | 3     | Fixed in Tracks A + B   |
| Pass     | 5     | Unchanged               |

---

## Findings

### [High] Owner can set `deletionStatus` (bypass cancel-deletion callable)

- **Vector:** Modified client calls `updateDoc(users/{uid}, { deletionStatus: "active" })` to self-cancel a pending deletion without `cancelAccountDeletion`.
- **Current rule:** `clientProfileUpdateAllowed` only blocks economy + `authFunnel` changes.
- **Status:** Fail → **Fixed** (Track A — update allow-list)
- **Minimal fix:** Enforce `CLIENT_SAFE_USER_UPDATE_KEYS` via `affectedKeys().hasOnly(...)` on owner updates.
- **Tests:** `denies owner updating deletionStatus` in `tests/firestore.rules.test.ts`

### [High] Owner can set `deletionPurgeAt` / `deletionRequestId`

- **Vector:** Client manipulates deletion lifecycle timestamps/IDs.
- **Current rule:** Same as above — server-only deletion fields not in economy list.
- **Status:** Fail → **Fixed** (Track A)
- **Minimal fix:** Allow-list denies any key outside `CLIENT_SAFE_USER_UPDATE_KEYS`.
- **Tests:** `denies owner updating deletionPurgeAt` in `tests/firestore.rules.test.ts`

### [High] RTDB any-authenticated user read/write on `sessions/{id}`

- **Vector:** Any signed-in user reads or writes another user's co-session state.
- **Current rule:** `sessions/$sessionId` — `.read`/`.write` if `auth != null`.
- **Status:** Fail → **Fixed** (Track B — membership-map rules)
- **Minimal fix:** Replace with `members/{auth.uid}` membership checks; session root write is **create-only** (child paths for updates).
- **Tests:** `denies non-member read session`, `denies non-member write session` in `tests/database.rules.test.ts`

### [Medium] `CLIENT_SAFE_USER_UPDATE_KEYS` documented but not enforced in rules

- **Vector:** Any non-economy, non-authFunnel field writable by owner.
- **Current rule:** Registry in `economyFieldRegistry.ts`; rules ignore it for updates.
- **Status:** Fail → **Fixed** (Track A)
- **Minimal fix:** Add `clientSafeUserUpdateKeys()` + `clientSafeUpdateKeysOnly()`; CI sync.
- **Tests:** Allow/deny matrix for `childBirthDate`, `narrativeProgress`, mixed patches

### [Medium] `analyticsOptOut` bypasses registry guard

- **Vector:** Legitimate feature uses raw `updateDoc`; not in allow-list registry.
- **Current rule:** Not in `CLIENT_SAFE_USER_UPDATE_KEYS`; rules would block after allow-list unless added.
- **Status:** Fail → **Fixed** (Track A)
- **Minimal fix:** Add `analyticsOptOut` to registry; route through `setDocument`.
- **Tests:** `allows owner updating analyticsOptOut`

### [Medium] `setPresenceOnline` shape incompatible with tightened presence rules

- **Vector:** Dev helper writes `{ online, lastSeen }`; new rules require `{ state, lastSeen }`.
- **Current rule:** Top-level `presence` had no validation; new rules validate shape.
- **Status:** Latent → **Fixed** (Track B — client + rules shipped together)
- **Minimal fix:** Update `realtimeDb.ts` to use `state: 'online'|'offline'`, `lastSeen: number`.
- **Tests:** Top-level presence validate tests in `tests/database.rules.test.ts`

### [Pass] Economy field inflation (`currentWonder`, `subscription`, `activeCast`)

- **Vector:** Client sets wonder/currency on `users/{uid}`.
- **Current rule:** `economyFieldsUnchanged()` + `economyFieldKeys()` registry sync.
- **Status:** Pass
- **Tests:** Existing `denies authenticated owner updating currentWonder`

### [Pass] Cross-user / unauthenticated `users/{uid}` read

- **Vector:** User A reads User B's profile.
- **Current rule:** `allow read: if isOwner(uid)`.
- **Status:** Pass
- **Tests:** Existing cross-user and unauthenticated deny tests

### [Pass] Client `users/{uid}` create bypass

- **Vector:** Client creates profile without `initializeSanctuary`.
- **Current rule:** `clientProfileCreateAllowed` → `false`.
- **Status:** Pass
- **Tests:** Existing create deny tests

### [Pass] Subcollection client writes

- **Vector:** Client writes `economyLedger`, `creatures`, unlisted subcollections.
- **Current rule:** Explicit `allow write: if false` + catch-all deny.
- **Status:** Pass
- **Tests:** Existing subcollection deny tests

### [Pass] Registry ↔ `economyFieldKeys()` sync

- **Vector:** Drift between rules and `economyFieldRegistry.ts`.
- **Current rule:** `validate-firestore-rules-registry.js` in `functions npm run build`.
- **Status:** Pass

---

## Test matrix (Fail findings → tests added)

| Finding            | Test file                 | Scenario                                                            |
| ------------------ | ------------------------- | ------------------------------------------------------------------- |
| deletionStatus     | `firestore.rules.test.ts` | `assertFails` owner update                                          |
| deletionPurgeAt    | `firestore.rules.test.ts` | `assertFails` owner update                                          |
| Allow-list allow   | `firestore.rules.test.ts` | `assertSucceeds` childBirthDate, narrativeProgress, analyticsOptOut |
| Mixed patch        | `firestore.rules.test.ts` | `assertFails` hasSeenTutorial + deletionStatus                      |
| authFunnel change  | `firestore.rules.test.ts` | `assertFails` owner update                                          |
| RTDB non-member    | `database.rules.test.ts`  | `assertFails` read/write                                            |
| RTDB member create | `database.rules.test.ts`  | `assertSucceeds` atomic create                                      |
| RTDB presence      | `database.rules.test.ts`  | self-write allow, other-user deny                                   |

---

## Pre-TestFlight commands

```bash
node functions/scripts/validate-firestore-rules-registry.js
npm run test:firestore-rules
npm run test:rtdb-rules
cd functions && npm run build
npm run verify
```

## Phase 0 exit criteria (TestFlight gate)

- [x] `docs/security-rules-audit.md` written
- [x] Every **High** finding mapped to Track A or B (implemented)
- [x] Test matrix filled for each **Fail** finding
- [x] `npm run test:firestore-rules` — 30/30 pass
- [x] `npm run test:rtdb-rules` — 18/18 pass
- [x] [`RELEASE.md`](../RELEASE.md) lists audit doc + both rules test commands

**Deploy (when ready):** from repo root:

```bash
cd functions && npm run deploy:firestore-rules
cd .. && npm run deploy:database-rules
```

Or from repo root in one line: `(cd functions && npm run deploy:firestore-rules) && npm run deploy:database-rules`
