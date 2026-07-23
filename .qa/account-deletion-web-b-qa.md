# Account deletion web path (B) QA — 2026-07-23

## Prerequisites

- Hosting deployed ([`docs/firebase-hosting-delete-account.md`](../docs/firebase-hosting-delete-account.md))
- Functions deployed with `ACCOUNT_DELETION_ENABLED=true`, `ACCOUNT_DELETION_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Resend domain / from-address verified

## Checklist

1. [ ] Open `https://into-the-pond.web.app/delete-account` (or custom domain when SSL ready)
2. [ ] Unknown email → generic success message; no Resend delivery
3. [ ] Real account email → inbox receives confirm link (no token in Cloud logs)
4. [ ] Open link → **Confirm deletion** → success copy with purge date
5. [ ] Sign in to app → deletion-pending → **Keep my sanctuary** restores access
6. [ ] Bad/expired token → calm error on confirm page
7. [ ] Login footer + Gate “delete without signing in” open the live URL
8. [ ] Paste `https://intothepond.app/delete-account` into App Store Connect / Play Console

## Store paste

URL for both stores:

`https://intothepond.app/delete-account`
