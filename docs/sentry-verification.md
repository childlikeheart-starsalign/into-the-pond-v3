# Sentry verification (EAS production)

## Configuration status

| Step                                    | Status      | Notes                                                                                                               |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Sentry org/project created           | Done        | `childlike-heart` / `react-native`                                                                                  |
| 2. Org/project placeholders replaced    | Done        | [`app.config.js`](../app.config.js) (deduped plugin), [`eas.json`](../eas.json) `production.env`                    |
| 3. EAS env vars for DSN + auth token    | Done        | `EXPO_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` on `@childlike-heart/into-the-pond-v3` production env                |
| 4. EAS project linked                   | Done        | `extra.eas.projectId` in [`app.json`](../app.json); `owner: childlike-heart` in [`app.config.js`](../app.config.js) |
| 5a. iOS export encryption (`infoPlist`) | Done        | `ITSAppUsesNonExemptEncryption: false` in [`app.json`](../app.json) — fixes EAS encryption prompt crash             |
| 5. Production iOS build                 | **Blocked** | **Apple Developer Program not enrolled** for the Apple ID used in EAS (`fungchj@gmail.com`)                         |
| 6. Sentry release + source maps         | Pending     | Blocked on step 5                                                                                                   |
| 7. Test crash + symbolicated stack      | Pending     | Deep-link route after TestFlight install; remove route only after dashboard proof                                   |
| 8. Crash route removed                  | Pending     | [`app/sentry-verification-crash.tsx`](../app/sentry-verification-crash.tsx) still present                           |

Local (gitignored): `EXPO_PUBLIC_SENTRY_DSN` in `.env`; `SENTRY_AUTH_TOKEN` in `.env.local`. Do not commit real values.

## Operational notes

- **EAS CLI:** use `npx eas-cli`, not global `eas` (not installed on this machine).
- **Secrets:** live only in `.env`, `.env.local`, and EAS production env — never in [`app.json`](../app.json), [`eas.json`](../eas.json), or git commits. If EAS init writes secrets into `app.json`, revert before committing (keep placeholders + `extra.eas.projectId` only).
- **Apple Developer Program:** required before steps 5–8. Currently **not enrolled** — production build and TestFlight verification are deferred.
- **Auth token:** org-scoped token in `.env.local` (`sntrys_…`) is used for EAS source-map upload. A user auth token (`sntryu_…`) pasted in chat returned 403 and should be **revoked** in Sentry → Settings → Auth Tokens. Do not paste tokens into chat or committed files.

## Token rotation (manual)

1. Sentry → **Settings → Auth Tokens** → revoke any exposed or unused tokens (including the `sntryu_…` token from chat).
2. Confirm the org-scoped token in `.env.local` still works (releases API should return HTTP 200).
3. If you create a new token, update **only** `.env.local`, then re-push to EAS:

```bash
cd ~/Documents/into-the-pond-v3
set -a && source .env.local && source .env && set +a
npx eas-cli env:create production \
  --name SENTRY_AUTH_TOKEN --value "$SENTRY_AUTH_TOKEN" \
  --visibility secret --scope project --environment production --non-interactive --force
```

## Unblock production build (after Apple Developer enrollment)

When [developer.apple.com/account](https://developer.apple.com/account) shows **Membership: Active**, run in your Mac terminal (TTY required for Apple prompts):

```bash
cd ~/Documents/into-the-pond-v3
npx eas-cli login
npx eas-cli credentials:configure-build -p ios -e production
npx eas-cli build --profile production --platform ios
```

At the encryption prompt, answer **yes** (standard/exempt) — `infoPlist` is already set in [`app.json`](../app.json).

Then TestFlight → `intothepond://sentry-verification-crash` → tap **Send test crash** once → confirm symbolicated stack in Sentry → delete the verification route file.

## EAS environment variables

```bash
npx eas-cli env:list --environment production
```

Expected names: `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, plus profile env `SENTRY_ORG` / `SENTRY_PROJECT` from [`eas.json`](../eas.json).

## Build and dashboard checks (after enrollment)

- [ ] Sentry **Releases** shows a release matching app version + EAS build number (e.g. `3.0.0` + autoIncrement).
- [ ] Release detail lists uploaded **source maps / debug files**.
- [ ] Production verification crash: open `intothepond://sentry-verification-crash`, tap **Send test crash** once; confirm issue stack points at `app/sentry-verification-crash.tsx`, not a minified bundle.
- [ ] Remove [`app/sentry-verification-crash.tsx`](../app/sentry-verification-crash.tsx) in a follow-up commit; confirm via `git diff` that no crash trigger remains.

The verification route is **not linked from app navigation** — deep link only.

## Manual capture sites (sanity)

| Area              | File                                        | Signal                                                        |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------- |
| RevenueCat        | `src/services/revenuecat/client.ts`         | `captureMessage` / `captureException` with `area: revenuecat` |
| Cast reconcile    | `src/features/fishing/fishingServerCast.ts` | Breadcrumbs `cast_reconciliation` on desync                   |
| User doc listener | `src/services/firebase/playerRods.ts`       | `captureException` with `area: user_doc_hydration`            |

## PII

- Init `beforeSend` strips `user.email` and redacts `@` in breadcrumb messages.
- App sets Sentry user as `{ id: uid }` only — never email.

## Verified (fill in after build + crash test)

- Build ID:
- Release string:
- Sentry issue link/ID:
- Symbolicated frame file:line:
- Date:
