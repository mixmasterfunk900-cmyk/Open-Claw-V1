# 05 — Voice, Audio & Timing

## Must do

- Use Kokoro TTS.
- Auto-lock first passing John/Laura voice pair.
- John is default narrator; Laura is 5–15% of spoken lines.
- Generate full mixed audio and segment metadata.
- Use actual final audio duration as timing truth.
- Generate word-level timing via TTS metadata or Whisper.

## Required files

- `${VIDEO_DIR}/voiceover_script_clean.md`
- `${AUDIO_DIR}/voiceover_full.wav`
- `${AUDIO_DIR}/voiceover_full.mp3`
- `${AUDIO_DIR}/dialogue_segments.json`
- `${AUDIO_DIR}/tts_timing.json` or `${VIDEO_DIR}/transcription/word_timestamps.json`
- `${PROJECT_ROOT}/config/voice_lock.json`
- `${VIDEO_DIR}/voice_lock_used.json`

## Pass criteria

- Audio duration >= 8 minutes.
- No clipping/hard pops.
- John/Laura volumes balanced.
- Word timestamps available before image beat manifest.
