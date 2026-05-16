# Posting Credentials Readiness

Status: Vibe Zone is now prepared to accept connector credentials once Masala approves the first live-posting pass.

## What is ready locally

- Local dispatch queue has upload-ready assets and owner-gated statuses.
- AiToEarn-inspired posting map is in Social Dashboard: Monetize / Publish / Engage / Create.
- Platform lanes are modeled for TikTok, YouTube, X, Instagram, Facebook, Threads, LinkedIn, Pinterest, and later Rednote/CN channels.
- Server exposes `/api/posting/readiness` with:
  - approved asset count
  - connector list
  - platform limits/validation warnings
  - required credential names
- Posting remains disabled until credentials are deliberately connected and the first post per platform is approved.

## Credential options

### Fastest route: AiToEarn relay/API

Useful if we want to lean on AiToEarn's hosted relay/MCP/marketplace workflow.

Needed:
- `AITOEARN_API_KEY`
- Correct environment: `aitoearn.ai` international or `aitoearn.cn` China

Notes:
- Do not paste API keys into livestream/chat.
- Store via the eventual secure connector screen or an environment file outside git.

### Direct official platform connectors

#### YouTube
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

#### TikTok
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- owner-approved OAuth/session depending on Content Posting API availability

#### X / Twitter
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_SECRET`

#### Instagram / Facebook / Threads
- `META_APP_ID`
- `META_APP_SECRET`
- `META_LONG_LIVED_TOKEN`
- connected Page / IG business assets

#### LinkedIn
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REFRESH_TOKEN`

#### Pinterest
- `PINTEREST_ACCESS_TOKEN`

## Recommended connection order

1. YouTube first — safest for controlled Shorts upload workflow.
2. TikTok second — primary quantity test lane.
3. X third — text + clip build-in-public reports.
4. Meta / Instagram after we have repeatable copy and safe-zone checks.
5. LinkedIn/Pinterest once we have evergreen clips and product lessons.
6. AiToEarn API can be tested at any point if Masala wants relay/marketplace functionality.

## First live-post safety gate

Before the first real post on each platform:

1. Validate title/description/hashtags against platform limits.
2. Confirm render file and upload bundle exist.
3. Owner watches final asset once.
4. Owner approves the exact platform + caption + file.
5. Post one item only.
6. Verify resulting URL and mark it posted manually/automatically in Vibe Zone.
