#!/usr/bin/env bash
set -u
bot_id="${1:-bot}"
title="${2:-OpenClaw Bot}"
session_id="${3:-grid-session}"
openclaw_agent="${4:-main}"
role_card="${5:-.openclaw-grid/roles/${bot_id}.md}"

[ -n "${TERM:-}" ] && [ "$TERM" != "dumb" ] && clear
printf 'OpenClaw Grid\n'
printf '%s\n' "$title"
printf 'Session: %s\n' "$session_id"
printf 'Role: %s\n\n' "$role_card"

while true; do
  printf 'You > '
  IFS= read -r msg || exit 0
  [ -z "$msg" ] && continue
  runtime_file=".openclaw-grid/master/runtime.env"
frontend_url="http://127.0.0.1:5173/"
gateway_url="http://127.0.0.1:18789/"
if [ -f "$runtime_file" ]; then
  # shellcheck disable=SC1090
  . "$runtime_file"
  frontend_url="${VIBE_FRONTEND_URL:-$frontend_url}"
  gateway_url="${OPENCLAW_GATEWAY_URL:-$gateway_url}"
fi
payload="${title}. Role card: ${role_card}. Frontend URL: ${frontend_url}. OpenClaw gateway URL: ${gateway_url}. Use these URLs by default; do not guess alternate ports unless you verify them first.

User request:
${msg}"
  printf '\n'
  openclaw agent --local --agent "$openclaw_agent" --session-id "$session_id" --message "$payload"
  printf '\n'
done
