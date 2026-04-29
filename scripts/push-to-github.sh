#!/bin/sh
# Push this repo to a new GitHub remote (requires Git CLI + SSH auth or HTTPS credentials).
# Usage: ./scripts/push-to-github.sh git@github.com:YOUR_USER/into-the-pond-v3.git
set -e
REPO_URL="${1:?Usage: $0 <git-remote-url>}"
cd "$(dirname "$0")/.."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main
git push origin foundations-v1
