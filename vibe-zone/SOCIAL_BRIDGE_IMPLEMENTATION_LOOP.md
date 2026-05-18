# Social Bridge Implementation Loop

Status: ready for Masala review
Owner: Masala
Scope: Vibe Zone website social posting arm inspired by public Post Bridge patterns and open source scheduler architecture.

## Goal

Build a Vibe Zone native social bridge that gives Masala one local dashboard for social distribution, without copying proprietary Post Bridge code or UI.

## Safety rules

- Do not post externally.
- Do not use real social credentials unless Masala explicitly provides and approves them later.
- Do not automate likes, follows, reposts, DMs, or replies.
- Do not bypass platform controls, CAPTCHAs, rate limits, or account warnings.
- Prefer draft, manual review, and owner approval gates.
- Research only public material and open source repositories.
- Do not clone proprietary private code.

## Research targets

Primary public reference:
- Post Bridge public site and official `post-bridge-hq/agent-mode` MIT repo.

Open source scheduler references to inspect:
- `gitroomhq/postiz-app`
- `trypostit/trypost`
- `rodrgds/openpost`
- `inovector/mixpost`
- `ClimenteA/imposting`

## Feature backlog

Build in safe, tested slices:

1. Research summary page or doc for scheduler architecture patterns.
2. Social accounts data model and UI stub.
3. Media library bridge from Vibe Zone renders to social drafts.
4. Draft post composer with per platform copy fields.
5. Scheduling queue UI and local JSON persistence.
6. Post result ledger with manual status updates.
7. Platform config fields for X, YouTube, TikTok, Instagram, LinkedIn.
8. Analytics import placeholder and manual metric entry.
9. Agent actions panel for draft generation, radar, and review tasks.
10. Later only after approval: API connectors or browser based manual posting helpers.

## Run protocol

Each cron run should:

1. Read this file, `PROJECT_STATE.md`, `SOCIAL_AUTONOMY_PLAN.md`, and existing Social Hub code.
2. Inspect current implementation before editing.
3. If research is incomplete, research one target and append concise findings to `SOCIAL_BRIDGE_RESEARCH.md`.
4. Pick the next small feature slice from the backlog.
5. Implement only that slice in Vibe Zone.
6. Run `npm run build` and the smallest relevant tests.
7. If code changed, run `graphify update .` from `vibe-zone`.
8. Append a progress note to `.openclaw-grid/queues/social.md` with files changed, tests passed, and next slice.
9. Stop if blocked by missing credentials, private API access, or a risky external action.

## Done definition

A useful MVP exists when Vibe Zone has:

- Social accounts panel
- Draft composer
- Media attach from local renders
- Schedule queue
- Per platform copy overrides
- Manual post result ledger
- Twitter Radar integration
- Tests for the core local API and UI contracts

At that point, mark this file `Status: ready for Masala review` and do not keep adding speculative features.
