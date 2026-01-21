#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for p in pricing audit rank improve; do
  mkdir -p "dist/$p"
  cp -f "dist/$p.html" "dist/$p/index.html"
done
