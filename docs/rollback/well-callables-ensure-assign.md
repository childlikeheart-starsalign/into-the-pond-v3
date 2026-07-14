# ensureWellState + getOrAssignTodaysQuestion — deploy / rollback

## Pre-deploy profile note (createCast class)

Live `createCast` / `createChildProfile` (asia-east2) use **256MiB / 60s**. Prior
healthcheck failures on this project were tied to under-provisioned cold starts.
These two Well callables are redeployed with the same envelope after a FAILED state.

## Rollback

1. **Redeploy prior revision** of only these two functions from the previous git SHA.
2. **If unused and must clear FAILED:** delete per function
   `npx firebase-tools functions:delete ensureWellState --region asia-east2 --project into-the-pond`
   (and likewise `getOrAssignTodaysQuestion`). Prefer redeploy over delete while clients call them.

## Deploy

```bash
cd functions && npm run build
cd .. && npx firebase-tools deploy --only functions:ensureWellState,functions:getOrAssignTodaysQuestion --project into-the-pond
```

No `--force`. Scope: these two function IDs only.
