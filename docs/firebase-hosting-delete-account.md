# Firebase Hosting — `intothepond.app` (account deletion)

Static site root: [`hosting/`](../hosting/). Canonical page:
[`hosting/delete-account/index.html`](../hosting/delete-account/index.html) →
`https://intothepond.app/delete-account`.

## Deploy hosting

```bash
npx firebase-tools deploy --only hosting --project into-the-pond
```

Default Hosting URL after first deploy: `https://into-the-pond.web.app/delete-account`
(use this for smoke tests before custom domain SSL is ready).

## Connect custom domain

1. Firebase Console → Hosting → **Add custom domain** → `intothepond.app`
2. Add the DNS records Firebase shows (A/AAAA or CNAME) at your DNS provider.
3. Wait for SSL provisioning.
4. Confirm `https://intothepond.app/delete-account` loads over HTTPS.

Optional: also add `www.intothepond.app` and redirect to apex if you use www.

## Functions env for web deletion emails

Inject into `functions/.env.into-the-pond` for deploy only (then scrub):

- `ACCOUNT_DELETION_ENABLED=true`
- `ACCOUNT_DELETION_SECRET=…` (from `.env.local`)
- `RESEND_API_KEY=…`
- `RESEND_FROM_EMAIL=Into the Pond <noreply@intothepond.app>` (domain must be verified in Resend)

```bash
npx firebase-tools deploy --only \
  functions:requestAccountDeletionByEmail,functions:confirmAccountDeletionWeb \
  --project into-the-pond
```

Keep secrets in `functions/.env.local` only after scrubbing the tracked env file.
