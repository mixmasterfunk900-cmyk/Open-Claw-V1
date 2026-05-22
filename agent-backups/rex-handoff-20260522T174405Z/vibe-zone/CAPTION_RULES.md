# Vibe Zone Caption Rules

These are production rules, not suggestions.

## Short-form

Shorts use **one-word flashing captions**.

Rules:

- exactly one word per caption event
- fixed visual lane; no vertical bouncing
- no overlapping events
- fast timing, usually 0.18s–0.62s per word
- consistent font family: `DejaVu Sans` unless Masala approves a trial font
- white text, heavy black outline, no blue cards/boxes as caption backgrounds
- captions must clear Shorts/TikTok UI safe zones

## Long-form

Long-form uses **Netflix-style single-line phrase captions**.

Rules:

- one fixed bottom lane
- one line only
- no overlapping events
- no vertical jumping
- max 6–7 words per event
- max ~42–46 readable weighted characters per event
- minimum duration about 0.65s
- maximum duration about 2.8s
- consistent font family: `DejaVu Sans` unless Masala approves a trial font
- no intro title card unless explicitly approved
- lower-thirds must not collide with captions

## QA gate

Caption generation must produce a QA report and fail if:

- no caption events are generated
- any short-form event has more than one word
- any event overlaps the next event
- any event has a line break
- any event exceeds word/character limits
- any event duration is too short

Reference repo inspected: `Huanshere/VideoLingo`. Useful concepts: WhisperX word-level alignment, single-line subtitle standard, readable subtitle splitting, timestamp alignment. Vibe Zone reimplements the needed behavior locally instead of wiring in the full app.
