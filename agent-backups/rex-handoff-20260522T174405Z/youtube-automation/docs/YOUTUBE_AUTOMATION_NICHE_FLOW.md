# YouTube Automation Niche Flow — reusable locked spec

This is the reusable long-form automation flow for Dog Content and future niches. The niche may change, and the SOP may change, but the production gates do not get skipped.

For the no-interruption A–Z process after Masala provides final audio, use this checklist first:

- `/root/.openclaw/workspace/youtube-automation/docs/AUDIO_TO_YOUTUBE_READY_CHECKLIST.md`

That checklist is now the default definition of “full loop” and “YouTube ready.”

## Core principle

**Final audio is the source of truth.**

The approved script creates the plan, but the final rendered video must be timed from the exact final voiceover audio using word-level timestamps. No estimated timings, no per-image captions, no placeholder/storyboard frames in review slots.

## What is niche-specific

Each niche gets its own config/SOP layer:

- Niche name and lane slug, e.g. `dog-content`, `history-content`, `finance-content`.
- Script SOP/checklist.
- Required research/source rules.
- Episode chain/CTA rules.
- Visual style bible.
- Thumbnail style bible.
- Voice/tone requirements.
- Disallowed visuals/claims.
- Production-ready npm gate, e.g. `dog:production`, later `<niche>:production`.

## What is universal

These gates apply to every niche:

1. SOP/script gate
2. Visual-plan gate
3. Real image-generation frame gate
4. Final-audio intake + Whisper word timestamps
5. Audio-truth render gate
6. Visual progression QA/contact-sheet gate
7. Review-slot gate
8. Thumbnail gate
9. Owner review delivery gate
10. Archive/debug hygiene gate

---

## 1. SOP/script gate

Before audio or visuals:

- Research/source notes exist.
- Script matches the niche SOP.
- Script is in the approved word-count range for the format.
- Hook/retention structure is present.
- Claims are supportable for the niche.
- End CTA bridges to the next episode or agreed funnel.
- SEO/title/description assets exist if required.

Dog example command:

```bash
cd /root/.openclaw/workspace/vibe-zone
npm run dog:sop
```

Future niches should have equivalent gates, e.g.:

```bash
npm run <niche>:sop
```

---

## 2. Visual-plan gate

Create a beat-by-beat visual plan from the approved script.

Required:

- Every beat has stable `id`, `frame_filename`, and narration/script chunk.
- Beat order follows the script exactly.
- Beats average roughly 4–6 seconds unless the niche SOP says otherwise.
- Hook section gets extra visual variety.
- Visual plan includes enough context for image generation.
- No timing is treated as final until final audio is transcribed.

Forbidden:

- Estimated visual timings as final timings.
- Generic reusable frames that only match the broad topic.
- Visual beats shuffled by filename, creation order, or convenience.

---

## 3. Real image-generation frame gate

Every visual beat must have one approved real generated frame.

Required:

- Approved frames live in `approved_frames/`.
- Frame count equals beat count.
- Frames are real image-generation outputs, not SVG/canvas/vector/storyboard placeholders.
- `frame_generation_manifest.json` records provider/model, frame count, unique generated source count, and `placeholder:false`, `storyboard:false`.
- Unique generated source frames must pass the threshold, currently >=75% of beat count and min 20.
- No small recycled frame sets masquerading as full production.

Dog command:

```bash
cd /root/.openclaw/workspace/youtube-automation
node scripts/check_dog_frame_quality.mjs projects/<project>/full_video_prep/approved_frames <beat-count>
```

Future niches should either reuse this as a generic frame gate or get a renamed equivalent.

---

## 4. Final-audio intake gate

When final voiceover audio arrives:

- Copy it into `voiceover_drop/`.
- Transcribe the exact audio with word timestamps.
- Store alignment JSON under `alignment/`.
- Do not render from script-estimated duration.

Example:

```bash
. /root/.openclaw/workspace/.venv-transcribe/bin/activate
whisper /path/to/final.wav \
  --model base \
  --language en \
  --output_format json \
  --word_timestamps True \
  --max_words_per_line 7 \
  --output_dir /path/to/full_video_prep/alignment
```

---

## 5. Audio-truth render gate

The renderer must align visual beats and captions to the final audio transcript.

Dog renderer:

```bash
cd /root/.openclaw/workspace/youtube-automation
node scripts/render_dog_audio_truth_video.mjs \
  projects/<project>/full_video_prep \
  <visual-plan>.json \
  alignment/<final-audio>.json \
  voiceover_drop/<final-audio>.wav \
  <project>-audio-truth-captioned.mp4 \
  /root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/dog-content/<project>/<project>-audio-truth-captioned.mp4
```

Renderer must fail if:

- Alignment JSON lacks word timestamps.
- Approved frames are missing.
- Frame quality gate fails.
- Plan/audio word count drifts too far.
- Beat-to-audio token alignment score is too low.
- Caption count looks beat/image-based.

Production master rule:

- Master should be clean video + audio + timed subtitle track (`mov_text` in MP4), not permanently burned captions.
- Vibe Zone/browser-ready upload must also include a **full-length burned-subtitle version** because browser/Telegram playback can ignore soft subtitles.
- Telegram review cuts may burn captions visibly because Telegram often strips/ignores soft subtitle tracks.
- Never mark a final-audio run ready if the only visible-caption file is a short preview.

---

## 6. Visual progression QA/contact-sheet gate

This gate is mandatory because Dog Staring exposed that technically ordered filenames can still hide jumbled visual meaning.

Before marking complete:

- Generate contact sheets in chronological beat order.
- Review start/middle/end and all batches for script progression.
- Check character continuity, setting continuity, prop continuity, and emotional/story progression.
- Ensure images match the exact beat narration, not just the overall niche.

Reject if:

- Frames feel like shuffled alternates.
- Character identity changes without reason.
- Random off-script people, props, settings, brands, or scenes appear.
- Time of day/location jumps without script reason.
- Same generic pose repeats without story progress.

---

## 7. Review-slot gate

Only final files that pass production gates can appear in Vibe Zone review lanes.

Review candidate naming should make the purpose explicit, for example:

```text
*-audio-truth-*-master.mp4
*-full-watchable-*-burned-subs.mp4
*-site-visible-captions.mp4
```

For final-audio runs, the primary Vibe Zone file must be the **full-length burned-subtitle version**, not a short preview and not a soft-subtitle-only master.

Not review-ready:

- Clean/debug stitches.
- Placeholder/storyboard videos.
- Videos without visible captions.
- Soft-subtitle-only files when the surface may not show subtitle tracks.
- Short previews pretending to be final upload files.
- Videos with beat-based captions.
- Videos from recycled tiny frame sets.
- Videos missing render audit.
- Videos that fail visual progression QA.

---

## 8. Thumbnail gate

For each approved video:

- Generate 5–10 real thumbnail options.
- Follow the niche thumbnail style bible.
- No random people if the niche requires identity/continuity.
- No unreadable/garbled text.
- Save individual 16:9 options, not only contact sheets.
- Expose options in Vibe Zone Thumbnail/YouTube Automation lane.

---

## 9. Owner review delivery gate

For Telegram review:

- A short review cut is optional, not the final deliverable.
- Burn visible captions into Telegram/browser review files.
- Keep the master clean with soft subtitle track.
- Always create/copy the full-length burned-subtitle Vibe Zone version before saying the video is ready.
- State whether each file is a review cut, full burned-sub review/upload, or clean production master.

---

## 10. Archive/debug hygiene gate

Keep review lanes clean.

- Move failed/storyboard/reused-frame/debug videos into `_storyboard_archive`, `_review_hold`, `_visual_qa_hold`, or `_debug_archive`.
- Do not leave old bad MP4s visible beside corrected review files.
- Write a short failure note when a mistake teaches a new gate.

---

## Current Dog Content locked implementation

Current Dog Content batch:

- `dog-staring-psychology`
- `why-dogs-follow-you-everywhere`
- `why-dogs-get-zoomies`
- `why-dogs-look-guilty`

Current known follow-up:

- `why-dogs-bring-you-toys-gifts`

Dog-specific commands:

```bash
cd /root/.openclaw/workspace/vibe-zone
npm run dog:sop
npm run dog:production
```

Dog-specific docs:

- `/root/.openclaw/workspace/vibe-zone/DOG_CONTENT_SOP_CHECKLIST.md`
- `/root/.openclaw/workspace/youtube-automation/docs/DOG_CONTENT_PRODUCTION_JOB_ORDER.md`
- `/root/.openclaw/workspace/youtube-automation/docs/DOG_CONTENT_AUDIO_TRUTH_PIPELINE.md`

## Starting a new niche

To start the same flow for a new niche, create:

1. `vibe-zone/<NICHE>_SOP_CHECKLIST.md`
2. `youtube-automation/docs/<NICHE>_PRODUCTION_JOB_ORDER.md` or a niche section extending this spec.
3. `vibe-zone/scripts/check-<niche>-content-sop.mjs`
4. `vibe-zone/scripts/check-<niche>-production-ready.mjs`
5. npm scripts:

```json
{
  "<niche>:sop": "node scripts/check-<niche>-content-sop.mjs",
  "<niche>:production": "npm run <niche>:sop && node scripts/check-<niche>-production-ready.mjs"
}
```

6. Vibe Zone lane discovery under:

```text
vibe-zone/media/practice/youtube-automation/<niche>/<project>/
```

7. YouTube Automation project folders under:

```text
youtube-automation/projects/<project>/
```

The only thing that should change between niches is the SOP/style/research layer. The audio-truth, real-frame, visual QA, review, and archive gates stay locked.
