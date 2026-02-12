#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for file in $(find dist -type f -name "*.html"); do
  rel="${file#dist/}"
  if [[ "$rel" == "index.html" || "$rel" == "app.html" || "$rel" == "app-public.html" ]]; then
    continue
  fi
  target="dist/${rel%.html}/index.html"
  mkdir -p "$(dirname "$target")"
  cp -f "$file" "$target"
done
