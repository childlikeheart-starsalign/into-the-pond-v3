#!/usr/bin/env bash
# Step 0 — children migration audit guard (fail closed).
# Performs NO prod export, NO rollback generation, and writes NO durable files.
set -euo pipefail

if [[ ! -t 0 ]] || [[ "${CONFIRM_MIGRATION_AUDIT:-}" != "I_UNDERSTAND_DRY_RUN_ONLY" ]]; then
  echo "WARNING: children migration audit requires an interactive TTY and CONFIRM_MIGRATION_AUDIT=I_UNDERSTAND_DRY_RUN_ONLY"
  echo "This step performs NO prod export, NO rollback generation, and writes NO durable export files."
  exit 1
fi

echo "OK: migration audit guard passed (dry-run intent confirmed)."
echo "Next: run scripts/migration-audit-step1-dry-run.sh (planner only; no export)."
exit 0
