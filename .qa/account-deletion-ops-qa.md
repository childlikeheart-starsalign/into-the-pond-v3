# Account deletion ops QA (A + ops) — 2026-07-23

Deployed deletion callables to `into-the-pond` (`asia-east2`) with `ACCOUNT_DELETION_SECRET` + `ACCOUNT_DELETION_ENABLED=true` via inject → deploy → scrub. Local tracked [`functions/.env.into-the-pond`](../functions/.env.into-the-pond) is scrubbed (`ENABLED=false`, no secret). Runtime keeps last deploy until the next functions deploy.

## Device checklist (signed-in only)

Use a disposable test account if possible.

1. Sign in (production / preview build pointing at `into-the-pond`).
2. Folio / Gate → **Delete account** → type `DELETE` → confirm.
3. Expect success and sign-out — **no** pink `INTERNAL`.
4. Sign in again → land on **Deletion pending**.
5. Tap **Keep my sanctuary** (formerly Cancel deletion) → profile restored; reach Sanctuary.

Skip web / store URL (deferred).

## Pass criteria

- [x] Delete succeeds without INTERNAL
- [x] Pending screen appears on re-login (screenshot 2026-07-23)
- [ ] Cancel / Keep my sanctuary restores access — recommended once after copy refresh

Record: delete → pending path passed via device screenshot showing scheduled deletion date and pending UI.
