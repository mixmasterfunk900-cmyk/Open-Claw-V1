# Social Autonomy Plan — TikTok, X/Twitter, YouTube

_Last researched: 2026-05-13 UTC. Planning only: no account connections, cookies, credentials, OAuth flows, or posting actions were performed._

## Recommendation

Build Vibe Zone distribution in three layers:

1. **Now: Dispatch bundles + manual review**
   - Continue generating platform-specific video files, titles, descriptions, hashtags, thumbnails, and upload checklists.
   - Add a Dispatch Queue UI with statuses: `drafted`, `needs_owner_review`, `approved_manual_upload`, `posted_manual`, `blocked`, `api_ready_later`.
   - This is safest for stream/account safety and gives Masala high leverage immediately.

2. **Next: local scheduler + approval gate, still no external writes**
   - Let Rex prepare a post calendar, retry-safe upload cards, and platform-specific copy variants.
   - Add an explicit “Approve for external posting” gate per asset/platform, but keep the button disabled until OAuth/API setup is intentionally completed.

3. **Later: official API posting behind hard gates**
   - Use official APIs only; no browser-cookie automation, no scraping upload forms, no unofficial posting bots.
   - Start with YouTube because the official Data API is mature and Google OAuth is well documented.
   - Add TikTok after app review/audit expectations are accepted.
   - Treat X/Twitter as optional/expensive/volatile until pricing and media-upload access are confirmed for Masala’s account.

## Non-negotiable guardrails

- **No autonomous public posting by default.** Owner approval must remain required until Masala explicitly changes policy.
- **No credential collection in chat or stream-visible logs.** OAuth client secrets, refresh tokens, and API keys never go into markdown, console output, Git, or browser screenshots.
- **No cookies/session hijacking.** Do not automate logged-in browser uploads as “API posting”. Use OAuth/API or manual upload.
- **No spam.** Add per-platform daily caps and a minimum delay between posts even when official limits allow more.
- **AI/synthetic labeling.** Any AI-generated visuals, voices, or materially synthetic footage must be labeled where platforms require or where user trust expects it.
- **Human voice safety.** Rex can draft copy, but final “sounds like Masala” public voice should be previewable/editable.
- **Stream safety.** Any setup page likely to show account names, tokens, emails, channel IDs, or private drafts should display a warning before being opened on stream.

## Proposed architecture

### Data model additions

Add a `dispatchItems` collection, or a SQLite table when persistence moves off JSON:

```ts
type DispatchPlatform = 'youtube_short' | 'youtube_long' | 'tiktok' | 'x_post' | 'x_thread';
type DispatchStatus =
  | 'drafted'
  | 'needs_owner_review'
  | 'approved_manual_upload'
  | 'approved_api_upload'
  | 'posting'
  | 'posted'
  | 'failed_retryable'
  | 'failed_blocked'
  | 'cancelled';

type DispatchItem = {
  id: string;
  sourceAssetId: string;
  renderPath: string;
  platform: DispatchPlatform;
  title?: string;
  description?: string;
  postText?: string;
  hashtags: string[];
  thumbnailPath?: string;
  aiGeneratedVisuals: boolean;
  ownerApproval: {
    required: true;
    approvedAt?: string;
    approvedBy?: 'masala';
    approvalNote?: string;
  };
  schedule?: { desiredAt?: string; timezone?: string };
  external?: {
    provider?: 'youtube' | 'tiktok' | 'x';
    externalPostId?: string;
    url?: string;
    postedAt?: string;
    lastApiStatus?: string;
  };
  auditLog: Array<{ at: string; actor: 'rex' | 'masala' | 'system'; action: string; detail?: string }>;
};
```

### Runtime boundaries

- **Drafting service:** local only; produces copy, metadata, thumbnails, filenames, and upload cards.
- **Approval service:** records Masala’s explicit approval. Never infers approval from “looks good” unless UI wording makes the external action clear.
- **Connector service:** one provider module per platform. Disabled by default unless configured.
- **Secrets service:** uses environment variables or an OS secret store; stores refresh tokens encrypted at rest if tokens must persist.
- **Rate-limit service:** central queue with per-provider caps, exponential backoff, and no tight polling.

### Minimum safe connector interface

```ts
type PublishRequest = {
  dispatchItemId: string;
  mediaPath?: string;
  text: string;
  title?: string;
  description?: string;
  privacy: 'private' | 'unlisted' | 'public';
  aiGeneratedVisuals: boolean;
  ownerApprovedAt: string;
};

type PublishResult =
  | { ok: true; externalPostId: string; url?: string; rawStatus?: string }
  | { ok: false; retryable: boolean; reason: string; rateLimitResetAt?: string };
```

Connector must refuse to run if:
- `ownerApprovedAt` is missing.
- Provider config is disabled.
- Token is unavailable/expired and refresh fails.
- Platform-specific metadata is incomplete.
- AI-generated-content labels are required but missing.

## Platform feasibility

### YouTube / YouTube Shorts

**Feasibility: high once Masala approves OAuth setup.**

Official route:
- YouTube Data API v3 `videos.insert` supports uploading videos and setting metadata.
- OAuth scope can be narrowly focused on upload: `https://www.googleapis.com/auth/youtube.upload`.
- YouTube official docs currently state uploads from unverified API projects created after 2020 are restricted to private viewing until the project passes audit. This may mean API-uploaded public publishing requires verification/audit.
- Quota docs are the source of truth. The current official quota calculator page says default projects have 10,000 units/day and lists `videos.insert`; third-party references often cite 1,600 units/upload. Treat this as a moving target and check live docs before implementation.

Recommended mode:
1. First API prototype uploads **private/unlisted only** to a test channel/project.
2. Manual owner checks title, description, thumbnail, and visibility.
3. Only later allow public visibility after audit/verification and explicit Masala approval.

Important implementation notes:
- Shorts are just normal uploads that satisfy Shorts characteristics; still use `videos.insert`.
- Custom thumbnail likely needs `thumbnails.set`, which costs extra quota and has account eligibility constraints.
- Captions can be uploaded through captions API, but burned-in captions remain more predictable for Shorts.
- Add `notifySubscribers=false` for batch uploads unless Masala chooses otherwise.

Risks/blockers:
- OAuth consent-screen verification/audit.
- Quota variance and daily limits.
- Channel/account safety if a bug publishes the wrong visibility.

Sources:
- `https://developers.google.com/youtube/v3/docs/videos/insert`
- `https://developers.google.com/youtube/v3/determine_quota_cost`

### TikTok

**Feasibility: medium, but audit/app-review heavy.**

Official route:
- TikTok Content Posting API supports Direct Post after app registration and `video.publish` scope approval.
- Flow: query creator info, initialize publish request, upload/pull video, poll async status.
- TikTok docs explicitly say unaudited clients’ content is restricted to private viewing mode until audit.
- Each user access token is limited to 6 requests/minute for init calls per current docs.
- TikTok requires explicit consent/UX guidelines and creator privacy options from `creator_info/query`.
- Direct Post request supports `is_aigc` / `is_ai_generated` style labeling for AI-generated content; use platform’s current field name from live docs at implementation time.

Recommended mode:
1. Keep TikTok as manual upload bundles now.
2. Build TikTok-ready metadata in Dispatch: caption <= platform limit, hashtags, cover timestamp, duet/stitch/comment settings, AI-generated flag.
3. Later, create a TikTok developer app and test private-only posts.
4. Only after successful audit and Masala approval, allow public API posting.

Risks/blockers:
- App review/audit can delay direct public posting.
- Privacy-level options vary by creator account and must be queried fresh.
- Upload URLs/status are async and time-bound.
- TikTok is stricter about UX consent and synthetic-content disclosure.

Sources:
- `https://developers.tiktok.com/doc/content-posting-api-get-started`
- `https://developers.tiktok.com/doc/content-posting-api-reference-direct-post`

### X / Twitter

**Feasibility: medium for text, uncertain/possibly costly for media.**

Official route:
- X API v2 can create posts/tweets for authorized users.
- Media upload access has historically been separate from v2 post creation and has changed over time; verify live X docs and plan before coding.
- Pricing/access tiers have been volatile. Do not assume a free write tier or cheap media posting.

Recommended mode:
1. Start with **manual X copy exports**: single post, thread, quote-card image, and link strategy.
2. If Masala wants X automation, first confirm paid tier/pricing, media upload availability, and rate limits from the active X developer account.
3. Implement text-only posting before video media posting.
4. Keep link-containing posts separate because X pricing/rate policy may treat them differently.

Risks/blockers:
- Cost and API-tier uncertainty.
- Media upload endpoint/access uncertainty.
- X policy/rate limits change frequently.
- Posting too much low-context clip spam can hurt account reputation.

Practical stance:
- X is good for “Rex drafted a thread from this clip” and “manual post kit”.
- X should not be the first autonomous connector.

Sources to verify at implementation:
- `https://docs.x.com/`
- X developer portal for Masala’s account/tier details.

## Auth and token storage safety

### Setup

- Setup must be owner-initiated from a local admin-only page or terminal session, not chat.
- Show a stream-safety warning before OAuth pages.
- Use separate provider apps/projects for development vs production.
- Use least-privilege scopes:
  - YouTube: start with `youtube.upload` only.
  - TikTok: `video.publish` only when needed.
  - X: write scopes only; do not request read/DM scopes unless there is a clear feature.

### Storage

Preferred order:
1. Environment variables for client IDs/secrets, not committed.
2. Encrypted local token store for refresh tokens, with file permissions `0600`.
3. Future: OS keyring or OpenClaw-managed secrets if available.

Never store:
- Access tokens in `data/vibe-zone.json`.
- Tokens in upload-card markdown.
- OAuth codes in logs.
- Full API responses that include secrets.

### Logging

- Redact `Authorization`, `access_token`, `refresh_token`, `client_secret`, `code`, cookies, and signed upload URLs.
- Audit logs should contain provider, action, dispatch item ID, external post ID, status, and safe error categories only.

## Manual-review vs autonomous modes

### Mode 0 — Export only (current safest default)

- Rex creates render + upload card.
- Masala uploads manually.
- Vibe Zone records `approved_manual_upload` / `posted_manual` after owner action.

### Mode 1 — Assisted scheduling, no API writes

- Rex proposes calendar slots and platform-specific variants.
- UI highlights missing fields and owner approval requirements.
- Still no external calls.

### Mode 2 — Private API upload

- API connectors can upload private/unlisted drafts only.
- Owner manually flips visibility on platform.
- Best first production-like test for YouTube/TikTok.

### Mode 3 — Owner-approved public API publish

- Per-item approval required.
- Queue enforces caps.
- Public visibility allowed only for approved platforms and verified/audited apps.

### Mode 4 — True autonomous posting

Only consider after weeks of clean operation.
Requirements:
- Explicit written Masala approval for platform(s), cadence, content types, and emergency stop.
- Kill switch in UI and config.
- Daily digest of what posted, what failed, and what is queued.
- Max posts/day below platform caps.
- Automatic stop on repeated failures, policy errors, or owner negative feedback.

## Rate-limit and cadence policy

Set internal caps below platform limits:

- YouTube: start at 1–3 uploads/day until quota and channel effects are understood.
- TikTok: start at 1–3 posts/day; never approach TikTok’s direct-post cap.
- X: start at 1–5 posts/day depending on account strategy; prefer quality threads over clip spam.

Queue behavior:
- Serialize external writes by provider.
- Respect `Retry-After` and provider reset headers.
- Use exponential backoff for 429/5xx.
- Do not retry non-idempotent upload finalization blindly; store provider publish IDs and check status first.
- Stop on auth errors until owner reconnects.

## First implementation slice

1. Add Dispatch Queue UI page from existing export bundles.
2. Add platform metadata editor: title, post text, description, hashtags, thumbnail, AI-generated flag, target platform.
3. Add owner approval state, but no external posting.
4. Add `connectors/README.md` explaining future provider interfaces and safety gates.
5. Add YouTube private-upload connector stub that only validates config and refuses to post unless explicitly enabled.
6. Add tests for “connector refuses without approval/token/platform enabled”.

## Open blockers before real posting

- Masala must explicitly approve account connection and API setup.
- Need platform developer accounts/apps and OAuth consent setup.
- Need a secret storage decision.
- Need UI copy for stream-safe setup warnings.
- Need live verification of X pricing/media-upload access.
- Need live quota check for YouTube upload cost because docs/search results conflict across time.
