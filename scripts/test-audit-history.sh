#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:5175}"
PAGE="${2:-http://localhost:3000/__test__/all-bad}"

echo "Open: $BASE/audit"
echo "Run audit for: $PAGE"
