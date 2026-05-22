# 08 — Image Beat Manifest

This gate fixes V1's weak beat planning.

## Must do

For every beat, define:

- beat id
- start timestamp
- end timestamp
- exact script sentence/line range
- scene objective
- character(s)
- setting
- visual action
- emotion
- data element if any
- unique prompt
- intended motion
- intended transition
- expected image path

## Cadence

- Default: one image every 4–6 seconds.
- No scene longer than 6 seconds unless explicitly marked `HOLD` with reason.
- Minimum scene duration 1.5 seconds unless intentional quick beat.

## Required files

- `${VIDEO_DIR}/scene_manifest.json`
- `${VIDEO_DIR}/image_beat_manifest.json`
- `${VIDEO_DIR}/scene_tagged_script.md`

## Hard fail conditions

- Missing beat for spoken section.
- Generic visual objective not tied to script.
- Beat count below cadence minimum.
