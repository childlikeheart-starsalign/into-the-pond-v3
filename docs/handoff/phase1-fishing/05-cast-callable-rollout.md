# Fishing cast callable rollout (PR-7) — retired

## Current state

`createCast` HTTPS callable is the **only** cast-create path.

The dual path has been removed:

- `processCastCreateRequest` (Firestore `onDocumentCreated` trigger on `users/{uid}/castCreateRequests/{requestId}`)
- `requestCreateCast` client helper
- `fishingCastCallable` feature-flag scaffolding

Clients always call `createCast` with a stable `requestId` (AsyncStorage pending-request helpers remain for callable idempotency on retry).

## Deploy note

Redeploy Cloud Functions so the retired `processCastCreateRequest` trigger is removed from the project. Redeploy Firestore rules so the `castCreateRequests` match is no longer published.

## Rollback

There is no flag-based rollback to the trigger path. If cast create regresses after this retirement, fix/redeploy `createCast` (or temporarily restore the trigger from git history in an emergency hotfix).
