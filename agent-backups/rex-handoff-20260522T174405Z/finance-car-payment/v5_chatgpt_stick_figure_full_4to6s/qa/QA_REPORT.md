# QA Report — V5 ChatGPT Stick-Figure Full Rebuild (rerendered)

## Summary
PASS for internal review/sendable QA.

- Full review MP4: `renders/car-payment-trap_v5_stick_full_review_720p.mp4`
- Telegram 480p copy: `renders/car-payment-trap_v5_stick_full_telegram_480p.mp4`
- Duration: 681.76s (~11:21.8), matching source audio 681.82s
- Video: 1280x720, 30 fps, codec h264
- Audio: aac, 24000 Hz, reused original `audio/voiceover_full.mp3`
- Telegram copy: 854x480, 681.77s

## Style / provenance gate
PASS.

- `STYLE_LOCK.md` kept from approved proof.
- Frames are cream/white background, black marker stick figures, minimal teal/yellow/red accents, recurring John/Laura cohosts.
- Frames 001–012 are reused from the Masala-approved 60s V5 proof.
- Frames 013–137 are OpenAI/ChatGPT image-generation frames; no local placeholder/fallback frames were used.
- Prior rejected generic/editorial render was not used or marked upload-ready.

## Cadence gate
PASS.

- Beat count: 137 visual beats.
- Cadence: target 5.0s; final tail beat is shorter to match audio.
- Render includes subtle zoom/pan motion per still frame.

## Render gate
PASS.

- Full review MP4 and Telegram 480p MP4 ffprobe successfully.
- Frame integrity report has 137/137 non-empty PNGs.
- Blackdetect/silencedetect logs regenerated under `qa/`.
- Contact sheet: `proof/v5_full_rerender_sample_contact_sheet.jpg`.
