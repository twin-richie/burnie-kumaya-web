#!/usr/bin/env bash
set -euo pipefail

LABEL="com.burnie.kumaya.web"
USER_HOME="/Users/twin"
REPO="/Users/twin/Context/burnie/web"
PLIST_SRC="$REPO/ops/launchd/$LABEL.plist"
PLIST_DEST="$USER_HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$USER_HOME/Library/LaunchAgents" "$REPO/logs"
cp "$PLIST_SRC" "$PLIST_DEST"

launchctl bootout "gui/$(id -u)" "$PLIST_DEST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Installed and started $LABEL from $PLIST_DEST"
echo "Local URL: http://127.0.0.1:8080"
