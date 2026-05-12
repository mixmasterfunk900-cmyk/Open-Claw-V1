# Known Issues

## Critical / high
- Source file `media/downloads/dejKxLu_iM0.mp4` appears partial/corrupt: metadata says ~90:09, but packet scan/Whisper only reach ~25:28. Need complete re-upload or resume from PC.
- VPS YouTube extraction is blocked by HTTP 429/bot-check across safe public strategies; continue using local companion/upload import unless Masala explicitly approves a specific cookie step.
- Clip ranking now has a first-pass exact-title/nearby-hook dedupe, but full semantic/topic diversity still needs embeddings or topic clustering.

## Medium
- Browser upload progress is client-side only; server restart mid-upload has no resumability.
- Media execution scripts are outside a robust job runner; failures need better retry/status semantics.
- Background research subagent `content-hq-platform-distribution-research` failed after tool/search use despite Gemini Flash connectivity being confirmed. Debug queue item: capture fuller subagent error, retry with smaller/no-web task, and ensure failed child tasks automatically become visible queue items instead of being dropped.
- `data/vibe-zone.json` can grow and is not ideal for concurrent writes.

## Low
- Dashboard visual redesign is improved but not yet componentized.
- Some old media job records may include stale planned-command language from previous iterations.
