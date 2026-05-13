# Project State — Vibe Zone

Last updated: 2026-05-13 08:27 UTC

## Current north star
Vibe Zone is Masala's local-first creator operations HQ, now expanding toward **Content HQ**: ingest livestreams, transcribe them, generate many clip candidates, render upload-ready clips with subtitles, create written/audio/social/owned-audience assets, track analytics, reinforce winners, and expose every Rex/job action in a stream-safe dashboard.

Full north-star spec: `CONTENT_HQ_MASTER_PLAN.md`.

## Current working state
- React/Vite UI with a redesigned light operations-dashboard theme.
- Local Node API on `127.0.0.1:8787`; Vite frontend on `127.0.0.1:5173`.
- Local JSON persistence at `data/vibe-zone.json`.
- Browser drag/drop upload works through SSH tunnel, with client-side upload percent.
- Stream 2 was imported locally as `media/downloads/stream-2.mp4` and remains renderable/exportable.
- `/api/health` currently reports `ok: true`; the newest stream source file for `SxOhgmSWqD4` (“Day 3 - Addicted to vibe coding LIVE”) validates complete through ~1:21:35 and local transcript/captions are present.
- The older `dejKxLu_iM0.mp4` remains partial/corrupt and should not be used for late-stream renders.
- Whisper generated Stream 2 transcript/subtitle artifacts.
- Clip candidates were generated from transcript text.
- Original renders exist plus new punchy subtitle-safe and facecam-right selected renders.
- API exposes media artifacts via `/api/media/files` and safe `/media/*` serving.
- Media Pipeline shows rendered review cards with video preview plus open/download links.
- Clip Factory can now build manual upload bundles (`upload-card.md` + `metadata.json`) for approved/rendered clips; no external posting is performed.
- Clip Factory render actions now have a preset selector for punchy captions, standard captions, clean/no-caption shorts, 50/50 facecam/B-roll layout, and long-form SRT caption renders.

## Latest verification
- Punchy subtitle ASS generated at `media/transcripts/dejKxLu_iM0.punchy.ass`.
- Three punchy MP4 renders generated and ffprobe-verified playable.
- Vision check confirmed captions are readable and in Shorts-safe position between center and bottom quarter.
- Build and lint pass after render preset selector addition.
- Created and ffprobe-verified clean/no-caption preset render: `media/renders/dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-no-captions.mp4` (63s).
- Created and served test bundle: `media/exports/clip_1778565945241_abb121-stop-overbuilding-and-ship-the-workflow/upload-card.md`.
- Added and smoke-tested the 50/50 facecam/B-roll render preset; test output probed at 1080x1920 for a 3s sample.
- Viral Hunter now stays scoped to Masala's newest stream, dedupes repeated lead backlog items, and frames leads with competitor-inspired patterns (money/proof, problem→fix, AI workflow reveal, curiosity hooks).
- Day 3 facecam-smart exports now exist for `Product or Content Machine?`, `AI Building More AI`, and `Quality First, Local First`, with proof frames/manual upload drafts.
- New Stream 2 facecam-smart export exists for `Should I Rename The Channel?` with YouTube Shorts/TikTok SEO, proof frames, thumbnail brief, and a refreshed focused-output card.
- Build, lint, and `/api/health` pass after the Day 3 source/transcript/render pass; newest check ran `npm run build`, ffprobe, render review, and `/api/health` for the Stream 2 rename-channel export.

## Immediate focus
`facecam-smart` now has a first deterministic multi-sample tracking slice: start/middle/end detections are median-aggregated, fallback metadata is persisted, and the known facecam-missing regression rendered ready at `media/renders/day3-the-facecam-is-missing-facecam-tracked-v2-20260513T0905Z.mp4` with review score `100/100`. Next focus: surface tracking metadata in the UI and run this preset across more Day 3/Stream 2 candidates before adding new product surface.

Do not lose the Content HQ direction while hardening the current workflow: Dispatch Calendar, Copy Studio, Thumbnail Lab, Winner Radar, platform-native variants, podcast/audio exports, owned-audience CTAs, and searchable archive are core roadmap modules, but should become executable backlog slices before Builder starts them.
