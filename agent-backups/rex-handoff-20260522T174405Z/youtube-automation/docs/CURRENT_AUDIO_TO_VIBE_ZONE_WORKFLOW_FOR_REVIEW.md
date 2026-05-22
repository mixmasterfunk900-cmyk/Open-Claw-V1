# Current Audio → Vibe Zone / YouTube-Ready Workflow for Manual Review

Status: **draft for Masala review/correction**  
Created after the Milgram/obedience render failure where Vibe Zone showed a no-caption file and the visuals were 2×2 collage-style frames.

This document describes the workflow Rex is currently using, the mistakes that happened, and the gates that must be corrected before this system is trusted.

---

## 1. Target outcome

When Masala provides a final audio file, Rex should be able to produce the complete video A–Z without interruptions.

A run is not complete until Vibe Zone contains a **full-length, YouTube-ready, browser-visible render**.

Required final assets:

1. **Clean production master**
   - Full length.
   - Final audio.
   - Video at production quality, ideally 1080p.
   - Soft subtitle track is allowed here.
   - Not the primary browser/Vibe review file.

2. **Vibe Zone / browser-ready full render**
   - Full length.
   - Final audio.
   - Captions burned into the pixels.
   - No dependency on browser subtitle-track support.
   - This is the file Vibe Zone should select first.

3. **Caption/transcript exports**
   - `.json` with Whisper word timestamps.
   - `.srt`.
   - `.vtt`.
   - `.txt`.

4. **Audit/proof files**
   - Render audit JSON.
   - ffprobe proof for master and Vibe render.
   - Visual proof frame(s).
   - Contact sheet / visual QA artifact when frames were generated.

5. **Vibe Zone verification**
   - File exists in the correct Vibe Zone lane.
   - Vibe Zone selects the burned-caption full render, not an older master/preview.
   - `npm run build` passes.

---

## 2. Folder conventions

### Source project

```text
youtube-automation/projects/<project-slug>/
```

Expected folders:

```text
research/
scripts/
voiceover_drop/
transcription/ or alignment/
full_video_prep/
full_video_prep/approved_frames/ or approved_frames_draft/
full_video_prep/render_work_audio_truth/
renders/
previews/
proof/
```

### Vibe Zone lane

```text
vibe-zone/media/practice/youtube-automation/<niche>/<project-slug>/
```

Expected folders:

```text
renders/
previews/
transcription/
proof/
thumbnails/
```

---

## 3. Intake final audio

When Masala provides audio:

1. Download/copy it into:

```text
youtube-automation/projects/<project>/voiceover_drop/<final-audio-name>.wav
```

2. Inspect it:

```bash
ffprobe -v error \
  -show_entries format=duration,size,format_name:stream=codec_type,codec_name,sample_rate,channels \
  -of default=noprint_wrappers=1 \
  <audio-file>
```

Gate:

- Must be the exact final audio Masala supplied.
- Must have readable duration.
- Must not use estimated script timing.

---

## 4. Inventory script, plan, and frames

Required source files:

```text
scripts/script_v*.md
full_video_prep/visual_plan*.json
full_video_prep/frame_generation_manifest.json
full_video_prep/approved_frames*/beat_###.png
```

Steps:

1. Count visual beats from the plan.
2. Count generated frames.
3. Verify every `beat_###.png` exists.
4. Validate each image is a real raster image.
5. Reject placeholders, SVGs, storyboards, collages, contact sheets, or multi-panel images.

Current known failure:

- The Milgram/obedience frames visually looked like 2×2 contact sheets/collages.
- The old gate only checked file existence and PNG validity, not whether the image was a single usable frame.
- This allowed bad visual assets through.

New required gate:

```text
PASS only if every generated frame is one full-frame scene, not a grid/collage/contact sheet.
```

Suggested practical checks:

- Create contact sheets from generated frames.
- Extract representative frames from the render at 0:30, 1:00, middle, and near end.
- Use visual review before declaring ready.
- If a frame is a grid, either regenerate it or explicitly crop a single quadrant as a temporary salvage render and label it as such.

---

## 5. Transcribe final audio with word timestamps

Command pattern:

```bash
. /root/.openclaw/workspace/.venv-transcribe/bin/activate
whisper <final-audio.wav> \
  --model base \
  --language en \
  --word_timestamps True \
  --output_format all \
  --output_dir <project>/transcription
```

Required outputs:

```text
<final-audio>.json
<final-audio>.srt
<final-audio>.vtt
<final-audio>.txt
```

Gate:

- JSON must include word timestamps.
- Transcript duration should match audio duration.
- Captions must be derived from final audio, not visual beat timing.

---

## 6. Audio-truth alignment

Renderer aligns each visual beat to transcript words.

Audit must include:

- plan path
- alignment path
- voiceover path
- output path
- beat count
- caption count
- plan word count
- audio word count
- word ratio
- average beat alignment score
- weak beat matches
- audio duration
- max/average frame duration

Gate:

```text
PASS only if beat alignment score is strong and saved in an audit file.
```

For the Milgram/obedience render, the alignment itself was good:

```text
beats: 129
captions: 370
planWords: 2001
audioWords: 1997
wordRatio: 1.002
avgBeatAlignmentScore: 0.987
weakBeatMatches: 2
audioDuration: 826.65s
```

The alignment passed, but visual/caption delivery still failed because separate gates were weak.

---

## 7. Full master render

Current renderer:

```text
youtube-automation/scripts/render_experiment_audio_truth_video.mjs
```

Current default editing direction:

- 16:9 long-form.
- Final audio controls timing.
- 3.5% slow zoom on still frames.
- Subtle varied fade transitions.
- Clean master includes audio and soft subtitle track.

Example output:

```text
renders/<project>-audio-truth-motion-transitions-master.mp4
```

Master gate:

```bash
ffprobe -v error \
  -show_entries format=duration,size:stream=index,codec_type,codec_name,width,height,sample_rate,channels:stream_tags=language \
  -of json \
  <master.mp4>
```

PASS only if:

- full expected duration
- video stream exists
- audio stream exists
- subtitle stream exists if intended
- no render errors

Important:

- This clean master is not enough for Vibe Zone, because browser playback may not display soft subtitles.

---

## 8. Full Vibe Zone / browser-visible render

This is the file Masala should see first in Vibe Zone.

Requirements:

- Full length.
- Captions burned into pixels.
- Audio included.
- Browser/Vibe compatible.
- Named so Vibe Zone selection prefers it.

Preferred naming:

```text
*-full-site-visible-captions*.mp4
```

or:

```text
*-site-visible-captions*.mp4
```

Vibe Zone selection must prefer:

1. `site-visible-captions`
2. `burned-subs`
3. short visible-caption previews only after full visible-caption files
4. soft-subtitle masters only as fallback

Current App.tsx selection has been patched to prefer `site-visible-captions` and `burned-subs` before soft-subtitle masters.

---

## 9. Caption burn-in command pattern

Example full burned-caption render:

```bash
ffmpeg -y -i <clean-master.mp4> \
  -map 0:v:0 -map 0:a:0 \
  -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,subtitles='<captions.ass>':force_style='Fontsize=23,Outline=1.8,Shadow=0.8,MarginV=34',format=yuv420p" \
  -c:v libx264 -preset veryfast -b:v 620k -maxrate 820k -bufsize 1640k \
  -c:a aac -b:a 80k -movflags +faststart \
  <full-site-visible-captions.mp4>
```

Gate:

- Extract a proof frame from a captioned timestamp.
- Visually confirm captions are visible.
- Do not rely only on ffprobe, because burned captions are not a separate stream.

Proof command:

```bash
ffmpeg -y -ss 61 -i <full-site-visible-captions.mp4> -frames:v 1 proof/caption-proof-61s.jpg
```

---

## 10. Visual grid/collage failure fix

What went wrong:

- The generated frames were valid PNGs, but visually resembled 2×2 panels/contact sheets.
- The render used the full PNG, so the video displayed a 2×2 grid instead of one full-frame scene.

Immediate salvage fix used on the current Milgram render:

```bash
-vf "crop=iw/2:ih/2:0:0,scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2,subtitles='<captions.ass>':force_style='Fontsize=23,Outline=1.8,Shadow=0.8,MarginV=34',format=yuv420p"
```

This crops the top-left quadrant and scales it to one full frame.

Important label:

- This is a **salvage fix**, not the ideal final production method.
- Ideal fix is to regenerate every bad multi-panel frame as a true single-scene full-frame image.

New required visual gate:

```text
Do not render from grid/collage/contact-sheet source frames unless explicitly producing a marked salvage render.
```

---

## 11. Vibe Zone publish

Copy these into Vibe Zone:

```text
renders/<clean-master>.mp4
renders/<full-site-visible-captions>.mp4
transcription/<audio>.json
transcription/<audio>.srt
transcription/<audio>.vtt
transcription/<audio>.txt
proof/<caption-proof>.jpg
full_video_prep/render_work_audio_truth/audio_truth_render_audit.json
```

Run:

```bash
cd /root/.openclaw/workspace/vibe-zone
npm run build
```

Optional API check:

```bash
curl http://127.0.0.1:8787/api/state
```

Gate:

- Build must pass.
- Vibe Zone must select full visible-caption file.
- A proof image must show captions and no collage layout.

---

## 12. Final response standard

Rex should not say “ready” unless all gates pass.

Final message must include:

- Full visible-caption Vibe Zone render path.
- Clean production master path.
- Duration.
- Whether captions are burned in.
- Whether this is a clean production render or a salvage render.
- Any known weakness/blocker.

Example wording:

```text
Ready for review, with one caveat: this is a salvage render that crops the source collage frames to a single panel. Captions are burned in and Vibe Zone now prefers this file. For true YouTube final, the bad multi-panel frames should be regenerated as single-frame images.
```

---

## 13. Current Milgram/obedience render state

Current corrected Vibe-visible file:

```text
vibe-zone/media/practice/youtube-automation/the-experiment-where/the-experiment-where-ordinary-people-obeyed-a-stranger/renders/ordinary-people-obeyed-a-stranger-full-site-visible-captions-single-frame-480p.mp4
```

Current proof frame:

```text
vibe-zone/media/practice/youtube-automation/the-experiment-where/the-experiment-where-ordinary-people-obeyed-a-stranger/proof/fixed-single-frame-captions-proof-61s.jpg
```

Verification:

- Duration: 827.3s / 13:47.
- Video: H.264, 854×480.
- Audio: AAC, mono, 44.1kHz.
- Captions: burned into pixels.
- Visual proof check: single full-frame crop, not 2×2 collage; subtitles visible.
- Vibe Zone build passed after App.tsx selection patch.

Caveat:

- This is a salvage render because it crops a single quadrant from multi-panel generated frames.
- A true final YouTube version should regenerate the bad frames as single full-frame images, then rerender with the same audio-truth and caption gates.

---

## 14. Manual review questions for Masala

Please review/correct these decisions:

1. Should Vibe Zone always prefer a 480p/720p burned-caption review file, or should the burned-caption file be 1080p even if larger?
2. Should the clean production master include soft subtitles, or should the upload master also be burned-subtitle by default?
3. If generated frames come back as multi-panel images, should Rex:
   - stop and regenerate all bad frames, or
   - create a clearly labeled crop/salvage review render first?
4. Is 3.5% slow zoom still the default for long-form generated-frame videos?
5. Are subtle fades acceptable, or should transitions be more varied/animated?
6. What caption style should become standard for long-form?
   - white text with black outline at bottom,
   - larger Netflix-style,
   - or another style?
7. Should a video be considered YouTube-ready before thumbnails/title/description are finalized?

---

## 15. Short version of the corrected rule

**Final audio provided → Rex must produce a full-length Vibe Zone file with burned-in captions and visually valid single-frame footage before saying ready.**

If frames are missing, captions are soft-only, Vibe Zone selects the wrong file, or source frames are collages, the run is not complete.

## QA rebuild correction — strangers/Milgram video (2026-05-20)

The rejected global-crop salvage was replaced with a per-beat visual QA rebuild.

- QA source frames: `full_video_prep/approved_frames_draft/beat_001.png` … `beat_129.png`
- Candidate sheets: `full_video_prep/frame_qa_rebuild/sheets/`
- QA decisions: `full_video_prep/frame_qa_rebuild/qa_decisions_001_043.json`, `qa_decisions_044_086.json`, `qa_decisions_087_129.json`
- Rebuilt clean frame set: `full_video_prep/approved_frames_qa_rebuild/`
- QA counts: pass=89, weak=33, fail/fallback=7.
- Fallback beats needing regeneration for true final polish: beat_011, beat_012, beat_016, beat_030, beat_032, beat_033, beat_106.
- Rebuilt master with burned captions: `renders/ordinary-people-obeyed-a-stranger-QA-rebuild-1080p-burned-captions.mp4`
- Vibe Zone/browser copy: `/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/the-experiment-where/the-experiment-where-ordinary-people-obeyed-a-stranger/renders/ordinary-people-obeyed-a-stranger-QA-rebuild-1080p-site-visible-captions.mp4`
- Proof contact sheet: `/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/the-experiment-where/the-experiment-where-ordinary-people-obeyed-a-stranger/proof/qa-rebuild-proof-frames/qa-rebuild-proof-contact-sheet.jpg`

Lesson: never approve a full render from dimensions/codec checks or one proof frame. The gate now needs visual QA across the whole beat set, plus multi-timestamp proof frames from the final Vibe-visible burned-caption file.

