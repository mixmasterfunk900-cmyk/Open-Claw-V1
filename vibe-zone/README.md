# Vibe Zone

Vibe Zone is Masala's local-first livestream/product control room. It now has a React frontend plus a tiny local Node API that persists workflow data to JSON.

The product direction is **quantity-first creator operations**: produce as many clips as possible, let TikTok performance filter winners, move winners to YouTube, then turn proven YouTube winners into frequent X/Twitter reports/posts in Masala's tone.

## What works now

- Dashboard with real local state counts.
- YouTube Scanner using public RSS discovery for `@ModernResponsibility` — no login/API key.
- Clip Factory that imports/pastes transcripts and generates many overlapping clip candidates.
- Social Dashboard with draft-only TikTok → YouTube → X/Twitter funnel copy.
- Live Chat Co-Pilot that simulates natural chat pop-ups while clearly labelling them as AI practice chat.
- Optional Ollama local-model fallback for rough chat drafts, classifications, scoring helpers, and API/rate-limit fallback work.
- Rex Activity / Jobs backed by persisted local job history.
- Settings with channel URL, stream-safe guardrails, thumbnail direction, and productization notes.

## Quick start

```bash
cd vibe-zone
npm install
npm run dev:full
```

Open: <http://127.0.0.1:5173>

`npm run dev:full` starts:

- Vite frontend on `127.0.0.1:5173`
- Local API on `127.0.0.1:8787`

For API/static production smoke testing:

```bash
npm run build
npm run api
# then open http://127.0.0.1:8787
```

## Data

Local state is stored in:

```text
data/vibe-zone.json
```

This file is intentionally ignored by git. It can contain stream notes/transcripts, so treat it as private working data.

## Viewing from your own machine

Because this runs on a VPS, `localhost` means “inside the VPS”, not your laptop. Safest option is an SSH tunnel:

```bash
ssh -L 5173:127.0.0.1:5173 root@YOUR_VPS_IP
```

Then open this on your machine:

<http://localhost:5173>

Do not expose the dev server publicly unless you intentionally accept that anyone with the URL/IP could view the dashboard.

## Verification commands

```bash
npm run lint
npm run build
node --check server/server.mjs
```

## Architecture

- `src/App.tsx` contains the current UI, state wiring, and page components.
- `src/App.css` contains the dashboard layout and responsive UI styling.
- `server/server.mjs` contains the local JSON API, YouTube RSS scanner, transcript clip scorer, and AI-practice-chat simulator.
- `scripts/dev-full.mjs` runs frontend and API together for local development.

## Local model fallback

Ollama is expected locally on the VPS when available. Current design uses it opportunistically, not exclusively.

Preferred models installed:

- `qwen2.5:1.5b-instruct` — rough drafts, chat co-pilot simulation, classification/scoring notes.
- `llama3.2:1b` — tiny fallback work when speed matters.

The app currently calls Ollama for practice-chat drafts if `http://127.0.0.1:11434` is reachable, then falls back to deterministic templates if it is offline or slow.

## Stream-safe rules

- No auto-posting.
- No external login flows.
- No secrets displayed or committed.
- AI practice chat must stay labelled as simulation, not fake audience activity.
- Thumbnails using Masala's face wait until reference images are provided and approved.

## Next steps

- Add optional local transcription/import pipeline from video/audio files.
- Add performance fields for TikTok/YouTube/X and promote clips through the funnel.
- Learn Masala's X/Twitter tone from transcripts over time.
- Add thumbnail concept board: hyper-realistic face-led style, GothamChess-inspired contrast/composition.
- Split UI into smaller components once the workflow stabilizes.
