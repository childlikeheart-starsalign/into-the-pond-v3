#!/usr/bin/env bash
# Step 2 — second planner pass on the SAME approved input (idempotency).
# No new export. No rollback artifacts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -t 0 ]] || [[ "${CONFIRM_MIGRATION_AUDIT:-}" != "I_UNDERSTAND_DRY_RUN_ONLY" ]]; then
  echo "WARNING: run scripts/migration-audit-step0-guard.sh first (interactive + CONFIRM_MIGRATION_AUDIT)."
  exit 1
fi

read -r -p "Path to the SAME approved input used in step 1: " MIG_INPUT
test -f "$MIG_INPUT" || { echo "missing input: $MIG_INPUT"; exit 1; }

read -r -p "Re-run planner for idempotency on the SAME input? Type YES: " ACK2
[[ "$ACK2" == "YES" ]] || exit 1

node --import tsx scripts/migrate-children-from-flat.ts \
  --input="$MIG_INPUT" \
  --interactive

echo ""
echo "HALT: compare scanned / would-migrate / skip:* with step 1 stdout."
echo "Do NOT generate rollback artifacts here. Export/rollback require a separate Change Request."
