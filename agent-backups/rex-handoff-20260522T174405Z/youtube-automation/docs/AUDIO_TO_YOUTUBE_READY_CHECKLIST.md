# Audio → YouTube-Ready Video Checklist

This is the no-interruption A–Z checklist for future YouTube Automation runs once Masala provides the final audio file.

## Non-negotiable standard

When final audio is provided, the Vibe Zone upload/review asset must be **100% YouTube ready**, not a partial preview.

A completed delivery includes:

1. Full-length production master.
2. Full-length Vibe Zone/browser-visible version with burned-in subtitles.
3. Captions/transcripts exported separately (`.srt`, `.vtt`, `.txt`, `.json`).
4. Render audit proving audio-truth timing, frame count, stream layout, and duration.
5. Visual QA artifacts/contact sheets when frames were generated.
6. Thumbnail options or a clear `[blocked]` note if thumbnail generation was not part of the current asset set.
7. Vibe Zone build/state verification.

Do not call a video complete if any of these are missing.

---

## 0. Intake

- Download/copy the exact final audio into the project `voiceover_drop/` folder.
- Run `ffprobe` on the audio.
- Confirm duration, codec, channels, sample rate, and file size.
- Do not use old audio, draft audio, script timing, or estimated duration.

Gate:

```text
PASS only if final provided audio exists locally and ffprobe succeeds.
```

---

## 1. Project asset inventory

Before rendering:

- Locate approved script and/or voiceover-only script.
- Locate visual plan JSON.
- Count beats in the plan.
- Count generated frames.
- Check every expected frame exists in order.
- Validate images are real image files at the expected aspect/resolution.
- If frames are missing, generate the missing real frames before rendering.
- No placeholder/SVG/storyboard/collage frames in a YouTube-ready render.

Gate:

```text
PASS only if beat count == valid generated frame count.
```

---

## 2. Final-audio transcription

- Transcribe the exact final audio with Whisper word timestamps.
- Export all useful formats: `.json`, `.srt`, `.vtt`, `.txt`.
- Store them under project transcription/alignment folders.
- Copy final caption/transcript files into Vibe Zone.

Gate:

```text
PASS only if the JSON contains word-level timestamps and transcript duration matches audio duration.
```

---

## 3. Audio-truth alignment

- Align visual beats to final audio transcript tokens.
- Use the final audio as timing source, not visual-plan placeholders.
- Fail if plan/audio word drift is too high.
- Fail if beat-token alignment score is weak.
- Generate an audit JSON with:
  - beat count
  - caption count
  - plan words
  - audio words
  - word ratio
  - average beat alignment score
  - weak beat count
  - audio duration
  - max/avg frame duration

Gate:

```text
PASS only if alignment audit is clean and saved.
```

---

## 4. Full render

Create the production master from the final audio and validated frames.

Required editing direction unless overridden:

- 16:9 long-form render.
- Audio-truth beat durations.
- 3.5% slow zoom / gentle motion on still frames.
- Subtle varied transitions between beats.
- Audio included from the final provided file.
- Clean master includes a timed subtitle track when supported.

Gate:

```text
PASS only if master ffprobe shows video + audio and duration matches final audio.
```

---

## 5. Full Vibe Zone / browser-visible version

Soft subtitle tracks are not enough for Vibe Zone/browser/Telegram review.

Always create a full-length YouTube-ready review copy with **burned-in subtitles**.

Required:

- Full length, not a 1–2 minute preview.
- Burned captions visible in the actual pixels.
- Audio included.
- Reasonable review size/bitrate for playback.
- Copied into the Vibe Zone project `renders/` folder.

Gate:

```text
PASS only if the Vibe Zone render is full duration and captions are burned into the video.
```

---

## 6. Optional previews

Previews are allowed, but previews never replace the full Vibe Zone upload.

If making previews:

- Clearly name them as preview/review cuts.
- Burn captions if the preview will be sent through Telegram or played in browser.
- Keep full master and full burned-sub render as the primary deliverables.

Gate:

```text
Do not report “ready” based only on a preview.
```

---

## 7. Visual QA

For image-generated videos:

- Generate/contact-sheet or inspect chronological frame batches.
- Check the visuals progress with the actual script.
- Look for shuffled frames, wrong characters, random props, off-style images, duplicate-looking sequences, text/logo artifacts, or safety-compromise blandness.
- If visual meaning breaks, hold the render and fix frames before marking YouTube ready.

Gate:

```text
PASS only if visual progression is good enough for a real upload.
```

---

## 8. Vibe Zone publish

Copy into Vibe Zone:

- Full 1080p/production master.
- Full burned-sub Vibe/browser-ready render.
- Caption/transcript files.
- Render audit.
- Frame manifest / missing-frame report if applicable.
- Preview cuts if created.
- Thumbnail options if available.

Run:

```bash
cd /root/.openclaw/workspace/vibe-zone
npm run build
```

If the API is relevant, verify `/api/state` sees the new files.

Gate:

```text
PASS only if Vibe Zone build passes and the full burned-sub render is present in the project lane.
```

---

## 9. Final verification before telling Masala

Run `ffprobe` on both:

1. Production master.
2. Full burned-sub Vibe Zone render.

Verify:

- Duration equals final audio/video length.
- Video stream exists.
- Audio stream exists.
- Subtitle track exists on clean master when intended.
- Burned-sub version has no dependency on soft subtitles.
- File exists under Vibe Zone.
- Build passed.

Final response must include:

- Whether it is truly full-length.
- Whether subtitles are burned in or soft only.
- Exact Vibe Zone path/media attachment for the full burned-sub version.
- Exact path for the clean master.
- Any blocker, if not complete.

---

## Completion definition

A run is complete only when this sentence is true:

> The final-audio-timed, full-length, visually QA’d, captioned, YouTube-ready render is uploaded to Vibe Zone, with a clean master preserved separately and all verification gates passed.

If that sentence is not true, do not say “ready.”
