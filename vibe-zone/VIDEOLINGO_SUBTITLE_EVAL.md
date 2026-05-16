# VideoLingo Evaluation for Vibe Zone Subtitles

Repo: `https://github.com/Huanshere/VideoLingo`  
Checked: 2026-05-13 UTC  
Verdict: **yes, this is much more useful for our subtitle problem than MoneyPrinterV2.**

## Why it helps

VideoLingo is specifically about subtitle quality: recognition, word-level alignment, NLP subtitle splitting, single-line subtitles, translation, and dubbing.

The important part for Vibe Zone is not the full translation/dubbing app. It is the subtitle pipeline ideas:

1. **WhisperX word-level alignment**
2. **NLP-based subtitle segmentation**
3. **single-line subtitles only**
4. **timestamp alignment from word chunks**
5. **burn-in with fixed subtitle style**

That directly matches Masala’s feedback:

- captions must not overlap
- captions must stay on the same line
- captions must not jump up and down
- captions must be synced
- long-form intros should not use retention-killing title cards

## License

VideoLingo is Apache-2.0, which is much easier to work with than AGPL. We can safely study and potentially reuse ideas, and maybe small code pieces if needed with attribution. Still, best immediate path is to reimplement only the needed subtitle normalizer inside Vibe Zone.

## Useful files inspected

- `core/_2_asr.py` — ASR pipeline using WhisperX, optional Demucs vocal separation.
- `core/_5_split_sub.py` — subtitle splitting by weighted length and NLP/LLM alignment.
- `core/_6_gen_sub.py` — timestamp alignment and SRT generation.
- `core/_7_sub_into_vid.py` — ffmpeg subtitle burn-in style.

## Strongest ideas to borrow

### 1. Single-line subtitles only

VideoLingo explicitly positions itself around Netflix-style single-line subtitles. This is exactly what Masala asked for.

Vibe Zone rule:

- one fixed subtitle lane
- one phrase per event
- no two-line captions unless explicitly approved
- no bouncing between vertical positions
- no caption overlap

### 2. Subtitle max-length splitting

VideoLingo has a `calc_len` and `MAX_SUB_LENGTH` approach. For Vibe Zone, implement deterministic splitting:

- max 32 to 42 characters for long-form captions
- max 5 to 7 words per caption
- minimum duration 0.65 seconds
- maximum duration 2.4 seconds
- split at punctuation first, then connectors, then word count

### 3. Word-level alignment

VideoLingo uses WhisperX for alignment. Vibe Zone currently has Whisper segment timestamps, but not reliable word timestamps from the current transcript. That is why our caption sync can drift.

Best next improvement:

- use WhisperX or faster-whisper with word timestamps for the selected final edit
- map words into fixed-line caption events
- burn with ASS/ffmpeg

### 4. Vocal separation for noisy streams

VideoLingo can run Demucs before ASR. Useful later if stream music/background audio hurts transcription.

Not needed immediately unless transcripts are bad.

### 5. SRT/ASS generation as a separate module

VideoLingo separates subtitle generation from burn-in. Vibe Zone should do the same:

- `caption-normalizer` creates clean ASS/SRT
- renderer only burns the caption file
- QA checks the caption file before rendering

## What not to adopt

- Full Streamlit app
- Translation/dubbing stack
- heavy API-provider abstraction
- YouTube downloader pipeline
- multi-language terminology workflow
- full dependency set unless we explicitly test it in an isolated env

## Proposed Vibe Zone implementation

Add a local module/script:

`tools/caption-normalizer.mjs` or `scripts/caption-normalizer.mjs`

Inputs:

- transcript JSON/VTT/SRT
- selected beat timing map
- output video dimensions
- caption style preset

Outputs:

- `.ass` fixed-lane caption file
- `.srt` plain subtitle file
- JSON QA report

Rules:

- fixed alignment bottom center
- one line only
- max chars per event
- max words per event
- no overlapping event times
- enforce small gaps between events
- no movement between lanes
- optional collision safe-zone based on lower-thirds

QA report should fail if:

- any event overlaps the next
- any event exceeds max chars
- any event has line break
- any event duration is too short or too long
- captions start before the video starts
- captions continue past the video end
- caption lane conflicts with known lower-third region

## Immediate recommendation

Yes, use VideoLingo as the reference for subtitles.

Do **not** wire in the whole repo tonight. The fastest useful move is:

1. Build our own caption normalizer now.
2. Re-render the long-form from raw beats or current base without title-card intro.
3. Remove/reduce lower-third bars so captions have a clean lane.
4. Use fixed single-line captions generated from normalized transcript chunks.
5. Later test WhisperX word alignment in an isolated env for better sync.

## Practical verdict

MoneyPrinterV2 is useful for automation architecture.

VideoLingo is useful for subtitle quality.

For Masala’s current problem, VideoLingo is the better repo.
