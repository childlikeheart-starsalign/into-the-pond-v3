# createChildProfile callable — deploy / rollback

## Pre-deploy profile note (createCast class)

Live `createCast` (asia-east2) is provisioned at **256Mi**. Recent createCast logs show
auth/token noise; prior healthcheck failures on this project were tied to under-provisioned
cold starts. `createChildProfile` is deployed with the same **256MiB / 60s** envelope.

## Rollback (first deploy)

`createChildProfile` was not previously live. Rollback options:

1. **Preferred while unused by clients:** delete the function  
   `npx firebase-tools functions:delete createChildProfile --region asia-east2 --project into-the-pond`
2. **If a prior revision exists later:** redeploy the previous git SHA’s functions package  
   for `functions:createChildProfile` only.

## Deploy

```bash
cd functions && npm run build   # or rely on firebase predeploy
cd .. && npx firebase-tools deploy --only functions:createChildProfile --project into-the-pond
```

No `--force`.
