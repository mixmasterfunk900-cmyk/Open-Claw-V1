# Project State — Vibe Zone

Last updated: 2026-05-12 07:35 UTC

## Current north star
Vibe Zone is Masala's local-first creator operations HQ: ingest livestreams, transcribe them, generate many clip candidates, render upload-ready clips with subtitles, and expose every Rex/job action in a stream-safe dashboard.

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

## Latest verification
- Punchy subtitle ASS generated at `media/transcripts/dejKxLu_iM0.punchy.ass`.
- Three punchy MP4 renders generated and ffprobe-verified playable.
- Vision check confirmed captions are readable and in Shorts-safe position between center and bottom quarter.
- Build and lint pass after export bundle workflow addition.
- Created and served test bundle: `media/exports/clip_1778565945241_abb121-stop-overbuilding-and-ship-the-workflow/upload-card.md`.

## Immediate focus
Get/repair the complete source video, then render non-duplicate clips from the later high-scoring moments. Add facecam crop/layout mode as a selectable render preset.
