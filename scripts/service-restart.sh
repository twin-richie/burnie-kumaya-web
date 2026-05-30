#!/usr/bin/env bash
set -euo pipefail

LABEL="com.burnie.kumaya.web"
REPO="/Users/twin/Context/burnie/web"

cd "$REPO"
npm run check
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Restarted $LABEL after successful checks"
