# Known Issues

## Critical / high
- Source file `media/downloads/dejKxLu_iM0.mp4` appears partial/corrupt: metadata says ~90:09, but packet scan/Whisper only reach ~25:28. Need complete re-upload or resume from PC.
- VPS YouTube extraction is blocked by HTTP 429/bot-check across safe public strategies; continue using local companion/upload import unless Masala explicitly approves a specific cookie step.
- Clip ranking still has some near-duplicate themes because the transcript itself repeats phrases; improved semantic dedupe is needed.

## Medium
- Facecam crop / 50-50 layout is not implemented yet.
- Browser upload progress is client-side only; server restart mid-upload has no resumability.
- Media execution scripts are outside a robust job runner; failures need better retry/status semantics.
- `data/vibe-zone.json` can grow and is not ideal for concurrent writes.

## Low
- Dashboard visual redesign is improved but not yet componentized.
- Some old media job records may include stale planned-command language from previous iterations.
