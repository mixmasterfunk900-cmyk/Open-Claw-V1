# X Growth Agent Plan — Vibe Zone

Status: skill installed locally; no login, cookies, browser posting, or account actions performed yet.

## Installed skill

Skill path:

`/root/.openclaw/plugin-skills/vibe-zone-x-growth/SKILL.md`

Reference brief:

`/root/.openclaw/plugin-skills/vibe-zone-x-growth/references/x-growth-operating-brief.md`

## Filled niche

AI-powered creator tools, Vibe Zone, livestream-to-content automation, build-in-public, indie dev tools, agentic workflows, and local-safe creator automation.

## Operating interpretation

This is not a generic Twitter bot. It should act as a Vibe Zone distribution agent:

1. Pull from media Rex is generating now.
2. Draft concise X posts, video posts, and later threads.
3. Engage with relevant small accounts by adding specific value.
4. Use Chrome/browser automation only after Masala provides login/session approval.
5. Stop on CAPTCHA, verification, account risk, or failed actions.
6. Never follow, like, retweet, DM, quote, or mass-engage automatically.

## Media sources

- Post-ready short clips: `media/post-ready-review/`
- Active renders: `media/renders/`
- Long-form packages: `media/exports/long-form/`
- Thumbnails and generated images: `media/thumbnails/` and long-form package `thumbnails/`

## Current safety stance

Chrome workflow is fine for approved account operation, but the implementation must not be framed as evading X detection. It should behave conservatively, obey visible platform prompts, stop on challenges, and log everything.

## Next build tasks

1. Add a local X queue file/table for drafted posts and replies.
2. Add daily counters for max 5 posts and max 15 replies.
3. Add `needs_approval`, `approved_to_publish`, `published`, `skipped`, `blocked` statuses.
4. Build a prompt runner that drafts posts from the latest Vibe Zone media bundles.
5. After Masala provides the writing SOP, add it to the skill as `references/masala-writing-sop.md`.
6. After Masala provides login details in a safe, non-stream-visible way, run a browser-only dry login check without posting.

## Stop conditions

- CAPTCHA or verification
- Wrong account logged in
- Failed submit twice
- Unreviewed sensitive stream frame
- Any credentials visible on stream or in logs
- Request to automate follows, likes, retweets, DMs, quote tweets, or detection evasion
