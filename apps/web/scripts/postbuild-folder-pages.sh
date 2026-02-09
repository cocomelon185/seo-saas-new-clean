#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for p in \
  pricing \
  about \
  changelog \
  start \
  shared \
  use-cases/saas-landing-audit \
  use-cases/blog-audit-checklist \
  use-cases/agency-audit-workflow; do
  if [[ -f "dist/$p.html" ]]; then
    mkdir -p "dist/$p"
    cp -f "dist/$p.html" "dist/$p/index.html"
  fi
done
