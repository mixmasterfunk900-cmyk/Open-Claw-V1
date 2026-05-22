# 19 — V3 Checkpoint Schedule

Checkpoints are internal automated gates. They are not human approval prompts.

## Checkpoint 1 — after project initialisation

- Tracker exists.
- Reporting/Tracker Agent assigned.
- Google Sheet/Drive/local fallback status explicit.

## Checkpoint 2 — after topic/title selection

- Ledger checked.
- Topic/title not duplicate.
- Tracker updated within 5 minutes.

## Checkpoint 3 — before image generation

- Character Lock PASS.
- Style Lock PASS.
- Beat Manifest PASS.
- Full prompts include character/style locks.

## Checkpoint 4 — after image generation, before render

- Unique image per beat.
- No copied/cycled image set.
- No visible 2x2/collage/contact-sheet assets.
- Frontier GPT provenance exists for every beat.
- Character/style/script alignment QA pass.

## Checkpoint 5 — after render

- Motion/transitions visible in actual render.
- Subtitles match style lock.
- No visual regression in sampled frames.

## Checkpoint 6 — before Vibe Zone

- Historical Regression QA PASS.
- Final proof package complete.
- `VIDEO_READY_LOCAL=true` only if all hard gates pass.
