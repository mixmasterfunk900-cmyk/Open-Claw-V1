# Task Queue

## Immediate executable tasks
1. [completed] Raise and restyle captions into YouTube Shorts-safe zone.
2. [completed] Generate punchy 1–2 word caption ASS file and re-render playable clips.
3. [pending] Get a complete source video: support resume/re-upload and verify decodable duration before transcription.
4. [pending] Add facecam crop / 50-50 layout render preset.
5. [pending] Add review actions for clip status: idea → draft → reviewed → exported.

## Medium-priority improvements
1. [pending] Improve semantic clip dedupe to avoid repeated hooks/themes.
2. [pending] Add subtitle presets: bold centre, TikTok-safe lower third, high-contrast accessibility.
3. [pending] Add upload progress persistence/server-side status for large browser uploads.
4. [pending] Add a “render selected clip” button from Clip Factory.

## Long-term architectural improvement
1. [pending] Move persistence from one JSON file to SQLite once clip/render volume grows.
