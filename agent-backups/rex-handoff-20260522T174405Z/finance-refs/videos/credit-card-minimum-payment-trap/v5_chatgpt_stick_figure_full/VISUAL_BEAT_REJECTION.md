# V5 Full Run Visual Beat Rejection

Status: **REJECTED / NOT REVIEW-READY**

Reason: full run used 20 OpenAI/ChatGPT keyframes over ~671 seconds, which averages ~33.6 seconds per visual. This violates Masala's required frame/visual beat cadence.

## Correct hard requirement
- Visual frames/beats must change every **4–6 seconds**.
- Target average: ~5 seconds.
- For a 671 second runtime, expected frame count is roughly **112–168 frames**, not 20.
- Do not mark a full run ready unless `max_visual_beat_duration <= 6.0s`.

## Required next run
Build a corrected V5 full run with 4–6s beat manifest, GPT/OpenAI-generated final visual frames, approved voices, and dynamic slot-build subtitles.
