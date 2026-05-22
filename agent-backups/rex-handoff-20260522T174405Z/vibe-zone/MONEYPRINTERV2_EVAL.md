# MoneyPrinterV2 Evaluation for Vibe Zone

Repo: `https://github.com/FujiwaraChoki/MoneyPrinterV2`  
Checked: 2026-05-13 UTC  
Status: useful for ideas, not a drop-in dependency.

## Summary

MoneyPrinterV2 is a Python automation project for Twitter/X posting, YouTube Shorts generation, affiliate marketing, outreach, TTS, image generation, scheduling, and some upload automation.

It is **not directly suitable as the Vibe Zone engine**, because Vibe Zone already has real stream footage, local renders, post-ready bundles, review gates, thumbnails, and a Chrome/OpenClaw browser workflow. MoneyPrinterV2 is more of a generic “generate faceless content and post it” app.

But it does contain a few useful implementation ideas.

## Important constraints

### License

MoneyPrinterV2 is AGPL-3.0.

Do not copy code directly into Vibe Zone unless we are comfortable with AGPL obligations. Safer path: treat it as reference material and reimplement the ideas independently.

### Browser mismatch

MoneyPrinterV2 uses Selenium + Firefox profiles.

Masala wants Chrome browser operation. OpenClaw already has the browser tool and a Chrome-based workflow, so we should not adopt its Firefox automation layer.

### Posting risk

The repo is designed around automation that can post to X/YouTube. For Vibe Zone, external posting must stay behind owner approval, CAPTCHA/verification stop gates, and account safety rules.

## Useful ideas to borrow conceptually

### 1. Local scheduler shape

MoneyPrinterV2 has a cron-style runner that takes a purpose and account ID. Vibe Zone can use the same concept, but through OpenClaw cron and local queue statuses.

Vibe Zone version:

- `drafted`
- `needs_owner_review`
- `approved_to_publish`
- `publishing`
- `published`
- `failed_retryable`
- `blocked`

### 2. Cache/log model

MoneyPrinterV2 stores posted items in a cache per account. Vibe Zone needs a similar local publishing ledger:

- platform
- account
- source media path
- post text
- status
- created time
- approved time
- posted time
- errors
- browser session notes

### 3. Subtitle equalization concept

MoneyPrinterV2 uses `srt_equalizer.equalize_srt_file` to split captions into shorter chunks.

This is relevant to the caption issue Masala just caught. Vibe Zone should not use messy overlapping word reveals for long-form. We should add our own deterministic caption normalizer:

- fixed bottom lane
- no overlap
- max characters per caption line
- max words per caption event
- minimum display duration
- never move vertically
- avoid lower-third collision

### 4. Local Whisper option

MoneyPrinterV2 supports local Whisper/faster-whisper and AssemblyAI. Vibe Zone already uses local Whisper, so this validates our local-first direction. It may be worth evaluating `faster-whisper` later for speed and word timing.

### 5. TTS/image/video assembly separation

The repo separates script, metadata, image prompts, TTS, subtitles, combine, upload. Vibe Zone should keep similar modular boundaries, but for real stream footage:

- source ingest
- transcript
- clip selection
- render style
- captions
- review/proof
- metadata
- dispatch queue
- publish

## Not useful / avoid

- Generic faceless AI image shorts are not the Vibe Zone direction.
- Firefox Selenium posting layer should not be adopted.
- Auto outreach/affiliate/cold email modules are irrelevant and potentially risky.
- PostBridge/API posting is not the current approved path.
- Direct code reuse is risky due to AGPL.

## Recommended actions for Vibe Zone

1. Build `caption-normalizer` locally inspired by the subtitle equalization concept, not copied.
2. Add a long-form caption QA gate:
   - no intro card unless explicitly approved
   - first frame must be live footage or strong hook footage
   - captions fixed in one lane
   - no overlapping caption events
   - no vertical jumping
   - no collision with lower thirds
3. Add a dispatch ledger for X/TikTok/YouTube manual and future browser-approved posting.
4. Keep using OpenClaw Chrome/browser tools rather than Selenium Firefox.
5. Treat MoneyPrinterV2 as a reference repo, not a dependency.

## Verdict

Useful as a map of common automation modules and caption-splitting ideas.

Not useful as a drop-in solution for Vibe Zone.

Best immediate takeaway: implement our own deterministic caption normalization and publishing ledger.
