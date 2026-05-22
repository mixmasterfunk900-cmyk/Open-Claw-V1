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
- Drafts/export bundles/schedules are safe; public posting, social account actions, logins, cookies, and API-key use require explicit approval unless policy changes.
- Platform-safe automation only: respect rate limits/rules, avoid spam/fake engagement/impersonation, and create native variants from clean masters instead of lazy reposts.
- No cookies/logins by default for YouTube extraction.
- Stream-safe: avoid exposing secrets/private files.

## Competitor/product gaps to close
- Opus Clip positions around one-click long-video-to-viral-clips, captions, B-roll, mid-form clips, and social publishing/scheduling.
- Vibe Zone should compete by being local-first, stream-safe, and transparent: no surprise posting, no cookie storage by default, clear job history, and owner-reviewed status gates.
- Missing parity/opportunity items: semantic viral scoring, caption style presets, optional B-roll/title-card generation, selected-clip rendering from the UI, and platform-specific export bundles.

## Content HQ architecture direction
- Add first-class entities for `asset`, `platformVariant`, `dispatchItem`, `analyticsSnapshot`, `winnerSignal`, `funnelCTA`, and `archiveEntry`.
- Preserve master media and render platform-native variants from it: Shorts/TikTok/Reels/Facebook/X/long-form/podcast.
- Build Dispatch as an approval/scheduling layer before any external integrations.
- Add Copy Studio and Thumbnail Lab as siblings to Render Lab, not as hidden fields in clip rows.
- Add Winner Radar to ingest manual/API analytics and trigger variant/repost/follow-up recommendations.
- Move to SQLite when JSON persistence becomes awkward for archive/search/analytics relationships.

## Processing / AI-compute boundary
- Video/audio mechanics must run as system jobs: `ffmpeg`, `ffprobe`, Whisper, yt-dlp/import, and future OpenCV/MediaPipe-style face tracking.
- Deterministic tasks should not call paid/large AI models: transcoding, resizing, caption burn-in, duration validation, file moves, retries, queue status, duplicate file checks, basic heuristics.
- AI/model usage is reserved for judgment tasks: summarization, hook/title variants, semantic topic grouping, tone matching, high-level clip scoring, and roadmap/research. Even these should have cheap/local/template fallbacks where possible.
- Current clip generation is heuristic/deterministic. Whisper transcription is local system compute. Rendering is ffmpeg system compute. Gemini/Codex should not be in the hot path for processing uploaded media.

## Next architecture step
Move from planned media jobs toward an actual local job runner that executes queued transcribe/render commands, records stdout/stderr, and updates status without requiring shell intervention. Keep this as the foundation for Content HQ automation.
