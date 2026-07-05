#!/bin/sh
# Finish leak remediation: force-push cleaned history and verify raw URLs 404.
# Requires: git filter-repo already run (see docs/security-firebase-key-leak.md).
set -e
cd "$(dirname "$0")/.."

ORIGIN_REPO="childlikeheart-starsalign/into-the-pond-v3"
OLD_REPO="childlikeheart-starsalign/childlike-heart-parenting-course-index.html"

echo "Fetching origin/main (refreshes lease after filter-repo / stale remote-tracking ref)..."
git fetch origin main

REMOTE_SHA=$(git rev-parse origin/main)
LOCAL_SHA=$(git rev-parse main)

echo "  local main:  ${LOCAL_SHA}"
echo "  remote main: ${REMOTE_SHA}"

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "Remote already matches local main — nothing to push."
else
  echo "Force-pushing rewritten history to into-the-pond-v3..."
  # Explicit lease: only overwrite if remote is still at the SHA we just fetched.
  # Fixes: ! [rejected] main -> main (stale info) after history rewrite.
  if ! git push --force-with-lease=main:"${REMOTE_SHA}" -u origin main; then
    echo ""
    echo "Push rejected. Remote main changed during fetch/push."
    echo "Re-run: git fetch origin main && ./scripts/finish-leak-remediation-push.sh"
    echo "If you intentionally need to overwrite remote anyway: git push --force origin main"
    exit 1
  fi
fi

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
