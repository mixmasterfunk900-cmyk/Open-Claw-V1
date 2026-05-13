# Long-Form Story Workflow

Goal: turn livestreams into 3–20 minute story edits by selecting/reordering strong beats, rendering locally, and preparing manual upload notes. No logins, cookies, external posting, or cloud editing required.

## Recommended free/open-source stack

1. **FFmpeg / ffprobe — primary renderer**
   - Already available locally and battle-tested.
   - Best for deterministic trims, concat, re-encode, loudness normalization, title/chapter cards, burned captions, and verification.
   - Use first for lean prototypes because it avoids heavy installs and keeps private stream footage local.

2. **Existing Whisper transcripts — primary story map**
   - Current `media/transcripts/*.json/.srt/.vtt/.txt` are enough for segment-level editing.
   - Use transcript search to find hooks, blockers, outcomes, and CTAs, then write a machine-readable edit decision list (EDL).

3. **WhisperX — optional next upgrade**
   - Open-source GitHub project (`m-bain/whisperX`) for faster ASR, word-level timestamps, forced alignment, and optional diarization.
   - Use when punchier word-accurate captions or transcript-based deletion becomes necessary.
   - Not installed in this pass because current segment timestamps are sufficient and WhisperX can be GPU/dependency-heavy.

4. **PySceneDetect — optional visual boundary helper**
   - Open-source GitHub project (`Breakthrough/PySceneDetect`) for detecting scene/shot changes and splitting videos.
   - Useful for snapping story beats to visual cuts, finding dead-air/screen-change boundaries, and avoiding awkward mid-transition cuts.
   - Not required for the first prototype because the stream is mostly continuous screen/facecam and transcript beats were clearer.

5. **CutScript — optional transcript-editing reference**
   - Open-source local-first, Descript-like transcript-based editor (`DataAnts-AI/CutScript`).
   - Good concept reference for future Vibe Zone UX: edit text → cut media.
   - Do not depend on it yet; inspect further before installing because Vibe Zone only needs a small local EDL/render pipeline right now.

6. **MoviePy — optional Python composition layer**
   - Open-source Python video editing library (`Zulko/moviepy`) for programmatic cuts, concatenation, title cards, and composites.
   - Helpful if Python-side story generation becomes more readable than large FFmpeg filter graphs.
   - For production renders, still prefer direct FFmpeg unless MoviePy noticeably improves maintainability.

## Lean local workflow

1. **Ingest and verify source**
   - Keep source under `media/downloads/`.
   - Verify with `ffprobe` duration and stream metadata before editing.

2. **Load transcript and find beats**
   - Search transcript for: thesis/hook, problem/constraint, attempts, blockers, breakthrough/result, CTA.
   - Prefer story beats over isolated viral clips.

3. **Create an EDL/story plan**
   - Save machine-readable JSON under `media/story-plans/`.
   - Include source path, transcript path, beat order, source timestamps, transcript excerpts, rationale, and target render path.

4. **Render local draft**
   - Trim each source segment with FFmpeg.
   - Normalize to one resolution/fps/audio format.
   - Add chapter cards between reordered beats so non-chronological jumps make sense.
   - Concatenate with FFmpeg concat demuxer or `filter_complex`.

5. **Verify output**
   - Run `ffprobe` on the final MP4.
   - Confirm duration is within target range and video/audio streams exist.

6. **Prepare manual upload bundle**
   - Save upload notes under `media/exports/long-form/<draft-id>/`.
   - Include title options, description, chapters, source disclosure, checklist, and “manual upload only”.

## Recommended next product slice

Add a Vibe Zone “Long-Form Story Builder” page:

- transcript search + beat picker;
- reorderable beat list;
- EDL JSON export/import;
- render preset selector: chapter-card draft, captioned draft, polished 1080p;
- proof player with chapter markers;
- manual upload notes generator;
- approval state before any future posting integration.

## Prototype from this pass

Created a Stream 2 story plan:

- `media/story-plans/stream-2-founder-story-prototype-20260513.json`
- `media/story-plans/stream-2-founder-story-prototype-20260513.md`

Target render:

- `media/renders/long-form/stream-2-founder-story-prototype-20260513.mp4`

Manual upload notes:

- `media/exports/long-form/stream-2-founder-story-prototype-20260513/upload-notes.md`

## Day 3 story slice added — 2026-05-13 07:00 UTC

Created a second long-form draft plan around the clearer Day 3 arc: **product vs. content machine**. The strongest structure is not chronological polish; it is a transparent founder story:

1. personal premise — dad/full-time-job build-in-public hook;
2. product vision — stream upload becomes clips, prompts, analytics, and distribution prep;
3. rough prototype — functionality works but quality/AI brain is not good enough yet;
4. live proof — clip/upload workflow is usable enough to try on stream;
5. strategic stakes — product and content machine are the same survival loop;
6. payoff — planner/film/scout agents should keep the build moving off-stream.

Artifacts:

- `media/story-plans/day3-product-content-machine-20260513.json`
- `media/story-plans/day3-product-content-machine-20260513.md`
- `media/renders/long-form/day3-product-content-machine-20260513.mp4`
- `media/exports/long-form/day3-product-content-machine-20260513/upload-notes.md`

## Day 3 v2 refinement — 2026-05-13 11:00 UTC

Refined the Day 3 product/content-machine story into a tighter 5:08 review draft. The main editorial change is a clearer ending: after the product/content-machine stakes and agent-loop payoff, the cut lands on the next concrete bottleneck — face tracking — instead of ending only on the abstract system plan.

Artifacts:

- `media/story-plans/day3-product-content-machine-v2-20260513T1100Z.json`
- `media/story-plans/day3-product-content-machine-v2-20260513T1100Z.md`
- `media/renders/long-form/day3-product-content-machine-v2-20260513T1100Z.mp4`
- `media/exports/long-form/day3-product-content-machine-v2-20260513T1100Z/upload-notes.md`
- `media/reviews/long-form/day3-product-content-machine-v2-20260513T1100Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-v2-20260513T1100Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-v2-20260513T1100Z.ffprobe.json`

Next polish recommendation: keep the same beat order, but replace several full-screen chapter cards with lower-thirds/J-cuts once Masala approves the story structure.

## Day 3 v3 upload-candidate refinement — 2026-05-13 15:00 UTC

Rendered a more upload-shaped Day 3 long-form candidate from the v2 story spine. The key improvement is replacing repeated full-screen chapter cards with lower-third story labels on the livestream footage, plus a clean generated intro and explicit CTA outro. This makes the 4:53 draft feel less like a review assembly and more like a public video while preserving the proven hook/problem/blocker/build/result arc.

Artifacts:

- `scripts/render-longform-day3-v3-20260513T1500Z.mjs`
- `media/story-plans/day3-product-content-machine-v3-20260513T1500Z.json`
- `media/story-plans/day3-product-content-machine-v3-20260513T1500Z.md`
- `media/renders/long-form/day3-product-content-machine-v3-20260513T1500Z.mp4`
- `media/exports/long-form/day3-product-content-machine-v3-20260513T1500Z/upload-notes.md`
- `media/reviews/long-form/day3-product-content-machine-v3-20260513T1500Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-v3-20260513T1500Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-v3-20260513T1500Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-v3-20260513T1500Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-v3-20260513T1500Z-contact-sheet.jpg`

Quality gate result: render plays/decodes end-to-end, has h264/aac 1080p output, includes hook/problem/blocker/build/result/CTA beats, upload notes with chapters and thumbnail concepts exist, and sampled frames show no obvious secrets. Still require owner full-resolution privacy/watch pass before public upload because livestream UI/chat text is visible in places.
