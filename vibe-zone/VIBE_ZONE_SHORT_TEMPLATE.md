# Vibe Zone Permanent Short Template

## Urgent house-style override — 2026-05-14 09:55 UTC

Masala's latest review overrides the earlier "no default VIBE ZONE/OpenClaw" note. Until he explicitly changes it again, the default short style is:

- Screen/context-first layout with the source clip centered and dominant.
- VIBE ZONE branding plus OpenClaw logo/wordmark present by default.
- Clean white hook/title and clean white one-word captions retained.
- No visible blue/purple/green card/box treatment.
- Square face box/webcam-forward layout is optional variant only, never the default.
- Recent template renders that omit house branding must be suspended until rerendered or visually re-approved.

Masala provided this as the default short-form template on 2026-05-14. Follow it every time unless he explicitly overrides it.

Important: colored boxes in the reference image are layout zones/parameters only. They are **not** visible boxes to render.

## Composition

- Canvas: 9:16 vertical short.
- Background: the same playing clip enlarged to fill the frame, blurred behind the layout. Never plain white.
- Header/title zone: invisible top zone only.
  - Text only, no banner/box/background.
  - 1–6 words maximum.
  - Lilita One font.
  - As large as possible while fitting the zone.
  - Default colors: all white or all neon green.
  - Color may vary between clips.
- Main clip zone:
  - Always show the livestream/source clip as a landscape container, even if source is vertical/square.
  - Center it with a small outline.
- Logo/brand zone:
  - Show VIBE ZONE branding plus the OpenClaw logo/wordmark by default for house-style shorts.
  - If a relevant external brand/product is discussed in the clip, it may appear as an additional/contextual logo only if it does not replace VIBE ZONE/OpenClaw.
  - Examples of contextual brands: Coke, Pepsi, Starbucks, McDonald’s, Apple, TikTok, YouTube, etc.
  - Never leave the brand zone empty on a house-style READY candidate unless Masala explicitly approves a no-brand variant.
- Caption zone:
  - One-word captions only.
  - Bottom placement matching the invisible red-zone area in the reference.
  - No caption box/banner/background — words only.
  - Caption color can vary between clips, but must not be the same as the header color.

## Hard Rules

- Header text color and caption text color must never be the same on the same clip.
- No random extra text anywhere else.
- Do not add visible colored layout boxes from the reference image.
- If unsure whether an external logo is relevant, omit the external logo; keep VIBE ZONE/OpenClaw for house-style READY candidates.

## Spacing Correction — 2026-05-14

- Header/title must be vertically centered in the open top space between the top of the 9:16 frame and the main video container.
- Do not pin the header near the top edge. It should feel centered in the top third with roughly equal breathing room above and below.
- Make the header large enough to fill that open top zone while staying readable and within the 1–6 word rule.
- Captions must sit in the clear bottom space and avoid player/platform controls. Raise them if any controls overlap.

## Fixed Zone Requirement — 2026-05-14

Use preset zones/dimensions for every short render; do not eyeball layout per clip.

Recommended 1080x1920 zones:
- Header safe zone: y 80–500. Center title vertically inside this open zone.
- Main landscape video container: x 44, y 610, w 992, h 558.
- Caption safe zone: below the video container and above platform controls, around y 1400–1520. Captions must never overlap or touch the main video container.
- Reset source timestamps to the cut timeline before applying subtitles/captions so captions sync from 0:00.

## Logo Container + Caption Lane Correction — 2026-05-14

- Always reserve a fixed logo/brand container below the main video container.
- Fill the house-brand portion of the logo container on every READY short with VIBE ZONE plus OpenClaw logo/wordmark.
- Only add an external/contextual brand when it is relevant to the clip and does not replace or weaken VIBE ZONE/OpenClaw.
- Never leave the logo container empty on a house-style READY candidate unless Masala explicitly approves a no-brand optional variant.
- Captions must always sit below the logo container in their own fixed caption lane.
- Caption placement must not change depending on whether an additional external/contextual logo is present.

## Caption Sync Correction — 2026-05-14

- If the source transcript has no word-level timestamps, generate word-level timestamps for the exact cut before rendering one-word captions.
- Render the cut with filtergraph `trim`/`atrim` and `setpts`/`asetpts` so video, audio, and subtitle timelines all start at 0.
- Do not drop valid one-word captions like “I” or “A”; only remove the literal token “AI” when it is a bad filler token.
- Current 1080x1920 fixed caption lane uses ASS bottom margin around `440`, keeping captions below the reserved logo container and above platform controls.

## Header Hook Correction — 2026-05-14

Masala approved the fixed layout; do not change spacing/zones unless asked. Improve the top text instead:

- Header should be a curiosity hook, not a bland literal summary.
- 1–6 words max; ideally 3–4 words.
- It may be loosely related to the clip rather than a direct quote, if that improves viewer curiosity.
- Keep the fixed header zone/layout exactly the same.

## Solid Template Burn-In — 2026-05-14

Masala approved these additions for the default short-form template:

- Header fitting:
  - Keep the fixed header zone, but fit text intelligently.
  - If a 3+ word header is too wide, prefer wrapping the final/third word onto a second line and making the title larger, rather than shrinking the whole title onto one line.
  - Keep generous horizontal safe margins; titles must not touch frame edges.
- Contrast-aware header color:
  - Do not blindly use white title text when the blurred/source background in the title zone is white or very light.
  - Use a high-contrast non-white header color such as yellow/neon with a strong black outline when needed.
  - Header color must remain different from caption color.
- Caption lane:
  - Captions may sit a tiny bit lower than the earlier strict batch when safe; keep them below the reserved logo lane and above platform controls.
- Retention border:
  - Add the approved thin neon-green extended border around the main video container.
  - The border extends slightly above/below the video container; do not make it a thick frame.
- Travelling shine:
  - Add an occasional visible travelling shine/comet around the border.
  - Use a real moving overlay/glow, not a barely-visible drawbox artifact.
  - Keep it intermittent, quick, and retention-focused; no permanent nightclub effect.
