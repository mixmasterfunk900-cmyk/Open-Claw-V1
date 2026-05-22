# Dog Content Visual + Thumbnail Style Bible

This is the locked visual SOP for Dog Psychology Automation. Do not generate or approve Dog Content frames or thumbnails that drift from this file.

## Core image style
- YouTube 16:9 only.
- Premium original hand-drawn educational explainer.
- Warm cream paper texture background.
- Charcoal/graphite linework.
- Soft watercolor grain, gentle muted palette.
- Cozy grounded home/life scenes unless the script explicitly calls for another setting.
- Calm educational composition, not chaotic action/comic/fantasy/VFX.

## Locked recurring characters
- Dog: consistent golden dog / beagle-like family dog identity across the full video.
- Owner: consistent adult owner identity across the full video; default wardrobe is terracotta/coral sweater.
- Do not randomly switch owner gender, age, hair, clothing, or relationship to the dog.
- Do not randomly change dog breed, markings, size, or age.

## Hard negatives
- No contact sheets.
- No 2x2 grids.
- No storyboard panels inside a single frame.
- No multi-option images used as video frames.
- No generated text inside frames.
- No logos, watermarks, arrows, infographic symbols, thought bubbles, labels, UI, or decorative typography inside story frames.
- No dog clothing unless the script explicitly calls for it.
- No random extra people, babies, vets, crowds, props, or settings unless the beat explicitly calls for them.
- No photorealistic stock-photo style.
- No loud YouTube-gaming/comic/action-poster style.

## Frame generation rule
Each beat must receive exactly one coherent 16:9 story frame. Never ask an image model to create several beats/options in one image. Batch API calls are allowed only if each returned image is still a single-frame image for one specific beat, and the manifest maps each beat to its exact prompt and source image.

## Thumbnail style
- Final thumbnail options must be single 16:9 thumbnails, not contact sheets or collages of options.
- Same hand-drawn warm paper/charcoal/watercolor style family as the video.
- Same consistent dog identity.
- Bold minimal headline text is allowed on thumbnails only, but it must be intentionally designed and readable. No gibberish/generated text.
- No random photorealistic thumbnails, tabloid props, incoherent dog identity, or multi-panel option sheets.

## Required QA before approval
A Dog Content project is not production-ready unless all are true:
1. `approved_frames/` has one frame per beat and no multi-panel/contact-sheet frames.
2. `frame_generation_manifest.json` records the provider/model and per-beat generation provenance.
3. `visual_sop_audit.json` exists and says `status: "pass"` after contact-sheet review against this style bible.
4. Thumbnail options pass `thumbnail_sop_audit.json` if thumbnails are present.
5. Contact-sheet progression reads like the script, not random alternate takes.
