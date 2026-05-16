# AiToEarn Integration Plan

Source reviewed: <https://github.com/yikart/AiToEarn> via the linked X post. Repo metadata shows MIT license, so code/pattern reuse is allowed with license notice if copied. Current implementation should prefer reimplementation inside Vibe Zone rather than a blind plugin install.

## What to take

### 1. Create
- Keep Vibe Zone clip factory, caption normalizer, render presets, thumbnail lab, and upload bundles as the source of truth.
- Add AiToEarn-style agent tasks on top: batch content briefs, platform-specific copy, thumbnail concepts, long/short variants.

### 2. Publish
- Build one local dispatch queue that fans out a completed asset into TikTok, YouTube Shorts, X, Instagram, Threads, LinkedIn, Facebook, Pinterest, and later CN platforms.
- Keep all posting manual/owner-gated until account auth, privacy checks, and platform terms are intentionally configured.
- Add scheduling scaffolds first: morning upload, lunch experiment, evening recap, next-day winner repost.

### 3. Engage
- Draft-only engagement agents:
  - comment intent finder
  - reply draft writer
  - brand mention watcher
  - high-conversion “link?” detector
- Do not automate likes, follows, DMs, or public replies without explicit approval and account setup.

### 4. Monetize
- Add placeholders for CPS, CPE, and CPM tracking around every upload candidate.
- Later: connect deals/affiliate links/UTMs only after Masala approves the commercial workflow.

## Implemented now

- Social Dashboard now includes an AiToEarn feature intake map: Monetize / Publish / Engage / Create.
- Added all-channel publishing surface map with ready, draft, and planned lanes.
- Added content calendar, engagement-agent, and monetization model scaffolds.
- Widened platform typing beyond TikTok/YouTube/X so dispatch can grow into multi-platform operations.

## Next code steps

1. Add persisted `platformProfiles` and `scheduledPosts` arrays to `data/vibe-zone.json` + server normalization.
2. Generate platform-specific metadata files inside each upload bundle.
3. Add “mark scheduled / posted / winner” controls to Social Dashboard.
4. Add CSV/JSON export for manual upload checklists.
5. Only after manual workflow is reliable: evaluate OAuth/API posting per platform with explicit owner approval.

## Safety posture

- No external posting performed.
- No AiToEarn plugin installed.
- No API keys requested or stored.
- No account cookies used.
