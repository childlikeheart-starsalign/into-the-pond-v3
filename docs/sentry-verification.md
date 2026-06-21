# Sentry verification (EAS production)

## Configuration status (2026-06-21)

| Step                                 | Status      | Notes                                                                                                               |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Sentry org/project created        | Done        | `childlike-heart` / `react-native`                                                                                  |
| 2. Org/project placeholders replaced | Done        | [`app.config.js`](../app.config.js) (deduped plugin), [`eas.json`](../eas.json) `production.env`                    |
| 3. EAS env vars for DSN + auth token | **Done**    | `EXPO_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` on `@childlike-heart/into-the-pond-v3` production env                |
| 4. EAS project linked                | **Done**    | `extra.eas.projectId` in [`app.json`](../app.json); `owner: childlike-heart` in [`app.config.js`](../app.config.js) |
| 5. Production iOS build              | **Blocked** | Apple distribution credentials not set up — requires interactive terminal (see below)                               |
| 6. Sentry release + source maps      | **Pending** | Blocked on step 5                                                                                                   |
| 7. Test crash + symbolicated stack   | **Pending** | Use deep-link route after TestFlight install; remove route only after dashboard proof                               |
| 8. Crash route removed               | **Pending** | [`app/sentry-verification-crash.tsx`](../app/sentry-verification-crash.tsx) still present                           |

Local (gitignored): `EXPO_PUBLIC_SENTRY_DSN` in `.env`; `SENTRY_AUTH_TOKEN` in `.env.local`. Do not commit real values.

## Unblock production build (run in your terminal)

EAS cloud/local builds failed with: _Distribution Certificate is not validated for non-interactive builds._ Agent shells cannot answer credential prompts — run these **in your Mac terminal** (with TTY):

```bash
cd /path/to/into-the-pond-v3
npx eas-cli login          # if not already logged in
npx eas-cli credentials:configure-build -p ios -e production
npx eas-cli build --profile production --platform ios
```

Follow prompts to link your Apple Developer account and generate/store distribution credentials on Expo.

## EAS environment variables (already applied)

```bash
# Verify names exist (values hidden):
npx eas-cli env:list --environment production
```

Expected: `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, plus profile env `SENTRY_ORG` / `SENTRY_PROJECT` from [`eas.json`](../eas.json).

## Build and dashboard checks

After TestFlight/internal install:

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
