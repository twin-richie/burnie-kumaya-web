#!/usr/bin/env bash
set -euo pipefail

LABEL="com.burnie.kumaya.web"
USER_HOME="/Users/twin"
PLIST_DEST="$USER_HOME/Library/LaunchAgents/$LABEL.plist"

launchctl bootout "gui/$(id -u)" "$PLIST_DEST" >/dev/null 2>&1 || true
rm -f "$PLIST_DEST"

echo "Uninstalled $LABEL"
