# Realtime Database — use case decision

**Status:** Security rules hardened (members-map sessions + validated presence). **No product UI uses co-session yet** — helpers live in [`src/services/firebase/rtdbSession.ts`](../src/services/firebase/rtdbSession.ts).

## Decision (current)

| Data / behavior                                                 | Store                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| User profile, wonder, rods, creatures, diary, well, Child Atlas | **Firestore** + WatermelonDB offline cache                     |
| Economy / progression writes                                    | **Cloud Functions** + Firestore                                |
| Real-time profile sync                                          | Firestore `onSnapshot` → [`src/db/sync.ts`](../src/db/sync.ts) |
| Co-session coordination (who is in the room, ritual pings)      | **RTDB** `sessions/{sessionId}` — ephemeral only               |

**Do not** duplicate Firestore documents in RTDB without a clear latency or presence requirement.

## Session schema (`sessions/{sessionId}`)

```json
{
  "createdBy": "parentUid",
  "expiresAt": 1751900000000,
  "members": {
    "parentUid": { "role": "parent", "addedAt": 1751896400000 },
    "childUid": { "role": "child", "addedAt": 1751896400000 }
  },
  "presence": {
    "parentUid": { "state": "joined", "ts": 1751896401000 }
  },
  "ritual": {
    "-pushId": {
      "type": "well_question_asked",
      "authorUid": "parentUid",
      "ts": 1751896410000
    }
  }
}
```

- **`members`** is a **map** (`{uid: {role, addedAt}}`), not an array — enables O(1) membership checks in rules.
- **Session root `.write`** is **create-only** (`!data.exists()`); updates use child paths (`members/`, `presence/`, `ritual/`) so members cannot write each other's presence leaves.
- **`ritual`** events are coordination pings only — not system of record; trigger Firestore writes or UI transitions.
- **`expiresAt`** must be future at write time; rules do not auto-delete — client refuses expired sessions; optional Cloud Function prune is follow-up.

Types: [`shared/rtdb/sessionTypes.ts`](../shared/rtdb/sessionTypes.ts)

## Client write patterns

### Allowed

| Action               | Path                              | Notes                                                                          |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| Create session       | `sessions/{id}`                   | Single atomic `set()` with `createdBy`, `members` (self included), `expiresAt` |
| Add member           | `sessions/{id}/members/{newUid}`  | Existing member only                                                           |
| Own session presence | `sessions/{id}/presence/{ownUid}` | `onDisconnect` on same path                                                    |
| Ritual event         | `sessions/{id}/ritual/{key}`      | `authorUid` must equal auth uid (rule-enforced)                                |
| Top-level presence   | `presence/{ownUid}`               | `{ state: 'online'\|'offline', lastSeen: number }`                             |

### Not allowed (client)

- Edit another member's presence or role
- Change `createdBy` after creation
- Set `expiresAt` in the past
- Write unknown keys under session (`$other: false`)
- Profile, economy, journal data in RTDB

## Rules

Auth-scoped, deny-by-default. See [`database.rules.json`](../database.rules.json).

- `presence/{uid}` — owner read/write; validated shape
- `sessions/{sessionId}` — member read/write; membership-map model
- `_dev/{uid}` — owner smoke tests

Audit: [`docs/security-rules-audit.md`](security-rules-audit.md)

## Migration (sessions rules tightening)

1. **Backfill:** Not required — no live session product data; discard any ad-hoc test nodes.
2. **Client:** Use `createCoSession()` — never multi-step session create.
3. **Deploy:** `npm run test:rtdb-rules` then `npm run deploy:database-rules`

## Ops checklist

1. `EXPO_PUBLIC_FIREBASE_DATABASE_URL` in `.env`
2. `npm run verify:firebase-rtdb-env` — env + app.config mapping
3. `npm run test:rtdb-rules` — emulator rules tests
4. `npm run deploy:database-rules` — deploy [`database.rules.json`](../database.rules.json)
5. `npm run setup:eas-rtdb-env` — EAS development + production
6. After sign-in: `pingRealtimeDb()` from [`realtimeDb.ts`](../src/services/firebase/realtimeDb.ts)

## Follow-up (not blocking)

- Cloud Function to prune `sessions` where `expiresAt < now`
- Well co-session UI wiring Silver Key invite → `addSessionMember`
