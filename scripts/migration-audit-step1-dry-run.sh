#!/usr/bin/env bash
# Step 1 — planner-only dry-run against an already-approved local input.
# Do NOT chain with export or rollback. HALT after reviewing stdout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -t 0 ]] || [[ "${CONFIRM_MIGRATION_AUDIT:-}" != "I_UNDERSTAND_DRY_RUN_ONLY" ]]; then
  echo "WARNING: run scripts/migration-audit-step0-guard.sh first (interactive + CONFIRM_MIGRATION_AUDIT)."
  exit 1
fi

read -r -p "Path to APPROVED migration input JSON (fixture or CR-approved sample): " MIG_INPUT
test -f "$MIG_INPUT" || { echo "missing input: $MIG_INPUT"; exit 1; }

read -r -p "Type DRY-RUN to continue: " ACK
[[ "$ACK" == "DRY-RUN" ]] || exit 1

# Console summary only — no durable plan file (--write-plan is intentionally omitted).
node --import tsx scripts/migrate-children-from-flat.ts \
  --input="$MIG_INPUT" \
  --interactive

echo ""
echo "HALT: review stdout above before step 2 (idempotency re-run)."
echo "Next (same input only): scripts/migration-audit-step2-idempotency.sh"
