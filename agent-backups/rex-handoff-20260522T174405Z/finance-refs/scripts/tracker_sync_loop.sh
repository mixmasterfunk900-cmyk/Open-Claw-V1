#!/usr/bin/env bash
set -u
ROOT=/root/.openclaw/workspace/youtube-automation-finance
RUN=finance-v2-rerun-20260520T191342Z
VID=credit-card-minimum-payment-trap
LOG="$ROOT/videos/$VID/logs/tracker_sync_loop.log"
PIDFILE="$ROOT/videos/$VID/logs/tracker_sync_loop.pid"
echo $$ > "$PIDFILE"
while true; do
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  {
    echo "[$ts] sync start"
    cp "$ROOT/logs/${RUN}_tracker.csv" "$ROOT/videos/$VID/logs/task_tracker.csv" 2>&1 || true
    cp "$ROOT/logs/${RUN}_tracker.md" "$ROOT/videos/$VID/logs/task_tracker.md" 2>&1 || true
    if command -v rclone >/dev/null 2>&1; then
      rclone copy "$ROOT/logs/${RUN}_tracker.csv" gdrive: --drive-root-folder-id 10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y --drive-stop-on-upload-limit --stats-one-line -v 2>&1
      rc=$?
      echo "[$ts] drive_csv_sync_exit=$rc"
      rclone copy "$ROOT/logs/${RUN}_tracker.md" gdrive: --drive-root-folder-id 10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y --drive-stop-on-upload-limit --stats-one-line -v 2>&1
      rc=$?
      echo "[$ts] drive_md_sync_exit=$rc"
    else
      echo "[$ts] rclone missing; local-only tracker sync"
    fi
  } >> "$LOG" 2>&1
  sleep 300
done
