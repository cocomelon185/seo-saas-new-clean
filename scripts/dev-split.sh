#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

( cd "$ROOT/services/node-api" && node dev-server.js ) &
( cd "$ROOT/apps/web" && npm run dev ) &
wait
