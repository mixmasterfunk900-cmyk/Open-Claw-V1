# Fresh Full Run Protocol — Car Payment Trap

Status: READY_TO_RESTART_FULL_RUN_FRESH

Why the first detached full attempt failed:
- It did not fail because the script, SOP package, or visual plan was bad.
- The detached worker started the Qwen3 CPU audio phase and then killed its own long-running audio process after several minutes of no new output.
- No voice/image/render/Vibe artifacts were completed, so the project is still clean at script-only state.

Fresh-start rule:
- Keep the approved script package.
- Do not reuse any partial full-run artifacts.
- Run one SOP phase at a time with explicit checkpoint files and gate commands before advancing.

Phase order:
1. Voice/audio only: generate Qwen3 Ryan + Serena dialogue, concat, verify duration >=480s, write audio timing report.
2. Beat manifest only: derive 4–6s visual beats from verified audio duration, target ~5s.
3. Image generation only: one frontier/GPT full-frame scene per beat; no text, no grids, no collages, no multi-panel prompts.
4. Image QA/repair only: inspect generated frames and repair failures before rendering.
5. Render only: no subtitles, faint zoom/parallax, visible transitions/cuts.
6. Final QA only: verify video-stream duration, cadence, no subtitle layer, rendered-frame visual QA, compliance gate.
7. Vibe Zone copy only after all gates pass.

Operational guardrails:
- Never run the whole pipeline as one fragile command.
- For Qwen CPU, long silence is expected; do not treat silence as failure while CPU/RAM are active.
- Log every segment completion to disk so restart resumes at the next missing segment.
- If a dependency blocks a phase, stop with BLOCKED_DEPENDENCY instead of patching around it.
- Do not call review-ready unless the compliance checker passes and rendered-frame QA passes.
