#!/bin/sh
# Finish leak remediation: force-push cleaned history and verify raw URLs 404.
# Requires: git filter-repo already run (see docs/security-firebase-key-leak.md).
set -e
cd "$(dirname "$0")/.."

ORIGIN_REPO="childlikeheart-starsalign/into-the-pond-v3"
OLD_REPO="childlikeheart-starsalign/childlike-heart-parenting-course-index.html"

echo "Force-pushing clean history to into-the-pond-v3..."
git push --force-with-lease -u origin main

echo ""
echo "Verify raw GitHub URLs return 404 (no leaked native configs on main):"
for path in \
  "assets/google-services.json" \
  "assets/GoogleService-Info.plist" \
  "google-services.json"; do
  url="https://raw.githubusercontent.com/${ORIGIN_REPO}/main/${path}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  echo "  ${path} → HTTP ${code} (expect 404)"
done

echo ""
echo "Old repo branch (if still present):"
url="https://raw.githubusercontent.com/${OLD_REPO}/launch/v3-prep/google-services.json"
code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
echo "  launch/v3-prep/google-services.json → HTTP ${code} (expect 404)"

echo ""
echo "Next: restrict/rotate both Android + iOS API keys and resolve GitHub secret scanning alerts."
echo "See docs/security-firebase-key-leak.md"
