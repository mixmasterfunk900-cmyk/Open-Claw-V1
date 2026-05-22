# Social Connections Workflow

Goal: give Vibe Zone a VidIQ-style “Connect socials” page that opens provider OAuth in Masala's browser through the public tunnel/local app, then returns to Vibe Zone.

## Added workflow

- New UI page: **Social Connections**
- API endpoints:
  - `GET /api/social/connections`
  - `POST /api/social/connect/:provider/start`
  - `POST /api/social/connect/:provider/disconnect`
  - `GET /api/social/callback/:provider`
- Connection cards for:
  - TikTok
  - YouTube
  - X / Twitter
  - Instagram / Facebook / Threads via Meta
  - LinkedIn
  - Pinterest
- Callback URL is generated from `VIBE_ZONE_PUBLIC_URL` or `PUBLIC_BASE_URL`, falling back to `http://127.0.0.1:8787`.

## Important safety note

This is the OAuth shell/connection workflow, not unrestricted posting.

Current callback records `oauth_approved` when a provider returns an OAuth code. Token exchange/storage is intentionally still gated so we do not silently store powerful publishing tokens before the exact security/storage plan is approved.

Posting must remain owner-approved until all of these are true:

1. Provider app is configured.
2. OAuth code exchange is implemented for that provider.
3. Tokens are stored securely outside git/chat/stream.
4. First post uses an explicit approval gate.
5. Result URL is verified and written back to Vibe Zone.

## Environment variables

Set the public tunnel URL:

```bash
VIBE_ZONE_PUBLIC_URL=https://your-tunnel-url.example
```

Provider app config:

### TikTok

```bash
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
```

Callback to add in TikTok developer app:

```text
${VIBE_ZONE_PUBLIC_URL}/api/social/callback/tiktok
```

Requested scopes:

- `user.info.basic`
- `video.upload`
- `video.publish`

TikTok direct/public posting may require app review. We can still use this workflow for OAuth setup and owner-gated draft/private upload testing first.

### YouTube

```bash
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
```

Callback:

```text
${VIBE_ZONE_PUBLIC_URL}/api/social/callback/youtube
```

### X / Twitter

```bash
X_API_KEY=...
X_API_SECRET=...
```

X OAuth depends on chosen API tier; the UI lists it but full redirect implementation is provider-specific.

### Meta / Instagram / Facebook / Threads

```bash
META_APP_ID=...
META_APP_SECRET=...
```

Callback:

```text
${VIBE_ZONE_PUBLIC_URL}/api/social/callback/meta
```

### LinkedIn

```bash
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

### Pinterest

```bash
PINTEREST_CLIENT_ID=...
PINTEREST_CLIENT_SECRET=...
```

## Next implementation slice

1. Add encrypted token store / local secrets file path.
2. Implement TikTok code exchange first.
3. Add TikTok creator-info check and private/draft upload test.
4. Add first-post approval gate in Social Dashboard.
5. Only then enable public direct publish.
