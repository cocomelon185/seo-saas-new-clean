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

if [[ -f "dist/app.html" ]]; then
  for p in \
    audit \
    rank \
    improve \
    upgrade \
    plan-change \
    account \
    admin \
    auth \
    embed \
    leads \
    r; do
    mkdir -p "dist/$p"
    cp -f "dist/app.html" "dist/$p/index.html"
  done
fi
