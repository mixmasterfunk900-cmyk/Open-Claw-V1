# YouTube Automation Niche Flow

Reusable long-form YouTube production flow with strict niche isolation.

## Master template

The universal production flow is saved at:

`templates/MASTER_YOUTUBE_AUTOMATION_FLOW.md`

Master gates:

1. SOP/script gate — always use the specified SOP documents for the active niche
2. Visual-plan gate
3. Real image-gen frame gate
4. Final audio + Whisper word timestamps
5. Audio-truth render
6. Contact-sheet visual progression QA
7. Clean review-slot gate
8. Thumbnail gate
9. Telegram 1-min review cut
10. Archive/debug hygiene

## Niches

Each niche gets its own isolated folder under `niches/`.

Current folders:

- `niches/dog-psychology-automation/`
- `niches/the-experiment-where/`

## Critical rule

Do not mix SOPs across niches.

Dog Psychology SOPs stay in Dog Psychology automation. The Experiment Where SOPs stay in The Experiment Where automation. Shared workflow rules belong only in the master template.
