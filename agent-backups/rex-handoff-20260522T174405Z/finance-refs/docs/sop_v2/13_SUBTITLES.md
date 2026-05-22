# 13 — Subtitles

This gate fixes V1's boxed/oversized subtitle failure.

## Required style

- One line only.
- White text.
- Thin black outline/stroke.
- No black box/background/highlight.
- No two-line blocks.
- Smaller readable long-form size.
- Fixed safe lower position, not covering key visuals.
- On-beat timing from word-level timestamps.

## Recommended ASS baseline at 1920x1080

- Font: Arial Black or Montserrat ExtraBold.
- Font size: 42–48.
- Primary colour: white.
- Outline: 2–3px black.
- BorderStyle: outline only, never box.
- BackColour: transparent.
- Alignment: lower centre.

## Required files

- `${VIDEO_DIR}/subtitles.srt`
- `${VIDEO_DIR}/subtitles.ass`
- `${VIDEO_DIR}/qa/subtitle_style_report.md`
- `${VIDEO_DIR}/proof/subtitle_style_proof_sheet.jpg`

## Hard fail conditions

- Black box/highlight behind subtitles.
- Font too large and dominates frame.
- More than one line.
- Subtitle gaps while voice is active.
- Subtitle appears off-beat.

## Pass criteria

`SUBTITLE_STYLE_QA_PASS` must be true before Vibe Zone.
