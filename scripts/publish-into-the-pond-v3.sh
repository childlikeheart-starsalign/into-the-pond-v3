#!/bin/sh
# Publish Into the Pond v3 to the dedicated GitHub repo.
# Prerequisites: empty repo at git@github.com:childlikeheart-starsalign/into-the-pond-v3.git
# Create it at https://github.com/new?name=into-the-pond-v3 (no README/license).
set -e
cd "$(dirname "$0")/.."

NEW_REPO="git@github.com:childlikeheart-starsalign/into-the-pond-v3.git"
OLD_REPO="git@github.com:childlikeheart-starsalign/childlike-heart-parenting-course-index.html.git"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$NEW_REPO"
elif [ "$(git remote get-url origin)" != "$NEW_REPO" ]; then
  echo "origin is not $NEW_REPO — run: git remote set-url origin $NEW_REPO"
  exit 1
fi

if ! git remote get-url old-parenting-site >/dev/null 2>&1; then
  git remote add old-parenting-site "$OLD_REPO" 2>/dev/null || true
fi

echo "Checking SSH access to GitHub..."
ssh -T git@github.com || true

echo "Checking that $NEW_REPO exists..."
if ! git ls-remote "$NEW_REPO" HEAD >/dev/null 2>&1; then
  echo ""
  echo "Repository not found or not accessible."
  echo "Create an empty repo first: https://github.com/new?name=into-the-pond-v3"
  echo "Do NOT add README, .gitignore, or license."
  exit 1
fi

echo "Pushing main..."
git push -u origin main

echo "Pushing launch/v3-prep..."
git push -u origin launch/v3-prep

echo ""
echo "Done. Next steps on GitHub:"
echo "  1. Settings → Secrets → Actions → add EXPO_TOKEN (expo.dev access token)"
echo "  2. Actions → EAS Build → Run workflow (preview / ios)"
