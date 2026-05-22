# 12 — Render Assembly

## Must do

- Use Node.js render script + FFmpeg.
- Render 1920x1080, 30fps, H.264, AAC.
- Apply actual motion effects and transitions, not just metadata.
- Match video duration to audio duration ± 0.5 seconds.
- Preserve clean master and burned-caption review copy.

## Required files

- `${VIDEO_DIR}/renders/${VideoSlug}_clean_master.mp4`
- `${VIDEO_DIR}/renders/${VideoSlug}_burned_captions_review.mp4`
- `${VIDEO_DIR}/render_manifest.json`
- `${VIDEO_DIR}/logs/render.log`

## Hard fail conditions

- Render has static slideshow with no motion when editing plan requires motion.
- Duration mismatch > 0.5s.
- Wrong resolution/codec/fps.
- Missing clean master or review copy.
