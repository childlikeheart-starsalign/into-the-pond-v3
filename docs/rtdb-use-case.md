# Realtime Database — use case decision

**Status:** Infrastructure ready; **no product feature uses RTDB yet.**

## Decision (current)

| Data / behavior                                                 | Store                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| User profile, wonder, rods, creatures, diary, well, Child Atlas | **Firestore** + WatermelonDB offline cache                     |
| Economy / progression writes                                    | **Cloud Functions** + Firestore                                |
| Real-time profile sync                                          | Firestore `onSnapshot` → [`src/db/sync.ts`](../src/db/sync.ts) |

**Do not** duplicate Firestore documents in RTDB without a clear latency or presence requirement.

## When to add RTDB feature code

Add paths + UI only when you need one of:

- **Presence** — `/presence/{uid}` with `onDisconnect` ([`setPresenceOnline`](../src/services/firebase/realtimeDb.ts))
- **Live co-session** — `/sessions/{sessionId}/...` for parent/child shared ritual state
- **High-frequency ephemeral state** — counters, cursors, short-lived flags

## Ops checklist

1. `EXPO_PUBLIC_FIREBASE_DATABASE_URL` in `.env` (done)
2. `npm run verify:firebase-rtdb-env` — env + app.config mapping
3. `npm run deploy:database-rules` — deploy [`database.rules.json`](../database.rules.json) (requires `npx firebase-tools login`)
4. `npm run setup:eas-rtdb-env` — copy URL from `.env` to EAS development + production (uses `npx eas-cli`)
5. After sign-in, optional app smoke test: `pingRealtimeDb()` from [`realtimeDb.ts`](../src/services/firebase/realtimeDb.ts)

## Rules

Auth-scoped, deny-by-default. Reserved paths:

- `presence/{uid}` — owner read/write
- `sessions/{sessionId}` — any authenticated user (tighten per session membership when implemented)
- `_dev/{uid}` — owner read/write for smoke tests
