
## Vibe Zone permanent short-form template (2026-05-14)
Masala provided a permanent template for Vibe Zone short clips and explicitly wants it followed every time unless he overrides it. Treat colored boxes in the reference image as layout zones/parameters only — not visible boxes.
- Background: use the same playing clip blown up to fill the 9:16 frame, blurred behind everything. Do not use a plain white background.
- Header/title: 1–6 words maximum, Lilita One font, huge text that fills the invisible top header zone only. No visible title/banner box. Text color may vary between clips; defaults are all white or all neon green. Header color and caption color must never be the same on a given clip.
- Main clip: always landscape inside a centered livestream/video container with a small outline, even if the source is vertical/square.
- Logo/brand: show a logo only if a relevant external brand/product is discussed in the clip (e.g. Coke, Pepsi, Starbucks, McDonald’s, Apple, etc.). Do not show VIBE ZONE/OpenClaw by default; OpenClaw in the template was only an example.
- Captions: one-word captions only, positioned at the bottom in the invisible red-zone area. No caption box/banner/background; just the words. Caption color can vary between clips but must differ from the header color.
- No random extra text anywhere else.

## Vibe Zone template spacing correction (2026-05-14)
Masala clarified the permanent short template spacing after reviewing the No Leaks trial: captions must sit in clear bottom space and never overlap player/platform controls. The header/title should not hug the top; it should be vertically centered in the open top third/top zone, with roughly equal breathing room from the top of frame to the title and from the title to the main video container. Make the header large enough to fill that open top space.

## Vibe Zone fixed short template zones (2026-05-14)
Masala clarified the permanent short template should use preset zones/dimensions, not eyeballed placement. The video container, header, and caption lanes must be fixed safe zones every render. Captions must never eat into the video container and must never overlap player/platform controls. If rendering from a source cut, reset PTS/timestamps so one-word captions sync to the cut timeline.

## Vibe Zone logo container and caption lane correction (2026-05-14)
Masala clarified the fixed template must reserve a logo/brand container below the main video container on every render. Only fill that logo container when a relevant external brand/product is discussed; otherwise leave the space empty. Captions must always sit below the logo container in their own fixed lane, even when the logo container is empty, so caption placement never shifts from clip to clip.

## Vibe Zone caption sync correction (2026-05-14)
For short one-word captions, do not rely on coarse segment-only transcripts when word-level timing is missing. Generate/use word-level timestamps for the exact cut, render with trim/atrim + PTS reset, and preserve valid single-word captions like “I” and “A” (only filter the literal token “AI” if needed). Current fixed caption lane for the 1080x1920 template uses ASS bottom margin around 440 so captions sit below the reserved logo container and above controls.

## Vibe Zone curiosity hook correction (2026-05-14)
Masala approved the fixed short layout and asked not to change it. The remaining issue is the header/title text: for future clips, choose stronger curiosity hooks, not bland literal summaries. Header still follows 1–6 words max, ideally 3–4 words, Lilita One, fixed top zone, but the wording can be loosely related or even not directly said in the clip if it better hooks viewers.

## Vibe Zone caption dropout guard (2026-05-14)
Masala found the Socials To VPS fixed-template render had captions that worked at the start then failed halfway. Diagnosis: Whisper word-level timing produced a partial transcript with a ~20.96s silent gap in the middle, but the renderer accepted it because some word events existed. Rex patched `lib/caption-normalizer.mjs` with caption coverage checks and `mergeTimedCaptionEvents()`, so template renderers now detect large word-timing gaps and fill missing ranges from transcript fallback events instead of silently shipping caption dropouts. The Socials To VPS rerender reports `timingSource: word+fallback-gapfill`, `coverage.ok: true`, `maxSilentGap: 1s`.

## Vibe Zone header wrapping preference (2026-05-14)
For future fixed-template shorts, if a 3+ word header is too wide for the safe title area, prefer wrapping the final/third word onto a second line and making the title slightly bigger within the fixed top zone, rather than shrinking a single-line title to fit. Keep the approved layout/zones unchanged; this is only a header text-fitting rule.

## Vibe Zone contrast-aware header color (2026-05-14)
For fixed-template shorts, the header/title color must be contrast-aware. Do not blindly use white title text when the blurred/source background in the title zone is white or very light. In light title zones, switch to a high-contrast non-white header color (e.g. yellow/neon with a strong black outline, or another readable color) while keeping header color different from caption color. No visible banner/box unless explicitly requested.

## Vibe Zone Confirmed Template #1 (2026-05-14)
Masala explicitly approved the solid short-form template and wants it preserved as **Confirmed Template #1**. Do not lose or drift from it. Default short-form renders should use this confirmed template unless Masala explicitly confirms a replacement/change. Reference render: `vibe-zone/media/exports/READY_TO_SHIP_NOW/thumbnail-looks-mid-solid-template-20260514T1615Z.mp4`. Project doc: `vibe-zone/CONFIRMED_TEMPLATE_01.md`. Key features: fixed 9:16 zones, blurred source background, wrapped/contrast-aware Lilita One heading, slightly lower one-word captions, thin neon-green extended retention border, visible intermittent travelling shine/comet, word-level caption QA/coverage guard. Experiments are allowed only as clearly marked tests and must not overwrite the confirmed default without explicit Masala approval.

## Vibe Zone seed-frame thumbnail style update (2026-05-14)
For short-form thumbnail seed frames, Masala approved the general face-led GothamChess-style direction and clarified the generated image does not need to preserve his exact outfit. Outfit can change if it improves the thumbnail. Background should vary based on clip context (e.g. stream-to-content machine, AI agents, thumbnails, VPS/social posting) while staying generally related and not hijacking the clip. Keep seed frames outrageous/clickable, face-led, simple, bold, and not literal in a way that kills the actual short.

## Vibe Zone correct example reference (2026-05-15)
Masala sent `01-one-stream-infinite-clips_1` via Telegram and said it is “an example of everything being correct.” Rex saved it at `vibe-zone/media/references/confirmed-template-01/one-stream-infinite-clips-everything-correct-20260515T0650Z.mp4`, extracted proof frames, added it to `data/vibe-zone.json.settings.confirmedShortTemplate.approvedReferenceRenders`, and appended it to `vibe-zone/CONFIRMED_TEMPLATE_01.md`. Treat this as an approved correct example alongside the original Confirmed Template #1 reference, especially for the “STREAM ONCE FOREVER”/One Stream Infinite Clips style, seed thumbnail lead-in, layout, captions, border/shine, and overall template feel.

## Vibe Zone reset clarification (2026-05-15)
Masala clarified that when he asks to purge/reset old Vibe Zone backend work after videos are uploaded, he does **not** mean destroy the website, templates, code, confirmed template docs, reusable assets, or product framework. Reset means stop old automation/logic loops and be idle/ready for a new logic system. Media cleanup should be conservative and explicit: preserve the built system and only archive/remove uploaded media outputs after confirmation.

## Vibe Zone single-frame thumbnail standard workflow (2026-05-15)
Masala clarified the generated clickable thumbnail must be embedded into shorts as the first visual frame as part of the standard workflow. Everything else in Confirmed Template #1 stays unchanged. The first thumbnail frame must be clean with no green retention border/box/shine; the normal confirmed layout begins immediately after that first frame. Audio should start immediately; do not add silent pre-roll unless explicitly requested.

## Vibe Zone Day 4 long-form cleanup correction (2026-05-15)
Masala clarified the Day 4 shorts are correct/perfect and must not be changed. The confusion was only in the long-form/Thumbnail Lab section: only the single ~10-minute Day 4 long-form video is relevant there, and the other long-form entries should be hidden/ignored. Rex updated the Thumbnail Lab to show only active long-form candidates, excluding archived/non-long-form short thumbnail concepts, and added three proper 16:9 clickable thumbnail options for `long-day4-product-machine-subtitles-20260515.mp4`.

## Vibe Zone Confirmed Template #2 — 50/50 script-aware generated scenes (2026-05-15)
Masala approved the contextual generated-scene short direction and asked it to be saved as **Template V2 / 50/50 template**. V2 uses a vertical split-style layout with facecam/camera on top, generated contextual scenes in the remaining section, and captions flashing at the seam. The key workflow is script-aware: read the voiceover/script, plan visual beats every ~4–6 seconds, generate detailed contextual images that match what is being spoken, QA scene relevance, and double-check caption timing. Masala said the ideas/concept are spot on; image styling can be tweaked later. This does not replace Confirmed Template #1 unless explicitly requested.

## Vibe Zone Media Pipeline role change (2026-05-15)
Masala clarified that large Template V2 concept videos should be added to Vibe Zone instead of sent through Telegram when too large. Media Pipeline should now serve as a concept lab / WIP review lane for generated-scene experiments, Template V2 tests, contact sheets, and rough workflow concepts. Clip Factory should remain reserved for fully approved, ready-to-ship media.

## Rex area setup reference (2026-05-16)
Masala sent a Telegram video reference (`file_id: BAACAgIAAxkBAAIQ0GoIJZLH8NWNZcMqbImOF9VaUzbyAALaogACb_BJSEtAx_rU8QqiOwQ`) and said: “This is how I want Rex’s area to be set up.” Treat the clip as the design/layout reference for Rex’s area/dashboard. If implementing, inspect/extract the video details first rather than guessing from text alone.
