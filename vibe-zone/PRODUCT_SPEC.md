# Vibe Zone / HQ Product Spec

## Vision

Vibe Zone is Masala's local-first livestream and creator-operations HQ. It turns live building into output: many clips, validated topics, social reports, transparent practice chat, studio feedback, Rex job visibility, and eventually a full multi-platform content operation.

The expanded north star is **Content HQ**: every livestream becomes viral clips, evergreen long-form, written posts/articles/newsletters, podcast/audio assets, community prompts, owned-audience funnels, monetized exclusives, and searchable archive material. See `CONTENT_HQ_MASTER_PLAN.md` for the full operating-system spec.

This can become a monthly product for upcoming streamers: a cheap/local cockpit that helps them convert live sessions into growth assets without buying a stack of SaaS too early.

## Core strategy

### Quantity-first clips

Produce as many viable clips as possible first. Do not over-filter at generation time.

1. **TikTok first:** ship lots of variants and let retention/comments/engagement identify winners.
2. **Winners to YouTube:** promote proven ideas into Shorts or longer YouTube videos.
3. **YouTube winners to X/Twitter:** convert validated ideas into frequent reports/posts in Masala's tone.

### Tone learning

Vibe Zone should generate X/Twitter reports from live transcripts and improve Masala-tone matching over time from approved transcript/post examples.

Current MVP: draft copy from clips only. Future: maintain a local tone profile from approved transcript excerpts and edited posts.

### Thumbnail direction

Use Masala's face only after reference images are provided and approved.

Style direction:

- Hyper-realistic.
- Strong facial expression / reaction.
- GothamChess-inspired contrast, clean composition, and simple promise text.
- No misleading or unapproved likeness use.

### Cheap/local model fallback

Ollama is available on the VPS with `qwen2.5:1.5b-instruct` and `llama3.2:1b`. Vibe Zone should use local models for rough drafts, chat co-pilot simulation, transcript classification/scoring, and fallback work when paid APIs/rate limits fail.

Do not rely on Ollama exclusively unless a given app path has been tested; always keep deterministic/local-template fallback for live reliability.

### Live Chat Co-Pilot

The Co-Pilot should simulate real chat messages appearing naturally, not just direct prompt buttons. It must remain transparent: every simulated message is labelled as AI practice chat / fictional viewer.

Preferred implementation path:

1. Free/cheap/local model where possible.
2. Deterministic local templates as fallback.
3. Read-only real chat ingest later, with clear separation between real chat and simulation.

### Rex Live Companion / Avatar

Future experience layer: because the product is built around streaming, Rex should eventually be a live stream-side presence — an avatar/overlay that watches jobs and context, reacts safely during streams, and may later become voice-first or hologram-style. Park this as a long-term design direction; do not let it derail the immediate ingest → clip → render → dispatch pipeline.

## Principles

- Cheap-first: do not buy SaaS before the workflow proves it needs cloud services.
- Local-first: local app, local JSON now, SQLite optional later.
- Stream-safe: avoid exposing private files, credentials, messages, or awkward personal data on screen.
- Human approval: drafts/schedules/export bundles are fine; external posts/logins/account actions require explicit approval unless Masala later changes policy.
- Platform-safe automation: create native variants and respect rate limits/rules; do not spam, impersonate, fake engagement, or evade enforcement.
- Transparent simulation: never fake audience activity.
- Funnel-aware: every asset should try to move viewers from algorithmic reach toward long-form and owned audience.

## Target users

- Masala: dad, full-time worker, coding/livestreaming builder.
- Rex: local AI co-builder that can surface jobs, drafts, and workflow state.
- Future customer: upcoming streamer who wants one affordable workflow HQ.

## Current MVP

Default creator channel: <https://www.youtube.com/@ModernResponsibility>

1. Dashboard: local workflow counts and demo path.
2. YouTube Scanner: scans public channel RSS without login/API key.
3. Clip Factory: paste/import transcript and generate quantity-first overlapping clip candidates.
4. Studio Feedback: stream-quality checklist.
5. Social Dashboard: TikTok → YouTube → X/Twitter funnel and draft-only report copy.
6. Live Chat Co-Pilot: transparent AI practice chat simulation.
7. Rex Activity / Jobs: persisted local API activity log.
8. Settings: channel URL, strategy, thumbnail direction, product angle, guardrails.

## Near-term roadmap

### Phase 1: Make it useful tonight

- [x] Local Node API.
- [x] JSON persistence.
- [x] Public YouTube RSS scan.
- [x] Transcript import/paste.
- [x] Quantity-first clip candidate scoring.
- [x] Transparent simulated chat messages.
- [x] Opportunistic Ollama draft path for practice chat, with template fallback.
- [x] Draft-only social funnel copy.

### Phase 2: Creator performance loop

- Add TikTok/YouTube/X performance fields per clip.
- Add clip state machine: generated → TikTok test → winner → YouTube candidate → X report.
- Add exports for captions, hashtags, and post copy.
- Add local tone-profile builder from approved Masala transcript/post examples.
- Add stronger transcript segmentation and deduping.

### Phase 3: Media workflow

- Optional local audio/video transcription pipeline.
- Optional local clip export integration.
- Thumbnail concept generator from approved face references.
- Thumbnail A/B board inspired by GothamChess-style layouts.

### Phase 4: Integrations, still cautious

- OBS scene/status read-only integration.
- Twitch/YouTube chat read-only ingest.
- GitHub issue/project sync for product tasks.
- Optional social platform APIs only for drafts, scheduling, analytics import, or after explicit approval.

### Phase 5: Content HQ distribution engine

- Dispatch Calendar for Shorts/TikTok/Reels/X/Reddit/Substack/Medium/Discord/Patreon/podcast assets.
- Platform-native render variants from clean masters.
- Copy Studio for posts, threads, newsletters, articles, show notes, pinned comments, and CTAs.
- Winner Radar for analytics-driven reposts, variants, compilations, and follow-up topics.
- Searchable archive for semantic/topic/quote reuse and future remix generation.

## Open questions

- Should persistent store stay JSON or move to SQLite once clip volume grows?
- Which TikTok metrics matter most for promotion: retention, completion, saves, comments, or shares?
- How many approved posts are needed before the local Masala tone profile feels accurate?
- What exact thumbnail reference set is approved for face-led images?

## Non-goals for now

- No auto-posting.
- No external login flows.
- No unlabelled fake chat.
- No use of Masala's face until references are provided and approved.
- No paid cloud dependency.

## Overnight media-pipeline target

Masala wants to open Vibe Zone and see tangible clips ready to review/upload. Empty states are failure states. If real YouTube extraction is blocked, the app should still show demo/sample clips from accessible transcripts and make the blocker explicit.

### Pipeline architecture

1. Scan channel/public replay URL.
2. Extract with `yt-dlp` into `media/downloads`.
3. Transcribe with local Whisper into `media/transcripts` as `.txt` + `.srt`.
4. Score transcript into many short candidates and longer-form candidates.
5. Render with `ffmpeg`:
   - Shorts: 9:16 crop/scale, subtitle burn-in.
   - Long-form: 16:9, subtitle burn-in.
6. Show upload-ready review queue: title, caption, hashtags, platform, status, output path, blocker if any.
7. Viral Hunter backfills ideas from RSS/video titles plus generated clip hooks.

### Current implementation status

- UI pages exist for Media Pipeline, Clip Factory, Viral Hunter, Rex Jobs.
- Server persists media jobs and viral finds to local JSON.
- Tool probes expose whether `yt-dlp`, Whisper, and `ffmpeg` are available.
- Render/extract/transcribe commands are generated and logged; execution is intentionally not automatic yet to avoid surprise large downloads or costs.
- Clip rows now present morning-review copy: title, caption, hashtags, status, platform and subtitle/render placeholders.

### Competitor-informed roadmap

Opus Clip proves the category expectation: automatic clipping, captions, reframing, publishing, team/workflow automation, templates, API. Vibe Zone should compete by becoming the local-first streamer HQ: transparent co-pilot, visible job logs, cheap/local pipeline, and Masala-tone reports.

Priority gaps versus Opus-style workflows:

1. **Actual media execution:** run the newest stream through download/import → Whisper transcript/SRT → ffmpeg short/long renders instead of stopping at planned commands.
2. **Moment ranking:** combine transcript hooks with audio/visual signals later; the current heuristic only sees text/title metadata.
3. **Subtitle styling:** add reusable caption presets, safe-area preview, and per-platform export settings.
4. **Review queue:** attach output file paths, blocker states, and manual upload checklist to every clip candidate.
5. **Live assistant differentiation:** keep transparent AI practice chat and Rex job history visible; this is Vibe Zone's streamer-HQ wedge, not just a clipping clone.
