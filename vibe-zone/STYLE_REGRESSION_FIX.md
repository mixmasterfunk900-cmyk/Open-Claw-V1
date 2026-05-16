# Style Regression Fix — 2026-05-13

Masala review note: recent clips drifted into a square-face / blue-card style. The square face crop is allowed as one variant, but it must not replace the house style.

## New quality gate

A clip is not READY unless sampled proof frames show:

- VIBE ZONE branding/logo or wordmark present.
- Clean white headline/caption text retained.
- No unwanted blue card/box artifact.
- Screen/context remains the main visual when the spoken moment is about the screen/product.
- Square face box is optional only, not the default style.
- ffprobe/decode/proof frames pass.
- No obvious secrets/private/account text.

## Current status

Previous READY count is suspended pending style recheck. Treat the manifest as technically packaged, not final-post-ready, until clips are rerendered or visually re-approved against this gate.

## Corrected proof

- Render: `media/renders/stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z.mp4`
- Contact sheet: `media/reviews/stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z-contact-sheet.jpg`
- Bundle: `media/post-ready-review/stream-2-build-the-clip-machine-live-house-style-clean-20260513T1827Z`

## Implementation notes

- Updated `facecam-smart` lower card in `server/server.mjs` to remove the blue fill and use black/white VIBE ZONE treatment.
- Added a proof renderer script for clean house-style clips: `scripts/render-house-style-proof-20260513T1827Z.mjs`.
- Production cron and quality loop prompts now require the style gate before calling clips READY.

## Bad reference screenshot from Masala

- `media/reviews/style-regression/blue-box-square-face-regression-example-20260513.jpg`

This is the rejected look:

- square face box dominates the composition
- blue card/box treatment takes over the brand style
- icon/blue panel is more prominent than the stream context
- captions/branding do not match the earlier white-text house style strongly enough
- screen context is not followed well enough for what is being discussed

Future READY clips must not look like this unless Masala explicitly requests this as a separate experimental style.

## House-style renderer note — 2026-05-13 21:47 UTC

For Day 3 correction rerenders, the house-style default now uses:

- source screen/context centered and dominant
- white hook/title and white one-word captions
- visible `VIBE ZONE` text plus OpenClaw logo
- dim blurred source underlay to avoid empty lower-half voids
- no colored blue/purple/green cards and no square-face default

Latest renderer: `scripts/render-day3-honest-agent-house-v3-20260513T2147Z.mjs`.

## Caption regression

Masala also reported missing/broken captions on the rejected blue-box/square-face clip. The corrected style proof is still **not post-ready** until caption coverage is fixed. Future proof clips need transcript-backed or hand-corrected caption coverage, not sparse placeholder captions.

## Corrected READY v2 — 2026-05-13 19:02 UTC

- Render: `media/renders/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z.mp4`
- Contact sheet: `media/reviews/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z-contact-sheet.jpg`
- Bundle: `media/post-ready-review/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z`
- Automated review: `media/reviews/stream-2-build-the-clip-machine-live-house-fixed-captions-20260513T1902Z.review.md` — 100/100, ready yes.
- Image audit: PASS. Desaturated the source UI so it no longer reads as a designed blue card/box; retained screen-first context, VIBE ZONE branding, and white captions.

Supersedes the 18:38, 18:50, and 18:55 proof candidates. The 18:38/18:50 candidates were visually closer but failed the automated empty-bottom gate; 18:55 passed automation but still read as too blue in visual audit.
