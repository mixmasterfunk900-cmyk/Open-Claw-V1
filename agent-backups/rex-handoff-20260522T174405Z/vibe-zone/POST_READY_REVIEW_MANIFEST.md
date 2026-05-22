# Post-Ready Review Manifest

Generated: 2026-05-13T17:17:00.000Z

## STYLE REGRESSION HOTFIX RECHECK — 2026-05-15 09:55 UTC

Urgent house-style audit pass after the latest title-clean-layer rerenders. No external posting, login/cookie use, public exposure, deletion, or site restart was performed. Previous READY labels remain suspended unless they pass the restored house-style gate.

Promoted one corrected high-priority rerender after visual style gate PASS:

- **READY LOCAL BUNDLE** — `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4f-title-clean-20260515T0910Z/short-project-moves-offstream-house-v4f-title-clean.mp4`
  - Corrected render: `media/renders/stream-2-project-moves-offstream-house-v4f-20260515T0743Z-title-clean-layer-20260515T0910Z.mp4`
  - Contact sheet: `media/reviews/title-clean-layer-20260515T0910Z/clip_stream2_project_moves_offstream_house_v4f_20260515T0743Z-contact-sheet.jpg`
  - Proof frames / ffprobe: bundled under `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4f-title-clean-20260515T0910Z/`; ffprobe/decode PASS.
  - Vision/style gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions retained, screen/context-first build-offline visual restored, no unwanted blue card/box artifact in sampled frames, no square-face default, no obvious secrets/private text.

Blocked two current rerenders despite ffprobe/decode PASS because they still do not clear Masala's restored visual gate:

- **BLOCKED / NEEDS RERENDER** — `media/renders/stream-2-fulltime-247-build-house-v4c-20260515T0918Z-title-clean-layer-20260515T0910Z.mp4`
  - Contact sheet: `media/reviews/title-clean-layer-20260515T0910Z/clip_stream2_fulltime_247_build_house_v4c_20260515T0918Z-contact-sheet.jpg`
  - Reason: VIBE ZONE/OpenClaw and white text are present, but recurring blue source/card-like bar artifact remains too visually dominant for house style.

- **BLOCKED / NEEDS RERENDER** — `media/renders/stream-2-clips-first-vps-next-house-v4b-20260515T0650Z-retention-cleanseed-20260515T0712Z-title-clean-layer-20260515T0910Z.mp4`
  - Contact sheet: `media/reviews/title-clean-layer-20260515T0910Z/clip_stream2_clips_first_vps_next_house_v4b_20260515T0650Z-contact-sheet.jpg`
  - Reason: branding and captions are present, but sampled frames still read as blue-card/bar regression; kept blocked until a cleaner context-first rerender replaces it.

Audit artifact:

- Audit note: `media/reviews/style-regression/20260515T0955Z/audit-style-gate-hotfix-20260515T0955Z.md`
- Combined contact sheet: `media/reviews/style-regression/20260515T0955Z/style-gate-v4f-v4c-clipsfirst-contact-sheet.jpg`

### Current style-gated counts — 2026-05-15 09:55 UTC
- CORRECTED READY: 38 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 49 suspended/blocked candidates/files.

## STYLE REGRESSION HOTFIX RECHECK — 2026-05-15 08:25 UTC

Urgent house-style audit pass after Masala's regression note. No external posting, login/cookie use, public exposure, deletion, or site restart was performed. Previous READY labels remain suspended unless they pass this gate.

Blocked one newest attempted candidate that had drift risk despite being packaged locally:

- **BLOCKED / NEEDS RERENDER** — `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4f-20260515T0743Z/short-project-moves-offstream-house-v4f.mp4`
  - Current data status: `style_rework_needed`; dispatch status: `blocked`.
  - Render audited: `media/renders/stream-2-project-moves-offstream-house-v4f-20260515T0743Z-title-safe-20260515T0802Z.mp4`
  - Contact sheet: `media/reviews/title-safe-zone-20260515T0802Z/clip_stream2_project_moves_offstream_house_v4f_20260515T0743Z-contact-sheet.jpg`
  - Title proof: `media/reviews/title-safe-zone-20260515T0802Z/clip_stream2_project_moves_offstream_house_v4f_20260515T0743Z-title-proof.jpg`
  - Audit note: `media/reviews/style-regression/audit-stream2-project-moves-offstream-v4f-style-gate-20260515T0825Z.md`
  - ffprobe/decode: PASS on packaged MP4 (20.52s, h264 1080x1920 + aac).
  - Style gate: FAIL — VIBE ZONE/OpenClaw branding and white captions are present, and no blue-card/square-face default was seen, but possible private/internal planning text is visible, source context is too dim/blurred, a small horizontal artifact appears above the source frame, and the title-safe border detector reported a v4f post-seed anomaly. Do **not** upload until rerendered/rechecked.

Confirmed one high-priority local bundle still passes the restored house-style gate:

- **READY LOCAL BUNDLE** — `media/exports/READY_TO_SHIP_NOW/stream2-clips-first-vps-next-house-v4b-20260515T0650Z/short-clips-first-vps-next-house-v4b.mp4`
  - Contact sheet: `media/reviews/title-safe-zone-20260515T0802Z/clip_stream2_clips_first_vps_next_house_v4b_20260515T0650Z-contact-sheet.jpg`
  - ffprobe/decode: PASS (44.52s, h264 1080x1920 + aac).
  - Vision/style gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions retained, source/context remains primary, no unwanted blue/card artifact beyond source UI colors, no square-face default, and no obvious secrets/private text in sampled frames.
  - Owner gate: final privacy/watch pass remains required before public upload.

### Current style-gated counts — 2026-05-15 08:25 UTC
- CORRECTED READY: 38 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 48 suspended/blocked candidates/files, including the newly blocked v4f attempt above.


## STREAM 2 V4E HOUSE-STYLE CORRECTION — 2026-05-15 06:55 UTC

Audited the newest `Project Moves Off-Stream` improvement variants after Masala's style-regression note. v4b/v4c/v4d remain suspended: v4b/v4c show blue card/bar artifacts and broken single-letter caption samples in the contact sheets; v4d is close but still reads as a green colored-border/card treatment. Rerendered v4e with the restored neutral house frame. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4e-20260515T0655Z/short-project-moves-offstream-house-v4e.mp4`
  - Render: `media/renders/stream-2-project-moves-offstream-house-v4e-20260515T0655Z.mp4`
  - Upload bundle: `media/exports/stream2-project-moves-offstream-house-v4e-20260515T0655Z/`
  - Upload card/SEO: `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4e-20260515T0655Z/upload-card.md`, `seo.json`
  - Thumbnail/seed: `media/exports/stream2-project-moves-offstream-house-v4e-20260515T0655Z/thumbnail.jpg`
  - Contact sheet: `media/reviews/style-regression/audit-stream2-project-moves-offstream-house-v4e-20260515T0655Z-contact-sheet.jpg`
  - Audit note: `media/reviews/style-regression/audit-stream2-project-moves-offstream-house-v4e-20260515T0655Z.md`
  - ffprobe/decode: PASS (`media/reviews/style-regression/audit-stream2-project-moves-offstream-house-v4e-20260515T0655Z.ffprobe.json`; 20.52s, h264 1080x1920 + aac).
  - Automated review: READY, 100/100; no detected issues; house-style hard fail: no.
  - Vision/style gate: PASS — VIBE ZONE plus OpenClaw wordmark visible, clean white hook/captions retained, source screen/context remains primary for the off-stream build/progress discussion, no unwanted blue/purple/green card artifact, no square-face default, no obvious secrets/private text in sampled frames.
  - Renderer fix: `scripts/render-stream2-project-moves-offstream-house-v4e-20260515T0655Z.mjs` restores a neutral white/black house frame and subtle white shine; square face/card-style treatment remains suspended as non-default.
  - Owner gate: final privacy/watch pass remains required before any public upload.

### Current style-gated counts — 2026-05-15 06:55 UTC
- CORRECTED READY: 37 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 48 suspended candidates/files. Remaining suspended pool is historical/experimental variants unless individually rechecked or replaced.

## STREAM 2 V4 HOUSE-STYLE WORDMARK CORRECTION — 2026-05-15 05:25 UTC

Re-audited the latest Stream 2 `Clips First, VPS Next` local bundle after Masala's style-regression note. The prior render visually avoided the blue-card/square-face regression, but the brand lane was tightened before promotion so the default house style now explicitly burns in both `VIBE ZONE` and `OPENCLAW`. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/stream2-clips-first-vps-next-house-v4-20260515T0442Z/short-clips-first-vps-next-house-v4.mp4`
  - Render: `media/renders/stream-2-clips-first-vps-next-house-v4-20260515T0442Z.mp4`
  - Upload bundle: `media/exports/stream2-clips-first-vps-next-house-v4-20260515T0442Z/`
  - Upload card/SEO: `media/exports/READY_TO_SHIP_NOW/stream2-clips-first-vps-next-house-v4-20260515T0442Z/upload-card.md`, `seo.json`
  - Thumbnail/seed: `media/exports/stream2-clips-first-vps-next-house-v4-20260515T0442Z/thumbnail.jpg`
  - Contact sheet: `media/reviews/style-regression/audit-stream2-clips-first-vps-next-house-v4-20260515T0525Z-contact-sheet.jpg`
  - Audit note: `media/reviews/style-regression/audit-stream2-clips-first-vps-next-house-v4-20260515T0525Z.md`
  - ffprobe/decode: PASS (`media/reviews/style-regression/audit-stream2-clips-first-vps-next-house-v4-20260515T0525Z.ffprobe.json`; 44.52s, h264 1080x1920 + aac).
  - Automated review: READY, 100/100; no detected issues; house-style hard fail: no.
  - Vision/style gate: PASS — VIBE ZONE plus explicit OpenClaw wordmark visible, clean white hook/captions retained, source screen/context stays primary for the social-accounts/clips/VPS discussion, no unwanted blue/purple/green card artifact, no square-face default, no obvious secrets/private text in sampled frames.
  - Renderer fix: `scripts/render-stream2-clips-first-vps-next-house-v4-20260515T0442Z.mjs` now uses `VIBE ZONE` + `OPENCLAW` in the house brand lane and metadata preset `stream2-house-v4-centered-screen-house-brand-seed`.
  - Owner gate: final privacy/watch pass remains required before any public upload.

### Current style-gated counts — 2026-05-15 05:25 UTC
- CORRECTED READY: 36 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 49 suspended candidates/files. Remaining suspended pool is historical/experimental variants unless individually rechecked or replaced.

## STREAM 2 V4 HOUSE-STYLE RECHECK — 2026-05-15 03:55 UTC

Rechecked two recent Stream 2 v4 local bundles that had automated review/proof frames but were not yet promoted in this manifest after the style-regression gate. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

Additional corrected READY local bundles after sampled visual gate PASS:

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/stream2-fix-mic-huge-day-house-v4-20260515T0025Z/short-fix-mic-then-build-house-v4.mp4`
  - Upload bundle: `media/exports/stream2-fix-mic-huge-day-house-v4-20260515T0025Z/`
  - Upload card/SEO: `media/exports/READY_TO_SHIP_NOW/stream2-fix-mic-huge-day-house-v4-20260515T0025Z/upload-card.md`, `seo.json`
  - Thumbnail: `media/exports/stream2-fix-mic-huge-day-house-v4-20260515T0025Z/thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-fix-mic-huge-day-house-v4-20260515T0025Z-contact-sheet.jpg`
  - Automated review: READY, 100/100; no detected issues.
  - ffprobe/decode: PASS (`media/reviews/style-regression/audit-stream2-v4-house-style-ready-20260515T0355Z-fix-mic.ffprobe.json`; 26.52s, h264 1080x1920 + aac).
  - Vision/style gate: PASS — VIBE ZONE/OpenClaw branding visible, source screen remains primary, clean white hook/captions retained, no unwanted blue/purple/green card artifact, no square-face default, no obvious secrets/private text in sampled frames.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/stream2-fulltime-247-build-house-v4-20260514T1820Z/short-fulltime-247-build-house-v4.mp4`
  - Upload bundle: `media/exports/stream2-fulltime-247-build-house-v4-20260514T1820Z/`
  - Upload card/SEO: `media/exports/READY_TO_SHIP_NOW/stream2-fulltime-247-build-house-v4-20260514T1820Z/README.md`, `seo.json`
  - Thumbnail: `media/exports/stream2-fulltime-247-build-house-v4-20260514T1820Z/thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-fulltime-247-build-house-v4-20260514T1820Z-contact-sheet.jpg`
  - Automated review: READY, 100/100; no detected issues.
  - ffprobe/decode: PASS (`media/reviews/style-regression/audit-stream2-v4-house-style-ready-20260515T0355Z-fulltime.ffprobe.json`; 30.52s, h264 1080x1920 + aac).
  - Vision/style gate: PASS — VIBE ZONE/OpenClaw branding visible, screen/context-first layout retained for the full-time/offline-agent build discussion, clean white hook/captions retained, no unwanted blue/purple/green card artifact, no square-face default, no obvious secrets/private text in sampled frames.

Audit artifact:

- Combined contact sheet: `media/reviews/style-regression/audit-stream2-v4-house-style-ready-20260515T0355Z-contact-sheet.jpg`
- Audit note: `media/reviews/style-regression/audit-stream2-v4-house-style-ready-20260515T0355Z.md`

### Current style-gated counts — 2026-05-15 03:55 UTC
- CORRECTED READY: 35 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 50 suspended candidates/files. Stream 3 top-10 house-style rerender family remains complete; the remaining suspended pool is historical/experimental variants unless individually rechecked or replaced.

## STREAM 3 RANK 10 HOUSE-STYLE CORRECTION — 2026-05-15 02:25 UTC

Audited the remaining suspended Stream 3 Rank 10 `Agents Never Stop` / `AGENTS NEVER STOP` variants before promotion. The prior Gotham/hard/raw/wrapped-title batches remain suspended because they use colored seed/card-style treatment and/or lack the restored VIBE ZONE/OpenClaw house-brand feel. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

Corrected high-priority rerender now READY after local visual gate PASS:

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0225Z/10-day3-agent-loop-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_agent_loop-house-style-corrected-20260515T0225Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/clip_stream3_agent_loop-house-style-corrected-20260515T0225Z/thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0225Z/10-day3-agent-loop-house-style-contact-sheet.jpg`
  - Suspended-vs-corrected audit sheet: `media/reviews/style-regression/audit-rank10-agent-loop-house-style-vs-suspended-20260515T0225Z-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0225Z/10-proof-frame-01.jpg`, `10-proof-frame-02.jpg`, `10-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0225Z/10-ffprobe.json`)
  - Caption QA: PASS (101 one-word events; word+fallback gapfill coverage OK).
  - Automated review: READY, 80/100; only legacy detector warning was top hook card not clearly detected, accepted because the visual gate confirms the white hook is present.
  - Vision/style gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, source-screen context remains the primary visual for the agent-loop discussion, no unwanted blue/green/purple card artifact, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now includes `clip_stream3_agent_loop` and `dispatch_clip_stream3_agent_loop` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: rerender with `START_RANK=10 END_RANK=10 node scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, ffprobe/decode, caption QA, automated review, and vision contact-sheet audit pass.

### Current style-gated counts — 2026-05-15 02:25 UTC
- CORRECTED READY: 33 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 52 suspended candidates/files. Stream 3 top-10 house-style rerender family is now complete (0 unique Stream 3 top-10 families remaining), but suspended historical variants remain blocked unless individually rechecked or replaced.

## STREAM 3 RANK 9 HOUSE-STYLE CORRECTION — 2026-05-15 01:48 UTC

Corrected/exported Stream 3 Top-10 Rank 9 `Build While Away` / `BUILD WHILE AWAY` into the restored screen/context-first VIBE ZONE house style. No external posting, login/cookie use, public exposure, deletion, or secret access was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0148Z/09-day3-offstream-agent-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_offstream_agent-house-style-corrected-20260515T0148Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/clip_stream3_offstream_agent-house-style-corrected-20260515T0148Z/thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0148Z/09-day3-offstream-agent-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0148Z/09-proof-frame-01.jpg`, `09-proof-frame-02.jpg`, `09-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0148Z/09-ffprobe.json`)
  - Automated review: READY, 100/100; no detected issues and no house-style hard fail.
  - Vision/style gate by sampled frames: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, centered source-screen context remains primary, no unwanted blue/green/purple card artifact, no square-face default.
  - Owner gate: final privacy/watch pass remains required before public upload.

### Current style-gated counts — 2026-05-15 01:48 UTC
- CORRECTED READY: 32 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 53 suspended candidates/files. One unique Stream 3 top-10 family still needs corrected house-style rerender.


## STREAM 3 RANK 8 HOUSE-STYLE CORRECTION — 2026-05-15 00:55 UTC

Audited the suspended Stream 3 Rank 8 `Where Is My Face?` / `WHERE DID I GO?` raw-source audiofix contact sheet before rerender. The suspended version still failed the restored house-style gate: missing VIBE ZONE/OpenClaw branding and green hook treatment instead of clean white house text. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

Corrected high-priority rerender now READY after visual gate PASS:

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0055Z/08-day3-facecam-missing-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_facecam_missing-house-style-corrected-20260515T0055Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0055Z/08-day3-facecam-missing-house-style-thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0055Z/08-day3-facecam-missing-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0055Z/08-proof-frame-01.jpg`, `08-proof-frame-02.jpg`, `08-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260515T0055Z/08-ffprobe.json`)
  - Caption QA: PASS (42 one-word events; word+fallback gapfill coverage OK).
  - Automated review: READY, 100/100; no detected house-style hard fail.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, source-screen context remains the main visual for the facecam-missing / visual-QA discussion, no unwanted blue/green/purple card artifact, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_facecam_missing` and `dispatch_clip_stream3_facecam_missing` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: `node --check scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, ffprobe/decode, caption QA, automated review, and vision contact-sheet audit pass.

Audit artifacts:

- Failed source audit contact sheet checked: `media/reviews/stream3_facecam_missing-raw-source-audiofix-20260514T1915Z-contact-sheet.jpg`
- Corrected hold proof before promotion: `media/exports/STYLE_REVIEW_HOLD/day3-top10-wrapped-title-template-20260514T1810Z-house-review/08-day3-facecam-missing-contact-sheet.jpg`

### Current style-gated counts — 2026-05-15 00:55 UTC
- CORRECTED READY: 31 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 54 suspended candidates/files. Two unique Stream 3 top-10 families still need corrected house-style rerenders.


## STREAM 3 RANK 7 HOUSE-STYLE CORRECTION — 2026-05-14 23:30 UTC

Corrected Stream 3 Top-10 Rank 7 `Practice Streaming Here` / `Practice Before Live` into the restored screen/context-first VIBE ZONE house style. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-day3-practice-streaming-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_practice_streaming-house-style-corrected-20260514T2330Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-day3-practice-streaming-house-style-thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-day3-practice-streaming-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-proof-frame-01.jpg`, `07-proof-frame-02.jpg`, `07-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-ffprobe.json`)
  - Caption QA: PASS (46 one-word events; word+fallback gapfill coverage OK).
  - Automated review: READY, 100/100; no detected issues.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, centered source-screen context follows the streaming-practice/chat-simulator discussion, no seed-overlay/neon/color-card regression, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_practice_streaming` and `dispatch_clip_stream3_practice_streaming` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: `node --check scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, ffprobe/decode, caption QA, automated review, vision contact-sheet audit, and `npm run build` all pass.

### Current style-gated counts — 2026-05-14 23:30 UTC
- CORRECTED READY: 30 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 55 suspended candidates/files. Three unique Stream 3 top-10 families still need corrected house-style rerenders.


## STREAM 3 RANK 6 HOUSE-STYLE CORRECTION — 2026-05-14 23:00 UTC

Corrected Stream 3 Top-10 Rank 6 `AI Built AI` / `AI Built More AI` into the restored screen/context-first VIBE ZONE house style. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-day3-ai-building-ai-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_ai_building_ai-house-style-corrected-20260514T2300Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-day3-ai-building-ai-house-style-thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-day3-ai-building-ai-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-proof-frame-01.jpg`, `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-proof-frame-02.jpg`, `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-ffprobe.json`)
  - Caption QA: PASS (30 one-word events; word+fallback gapfill coverage OK).
  - Automated review: READY, 100/100; no detected issues.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, centered source-screen context, no seed-overlay/neon/color-card regression, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_ai_building_ai` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: `node --check scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, ffprobe/decode, caption QA, automated review, vision contact-sheet audit, and `npm run build` all pass.

### Current style-gated counts — 2026-05-14 23:00 UTC
- CORRECTED READY: 29 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 56 suspended candidates/files. Four unique Stream 3 top-10 families still need corrected house-style rerenders.


## STREAM 3 RANK 5 HOUSE-STYLE CORRECTION — 2026-05-14 22:35 UTC

Corrected Stream 3 Top-10 Rank 5 `First Clip Shipped` into the restored screen/context-first VIBE ZONE house style. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-day3-first-auto-clip-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_first_auto_clip-house-style-corrected-20260514T2235Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-day3-first-auto-clip-house-style-thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-day3-first-auto-clip-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-proof-frame-01.jpg`, `05-proof-frame-02.jpg`, `05-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-ffprobe.json`)
  - Caption QA: PASS (18 one-word events; word+fallback gapfill coverage OK).
  - Automated review: READY, 100/100; no detected issues.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, centered source-screen context, no seed-overlay/neon/color-card regression, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_first_auto_clip` and `dispatch_clip_stream3_first_auto_clip` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: `node --check scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, ffprobe/decode, caption QA, automated review, vision contact-sheet audit, and `npm run build` all pass.

### Current style-gated counts — 2026-05-14 22:35 UTC
- CORRECTED READY: 28 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 57 suspended candidates/files. Five unique Stream 3 top-10 families still need corrected house-style rerenders.

## STREAM 3 RANK 4 HOUSE-STYLE CORRECTION — 2026-05-14 22:00 UTC

Corrected the next unresolved Stream 3 Top-10 family, Rank 4 `Ship Live, Fix Later`, into the restored screen/context-first VIBE ZONE house style. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2200Z/04-day3-ship-live-fix-later-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_ship_live_fix_later-house-style-corrected-20260514T2200Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/clip_stream3_ship_live_fix_later-house-style-corrected-20260514T2200Z/thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2200Z/04-day3-ship-live-fix-later-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2200Z/04-proof-frame-01.jpg`, `04-proof-frame-02.jpg`, `04-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2200Z/04-ffprobe.json`)
  - Automated review: READY, 80/100; only legacy detector warning was top hook card not clearly detected, accepted because the visual/vision gate confirms the white hook is present.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, source-screen context remains the main visual for the live-shipping discussion, no unwanted blue/green/purple card artifact, no square-face default, no obvious secrets/private text in sampled frames. Note: one sampled caption sequence reads awkwardly in isolation, but caption QA/coverage passes from word timings.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_ship_live_fix_later` and `dispatch_clip_stream3_ship_live_fix_later` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.
  - Verification: `node --check scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs`, `npm run build`, ffmpeg decode, ffprobe, caption QA, automated review, and vision contact-sheet audit all pass.

### Current style-gated counts — 2026-05-14 22:00 UTC
- CORRECTED READY: 27 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 58 suspended candidates/files. Six unique Stream 3 top-10 families still need corrected house-style rerenders.


## STREAM 3 RANK 3 HOUSE-STYLE CORRECTION — 2026-05-14 21:18 UTC

Corrected the next unresolved Stream 3 Top-10 family, Rank 3 `Product Or Machine?`, into the current screen/context-first house style. No external posting, login/cookie use, public exposure, secret access, or platform API write was performed.

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2118Z/03-day3-product-or-machine-house-style.mp4`
  - Upload bundle: `media/exports/clip_stream3_product_or_machine-house-style-corrected-20260514T2118Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/clip_stream3_product_or_machine-house-style-corrected-20260514T2118Z/thumbnail.jpg`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2118Z/03-day3-product-or-machine-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2118Z/03-proof-frame-01.jpg`, `03-proof-frame-02.jpg`, `03-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2118Z/03-ffprobe.json`)
  - Automated review: READY, 80/100; only legacy detector warning was top hook card not clearly detected, accepted because the visual gate confirms the white hook is present.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions, centered source-screen context, no neon/card regression, no square-face default, no obvious secrets/private text in sampled frames.
  - Data/UI: `data/vibe-zone.json` now marks `clip_stream3_product_or_machine` and `dispatch_clip_stream3_product_or_machine` as local manual-upload ready after style gate; final owner privacy/watch pass remains required.

Prevention patch: `scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs` now places one-word captions below the VIBE ZONE/OpenClaw logo zone (`captionMarginV = 360`) to avoid long-clip caption overlap garbling body branding.

### Current style-gated counts — 2026-05-14 21:18 UTC
- CORRECTED READY: 26 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 59 suspended candidates/files. Seven unique Stream 3 top-10 families still need corrected house-style rerenders.

## STREAM 3 RAW-SOURCE AUDIOFIX AUDIT + RANK 2 CORRECTION — 2026-05-14 20:31 UTC

Audited the newer `stream3-raw-source-audiofix-20260514T1915Z` batch that had been copied into READY after the earlier style gate. No external posting, login/cookie use, public exposure, deletion, or site restart was performed.

Gate result: the 10 files in `media/exports/READY_TO_SHIP_NOW/stream3-raw-source-audiofix-20260514T1915Z/` are **SUSPENDED / NOT READY**. ffprobe/audio/decode are usable, and no obvious secrets/private text were visible in sampled frames, but visual style fails: bright green/yellow caption/hook treatment, missing/weak VIBE ZONE/OpenClaw body branding, seed-overlay/colored-template treatment instead of the house default, and occasional dark/blank artifact blocks.

Corrected high-priority rerender now READY after visual gate PASS:

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z/02-day3-iphone-for-streamers-house-style.mp4`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z/02-day3-iphone-for-streamers-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z/02-proof-frame-01.jpg`, `02-proof-frame-02.jpg`, `02-proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z/02-ffprobe.json`)
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, clean white hook/captions retained, centered screen context follows the iPhone/streamer discussion, no unwanted blue/green/purple card/frame artifact, no square-face default, no obvious secrets/private text in sampled frames. Final owner privacy/watch pass still required.

Audit/prevention artifacts:

- Failed-batch combined contact sheet: `media/reviews/style-regression/audit-stream3-raw-source-audiofix-suspended-20260514T2030Z.jpg`
- Audit notes: `media/reviews/style-regression/audit-stream3-raw-source-audiofix-suspended-20260514T2030Z.md`
- Audit JSON: `media/reviews/style-regression/audit-stream3-raw-source-audiofix-suspended-20260514T2030Z.json`
- Prevention patch: `scripts/batch-stream3-raw-source-audiofix-20260514T1915Z.mjs` now writes reruns to `STYLE_REVIEW_HOLD`, not `READY_TO_SHIP_NOW`, and dispatch/data records stay blocked until style review passes.
- Data/UI: `data/vibe-zone.json` marks raw-source audiofix Stream 3 items as style-review hold/blocked; Rank 2 now points at the corrected house-style READY bundle.

### Current style-gated counts — 2026-05-14 20:31 UTC
- CORRECTED READY: 25 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 60 suspended candidates/files: previous 51, plus the 10 newly suspended raw-source audiofix files, minus the Rank 2 house-style correction returned to READY. Eight unique Stream 3 top-10 families still need corrected house-style rerenders.

## STREAM 2 HOUSE-V4 SECURITY CLIP — 2026-05-14 19:45 UTC

Rendered a fresh Stream 2 local-only short from 07:16–07:30, `Secure VPS For The AI Build`, using the corrected centered-screen house layout: clean white hook/one-word captions, visible VIBE ZONE branding, screen/context-first framing, no square-face default, and no saturated blue/green/purple card regression. No external posting, login/cookie use, public exposure, or external API write was performed.

- READY LOCAL BUNDLE — `media/renders/stream-2-secure-vps-openclaw-house-v4-20260514T1940Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/stream2-secure-vps-openclaw-house-v4-20260514T1940Z/short-secure-vps-openclaw-house-v4.mp4` (14.52s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream2-secure-vps-openclaw-house-v4-20260514T1940Z/`
  - Upload card: `upload-card.md`; YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`; SEO JSON: `seo.json`
  - Thumbnail: `media/exports/clip_stream2-secure-vps-openclaw-house-v4-20260514T1940Z/thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-secure-vps-openclaw-house-v4-20260514T1940Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-secure-vps-openclaw-house-v4-20260514T1940Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Vision gate: PASS — VIBE ZONE branding visible, clean white hook/captions, centered screen context, no face-dominant layout, no readable secrets/private text; only minor source UI color accents, not a designed card artifact.
  - Verification: render script ffprobe/decode pass, caption QA pass (41 one-word events), automated review pass, `node --check`, `npm run build`, and local `/api/health` reachable with the known Day 4 missing-source blocker.
  - Data/UI: added `clip_stream2_secure_vps_openclaw_20260514T1940Z` and dispatch item `dispatch_clip_stream2_secure_vps_openclaw_20260514T1940Z` for local manual review only. Final owner privacy/watch pass remains required before public upload.
  - Script: `scripts/render-stream2-secure-vps-openclaw-house-v4-20260514T1940Z.mjs`.


## STREAM 3 STYLE REGRESSION AUDIT + RANK 1 CORRECTION — 2026-05-14 18:55 UTC

Audited the latest `stream3-hard-audiofix-20260514T1838Z` READY batch and treated previous Stream 3 READY state as suspended until visual style recheck. No external posting, login/cookie use, public exposure, API write, deletion, or site restart was performed.

Gate result: the 10 hard-audiofix seed-overlay files in `media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/` are **SUSPENDED / NOT READY**. The contact sheet still shows no reliable VIBE ZONE/OpenClaw house branding in the body, non-white/neon caption treatment from the old fixed-template render, and face/seed-overlay treatment that remains an optional variant rather than the default screen/context-first house style. ffprobe/decode passes and no obvious secrets/private text were readable in sampled frames, but visual style gate fails.

Corrected high-priority rerender now READY after visual gate PASS:

- READY LOCAL BUNDLE — `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z/01-day3-one-stream-many-clips-house-style.mp4`
  - Contact sheet: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z/01-day3-one-stream-many-clips-house-style-contact-sheet.jpg`
  - Proof frames: `media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - ffprobe/decode: PASS (`media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z/ffprobe.json`)
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding present, clean white hook/captions retained, source screen/context visible and relevant, no square-face default, no unwanted designed blue/purple/green overlay card/box, no obvious secrets in sampled frames. Minor caveat: contact-sheet OCR can misread small brand text; final owner watch/privacy pass still required before public upload.

Audit artifacts:

- Failed-batch combined contact sheet: `media/reviews/style-regression/audit-stream3-hard-audiofix-20260514T1855Z-contact-sheet-small.jpg`
- Audit notes: `media/reviews/style-regression/audit-stream3-hard-audiofix-suspended-and-one-corrected-20260514T1855Z.md`
- Audit JSON: `media/reviews/style-regression/audit-stream3-hard-audiofix-suspended-and-one-corrected-20260514T1855Z.json`
- ffprobe summary: `media/reviews/style-regression/audit-stream3-hard-audiofix-suspended-and-one-corrected-20260514T1855Z.ffprobe.txt`

Prevention patch:

- `scripts/render-stream3-top10-wrapped-title-template-20260514T1810Z.mjs` now restores VIBE ZONE/OpenClaw branding, forces clean white house-style text for this override, supports `END_RANK`, and renders to `STYLE_REVIEW_HOLD` by default until sampled frames pass.
- `scripts/batch-stream3-hard-audiofix-20260514T1838Z.mjs` now writes reruns to `STYLE_REVIEW_HOLD` instead of `READY_TO_SHIP_NOW` and holds dispatch records behind style-gate blockers.
- `data/vibe-zone.json` updated so Rank 1 points at the passed READY bundle; the other nine Stream 3 top-10 families remain `style_review_hold` / needs rerender.

### Current style-gated counts — 2026-05-14 18:55 UTC
- CORRECTED READY: 24 current short-form upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 51 suspended candidates/families: previous 42 plus the nine still-unfixed Stream 3 top-10 families from the failed hard-audiofix batch; Rank 1 was corrected and returned to READY.


## STYLE REGRESSION AUDIT — SEED-FRAME TESTS SUSPENDED — 2026-05-14 17:35 UTC

Audited the four newest seed-frame/test renders that had been copied into `media/exports/READY_TO_SHIP_NOW`. No external posting, login/cookie use, public exposure, API write, deletion, or site restart was performed.

- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/stream3-one-stream-new-params-seed-test-20260514T1730Z.mp4`
- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/stream3-one-stream-youtube-seed-upload-test-20260514T1725Z.mp4`
- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-general-face-seed-test-20260514T1718Z.mp4`
- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-masala-face-seed-test-20260514T1708Z.mp4`

Gate result: all four fail the restored house-style READY gate. They are seed/test material, not post-ready outputs. VIBE ZONE/OpenClaw branding is missing or not clearly visible, captions/hooks are green/yellow rather than clean white, green border/outline and purple UI elements read as visible colored box/card artifacts, and the face/seed-frame treatment is experimental rather than default screen/context-first house style. No obvious secrets/private text were visible in sampled contact sheets, and ffprobe/decode metadata exists for all four audited files.

- Combined audit contact sheet: `media/reviews/style-regression/audit-seed-tests-suspended-20260514T1735Z.jpg`
- Audit notes: `media/reviews/style-regression/audit-seed-tests-suspended-20260514T1735Z.md`
- Audit JSON: `media/reviews/style-regression/audit-seed-tests-suspended-20260514T1735Z.json`
- ffprobe/decode summary: `media/reviews/style-regression/audit-seed-tests-suspended-20260514T1735Z.ffprobe.txt`
- Prevention patch: updated `scripts/render-stream3-new-params-seed-test-20260514T1730Z.mjs`, `scripts/render-stream3-youtube-seed-upload-test-20260514T1725Z.mjs`, `scripts/render-general-face-seed-test-20260514T1718Z.mjs`, and `scripts/render-masala-face-seed-test-20260514T1708Z.mjs` so rerunning these experiments no longer copies outputs into `READY_TO_SHIP_NOW`; `node --check` passes on all four scripts.

### Current style-gated counts — 2026-05-14 17:35 UTC
- CORRECTED READY: 23 current short-form upload candidates (latest corrected/current house-style candidate per clip family only; excludes suspended seed tests, suspended border-shine tests, superseded duplicate variants, and long-form files).
- NEEDS-RERENDER / STYLE RECHECK: 42 suspended candidates: 38 from the previous style-gated count plus the 4 newly suspended seed-frame test files.



## STYLE REGRESSION AUDIT — BORDER-SHINE TESTS SUSPENDED — 2026-05-14 15:55 UTC

Audited the three recent Day 3 border-shine experiment renders that were copied into `media/exports/READY_TO_SHIP_NOW`. No external posting, login/cookie use, public exposure, API write, deletion, or site restart was performed.

- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/day3-one-stream-border-shine-test-20260514T1535Z.mp4`
- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/day3-one-stream-border-shine-test-v2-20260514T1540Z.mp4`
- SUSPENDED / NOT READY — `media/exports/READY_TO_SHIP_NOW/day3-one-stream-border-shine-test-v3-20260514T1548Z.mp4`

Gate result: all three fail the restored house-style gate. The source/screen context is visible and no square-face default was found, but VIBE ZONE/OpenClaw branding is not clearly present, captions are green rather than clean white, and the green/gold border-shine treatment reads as a visible colored box/frame artifact. No obvious secrets/private text were visible in sampled frames. ffprobe metadata was captured, but visual style gate fails.

- Combined audit contact sheet: `media/reviews/style-regression/audit-border-shine-tests-suspended-20260514T1555Z.jpg`
- Audit notes: `media/reviews/style-regression/audit-border-shine-tests-suspended-20260514T1555Z.md`
- Audit JSON: `media/reviews/style-regression/audit-border-shine-tests-suspended-20260514T1555Z.json`
- ffprobe summary: `media/reviews/style-regression/audit-border-shine-tests-suspended-20260514T1555Z.ffprobe.txt`
- Prevention patch: updated `scripts/render-border-shine-test-20260514T1535Z.mjs`, `scripts/render-border-shine-test-v2-20260514T1540Z.mjs`, and `scripts/render-border-shine-test-v3-20260514T1548Z.mjs` so rerunning these experiments no longer copies outputs into `READY_TO_SHIP_NOW`; `node --check` passes on all three scripts.

### Current style-gated counts — 2026-05-14 15:55 UTC
- CORRECTED READY: 23 current short-form upload candidates (latest corrected/current house-style candidate per clip family only; excludes suspended border-shine tests, superseded duplicate variants, and long-form files).
- NEEDS-RERENDER / STYLE RECHECK: 38 suspended candidates: 35 stale legacy/recent candidates from the previous audit plus the 3 newly suspended border-shine experiment files.


## HOUSE-V3 CLEAN RETENTION EXPORT — 2026-05-14 16:40 UTC

Rendered a safe retention-pass improvement for the `Thumbnail Looks Mid` family after the no-brand/green-caption clean-retention experiment failed vision style gate. The new export is based on the already-approved house-v3 render and uses only restrained white-only motion: a 1.2% slow push, one soft start pulse, and a gentle end cue. No external posting, login/cookie use, public exposure, or external API write was performed.

- READY LOCAL BUNDLE — `media/renders/thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-clean-retention.mp4` (18s, 1080x1920)
  - Upload bundle: `media/exports/clip_thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z/`
  - Upload card: `media/exports/clip_thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-clean-retention-thumbnail.jpg`
  - Contact sheet: `media/reviews/thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z-contact-sheet.jpg`
  - Proof frames: `media/exports/clip_thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - Review: `media/reviews/thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Vision gate: PASS — VIBE ZONE/OpenClaw branding visible, centered screen context maintained, white captions readable, no blue-card/square-face/default regression, no green/gold artifact frame, no obvious readable secrets.
  - Verification: ffprobe/decode pass, automated review pass, copied caption QA from the approved house-v3 base, `node --check`, `npm run build`, and `/api/health` reachable with known Day 4 import blocker.
  - Data/UI: added `clip_thumbnail_looks_mid_house_v3_clean_retention_20260514T1640Z`, dispatch item `dispatch_thumbnail_looks_mid_house_v3_clean_retention_20260514T1640Z`, and media job `media_job_20260514T1640Z_thumbnail_looks_mid_house_v3_clean_retention`; the failed no-brand clean-retention test was marked style-suspended/superseded in local data. Final owner privacy/watch pass remains required before public upload.
  - Script: `scripts/render-thumbnail-looks-mid-house-v3-clean-retention-20260514T1640Z.mjs`.


## STREAM 2 HOUSE-STYLE IMPROVEMENT — 2026-05-14 15:10 UTC

Rendered a fresh Stream 2 house-v3 improvement for the older `stop-overbuilding-and-ship-the-workflow` family: `Control The Build From My Phone` from 03:08–03:24. It keeps the current centered-screen/source-context layout, clean white hook/captions, VIBE ZONE + OpenClaw branding, blurred underlay, no blue-card regression, and no square-face-default layout. No external posting, login/cookie use, public exposure, or external API write was performed.

- READY LOCAL BUNDLE — `media/renders/stream-2-phone-controls-build-house-v3-20260514T1510Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-control-build-from-phone-house-v3.mp4` (16s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-phone-controls-build-house-v3-20260514T1510Z/`
  - Upload card: `media/exports/clip_stream-2-phone-controls-build-house-v3-20260514T1510Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-control-build-from-phone-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-phone-controls-build-house-v3-20260514T1510Z-contact-sheet.jpg`
  - Proof frames: `media/exports/clip_stream-2-phone-controls-build-house-v3-20260514T1510Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - Review: `media/reviews/stream-2-phone-controls-build-house-v3-20260514T1510Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (55 one-word events), automated style review PASS (`blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`), contact-sheet vision PASS for branding/no old template/no obvious secrets, `node --check`, `npm run build`, and `/api/health` reached local API but still reports the known Day 4 import blocker.
  - Data/UI: added `clip_stream2_phone_controls_build_house_v3_20260514T1510Z`, dispatch item `dispatch_clip_stream2_phone_controls_build_house_v3_20260514T1510Z`, and media job `media_job_20260514T1510Z_phone_controls_build_house_v3` for local manual review. Final owner privacy/watch pass remains required before public upload because source-screen UI is visible.
  - Script: `scripts/render-stream2-phone-controls-build-house-v3-20260514T1510Z.mjs`.



## READY DIRECTORY STYLE AUDIT + TEMPLATE DEFAULT FIX — 2026-05-14 14:25 UTC

Rechecked suspicious/stale files still present in `media/exports/READY_TO_SHIP_NOW` after Masala's style-regression catch, focusing on blue/card artifacts, missing house branding, square-face/default drift, and whether screen/context remains visible. No external posting, login/cookie use, public exposure, API write, deletion, or site restart was performed.

- Audit contact sheet: `media/reviews/style-regression/audit-ready-dir-suspicious-20260514T1425Z.jpg`
- Audit notes: `media/reviews/style-regression/ready-dir-suspicious-audit-20260514T1425Z.md`
- Audit JSON: `media/reviews/style-regression/ready-dir-suspicious-audit-20260514T1425Z.json`
- Template fix: patched `VIBE_ZONE_SHORT_TEMPLATE.md` so the logo/brand lane can no longer be interpreted as empty by default. READY house-style shorts must include VIBE ZONE + OpenClaw branding; no-brand/square-face/card treatments are optional variants only when explicitly approved.

Gate results from the suspicious READY-dir sample:

- SUSPEND / superseded — `media/exports/READY_TO_SHIP_NOW/short-build-the-clip-machine-centered-logo-fix.mp4`: branding not clearly present in sampled proof frame; keep superseded by `short-build-the-clip-machine-restored-layout-v2.mp4`.
- SUSPEND / superseded — `media/exports/READY_TO_SHIP_NOW/short-socials-to-vps-template.mp4`: blue/green card/template look and missing house branding; superseded by current house-v3 replacements.
- SUSPEND / superseded — `media/exports/READY_TO_SHIP_NOW/short-template-trial-no-leaks.mp4`: missing clear VIBE ZONE/OpenClaw branding; superseded by `short-no-leaks-before-launch-house-v3.mp4`.
- SUSPEND / superseded — `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-template.mp4`: missing clear VIBE ZONE/OpenClaw branding; superseded by `short-thumbnail-looks-mid-house-v3.mp4`.
- PASS as visual variants but do not count as current READY because newer replacements exist: `short-ai-agents-real-work-house-style.mp4`, `short-ai-agents-real-work-house-style-v2.mp4`, `short-build-the-clip-machine-logo-below-video.mp4`, `short-build-the-clip-machine-one-word-captions.mp4`, and `short-build-the-clip-machine-restored-layout.mp4`.

### Current style-gated counts — 2026-05-14 14:25 UTC
- CORRECTED READY: 22 current short-form upload candidates (latest corrected/current house-style candidate per clip family only; superseded duplicate variants and long-form files excluded).
- NEEDS-RERENDER / STYLE RECHECK: 35 stale legacy/recent candidates remain suspended or superseded pending visual style gate.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 13:38 UTC

Style-corrected the suspended no-brand `short-template-trial-no-leaks.mp4` package into `No Leaks Before Launch` with restored house-style v3: centered/cropped source-screen context, clean white hook/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue-card regression, and no square-face-default layout. No external posting, login/cookie use, public exposure, or external API write was performed.

- READY LOCAL BUNDLE — `media/renders/template-trial-no-leaks-house-v3-20260514T1338Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-no-leaks-before-launch-house-v3.mp4` (28s, 1080x1920)
  - Upload bundle: `media/exports/clip_template-trial-no-leaks-house-v3-20260514T1338Z/`
  - Upload card: `media/exports/clip_template-trial-no-leaks-house-v3-20260514T1338Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-no-leaks-before-launch-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/template-trial-no-leaks-house-v3-20260514T1338Z-contact-sheet.jpg`
  - Proof frames: `media/exports/clip_template-trial-no-leaks-house-v3-20260514T1338Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - Review: `media/reviews/template-trial-no-leaks-house-v3-20260514T1338Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (52 one-word events; coverage note only because the source has an intentional early spoken pause), automated style review PASS (`blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`), contact-sheet vision PASS for branding/no old template/no obvious secrets, `node --check`, `npm run build`, and `npm run lint`. `/api/health` responded with counts updated to 28 clips / 89 media jobs / 0 active or failed jobs, but still `ok:false` because newest Day 4 stream `_R2pPID8N-o` is not imported/downloaded yet.
  - Data/UI: added `clip_template_trial_no_leaks_house_v3_20260514T1338Z`, dispatch item `dispatch_clip_template_trial_no_leaks_house_v3_20260514T1338Z`, and media job `media_job_20260514T1338Z_template_trial_no_leaks_house_v3` for manual review. Added the new render/bundle to the server style-gate allowlist; local API was not restarted, so the already-running server may need a local-only restart before `/api/dispatch/list` reflects the new allowlist entry live.
  - Script: `scripts/render-template-trial-no-leaks-house-v3-20260514T1338Z.mjs`.


## STYLE REGRESSION RECHECK — 2026-05-14 12:55 UTC

Audited the `Build While I Sleep` legacy `screen-card-tight` package after the urgent Masala style gate and verified its corrected house-style replacement. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- SUSPENDED / NOT READY — `media/renders/stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4`
  - Automated review remains **70/100, ready no**: `media/reviews/stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.review.md` / `.json`.
  - New audit contact sheet: `media/reviews/style-regression/audit-build-while-i-sleep-screen-card-tight-suspended-20260514T1255Z.jpg`.
  - Gate result: visual audit found a dominant blue/card artifact, weak/default house branding (OpenClaw not visible), card-forward composition, and screen/context not dominant enough. No obvious secrets/private text in sampled frames. Keep this only as a suspended/legacy optional variant; do not count READY.
- RECONFIRMED READY REPLACEMENT — `media/renders/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-build-while-i-sleep-house-v3.mp4`
  - New corrected audit contact sheet: `media/reviews/style-regression/audit-build-while-i-sleep-house-v3-ready-20260514T1255Z.jpg`.
  - Review refreshed: `media/reviews/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.review.md` / `.json` — automated score **100/100, ready yes**.
  - Verification: ffprobe pass (`media/exports/stream-2-build-while-i-sleep-house-v3-20260514T1255Z.ffprobe.json`), no blue/card artifact, VIBE ZONE/OpenClaw branding present, clean white hook/captions retained, screen/context dominant, no square-face default, no obvious secrets/private text in contact-sheet vision audit. Final owner privacy/watch pass remains required before public upload because source screen content is visible.

### Current style-gated counts — 2026-05-14 12:55 UTC
- CORRECTED READY: 21 current short-form upload candidates (unchanged; this run reconfirmed an existing corrected replacement rather than adding a new READY clip).
- NEEDS-RERENDER / STYLE RECHECK: 36 suspended legacy/recent candidates remain; the audited `screen-card-tight` package stays in this suspended pool and is superseded by the house-v3 READY replacement above.


## STREAM 2 FRESH HOUSE-STYLE RENDER — 2026-05-14 12:08 UTC

Rendered a fresh Stream 2 short, `AI Still Working While I Smile`, from 81:05–81:38 using the restored house-style v3 default: centered source-screen context, clean white hook/captions, VIBE ZONE + OpenClaw branding, dim blurred underlay, no blue-card regression, and no square-face-default layout. No external posting, login/cookie use, public exposure, or API write was performed.

- READY LOCAL BUNDLE — `media/renders/stream-2-ai-still-working-house-v3-20260514T1208Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-ai-still-working-house-v3.mp4` (32.63s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-ai-still-working-house-v3-20260514T1208Z/`
  - Upload card: `media/exports/clip_stream-2-ai-still-working-house-v3-20260514T1208Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-ai-still-working-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-ai-still-working-house-v3-20260514T1208Z-contact-sheet.jpg`
  - Proof frames: `media/exports/clip_stream-2-ai-still-working-house-v3-20260514T1208Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - Review: `media/reviews/stream-2-ai-still-working-house-v3-20260514T1208Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (38 one-word events), automated style review PASS (`blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`), contact-sheet vision PASS for house branding/no black-or-blue-card regression/no obvious secrets; minor note that source screen is wide/small and captions are mid-sentence in sampled frames. `npm run build` pass. Local API health remains `ok:false` only because newest Day 4 stream `_R2pPID8N-o` is not imported/downloaded yet; safe Stream 2 local work continued.
  - Data/UI: added `clip_stream2_ai_still_working_house_v3_20260514T1208Z`, dispatch item `dispatch_clip_stream2_ai_still_working_house_v3_20260514T1208Z`, and media job `media_job_20260514T1208Z_ai_still_working` for manual review. Final owner privacy/watch pass is still required before public upload because source-screen UI is visible.
  - Script: `scripts/render-stream2-ai-still-working-house-v3-20260514T1208Z.mjs`.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 11:25 UTC

Style-corrected the suspended no-brand `Thumbnail Looks Mid` template render after the Masala style-regression gate. The prior template candidate (`media/renders/thumbnail-looks-mid-template-20260514T0852Z.mp4` / ready copy `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-template.mp4`) remains **SUSPENDED / NEEDS RERENDER** because it reserved an empty logo zone and did not show VIBE ZONE/OpenClaw house branding. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- READY LOCAL BUNDLE — `media/renders/thumbnail-looks-mid-house-v3-20260514T1125Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3.mp4` (18s, 1080x1920)
  - Upload bundle: `media/exports/clip_thumbnail-looks-mid-house-v3-20260514T1125Z/`
  - Upload card: `media/exports/clip_thumbnail-looks-mid-house-v3-20260514T1125Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/thumbnail-looks-mid-house-v3-20260514T1125Z-contact-sheet.jpg`
  - Proof frames: `media/exports/clip_thumbnail-looks-mid-house-v3-20260514T1125Z/proof-frame-01.jpg`, `proof-frame-02.jpg`, `proof-frame-03.jpg`
  - Review: `media/reviews/thumbnail-looks-mid-house-v3-20260514T1125Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (35 one-word events), automated style review PASS (`blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`), contact-sheet vision PASS: VIBE ZONE/OpenClaw branding visible, clean white hook/captions retained, screen/context dominant, no square-face default, no obvious secrets/private text. Minor blue UI appears only inside the source screen capture, not as a designed overlay/card artifact. Final owner privacy/watch pass still required before public upload because source screen text is visible.
  - Script: `scripts/render-thumbnail-looks-mid-house-v3-20260514T1125Z.mjs`.

### Current style-gated counts — 2026-05-14 11:25 UTC
- CORRECTED READY: 21 current short-form upload candidates after this recheck/rerender.
- NEEDS-RERENDER / STYLE RECHECK: 36 suspended candidates remain: 35 legacy/superseded packaged candidates plus 1 recent no-brand template render (`short-template-trial-no-leaks.mp4`) still needing house-brand rerender.



## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 10:45 UTC

Style-corrected the suspended no-brand `socials-to-vps-template` family into `Post While I Sleep` using the restored house-style v3 default: centered/cropped source-screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue-card regression, and no square-face-default layout. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- READY LOCAL BUNDLE — `media/renders/stream-2-post-while-i-sleep-house-v3-20260514T1045Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-post-while-i-sleep-house-v3.mp4` (31s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-post-while-i-sleep-house-v3-20260514T1045Z/`
  - Upload card: `media/exports/clip_stream-2-post-while-i-sleep-house-v3-20260514T1045Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-post-while-i-sleep-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-post-while-i-sleep-house-v3-20260514T1045Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-post-while-i-sleep-house-v3-20260514T1045Z.review.md` / `.json` — automated score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (92 one-word events), automated style review PASS (`blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`), contact-sheet vision CAUTION only for exact-size/contact-sheet limitations and screen/context being slightly small; no obvious secrets/private text readable; `npm run caption:qa` pass. Final owner privacy/watch pass still required before public upload because source screen/chat content is visible.
  - Data/UI: added `clip_stream2_post_while_i_sleep_house_v3_20260514T1045Z` and dispatch item `dispatch_clip_stream2_post_while_i_sleep_house_v3_20260514T1045Z` for local manual dispatch review.



## URGENT STYLE REGRESSION RECHECK — 2026-05-14 09:55 UTC

Masala's latest style regression note is now the active gate. I restored the written default in `VIBE_ZONE_SHORT_TEMPLATE.md` so house style means screen/context-first layout with VIBE ZONE + OpenClaw branding and clean white hook/caption text by default. The earlier no-default-brand template note is suspended unless Masala explicitly re-approves it. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

Recent template proof-frame audit:

- PASS / READY AFTER RECHECK — `media/renders/stream2-start-posting-clips-template-20260514T0910Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-clips-find-viewers-template.mp4` (43s, 1080x1920)
  - Contact sheet: `media/reviews/stream2-start-posting-clips-template-20260514T0910Z-contact-sheet.jpg`
  - Review: `media/reviews/stream2-start-posting-clips-template-20260514T0910Z.review.md` / `.json`
  - Script: `scripts/render-stream2-start-posting-clips-template-20260514T0910Z.mjs`
  - Gate evidence: ffprobe/decode pass; automated style review score 100/100 with `blueCardArtifact:false`, `whiteBrandingWeak:false`, `squareFaceBoxDefault:false`, `weakScreenContext:false`; vision contact-sheet audit PASS for no blue-card artifact, VIBE ZONE/OpenClaw branding present, clean white hook/captions, screen/context dominant, no square-face default, and no obvious secrets. Owner final privacy/watch pass still required because monitor/UI text is visible.
- SUSPENDED / NEEDS RERENDER — `media/reviews/template-trial-no-leaks-20260514T0800Z-contact-sheet.jpg` and ready copy `media/exports/READY_TO_SHIP_NOW/short-template-trial-no-leaks.mp4`; vision audit found no blue-card artifact, but house branding/logo is missing.
- SUSPENDED / NEEDS RERENDER — `media/reviews/thumbnail-looks-mid-template-20260514T0852Z-contact-sheet.jpg` and ready copy `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-template.mp4`; vision audit found no blue-card artifact, but house branding/logo is missing.

### Current style-gated counts — 2026-05-14 09:55 UTC
- CORRECTED READY: 19 current upload candidates after rechecking `Clips Find Viewers` against the restored house-style gate.
- NEEDS-RERENDER / STYLE RECHECK: 36 legacy packaged candidates remain suspended, plus 2 recent no-brand template renders found in `READY_TO_SHIP_NOW` are suspended until house-brand rerender.
- Contact-sheet evidence: `media/reviews/stream2-start-posting-clips-template-20260514T0910Z-contact-sheet.jpg`; failed recent template sheets: `media/reviews/template-trial-no-leaks-20260514T0800Z-contact-sheet.jpg`, `media/reviews/thumbnail-looks-mid-template-20260514T0852Z-contact-sheet.jpg`.


## STREAM 2 PERMANENT TEMPLATE RENDER — 2026-05-14 09:10 UTC

Rendered a fresh Stream 2 content-distribution short, `Clips Find Viewers`, from 02:12–02:55 using Masala's 2026-05-14 permanent short template. NOTE: this 09:10 descriptive text is superseded by the 09:55 urgent style recheck above; house-style READY now requires VIBE ZONE/OpenClaw branding and clean white hook/captions by default. No external posting, login/cookie use, public exposure, or API write was performed.

- READY LOCAL BUNDLE — `media/renders/stream2-start-posting-clips-template-20260514T0910Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-clips-find-viewers-template.mp4` (43s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream2-start-posting-clips-template-20260514T0910Z/`
  - Upload card: `media/exports/clip_stream2-start-posting-clips-template-20260514T0910Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-clips-find-viewers-template-thumbnail.jpg`
  - Review: `media/reviews/stream2-start-posting-clips-template-20260514T0910Z.review.md` / `.json`
  - Contact sheet: `media/reviews/stream2-start-posting-clips-template-20260514T0910Z-contact-sheet.jpg`
  - Verification: ffprobe/decode pass, caption QA pass (88 one-word events), contact-sheet vision CAUTION only because source notes/chat text may be readable at full resolution; final owner privacy/watch pass required before public upload. `npm run build` pass; `npm run lint` pass. Local API responded but currently reports `ok:false` because the newest Day 4 stream `_R2pPID8N-o` has not been imported/downloaded yet; counts now show 15 clips, 81 media jobs, 0 active/failed jobs.
  - Data/UI: added `clip_stream2_start_posting_clips_template_20260514T0910Z` and dispatch item `dispatch_clip_stream2_start_posting_clips_template_20260514T0910Z` for local manual dispatch review.

### Current blocker — 2026-05-14 09:10 UTC
- API health blocker: newest stream source `_R2pPID8N-o` (Day 4) is missing locally. Safe local work continued against already-ingested Stream 2; do not download/import externally unless Masala approves that workflow.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 08:17 UTC

Audited the suspended `Billion Dollar Company, No Experience` legacy package after the style-regression catch. Legacy audit sheet `media/reviews/style-regression/audit-billion-company-legacy-20260514T0817Z.jpg` showed no obvious blue-card artifact, but it remains suspended for the current gate because the VIBE ZONE house brand was not present and caption coverage was weaker/inconsistent than the restored standard. No obvious secrets/private text were visible in the sampled legacy frames.

Rerendered the clip with the restored house-style v3 default: centered/cropped source screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue card, and no square-face-default layout. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- READY — `media/renders/stream-2-billion-company-no-experience-house-v3-20260514T0817Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-billion-company-no-experience-house-v3.mp4` (24s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-billion-company-no-experience-house-v3-20260514T0817Z/`
  - Upload card: `media/exports/clip_stream-2-billion-company-no-experience-house-v3-20260514T0817Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-billion-company-no-experience-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-billion-company-no-experience-house-v3-20260514T0817Z/`
  - Contact sheet: `media/reviews/stream-2-billion-company-no-experience-house-v3-20260514T0817Z-contact-sheet.jpg`
  - Legacy audit sheet: `media/reviews/style-regression/audit-billion-company-legacy-20260514T0817Z.jpg`
  - Review: `media/reviews/stream-2-billion-company-no-experience-house-v3-20260514T0817Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (25 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), corrected contact-sheet vision PASS with VIBE ZONE/OpenClaw branding visible, white text/captions retained, screen context dominant, and no obvious secrets/private text; `npm run build` pass; `npm run lint` pass.
  - Data/UI: added `clip_stream2_billion_company_no_experience_house_v3_20260514T0817Z` and dispatch item `dispatch_clip_stream2_billion_company_no_experience_house_v3_20260514T0817Z` for local manual dispatch review.
  - Supersedes suspended `media/renders/stream-2-more-billion-company-no-experience-centered-screen-20260512T2131Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 08:17 UTC
- CORRECTED READY: 18 current upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 36 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-billion-company-house-v3-20260514T0817Z.mjs`.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 07:42 UTC

Style-corrected the suspended Stream 2 mic/setup family (`Fix The Mic, Then Build The Company` / `Mic Check Before The Build`) into `Mic First, Company Second`, using the current house-style v3 default: centered/cropped source screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue-card regression, and no square-face-default layout. Chose the cleaner 11:28–11:46 window to avoid the earlier profanity while preserving the build-in-public setup-blocker story. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- READY — `media/renders/stream-2-mic-first-company-second-house-v3-20260514T0742Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-mic-first-company-second-house-v3.mp4` (18s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-mic-first-company-second-house-v3-20260514T0742Z/`
  - Upload card: `media/exports/clip_stream-2-mic-first-company-second-house-v3-20260514T0742Z/upload-card.md`
  - YouTube/TikTok drafts: `youtube-upload.md` / `tiktok-upload.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-mic-first-company-second-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-mic-first-company-second-house-v3-20260514T0742Z/`
  - Contact sheet: `media/reviews/stream-2-mic-first-company-second-house-v3-20260514T0742Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-mic-first-company-second-house-v3-20260514T0742Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (32 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), contact-sheet vision PASS with house branding/captions visible and no obvious secrets/private text; `npm run build` pass; `npm run lint` pass; `/api/health` ok.
  - Data/UI: added `clip_stream2_mic_first_company_second_house_v3_20260514T0742Z` and dispatch item `dispatch_clip_stream2_mic_first_company_second_house_v3_20260514T0742Z` for local manual dispatch review.
  - Supersedes the suspended mic/setup legacy family for this segment. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 07:42 UTC
- CORRECTED READY: 17 current upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 37 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-mic-first-company-second-house-v3-20260514T0742Z.mjs`.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 06:47 UTC

Audited the suspended `My Test Clips Were A Total Flop` legacy package after the style-regression catch. Legacy audit sheet `media/reviews/style-regression/audit-black-screen-flop-legacy-20260514T0647Z.jpg` remains suspended for the current gate: no blue-card artifact was visible, but the old package has brand mismatch/weak VIBE ZONE house branding, fragmented caption coverage in sampled frames, and too much unused black space for the restored house style.

Rerendered the clip as `My Test Clips Flopped` using the current house-style v3 default: cropped/centered source screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue card, and no square-face-default layout. No external posting, login/cookie use, public exposure, API write, or site restart was performed.

- READY — `media/renders/stream-2-black-screen-flop-house-v3-20260514T0647Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-test-clips-flopped-house-v3.mp4` (22s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-black-screen-flop-house-v3-20260514T0647Z/`
  - Upload card: `media/exports/clip_stream-2-black-screen-flop-house-v3-20260514T0647Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-test-clips-flopped-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-black-screen-flop-house-v3-20260514T0647Z/`
  - Contact sheet: `media/reviews/stream-2-black-screen-flop-house-v3-20260514T0647Z-contact-sheet.jpg`
  - Legacy audit sheet: `media/reviews/style-regression/audit-black-screen-flop-legacy-20260514T0647Z.jpg`
  - Review: `media/reviews/stream-2-black-screen-flop-house-v3-20260514T0647Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (31 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), corrected contact-sheet vision PASS with no unwanted blue card, VIBE ZONE/OpenClaw branding visible, white hook/captions retained, screen context dominant, and no obvious secrets/private text; `npm run build` pass; `npm run lint` pass; script syntax check pass.
  - Data/UI: added `clip_stream2_black_screen_flop_house_v3_20260514T0647Z` and dispatch item `dispatch_clip_stream2_black_screen_flop_house_v3_20260514T0647Z` for local manual dispatch review.
  - Supersedes suspended `media/renders/stream-2-more-black-screen-flop-centered-screen-20260512T2131Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 06:47 UTC
- CORRECTED READY: 16 current upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 38 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-black-screen-flop-house-v3-20260514T0647Z.mjs`.

## STREAM 2 FRESH CLIP — 2026-05-14 06:08 UTC

Rendered a new Stream 2 privacy/OpSec short, `Keep The Stream On, Hide Secrets`, from 17:21–17:54 using the current house-style v3 layout: centered/cropped source screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue-card regression, and no square-face-default layout. No external posting, login/cookie use, public exposure, or API write was performed.

- READY — `media/renders/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-keep-stream-hide-secrets-house-v3.mp4` (33s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z/`
  - Upload card: `media/exports/clip_stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-keep-stream-hide-secrets-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z/`
  - Contact sheet: `media/reviews/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (77 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), proof-frame vision CAUTION only because the clip discusses SSH/API/private keys and full playback should confirm no actual credentials/IPs are readable; no browser/address bar or obvious secrets in sampled frames; `npm run build` pass; `npm run lint` pass; `/api/health` ok.
  - Data/UI: added `clip_stream2_keep_stream_hide_secrets_house_v3_20260514T0608Z` and dispatch item `dispatch_clip_stream2_keep_stream_hide_secrets_house_v3_20260514T0608Z` for local manual dispatch review.
  - Final owner privacy/watch pass still required before public upload because monitor/UI content is visible and the segment discusses sensitive setup topics.

### Current style-gated counts — 2026-05-14 06:08 UTC
- CORRECTED READY: 15 current upload candidates.
- NEEDS-RERENDER / STYLE RECHECK: 39 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-keep-stream-hide-secrets-house-v3-20260514T0608Z.mjs`.

## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 05:17 UTC

Audited the suspended `Live Setup Rule: Don’t Leak Anything` legacy package after the style-regression catch. Legacy audit sheet `media/reviews/style-regression/audit-live-no-leaks-legacy-20260514T0517Z.jpg` failed the current house-style gate because VIBE ZONE branding was missing; automated/media decode was fine, and no obvious blue-card artifact was visible, but the old package remains suspended.

Rerendered the clip as `The First Rule Is No Leaks` with the restored house-style default: centered/cropped source screen context, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue card, and no square-face-default layout. No external posting, login/cookie use, public exposure, or site restart was performed.

- READY — `media/renders/stream-2-live-no-leaks-house-v3-20260514T0517Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-first-rule-no-leaks-house-v3.mp4` (28s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-live-no-leaks-house-v3-20260514T0517Z/`
  - Upload card: `media/exports/clip_stream-2-live-no-leaks-house-v3-20260514T0517Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-first-rule-no-leaks-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-live-no-leaks-house-v3-20260514T0517Z/`
  - Contact sheet: `media/reviews/stream-2-live-no-leaks-house-v3-20260514T0517Z-contact-sheet.jpg`
  - Legacy audit sheet: `media/reviews/style-regression/audit-live-no-leaks-legacy-20260514T0517Z.jpg`
  - Review: `media/reviews/stream-2-live-no-leaks-house-v3-20260514T0517Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (50 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), corrected contact-sheet vision CAUTION only because dense stream UI text is hard to verify at contact-sheet size; full-size proof-frame vision PASS with no readable secrets/API keys/passwords/tokens/addresses/private account details; `npm run build` pass.
  - Supersedes suspended `media/renders/stream-2-more-live-no-leaks-prompt-centered-screen-20260512T2131Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 05:17 UTC
- CORRECTED READY: 14 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3, Stream 2 secure-VPS/no-leaks house-v3, Stream 2 rename-channel house-v3, Stream 2 big-day-sprint house-v3, Stream 2 socials-to-VPS plan house-v3 privacycrop, Stream 2 first-rule-no-leaks house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 39 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-live-no-leaks-house-v3-20260514T0517Z.mjs`.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 04:52 UTC

Style-corrected the suspended Stream 2 social setup family into `From Socials To VPS`, using the current house-style default and an extra privacy crop that removes the browser/address bar from the centered source screen. The first 04:42Z proof was marked superseded after the proof-frame gate flagged visible browser/address-bar text; the 04:52Z rerender is the upload candidate. No external posting, login/cookie use, public exposure, or API write was performed.

- READY — `media/renders/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-socials-to-vps-plan-house-v3-privacycrop.mp4` (31s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z/`
  - Upload card: `media/exports/clip_stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-socials-to-vps-plan-house-v3-privacycrop-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z/`
  - Contact sheet: `media/reviews/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (93 one-word events after dropping standalone `A`/`I` article captions), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), proof-frame vision CAUTION only for small/dark source-screen details and lower-half density; no obvious secrets/address bar/private info; `npm run build` pass; `/api/health` ok.
  - Data/UI: added `clip_stream2_social_to_vps_plan_house_v3_privacycrop_20260514T0452Z` and dispatch item `dispatch_clip_stream2_social_to_vps_plan_house_v3_privacycrop_20260514T0452Z`; marked the uncropped 04:42Z attempt as superseded/blocked from upload.
  - Supersedes suspended `stream-2-more-social-setup-plan-centered-screen-20260512T2131Z.mp4` and `stream-2-social-accounts-setup-facecam-smart-20260513T0430Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 04:52 UTC
- CORRECTED READY: 13 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3, Stream 2 secure-VPS/no-leaks house-v3, Stream 2 rename-channel house-v3, Stream 2 big-day-sprint house-v3, Stream 2 socials-to-VPS plan house-v3 privacycrop).
- NEEDS-RERENDER / STYLE RECHECK: 40 legacy packaged candidates remain suspended pending visual style gate.
- New scripts: `scripts/render-stream2-social-to-vps-plan-house-v3-20260514T0442Z.mjs` (superseded proof) and `scripts/render-stream2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.mjs` (current candidate).


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 03:47 UTC

Audited the suspended `Big Day Build Sprint` legacy package after the style-regression catch. Legacy audit sheet `media/reviews/style-regression/audit-big-day-sprint-legacy-20260514T0347Z.jpg` failed the current house-style gate because VIBE ZONE branding was missing, even though no blue-card artifact or obvious secrets were visible.

Rerendered the clip with the restored house-style default: centered source screen/context first, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue card, and no square-face-default layout. No external posting, login/cookie use, public exposure, or site restart was performed.

- READY — `media/renders/stream-2-big-day-sprint-house-v3-20260514T0347Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-big-day-build-sprint-house-v3.mp4` (30s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-big-day-sprint-house-v3-20260514T0347Z/`
  - Upload card: `media/exports/clip_stream-2-big-day-sprint-house-v3-20260514T0347Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-big-day-build-sprint-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-big-day-sprint-house-v3-20260514T0347Z/`
  - Contact sheet: `media/reviews/stream-2-big-day-sprint-house-v3-20260514T0347Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-big-day-sprint-house-v3-20260514T0347Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (31 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `squareFaceBoxDefault: false`, `bottomVoid: false`), vision contact-sheet PASS with minor caution that a few one-word captions are isolated/cropped-looking in the contact sheet, `npm run build` pass.
  - Supersedes suspended `media/renders/stream-2-big-day-sprint-centered-screen-20260512T2117Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 03:47 UTC
- CORRECTED READY: 12 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3, Stream 2 secure-VPS/no-leaks house-v3, Stream 2 rename-channel house-v3, Stream 2 big-day-sprint house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 41 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-big-day-house-v3-20260514T0347Z.mjs`.


## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 02:17 UTC

Audited the suspended `Should I Rename The Channel?` legacy family after the style-regression catch. The old facecam-smart package **fails** the house-style gate: `media/reviews/style-regression/audit-should-i-rename-legacy-20260514T0217Z.jpg` shows prominent blue/purple card treatment, a square face-box/webcam-forward layout, missing VIBE ZONE/OpenClaw branding, and weak screen/context progression. No obvious secrets/private text were visible in the legacy audit sheet, but it remains suspended.

Rerendered the clip with the restored house-style default: centered source screen/context first, clean white title/captions, VIBE ZONE + OpenClaw branding, dim blurred source underlay, no blue card, and no square-face-default layout. No external posting, login/cookie use, public exposure, or site restart was performed.

- READY — `media/renders/stream-2-rename-channel-house-v3-20260514T0217Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-rename-the-channel-house-v3.mp4` (34s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-rename-channel-house-v3-20260514T0217Z/`
  - Upload card: `media/exports/clip_stream-2-rename-channel-house-v3-20260514T0217Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-rename-the-channel-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-rename-channel-house-v3-20260514T0217Z/`
  - Contact sheet: `media/reviews/stream-2-rename-channel-house-v3-20260514T0217Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-rename-channel-house-v3-20260514T0217Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (37 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `bottomVoid: false`), vision contact-sheet PASS with minor logo-legibility caution.
  - Supersedes suspended `media/renders/stream-2-should-i-rename-the-channel-facecam-smart-20260513T0738Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload because monitor/UI content is visible.

### Current style-gated counts — 2026-05-14 02:17 UTC
- CORRECTED READY: 11 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3, Stream 2 secure-VPS/no-leaks house-v3, Stream 2 rename-channel house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 42 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-rename-channel-house-v3-20260514T0217Z.mjs`.

## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 01:34 UTC

Style-corrected the older Stream 2 `Secure VPS Setup Live`/no-leaks candidate into the current house-style default: centered source screen/context first, clean white title/captions, visible VIBE ZONE + OpenClaw branding, dim blurred source underlay, and no blue-card/square-face regression. This is local manual-upload prep only; no external posting, login/cookie use, public exposure, or API write was performed.

- READY — `media/renders/stream-2-secure-vps-house-v3-20260514T0134Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-secure-vps-no-leaks-house-v3.mp4` (20s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-secure-vps-house-v3-20260514T0134Z/`
  - Upload card: `media/exports/clip_stream-2-secure-vps-house-v3-20260514T0134Z/upload-card.md`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-secure-vps-no-leaks-house-v3-thumbnail.jpg`
  - Post-ready review bundle: `media/post-ready-review/stream-2-secure-vps-house-v3-20260514T0134Z/`
  - Contact sheet: `media/reviews/stream-2-secure-vps-house-v3-20260514T0134Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-secure-vps-house-v3-20260514T0134Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (46 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `bottomVoid: false`), vision contact-sheet PASS with only small-UI-text/owner-watch cautions, `npm run build` pass, `/api/health` ok.
  - Data/UI: added `clip_stream2_secure_vps_house_v3_20260514T0134Z` and dispatch item `dispatch_clip_stream2_secure_vps_house_v3_20260514T0134Z` to the local manual dispatch queue.
  - Supersedes suspended `media/renders/stream-2-secure-vps-setup-facecam-smart-20260513T0600Z.mp4` for this clip family. Final owner privacy/watch pass still required before public upload.

### Current style-gated counts — 2026-05-14 01:34 UTC
- CORRECTED READY: 10 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3, Stream 2 secure-VPS/no-leaks house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 43 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-secure-vps-house-v3-20260514T0134Z.mjs`.

## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 00:47 UTC

Audited the high-priority “Build While I Sleep” legacy family after Masala’s style-regression catch. The existing screen-card/facecam variants are **not READY** under the restored house-style gate: automated checks did not catch the visual problem, but vision audit of `media/reviews/style-regression/audit-build-while-practice-20260514T0047Z.jpg` failed the left/middle panels for saturated blue-card artifact and the right panel for blue-card + missing VIBE ZONE/OpenClaw branding.

Rerendered the family with the current house-style default: source screen/context first, clean white hook/captions, explicit VIBE ZONE text plus OpenClaw logo, dim blurred source underlay, no blue card, and no square-face-default layout.

- READY — `media/renders/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-build-while-i-sleep-house-v3.mp4` (16s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-build-while-i-sleep-house-v3-20260514T0047Z/`
  - Post-ready review bundle: `media/post-ready-review/stream-2-build-while-i-sleep-house-v3-20260514T0047Z/`
  - Contact sheet: `media/reviews/stream-2-build-while-i-sleep-house-v3-20260514T0047Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (23 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `bottomVoid: false`), vision contact-sheet PASS, `npm run build` pass.
  - Visual check: PASS; VIBE ZONE/OpenClaw branding visible, clean white title/captions, screen/context-led layout, no unwanted blue-card/square-face regression, no obvious secrets/private text in sampled contact sheet. Final owner privacy/watch pass still required before public upload.
  - Supersedes suspended `stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4`, older `stream-2-build-while-i-sleep-screen-card-20260513T1652Z.mp4`, and facecam/card attempts for this clip family.

### Current style-gated counts — 2026-05-14 00:47 UTC
- CORRECTED READY: 9 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3, Stream 2 build-while-I-sleep house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 44 legacy packaged candidates remain suspended pending visual style gate.
- Restored default renderer controls: `src/App.tsx` now defaults Clip Factory renders to `house-style`; `facecam-smart` is relabeled as an optional facecam variant; `server/server.mjs` now has a `house-style` preset/mode with screen-first layout, OpenClaw logo, white text, dim source underlay, and no blue-card default.
- New script: `scripts/render-stream2-build-while-i-sleep-house-v3-20260514T0047Z.mjs`.
- No external posting, login/cookie use, public exposure, or site restart.

## STREAM 2 HOUSE-STYLE CORRECTION — 2026-05-14 00:04 UTC

Created and promoted a corrected Stream 2 thumbnail-quality candidate from 05:20–05:38. This replaces the older thumbnail/quality-check family with the current house-style default: source screen centered as the hero, clean white hook/captions, visible VIBE ZONE + OpenClaw branding, dim blurred source underlay, and no blue-card/square-face regression.

- READY — `media/renders/stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3.mp4` (18s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z/`
  - Post-ready review bundle: `media/post-ready-review/stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z/`
  - Thumbnail: `media/exports/READY_TO_SHIP_NOW/short-thumbnail-looks-mid-house-v3-thumbnail.jpg`
  - Contact sheet: `media/reviews/stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-thumbnail-looks-mid-house-v3-20260514T0004Z.review.md` / `.json` — score 100/100, ready yes, no automated issues.
  - Verification: ffprobe/decode pass, caption QA pass (35 one-word events), automated review 100/100, vision contact-sheet audit pass with one caution to spot-check the final darker UI/dialog frame, `npm run build` pass.
  - Data/UI: added `clip_stream2_thumbnail_looks_mid_house_v3_20260514T0004Z` and dispatch item `dispatch_clip_stream2_thumbnail_looks_mid_house_v3_20260514T0004Z` to the local manual dispatch queue.
  - Visual check: PASS; VIBE ZONE/OpenClaw branding visible, white hook/captions, centered screen-context layout, no unwanted blue-card/square-face regression, no obvious secrets/private text in sampled contact sheet. Final owner privacy/watch pass still required before public upload.

### Current style-gated counts — 2026-05-14 00:04 UTC
- CORRECTED READY: 8 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3, Stream 2 thumbnail-looks-mid house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 45 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-thumbnail-mid-house-v3-20260514T0004Z.mjs`.
- No external posting, login/cookie use, public exposure, or site restart.
> **STYLE GATE NOTICE — 2026-05-13 18:27 UTC:** Masala caught a style regression: some clips marked READY use too much square-face/blue-card treatment and do not follow screen context well enough. Treat previous READY status as **packaged but suspended** until each clip passes the house-style visual gate: VIBE ZONE branding, clean white text, no blue box/card artifact, screen/context visible, square face only optional. See `STYLE_REGRESSION_FIX.md`.

Scope: practical non-temp Stream 2 and Day 3 MP4 clip renders in `media/renders`; long-form/temp/failed/proof/duplicate variants are listed as skipped, not hidden.


## DAY 3 STYLE REGRESSION CORRECTION — 2026-05-13 23:20 UTC

Rerendered the suspended “No Sleep Shipping / Ship Live, Fix Later” family that previously used a saturated blue card and square-face-forward treatment (`day3-no-sleep-shipping-live-safe-caption-rerender-20260513T1512Z.mp4`, older `day3-no-sleep-shipping-constantly-facecam-smart-20260513T1417Z.mp4`). The new candidate restores the current house-style default: source screen/context first, clean white hook/captions, visible VIBE ZONE + OpenClaw branding, dim blurred source underlay filling the lower half, no unwanted blue-card artifact, and no square face box default.

- READY — `media/renders/day3-no-sleep-shipping-house-v3-20260513T2317Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-ship-live-fix-later-house-v3.mp4` (30s, 1080x1920)
  - Upload bundle: `media/exports/clip_day3-no-sleep-shipping-house-v3-20260513T2317Z/`
  - Contact sheet: `media/reviews/day3-no-sleep-shipping-house-v3-20260513T2317Z-contact-sheet.jpg`
  - Review: `media/reviews/day3-no-sleep-shipping-house-v3-20260513T2317Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (56 one-word events), automated style review PASS (`blueCardArtifact: false`, `weakScreenContext: false`, `bottomVoid: false`), vision contact-sheet PASS.
  - Visual check: PASS; visible VIBE ZONE/OpenClaw branding, white title/captions, screen/context-led layout, no unwanted blue-card/square-face regression, no obvious secrets/private text in sampled contact sheet.
  - Supersedes `day3-no-sleep-shipping-live-safe-caption-rerender-20260513T1512Z.mp4` and `day3-no-sleep-shipping-constantly-facecam-smart-20260513T1417Z.mp4` for this clip family.

### Current style-gated counts — 2026-05-13 23:20 UTC
- CORRECTED READY: 7 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3, Day 3 no-sleep/ship-live house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 46 legacy packaged candidates remain suspended if counting the two superseded no-sleep variants as resolved from the prior 48-candidate suspended pool.
- New script: `scripts/render-day3-no-sleep-shipping-house-v3-20260513T2317Z.mjs`.
- No external posting, login/cookie use, public exposure, or site restart.

## STREAM 2 HOUSE-STYLE ADDITION — 2026-05-13 22:34 UTC

Created and promoted a fresh Stream 2 local-only candidate from 03:12–03:32, adjacent to but not duplicative of the later “Build While I Sleep” cut. It uses the current house style: centered source screen, clean white title/captions, visible OpenClaw/VIBE ZONE branding, dim blurred source underlay filling the lower half, and no blue-card/square-face regression.

- READY — `media/renders/stream-2-project-progress-offline-house-v3-20260513T2234Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-project-moves-without-me-house-v3.mp4` (20s, 1080x1920)
  - Upload bundle: `media/exports/clip_stream2_project_progress_offline_house_v3_20260513T2234Z/`
  - Upload card: `media/exports/clip_stream2_project_progress_offline_house_v3_20260513T2234Z/upload-card.md`
  - Thumbnail: `media/exports/clip_stream2_project_progress_offline_house_v3_20260513T2234Z/thumbnail-project-moves-without-me.jpg`
  - Contact sheet: `media/reviews/stream-2-project-progress-offline-house-v3-20260513T2234Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-project-progress-offline-house-v3-20260513T2234Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (65 one-word events), automated review `100/100`, vision contact-sheet PASS, `npm run build` pass, `/api/health` ok on dev server.
  - Data/UI: added `clip_stream2_project_progress_offline_20260513T2234Z` and dispatch item `dispatch_clip_stream2_project_progress_offline_20260513T2234Z` to the local manual dispatch queue.
  - Visual check: PASS; no obvious secrets/private text in sampled contact sheet; final full-resolution owner privacy/watch pass still required before any public upload.

### Current style-gated counts — 2026-05-13 22:34 UTC
- CORRECTED READY: 6 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Project Moves Without Me house-v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 48 legacy packaged candidates remain suspended pending visual style gate.
- New script: `scripts/render-stream2-project-progress-offline-house-v3-20260513T2234Z.mjs`.
- No external posting, login/cookie use, public exposure, or site restart.

## DAY 3 HOUSE-STYLE CORRECTION — 2026-05-13 21:47 UTC

Promoted the remaining two Day 3 originals that were blocked by the 20:36 UTC bottom-empty/style review. Both were rerendered with the restored house default: source screen/context first, clean white hook/captions, visible VIBE ZONE + OpenClaw branding, dim blurred source underlay filling the lower half, no blue/card artifact, and no square-face default.

- READY — `media/renders/day3-honest-ai-chat-house-v3-20260513T2147Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-honest-ai-not-fake-chat-house-v3.mp4` (26s, 1080x1920)
  - Upload bundle: `media/exports/clip_day3-honest-ai-chat-house-v3-20260513T2147Z/`
  - Contact sheet: `media/reviews/day3-honest-ai-chat-house-v3-20260513T2147Z-contact-sheet.jpg`
  - Review: `media/reviews/day3-honest-ai-chat-house-v3-20260513T2147Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (78 one-word events), vision contact-sheet PASS, `npm run build` pass.
  - Visual check: PASS; visible VIBE ZONE/OpenClaw branding, white hook/captions, screen/context-led layout, no unwanted blue-card/square-face regression, no obvious secrets/private text.
  - Supersedes `day3-honest-ai-chat-20260513T2024Z.mp4` and older `20260513T2020Z` attempts for this clip family.
- READY — `media/renders/day3-agent-loop-keeps-building-house-v3-20260513T2147Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-agents-keep-the-build-moving-house-v3.mp4` (28s, 1080x1920)
  - Upload bundle: `media/exports/clip_day3-agent-loop-keeps-building-house-v3-20260513T2147Z/`
  - Contact sheet: `media/reviews/day3-agent-loop-keeps-building-house-v3-20260513T2147Z-contact-sheet.jpg`
  - Review: `media/reviews/day3-agent-loop-keeps-building-house-v3-20260513T2147Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (62 one-word events), vision contact-sheet PASS, `npm run build` pass.
  - Visual check: PASS; visible VIBE ZONE/OpenClaw branding, white hook/captions, screen/context-led layout, no unwanted blue-card/square-face regression, no obvious secrets/private text.
  - Supersedes `day3-agent-loop-keeps-building-20260513T2024Z.mp4` and older `20260513T2020Z` attempts for this clip family.

### Current style-gated counts — 2026-05-13 21:47 UTC
- CORRECTED READY: 5 current upload candidates (clip-machine restored-layout-v2, AI Agents v3, Day 3 platform house-v3, Day 3 honest-AI house-v3, Day 3 agent-loop house-v3).
- NEEDS-RERENDER / STYLE RECHECK: 48 legacy packaged candidates remain suspended pending visual style gate; 0 remaining from the 20:36 UTC Day 3 originals batch.
- New script: `scripts/render-day3-honest-agent-house-v3-20260513T2147Z.mjs`.
- Combined screenshot/contact sheet: `media/reviews/day3-house-v3-20260513T2147Z-corrected-contact-sheet.jpg`.
- No external posting, login/cookie use, public exposure, or site restart.


## DAY 3 HOUSE-STYLE CORRECTION — 2026-05-13 21:08 UTC

Promoted one corrected Day 3 clip from the prior bottom-empty batch:

- READY — `media/renders/day3-platform-creates-content-house-v3-20260513T2104Z.mp4` → ready copy `media/exports/READY_TO_SHIP_NOW/short-stream-once-clip-forever-house-v3.mp4` (22s, 1080x1920)
  - Upload bundle: `media/exports/clip_day3-platform-creates-content-house-v3-20260513T2104Z/`
  - Contact sheet: `media/reviews/day3-platform-creates-content-house-v3-20260513T2104Z-contact-sheet.jpg`
  - Thumbnail: `media/exports/clip_day3-platform-creates-content-house-v3-20260513T2104Z/thumbnail-stream-once-clip-forever.jpg`
  - Review: `media/reviews/day3-platform-creates-content-house-v3-20260513T2104Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - Verification: ffprobe/decode pass, caption QA pass (46 one-word events), vision contact-sheet PASS, `npm run build`, `/api/health` ok.
  - Visual check: PASS; clean white title/captions, centered source-screen context, OpenClaw logo below video, no blue-card/square-face regression, dim blurred source underlay fills the lower half, no obvious secrets/private text.
  - Supersedes the `day3-platform-creates-content-20260513T2024Z.mp4` needs-rerender attempt for this clip family.

## DAY 3 ORIGINALS RECHECK — 2026-05-13 20:36 UTC

Reviewed the newest `20260513T2024Z` Day 3 local renders with ffprobe/decode, `scripts/review-render.mjs`, caption QA JSON, and contact-sheet image audit. **No new corrected READY clips were promoted.** All three renders need a layout rerender before upload because the bottom half is mostly empty black / weakly used, even though caption QA passes and no obvious secrets/private text were found:

- NEEDS-RERENDER — `media/renders/day3-platform-creates-content-20260513T2024Z.mp4` — review score 70/100; bottom-half void detected; caption QA OK (`media/transcripts/day3-platform-creates-content-20260513T2024Z.qa.json`).
- NEEDS-RERENDER — `media/renders/day3-honest-ai-chat-20260513T2024Z.mp4` — review score 70/100; bottom-half void detected; caption QA OK (`media/transcripts/day3-honest-ai-chat-20260513T2024Z.qa.json`).
- NEEDS-RERENDER — `media/renders/day3-agent-loop-keeps-building-20260513T2024Z.mp4` — review score 70/100 after tightening the automated bottom-void gate; caption QA OK (`media/transcripts/day3-agent-loop-keeps-building-20260513T2024Z.qa.json`).

The older `20260513T2020Z` variants remain superseded by these newer attempts but are not READY either. I also tightened `scripts/review-render.mjs` so high-dark/low-edge bottom voids fail even when a tiny amount of caption brightness is present. No external posting/login/cookie/public action taken.

## STYLE REGRESSION RECHECK — 2026-05-13 20:17 UTC

Ran the style gate against the latest high-priority restored-layout proof for “Build The Clip Machine.” The `2012Z` v2 render passes image audit, ffprobe/decode, caption QA, and proof-frame review. It becomes the current READY candidate for that clip family; the earlier `1902Z` pass is retained as a superseded proof, not the preferred upload candidate. No external posting/login/cookie/public action taken.

## STYLE REGRESSION RECHECK — 2026-05-13 19:02 UTC

Previous READY entries remain **suspended** unless listed in the corrected-ready section below. Masala's style gate is now enforced before READY: no unwanted blue box/card artifact, VIBE ZONE branding, clean white text/captions, screen/context-led composition, ffprobe/review pass, reasonable proof frames, and no visible secrets/private text.

### Style-corrected counts
- CORRECTED READY: 2 current upload candidates (clip-machine restored-layout-v2 + AI Agents v3)
- NEEDS-RERENDER / STYLE RECHECK: 48 packaged candidates remain suspended (45 previous READY + 3 previous NEEDS-FIX/privacy-risk items)
- Known visual-regression family superseded: `stream-2-build-the-clip-machine-live-screen-card-20260513T1804Z.mp4`, `stream-2-build-the-clip-machine-live-house-style-20260513T1827Z.mp4`, `stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z.mp4`, `stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1838Z.mp4`, `stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1850Z.mp4`, `stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1855Z.mp4`.
- AI Agents rerender attempts superseded by v3: `stream-2-ai-agents-real-work-house-style-20260513T1934Z.mp4` and `stream-2-ai-agents-real-work-house-style-v2-20260513T1938Z.mp4` (both local proof attempts; v3 fixes lower-half composition).
- Clip-machine passing candidate superseded by restored-layout-v2: `stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z.mp4` (passed the earlier gate, but v2 better restores Masala's requested title/screen/caption/logo layout).

### CORRECTED READY
- READY — `media/renders/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z.mp4` → `media/post-ready-review/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z` and ready copy `media/exports/READY_TO_SHIP_NOW/short-build-the-clip-machine-restored-layout-v2.mp4` (22s, 1080x1920)
  - Contact sheet: `media/reviews/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - ffprobe: bundle `ffprobe.json` — h264/aac, 1080x1920, 22.0s; decode pass.
  - Visual check: PASS by image audit; no unwanted blue card/box artifact, OpenClaw/VIBE ZONE branding present, white title/captions retained, centered source screen remains primary, no obvious secrets/private text.
  - Supersedes the earlier passing `stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z.mp4` candidate for this clip family because v2 better restores the requested title-top / screen-center / captions-above-logo / logo-below-video layout.
- READY — `media/renders/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z.mp4` → `media/post-ready-review/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z` and upload bundle `media/exports/clip_stream2_ai_agents_real_work_house_style_v3_20260513T1942Z/` (28s, 1080x1920)
  - Contact sheet: `media/reviews/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z-contact-sheet.jpg`
  - Review: `media/reviews/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z.review.md` / `.json` — score 100/100, ready yes, no issues.
  - ffprobe: bundle `ffprobe.json` — h264/aac, 1080x1920, 28.0s.
  - Upload copy: `media/exports/clip_stream2_ai_agents_real_work_house_style_v3_20260513T1942Z/upload-copy.md` (YouTube Shorts + TikTok local-only copy).
  - Visual check: PASS by image audit; clean white text/captions, no blue-card artifact, centered source screen remains primary, branding below video, no obvious secrets/private text.

## Counts
- READY: 46
- NEEDS-FIX: 3
- SKIP: 99

## READY
- READY — `media/renders/day3-a-stream-tool-worth-paying-for-centered-screen-20260513T0642Z.mp4` → `media/post-ready-review/day3-a-stream-tool-worth-paying-for-centered-screen-20260513t0642z` (12s, 1080x1920)
- READY — `media/renders/day3-ai-building-more-ai-facecam-smart-20260513T0647Z.mp4` → `media/post-ready-review/day3-ai-building-more-ai-facecam-smart-20260513t0647z` (17s, 1080x1920)
- READY — `media/renders/day3-an-iphone-for-streamers-facecam-smart-20260513T0947Z.mp4` → `media/post-ready-review/day3-an-iphone-for-streamers-facecam-smart-20260513t0947z` (23s, 1080x1920)
- READY — `media/renders/day3-build-the-face-tracker-live-facecam-smart-20260513T0947Z.mp4` → `media/post-ready-review/day3-build-the-face-tracker-live-facecam-smart-20260513t0947z` (76s, 1080x1920)
- READY — `media/renders/day3-build-while-i-m-off-stream-centered-screen-20260513T0642Z.mp4` → `media/post-ready-review/day3-build-while-i-m-off-stream-centered-screen-20260513t0642z` (12s, 1080x1920)
- READY — `media/renders/day3-content-is-a-funnel-centered-screen-20260513T0815Z.mp4` → `media/post-ready-review/day3-content-is-a-funnel-centered-screen-20260513t0815z` (37s, 1080x1920)
- READY — `media/renders/day3-continuous-agent-pipeline-centered-screen-20260513T0947Z.mp4` → `media/post-ready-review/day3-continuous-agent-pipeline-centered-screen-20260513t0947z` (41s, 1080x1920)
- READY — `media/renders/day3-first-auto-clip-shipped-live-facecam-smart-20260513T0815Z.mp4` → `media/post-ready-review/day3-first-auto-clip-shipped-live-facecam-smart-20260513t0815z` (16s, 1080x1920)
- READY — `media/renders/day3-make-ai-chat-feel-honest-facecam-smart-20260513T1427Z.mp4` → `media/post-ready-review/day3-make-ai-chat-feel-honest-facecam-smart-20260513t1427z` (26s, 1080x1920)
- READY — `media/renders/day3-no-sleep-shipping-constantly-facecam-smart-20260513T1417Z.mp4` → `media/post-ready-review/day3-no-sleep-shipping-constantly-facecam-smart-20260513t1417z` (30s, 1080x1920)
- READY — `media/renders/day3-no-sleep-shipping-live-safe-caption-rerender-20260513T1512Z.mp4` → `media/post-ready-review/day3-no-sleep-shipping-live-safe-caption-rerender-20260513t1512z` (30s, 1080x1920)
- READY — `media/renders/day3-product-or-content-machine-facecam-smart-20260513T0647Z.mp4` → `media/post-ready-review/day3-product-or-content-machine-facecam-smart-20260513t0647z` (13s, 1080x1920)
- READY — `media/renders/day3-quality-first-local-first-facecam-smart-20260513T0647Z.mp4` → `media/post-ready-review/day3-quality-first-local-first-facecam-smart-20260513t0647z` (18s, 1080x1920)
- READY — `media/renders/day3-ship-this-to-everyone-now-facecam-smart-v2-20260513T1117Z.mp4` → `media/post-ready-review/day3-ship-this-to-everyone-now-facecam-smart-v2-20260513t1117z` (22s, 1080x1920)
- READY — `media/renders/day3-the-facecam-is-missing-facecam-smart-20260513T0642Z.mp4` → `media/post-ready-review/day3-the-facecam-is-missing-facecam-smart-20260513t0642z` (14s, 1080x1920)
- READY — `media/renders/day3-the-platform-clips-everything-centered-screen-20260513T0815Z.mp4` → `media/post-ready-review/day3-the-platform-clips-everything-centered-screen-20260513t0815z` (20s, 1080x1920)
- READY — `media/renders/day3-this-is-how-streamers-practice-facecam-smart-safe-20260513T1547Z.mp4` → `media/post-ready-review/day3-this-is-how-streamers-practice-facecam-smart-safe-20260513t1547z` (24s, 1080x1920)
- READY — `media/renders/day3-troubleshoot-before-you-ship-centered-screen-20260513T0655Z.mp4` → `media/post-ready-review/day3-troubleshoot-before-you-ship-centered-screen-20260513t0655z` (38s, 1080x1920)
- READY — `media/renders/day3-tweaking-clip-presets-live-centered-screen-20260513T0655Z.mp4` → `media/post-ready-review/day3-tweaking-clip-presets-live-centered-screen-20260513t0655z` (16s, 1080x1920)
- READY — `media/renders/dejKxLu_iM0-01-come-on-let-s-go-we-ve-got-a-punchy.mp4` → `media/post-ready-review/dejkxlu-im0-01-come-on-let-s-go-we-ve-got-a-punchy` (64s, 1080x1920)
- READY — `media/renders/dejKxLu_iM0-02-let-me-fix-this-let-me-get-punchy.mp4` → `media/post-ready-review/dejkxlu-im0-02-let-me-fix-this-let-me-get-punchy` (64s, 1080x1920)
- READY — `media/renders/dejKxLu_iM0-03-quite-an-easy-one-actually-let-s-go-punchy.mp4` → `media/post-ready-review/dejkxlu-im0-03-quite-an-easy-one-actually-let-s-go-punchy` (64s, 1080x1920)
- READY — `media/renders/dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4` → `media/post-ready-review/dejkxlu-im0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions` (63s, 1080x1920)
- READY — `media/renders/stream-2-03-it-s-a-big-day-it-s-a-big-punchy.mp4` → `media/post-ready-review/stream-2-03-it-s-a-big-day-it-s-a-big-punchy` (31s, 1080x1920)
- READY — `media/renders/stream-2-ai-agents-actually-work-blur-pulse-underlay-20260513T1247Z.mp4` → `media/post-ready-review/stream-2-ai-agents-actually-work-blur-pulse-underlay-20260513t1247z` (28s, 1080x1920)
- READY — `media/renders/stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4` → `media/post-ready-review/stream-2-build-while-i-sleep-screen-card-tight-20260513t1700z` (16s, 1080x1920)
- READY — `media/renders/stream-2-big-day-sprint-centered-screen-20260512T2117Z.mp4` → `media/post-ready-review/stream-2-big-day-sprint-centered-screen-20260512t2117z` (30s, 1080x1920)
- READY — `media/renders/stream-2-c28d72-double-check-the-streams-we-ve-been-cool-facecam-right.mp4` → `media/post-ready-review/stream-2-c28d72-double-check-the-streams-we-ve-been-cool-facecam-right` (36s, 1080x1920)
- READY — `media/renders/stream-2-d44d5c-stop-overbuilding-and-ship-the-workflow-facecam-smart.mp4` → `media/post-ready-review/stream-2-d44d5c-stop-overbuilding-and-ship-the-workflow-facecam-smart` (12s, 1080x1920)
- READY — `media/renders/stream-2-f17815-ai-agents-that-actually-do-work-facecam-right.mp4` → `media/post-ready-review/stream-2-f17815-ai-agents-that-actually-do-work-facecam-right` (28s, 1080x1920)
- READY — `media/renders/stream-2-focused-12s-centered-screen.mp4` → `media/post-ready-review/stream-2-focused-12s-centered-screen` (12s, 1080x1920)
- READY — `media/renders/stream-2-huge-day-mic-fixed-facecam-smart-20260512T2235Z.mp4` → `media/post-ready-review/stream-2-huge-day-mic-fixed-facecam-smart-20260512t2235z` (18s, 1080x1920)
- READY — `media/renders/stream-2-more-agents-work-offstream-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-agents-work-offstream-centered-screen-20260512t2131z` (16s, 1080x1920)
- READY — `media/renders/stream-2-more-billion-company-no-experience-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-billion-company-no-experience-centered-screen-20260512t2131z` (24s, 1080x1920)
- READY — `media/renders/stream-2-more-black-screen-flop-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-black-screen-flop-centered-screen-20260512t2131z` (22s, 1080x1920)
- READY — `media/renders/stream-2-more-fix-mic-then-build-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-fix-mic-then-build-centered-screen-20260512t2131z` (29s, 1080x1920)
- READY — `media/renders/stream-2-more-live-no-leaks-prompt-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-live-no-leaks-prompt-centered-screen-20260512t2131z` (28s, 1080x1920)
- READY — `media/renders/stream-2-more-same-name-or-new-name-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-same-name-or-new-name-centered-screen-20260512t2131z` (27s, 1080x1920)
- READY — `media/renders/stream-2-more-social-setup-plan-centered-screen-20260512T2131Z.mp4` → `media/post-ready-review/stream-2-more-social-setup-plan-centered-screen-20260512t2131z` (30s, 1080x1920)
- READY — `media/renders/stream-2-no-leaks-centered-screen-final.mp4` → `media/post-ready-review/stream-2-no-leaks-centered-screen-final` (12s, 1080x1920)
- READY — `media/renders/stream-2-second-clip-facecam-smart.mp4` → `media/post-ready-review/stream-2-second-clip-facecam-smart` (28s, 1080x1920)
- READY — `media/renders/stream-2-should-i-rename-the-channel-facecam-smart-20260513T0738Z.mp4` → `media/post-ready-review/stream-2-should-i-rename-the-channel-facecam-smart-20260513t0738z` (34s, 1080x1920)
- READY — `media/renders/stream-2-thumbnail-looking-mid-facecam-smart-20260513T0002Z.mp4` → `media/post-ready-review/stream-2-thumbnail-looking-mid-facecam-smart-20260513t0002z` (17s, 1080x1920)
- READY — `media/renders/stream-2-thumbnail-quality-check-facecam-smart-20260513T0304Z.mp4` → `media/post-ready-review/stream-2-thumbnail-quality-check-facecam-smart-20260513t0304z` (17s, 1080x1920)
- READY — `media/renders/stream-2-youtube-progress-centered-screen-final-v2.mp4` → `media/post-ready-review/stream-2-youtube-progress-centered-screen-final-v2` (12s, 1080x1920)
- READY — `media/renders/stream2-mic-check-before-the-build-centered-screen-20260513T0642Z.mp4` → `media/post-ready-review/stream2-mic-check-before-the-build-centered-screen-20260513t0642z` (28s, 1080x1920)

## NEEDS-FIX
- NEEDS-FIX — `media/renders/day3-uploading-the-clip-live-centered-screen-20260513T0655Z.mp4` → `media/post-ready-review/day3-uploading-the-clip-live-centered-screen-20260513t0655z` — privacy-risk filename: upload UI may expose channel/account details; human visual review required
- NEEDS-FIX — `media/renders/stream-2-secure-vps-setup-facecam-smart-20260513T0600Z.mp4` → `media/post-ready-review/stream-2-secure-vps-setup-facecam-smart-20260513t0600z` — privacy-risk filename: VPS/security setup should get human visual review before upload
- NEEDS-FIX — `media/renders/stream-2-social-accounts-setup-facecam-smart-20260513T0430Z.mp4` → `media/post-ready-review/stream-2-social-accounts-setup-facecam-smart-20260513t0430z` — privacy-risk filename: social-account setup may expose account/session details; human visual review required

## SKIP / DUPLICATE / TEMP
- SKIP — `media/renders/day3-ai-building-more-ai-centered-screen-20260513T0642Z.mp4` — duplicate/older variant of day3-ai-building-more-ai-facecam-smart-20260513T0647Z.mp4
- SKIP — `media/renders/day3-make-ai-chat-feel-honest-centered-screen-20260513T1437Z.mp4` — duplicate/older variant of day3-make-ai-chat-feel-honest-facecam-smart-20260513T1427Z.mp4
- SKIP — `media/renders/day3-product-or-content-machine-centered-screen-20260513T0642Z.mp4` — duplicate/older variant of day3-product-or-content-machine-facecam-smart-20260513T0647Z.mp4
- SKIP — `media/renders/day3-quality-first-local-first-centered-screen-20260513T0642Z.mp4` — duplicate/older variant of day3-quality-first-local-first-facecam-smart-20260513T0647Z.mp4
- SKIP — `media/renders/day3-ship-this-to-everyone-now-facecam-smart-20260513T1117Z.mp4` — duplicate/older variant of day3-ship-this-to-everyone-now-facecam-smart-v2-20260513T1117Z.mp4
- SKIP — `media/renders/day3-this-is-how-streamers-practice-facecam-smart-20260513T0642Z.mp4` — duplicate/older variant of day3-this-is-how-streamers-practice-facecam-smart-safe-20260513T1547Z.mp4
- SKIP — `media/renders/day3-the-facecam-is-missing-facecam-tracked-smoke-20260513T0900Z.mp4` — duplicate/older variant of day3-the-facecam-is-missing-facecam-smart-20260513T0642Z.mp4; proof/test render, not upload candidate
- SKIP — `media/renders/day3-the-facecam-is-missing-facecam-tracked-v2-20260513T0905Z.mp4` — duplicate/older variant of day3-the-facecam-is-missing-facecam-smart-20260513T0642Z.mp4
- SKIP — `media/renders/dejKxLu_iM0-01-stop-overbuilding-and-ship-the-workflow-punchy.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4
- SKIP — `media/renders/dejKxLu_iM0-01-stop-overbuilding-and-ship-the-workflow.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4
- SKIP — `media/renders/dejKxLu_iM0-02-come-on-let-s-go-we-ve-got-a-punchy.mp4` — duplicate/older variant of dejKxLu_iM0-01-come-on-let-s-go-we-ve-got-a-punchy.mp4
- SKIP — `media/renders/dejKxLu_iM0-02-stop-overbuilding-and-ship-the-workflow.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4
- SKIP — `media/renders/dejKxLu_iM0-03-stop-overbuilding-and-ship-the-workflow-punchy.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4
- SKIP — `media/renders/dejKxLu_iM0-03-stop-overbuilding-and-ship-the-workflow.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4
- SKIP — `media/renders/dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-no-captions.mp4` — duplicate/older variant of dejKxLu_iM0-abb121-stop-overbuilding-and-ship-the-workflow-punchy-captions.mp4; explicit no-captions render
- SKIP — `media/renders/dejKxLu_iM0-facecam-right-test-stop-overbuilding.mp4` — proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-01-stop-overbuilding-and-ship-the-workflow-punchy.mp4` — duplicate/older variant of stream-2-d44d5c-stop-overbuilding-and-ship-the-workflow-facecam-smart.mp4
- SKIP — `media/renders/stream-2-02-ai-agents-that-actually-do-work-punchy.mp4` — duplicate/older variant of stream-2-f17815-ai-agents-that-actually-do-work-facecam-right.mp4
- SKIP — `media/renders/stream-2-ai-agents-actually-work-terminal-grid-underlay-20260513T1200Z.mp4` — duplicate/older variant of stream-2-ai-agents-actually-work-blur-pulse-underlay-20260513T1247Z.mp4
- SKIP — `media/renders/stream-2-build-while-i-sleep-facecam-smart-20260513T1634Z.mp4` — duplicate/older variant of stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4
- SKIP — `media/renders/stream-2-build-while-i-sleep-centered-screen-safe-20260513T1644Z.mp4` — duplicate/older variant of stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4
- SKIP — `media/renders/stream-2-build-while-i-sleep-screen-card-20260513T1652Z.mp4` — duplicate/older variant of stream-2-build-while-i-sleep-screen-card-tight-20260513T1700Z.mp4
- SKIP — `media/renders/stream-2-d44d5c-stop-overbuilding-and-ship-the-workflow-facecam-right.mp4` — duplicate/older variant of stream-2-d44d5c-stop-overbuilding-and-ship-the-workflow-facecam-smart.mp4
- SKIP — `media/renders/stream-2-focused-12s-facecam-fixed.mp4` — duplicate/older variant of stream-2-focused-12s-centered-screen.mp4
- SKIP — `media/renders/stream-2-hook-card-12s-proof-v2.mp4` — duplicate/older variant of stream-2-hook-card-12s-proof-v4.mp4; proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-hook-card-12s-proof-v3.mp4` — duplicate/older variant of stream-2-hook-card-12s-proof-v4.mp4; proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-hook-card-12s-proof-v4.mp4` — proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-hook-card-12s-proof.mp4` — duplicate/older variant of stream-2-hook-card-12s-proof-v4.mp4; proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-huge-day-mic-fixed-centered-screen-20260512T2230Z.mp4` — duplicate/older variant of stream-2-huge-day-mic-fixed-facecam-smart-20260512T2235Z.mp4
- SKIP — `media/renders/stream-2-no-leaks-centered-screen-v2.mp4` — duplicate/older variant of stream-2-no-leaks-centered-screen-final.mp4
- SKIP — `media/renders/stream-2-no-leaks-centered-screen-v3.mp4` — duplicate/older variant of stream-2-no-leaks-centered-screen-final.mp4
- SKIP — `media/renders/stream-2-no-leaks-centered-screen-v4.mp4` — duplicate/older variant of stream-2-no-leaks-centered-screen-final.mp4
- SKIP — `media/renders/stream-2-no-leaks-centered-screen.mp4` — duplicate/older variant of stream-2-no-leaks-centered-screen-final.mp4
- SKIP — `media/renders/stream-2-no-leaks-x-square.mp4` — duplicate/older variant of stream-2-no-leaks-centered-screen-final.mp4
- SKIP — `media/renders/stream-2-second-clip-facecam-smart-lowerfill-20260513T0130Z.mp4` — duplicate/older variant of stream-2-second-clip-facecam-smart.mp4
- SKIP — `media/renders/stream-2-second-clip-hook-card.mp4` — duplicate/older variant of stream-2-second-clip-facecam-smart.mp4
- SKIP — `media/renders/stream-2-should-i-rename-the-channel-centered-screen-20260513T0730Z.mp4` — duplicate/older variant of stream-2-should-i-rename-the-channel-facecam-smart-20260513T0738Z.mp4
- SKIP — `media/renders/stream-2-smart-pip-proof.mp4` — duplicate/older variant of stream-2-hook-card-12s-proof-v4.mp4; proof/test render, not upload candidate
- SKIP — `media/renders/stream-2-thumbnail-quality-check-centered-screen-20260513T0300Z.mp4` — duplicate/older variant of stream-2-thumbnail-quality-check-facecam-smart-20260513T0304Z.mp4
- SKIP — `media/renders/stream-2-youtube-progress-centered-screen-final.mp4` — duplicate/older variant of stream-2-youtube-progress-centered-screen-final-v2.mp4
- SKIP — `media/renders/stream-2-youtube-progress-centered-screen-v2.mp4` — duplicate/older variant of stream-2-youtube-progress-centered-screen-final-v2.mp4
- SKIP — `media/renders/stream-2-youtube-progress-centered-screen-v3.mp4` — duplicate/older variant of stream-2-youtube-progress-centered-screen-final-v2.mp4
- SKIP — `media/renders/stream-2-youtube-progress-centered-screen-v4.mp4` — duplicate/older variant of stream-2-youtube-progress-centered-screen-final-v2.mp4
- SKIP — `media/renders/stream-2-youtube-progress-centered-screen.mp4` — duplicate/older variant of stream-2-youtube-progress-centered-screen-final-v2.mp4
- SKIP — `media/renders/failed/dejKxLu_iM0-01-stop-overbuilding-and-ship-the-workflow.mp4.failed-20260512T054237Z` — failed render artifact
- SKIP — `media/renders/failed/dejKxLu_iM0-02-ai-agents-that-actually-do-work.mp4.failed-20260512T054237Z` — failed render artifact
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/01-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/02-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/03-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/04-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/05-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/06-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/07-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/08-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/09-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/10-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/11-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-20260513/12-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/01-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/02-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/03-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/04-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/05-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/06-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/07-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/08-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/09-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/10-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/11-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/12-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/13-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v2-20260513T1100Z/14-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/00-intro.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/01-hook.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/02-problem.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/03-blocker.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/04-build.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/05-stakes.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/06-result.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/07-next.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/.tmp-day3-product-content-machine-v3-20260513T1500Z/99-outro.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/day3-product-content-machine-20260513.mp4` — long-form render outside low-res clip sweep
- SKIP — `media/renders/long-form/day3-product-content-machine-v2-20260513T1100Z.mp4` — long-form render outside low-res clip sweep
- SKIP — `media/renders/long-form/day3-product-content-machine-v3-20260513T1500Z.mp4` — long-form render outside low-res clip sweep
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/01-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/02-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/03-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/04-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/05-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/06-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/07-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/08-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/09-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/10-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/11-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/12-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/13-card.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513-work/14-seg.mp4` — long-form temp segment/work file
- SKIP — `media/renders/long-form/stream-2-founder-story-prototype-20260513.mp4` — long-form render outside low-res clip sweep

## BROKEN BY OWNER REVIEW — 2026-05-13 18:35 UTC

The following clip family is **not ready**. Masala reviewed the screenshot and reported both the blue-box/square-face style regression and broken/missing captions:

- `media/renders/stream-2-build-the-clip-machine-live-screen-card-20260513T1804Z.mp4`
- `media/renders/stream-2-build-the-clip-machine-live-house-style-20260513T1827Z.mp4`
- `media/renders/stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z.mp4`

Required fix before READY: use house style, no blue box/card, screen context visible, VIBE ZONE branding/white text, and full caption coverage from transcript or corrected manual captions.

## CORRECTED PROOF CANDIDATE — 2026-05-13 18:38 UTC

- `media/renders/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1838Z.mp4`
- Contact sheet: `media/reviews/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1838Z-contact-sheet.jpg`
- Status: proof candidate only, pending Masala approval. Fixes the rejected style and missing-caption issue for the “Build The Clip Machine Live” clip family.
