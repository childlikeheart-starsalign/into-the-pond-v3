# Create Child Profile — curtain / seam manual QA

Human visual check only. Do not automate — transitions need eyes on one curtain
without flash, pop-in, or double-layer.

**Accounts:** allowlisted Flag B accounts only (`rolloutState: allowlist`).  
**Do not** expand allowlist or flip `rolloutState` for this checklist.

## Transitions to check

| #   | Transition                                  | Expected                                                                                      | Pass |
| --- | ------------------------------------------- | --------------------------------------------------------------------------------------------- | ---- |
| 1   | **narrative-entry → Create Child Profile**  | Single curtain; profile screen appears behind/with one lift; no frame flash or second curtain | ☐    |
| 2   | **profile-exit (seal success) → sanctuary** | After add-child seal, one curtain into sanctuary; no double curtain; no trapped input         | ☐    |

For first-run (`entry=first_run`), post-seal destination is narrative onboarding rather than sanctuary; still watch for a **single** curtain and no pop-in on exit from the sealed ceremony.

## Failure notes

Record only symptom category + which transition (no PII):

- `double_curtain` / `flash` / `pop_in` / `trapped_input` / `other:<short>`

## Related

- Curtain implementation: `src/constants/curtainLift.ts`, `src/contexts/CurtainLiftContext.tsx`
- Post-seal navigation: `src/features/childProfile/CreateChildProfileScreen.tsx`
