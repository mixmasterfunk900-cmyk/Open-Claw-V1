# Dog Content SOP Drift Audit — 2026-05-19

## Verdict
Dog Content production is correctly paused. The bad Zoomies/Guilty result happened because multi-beat/contact-sheet image generations were copied into `approved_frames/` and the old gates only proved that files were large, real, and from an image model. They did not prove that each approved frame was a single 16:9 SOP-matching story frame.

## What failed by video

### Dog Staring Psychology
- **Status:** FAIL / hold.
- **Frame issue:** no contact-sheet grid detected, but 29 frames are not 16:9 (`1536x1024`).
- **Style issue:** dog continuity breaks and the look drifts cinematic/storybook instead of locked warm-paper charcoal educational explainer.
- **Pipeline issue:** manifest lacks `styleContract: dog-psychology-v1` and per-beat provenance.

### Why Dogs Follow You Everywhere
- **Status:** FAIL, but closest to acceptable.
- **Frame issue:** single-frame structure mostly passes.
- **Style issue:** continuity is not locked enough and there was no required visual SOP audit.
- **Thumbnail issue:** thumbnail folder contains photoreal/contact-sheet option grids, not single hand-drawn branded thumbnails.
- **Pipeline issue:** manifest lacks style contract/per-beat provenance and source naming still indicates batch-style generation.

### Why Dogs Get Zoomies
- **Status:** HARD FAIL.
- **Frame issue:** 52 likely contact-sheet / 2x2 / multi-panel frames detected in `approved_frames/`.
- **Example:** `beat_043.png` is the same failure mode as Masala’s screenshot: one video beat contains a 2x2 generated contact sheet.
- **Style issue:** chaotic action/VFX/comic energy, inconsistent dog/owner, overlays/graphics, incoherent progression.
- **Pipeline issue:** `frame_generation_manifest.json` source files look like `zoomies-unique-batch-001-004`; 80 source files match multi-beat batch-generation naming. Batch generations were treated as approved single beat frames.
- **Thumbnail issue:** photoreal/action contact sheets, not the agreed thumbnail style.

### Why Dogs Look Guilty
- **Status:** HARD FAIL.
- **Frame issue:** 46 likely contact-sheet / multi-panel frames detected.
- **Style issue:** closer thematically than Zoomies, but dog/owner/props drift and multi-panel artifacts break the SOP.
- **Pipeline issue:** manifest has 72 batch-pattern source files and no style contract/per-beat provenance.
- **Thumbnail issue:** photoreal/tabloid/contact-sheet options, not the locked thumbnail style.

## Root cause
1. **Prompt/generation batching leaked into final frames.** The system appears to have asked for several beats/options in one generation batch, producing 2x2 contact sheets. Those images were then renamed/copied as `beat_###.png`.
2. **`approved_frames/` meant “exists and is generated,” not “visually approved.”** The old frame gate checked file size, provider, count, and reuse. That let real but wrong images pass.
3. **No explicit Dog style contract in manifests.** The manifests did not record `dog-psychology-v1`, per-beat prompts, or source mapping, so later render/copy stages could not prove the frames came from the agreed SOP.
4. **No blocking contact-sheet visual audit.** Contact sheets were created for review, but there was no required `visual_sop_audit.json` with pass/fail fields before render.
5. **Thumbnail workflow had the same problem.** Thumbnail option sheets were visible as assets even though they were not single branded thumbnails.

## Fixes applied now
- Added locked style bible: `youtube-automation/docs/DOG_CONTENT_STYLE_BIBLE.md`.
- Added hard visual SOP gate: `youtube-automation/scripts/check_dog_visual_sop.mjs`.
  - Detects non-16:9 frames.
  - Detects likely 2x2/contact-sheet/multi-panel frames.
  - Requires `styleContract: dog-psychology-v1`.
  - Blocks batch-pattern source files like `batch-001-004`.
  - Requires per-beat provenance.
  - Requires passing `visual_sop_audit.json`.
  - Requires passing `thumbnail_sop_audit.json` when thumbnails exist.
- Updated Dog production gate: `vibe-zone/scripts/check-dog-production-ready.mjs` now runs the new visual SOP gate for every Dog project.
- Updated Dog renderer: `youtube-automation/scripts/render_dog_audio_truth_video.mjs` now blocks render/copy if the visual SOP gate fails.
- Added failing audit JSONs to current Dog projects so their status is explicit and cannot silently pass.

## Verification
- `why-dogs-get-zoomies` visual SOP gate fails with 52 detected multi-panel frames.
- `why-dogs-look-guilty` visual SOP gate fails with 46 detected multi-panel frames.
- Full `npm run dog:production` now fails all current Dog videos at `visualSopGate=fail`, which is the desired safety behavior until frames/thumbnails are rebuilt.

## Required rebuild rule
Future Dog Content runs must regenerate one single 16:9 story frame per beat from the locked Dog style bible, write per-beat provenance with `styleContract: dog-psychology-v1`, pass contact-sheet visual QA, pass thumbnail SOP QA, and only then render/copy review videos.
