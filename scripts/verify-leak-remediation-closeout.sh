#!/bin/sh
# Verify git/remote sync close-out after Firebase native config history purge.
# Automated checks only; secret-scanning alert resolution is manual in GitHub UI.
set -e
cd "$(dirname "$0")/.."

ORIGIN_REPO="childlikeheart-starsalign/into-the-pond-v3"

echo "Fetching origin/main..."
git fetch origin main 2>/dev/null || true

LOCAL_SHA=$(git rev-parse main)
ORIGIN_SHA=$(git rev-parse origin/main 2>/dev/null || echo "")

echo "=== Git / remote sync close-out verification ==="
echo ""
echo "Local main:  ${LOCAL_SHA}"
echo "origin/main: ${ORIGIN_SHA:-<missing — run: git fetch origin main>}"

if [ -n "$ORIGIN_SHA" ] && [ "$LOCAL_SHA" = "$ORIGIN_SHA" ]; then
  echo "  ✓ local and origin/main match"
elif [ -n "$ORIGIN_SHA" ] && git merge-base --is-ancestor "$ORIGIN_SHA" "$LOCAL_SHA" 2>/dev/null; then
  AHEAD=$(git rev-list --count "${ORIGIN_SHA}..${LOCAL_SHA}" 2>/dev/null || echo "?")
  echo "  ⚠ local is ${AHEAD} commit(s) ahead of origin/main (unpushed)"
  echo "    Run: git push origin main"
  echo "    Then re-run: npm run verify:leak-remediation-closeout"
  exit 1
elif [ -n "$ORIGIN_SHA" ] && git merge-base --is-ancestor "$LOCAL_SHA" "$ORIGIN_SHA" 2>/dev/null; then
  echo "  ✗ origin/main is ahead of local — run: git pull origin main"
  exit 1
else
  echo "  ✗ local and origin/main have diverged — resolve before close-out"
  exit 1
fi

HIST_COUNT=$(git log --all --oneline -- assets/google-services.json assets/GoogleService-Info.plist google-services.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$HIST_COUNT" = "0" ]; then
  echo "  ✓ no Firebase native config paths in git history"
else
  echo "  ✗ $HIST_COUNT commits still reference leaked paths"
  exit 1
fi

npm run verify:no-firebase-secrets --silent 2>/dev/null || npm run verify:no-firebase-secrets
echo "  ✓ verify:no-firebase-secrets"

echo ""
echo "Raw GitHub URLs (expect 404):"
FAIL=0
for path in \
  "assets/google-services.json" \
  "assets/GoogleService-Info.plist" \
  "google-services.json"; do
  url="https://raw.githubusercontent.com/${ORIGIN_REPO}/main/${path}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [ "$code" = "404" ]; then
    echo "  ✓ ${path} → HTTP ${code}"
  else
    echo "  ✗ ${path} → HTTP ${code} (expected 404)"
    FAIL=1
  fi
done

echo ""
echo "CI on main (public API):"
CI_JSON=$(curl -s "https://api.github.com/repos/${ORIGIN_REPO}/actions/workflows/ci.yml/runs?branch=main&per_page=1")
CI_SHA=$(node -e "const r=JSON.parse(process.argv[1]).workflow_runs?.[0]; process.stdout.write(r?.head_sha?.slice(0,7)||'')" "$CI_JSON" 2>/dev/null || echo "")
CI_CONC=$(node -e "const r=JSON.parse(process.argv[1]).workflow_runs?.[0]; process.stdout.write(r?.conclusion||'unknown')" "$CI_JSON" 2>/dev/null || echo "unknown")
CI_URL=$(node -e "const r=JSON.parse(process.argv[1]).workflow_runs?.[0]; process.stdout.write(r?.html_url||'')" "$CI_JSON" 2>/dev/null || echo "")
RUN_ID=$(node -e "const r=JSON.parse(process.argv[1]).workflow_runs?.[0]; process.stdout.write(String(r?.id||''))" "$CI_JSON" 2>/dev/null || echo "")

if [ "$CI_CONC" = "success" ]; then
  echo "  ✓ CI workflow: ${CI_CONC} (head ${CI_SHA})"
  echo "    ${CI_URL}"
  if [ -n "$RUN_ID" ]; then
    JOBS_JSON=$(curl -s "https://api.github.com/repos/${ORIGIN_REPO}/actions/runs/${RUN_ID}/jobs")
    node -e "
const jobs=JSON.parse(process.argv[1]).jobs||[];
for (const j of jobs) {
  const mark=j.conclusion==='success'?'✓':'✗';
  console.log('    '+mark+' '+j.name+': '+j.conclusion);
}
" "$JOBS_JSON" 2>/dev/null || true
  fi
else
  echo "  ⚠ CI workflow: ${CI_CONC} (check ${CI_URL:-GitHub Actions})"
  echo "    Confirm manually: https://github.com/${ORIGIN_REPO}/actions/workflows/ci.yml"
fi

echo ""
echo "Manual steps (GitHub UI — requires login):"
echo "  • Secret scanning — into-the-pond-v3:"
echo "    https://github.com/${ORIGIN_REPO}/security/secret-scanning"
echo "  • Secret scanning — old repo alert #1:"
echo "    https://github.com/childlikeheart-starsalign/childlike-heart-parenting-course-index.html/security/secret-scanning/1"
echo "    Resolve as Revoked (rotated) or Resolved (restricted + history removed)"
echo ""
echo "Collaborators with pre-rewrite clones:"
echo "  git fetch --all && git reset --hard origin/main"
echo "  (or re-clone — see docs/security-firebase-key-leak.md)"

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
echo ""
echo "Automated close-out checks passed."
