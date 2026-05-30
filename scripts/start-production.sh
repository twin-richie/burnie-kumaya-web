#!/usr/bin/env bash
set -euo pipefail

cd /Users/twin/Context/burnie/web

export NODE_ENV=production
export PORT="${PORT:-8080}"

exec npx next start -p "$PORT"
