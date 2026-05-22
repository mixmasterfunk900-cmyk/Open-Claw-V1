# Master YouTube Automation Flow

This is the master production template. It applies to every niche.

The SOP itself is **not** universal. Each niche must provide its own SOP documents, and the automation must always use the SOP documents for the active niche only.

## Master gates

1. **SOP/script gate** — always use the specified SOP documents for the active niche.
2. **Visual-plan gate**
3. **Real image-gen frame gate**
4. **Final audio + Whisper word timestamps**
5. **Audio-truth render**
6. **Contact-sheet visual progression QA**
7. **Clean review-slot gate**
8. **Thumbnail gate**
9. **Telegram 1-min review cut**
10. **Archive/debug hygiene**

## Hard isolation rule

Never mix SOPs between niches.

A project belongs to exactly one niche folder. It may only read:

- the master flow template
- that niche's SOP documents
- that niche's style/thumbnails/research docs
- that niche's project assets

It must not read or reuse another niche's SOP unless Masala explicitly says to migrate or compare them.

## Master/Review caption rule

- Production master: clean video + audio + timed subtitle track.
- Telegram review cut: visible burned-in captions are allowed/expected because Telegram may hide soft subtitle tracks.

## Completion definition

A video is only complete when every gate passes and the review lane contains only the current approved/review-ready assets. Debug, failed, storyboard, old, or visually failed outputs must be archived outside review lanes.
