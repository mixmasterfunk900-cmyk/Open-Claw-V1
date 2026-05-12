# Task Queue

## Immediate executable tasks
1. [completed] Raise and restyle captions into YouTube Shorts-safe zone.
2. [completed] Generate punchy 1–2 word caption ASS file and re-render playable clips.
3. [in-progress] Get a complete source video: validation badges now detect partial/corrupt media; still need complete newest-stream re-upload/import.
4. [completed] Add facecam crop / 50-50 layout render preset.
5. [completed] Add review actions for clip status: idea → draft → reviewed → exported.
6. [completed] Add “render selected clip” from Clip Factory and link output back to the candidate row.

## Medium-priority improvements
1. [pending] Improve semantic clip dedupe to avoid repeated hooks/themes.
2. [in-progress] Add subtitle/render presets: punchy captions, standard captions, no captions, 50/50 facecam/B-roll layout, and long-form captions now selectable; still need richer visual styles (bold centre, TikTok-safe lower third, high-contrast accessibility).
3. [pending] Add upload progress persistence/server-side status for large browser uploads.
4. [done] Add a “render selected clip” button from Clip Factory.

## Long-term architectural improvement
1. [pending] Move persistence from one JSON file to SQLite once clip/render volume grows.

## Research / competitive analysis
1. [in-progress] Research successful clipping/social platforms and compare Vibe Zone gaps.
2. [pending] Convert competitor findings into implementation tasks.
3. [pending] Review Masala stream output quality against those patterns.

## UX / product design workstream
1. [high-priority] Redesign information architecture around Ingest → Processing → Clip Review → Render Lab → Dispatch.
2. [high-priority] Build a proper Clip Review page with preview, statuses, platform target, caption/title review, and export actions.
3. [in-progress] Build Render Lab presets including punchy captions and 50/50 facecam mode; next add richer caption styles and true overlay inputs.
4. [medium] Add UX progress states for upload/transcription/rendering with clear retry/resume actions.
5. [medium] Create visual safe-zone overlay guidance for Shorts captions and facecam placement.

## Content HQ expansion
1. [high-priority] Add `CONTENT_HQ_MASTER_PLAN.md` north-star spec into navigation/roadmap.
2. [high-priority] Add Dispatch Calendar model: asset, platform, variant, status, scheduled time, CTA, and owner approval state.
3. [high-priority] Add platform target metadata to every clip candidate and render output.
4. [high-priority] Add Copy Studio exports: X posts/threads, Reddit framing, Substack post, Medium article, Discord announcement, podcast show notes, pinned comments.
5. [high-priority] Add Thumbnail Lab: concept board, title text, face-reference approval gate, A/B variants.
6. [medium] Add Winner Radar analytics fields: watch time, retention, rewatches, comments, shares, saves, CTR, engagement velocity, follower/email conversion.
7. [medium] Add master/variant render relationships so Facebook/Reels/TikTok/Shorts get native clean variants without watermarks.
8. [medium] Add owned-audience funnel fields to export bundles: target destination, CTA, Discord/Substack/Patreon/membership link placeholders.
9. [medium] Add podcast/audio export path: audio extraction, dead-air trimming plan, title, show notes, timestamps.
10. [medium] Add archive search schema for streams, clips, transcripts, captions, metadata, thumbnails, analytics, and post copy.
11. [later] Add official platform integrations only after explicit approval: scheduling, analytics import, and posting APIs with rate-limit safety.
12. [later] Design Rex Live Companion / Avatar: stream-safe overlay, job/context watcher, optional voice mode, and long-term hologram-style desk presence.

## Selected clip rendering follow-ups
1. [done] Add Render Short action on Clip Factory candidates with source-duration guardrails.
2. [done] Add export bundles for approved rendered clips (`upload-card.md`, metadata, checklist).
3. [done] Add render preset selector UI beyond the default punchy captions preset.

## API setup reminder
- [pending] Remind Masala later to set up API keys/providers for higher-quality embeddings, image generation, and optional platform integrations. For now prefer local Ollama/no-API paths.
