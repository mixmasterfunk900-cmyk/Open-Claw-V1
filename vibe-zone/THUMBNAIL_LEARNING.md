# Thumbnail Learning Notes

## Current permission / scope
- Masala approved generating thumbnail concepts in Vibe Zone.
- Masala will upload reference pictures to Google Drive for thumbnail use going forward.
- Keep this as concept/review-first unless Masala asks for final image generation/export.

## Target UX
- Thumbnail Lab should show a compact grid of thumbnail concepts, not oversized text cards.
- Keep about 50 concepts available at any time.
- Clicking a concept should open a large review view.
- Review actions: Like, Dislike, Mark used.
- Include a comment box for what Masala likes/dislikes so future concepts improve.

## Style target
- Face-led, hyper-realistic, GothamChess-inspired contrast/composition.
- 2–4 huge readable words.
- Clear emotional stakes at tiny thumbnail size.
- Avoid busy stream screenshots, subtitle clutter, and readable private project text.

## Feedback log
- Initial critique: first thumbnail proof was too screenshot-like; face too small/soft; text competed with subtitles; needs stronger face, emotion, contrast, and simpler hook.

## Approved reference images
- `media/thumbnails/sources/masala-thumbnail-source-01.png`
- `media/thumbnails/sources/masala-thumbnail-source-02.png`

Use these as Masala-approved thumbnail source/reference images for concepts and future generated thumbnail drafts. Keep thumbnails stream-safe: no readable private project text, credentials, or awkward background details.

## 2026-05-13 — First generated draft batch

Generated actual 16:9 YouTube thumbnail drafts using only approved local references:

- `/media/thumbnails/generated/stream-2-i-built-this-live-draft.png` — selected for `I BUILT THIS`; face-left, abstract AI windows-right, clean build-proof hook.
- `/media/thumbnails/generated/stream-2-ai-worked-draft.png` — selected for `AI WORKED`; face-right, red/teal agent-dashboard tension, very readable two-word hook.
- `/media/thumbnails/generated/stream-2-no-leaks-draft.png` — selected for `NO LEAKS`; face-left, lock/fake-code privacy stakes, no real UI text.
- `/media/thumbnails/generated/stream-2-clip-machine-draft-v2.png` — selected for `CLIP MACHINE`; face-led with glowing short-form cards. v1 is kept at `/media/thumbnails/generated/stream-2-clip-machine-draft.png` as an alternate, but v2 has better text placement. Next iteration should still give `MACHINE` more bottom/right padding.

QA notes:
- All selected drafts are face-led, high-contrast, 16:9, stream-safe, and readable at thumbnail size.
- Image generation was available via `openai/gpt-image-2`; no blocker.
- Text generation worked unusually well for this batch; continue explicitly constraining prompts to 2–3 words, block letters, black stroke, and safe margins.
- Avoid cramped lower-third typography on `CLIP MACHINE` variants; reserve more padding than the model seems to think is needed.
