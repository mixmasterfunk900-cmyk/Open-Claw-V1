# OpenShorts Evaluation for Vibe Zone

Repo: `https://github.com/mutonby/openshorts`  
Checked: 2026-05-13 UTC  
Verdict: **promising reference for clipping/reframing, not a drop-in replacement.**

## Summary

OpenShorts is a self-hosted AI shorts platform with:

- upload/URL ingest
- faster-whisper transcription with word timestamps
- Gemini-based viral moment selection
- PySceneDetect scene boundary detection
- 9:16 reframing with MediaPipe face detection + YOLO fallback
- subtitles/hook overlays
- optional publishing, S3 backup, AI UGC actor videos, YouTube Studio tools

It is much closer to our clipping problem than MoneyPrinterV2. It is also broader/heavier than what Vibe Zone needs.

## License

MIT. Safe to study, adapt, or reuse with attribution if we choose.

## Useful pieces for Vibe Zone

### 1. Viral moment detection prompt

`main.py` has a strong Gemini prompt that passes:

- full transcript
- word-level timestamps
- strict absolute-second timestamp contract
- clip duration constraints
- ranking/order by predicted performance
- metadata fields for TikTok/Instagram/YouTube
- hook overlay text

This is directly useful. Vibe Zone already has transcripts and clip candidates, but our clip selection can be improved by adopting the **strict timestamp contract** and asking for ranked 15–60s moments.

### 2. Word-level transcription path

OpenShorts uses `faster-whisper` with `word_timestamps=True`.

This matches the direction we just chose for captions. Vibe Zone should evaluate `faster-whisper` or WhisperX as a dedicated word-timestamp pass for final clip/long-form exports.

### 3. Scene-aware vertical reframing

OpenShorts uses:

- PySceneDetect for scene boundaries
- MediaPipe face detection
- YOLO person fallback
- per-scene strategy: `TRACK` for single speaker, `GENERAL` for wide/group/no-face shots
- blurred-background general framing
- smoothed cameraman movement with a safe zone

This is very relevant to Masala’s feedback that clips should follow screen/context better and not default to bad square-face/card layouts.

Best idea to borrow: **per-scene framing strategy**.

For Vibe Zone:

- screen/context-first default
- face tracking only when it improves the beat
- general blurred background fallback when no face/screen crop is confident
- smoothed horizontal crop movement
- avoid rapid crop jumps

### 4. Async job queue shape

`app.py` has a simple FastAPI queue with concurrency control and job retention. Vibe Zone already has OpenClaw cron/subagents, but this structure is useful for local render queue/status modeling.

### 5. Hook overlays as generated images

`hooks.py` creates hook cards as rendered images and overlays them with ffmpeg. We probably do not want its white card style as-is, but the idea of generating overlay assets separately is good.

For Vibe Zone, keep house style:

- VIBE ZONE branding
- white text / black outline
- no blue card regression
- screen/context first

## Weaknesses / risks

### 1. Heavy dependency stack

Requires Python, torch, torchvision, ultralytics, mediapipe, faster-whisper, scenedetect, FastAPI, Docker, etc.

This is too heavy to blindly install into the existing Vibe Zone runtime. Better to extract concepts and maybe run isolated experiments.

### 2. Auto-publishing is not approved

OpenShorts integrates Upload-Post, S3, TikTok/Instagram/YouTube. Vibe Zone must not connect or publish externally without explicit approval.

### 3. Subtitles are not our exact style

OpenShorts subtitle generation groups words into short SRT blocks. Our new rule is stricter:

- short-form = one-word flashes
- long-form = Netflix-style single-line phrase captions

So OpenShorts supports word timestamps, but our local `caption-normalizer` should remain the source of truth.

### 4. Gemini-generated FFmpeg filters are risky

`editor.py` asks Gemini to generate raw ffmpeg filters. It has guardrails, but this can still be brittle. Vibe Zone should prefer deterministic filters plus optional AI suggestions reviewed/validated before execution.

### 5. Clip selection prompt includes CTA language that does not fit us

The OpenShorts prompt says descriptions should include CTAs like “Follow me and comment X...” That conflicts with Masala’s X/reply strategy and can feel spammy. We should not copy that wording.

## Recommended integration path

Do **not** install/run the full OpenShorts stack in production yet.

Instead:

1. Reimplement the useful selection prompt pattern inside Vibe Zone:
   - full transcript
   - word timestamps where available
   - strict absolute seconds
   - 15–60s clips
   - rank by expected performance
   - no generic intros/outros
   - no spammy CTAs
2. Add per-scene framing analysis:
   - PySceneDetect-style scene boundaries
   - face/person confidence sampling
   - decide `SCREEN_FIRST`, `FACE_TRACK`, or `GENERAL_BLUR`
3. Upgrade Vibe Zone final exports to use word timestamps:
   - `faster-whisper` or WhisperX isolated test
   - feed into existing `caption-normalizer`
4. Keep publishing disabled/approval-gated.
5. Optionally test OpenShorts on a short local sample in `/tmp` or a separate Docker sandbox, not wired into Vibe Zone.

## Practical verdict

OpenShorts **can help with our clipping problems**, especially:

- better AI moment selection
- word-timestamp transcription
- scene-aware reframing
- smoothed face/person tracking

But it should be treated as a **reference implementation/source of parts**, not a replacement for Vibe Zone.

Best immediate takeaway: implement OpenShorts-style **scene-aware reframing + strict Gemini clip-selection prompt** inside Vibe Zone, while keeping our new caption-normalizer as the caption source of truth.
