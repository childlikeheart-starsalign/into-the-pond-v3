#!/usr/bin/env bash
# Capture iOS simulator screenshots for ArchetypeResultMap visual QA.
# Prereqs: Metro running, dev build open on booted simulator.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/visual-qa"
SCHEME="intothepond"

FILES=(spark-tr-ios.png storm-br-ios.png wall-bl-ios.png quiet-tester-tl-ios.png)
PRESETS=(spark storm wall quietTester)

mkdir -p "$OUT"

i=0
while [ "$i" -lt "${#FILES[@]}" ]; do
  file="${FILES[$i]}"
  preset="${PRESETS[$i]}"
  echo "Capturing $file (preset=$preset)…"
  xcrun simctl openurl booted "${SCHEME}://archetype-map-fixture?preset=${preset}"
  sleep 2
  xcrun simctl io booted screenshot "$OUT/$file"
  i=$((i + 1))
done

echo "Done — screenshots in $OUT"
