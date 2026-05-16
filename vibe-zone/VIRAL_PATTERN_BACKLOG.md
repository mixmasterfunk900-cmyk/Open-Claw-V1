# Vibe Zone Viral Pattern Backlog

Guardrails: public/login-free research only; no cookies, no posting, no private data. Keep entries as implementation-ready Clip Factory ideas.

## 2026-05-13 — Proof-first 3-part hook

- **Pattern:** First 1–3s should make the same promise three ways: visual proof/result on screen, a 3–7 word top hook card, and a 5–10 word spoken/verbal hook. For AI/live-coding clips, show the payoff before the setup: rendered clip, green terminal success, dashboard queue, or visible product output; then cut into the stream explanation.
- **Evidence:** vidIQ’s 2026 Shorts hook guide says viewers decide in the first 1–3s, recommends one idea only, a specific promise, instant context, and synchronized visual + text + verbal hooks. Public short-form trend summaries also keep pointing to outcome-based hooks, readable captions, rapid cuts, and animated captions as retention staples.
- **Why it matters for Vibe Zone:** Coding streams often start with context/build-up. A proof-first opening makes the clip legible while muted and gives non-coders a reason to stay before the technical explanation starts.
- **Clip Factory implementation suggestion:** Add a `proofFirstHook` preset: 0.0–0.7s freeze/zoom on payoff frame, 0.7–2.0s top card with one of `IT BUILT WHILE I SLEPT`, `THE AGENT SHIPPED THIS`, `I BROKE THE CLIP MACHINE`, then jump cut to facecam/screen. Keep bottom captions below the facecam safe zone and highlight only 1–2 key words per caption beat.
- **Status:** backlog candidate; safe/local only.

## 2026-05-14 — Mistake-first “debug the build” hook

- **Pattern:** Open with a blunt mistake/problem frame instead of generic context: top card names the failure (`I BROKE THE CLIP MACHINE`, `THIS AGENT MISSED THE FACE`, `ONE BAD CROP RUINED IT`), first cut shows the visible bug/result, then jump into the live-coding fix. Keep captions as 1–3 word or short-phrase beats in the lower-middle third, white/yellow with black outline, with only the failure/result word highlighted.
- **Evidence:** vidIQ’s 2026 Shorts hook guide emphasizes first-3-second hooks built from one specific promise/mistake plus aligned visual + text + verbal cues. BlitzCut’s 2026 TikTok caption guide recommends high-contrast word-by-word/short-phrase captions in the lower-middle third for readability and retention.
- **Why it matters for Vibe Zone:** AI/live-coding clips become easier for non-coders when framed as a visible bug → fix → payoff mini-story. “Mistake” language also gives Masala’s stream moments a natural pattern interrupt without faking drama.
- **Clip Factory implementation suggestion:** Add a `debugMistakeHook` preset that scans/accepts a clip-level `failurePhrase` and renders: 0.0–0.5s zoom/freeze on bug or failed output, 0.5–1.8s top hook card, 1.8s hard cut to facecam/screen fix, captions at lower-middle safe zone with yellow highlight on one problem word.
- **Status:** backlog candidate; safe/local only.

## 2026-05-14 — Code-output receipt strip

- **Pattern:** For AI/live-coding clips, keep a small persistent “receipt” view on screen while the facecam/narration drives the story: code/editor on one side, terminal/app output or generated asset on the other, with quick zooms only when a key proof line appears. Pair it with short center-third captions and a top hook card so muted viewers can understand both the claim and the evidence without waiting for context.
- **Evidence:** daily.dev’s 2026 developer-tutorial editing guide recommends effective screen recording, smart/jump cuts, text overlays/annotations, picture-in-picture demos, and keyboard shortcut displays. Public Shorts caption guidance from Opus emphasizes sound-off viewing, center-third safe-zone captions, high contrast, and 32–42 character caption lines.
- **Why it matters for Vibe Zone:** Build-in-public clips often say “the agent did it” before viewers can see proof. A code-output receipt strip makes the transformation legible instantly: prompt/code → terminal/app/clip result → creator reaction.
- **Clip Factory implementation suggestion:** Add a `receiptStrip` layout preset: 65% main proof panel, 25–30% facecam/PiP, 5–10% status/keystroke strip; auto-pin the most visually useful terminal/app frame for the first 2s, then hard-cut/zoom to the exact success line or generated clip thumbnail. Keep captions in the center third, max two lines, and avoid bottom UI/facecam overlap.
- **Status:** backlog candidate; safe/local only.

## 2026-05-15 — Thin progress “completion nudge” rail

- **Pattern:** Add a very thin, always-visible progress rail to short-form clips (bottom edge or safe outer frame) so viewers can instantly tell the clip is short and feel pulled toward completion. Keep it subtle: 3–6px high, house accent color, no labels, outside caption/facecam zones; pair with existing fast jump cuts and lower-middle captions.
- **Evidence:** VEED’s public progress-bar guide frames progress bars as a way to show total video length and encourage viewers to watch through to the end across social platforms. Typito’s public guide similarly notes progress bars are common in instructional/social videos, give viewers a sense of how much is left, and can reduce mid-video drop-off. Current 2026 caption guidance from Opus also reinforces sound-off viewing and retention-first caption readability.
- **Why it matters for Vibe Zone:** AI/live-coding clips can feel dense even when they are under 30s. A progress rail gives non-coders a low-friction “I can finish this” cue while the hook card, proof frame, and captions do the actual story work.
- **Clip Factory implementation suggestion:** Add `progressRail: true` to house presets: draw a 4px Gotham/green-to-yellow accent bar along the bottom safe edge, advancing linearly for the full render duration. For clips under 18s, optionally add 3 tiny tick marks at hook/build/payoff moments; never overlap captions, privacy crops, or platform UI safe zones.
- **Status:** backlog candidate; safe/local only.
