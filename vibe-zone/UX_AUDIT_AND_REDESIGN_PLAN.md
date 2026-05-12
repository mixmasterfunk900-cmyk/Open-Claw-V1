# UX Audit and Redesign Plan — Vibe Zone

Generated: 2026-05-12 06:48 UTC

## Executive summary

Vibe Zone already has the right product direction: a local-first creator operations HQ that turns Masala's livestreams into many reviewable clips, transparent job state, and manual dispatch assets. The current UI proves the workflow pieces exist, but the experience still reads as a feature demo rather than a modern creator/logistics control room.

The highest-impact redesign is not another cosmetic pass. The product needs a workflow-first information architecture and explicit asset states: **Ingest → Processing → Clip Review → Render Lab → Dispatch → Learning**. Every stream, transcript, clip, render, and export should have a visible status, blocker, next action, and owner-safe manual step.

## Product expectations to satisfy

From `PRODUCT_SPEC.md`, `UX_REDESIGN_BRIEF.md`, current project state, and task queue, Masala expects Vibe Zone to feel like:

- A polished creator-operations cockpit, not a collection of cards.
- A logistics dashboard for stream-to-clips work.
- Local-first and stream-safe by default.
- Quantity-first for clip generation, with downstream performance deciding winners.
- Honest about blockers: corrupt/partial media, YouTube bot checks, missing Whisper/SRT/ffmpeg artifacts.
- Review-oriented: rendered clips must be easy to watch, approve, reject, edit, download, and manually upload.
- Modern enough to compare with Opus-style clipping products, while differentiated by local execution, transparent AI practice chat, and Rex job visibility.

## Current UX flaws

### 1. Navigation mirrors implementation buckets instead of the user's workflow

Current nav:

- Dashboard
- Media Pipeline
- Clip Factory
- YouTube Scanner
- Viral Hunter
- Studio Feedback
- Social Dashboard
- Live Chat Co-Pilot
- Rex Activity / Jobs
- Settings

This exposes the app's internals rather than Masala's job-to-be-done. For example, YouTube Scanner, Media Pipeline, Clip Factory, and Social Dashboard are separate feature areas even though they are one continuous route from source stream to uploaded asset.

Impact:

- Masala must remember where the next action lives.
- Dashboard counts do not answer “what do I do next?”
- Rendered clips and generated clip candidates live in separate mental models.
- The product feels like a prototype with modules rather than a control room.

### 2. Dashboard is visually improved but operationally weak

The dashboard shows counts and an “operations route,” but it does not prioritize the current blocker or next action. Given current state, the primary issue is the partial/corrupt source video; the dashboard should make that unavoidable.

Missing dashboard capabilities:

- Current stream status summary.
- Source media health: complete/partial/unknown.
- Latest pipeline blocker.
- “Next best action” CTA.
- Review queue count by status.
- Approved-but-not-dispatched count.
- Recent renders needing review.
- Platform readiness by TikTok / YouTube Shorts / YouTube long / X.

### 3. Media Pipeline mixes ingestion, planning, artifact browsing, rendered review, and logs

`MediaPipeline` contains:

- Current target description.
- Upload drop zone.
- YouTube URL and input path fields.
- Probe/extract/ingest/transcribe/render buttons.
- Rendered review queue.
- Media artifacts table.
- Media job log.

This is too much for one page. The content is useful, but it needs lanes and stronger hierarchy. Right now, logs and commands compete with review outputs. A user looking for the clip to approve has to pass through implementation controls.

### 4. Clip Factory is not a review/editor workspace

`ClipFactory` can import transcript text, generate candidates, and update candidate status/platform. It does not yet feel like a clip review desk.

Gaps:

- No link from candidate to rendered file/version.
- No video preview.
- No transcript excerpt/context expansion.
- No inline title/caption/hashtag editing.
- No reject/keep/needs edit/approved/exported semantics.
- Statuses currently `idea → draft → reviewed → exported`; these are useful but not enough for review decisions.
- No “render this candidate” action despite being in task queue.
- No dedupe warnings or “similar to another candidate” grouping.
- No platform-specific requirements or safe-area/caption preset visibility.

### 5. Rendered clips are visible, but not connected to decisions

Media Pipeline now shows rendered cards with video preview and download/open links. That is a strong improvement, but they are file cards, not workflow cards.

Missing from rendered review cards:

- Associated clip candidate, title, hook, caption, hashtags.
- Platform target.
- Render preset used.
- Status controls.
- Approve/reject/needs edit actions.
- Version history.
- Validation status/playability.
- Manual upload checklist.
- Notes on what changed between versions.

### 6. Processing states are technically transparent but not productized

Server jobs expose useful detail: queued/running/done/needs-review/failed, commands, blockers, and safe YouTube fallback guidance. The UI mostly dumps these as logs.

Problems:

- `queued` does not clearly mean “command planned, not automatically executing.”
- `needs-review` is overloaded: missing file, missing subtitles, YouTube bot block, intentional manual review, and partial/corrupt video.
- No retry/resume action model.
- No progress stages for upload/transcribe/render beyond client-side upload percentage.
- Exact commands are valuable, but should be behind “technical details” disclosure unless they are the next action.

### 7. Dispatch is draft text, not an export/upload flow

`SocialDashboard` currently explains the TikTok → YouTube → X funnel and shows X/Twitter report drafts from clips. It does not yet support a dispatch lane.

Missing dispatch items:

- Approved assets list.
- Download MP4.
- Copy caption.
- Copy hashtags.
- Copy title.
- Manual upload checklist.
- Platform-specific readiness fields.
- Posted URL/performance fields.
- “Mark uploaded” or “needs repost/edit” state.

### 8. Render Lab does not exist as a first-class page

The current render controls are generic buttons in Media Pipeline:

- Queue short + subtitles.
- Queue long-form + subtitles.

But the brief requires understandable presets:

- Standard 9:16 captions-safe.
- Punchy 1–2 word captions.
- 50/50 facecam + content crop.
- Long-form 16:9.
- Subtitle position controls / safe zones.

Current server `buildFfmpegCommand` supports only `short` and `long` modes, with coarse scale/crop and optional subtitles. The UI should prepare for richer render intent even if execution starts as planned commands.

### 9. Facecam / layout decisions are invisible

The task queue has “Add facecam crop / 50-50 layout render preset,” and the brief says facecam 50/50 mode is not represented. The UI currently has no place to choose or preview layout geometry.

This is important because shorts quality depends heavily on composition:

- Is Masala's face visible?
- Is content readable?
- Are captions in the safe zone?
- Does the crop cut off important UI?

### 10. Visual design is clean but not yet deeply task-oriented

The light operations-dashboard theme is a good base: cards, sidebar, status pills, clean spacing, responsive layout. But the visual system still relies heavily on repeated generic cards.

Needed refinements:

- Status colors and labels should become a formal workflow language.
- Primary CTA should be singular per page.
- Critical blockers should be visually louder than normal notices.
- Review cards should use larger media preview and compact decision controls.
- Technical logs should be subordinate to artifacts and next actions.
- Empty states should be productive, not passive.

### 11. Data model limits the UX

Current frontend types and server persistence support:

- clips with status/platform/exportedAt;
- media files as independent artifacts;
- media jobs as logs;
- no explicit render entities;
- no link between clip candidates and render outputs;
- no dispatch records;
- no performance metrics;
- no render presets/version history;
- no per-clip notes or edit fields beyond generated copy.

The redesign should introduce UX concepts that can be implemented incrementally with JSON first, then SQLite later.

## Proposed information architecture

Replace feature-bucket navigation with workflow lanes.

### Primary nav

1. **Overview**
   - Current mission control: newest stream, health, blocker, next action, counts by lane.

2. **Ingest**
   - YouTube scan, source upload/import, local companion instructions, source media validation.

3. **Processing Jobs**
   - Tool probes, extraction/transcription/render job states, blockers, retries, technical commands.

4. **Clip Review**
   - Unified queue of generated candidates and rendered outputs, with review decisions and edit fields.

5. **Render Lab**
   - Render presets, safe-zone previews, facecam/layout modes, selected clip rendering, version history.

6. **Dispatch**
   - Approved assets ready for manual platform upload: downloads, copy buttons, checklist, performance fields.

7. **Insights / Viral Hunter**
   - Viral leads, competitor-inspired gaps, performance learning, tone/profile improvements.

8. **Practice Chat**
   - Transparent AI practice chat simulator.

9. **Rex Activity**
   - Auditable activity log, job history, raw operations trail.

10. **Settings**
   - Channel, strategy, guardrails, local model, product angle, thumbnail direction.

### Secondary structure

Use a persistent top-level pipeline strip on workflow pages:

`Source → Transcript → Candidates → Renders → Approved → Dispatched → Performance`

Each stage should show:

- count;
- status color;
- current blocker if any;
- click target to filter relevant page content.

## Core workflow model

### Asset states

Use consistent states across clips/renders/dispatch records.

Recommended clip status model:

1. `candidate` — generated from transcript, not yet reviewed.
2. `kept` — promising enough to render or refine.
3. `needs_edit` — hook/caption/crop/subtitles need work.
4. `rendered` — has at least one render output.
5. `approved` — ready for manual upload.
6. `dispatched` — uploaded or posted manually.
7. `rejected` — intentionally removed from active queue.

Current statuses can map as:

- `idea` → `candidate`
- `draft` → `kept` or `needs_edit`
- `reviewed` → `approved` if positive, otherwise split into `rejected/needs_edit`
- `exported` → `dispatched`

### Job states

Keep current server states but clarify UI copy:

- `queued` = “ready/planned; waiting for manual execution or worker.”
- `running` = “in progress.”
- `done` = “completed.”
- `needs-review` = “blocked or requires manual action.”
- `failed` = “attempt failed.”

Add blocker categories in UI, even before changing backend schema:

- Missing source.
- Partial/corrupt source.
- Missing transcript.
- Missing subtitles.
- YouTube extraction blocked.
- Tool missing.
- Awaiting approval/manual execution.
- Render failed.

### Render entity concept

Introduce a render/version concept in product design, even if initially derived from filenames:

- render id;
- linked clip id;
- source media path;
- output path;
- platform target;
- preset;
- layout mode;
- subtitle style;
- status;
- createdAt;
- validation/playability;
- notes.

This unlocks Clip Review, Render Lab, and Dispatch.

## Page-by-page redesign

### 1. Overview

Purpose: Masala should understand the next action within 5 seconds.

Recommended layout:

1. **Hero status panel**
   - Title: “Newest stream pipeline”
   - Stream title/id.
   - Source health badge: complete / partial / missing / unknown.
   - Primary blocker: e.g. “Source video is partial: decodable through 25:28 of 90:09.”
   - One primary CTA: “Upload complete source” or “Review rendered clips.”

2. **Pipeline strip**
   - Source, Transcript, Candidates, Renders, Approved, Dispatched.
   - Counts and health.

3. **Today’s queues**
   - Needs action.
   - Ready to review.
   - Ready to dispatch.
   - Failed/blocked jobs.

4. **Recent outputs**
   - 3 latest renders with preview thumbnails/video.
   - Status and next action.

5. **Rex summary**
   - Latest 5 meaningful jobs, not raw command noise.

Acceptance criteria:

- If source media is partial/corrupt, it appears above all counts.
- There is exactly one visually dominant next-action button.
- Rendered clips are reachable from the overview in one click.
- Counts distinguish generated candidates from rendered outputs and approved assets.

### 2. Ingest

Purpose: get media/transcripts into Vibe Zone reliably.

Recommended sections:

1. **Source selector**
   - Current channel URL.
   - Latest scanned stream.
   - “Scan channel” action.
   - “Use this stream” selector if multiple recent items exist.

2. **Upload/import lane**
   - Large drag/drop zone.
   - Accepted file types.
   - Server destination preview.
   - Upload progress.
   - After upload: validation result and next action.

3. **YouTube extraction preflight**
   - Preflight button.
   - Clear explanation that extraction is not automatic unless explicitly enabled.
   - Bot-block fallback card.

4. **Local companion fallback**
   - Copyable commands/instructions for Masala's own machine.
   - Required files checklist: `.mp4`, `.txt`, `.srt`.

5. **Source files table**
   - File name, kind, size, updated, validation badge, open/download.
   - Partial/corrupt warnings with detailed durations.

Acceptance criteria:

- A missing or partial source file produces a clear upload/import CTA.
- YouTube bot-block state never implies login/cookies are required by default.
- Uploaded video shows validation status without navigating away.
- Transcript/subtitle companion files show whether they match the selected stream.

### 3. Processing Jobs

Purpose: transparent job operations without burying users in commands.

Recommended sections:

1. **Active jobs board**
   - Cards grouped by extraction, transcription, scoring, rendering.
   - Status badge, last update, blocker category.

2. **Retry / resolve actions**
   - Retry preflight.
   - Recheck files.
   - Re-run ingest.
   - Queue render.
   - Copy command.

3. **Technical details drawer**
   - Exact command.
   - stdout/stderr if later captured.
   - createdAt.

4. **Tool health**
   - yt-dlp, Whisper, ffmpeg, Ollama.
   - Probe action.

Acceptance criteria:

- `needs-review` jobs explain exactly what human action is required.
- Commands are available but not the primary visual content.
- Jobs can be filtered by failed/blocked/running/done.
- Tool readiness is visible before attempting media actions.

### 4. Clip Review

Purpose: make clip decisions quickly.

Recommended layout:

1. **Queue filters**
   - Candidate, kept, needs edit, rendered, approved, rejected, dispatched.
   - Platform filter.
   - Transcript/source filter.
   - Score range / duplicate groups later.

2. **Review card**
   - Video preview if rendered; otherwise transcript excerpt placeholder.
   - Score and reason.
   - Start/end.
   - Hook/title/caption/hashtags editable fields.
   - Platform target.
   - Current status.
   - Render version badge if available.
   - Preset/layout used.

3. **Decision actions**
   - Reject.
   - Keep.
   - Needs edit.
   - Render.
   - Approve.
   - Send to Dispatch.

4. **Context panel**
   - Nearby transcript lines.
   - Similar candidates.
   - Source media health.
   - Job/render history for selected clip.

Acceptance criteria:

- Masala can review a rendered clip without going to Media Pipeline.
- Every review card has a decision action.
- Candidate cards without renders offer “Render this clip.”
- Rendered cards show output path/open/download.
- Title/caption/hashtags can be edited or clearly marked as generated draft-only.

### 5. Render Lab

Purpose: expose rendering as understandable creative presets rather than raw ffmpeg buttons.

Recommended sections:

1. **Selected clip panel**
   - Clip title/hook.
   - Start/end controls.
   - Platform target.
   - Source media validation.

2. **Preset cards**
   - Standard 9:16 captions-safe.
   - Punchy 1–2 word captions.
   - 50/50 facecam + content crop.
   - Long-form 16:9.
   - High-contrast accessibility captions.

3. **Layout preview / safe-zone guide**
   - 9:16 frame mock.
   - Caption safe area.
   - Facecam/content split for 50/50.
   - Warning if source is partial and selected timestamp exceeds decodable range.

4. **Render settings**
   - Subtitle file.
   - Caption position.
   - Font/contrast preset.
   - Crop/layout mode.
   - Output naming.

5. **Version history**
   - All renders for selected clip.
   - Preset used.
   - Created time.
   - Status: playable, failed, approved, superseded.

Acceptance criteria:

- Render presets are understandable without knowing ffmpeg.
- 50/50 facecam mode is visible as a selectable option.
- Subtitle safe-zone guidance is visible before rendering.
- Rendering from a selected clip links output back to that clip.
- Render version history is visible from both Render Lab and Clip Review.

### 6. Dispatch

Purpose: prepare approved clips for manual platform upload.

Recommended sections:

1. **Ready to dispatch queue**
   - Approved renders grouped by platform.
   - Video preview.
   - Title/caption/hashtags.
   - Download MP4.
   - Copy buttons.

2. **Platform checklist**
   - TikTok: download, copy caption, upload manually, record URL, add metrics later.
   - YouTube Shorts: title, description, tags/hashtags, thumbnail note if applicable.
   - YouTube long: title, description, chapters later.
   - X: report draft, thread/single-post choice.

3. **Manual upload record**
   - Posted URL.
   - Posted date.
   - Initial notes.
   - Mark dispatched.

4. **Performance feedback fields**
   - Views.
   - Retention/completion.
   - Likes/comments/saves/shares.
   - Promote to next platform?

Acceptance criteria:

- No external posting occurs.
- Approved clips have everything needed for manual upload in one card.
- Copy/download actions are available per asset.
- Dispatched assets can later receive performance metrics.
- Dispatch state feeds Insights/Learning.

### 7. Insights / Viral Hunter

Purpose: decide what to clip next and what to promote.

Recommended sections:

1. **Viral lead backlog**
   - Existing RSS/clip generated leads.
   - Score, source, angle.
   - Convert lead to clip idea.

2. **Performance loop**
   - Clips that performed well on TikTok.
   - Candidates to promote to YouTube.
   - YouTube winners to turn into X posts.

3. **Competitor-informed gaps**
   - Actual media execution.
   - Moment ranking beyond text.
   - Subtitle styling.
   - Review queue automation.
   - Template/preset library.

4. **Masala tone learning**
   - Approved posts/transcripts.
   - Edited drafts.
   - Tone profile readiness.

Acceptance criteria:

- Viral Hunter findings can become reviewable clip ideas.
- Performance fields inform promotion decisions.
- X report drafts are tied to proven clips, not just any generated candidate.

### 8. Practice Chat

Purpose: transparent AI practice chat for livestream preparation.

Keep this page, but make the transparency label persistent and visually strong.

Acceptance criteria:

- Every simulated message remains labelled fictional/AI practice chat.
- The page does not resemble real viewer analytics.
- Generated questions can be cleared or exported as prep notes later.

### 9. Rex Activity

Purpose: trust and auditability.

Keep raw history, but add filters and summary.

Recommended sections:

- Important events.
- Media jobs.
- Clip updates.
- Settings changes.
- Raw JSON/debug drawer if needed.

Acceptance criteria:

- Masala can answer “what did Rex do?” without reading every log line.
- Failed/blocked jobs are filterable.
- Commands remain visible for audit.

### 10. Settings

Purpose: product defaults and guardrails.

Current Settings is mostly fine. Add:

- Default render preset.
- Default platform target.
- Stream-safe display options.
- Local model status.
- Thumbnail reference approval status.
- Data/storage mode: JSON now, SQLite later.

Acceptance criteria:

- Guardrails remain visible.
- No auto-posting/login behavior is implied.
- Thumbnail face usage remains blocked until approved references exist.

## Component inventory

### Global components

- `AppShell`
- `SidebarNav`
- `Topbar`
- `PipelineStrip`
- `StatusBadge`
- `PrimaryNextAction`
- `BlockerBanner`
- `MetricCard`
- `EmptyStateAction`
- `TechnicalDetailsDisclosure`
- `CopyButton`
- `DownloadButton`
- `SafeExternalLink`

### Ingest components

- `ChannelScanPanel`
- `StreamSelector`
- `UploadDropzone`
- `UploadProgressBar`
- `SourceValidationBadge`
- `MediaFileTable`
- `LocalCompanionFallbackCard`
- `ExtractionPreflightCard`
- `RequiredFilesChecklist`

### Processing components

- `JobBoard`
- `JobCard`
- `JobTimeline`
- `ToolHealthPanel`
- `RetryActionMenu`
- `CommandBlock`
- `BlockerCategoryPill`

### Clip Review components

- `ClipQueueFilters`
- `ClipReviewCard`
- `ClipPreview`
- `TranscriptExcerpt`
- `EditableMetadataFields`
- `StatusControlGroup`
- `PlatformSelector`
- `RenderVersionBadge`
- `SimilarCandidatesList`
- `ClipDecisionToolbar`

### Render Lab components

- `RenderPresetCard`
- `RenderPresetGrid`
- `SafeZonePreview`
- `LayoutModeSelector`
- `SubtitlePresetSelector`
- `TimeRangeEditor`
- `RenderCommandPreview`
- `RenderVersionHistory`
- `SourceHealthWarning`

### Dispatch components

- `DispatchQueue`
- `DispatchCard`
- `PlatformChecklist`
- `CaptionCopyBlock`
- `HashtagCopyBlock`
- `ManualUploadRecordForm`
- `PerformanceMetricsForm`
- `PromotionDecisionPanel`

### Insights components

- `ViralLeadCard`
- `PerformanceTable`
- `PromotionFunnel`
- `ToneProfilePanel`
- `CompetitorGapChecklist`

## Highest-impact implementation sequence

### Phase 1 — Make the current workflow understandable

Goal: within 5 seconds, Masala sees the blocker and next action.

1. Rename/reorder nav to workflow lanes.
2. Redesign Overview around newest stream health, primary blocker, and next action.
3. Extract Media Pipeline upload/source validation into an Ingest page.
4. Extract job logs/tool probes into Processing Jobs page.
5. Add a shared `PipelineStrip` and `BlockerBanner`.

Acceptance gate:

- Partial/corrupt source video is the top visible issue.
- Rendered clips and clip candidates are no longer hidden behind implementation pages.

### Phase 2 — Build real Clip Review

Goal: generated/rendered assets become reviewable units.

1. Create Clip Review page.
2. Move candidate list from Clip Factory into review cards.
3. Move rendered video cards into the same review context.
4. Add review statuses: candidate/kept/needs_edit/approved/rejected/dispatched, mapped initially to existing backend fields if needed.
5. Add editable title/caption/hashtags in UI, even if persistence is initially limited or added immediately after.
6. Add “render selected clip” CTA linking to Render Lab or calling render endpoint with clip start/end.

Acceptance gate:

- Masala can watch a render, approve/reject it, and see next dispatch step from one page.

### Phase 3 — Render Lab presets and version linkage

Goal: rendering feels creative and safe, not like raw command planning.

1. Add Render Lab page.
2. Create preset cards for standard 9:16, punchy captions, 50/50 facecam, long 16:9.
3. Add safe-zone preview component.
4. Add selected clip context and timestamp controls.
5. Persist or derive render version records linked to clip ids.
6. Display render version history in Clip Review.

Acceptance gate:

- 50/50 facecam mode is selectable.
- A render output can be traced back to the clip candidate and preset used.

### Phase 4 — Dispatch flow

Goal: approved clips become manually upload-ready packages.

1. Replace Social Dashboard with Dispatch.
2. Show approved renders grouped by platform.
3. Add download/copy/checklist actions.
4. Add posted URL/date/performance fields.
5. Keep X/Twitter reports draft-only and tied to proven clips.

Acceptance gate:

- A user can manually upload an approved clip without hunting across pages for MP4/caption/hashtags.

### Phase 5 — Learning loop and product polish

Goal: compete with modern clipping dashboards through local-first differentiation.

1. Add performance fields per dispatched clip.
2. Add promotion recommendations: TikTok winner → YouTube candidate → X report.
3. Add dedupe/similarity warnings.
4. Add tone profile builder from approved examples.
5. Refine visual language: status badges, queue counts, empty states, keyboard-friendly review.

Acceptance gate:

- The app can explain which clips won, where they should go next, and what the system learned.

## Data/API implications

Current server can support a first pass, but the UX will be much stronger with small schema additions.

### Recommended JSON additions

```ts
type ClipStatus = 'candidate' | 'kept' | 'needs_edit' | 'rendered' | 'approved' | 'dispatched' | 'rejected'

type RenderPreset = 'short_standard' | 'short_punchy' | 'short_50_50_facecam' | 'long_16_9' | 'accessibility_high_contrast'

type RenderRecord = {
  id: string
  clipId: string
  sourcePath: string
  outputPath: string
  platform: 'tiktok' | 'youtube_shorts' | 'youtube_long' | 'x'
  preset: RenderPreset
  layoutMode: string
  subtitlePath?: string
  status: 'planned' | 'queued' | 'running' | 'done' | 'failed' | 'superseded'
  validation?: MediaValidation
  createdAt: string
  notes?: string
}

type DispatchRecord = {
  id: string
  clipId: string
  renderId: string
  platform: 'tiktok' | 'youtube_shorts' | 'youtube_long' | 'x'
  status: 'ready' | 'uploaded' | 'needs_followup'
  postedUrl?: string
  postedAt?: string
  metrics?: {
    views?: number
    likes?: number
    comments?: number
    saves?: number
    shares?: number
    retention?: number
    completionRate?: number
  }
}
```

### API additions

- `PATCH /api/clips/:id` should support title/caption/hashtags/status/platform/notes.
- `POST /api/clips/:id/render` should create a render job from clip start/end and preset.
- `GET /api/renders` should return render records linked to output files.
- `PATCH /api/renders/:id` should support approve/supersede/notes.
- `POST /api/dispatch` should create manual upload checklist records from approved renders.
- `PATCH /api/dispatch/:id` should support posted URL and metrics.

## Concrete acceptance criteria by redesign outcome

### Navigation and IA

- Primary nav uses workflow lane names: Overview, Ingest, Processing Jobs, Clip Review, Render Lab, Dispatch, Insights, Practice Chat, Rex Activity, Settings.
- No core stream-to-upload action requires knowing implementation terms like “Clip Factory.”
- The current active lane is visually obvious.

### Overview

- Shows one primary next action based on current blocker/state.
- Shows source health for the newest stream.
- Shows counts for candidates, renders, approved, dispatched.
- Shows latest blocker with human-readable resolution.

### Ingest

- Upload supports source and transcript/subtitle files.
- Source file validation is visible directly after upload.
- Partial/corrupt source files are clearly marked.
- Local companion fallback is available when YouTube extraction is blocked.

### Processing

- Every job displays status, blocker category, next action, and technical details.
- Tool health for yt-dlp, Whisper, ffmpeg, and local model is visible.
- `needs-review` never appears without an explanation.

### Clip Review

- Rendered clips are review cards, not only media artifacts.
- Every generated candidate has a visible state and next step.
- Review actions include reject, keep, needs edit, approve, dispatch.
- Cards show title, hook, caption, hashtags, platform, preset/version if available.
- Candidate cards can start a render flow.

### Render Lab

- Preset cards exist for standard 9:16, punchy captions, 50/50 facecam, long-form 16:9.
- Safe-zone preview exists for shorts captions/layout.
- Render outputs link back to source clip and selected preset.
- Source health warnings prevent rendering unavailable timestamps from partial videos.

### Dispatch

- Approved clips show download, copy caption, copy hashtags, and manual upload checklist.
- No external posting occurs.
- Dispatched clips can store posted URL and metrics.
- X/Twitter copy remains draft-only/manual approval.

### Visual/product quality

- Critical blockers are visually distinct from generic info notices.
- Empty states provide an action and explain the missing prerequisite.
- Technical commands are available but visually secondary.
- Responsive layout keeps review actions usable on narrow screens.

## Recommended immediate next build tickets

1. **IA shell:** rename nav and split pages into Overview / Ingest / Processing / Clip Review / Render Lab / Dispatch.
2. **Overview blocker:** surface partial/corrupt media as top-priority blocker with upload CTA.
3. **Clip Review page:** combine candidates and render cards into one review queue.
4. **Render selected clip:** add action from candidate card using clip start/end and selected preset.
5. **Render presets UI:** add preset cards and safe-zone preview, starting with command planning if execution remains manual.
6. **Dispatch page:** approved render cards with MP4 download and copyable captions/hashtags.
7. **Render linkage:** introduce render records or filename-derived association so outputs are not anonymous files.

## Definition of done for the UX redesign

Vibe Zone should pass this user test:

> Masala opens the app after a stream. Within 5 seconds he sees whether the source is complete, what is blocked, and the next action. Once clips are generated, he can review each candidate/render, choose a preset, approve the good ones, and manually dispatch them with MP4/caption/hashtags in one place. Every asset has a state, every blocker has a remedy, and no external action happens without approval.
