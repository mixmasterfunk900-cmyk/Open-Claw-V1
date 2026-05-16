# Confirmed Template #1 — Vibe Zone Short Form

**Status:** CONFIRMED / DO NOT DRIFT  
**Confirmed by:** Masala  
**Confirmed at:** 2026-05-14 16:20 UTC  
**Reference example:** `media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-solid-template-20260514T1615Z.mp4`

This is the current locked default short-form template for Vibe Zone. Any change to this template must be explicitly confirmed by Masala before becoming the default.

## Core layout

- 9:16 vertical short.
- Background is the same source clip enlarged to fill the frame and blurred behind the layout.
- Main source clip stays landscape inside the fixed centered container.
- No random cards, blue boxes, banners, or extra text.
- Colored reference boxes are invisible zones only, never rendered.

## Fixed zones at 1080×1920

- Header safe zone: top/open zone, roughly `y=80–500`.
- Main video container: `x=44`, `y=610`, `w=992`, `h=558`.
- Retention border: thin neon-green frame extending slightly around the main video, approximately `x=32`, `y=582`, `w=1016`, `h=614`.
- Logo/brand lane remains reserved below the video container.
- Caption lane sits below the reserved logo lane and above player/platform controls.

## Header/title rules

- 1–6 words max, ideally 3–4.
- Lilita One font.
- Curiosity-first hook, not bland summary.
- If a 3+ word heading is too wide, wrap the final/third word onto a second line and make the two-line heading bigger rather than shrinking a long single line.
- Keep strong horizontal safe margins; title must not touch frame edges.
- Header color is contrast-aware:
  - Do not use white if the top/background area is white or very light.
  - Use yellow/neon/high-contrast color with strong black outline when needed.
  - Header color must differ from caption color.

## Captions

- One-word captions only.
- No caption box/background/banner.
- Caption color must differ from header color.
- Exact-cut word-level timing preferred; use coverage guard/fallback gap-fill if Whisper timing drops words.
- Captions are slightly lower than the earlier strict batch, while still above platform controls.

## Thumbnail first-frame workflow

- Standard short-form workflow includes the generated clickable thumbnail as the first visual frame only.
- This first thumbnail frame must be clean: no green retention border/box/shine over it.
- The regular Confirmed Template #1 layout starts immediately after that first frame; do not otherwise change the approved short layout.
- Audio should start immediately with the short; do not add silent pre-roll unless Masala explicitly asks.

## Retention border + shine

- Use the approved thin neon-green extended border.
- Do not make it a thick frame.
- Add a visible intermittent travelling shine/comet around the border:
  - real moving overlay/glow, not barely-visible drawbox artifact
  - quick pass around the frame
  - repeats intermittently
  - subtle enough not to dominate the content

## Change control

- This is **Confirmed Template #1**.
- Do not replace, simplify, or remove this template without explicit Masala confirmation.
- Experimental renders may test changes, but must be clearly marked as tests and must not overwrite this confirmed default.
- Never repair title/header problems by blurring or cropping the already-rendered title zone. That leaves ghost text. If a title layer must be repaired, rebuild from the canonical template or replace the whole header with a fresh clean header plate before drawing the title.

## Approved correct example — 2026-05-15

Masala sent this Telegram video and said: “This one is an example of everything being correct.” Use it as an approved visual/timing reference alongside the original V1 reference, not as an unapproved replacement.

- Reference: `media/references/confirmed-template-01/one-stream-infinite-clips-everything-correct-20260515T0650Z.mp4`
- Frames: `media/references/confirmed-template-01/one-stream-infinite-clips-everything-correct-20260515T0650Z-frame-01.jpg`, `...frame-02.jpg`, `...frame-03.jpg`
- Key callouts: seed/custom thumbnail lead-in is acceptable here; “STREAM ONCE FOREVER” hook/layout is correct; overall template feel, caption placement, video container, border/shine treatment, and pacing should be matched by future renders.
