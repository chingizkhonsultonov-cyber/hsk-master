#!/usr/bin/env bash
# Builds the static site and publishes it to the gh-pages branch (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
NEXT_PUBLIC_BASE_PATH=/hsk-master npm run build:static
touch out/.nojekyll
remote=$(git remote get-url origin)
cd out
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name=claude -c user.email=noreply@anthropic.com commit -q -m "Publish the app to GitHub Pages"
git push -f "$remote" gh-pages
rm -rf .git
