# Dog Content Production Job Order — mandatory

This is the bulletproof order for every Dog Content long-form video. Do not mark a video review-ready unless every gate passes in order.

## Non-negotiable rule

**Final audio is the source of truth.**

No estimated visual-plan timings, no per-image captions, no clean/debug stitch, and no manually guessed frame durations are allowed in the owner review slot.

## Job order

### 1. Script gate
- Research notes exist.
- Script follows the Dog Content SOP.
- End CTA bridges to the next episode.
- Word count is inside the approved long-form range.

Command from `vibe-zone`:

```bash
npm run dog:sop
```

### 2. Visual-plan gate
- Visual beats are created from the approved script.
- Beats are short enough for long-form pacing, usually 4–6 seconds average.
- Hook section has deliberately varied visuals.
- Every beat has a `frame_filename` and narration chunk.

### 3. Real image-generation frame gate
- Every visual beat has one approved frame in `approved_frames/`.
- Frames must be real ChatGPT/OpenAI/Gemini-style image-generation outputs, not SVG/canvas/vector/storyboard placeholders.
- Rejected/alternate/generated scratch files stay outside review selection.
- Approved frame count must equal visual beat count.
- `frame_generation_manifest.json` must sit next to `approved_frames/` and record provider/model, frame count, and `placeholder: false`.
- The frame quality gate must pass before any review render:

```bash
cd /root/.openclaw/workspace/youtube-automation
node scripts/check_dog_frame_quality.mjs projects/<project>/full_video_prep/approved_frames <beat-count>
```

### 4. Final-audio intake gate
- User-provided final WAV/MP3 is copied into `voiceover_drop/`.
- Never render review video from script-estimated duration.
- Transcribe the exact final audio with word timestamps.

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

### 5. Audio-truth render gate
Render with the reusable renderer only:

```bash
cd /root/.openclaw/workspace/youtube-automation
node scripts/render_dog_audio_truth_video.mjs \
  projects/<project>/full_video_prep \
  <visual-plan>.json \
  alignment/<final-audio>.json \
  voiceover_drop/<final-audio>.wav \
  <project>_audio_truth_captioned.mp4 \
  /root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/dog-content/<project>/<project>-audio-truth-captioned.mp4
```

The renderer must fail if:
- final audio has no Whisper word timestamps
- approved frames are missing
- approved frames fail the real image-generation frame quality gate
- script/plan word count drifts too far from audio transcript
- exact beat-to-audio token alignment score is too low
- captions look beat/image-based instead of audio-word-based

### 6. Review-slot gate
Only files named `*-audio-truth-captioned*.mp4` are review candidates.

Not review-ready:
- `*_full_preview.mp4`
- clean stitches
- videos without captions
- videos with captions generated once per image/beat
- videos rendered from placeholder/vector/storyboard frames
- any render missing `audio_truth_render_audit.json`
- any render whose source frames fail `check_dog_frame_quality.mjs`

### 7. Proof gate
Before reporting ready:
- Extract proof frames near start/middle/end.
- Confirm captions are visible.
- Confirm caption count is much higher than visual beat count.
- Confirm MP4 duration matches final audio duration.
- Confirm Vibe Zone API sees the exact review file.

### 8. Owner review
Only after all gates pass, tell Masala the review video is ready.

## Current known failure modes this prevents

Dog Staring previously reached review with frame/caption behavior that felt tied to image beats instead of the spoken audio. This job order blocks that by making Whisper word timestamps drive captions and exact token-matched beat timing.

The three follow-up videos briefly reached review with audio-truth captions but placeholder/vector frames. This job order now blocks that too: storyboard renders may exist only as private debug artifacts, never as Vibe Zone review videos.
