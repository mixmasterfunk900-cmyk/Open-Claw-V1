# Task Queue

## Immediate executable tasks
1. [completed] Raise and restyle captions into YouTube Shorts-safe zone.
2. [completed] Generate punchy 1–2 word caption ASS file and re-render playable clips.
3. [in-progress] Get a complete source video: validation badges now detect partial/corrupt media; still need complete newest-stream re-upload/import.
4. [pending] Add facecam crop / 50-50 layout render preset.
5. [completed] Add review actions for clip status: idea → draft → reviewed → exported.
6. [pending] Add “render selected clip” from Clip Factory and link output back to the candidate row.

## Medium-priority improvements
1. [pending] Improve semantic clip dedupe to avoid repeated hooks/themes.
2. [pending] Add subtitle presets: bold centre, TikTok-safe lower third, high-contrast accessibility.
3. [pending] Add upload progress persistence/server-side status for large browser uploads.
4. [pending] Add a “render selected clip” button from Clip Factory.

## Long-term architectural improvement
1. [pending] Move persistence from one JSON file to SQLite once clip/render volume grows.

## Research / competitive analysis
1. [in-progress] Research successful clipping/social platforms and compare Vibe Zone gaps.
2. [pending] Convert competitor findings into implementation tasks.
3. [pending] Review Masala stream output quality against those patterns.

## UX / product design workstream
1. [high-priority] Redesign information architecture around Ingest → Processing → Clip Review → Render Lab → Dispatch.
2. [high-priority] Build a proper Clip Review page with preview, statuses, platform target, caption/title review, and export actions.
3. [high-priority] Build Render Lab presets including punchy captions and 50/50 facecam mode.
4. [medium] Add UX progress states for upload/transcription/rendering with clear retry/resume actions.
5. [medium] Create visual safe-zone overlay guidance for Shorts captions and facecam placement.

## Selected clip rendering follow-ups
1. [done] Add Render Short action on Clip Factory candidates with source-duration guardrails.
2. [pending] Add export bundles for approved rendered clips (`upload-card.md`, metadata, checklist).
3. [pending] Add render preset selector UI beyond the default punchy captions preset.
