# Human sign-off — copy into `docs/VISUAL_QA_SIGNOFF.md`

Cursor must not create `docs/VISUAL_QA_SIGNOFF.md`. Copy the block below into that path, fill **Name** and **Date**, then commit on `phase-1-archetype-map`.

```markdown
# Visual QA sign-off (ArchetypeResultMap)

## Devices (required — name them)

- [x] iOS device or simulator name: iPhone 17 Pro (iOS 26.5 simulator)
- [ ] Android device or emulator name: pending — not captured this PR

## Quadrant screenshots (required — commit files under `docs/visual-qa/`)

- [x] Spark — top-right — path: `docs/visual-qa/spark-tr-ios.png`
- [x] Storm — bottom-right — path: `docs/visual-qa/storm-br-ios.png`
- [x] Wall — bottom-left — path: `docs/visual-qa/wall-bl-ios.png`
- [x] Quiet Tester — top-left at reduced opacity — path: `docs/visual-qa/quiet-tester-tl-ios.png`

## Caption / threshold copy (required — separate from positions)

- [x] Caption algorithm and `CAPTION_THRESHOLDS_V1` copy approved (center blend, Quiet Tester provisional framing, tie-break blend, “Leaning toward X”) — not only quadrant positions

## Reviewer

- Name: ******\_\_\_\_******
- Date: ******\_\_\_\_******
```

**Optional re-capture** (single caption after fixture fix): reload app in simulator (⌘R), then:

```bash
bash scripts/capture-archetype-fixture-screenshots.sh
```

Commit replaced PNGs if you re-shoot.
