# Visual regression tooling search (Phase 0)

Searched this repo before Phase 1 map work. **Do not install** image-snapshot /
Detox / Maestro / Chromatic as part of the map or switcher PRs.

| Tool                  | Found? |
| --------------------- | ------ |
| jest-image-snapshot   | No     |
| Detox project         | No     |
| Maestro flows         | No     |
| Storybook / Chromatic | No     |

Phase 1 visual gate: human-committed `docs/VISUAL_QA_SIGNOFF.md` + screenshots
under `docs/visual-qa/` (see `docs/VISUAL_QA_SIGNOFF_TEMPLATE.md`). CI enforces
presence in the same PR when `src/components/archetype/**` changes.
