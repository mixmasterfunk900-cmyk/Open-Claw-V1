
## 2026-05-17 — Open-source scheduler pattern: Postiz

Public/open-source reference inspected: `gitroomhq/postiz-app` plus public docs/search results. No private/proprietary code used.

Useful architecture patterns for Vibe Zone:
- Separate user-facing scheduling UI from durable background publishing workflows.
- Keep provider/platform modules isolated so one platform failure does not poison the whole queue.
- Treat media storage, post records, scheduling state, and analytics as distinct collections.
- Use an explicit result ledger after publishing attempts/manual posting, rather than deriving truth only from queue status.
- Prefer durable retry/workflow systems for real connectors later; Vibe Zone should stay local/manual-only until credentials and owner approval exist.

Applied in this slice: added a local manual post result ledger to dispatch items. It records what Masala manually posted after the fact; it does not post, poll, scrape, like, reply, DM, or use credentials.

## 2026-05-17 — Open-source scheduler pattern: TryPost

Public/open-source reference inspected: `trypostit/trypost` and public docs/search results. No private/proprietary code used.

Useful architecture patterns for Vibe Zone:
- Model a post as one source asset with per-platform customization, not one generic caption sprayed everywhere.
- Keep a central media library connected to draft/scheduled posts so rendered assets can be reused safely.
- Calendar/scheduler and publishing connectors should be separate layers; draft editing can exist before any connector is enabled.
- Workspace/team features are out of scope for Masala’s local MVP, but the same pattern supports future productization.

Applied in this slice: added a local per-platform draft copy override editor on dispatch rows. It stores title/post text/description/hashtags per platform in local JSON and stays manual-review only.


## 2026-05-17 — Twitter Radar source scout: no-API/low-risk public data sources

Public sources reviewed:
- X API docs: Filtered Stream is the reliable real-time path and advertises near-real-time delivery with ~6–7s P99 latency. X API is pay-per-usage; read costs are per returned resource. This is the clean path for a Tier 1 high-profile watchlist, but requires credentials/credits.
- RSS.app docs: can generate RSS feeds from public X profiles, lists, hashtags, and searches; feed creation is described as ready within ~20 seconds. Treat refresh latency as provider/plan dependent and label it as near-real-time/provider, not seconds-guaranteed.
- Search-engine/web-search results: useful for safe topic discovery and niche-account discovery. Latency and completeness are unpredictable; use only for delayed public-web radar.
- Nitter/open-source frontends: useful architecture reference, but not a dependable source. Public Nitter/RSS has had reliability issues after X guest-token changes; do not build the product around public instances.

Risk posture:
- No logged-in X scraping by default.
- No public-instance hammering.
- No bypassing platform controls.
- Stop/back off on 401/403/429/CAPTCHA/challenge-like responses.
- Manual reply only via X intent/deep link.

Adapter recommendation:
- Implement source adapters with explicit capability/risk metadata and latency classes.
- Store provenance and freshness with every candidate so the UI can be honest.
- Use source-specific token buckets and ETag/conditional requests where possible.
- Keep Tier 1 "seconds" blocked behind official API/provider approval; use public-web/topic discovery for the current no-API MVP.

Reference URLs:
- https://docs.x.com/x-api/posts/filtered-stream/introduction
- https://docs.x.com/x-api/getting-started/pricing
- https://docs.x.com/x-api/posts/search/integrate/build-a-query
- https://help.rss.app/en/articles/10628517-how-to-create-rss-feeds-from-x-formerly-twitter
- https://github.com/zedeus/nitter

## 2026-05-17 — Twitter Radar no-API source options

Public/open-source/social-data options reviewed for near-real-time X monitoring without logging in or using X API.

Findings:
- Official X filtered stream remains the only clean seconds-level path; it requires API access/credentials and is intentionally disabled here.
- RSS-style routes such as RSSBridge/RSS.app-style providers can be useful for public profile/topic feeds, but latency is provider/plan dependent and terms must be checked before enabling. Treat as “near-real-time/provider”, not guaranteed seconds.
- Nitter/open-source X frontends are useful references but unreliable as production sources after guest-token changes. Avoid defaulting to public Nitter instances or profile scraping loops.
- Search-engine/web-search discovery is safest for no-credential topic radar but delayed/incomplete, so it should be labelled honestly.
- Logged-in browser monitoring is excluded until explicit approval; if ever used, it must be tiny-watchlist, conservative cadence, and stop-on-challenge.

Applied in this slice: added local source-adapter status and 4-lane coordination metadata to Twitter Radar so the UI distinguishes enabled manual search, delayed public web, provider-pending, API-blocked, and browser-blocked routes without performing unsafe fetches.

## 2026-05-17 — Twitter Radar manual tier scheduler pattern

Public/open-source/source-option follow-up:
- RSSBridge’s Twitter/X bridge now generally depends on an X API bearer token, so it is not a true no-API path for reliable profile monitoring. Its cache/ETag-style polling pattern is still useful: declare source cadence, cache aggressively, and avoid repeated live hits.
- Without X API/provider approval, the safest “near-real-time” improvement is not automated fetching; it is a tiered manual-check queue that tells Masala which accounts to check first and when, with direct search links.
- Recommended local cadences: Tier A every ~15 minutes when Masala is actively hunting replies, Tier B hourly, Tier C every few hours. These are reminders/priority ordering only, not platform polling.

Applied in this slice: added local `lastManualCheckedAt`, `nextManualCheckAt`, `checkCadenceMinutes`, and `priorityScore` fields for watchlist accounts plus a manual check queue and local “Mark checked” action. No X fetches or account actions are performed.

## 2026-05-18 — Watchlist import/export maintenance pattern

Public/open-source/social-monitoring follow-up:
- Open-source schedulers tend to emphasize bulk post scheduling rather than bulk importing social-monitoring watchlists.
- Social-listening tools often keep watch terms/accounts as local lists; the useful safe pattern is normalize/dedupe local inputs before any source adapter sees them.
- For Vibe Zone’s no-API lane, CSV/text import/export is safe because it improves curation of large local lists without adding fetches, credentials, or platform automation.

Applied in this slice: added local bulk watchlist import/export in the Twitter Radar UI. It accepts handle lines, existing Tier format, or CSV (`handle,displayName,tier,tags`), dedupes locally, caps at 2000, and requires “Save radar setup” to persist. No external data access is performed.
