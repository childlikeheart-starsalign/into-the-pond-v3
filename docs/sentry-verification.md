# Sentry verification (EAS production)

## Configuration status (2026-06-21)

| Step                                 | Status      | Notes                                                                                                         |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------- |
| 1. Sentry org/project created        | Done        | `childlike-heart` / `react-native`                                                                            |
| 2. Org/project placeholders replaced | Done        | [`app.config.js`](../app.config.js) (deduped plugin), [`eas.json`](../eas.json) `production.env`              |
| 3. EAS env vars for DSN + auth token | **Pending** | Requires `eas login` (or `EXPO_TOKEN`) on the build machine — see commands below                              |
| 4. Production iOS build              | **Pending** | Blocked on step 3                                                                                             |
| 5. Sentry release + source maps      | **Pending** | Sentry API shows zero releases for this project as of config apply                                            |
| 6. Test crash + symbolicated stack   | **Pending** | Use deep-link route below; remove route only after dashboard proof                                            |
| 7. Crash route removed               | **Pending** | [`app/sentry-verification-crash.tsx`](../app/sentry-verification-crash.tsx) still present until step 6 passes |

Local (gitignored): add `EXPO_PUBLIC_SENTRY_DSN` to `.env` (loaded by `app.config.js`) and keep `SENTRY_AUTH_TOKEN` in `.env.local` for CLI use. Do not commit real values.

## EAS environment variables (run after `eas login`)

From project root, with DSN and token available in the shell (e.g. `source .env.local` after setting `EXPO_PUBLIC_SENTRY_DSN` there):

```bash
eas env:create production --name EXPO_PUBLIC_SENTRY_DSN --value "$EXPO_PUBLIC_SENTRY_DSN" --visibility plaintext --scope project --environment production --non-interactive --force

eas env:create production --name SENTRY_AUTH_TOKEN --value "$SENTRY_AUTH_TOKEN" --visibility secret --scope project --environment production --non-interactive --force
```

Legacy equivalent (deprecated but still works on some CLI versions):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "$EXPO_PUBLIC_SENTRY_DSN" --type string
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "$SENTRY_AUTH_TOKEN" --type string
```

## Build and dashboard checks

```bash
eas build --platform ios --profile production
```

After install (TestFlight or internal):

- [ ] Sentry **Releases** shows a release matching app version + EAS build number (e.g. `3.0.0` + autoIncrement).
- [ ] Release detail lists uploaded **source maps / debug files**.
- [ ] Production verification crash: open `intothepond://sentry-verification-crash`, tap **Send test crash** once; confirm issue stack points at `app/sentry-verification-crash.tsx`, not a minified bundle.
- [ ] Remove [`app/sentry-verification-crash.tsx`](../app/sentry-verification-crash.tsx) in a follow-up commit; confirm via `git diff` that no crash trigger remains.

The verification route is **not linked from app navigation** — deep link only.

## Manual capture sites (sanity)

Trigger or simulate where possible:

| Area              | File                                        | Signal                                                        |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------- |
| RevenueCat        | `src/services/revenuecat/client.ts`         | `captureMessage` / `captureException` with `area: revenuecat` |
| Cast reconcile    | `src/features/fishing/fishingServerCast.ts` | Breadcrumbs `cast_reconciliation` on desync                   |
| User doc listener | `src/services/firebase/playerRods.ts`       | `captureException` with `area: user_doc_hydration`            |

## PII

- Init `beforeSend` strips `user.email` and redacts `@` in breadcrumb messages.
- App sets Sentry user as `{ id: uid }` only — never email.

## Verified (fill in after Task 3)

- Build ID:
- Release string:
- Sentry issue link/ID:
- Symbolicated frame file:line:
- Date:
