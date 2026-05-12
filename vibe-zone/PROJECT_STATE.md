# Project State — Vibe Zone

Last updated: 2026-05-12 14:40 UTC

## Current north star
Vibe Zone is Masala's local-first creator operations HQ, now expanding toward **Content HQ**: ingest livestreams, transcribe them, generate many clip candidates, render upload-ready clips with subtitles, create written/audio/social/owned-audience assets, track analytics, reinforce winners, and expose every Rex/job action in a stream-safe dashboard.

Full north-star spec: `CONTENT_HQ_MASTER_PLAN.md`.

## Current working state
- React/Vite UI with a redesigned light operations-dashboard theme.
- Local Node API on `127.0.0.1:8787`; Vite frontend on `127.0.0.1:5173`.
- Local JSON persistence at `data/vibe-zone.json`.
- Browser drag/drop upload works through SSH tunnel, with client-side upload percent.
- Uploaded stream file `dejKxLu_iM0.mp4` exists in `media/downloads/`, but media validation found it is only decodable through ~25:28 despite MP4 metadata claiming ~90:09. Treat as partial/corrupt until re-uploaded/continued from PC.
- Whisper generated transcript/subtitle artifacts from the decodable section.
- Clip candidates were generated from transcript text.
- Original renders exist plus new punchy subtitle-safe renders.
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
- Build and lint pass after the Viral Hunter scope/competitor-gap pass.

## Immediate focus
Get/repair the complete source video, then render non-duplicate clips from the later high-scoring moments. Next render-lab target: richer visual styles and true facecam overlay once Masala provides/records facecam source.

Do not lose the Content HQ direction while fixing the media blocker: Dispatch Calendar, Copy Studio, Thumbnail Lab, Winner Radar, platform-native variants, podcast/audio exports, owned-audience CTAs, and searchable archive are now core roadmap modules.
