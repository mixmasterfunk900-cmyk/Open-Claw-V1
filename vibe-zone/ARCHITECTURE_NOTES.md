# Architecture Notes

## Current architecture
- Frontend: React + Vite, mostly single-file `src/App.tsx` with styling in `src/App.css`.
- Backend: local Node HTTP server in `server/server.mjs`.
- Persistence: local JSON file at `data/vibe-zone.json`.
- Media folders:
  - `media/downloads/` — uploaded/downloaded source media.
  - `media/transcripts/` — Whisper output artifacts.
  - `media/renders/` — generated clip renders.
- Tools:
  - `yt-dlp` project venv for public scanning/download attempts.
  - Whisper venv for transcription.
  - `ffmpeg` for rendering.

## Design constraints
- Bind locally only; access via SSH tunnel.
- No auto-posting or external social writes.
- No cookies/logins by default for YouTube extraction.
- Stream-safe: avoid exposing secrets/private files.

## Competitor/product gaps to close
- Opus Clip positions around one-click long-video-to-viral-clips, captions, B-roll, mid-form clips, and social publishing/scheduling.
- Vibe Zone should compete by being local-first, stream-safe, and transparent: no surprise posting, no cookie storage by default, clear job history, and owner-reviewed status gates.
- Missing parity/opportunity items: semantic viral scoring, caption style presets, optional B-roll/title-card generation, selected-clip rendering from the UI, and platform-specific export bundles.

## Next architecture step
Move from planned media jobs toward an actual local job runner that executes queued transcribe/render commands, records stdout/stderr, and updates status without requiring shell intervention.
