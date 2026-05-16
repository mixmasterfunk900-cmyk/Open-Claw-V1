# Ship Log

Controller Bot records accepted updates here.

## 2026-05-15 — Thumbnail Lab long-form subtitle fix

Accepted: regenerated and rerendered accurate burned subtitles for both Thumbnail Lab long-form source videos.

- Day 3 Product + Content Machine now points to `vibe-zone/media/exports/READY_TO_SHIP_NOW/long-day3-product-content-machine-subtitles-fixed-20260515.mp4`.
- Stream 2 Founder Story Prototype now points to `vibe-zone/media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-subtitles-fixed-20260515.mp4`.
- Updated all 8 Thumbnail Lab concepts in `vibe-zone/data/vibe-zone.json` to use the corrected videos/contact sheets.
- Added reproducible render script: `vibe-zone/scripts/fix-longform-thumbnail-lab-subtitles-20260515.mjs`.
- QA: caption QA passed for both renders, ffmpeg decode passed for both renders, frontend URL returned HTTP 200, graphify graph refreshed.
