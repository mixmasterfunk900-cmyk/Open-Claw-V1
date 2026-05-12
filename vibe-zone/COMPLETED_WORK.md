# Completed Work

## 2026-05-12
- Built custom downloader wrapper `scripts/vibe-download.mjs` with multiple safe yt-dlp strategies.
- Added drag/drop upload endpoint and UI.
- Added client-side upload percentage display.
- Redesigned dashboard in a light logistics/control-tower style.
- Confirmed uploaded stream file landed successfully.
- Ran Whisper transcription on uploaded stream.
- Imported transcript and generated clip candidates.
- Rendered three vertical subtitle-burned MP4 clips.
- Verified rendered clips with ffprobe.
- Created durable project orchestration files: `PROJECT_STATE.md`, `CURRENT_OBJECTIVE.md`, `TASK_QUEUE.md`, `KNOWN_ISSUES.md`, `ARCHITECTURE_NOTES.md`, `COMPLETED_WORK.md`.

- Added safe local media listing and serving endpoints.
- Added rendered clip review queue with video previews and open/download links in Media Pipeline.
- Restarted Vibe Zone dev server so tunnel users get the latest UI/API.
- Added `/api/health` for cron/dev checks.
- Added Clip Factory review controls for idea/draft/reviewed/exported and platform target.
- Updated auto-render selection to prefer high-scoring non-duplicate playable clips.
- Added punchy ASS subtitle generation and produced three verified 64s punchy-caption MP4 renders for the newest stream.
- Captured Opus Clip parity gaps: semantic scoring, caption presets, B-roll/title cards, selected-clip rendering, platform export bundles.

- Researched Shorts/TikTok caption styling; adopted bold centered 1–2 word caption style with strong outline.
- Fixed duplicate-overlap selection logic in the render pipeline.
- Generated `dejKxLu_iM0.punchy.ass` captions positioned higher in the safe zone.
- Re-rendered three punchy subtitle-safe clips and verified them with ffprobe + visual frame inspection.

- Confirmed existing 30-minute recurring Vibe Zone HQ check is active.
- Spawned competitor gap research subtask for Opus/Captions/Submagic/Klap/Vidyo-style comparison.
- Added source media validation badges in Media Pipeline; `dejKxLu_iM0.mp4` now shows partial/corrupt with metadata duration 1:30:09 and decodable video through 25:27.
- Rebuilt and linted successfully after the validation UI/API change, then restarted the local Vibe Zone dev/API process.

- Captured Masala feedback that the current dashboard makeover is only ~2% of expected UX/design work. Created `UX_REDESIGN_BRIEF.md` and added UX redesign as a high-priority workflow.
- Added selected-clip rendering from Clip Factory: `/api/clips/:id/render` now validates newest-stream scope, blocks renders beyond partial source duration, runs ffmpeg for playable clips, and links render metadata back to the clip.
- Smoke-tested selected render: late 52:48 candidate correctly blocked by partial source; early 11:15-12:18 candidate rendered successfully to `media/renders/dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4` (63s, 17 MB).

- Added API setup reminder to project queue; local Ollama embedding path remains first choice for now.
- Added manual upload bundle workflow: Clip Factory can generate `upload-card.md` + `metadata.json` under `media/exports/*`, mark clips exported, and link the upload card without posting externally.
