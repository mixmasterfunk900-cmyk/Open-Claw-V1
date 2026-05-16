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

## Day 3 clean-caption upload candidate — 2026-05-13 19:00 UTC

Rendered a cleaner Day 3 long-form candidate from the same approved story spine after the 18:45 corrected draft showed captions competing with lower-third story bars. This pass re-renders directly from the Day 3 source footage, keeps the immediate live-footage opening, removes the lower-third bars, keeps fixed bottom-lane phrase captions, keeps a small VIBE ZONE burn, and keeps the CTA outro card.

Artifacts:

- `scripts/render-longform-day3-clean-captions-20260513T1900Z.mjs`
- `media/renders/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.mp4`
- `media/renders/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.ass`
- `media/renders/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.qa.json`
- `media/exports/long-form/day3-product-content-machine-clean-captions-20260513T1900Z/upload-notes.md`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z-first-frame.jpg`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-clean-captions-20260513T1900Z-contact-sheet.jpg`

Quality gate result: ffprobe and full decode passed; output is h264/aac 1920x1080 at ~4:48; caption QA passed with 158 non-overlapping phrase-caption events; upload notes include title options, description, chapters, and thumbnail direction. Contact-sheet review showed no obvious secrets or render failure, though livestream UI/chat text is still visible and the CTA/outro appears as a dark tile in the sheet. Do not mark public-upload-ready until Masala completes a full-resolution privacy/watch pass.

## Day 3 upload-candidate refresh — 2026-05-13 23:00 UTC

Rendered a fresh upload-candidate copy of the clean Day 3 long-form cut and upgraded the surrounding handoff assets. This pass keeps the strongest no-story-overlays editorial direction: immediate live footage, clean 1080p stream framing, fixed bottom-lane phrase captions, and only a small VIBE ZONE/OpenClaw mark. The story spine remains hook → problem → blocker → build → stakes → result → CTA, ending on the next concrete bottleneck (face tracking) so the video points viewers into the next episode.

Artifacts:

- `scripts/render-longform-day3-upload-candidate-20260513T2300Z.mjs`
- `media/story-plans/day3-product-content-machine-upload-candidate-20260513T2300Z.json`
- `media/story-plans/day3-product-content-machine-upload-candidate-20260513T2300Z.md`
- `media/renders/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z.mp4`
- `media/renders/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z.ass`
- `media/renders/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z.qa.json`
- `media/exports/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-day3-product-content-machine-upload-candidate-20260513T2300Z.mp4`
- `media/reviews/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-upload-candidate-20260513T2300Z-contact-sheet.jpg`

Quality gate result: ffprobe passed (h264/aac, 1920x1080, 283.021s) and full decode passed with an empty error log. Caption QA passed with 158 non-overlapping phrase-caption events. Upload notes include title options, description, chapters, manual-upload checklist, and thumbnail concepts. Contact-sheet/vision review found no obvious render failure, blank frames, secrets, API keys, passwords, or private tokens; small livestream UI/code text is present but not legible enough to identify sensitive content. Keep the owner full-resolution privacy/watch pass requirement before public upload.

## Stream 2 clean-caption upload candidate — 2026-05-14 03:00 UTC

Rendered a cleaner Stream 2 long-form founder-story candidate from the earlier prototype spine. This pass keeps the non-chronological story order (big thesis first, then rewind to constraint/build/blockers/result), removes chapter-card interruptions, burns fixed bottom-lane phrase captions, and adds only a small OpenClaw/Vibe Zone mark. The goal is a more upload-shaped 7:06 cut that can sit beside the Day 3 upload candidate as the origin-story episode.

Artifacts:

- `scripts/render-longform-stream2-founder-upload-candidate-20260514T0300Z.mjs`
- `media/story-plans/stream2-founder-story-upload-candidate-20260514T0300Z.json`
- `media/story-plans/stream2-founder-story-upload-candidate-20260514T0300Z.md`
- `media/renders/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.mp4`
- `media/renders/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.ass`
- `media/renders/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.qa.json`
- `media/exports/long-form/stream2-founder-story-upload-candidate-20260514T0300Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-upload-candidate-20260514T0300Z.mp4`
- `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.ffprobe.json`
- `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.decode.log`
- `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z-screenshot.jpg`
- `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z-contact-sheet.jpg`

Quality gate result: ffprobe passed (h264/aac, 1920x1080, 426.221s) and full decode passed end-to-end. Caption QA passed with 143 non-overlapping phrase-caption events. Upload notes include title options, description, chapters, manual-upload checklist, and thumbnail concepts. Contact-sheet vision review found no obvious render failure, blank frames, API keys, passwords, private tokens, or legible sensitive text; small livestream UI/chat/task text is visible. Keep the owner full-resolution privacy/watch pass requirement before public upload.

## Stream 2 07:00 UTC recheck — 2026-05-14

Rechecked the current Stream 2 origin-story upload candidate rather than restarting the site or touching any external services. No new public exposure, logins, cookies, or posting were used.

Current best Stream 2 handoff remains:

- Render: `media/renders/long-form/stream2-founder-story-upload-candidate-20260514T0300Z.mp4`
- Ready copy: `media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-upload-candidate-20260514T0300Z.mp4`
- Upload notes: `media/exports/long-form/stream2-founder-story-upload-candidate-20260514T0300Z/upload-notes.md`
- Recheck review: `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0700Z.recheck.review.md`
- Recheck ffprobe: `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0700Z.recheck.ffprobe.json`
- Recheck decode log: `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0700Z.recheck.decode.log`
- Screenshot: `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z-screenshot.jpg`
- Contact sheet: `media/reviews/long-form/stream2-founder-story-upload-candidate-20260514T0300Z-contact-sheet.jpg`

Quality gate result: ffprobe recheck passed (h264/aac, 1920x1080, 30fps, 426.221s) and a full decode recheck passed with an empty error log. Caption QA remains passed with 143 non-overlapping phrase-caption events. Upload notes include titles, description, chapters, manual-upload checklist, and thumbnail concepts. Contact-sheet review found no blank/error frames and no obvious secrets/API keys/passwords/private tokens; small livestream UI/chat/settings text remains visible but not clearly legible in sampled frames. Keep the owner full-resolution privacy/watch pass before public posting.

Editorial note for the next long-form pass: do not add more story cards to this candidate. The clean-caption, no-interruption format is the best current direction. If more time is available, make the next refinement a true content change: either a tighter 4–5 minute Stream 2 cut that removes repeated setup troubleshooting, or a Day 3 sequel that starts from the working product/content-machine candidate and ends on the face-tracking bottleneck.

## Stream 2 privacy-safe long-form refinement — 2026-05-14 11:00 UTC

Rendered a privacy-safe 6:46 Stream 2 founder-story draft for cases where upload safety matters more than showing crisp UI details. This uses the proven Stream 2 story spine (hook → problem → blocker → build → blocker → result → CTA), but applies a full-source blur/dim treatment before captions/logo so terminal, browser, chat, and setup text are not readable. The audio and burned phrase captions carry the story.

Artifacts:

- `scripts/render-longform-stream2-founder-privacy-safe-20260514T1100Z.mjs`
- `media/story-plans/stream2-founder-story-privacy-safe-20260514T1100Z.json`
- `media/story-plans/stream2-founder-story-privacy-safe-20260514T1100Z.md`
- `media/renders/long-form/stream2-founder-story-privacy-safe-20260514T1100Z.mp4`
- `media/renders/long-form/stream2-founder-story-privacy-safe-20260514T1100Z.ass`
- `media/renders/long-form/stream2-founder-story-privacy-safe-20260514T1100Z.qa.json`
- `media/exports/long-form/stream2-founder-story-privacy-safe-20260514T1100Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-privacy-safe-20260514T1100Z.mp4`
- `media/reviews/long-form/stream2-founder-story-privacy-safe-20260514T1100Z.ffprobe.json`
- `media/reviews/long-form/stream2-founder-story-privacy-safe-20260514T1100Z.decode.log`
- `media/reviews/long-form/stream2-founder-story-privacy-safe-20260514T1100Z-screenshot.jpg`
- `media/reviews/long-form/stream2-founder-story-privacy-safe-20260514T1100Z-contact-sheet.jpg`

Quality gate result: ffprobe passed (h264/aac, 1920x1080, 406.221s) and full decode passed with an empty error log. Caption QA passed with 138 non-overlapping phrase-caption events. Upload notes include title options, description, chapters, manual-upload checklist, and thumbnail concepts. Contact-sheet vision review found no render failures/blank frames and no obvious secrets, API keys, passwords, or private messages; only intentional overlay/caption text such as “LET’S GET HYPED!” and “24-7!” was barely readable. Owner final taste/watch pass is still recommended before public upload, but this is the safest current Stream 2 long-form candidate for private-text avoidance.


## Stream 2 tight privacy-safe refinement — 2026-05-14 15:00 UTC

Rendered a tighter Stream 2 founder-story variant for Masala’s upload handoff. This pass keeps the privacy-safe blur/dim treatment from the 11:00 candidate but makes a real editorial change: the long setup/livestream-tax section is reduced to a short friction beat, and the problem segment stops before the final CTA line so the ending does not feel repeated. The result is a faster 4:46 upload candidate that still carries hook → problem → blocker → build → blocker → result → CTA.

Artifacts:

- `scripts/render-longform-stream2-founder-tight-privacy-safe-20260514T1500Z.mjs`
- `media/story-plans/stream2-founder-story-tight-privacy-safe-20260514T1500Z.json`
- `media/story-plans/stream2-founder-story-tight-privacy-safe-20260514T1500Z.md`
- `media/renders/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.mp4`
- `media/renders/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.ass`
- `media/renders/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.qa.json`
- `media/exports/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-tight-privacy-safe-20260514T1500Z.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/stream2-founder-story-tight-privacy-safe/video.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/stream2-founder-story-tight-privacy-safe/upload-card.md`
- `media/reviews/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.review.md`
- `media/reviews/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.ffprobe.json`
- `media/reviews/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z.decode.log`
- `media/reviews/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z-screenshot.jpg`
- `media/reviews/long-form/stream2-founder-story-tight-privacy-safe-20260514T1500Z-contact-sheet.jpg`

Quality gate result: source render and packaged final-ready copy both passed ffprobe and full decode. Output is h264/aac 1920x1080, 30fps, 286.221s. Caption QA passed with 95 phrase-caption events. Upload notes include corrected chapters, title options, description, manual-upload checklist, and thumbnail concepts; the final-ready package reuses the approved Stream 2 Gotham-style thumbnail set with `04-stream-to-startup.png` recommended. Screenshot/contact-sheet vision review found no readable private text or secrets; several frames are intentionally very dark/blurred because this version prioritizes privacy-safe upload readiness over crisp UI detail. Owner final taste/watch pass is still recommended before public posting.

## Day 3 privacy-safe long-form handoff — 2026-05-14 19:05 UTC

Rendered a privacy-safe Day 3 product/content-machine draft for Masala's long-form upload handoff. This keeps the proven Day 3 story spine — hook → product promise → rough blocker → live shipping → product/content stakes → agent-loop result → face-tracking CTA — but applies the same full-source blur/dim safety treatment used by the latest Stream 2 candidate. The goal is a safer public-upload candidate where terminal/browser/chat/setup text is not readable, while original audio and burned phrase captions carry the story.

Artifacts:

- `scripts/render-longform-day3-privacy-safe-20260514T1905Z.mjs`
- `media/story-plans/day3-product-content-machine-privacy-safe-20260514T1905Z.json`
- `media/story-plans/day3-product-content-machine-privacy-safe-20260514T1905Z.md`
- `media/renders/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.mp4`
- `media/renders/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.ass`
- `media/renders/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.qa.json`
- `media/exports/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-day3-product-content-machine-privacy-safe-20260514T1905Z.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-privacy-safe/video.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-privacy-safe/upload-card.md`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.packaged.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z.packaged.decode.log`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-privacy-safe-20260514T1905Z-contact-sheet.jpg`

Quality gate result: source render and packaged final-ready copy both passed ffprobe and full decode. Output is h264/aac 1920x1080, 30fps, 283.021s. Caption QA passed with 158 phrase-caption events. Upload notes include chapters, title options, description, manual-upload checklist, and thumbnail concepts. Screenshot/contact-sheet vision review found no render failures, no blank frames, and no readable private text, API keys, passwords, tokens, or private messages; only burned captions are readable. Owner final taste/watch pass is still recommended before public posting.

## Day 3 tight privacy-safe long-form handoff — 2026-05-14 23:10 UTC

Rendered a tighter privacy-safe Day 3 product/content-machine draft for Masala's long-form upload handoff. This pass makes a real editorial refinement from the 19:05 candidate: the rough-blocker section is shortened and the agent-loop payoff is tightened, bringing the video to 4:03 while preserving the complete hook → product promise → blocker → live shipping → stakes → result → face-tracking CTA story spine. The full-source blur/dim treatment remains in place so terminal/browser/chat/setup text is not readable.

Artifacts:

- `scripts/render-longform-day3-tight-privacy-safe-20260514T2310Z.mjs`
- `media/story-plans/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.json`
- `media/story-plans/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.md`
- `media/renders/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.mp4`
- `media/renders/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.ass`
- `media/renders/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.qa.json`
- `media/exports/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-day3-product-content-machine-tight-privacy-safe-20260514T2310Z.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-tight-privacy-safe/video.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-tight-privacy-safe/upload-card.md`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.packaged.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z.packaged.decode.log`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z-contact-sheet.jpg`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z-cta-frame.jpg`
- `media/reviews/long-form/day3-product-content-machine-tight-privacy-safe-20260514T2310Z-end-frame.jpg`

Quality gate result: source render and packaged final-ready copy both passed ffprobe and full decode. Output is h264/aac 1920x1080, 30fps, 243.021s. Caption QA passed with 142 phrase-caption events. Upload notes include corrected chapters, title options, description, manual-upload checklist, and thumbnail concepts. Contact-sheet/proof-frame review found no readable private text, API keys, passwords, tokens, or private messages. The dark lower-right area in the 4x2 contact sheet is an unused/near-end tile artifact rather than a blank render failure; sampled CTA/end frames render normally. Owner final taste/watch pass is still recommended before public posting.

## Stream 2 fast privacy-safe refinement — 2026-05-15 03:10 UTC

Rendered a faster Stream 2 founder-story variant for Masala's long-form upload handoff. This pass makes a real pacing edit from the 4:46 tight privacy-safe cut: the setup/problem section, failed-clip beat, build section, and livestream-tax blocker are all shortened while preserving the complete hook → problem → blocker → build → blocker → result → CTA story spine. The full-source blur/dim treatment remains in place so terminal/browser/chat/setup text is not readable.

Artifacts:

- `scripts/render-longform-stream2-founder-fast-privacy-safe-20260515T0310Z.mjs`
- `media/story-plans/stream2-founder-story-fast-privacy-safe-20260515T0310Z.json`
- `media/story-plans/stream2-founder-story-fast-privacy-safe-20260515T0310Z.md`
- `media/renders/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.mp4`
- `media/renders/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.ass`
- `media/renders/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.qa.json`
- `media/exports/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-stream2-founder-story-fast-privacy-safe-20260515T0310Z.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/stream2-founder-story-fast-privacy-safe/video.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/stream2-founder-story-fast-privacy-safe/upload-card.md`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.ffprobe.json`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.decode.log`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.packaged.ffprobe.json`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z.packaged.decode.log`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z-contact-sheet-6frames.jpg`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z-cta-frame.jpg`
- `media/reviews/long-form/stream2-founder-story-fast-privacy-safe-20260515T0310Z-end-frame.jpg`

Quality gate result: source render and packaged ready copy both passed ffprobe and full decode. Output is h264/aac 1920x1080, 30fps, 223.221s. Caption QA passed with 77 phrase-caption events. Upload notes include corrected chapters, title options, description, manual-upload checklist, and thumbnail concepts; the final-ready package reuses the approved Stream 2 Gotham-style thumbnail set with `04-stream-to-startup.png` recommended. Vision review on corrected 6-frame contact sheet plus CTA/end proof frames found no readable private text, API keys, passwords, tokens, or private messages. The earlier black contact-sheet area was unused tile space from a too-large tile layout, not a render failure. Owner final taste/watch pass is still recommended before public posting.

## Day 3 fast privacy-safe refinement — 2026-05-15 07:10 UTC

Rendered a faster Day 3 product/content-machine variant for Masala's long-form upload handoff. This pass makes a real pacing edit from the 4:03 tight privacy-safe cut: the product-promise section, rough-blocker beat, live-shipping action beat, stakes beat, and agent-loop payoff are all shortened while preserving the complete hook → problem → blocker → build → stakes → result → face-tracking CTA story spine. The full-source blur/dim treatment remains in place so terminal/browser/chat/setup text is not readable.

Artifacts:

- `scripts/render-longform-day3-fast-privacy-safe-20260515T0710Z.mjs`
- `media/story-plans/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.json`
- `media/story-plans/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.md`
- `media/renders/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.mp4`
- `media/renders/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.ass`
- `media/renders/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.qa.json`
- `media/exports/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z/upload-notes.md`
- `media/exports/READY_TO_SHIP_NOW/long-day3-product-content-machine-fast-privacy-safe-20260515T0710Z.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-fast-privacy-safe/video.mp4`
- `media/exports/READY_TO_SHIP_NOW/long-form-final-ready/day3-product-content-machine-fast-privacy-safe/upload-card.md`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.review.md`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.decode.log`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.packaged.ffprobe.json`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z.packaged.decode.log`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z-screenshot.jpg`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z-contact-sheet-6frames.jpg`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z-cta-frame.jpg`
- `media/reviews/long-form/day3-product-content-machine-fast-privacy-safe-20260515T0710Z-end-frame.jpg`

Quality gate result: source render and packaged final-ready copy both passed ffprobe and full decode. Output is h264/aac 1920x1080, 30fps, 191.021s. Caption QA passed with 112 phrase-caption events. Upload notes include corrected chapters, title options, description, manual-upload checklist, and thumbnail concepts. Vision review on the corrected 6-frame contact sheet found no render failures, blank/error frames, or legible private/sensitive text; only burned subtitle fragments were readable. Owner final taste/watch pass is still recommended before public posting.
