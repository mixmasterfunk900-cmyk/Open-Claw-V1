# Visual QA failure — Dog Staring

Date: 2026-05-19

Audio/caption timing passed, but owner review and contact-sheet QA found the visual beats do not reliably match the script order. The existing approved frames read like a shuffled pool of dog-staring scenes: inconsistent owner/dog identity, unexplained props/characters, day/night jumps, and repeated non-progressive poses.

Status: rebuild visual beat layer before calling Dog Staring perfect/review-ready.

Required rebuild:
- Use `visual_plan_v2_132.json` beat order.
- Generate/approve frames beat-by-beat from script context, not generic alternates.
- Maintain consistent golden retriever and primary owner identity unless narration explicitly changes.
- No random babies, men, wolf/husky swaps, vet clinics, crowds, puzzle boards, laundry, robot vacuums, or dramatic nighttime scenes unless the exact beat narration calls for it.
- After generating, create contact sheets and perform visual progression QA before rendering.
- Then render with clean master + mov_text subtitle track and Telegram-visible 1-minute review cut.
