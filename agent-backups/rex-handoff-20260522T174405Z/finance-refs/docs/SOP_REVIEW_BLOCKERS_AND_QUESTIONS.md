# Laura & John's Money Gap SOP v2 — Review Status

Status: initial blocker questions answered by Masala on 2026-05-20. The Finance lane is ready for a first topic/pilot run using the SOP.

## Locked answers

1. **Image model** — Use the GPT/frontier image model linked to OpenClaw for generation. Do not treat a cheaper fallback as equivalent unless a failure/debug path requires it and logs it.
2. **Upload destination** — Upload/add completed QA-passed Finance videos to Vibe Zone automatically.
3. **Drive** — Archive to the allowed Drive folder when possible: `https://drive.google.com/drive/folders/10hjKYn8QrwM2K9w1rs1vdP1VFdmFwt-y?usp=sharing`. If issues occur, fall back to local saves.
4. **Voice lock** — Auto-lock the first passing Kokoro John/Laura voice pair. No pre-sample checkpoint required.
5. **Length** — Minimum length is 8 minutes. Anything over 8 minutes is acceptable if QA passes.

## Still-conservative safety interpretation

- Vibe Zone upload/addition is allowed automatically.
- Drive archive is allowed automatically with local fallback.
- Public YouTube publishing is not enabled by this decision lock. If YouTube upload is later requested, default privacy remains `private` unless channel config says otherwise.

## Execution additions retained

1. Contact sheet QA across the full render before Vibe Zone addition.
2. Sample-frame visual QA for every major section and failed-risk scene.
3. ffprobe gate for codec, duration, audio stream, fps, and resolution.
4. Subtitle coverage gate: no large silent subtitle gaps while narration is active.
5. AI image artifact/watermark/text scan with regenerate-only-failed-scenes policy.
6. Final local `VIDEO_READY_LOCAL` status even if Drive is blocked.
7. Vibe Zone Finance tab should be view-first with explicit download buttons only.
