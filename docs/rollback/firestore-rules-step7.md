# Firestore rules rollback — step 7 (children)

Incident rollback for the multi-child rules deploy. Keep this folder committed;
do not rely on `/tmp` or untracked `tmp/` copies.

## Pre-step-7 baseline (Track A already live)

| Item               | Value                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Snapshot file      | [`firestore.rules.pre-step7-track-a-baseline.rules`](./firestore.rules.pre-step7-track-a-baseline.rules)     |
| Capture metadata   | [`firestore.rules.pre-step7-track-a-baseline.raw.txt`](./firestore.rules.pre-step7-track-a-baseline.raw.txt) |
| Ruleset at capture | `2277abfc-6daf-4811-a38a-be37c07d8948`                                                                       |

**Included in baseline:** Track A `clientSafeUpdateKeysOnly`, `fishingPity` economy key, `castCreateRequests` match.

**Not included:** children tier-gating, catch-all `children` exclude, `featureFlags/{flagName}`, `activeChildId` in the client-safe update allow-list.

## Rollback step 7 → pre-step-7 baseline

```bash
cp docs/rollback/firestore.rules.pre-step7-track-a-baseline.rules firestore.rules
cd functions && npm run deploy:firestore-rules
cd .. && cd functions && npm run get:firestore-rules
# Confirm MATCH against docs/rollback/firestore.rules.pre-step7-track-a-baseline.rules
```

## Notes

- Admin SDK / Cloud Functions bypass security rules; client deny of `deletionStatus` /
  `deletionPurgeAt` does not block deletion callables or purge jobs.
- Deploy via `functions` `deploy:firestore-rules` (createRuleset + release). No `--force`.
- After any rollback, re-run `npm run test:firestore-rules` against the restored file.
