# Fishing & craft content — handoff package

## Start here

1. Open **`INSTRUCTIONS.docx`** — full brief for all five tasks.
2. Read everything in **`reference/`** before editing deliverables.
3. Fill in files under **`deliverables/`** and return that folder (+ audio files).

## Contents

| Path                                          | Purpose                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `INSTRUCTIONS.docx`                           | Main assignment (Tasks 1–5, submission checklist)                   |
| `reference/REFERENCE_FILES.md`                | Index of bundled source files in `reference/files/`                 |
| `reference/files/`                            | **Copies** of rod, craft, creature, and fishing engine source files |
| `reference/CURRENT_ENGINE_SUMMARY.md`         | Live engine vs target design                                        |
| `deliverables/01-audio-manifest.csv`          | Audio deliverable template                                          |
| `deliverables/02-fishing-outcomes-matrix.csv` | 150-row spreadsheet stub                                            |
| `deliverables/03-craft-journey-scenarios.md`  | 8 journey narrative template                                        |
| `deliverables/04-fishing-outcome-messages.md` | Copy template                                                       |
| `deliverables/05-probability-tables.md`       | Probability spec template                                           |
| `scripts/`                                    | Regenerate docx/CSV if instructions change (optional)               |

## Regenerating instructions (maintainers)

```bash
python3 -m venv .venv-handoff
.venv-handoff/bin/pip install python-docx
.venv-handoff/bin/python docs/handoff/fishing-craft-content-helper/scripts/generate-outcomes-matrix.py
.venv-handoff/bin/python docs/handoff/fishing-craft-content-helper/scripts/generate-instructions-docx.py
```
