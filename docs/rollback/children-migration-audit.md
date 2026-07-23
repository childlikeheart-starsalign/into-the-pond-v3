# Children migration audit — security-gated procedure

Safe planner audit (no prod export, no rollback generation) is split into
**discrete steps**. Do **not** chain export + dry-run + rollback with `&&`.

## Safe path (fixture / CR-approved sample only)

```bash
# Step 0 — fail closed if non-interactive
export CONFIRM_MIGRATION_AUDIT=I_UNDERSTAND_DRY_RUN_ONLY
bash scripts/migration-audit-step0-guard.sh
# HALT — review output, then continue only in an interactive terminal

# Step 1 — planner dry-run (console only)
bash scripts/migration-audit-step1-dry-run.sh
# HALT — review scanned / would-migrate / skip:*

# Step 2 — idempotency re-run (same input)
bash scripts/migration-audit-step2-idempotency.sh
# HALT — compare summaries with step 1
```

Or via npm (still requires interactive TTY + `CONFIRM_MIGRATION_AUDIT`):

```bash
export CONFIRM_MIGRATION_AUDIT=I_UNDERSTAND_DRY_RUN_ONLY
npm run migrate:children:audit:step0
# then step1 / step2 separately
```

Default approved fixture for local planner checks: `tmp/children-migration-fixture.json`
(synthetic; not a production dump).

## [BLOCKED] without Change Request

| Operation                   | Why blocked                                           | Authorization                                      |
| --------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Live production user export | Rules: scope, exfiltration, long-running bundle, auth | `--change-request-id=CR-… --approved-by=<manager>` |
| Rollback-plan generation    | Separate change from dry-run audit                    | same flags                                         |

Placeholders (non-executable until CR exists — script paths intentionally not listed here):

```text
CHANGE-REQUEST-ID=<REQUIRED>
--approved-by=<REQUIRED_MANAGER>
# CR title examples:
#   "Children migration: authorized prod sample export"
#   "Children migration: rollback plan generation (dry-run ops only)"
```

**RED FLAG:** The safe audit path performs **no production export** and **no rollback generation**. Step 0 exits `1` when run non-interactively.
