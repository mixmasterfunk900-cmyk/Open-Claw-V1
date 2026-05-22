# Dog Content Audio-Truth Pipeline

Permanent rule: after a real voiceover exists, **the audio alignment is the source of truth**. Estimated visual-plan timings are not allowed to ship directly.

## Required order

1. Create/review the researched long-form script and visual plan.
2. Generate/review approved frames for every visual beat.
3. Drop in the final voiceover WAV.
4. Run Whisper with word timestamps for the exact final WAV.
5. Render with `scripts/render_dog_audio_truth_video.mjs`.
6. Run the real image-generation frame quality gate before rendering/review.
7. Review the generated audit/proof frames before marking the video review-ready.

## Why

The previous Dog Staring clean stitch used plan-estimated timings. That can drift from how the voiceover is actually spoken, especially around pauses and sentence pacing. It also produced no captions. The fixed render path uses one Whisper word-timestamp JSON to drive both:

- frame durations
- one-line bottom captions

If the plan word count and audio word count drift too far, the render fails instead of producing a misleading video.

## Command pattern

```bash
. /root/.openclaw/workspace/.venv-transcribe/bin/activate
whisper /path/to/final.wav \
  --model base \
  --language en \
  --output_format json \
  --word_timestamps True \
  --max_words_per_line 7 \
  --output_dir /path/to/full_video_prep/alignment

cd /root/.openclaw/workspace/youtube-automation
node scripts/render_dog_audio_truth_video.mjs \
  projects/<project>/full_video_prep \
  visual_plan_v2_132.json \
  alignment/<voiceover>.json \
  voiceover_drop/<voiceover>.wav \
  <project>_audio_truth_captioned.mp4 \
  /root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/dog-content/<project>/<project>-audio-truth-captioned.mp4
```

## Shipping gate

A Dog Content video is not review-ready unless the audit JSON exists and reports:

- `beats` equals the approved frame count
- approved frames pass `scripts/check_dog_frame_quality.mjs`
- `captions` is much greater than the visual beat count
- `wordRatio` is between `0.92` and `1.08`
- `timingMethod` is `exact-token-walk-from-whisper-word-timestamps`
- `avgBeatAlignmentScore` is high enough to prove frames were aligned to the spoken audio, not estimated duration
- audio duration matches the rendered MP4 duration
- Vibe Zone copy exists

Clean no-caption stitches are allowed only as debug previews, not owner review drafts. See `DOG_CONTENT_PRODUCTION_JOB_ORDER.md` for the full mandatory order.
