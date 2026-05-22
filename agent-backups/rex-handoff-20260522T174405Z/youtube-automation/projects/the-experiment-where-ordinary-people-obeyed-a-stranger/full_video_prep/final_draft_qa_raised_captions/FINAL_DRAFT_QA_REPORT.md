# Final Draft QA Report — Raised Captions

Render: `/root/.openclaw/workspace/youtube-automation/projects/the-experiment-where-ordinary-people-obeyed-a-stranger/renders/ordinary-people-obeyed-a-stranger-final-draft-clean-regenerated-burned-captions.mp4`

Vibe Zone copy: `/root/.openclaw/workspace/vibe-zone/media/practice/youtube-automation/the-experiment-where/the-experiment-where-ordinary-people-obeyed-a-stranger/renders/ordinary-people-obeyed-a-stranger-final-draft-site-visible-captions.mp4`

Proof sheet: `/root/.openclaw/workspace/youtube-automation/projects/the-experiment-where-ordinary-people-obeyed-a-stranger/full_video_prep/final_draft_qa_raised_captions/final-draft-proof-sheet-raised-captions.jpg`

## Render facts

- Duration: `827.300000` seconds
- Streams: video `h264` 1920x1080, audio `aac` mono 44100 Hz
- Captions: burned into video, no subtitle stream required
- Visuals: regenerated clean single-frame beat images
- Motion: subtle per-beat zoom/fade motion retained from audio-truth render

## QA verdict

PASS.

Image QA checked the proof sheet for:

- one full-screen image per sampled frame
- no 2x2 panels/collages/split screens/contact sheets inside frames
- no obvious badly cropped heads/headless bodies
- burned captions visible and high enough above browser/player controls

Notes: the proof sheet itself has unused black grid slots at the bottom; those are sheet layout only, not video content.

## Build gate

`npm run build` passed in `/root/.openclaw/workspace/vibe-zone`.
