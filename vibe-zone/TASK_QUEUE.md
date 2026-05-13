# Task Queue

## Immediate executable tasks
1. [new] Build local generated underlay prototype from `GENERATED_UNDERLAY_AND_BLENDER_PLAN.md`: add `underlayPreset` (`blur-pulse`, `terminal-grid`, `vibe-gradient`) to render requests, render 2 variants for one high-potential clip, generate proof frames, and store underlay metadata with `aiGeneratedVisuals=false`.
2. [new] Add Dispatch Queue / social-autonomy foundation from `SOCIAL_AUTONOMY_PLAN.md`: platform metadata editor, owner-approval states, manual upload status, API-disabled connector stubs, and visible stream-safety warnings. No account connections or external posting.
3. [completed] Created first local long-form story prototype from Stream 2: docs workflow, machine-readable story EDL, 7:34 ffmpeg render, and manual upload notes under `media/exports/long-form/stream-2-founder-story-prototype-20260513/`. Next: review full draft for pacing/privacy, then wire the EDL pattern into a Long-Form Story Builder UI.
2. [completed] Fixed the latest Stream 2 second-clip facecam-smart layout by rendering `stream-2-second-clip-facecam-smart-lowerfill-20260513T0130Z.mp4`; automated CV review improved from 70/100 to 100/100 with bottomDarkRatio ~0.01–0.03 and a fresh YouTube/TikTok bundle. Hook-card still remains a regression case for a future true facecam-tracking preset.
3. [completed] Replaced/resumed newest stream `SxOhgmSWqD4` (“Day 3 - Addicted to vibe coding LIVE”); `/api/health` now validates the source complete through ~1:21:35 with transcript/captions present.
4. [completed] Raise and restyle captions into YouTube Shorts-safe zone.
5. [completed] Generate punchy 1–2 word caption ASS file and re-render playable clips.
6. [completed] Import complete Stream 2 source locally, confirm Whisper outputs, render selected clips, and create manual export bundles.
7. [completed] Cache media validation by path/size/mtime so `/api/health`, `/api/state`, and `/api/media/files` stay fast instead of rescanning packet timestamps on every dashboard/cron request.
8. [completed] Add facecam crop / 50-50 layout render preset.
9. [completed] Add review actions for clip status: idea → draft → reviewed → exported.
10. [completed] Add “render selected clip” from Clip Factory and link output back to the candidate row.

## Medium-priority improvements
1. [in-progress] Improve semantic clip dedupe to avoid repeated hooks/themes. First pass now removes exact-title/nearby-hook repeats during scoring and auto-render selection; next pass should use embeddings/topic clusters.
2. [in-progress] Add subtitle/render presets: punchy captions, standard captions, no captions, 50/50 facecam/B-roll layout, and long-form captions now selectable; still need richer visual styles (bold centre, TikTok-safe lower third, high-contrast accessibility).
3. [completed] Add active facecam tracking/reframing using deterministic computer-vision/ffmpeg tooling. `facecam-smart` now samples start/middle/end, aggregates a stable median crop, logs fallback/confidence metadata, smoke-tested `clip_1778654489066_55d0d5` (“The Facecam Is Missing”) at 100/100, and now surfaces tracking proof in Clip Factory/Media Pipeline UI cards.
4. [pending] Add upload progress persistence/server-side status for large browser uploads.
5. [done] Add a “render selected clip” button from Clip Factory.

## Long-term architectural improvement
1. [pending] Move persistence from one JSON file to SQLite once clip/render volume grows.

## Research / competitive analysis
1. [in-progress] Research successful clipping/social platforms and compare Vibe Zone gaps. Latest pass checked 2026 short-form/CapCut guidance emphasizing the first 1–3 seconds: top text hook/benefit, fast cuts, and styled auto-captions/word-by-word emphasis for silent viewing.
2. [pending] Add a Clip Factory “proof hook card” render option: first 2s high-contrast top card with the concrete payoff/metric/problem, bottom Shorts-safe punchy captions, facecam kept clear, then tight jump cuts every ~1.5–2s.
3. [in-progress] Convert competitor findings into implementation tasks. Viral Hunter now has newest-stream scope, deduped leads, Opus-style hook patterns, and a visible gap board; next turn gaps into retention/performance fields and richer render templates.
4. [in-progress] Review Masala stream output quality against those patterns. Latest pass produced Day 3 exports and manual upload bundles; next quality blocker is reliable facecam tracking/reframing rather than source availability.
5. [debug] Investigate failed `content-hq-platform-distribution-research` Gemini Flash subagent: recover/error-capture cause, retry with smaller/no-web task, and make failed child tasks auto-log into Known Issues/Task Queue.

## UX / product design workstream
1. [high-priority] Redesign information architecture around Ingest → Processing → Clip Review → Render Lab → Dispatch.
2. [high-priority] Build a proper Clip Review page with preview, statuses, platform target, caption/title review, and export actions.
3. [completed] Add a Dispatch-readiness view for exported bundles: rendered asset/upload-card links, owner approval gate labels, YouTube Shorts/TikTok fields, and blocked/empty states for missing bundle/proof/render assets. No external posting.
4. [in-progress] Build Render Lab presets including punchy captions, 50/50 layout mode, and visible facecam-tracking metadata in review cards; next add richer caption styles and true overlay inputs.
5. [medium] Add UX progress states for upload/transcription/rendering with clear retry/resume actions.
6. [medium] Create visual safe-zone overlay guidance for Shorts captions and facecam placement.

## Content HQ expansion
1. [high-priority] Add Long-Form Story Builder: transcript search, beat picker, reordered EDL JSON, chapter-card/captioned render presets, proof player, and manual upload bundle generation. Prototype artifacts: `LONG_FORM_STORY_WORKFLOW.md`, `media/story-plans/stream-2-founder-story-prototype-20260513.json`, and `media/renders/long-form/stream-2-founder-story-prototype-20260513.mp4`.
2. [high-priority] Add `CONTENT_HQ_MASTER_PLAN.md` north-star spec into navigation/roadmap.
3. [high-priority] Add Dispatch Calendar model: asset, platform, variant, status, scheduled time, CTA, and owner approval state.
3. [high-priority] Add platform target metadata to every clip candidate and render output.
4. [high-priority] Add Copy Studio exports: X posts/threads, Reddit framing, Substack post, Medium article, Discord announcement, podcast show notes, pinned comments.
5. [high-priority] Add Thumbnail Lab: concept board, title text, face-reference approval gate, A/B variants.
6. [medium] Add Winner Radar analytics fields: watch time, retention, rewatches, comments, shares, saves, CTR, engagement velocity, follower/email conversion.
7. [medium] Add master/variant render relationships so Facebook/Reels/TikTok/Shorts get native clean variants without watermarks.
8. [medium] Add owned-audience funnel fields to export bundles: target destination, CTA, Discord/Substack/Patreon/membership link placeholders.
9. [medium] Add podcast/audio export path: audio extraction, dead-air trimming plan, title, show notes, timestamps.
10. [medium] Add archive search schema for streams, clips, transcripts, captions, metadata, thumbnails, analytics, and post copy.
11. [later] Add official platform integrations only after explicit approval: scheduling, analytics import, and posting APIs with rate-limit safety. Planning docs now exist in `SOCIAL_AUTONOMY_PLAN.md`; recommended path is manual Dispatch bundles → private API upload tests → owner-approved public posting, with YouTube first, TikTok after audit readiness, and X only after pricing/media-upload access is verified.
12. [later] Add generated underlay / premium render layer roadmap from `GENERATED_UNDERLAY_AND_BLENDER_PLAN.md`: local FFmpeg/Canvas first, Remotion templates next, Blender cached loops later, paid/AI video only after approval.
13. [later] Design Rex Live Companion / Avatar: stream-safe overlay, job/context watcher, optional voice mode, and long-term hologram-style desk presence.

## Selected clip rendering follow-ups
1. [done] Add Render Short action on Clip Factory candidates with source-duration guardrails.
2. [done] Add export bundles for approved rendered clips (`upload-card.md`, metadata, checklist).
3. [done] Add render preset selector UI beyond the default punchy captions preset.

## API setup reminder
- [pending] Remind Masala later to set up API keys/providers for higher-quality embeddings, image generation, and optional platform integrations. For now prefer local Ollama/no-API paths.

## Cleanup / repository hygiene
1. [done] Added `npm run media:cleanup-unused` and `npm run media:cleanup-unused:apply` to archive SKIP/DUPLICATE/TEMP media from `POST_READY_REVIEW_MANIFEST.md` into timestamped `media/archive/cleanup-*` backups instead of hard-deleting.
2. [done] Archived the first unused-media batch: 95 duplicate/temp/failed artifacts, 645.3 MB, report at `media/archive/cleanup-20260513T161054Z/cleanup-report.json`.
3. [active] Planning/PM cycle now includes a cleanup dry-run/check before selecting the next builder task.
