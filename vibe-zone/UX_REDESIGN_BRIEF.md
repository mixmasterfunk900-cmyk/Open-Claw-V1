# UX Redesign Brief — Vibe Zone

## Why this exists
Masala clarified that the dashboard makeover so far is only a small fraction of the expected UX/design work. The goal is not just prettier cards; the whole product should feel like a polished creator-operations cockpit that guides a streamer from raw livestream to reviewed, upload-ready assets.

## UX north star
Vibe Zone should feel like a modern logistics/control-room product for creator output:

1. **Ingest lane** — get media/transcripts into the system reliably.
2. **Processing lane** — show transcription, scoring, rendering, blockers, and retry state.
3. **Review lane** — watch clips, compare variants, approve/reject, edit titles/captions.
4. **Dispatch lane** — export/upload checklist per platform.
5. **Learning lane** — performance feedback, competitor gaps, Masala tone/profile improvements.

## Current UX shortcomings
- Dashboard visual refresh is mostly cosmetic; information architecture is still rough.
- Media Pipeline mixes actions, logs, artifacts, and review outputs in one dense page.
- Clip Factory does not feel like a clip-review/editor workspace yet.
- Rendered clips are visible, but there is no strong review/approval flow.
- Upload progress and long-running jobs do not feel robust enough.
- Captions/layout controls are not exposed as understandable presets.
- Facecam 50/50 mode is not represented in the UI.
- Social Dashboard is draft text only; it does not yet feel like a dispatch/export flow.

## Required UX workstreams

### 1. Product map / navigation rethink
Design pages around the real workflow instead of feature buckets:
- Overview
- Ingest
- Processing Jobs
- Clip Review
- Render Lab
- Dispatch
- Insights / Viral Hunter
- Settings

### 2. Clip Review experience
Must show:
- Video preview
- Hook/title/caption/hashtags
- Status controls: reject, keep, needs edit, approved, exported
- Platform target: TikTok, YouTube Shorts, YouTube long, X
- Render version history
- Subtitle/layout preset used

### 3. Render Lab
Expose presets:
- Standard 9:16 captions-safe
- Punchy 1–2 word captions
- 50/50 facecam + content crop
- Long-form 16:9
- Subtitle position controls / safe zones

### 4. Processing transparency
Jobs should communicate:
- queued/running/done/failed
- progress where possible
- exact blocker
- retry action
- output artifact links

### 5. Creator dispatch flow
For each approved clip:
- download MP4
- copy caption
- copy hashtags
- export checklist
- manual upload reminder
- performance fields after posting

## Acceptance criteria
- Masala can understand the next action within 5 seconds.
- Rendered clips are presented as review cards, not buried artifacts.
- Every generated asset has a visible state and next step.
- Major blockers are visible and actionable.
- UI supports the real workflow from stream upload to manual platform upload.
- Design feels intentionally built, not a prototype with cards.

## Priority
High. This should remain in the active workflow alongside media pipeline reliability.
