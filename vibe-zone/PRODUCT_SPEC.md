# Vibe Zone Product Spec / Roadmap

## Vision

Vibe Zone is a local multi-page dashboard for Masala's livestream and product-building workflow. It should help turn stream activity into useful product momentum: clips, research, social drafts, studio feedback, live chat assistance, and Rex job visibility.

## Principles

- Cheap-first: do not buy SaaS before the workflow proves it needs cloud services.
- Local-first: local app, local mock data, later local files/SQLite/API.
- GitHub-ready: simple stack, clear README, no secrets committed.
- Stream-safe: avoid exposing private files, credentials, messages, or awkward personal data on screen.
- Human approval: drafts are fine; external posts/logins/actions require explicit approval.

## Target users

- Masala: dad, full-time worker, coding/livestreaming builder.
- Rex: local AI co-builder that can surface jobs, drafts, and workflow state.

## Current MVP

A Vite + React dashboard with mock data and page navigation:

1. Dashboard: mission summary, run-of-show, stats, quick actions.
2. Clip Factory: candidate clips, scores, hooks, target platforms.
3. Viral Research: trend topics and content angles.
4. Studio Feedback: audio/pacing/privacy/chat feedback.
5. Social Dashboard: draft-only post queue.
6. Live Chat Co-Pilot: prompt helpers and chat pulse.
7. Rex Activity / Jobs: agent job statuses and review needs.
8. Settings: guardrails, env notes, integration policy.

## Near-term roadmap

### Phase 1: Make it usable locally

- Move mock data into dedicated JSON/TS modules.
- Add local persistence for clips, jobs, drafts, and settings.
- Add import flow for transcript text files.
- Add basic search/filter across clips and jobs.
- Add a stream-safe privacy banner component for sensitive screens.

### Phase 2: Creator workflow

- Generate clip candidates from transcripts.
- Add hook/title/caption variants per platform.
- Add manual approval states: idea → draft → reviewed → exported.
- Add export files for captions/post copy without auto-posting.
- Add studio checklist before going live.

### Phase 3: Integrations, still cautious

- OBS scene/status read-only integration.
- Twitch/YouTube chat read-only ingest.
- GitHub issue/project sync for product tasks.
- Local video clipping tool integration.
- Optional social platform APIs only for drafts or after explicit approval.

## Open questions

- Preferred persistent store: local JSON, SQLite, or both?
- Should Vibe Zone run as purely frontend, or include a small local Node API?
- Which streaming platform/chat source comes first?
- What does a “clip score” mean: retention prediction, hook strength, chat reaction, or manual rating?

## Non-goals for now

- No auto-posting.
- No external login flows.
- No paid cloud dependency.
- No secret management beyond `.env.local` guidance.
