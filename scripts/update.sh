#!/usr/bin/env bash
# Circle Nurture — update script.
# Pulls the latest merged batch from main and rebuilds. Safe to re-run any time;
# each merge-train batch (CONTROL/CHANGELOG.md) lands here as one atomic stamp.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Circle Nurture — updating to latest build..."
git fetch origin
git checkout main
git pull --ff-only origin main

echo "Installing dependencies..."
npm ci

echo "Building..."
npm run build

echo "Done. Latest tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'none yet')"
echo "See CONTROL/CHANGELOG.md for what's new, and CONTROL/LEDGER.md for what's still pending."
