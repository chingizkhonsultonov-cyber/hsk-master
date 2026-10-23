#!/usr/bin/env bash
# Builds the static site and publishes it to the gh-pages branch (GitHub Pages),
# with the recorded audio from the audio branch (made by .github/workflows/audio.yml) under /audio.
set -euo pipefail
cd "$(dirname "$0")/.."
NEXT_PUBLIC_BASE_PATH=/hsk-master npm run build:static
touch out/.nojekyll
remote=$(git remote get-url origin)
audio=${AUDIO_DIR:-.audio-cache}
mkdir -p "$(dirname "$audio")" && audio=$(cd "$(dirname "$audio")" && pwd)/$(basename "$audio")
if [ -d "$audio/.git" ]; then
  git -C "$audio" fetch -q --depth=1 origin audio && git -C "$audio" reset -q --hard FETCH_HEAD || true
elif git ls-remote --exit-code "$remote" audio >/dev/null 2>&1; then
  git clone -q --depth=1 --branch audio "$remote" "$audio"
fi
if [ -d "$audio/.git" ]; then
  mkdir -p out/audio
  git -C "$audio" archive HEAD | tar -x -C out/audio
fi
cd out
rm -rf .git
git init -q -b gh-pages
# Knowing the audio commit locally lets the push skip the clips GitHub already has.
[ -d "$audio/.git" ] && git fetch -q "$audio" HEAD:refs/remotes/origin/audio || true
git add -A
git -c user.name=claude -c user.email=noreply@anthropic.com commit -q -m "Publish the app to GitHub Pages"
git push -f "$remote" gh-pages
rm -rf .git
