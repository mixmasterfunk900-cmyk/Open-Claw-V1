# Vibe Zone

Vibe Zone is Masala's local-first livestream/product control room. It now has a React frontend plus a tiny local Node API that persists workflow data to JSON.

The product direction is **quantity-first creator operations**: produce as many clips as possible, let TikTok performance filter winners, move winners to YouTube, then turn proven YouTube winners into frequent X/Twitter reports/posts in Masala's tone.

## What works now

- Dashboard with real local state counts.
- YouTube Scanner using public RSS discovery for `@ModernResponsibility`, with a safe `yt-dlp --flat-playlist` public-tab fallback when RSS is unavailable — no login/API key.
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

## Media pipeline scaffold added

Masala's target is not just a dashboard: wake up to clips ready to review/upload. Current concrete progress:

- **YouTube extraction architecture:** Media Pipeline page stores planned `yt-dlp` jobs for public video/live replay URLs.
- **Transcript workflow:** planned local Whisper command uses `/root/.openclaw/workspace/.venv-transcribe/bin/whisper` and outputs `.txt`/`.srt` under `media/transcripts`.
- **Local companion ingest:** when VPS YouTube extraction is blocked, Vibe Zone can import the newest stream's local `media/transcripts/<videoId>.txt`, generate clip candidates, and check whether the matching `.mp4`/`.srt` are ready for rendering.
- **Clip rendering scaffold:** planned `ffmpeg` commands for both 9:16 Shorts and 16:9 longer-form clips, with subtitle burn-in placeholders.
- **Morning output:** Clip Factory shows upload-ready draft placeholders with titles, captions, hashtags, platform/status, subtitles planned, and short-form framing.
- **Viral Hunter MVP:** generates hook leads from public YouTube RSS titles and existing clip candidates.
- **Checker visibility:** Rex Jobs and Media Pipeline show every media job with status, detail, timestamp, and exact command.

Known blockers on this VPS right now:

- `ffmpeg` is installed.
- Project-local `yt-dlp` is installed at `.venv-media/bin/yt-dlp`. The scanner can use public channel tabs if RSS fails, and the media pipeline targets the newest public Streams-tab item first.
- Direct VPS extraction can still hit YouTube bot-checks. Vibe Zone preflights extraction and records that blocker instead of pretending the job is ready.
- A custom downloader wrapper now exists at `scripts/vibe-download.mjs`. It tries several safe server-side strategies in order: HLS/web_safari for live streams, mweb PO-token-ready route, embedded public route, then standard yt-dlp. If all fail with bot-check output, the issue is treated as VPS/cloud IP reputation and the local companion/import flow remains the robust fallback.
- Whisper exists in the local transcription venv and probes successfully. Transcribe/render jobs now stay `needs-review` until the referenced local media/SRT files actually exist.
- Safe fallback remains the local companion flow: download/transcribe on Masala's own machine without storing cookies here, then import transcript/SRT/video into Vibe Zone.

## Competitor notes: Opus Clip gap check

Opus Clip positions around long-video-to-viral-shorts, one-click publishing, AI understanding of arbitrary video genres, auto-reframing/object tracking, brand templates, team workspaces, workflow/API automation, captions, and fast editing control.

Vibe Zone's opportunity is different:

- Local-first/private by default for livestream builders.
- Transparent AI practice chat alongside clipping, not fake engagement.
- Quantity-first clip factory tied to Masala's TikTok → YouTube → X reporting funnel.
- Inspectable agent/job history so stream viewers can see what Rex did and what blocked.
- Cheaper/local fallback path with yt-dlp, Whisper, ffmpeg, and Ollama before paid APIs.

Next feature gaps to close:

1. Install/integrate `yt-dlp` and run actual public replay extraction.
2. Run Whisper end-to-end from a downloaded/local companion file; auto-import generated transcript text now has a first pass via local ingest.
3. Execute ffmpeg render jobs and attach output file paths to clip rows.
4. Add auto-reframe/crop controls and subtitle style presets.
5. Add upload checklist/export bundle per platform, still manual approval only.

## Safe YouTube extraction tooling update

A local project venv now holds the reputable open-source `yt-dlp` package:

```text
.venv-media/bin/yt-dlp
```

Policy for Vibe Zone:

- Use public URLs/RSS first.
- Use `yt-dlp` without cookies by default.
- Do not ask for or store browser cookies unless Masala separately confirms a specific private/member-only use case.
- If a VPS download fails, support local companion flow: download/transcribe on Masala's own machine, then upload/import video, transcript, and SRT files into Vibe Zone/HQ.
- Prefer local Whisper and ffmpeg before paid APIs.
- Optional reputable APIs can be considered only when they need no secrets/payments for the current workflow.

### Local companion fallback

If YouTube blocks VPS extraction, keep scope tight: process only Masala's newest Streams-tab replay first. Current target from the latest scan:

```text
https://www.youtube.com/watch?v=dejKxLu_iM0
```

On Masala's own machine, using reputable/open-source tools only:

```bash
yt-dlp --no-playlist -f "bv*+ba/b" --merge-output-format mp4 -o "media/downloads/%(id)s.%(ext)s" "https://www.youtube.com/watch?v=dejKxLu_iM0"
whisper "media/downloads/dejKxLu_iM0.mp4" --model base --language en --output_format all --output_dir media/transcripts
```

Then import `media/transcripts/dejKxLu_iM0.txt` into Clip Factory (and `dejKxLu_iM0.srt` once upload/render endpoints are added). Let Vibe Zone generate clip rows, captions, hashtags, and ffmpeg render commands. Do not process older videos unless Masala asks.

