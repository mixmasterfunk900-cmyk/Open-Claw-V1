import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream/promises'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAss as buildNormalizedAss, buildShortWordEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataDir = path.join(root, 'data')
const dbPath = path.join(dataDir, 'vibe-zone.json')
const validationCachePath = path.join(dataDir, 'media-validation-cache.json')
const port = Number(process.env.PORT || 8787)
const localYtDlp = path.join(root, '.venv-media', 'bin', 'yt-dlp')
const localWhisper = '/root/.openclaw/workspace/.venv-transcribe/bin/whisper'
const youtubeBotBlockPattern = /sign in to confirm you.?re not a bot|use --cookies|cookies-from-browser/i
const mediaDirs = ['media/downloads', 'media/transcripts', 'media/renders', 'media/exports', 'media/thumbnails']
let validationCache = null
const validationRuns = new Map()

const defaultDb = {
  settings: {
    channelUrl: 'https://www.youtube.com/@ModernResponsibility',
    streamSafeMode: true,
    clipStrategy: 'Quantity-first: produce many clips, let TikTok performance filter winners for YouTube, then turn proven YouTube winners into X/Twitter posts.',
    thumbnailStyle: 'Hyper-realistic face-led thumbnails once Masala reference images are provided and approved; GothamChess-inspired contrast/composition.',
    productAngle: 'Vibe Zone/HQ can become a monthly product for upcoming streamers.',
    localModel: 'Ollama fallback: prefer qwen2.5:1.5b-instruct for rough drafts/classification/chat simulation, llama3.2:1b for tiny fallback work; deterministic templates remain available if Ollama is offline.',
    guardrails: ['No logins or account cookies', 'No external posting', 'No secrets displayed', 'Local JSON storage only', 'AI practice chat is always labelled transparent simulation'],
  },
  scans: [],
  videos: [],
  transcripts: [],
  clips: [],
  dispatchItems: [],
  postResults: [],
  platformProfiles: [
    { id: 'tiktok', label: 'TikTok', stage: 'ready', format: '9:16 short + caption + hashtags', note: 'Primary quantity test lane.' },
    { id: 'youtube', label: 'YouTube Shorts', stage: 'ready', format: '9:16 short + title/description/tags', note: 'Promote TikTok winners and stream highlights.' },
    { id: 'x', label: 'X / Twitter', stage: 'draft', format: 'build-in-public post + optional clip', note: 'Turn proven clips into lessons/reports.' },
    { id: 'instagram', label: 'Instagram Reels', stage: 'draft', format: '9:16 reel + short caption', note: 'Reuse short bundle after safe-zone check.' },
    { id: 'threads', label: 'Threads', stage: 'planned', format: 'short lesson thread', note: 'Repurpose X copy once tone is locked.' },
    { id: 'linkedin', label: 'LinkedIn', stage: 'planned', format: 'creator/business lesson', note: 'Post product-building takeaways, not memes.' },
    { id: 'facebook', label: 'Facebook', stage: 'planned', format: 'reel/video post', note: 'Later cross-post lane.' },
    { id: 'pinterest', label: 'Pinterest', stage: 'planned', format: 'thumbnail/pin + link', note: 'Useful for evergreen tutorials.' },
    { id: 'rednote', label: 'Rednote / Xiaohongshu', stage: 'planned', format: 'vertical video + notes', note: 'Hold until account/market strategy exists.' },
  ],
  scheduleItems: [
    { id: 'morning-upload', label: 'Morning upload candidate', cadence: 'Daily first slot', status: 'ready' },
    { id: 'lunch-experiment', label: 'Lunch experiment slot', cadence: 'Optional second short', status: 'draft' },
    { id: 'evening-recap', label: 'Evening stream recap', cadence: 'After stream', status: 'draft' },
    { id: 'next-day-winner', label: 'Next-day winner repost', cadence: 'Promote proven winner', status: 'planned' },
  ],
  engagementTasks: [
    { id: 'comment-intent', label: 'Comment intent finder', mode: 'draft-only', status: 'ready' },
    { id: 'reply-drafts', label: 'Reply draft writer', mode: 'draft-only', status: 'ready' },
    { id: 'brand-watcher', label: 'Brand mention watcher', mode: 'manual-review', status: 'planned' },
    { id: 'link-detector', label: 'High-conversion “link?” detector', mode: 'draft-only', status: 'planned' },
  ],
  monetizationOffers: [
    { id: 'cpm', model: 'CPM', label: 'Views/reach tracking', status: 'tracking' },
    { id: 'cpe', model: 'CPE', label: 'Comments/saves/clicks', status: 'planned' },
    { id: 'cps', model: 'CPS', label: 'Deal/link attribution', status: 'planned' },
  ],
  socialConnectionState: {},
  twitterRadar: {
    status: 'draft-only',
    mode: 'topic-mvp',
    lastScanAt: null,
    topics: ['AI agents', 'build in public', 'creator tools', 'indie hacking', 'livestreaming', 'content automation', 'vibe coding'],
    watchAccounts: [
      { handle: 'openai', displayName: 'OpenAI', tier: 'A', topicTags: ['AI agents', 'creator tools'], sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true },
      { handle: 'AnthropicAI', displayName: 'Anthropic', tier: 'A', topicTags: ['AI agents'], sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true },
      { handle: 'levelsio', displayName: 'Pieter Levels', tier: 'A', topicTags: ['indie hacking', 'build in public'], sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true },
      { handle: 'ycombinator', displayName: 'Y Combinator', tier: 'B', topicTags: ['startups', 'creator tools'], sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true },
      { handle: 'vercel', displayName: 'Vercel', tier: 'B', topicTags: ['developer tools', 'vibe coding'], sourceMode: 'manual_search', lastSeenTweetId: null, lastSeenAt: null, enabled: true },
    ],
    sourceAdapters: [
      { id: 'manual_x_search', label: 'Manual X search openings', status: 'enabled', latencyClass: 'human-refresh', requiresCredentials: false, termsRisk: 'low', minPollIntervalMs: 7200000, capability: 'watchlist + topic links only', note: 'Creates exact X search links and local reply cards. No fetching, scraping, login, or posting.' },
      { id: 'public_web_search', label: 'Public web/search discovery', status: 'research-ready', latencyClass: 'delayed-public-web', requiresCredentials: false, termsRisk: 'low', minPollIntervalMs: 7200000, capability: 'topic discovery', note: 'Safe broad discovery, but incomplete and not suitable for second-level alerts.' },
      { id: 'rss_provider', label: 'RSS/provider profile feeds', status: 'approval-needed', latencyClass: 'near-real-time-provider', requiresCredentials: false, termsRisk: 'medium', minPollIntervalMs: 900000, capability: 'profile/list feeds if provider terms allow', note: 'Could improve latency if Masala approves a provider; still not guaranteed seconds.' },
      { id: 'x_api_filtered_stream', label: 'Official X filtered stream', status: 'blocked-credentials', latencyClass: 'real-time-api', requiresCredentials: true, termsRisk: 'low', minPollIntervalMs: 0, capability: 'true account stream when paid/API access exists', note: 'Only clean path to seconds-level alerts; intentionally disabled.' },
      { id: 'browser_monitor', label: 'Logged-in browser monitor', status: 'blocked-approval', latencyClass: 'near-real-time-browser', requiresCredentials: true, termsRisk: 'high', minPollIntervalMs: 300000, capability: 'tiny approved watchlists only', note: 'Not enabled; would require explicit approval and stop-on-challenge behavior.' },
    ],
    workerLanes: [
      { id: 'source-scout', label: 'Radar Source Scout', status: 'active', focus: 'Find no-API/low-risk sources and latency limits.' },
      { id: 'backend-builder', label: 'Watchlist Backend Builder', status: 'active', focus: 'Maintain local watchlist/source contracts and last-seen fields.' },
      { id: 'ui-builder', label: 'Radar UI Builder', status: 'active', focus: 'Expose priority openings, source health, and manual reply cards.' },
      { id: 'qa-coordinator', label: 'QA Coordinator', status: 'active', focus: 'Run build/tests and enforce no-post/no-scrape guardrails.' },
    ],
    items: [],
  },
  postingConnectors: [
    { id: 'aitoearn', label: 'AiToEarn / relay', platforms: ['tiktok', 'youtube', 'x', 'instagram', 'facebook', 'threads', 'linkedin', 'pinterest'], mode: 'optional-relay', status: 'credentials-needed', requiredSecrets: ['AITOEARN_API_KEY'], note: 'Optional fastest route for marketplace/relay/MCP workflows.' },
    { id: 'youtube', label: 'YouTube', platforms: ['youtube'], mode: 'official-api', status: 'credentials-needed', requiredSecrets: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'], note: 'Use for Shorts/video upload after OAuth approval.' },
    { id: 'tiktok', label: 'TikTok', platforms: ['tiktok'], mode: 'official-api-or-browser-session', status: 'credentials-needed', requiredSecrets: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'], note: 'Prefer official Content Posting API where available; otherwise owner-approved browser session.' },
    { id: 'x', label: 'X / Twitter', platforms: ['x'], mode: 'official-api', status: 'credentials-needed', requiredSecrets: ['X_CLIENT_ID', 'X_CLIENT_SECRET'], note: 'Needed for build-in-public posts and clip attachments. OAuth stores tokens locally after browser approval.' },
    { id: 'meta', label: 'Instagram / Facebook / Threads', platforms: ['instagram', 'facebook', 'threads'], mode: 'meta-graph-api', status: 'credentials-needed', requiredSecrets: ['META_APP_ID', 'META_APP_SECRET', 'META_LONG_LIVED_TOKEN'], note: 'Requires connected pages/business assets for publishing.' },
    { id: 'linkedin', label: 'LinkedIn', platforms: ['linkedin'], mode: 'official-api', status: 'credentials-needed', requiredSecrets: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REFRESH_TOKEN'], note: 'Useful for product-building lessons.' },
    { id: 'pinterest', label: 'Pinterest', platforms: ['pinterest'], mode: 'official-api', status: 'credentials-needed', requiredSecrets: ['PINTEREST_ACCESS_TOKEN'], note: 'Evergreen tutorial/thumbnail pin lane.' },
  ],
  mediaJobs: [],
  viralFinds: [],
  chatMessages: [],
  jobs: [],
}

async function loadDb() {
  await mkdir(dataDir, { recursive: true })
  try {
    const stored = JSON.parse(await readFile(dbPath, 'utf8'))
    const normalized = normalizeDb({ ...defaultDb, ...stored })
    if (!Array.isArray(stored.dispatchItems)) await saveDb(normalized)
    return normalized
  } catch {
    await saveDb(defaultDb)
    return normalizeDb(structuredClone(defaultDb))
  }
}
async function saveDb(db) { await writeFile(dbPath, JSON.stringify(db, null, 2)) }
const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
async function ensureMediaDirs() {
  await Promise.all(mediaDirs.map((dir) => mkdir(path.join(root, dir), { recursive: true })))
}
async function addJob(db, type, title, status = 'done', detail = '') {
  const job = { id: id('job'), type, title, status, detail, createdAt: new Date().toISOString() }
  db.jobs.unshift(job)
  db.jobs = db.jobs.slice(0, 80)
  return job
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers })
  res.end(JSON.stringify(body))
}


async function listFilesRecursive(relativeDir, maxDepth = 1, depth = 0) {
  const absoluteDir = path.join(root, relativeDir)
  const entries = await readdir(absoluteDir, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDir, entry.name)
    if (entry.isDirectory()) {
      if (depth < maxDepth) files.push(...await listFilesRecursive(relativePath, maxDepth, depth + 1))
      continue
    }
    if (!entry.isFile()) continue
    const absolutePath = path.join(root, relativePath)
    const info = await stat(absolutePath).catch(() => null)
    if (info?.isFile()) files.push({ name: entry.name, relativePath, info })
  }
  return files
}

async function listMediaFiles() {
  await ensureMediaDirs()
  const groups = [
    { kind: 'source', dir: 'media/downloads', depth: 0 },
    { kind: 'transcript', dir: 'media/transcripts', depth: 0 },
    { kind: 'render', dir: 'media/renders', depth: 0 },
    { kind: 'export', dir: 'media/exports', depth: 4 },
    { kind: 'concept', dir: 'media/practice', depth: 4 },
  ]
  const files = []
  for (const group of groups) {
    for (const file of await listFilesRecursive(group.dir, group.depth)) {
      files.push({
        name: file.name,
        kind: group.kind,
        path: file.relativePath,
        url: `/${file.relativePath}`,
        size: file.info.size,
        updatedAt: file.info.mtime.toISOString(),
        ...(group.kind === 'source' ? { validation: await validateMediaFile(file.relativePath, file.info) } : {}),
      })
    }
  }
  return files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function isVideoLike(relativePath) {
  return ['.mp4', '.mov', '.mkv', '.webm', '.m4v'].includes(path.extname(relativePath).toLowerCase())
}
async function loadValidationCache() {
  if (validationCache) return validationCache
  try {
    const stored = JSON.parse(await readFile(validationCachePath, 'utf8'))
    validationCache = { version: 1, entries: stored.entries && typeof stored.entries === 'object' ? stored.entries : {} }
  } catch {
    validationCache = { version: 1, entries: {} }
  }
  return validationCache
}
async function saveValidationCache(cache) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(validationCachePath, JSON.stringify(cache, null, 2))
}
async function mediaValidationFingerprint(relativePath, info) {
  const absolutePath = path.resolve(root, relativePath)
  const fileInfo = info || await stat(absolutePath)
  return {
    key: `${relativePath}|${fileInfo.size}|${Math.round(fileInfo.mtimeMs)}`,
    pathPrefix: `${relativePath}|`,
    size: fileInfo.size,
    mtimeMs: Math.round(fileInfo.mtimeMs),
  }
}
async function ffprobeDuration(relativePath) {
  const absolutePath = path.resolve(root, relativePath)
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', absolutePath], { timeout: 7000 })
  const duration = Number(stdout.trim())
  return Number.isFinite(duration) ? duration : null
}
async function ffprobeLastVideoPacket(relativePath) {
  const absolutePath = path.resolve(root, relativePath)
  try {
    const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', absolutePath], { timeout: 15000, maxBuffer: 1024 * 1024 * 128 })
    return Number(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1)) || null
  } catch (error) {
    const stdout = String(error.stdout || '')
    return Number(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1)) || null
  }
}
async function probeMediaFile(relativePath) {
  try {
    const durationSeconds = await ffprobeDuration(relativePath)
    const lastPacketSeconds = await ffprobeLastVideoPacket(relativePath)
    if (!durationSeconds) return { status: 'unknown', detail: 'ffprobe could not read media duration.' }
    if (!lastPacketSeconds) return { status: 'unknown', durationSeconds, detail: `Metadata duration ${stamp(durationSeconds)}, but packet scan did not return video timestamps.` }
    const gapSeconds = durationSeconds - lastPacketSeconds
    if (gapSeconds > 120 && lastPacketSeconds < durationSeconds * 0.9) {
      return { status: 'partial', durationSeconds, lastPacketSeconds, detail: `Metadata says ${stamp(durationSeconds)}, but decodable video reaches ${stamp(lastPacketSeconds)}. Import a complete newest-stream source before rendering later moments.` }
    }
    return { status: 'complete', durationSeconds, lastPacketSeconds, detail: `Validated playable through ${stamp(lastPacketSeconds)} of ${stamp(durationSeconds)}.` }
  } catch (error) {
    return { status: 'unknown', detail: `Validation unavailable: ${error.message}` }
  }
}
async function validateMediaFile(relativePath, info = null) {
  if (!isVideoLike(relativePath)) return { status: 'unknown', detail: 'Audio/source file; video duration validation not applied.', cacheStatus: 'not-applicable' }
  const fingerprint = await mediaValidationFingerprint(relativePath, info)
  const cache = await loadValidationCache()
  const cached = cache.entries[fingerprint.key]
  if (cached) return { ...cached, cacheStatus: 'reused' }
  if (validationRuns.has(fingerprint.key)) return validationRuns.get(fingerprint.key)
  const run = (async () => {
    const validation = { ...(await probeMediaFile(relativePath)), validatedAt: new Date().toISOString(), cacheStatus: 'fresh' }
    const latestCache = await loadValidationCache()
    for (const key of Object.keys(latestCache.entries)) {
      if (key.startsWith(fingerprint.pathPrefix) && key !== fingerprint.key) delete latestCache.entries[key]
    }
    latestCache.entries[fingerprint.key] = validation
    await saveValidationCache(latestCache)
    return validation
  })().finally(() => validationRuns.delete(fingerprint.key))
  validationRuns.set(fingerprint.key, run)
  return run
}
const publicBaseUrl = () => String(process.env.VIBE_ZONE_PUBLIC_URL || process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '')
const hasEnv = (name) => Boolean(process.env[name])
const envValue = (name, aliases = []) => [name, ...aliases].map((key) => process.env[key]).find(Boolean) || ''
const missingRequiredEnv = (config) => config.requiredEnv.filter((name) => !envValue(name, config.envAliases?.[name] || []))
const base64Url = (input) => Buffer.from(input).toString('base64url')
const providerConfigs = {
  tiktok: {
    label: 'TikTok', platform: 'tiktok', provider: 'TikTok Content Posting API', mode: 'OAuth 2.0 + Content Posting API',
    scopes: ['user.info.basic', 'video.upload', 'video.publish'], requiredEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    authBase: 'https://www.tiktok.com/v2/auth/authorize/', clientEnv: 'TIKTOK_CLIENT_KEY', note: 'Primary short-form lane. Public direct posting may require TikTok app review; private/draft upload can be tested first.',
  },
  youtube: {
    label: 'YouTube', platform: 'youtube', provider: 'Google OAuth', mode: 'OAuth 2.0 + YouTube Data API',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'], requiredEnv: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
    authBase: 'https://accounts.google.com/o/oauth2/v2/auth', clientEnv: 'YOUTUBE_CLIENT_ID', note: 'Shorts/video upload lane. Requires Google OAuth consent setup.',
  },
  x: {
    label: 'X / Twitter', platform: 'x', provider: 'X API', mode: 'OAuth 2.0 + X API',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'], requiredEnv: ['X_CLIENT_ID', 'X_CLIENT_SECRET'],
    envAliases: { X_CLIENT_ID: ['X_API_KEY'], X_CLIENT_SECRET: ['X_API_SECRET'] },
    authBase: 'https://x.com/i/oauth2/authorize', tokenUrl: 'https://api.x.com/2/oauth2/token', meUrl: 'https://api.x.com/2/users/me?user.fields=username,name,profile_image_url', clientEnv: 'X_CLIENT_ID', clientEnvAliases: ['X_API_KEY'], clientSecretEnv: 'X_CLIENT_SECRET', clientSecretEnvAliases: ['X_API_SECRET'], scopeSeparator: ' ', usesPkce: true,
    note: 'Build-in-public posts and clip attachments. Requires an X developer app, public tunnel callback, and owner-approved posting gate.',
  },
  meta: {
    label: 'Instagram / Facebook / Threads', platform: 'meta', provider: 'Meta Graph API', mode: 'OAuth 2.0 + Graph API',
    scopes: ['pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'], requiredEnv: ['META_APP_ID', 'META_APP_SECRET'],
    authBase: 'https://www.facebook.com/v20.0/dialog/oauth', clientEnv: 'META_APP_ID', note: 'Connects Meta assets for Reels/Page publishing. Needs page/business account selection after OAuth.',
  },
  linkedin: {
    label: 'LinkedIn', platform: 'linkedin', provider: 'LinkedIn API', mode: 'OAuth 2.0',
    scopes: ['openid', 'profile', 'w_member_social'], requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    authBase: 'https://www.linkedin.com/oauth/v2/authorization', clientEnv: 'LINKEDIN_CLIENT_ID', note: 'Product-building lesson lane after TikTok/YouTube/X are stable.',
  },
  pinterest: {
    label: 'Pinterest', platform: 'pinterest', provider: 'Pinterest API', mode: 'OAuth 2.0',
    scopes: ['boards:read', 'pins:read', 'pins:write'], requiredEnv: ['PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET'],
    authBase: 'https://www.pinterest.com/oauth/', clientEnv: 'PINTEREST_CLIENT_ID', note: 'Evergreen tutorial/pin lane.',
  },
}
function socialCallbackUrl(providerId) { return `${publicBaseUrl()}/api/social/callback/${providerId}` }
function socialConnections(db) {
  const state = db.socialConnectionState || {}
  return Object.entries(providerConfigs).map(([id, config]) => {
    const connected = state[id]?.connected === true
    const oauthApproved = state[id]?.oauthApproved === true
    const missingConfig = missingRequiredEnv(config)
    return {
      id,
      label: config.label,
      platform: config.platform,
      provider: config.provider,
      status: connected ? 'connected' : state[id]?.manualLinked ? 'manual_linked' : oauthApproved ? 'oauth_approved' : missingConfig.length ? 'needs_app_config' : config.authBase ? 'ready_to_connect' : 'planned',
      scopes: config.scopes,
      mode: config.mode,
      callbackUrl: socialCallbackUrl(id),
      connectedAt: state[id]?.connectedAt || '',
      accountLabel: state[id]?.accountLabel || '',
      manualUrl: state[id]?.manualUrl || '',
      missingConfig,
      note: config.note,
    }
  })
}
function buildOAuthUrl(providerId, db) {
  const config = providerConfigs[providerId]
  if (!config) return { status: 404, body: { error: 'Unknown social provider.' } }
  const missingConfig = missingRequiredEnv(config)
  if (missingConfig.length) return { status: 400, body: { status: 'needs_app_config', message: `Set ${missingConfig.join(', ')} and restart Vibe Zone before connecting ${config.label}.`, missingConfig } }
  if (!config.authBase) return { status: 400, body: { status: 'planned', message: `${config.label} needs a provider-specific OAuth implementation before browser login can start.` } }
  const state = randomUUID()
  const codeVerifier = config.usesPkce ? base64Url(randomBytes(32)) : ''
  const codeChallenge = codeVerifier ? createHash('sha256').update(codeVerifier).digest('base64url') : ''
  db.socialConnectionState = db.socialConnectionState || {}
  db.socialConnectionState[providerId] = { ...(db.socialConnectionState[providerId] || {}), pendingState: state, pendingCodeVerifier: codeVerifier, pendingAt: new Date().toISOString() }
  const params = new URLSearchParams()
  params.set('response_type', 'code')
  params.set('client_id', envValue(config.clientEnv, config.clientEnvAliases || []))
  params.set('redirect_uri', socialCallbackUrl(providerId))
  params.set('scope', config.scopes.join(config.scopeSeparator || (providerId === 'youtube' ? ' ' : ',')))
  params.set('state', state)
  if (codeChallenge) { params.set('code_challenge', codeChallenge); params.set('code_challenge_method', 'S256') }
  if (providerId === 'youtube') { params.set('access_type', 'offline'); params.set('prompt', 'consent') }
  return { status: 200, body: { status: 'opening_oauth', authUrl: `${config.authBase}?${params.toString()}`, message: `Opening ${config.label} login. Approve the permissions, then return to Vibe Zone.` } }
}

async function exchangeXOAuthCode(db, code) {
  const config = providerConfigs.x
  const clientId = envValue(config.clientEnv, config.clientEnvAliases || [])
  const clientSecret = envValue(config.clientSecretEnv, config.clientSecretEnvAliases || [])
  const codeVerifier = db.socialConnectionState?.x?.pendingCodeVerifier || ''
  if (!clientId || !clientSecret) throw new Error('X OAuth client id/secret are not configured.')
  if (!codeVerifier) throw new Error('Missing X PKCE verifier. Start the connection from Vibe Zone again.')

  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', socialCallbackUrl('x'))
  body.set('code_verifier', codeVerifier)

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body,
  })
  const tokenData = await tokenResponse.json().catch(() => ({}))
  if (!tokenResponse.ok) throw new Error(`X token exchange failed: ${tokenData.error_description || tokenData.error || tokenResponse.status}`)
  const accessToken = tokenData.access_token || ''
  let profile = null
  if (accessToken) {
    const profileResponse = await fetch(config.meUrl, { headers: { authorization: `Bearer ${accessToken}` } })
    profile = await profileResponse.json().catch(() => null)
  }
  const user = profile?.data || {}
  return {
    connected: true,
    oauthApproved: true,
    connectedAt: new Date().toISOString(),
    accountLabel: user.username ? `@${user.username}` : 'X OAuth connected',
    accountName: user.name || '',
    accountId: user.id || '',
    tokenType: tokenData.token_type || 'bearer',
    scopes: String(tokenData.scope || '').split(/\s+/).filter(Boolean),
    accessToken,
    refreshToken: tokenData.refresh_token || '',
    expiresAt: tokenData.expires_in ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString() : '',
  }
}
async function appState(db) {
  const mediaFiles = await listMediaFiles()
  return { ...db, mediaFiles, importReadiness: localImportReadiness(db, mediaFiles), postingReadiness: postingReadiness(db), socialConnections: socialConnections(db) }
}
const platformLimits = {
  tiktok: { title: 150, description: 2200, hashtags: 20, videoMaxMb: 4096 },
  youtube: { title: 100, description: 5000, tags: 500, videoMaxMb: 256000 },
  x: { title: 280, description: 280, hashtags: 6, videoMaxMb: 512 },
  instagram: { title: 2200, description: 2200, hashtags: 30, videoMaxMb: 4096 },
  facebook: { title: 255, description: 63206, hashtags: 30, videoMaxMb: 10240 },
  threads: { title: 500, description: 500, hashtags: 10, videoMaxMb: 4096 },
  linkedin: { title: 3000, description: 3000, hashtags: 10, videoMaxMb: 5120 },
  pinterest: { title: 100, description: 800, hashtags: 20, videoMaxMb: 2048 },
  rednote: { title: 20, description: 1000, hashtags: 10, videoMaxMb: 2048 },
}
function platformLimit(platform) {
  return platformLimits[platform] || platformLimits.tiktok
}
function dispatchCopyForValidation(item = {}, clip = null) {
  return {
    title: item.title || clip?.seo?.youtubeTitle || clip?.title || '',
    description: clip?.seo?.description || clip?.seo?.tiktokDescription || clip?.caption || item.title || '',
    hashtags: Array.isArray(clip?.hashtags) ? clip.hashtags : [],
    tags: Array.isArray(clip?.seo?.tags) ? clip.seo.tags : [],
  }
}
function validateDispatchForPlatform(item = {}, clip = null) {
  const platform = item.platform || clip?.platform || 'tiktok'
  const limits = platformLimit(platform)
  const copy = dispatchCopyForValidation(item, clip)
  const warnings = []
  const blockers = []
  if (!item.renderPath) blockers.push('Missing rendered video asset')
  if (!item.exportBundlePath) blockers.push('Missing upload bundle')
  if (copy.title.length > limits.title) warnings.push(`${platform} title is ${copy.title.length}/${limits.title} characters`)
  if (copy.description.length > limits.description) warnings.push(`${platform} description is ${copy.description.length}/${limits.description} characters`)
  if (limits.hashtags && copy.hashtags.length > limits.hashtags) warnings.push(`${platform} has ${copy.hashtags.length}/${limits.hashtags} hashtags`)
  if (limits.tags && copy.tags.join(',').length > limits.tags) warnings.push(`${platform} tags exceed ${limits.tags} characters`)
  if (['x', 'linkedin', 'threads'].includes(platform) && !copy.description) warnings.push(`${platform} needs a native text angle, not just the video file`)
  return { platform, limits, copy, blockers, warnings, ok: !blockers.length && !warnings.length }
}
function postingReadiness(db) {
  const connectors = normalizePostingConnectors(db.postingConnectors)
  const dispatchItems = normalizeDispatchItems(db)
  const clipsById = new Map((db.clips || []).map((clip) => [clip.id, clip]))
  const approved = dispatchItems.filter((item) => item.status === 'approved_manual_upload' && !item.blockers?.length)
  const validations = approved.slice(0, 40).map((item) => ({ id: item.id, title: item.title, ...validateDispatchForPlatform(item, clipsById.get(item.clipId) || null) }))
  const platformsReady = [...new Set(approved.map((item) => item.platform || clipsById.get(item.clipId)?.platform || 'tiktok'))]
  const missingCredentialConnectors = connectors.filter((connector) => connector.status !== 'connected')
  return {
    readyForCredentials: approved.length > 0 && validations.every((item) => !item.blockers.length),
    approvedManualAssets: approved.length,
    platformsReady,
    connectors,
    missingCredentialConnectors,
    platformLimits,
    validations,
    nextCredentialStep: 'Create/store credentials outside chat, then connect one platform at a time starting with YouTube or TikTok.',
    safetyGate: 'Posting remains disabled until owner explicitly provides credentials and approves first live post per platform.',
  }
}
function normalizePostingConnectors(connectors = []) {
  const storedById = new Map((Array.isArray(connectors) ? connectors : []).map((connector) => [connector.id, connector]))
  const merged = defaultDb.postingConnectors.map((defaults) => {
    const stored = storedById.get(defaults.id) || {}
    return { ...defaults, ...stored, requiredSecrets: defaults.requiredSecrets, note: defaults.note, mode: defaults.mode, platforms: defaults.platforms }
  })
  const knownIds = new Set(merged.map((connector) => connector.id))
  return [...merged, ...(Array.isArray(connectors) ? connectors.filter((connector) => connector?.id && !knownIds.has(connector.id)) : [])]
}
function mediaMatchKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
function matchesStreamArtifact(file, stream) {
  if (!file || !stream) return false
  const basename = file.name.replace(/\.[a-z0-9]+$/i, '')
  const fileKey = mediaMatchKey(basename)
  const idKey = mediaMatchKey(stream.id)
  const titleKey = mediaMatchKey(stream.title)
  return Boolean(
    (stream.id && file.name.startsWith(`${stream.id}.`))
    || (idKey && fileKey === idKey)
    || (titleKey && fileKey === titleKey)
  )
}
function findStreamArtifact(mediaFiles, stream, kind) {
  return mediaFiles.find((file) => file.kind === kind && matchesStreamArtifact(file, stream)) || null
}
function findStreamTranscriptText(mediaFiles, stream) {
  return mediaFiles.find((file) => file.kind === 'transcript'
    && /\.txt$/i.test(file.name)
    && matchesStreamArtifact(file, stream)) || null
}
function findStreamCaption(mediaFiles, stream) {
  return mediaFiles.find((file) => file.kind === 'transcript'
    && /\.(srt|vtt|ass)$/i.test(file.name)
    && matchesStreamArtifact(file, stream)) || null
}
function localImportReadiness(db, mediaFiles = []) {
  const latestStream = latestStreamCandidate(db.videos) || null
  const videoId = latestStream?.id || 'VIDEO_ID'
  const expected = {
    source: `media/downloads/${videoId}.mp4`,
    transcript: `media/transcripts/${videoId}.txt`,
    captions: [`media/transcripts/${videoId}.srt`, `media/transcripts/${videoId}.vtt`],
  }
  const latestSource = latestStream ? findStreamArtifact(mediaFiles, latestStream, 'source') : null
  const latestTranscript = latestStream ? findStreamTranscriptText(mediaFiles, latestStream) : null
  const latestCaption = latestStream ? findStreamCaption(mediaFiles, latestStream) : null
  const sourceReady = Boolean(latestSource && latestSource.validation?.status !== 'partial')
  const transcriptReady = Boolean(latestTranscript)
  const captionsReady = Boolean(latestCaption)
  const candidatesReady = Boolean((db.clips || []).some((clip) => clip.transcriptId === videoId || clip.sourceUrl === latestStream?.url))
  const checklist = [
    { id: 'detect', label: 'Newest stream detected', status: latestStream ? 'done' : 'blocked', detail: latestStream ? `${latestStream.title} (${latestStream.id})` : 'Run a public channel scan first.' },
    { id: 'source', label: 'Local source provided', status: sourceReady ? 'done' : 'blocked', detail: sourceReady ? latestSource.path : `Expected ${expected.source}. Do not use cookies; upload/drop a local owner-provided file.` },
    { id: 'transcript', label: 'Transcript imported', status: transcriptReady ? 'done' : sourceReady ? 'next' : 'blocked', detail: transcriptReady ? latestTranscript.path : `Expected ${expected.transcript}; use local Whisper/import after source is present.` },
    { id: 'captions', label: 'Captions ready', status: captionsReady ? 'done' : transcriptReady ? 'next' : 'blocked', detail: captionsReady ? latestCaption.path : `Expected ${expected.captions.join(' or ')} for render review.` },
    { id: 'candidates', label: 'Clip candidates ready', status: candidatesReady ? 'done' : captionsReady ? 'next' : 'blocked', detail: candidatesReady ? 'Newest-stream candidates exist in Clip Factory.' : 'Press “Import local transcript + score” after transcript/captions are present.' },
  ]
  const next = checklist.find((item) => item.status === 'next' || item.status === 'blocked') || checklist.at(-1)
  return {
    latestStream,
    expected,
    found: { source: latestSource, transcript: latestTranscript, caption: latestCaption },
    checklist,
    activeMediaJobs: (db.mediaJobs || []).filter((job) => ['running', 'queued'].includes(job.status)).length,
    nextAction: next?.detail || 'Newest stream local ingest is ready for Clip Factory review.',
    guardrail: 'Local-only handoff: no external posting, cookies, browser logins, or public services.',
  }
}
async function healthState(db) {
  const mediaFiles = await listMediaFiles()
  const importReadiness = localImportReadiness(db, mediaFiles)
  const latestStream = latestStreamCandidate(db.videos) || null
  const latestSource = latestStream ? findStreamArtifact(mediaFiles, latestStream, 'source') : null
  const latestTranscript = latestStream ? findStreamTranscriptText(mediaFiles, latestStream) : null
  const latestCaption = latestStream ? findStreamCaption(mediaFiles, latestStream) : null
  const activeMediaJobs = db.mediaJobs.filter((job) => ['running', 'queued'].includes(job.status))
  const failedMediaJobs = db.mediaJobs.filter((job) => job.status === 'failed').slice(0, 5)
  const blockers = []
  if (!latestStream) blockers.push('No latest stream has been discovered yet; run a public YouTube scan first.')
  if (latestStream && !latestSource) blockers.push(`Newest stream source ${latestStream.id} is missing; upload/drop an owner-provided local source before rendering clips.`)
  if (latestSource?.validation?.status === 'partial') blockers.push(latestSource.validation.detail)
  if (latestStream && latestSource && !latestTranscript) blockers.push(`Newest stream source is present (${latestSource.name}), but transcript ${latestStream.id}.txt is missing; transcribe/import captions before clip scoring or rendering.`)
  if (latestStream && latestSource && latestTranscript && !latestCaption) blockers.push(`Transcript is present, but captions ${latestStream.id}.srt or ${latestStream.id}.vtt are missing; import captions before render review.`)
  if (activeMediaJobs.length) blockers.push(`${activeMediaJobs.length} media job(s) still active.`)
  return {
    ok: blockers.length === 0,
    latestStream,
    latestSource: latestSource || null,
    latestTranscript: latestTranscript || null,
    latestCaption: latestCaption || null,
    importReadiness,
    blockers,
    nextAction: blockers[0] || 'No immediate blocker detected; continue clip review, render presets, Viral Hunter, and dispatch workflow improvements.',
    counts: {
      videos: db.videos.length,
      transcripts: db.transcripts.length,
      clips: db.clips.length,
      mediaJobs: db.mediaJobs.length,
      activeMediaJobs: activeMediaJobs.length,
      failedMediaJobs: failedMediaJobs.length,
      renders: mediaFiles.filter((file) => file.kind === 'render').length,
    },
    activeMediaJobs,
    failedMediaJobs,
    newestMediaJob: db.mediaJobs[0] || null,
  }
}
function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase()
  return ({
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
    '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8', '.json': 'application/json; charset=utf-8', '.tsv': 'text/tab-separated-values; charset=utf-8',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  })[ext] || 'application/octet-stream'
}

function plainTextFromTranscriptPayload(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload.text === 'string') return payload.text
  if (Array.isArray(payload.segments)) {
    return payload.segments
      .map((segment) => String(segment.text || '').trim())
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

async function readTranscriptFile(relativePath) {
  if (!relativePath) return ''
  const absolutePath = path.resolve(root, relativePath)
  if (!absolutePath.startsWith(root + path.sep)) return ''
  const raw = await readFile(absolutePath, 'utf8').catch(() => '')
  if (!raw) return ''
  if (path.extname(relativePath).toLowerCase() === '.json') {
    try { return plainTextFromTranscriptPayload(JSON.parse(raw)) } catch { return raw }
  }
  return raw
}

function inferredLongformTranscriptPath(concept = {}) {
  const key = `${concept.sourceTranscriptId || ''} ${concept.sourceVideoPath || ''} ${concept.sourceTitle || ''}`.toLowerCase()
  if (key.includes('day3') || key.includes('day-3') || key.includes('product-content-machine')) return 'media/transcripts/longform-corrected-20260515/base-clean.json'
  if (key.includes('stream2') || key.includes('stream-2') || key.includes('founder-story')) return 'media/transcripts/longform-corrected-20260515/base-privacy-safe.json'
  return ''
}

async function thumbnailTranscriptDownload(db, url, res) {
  const videoPath = url.searchParams.get('videoPath') || ''
  const conceptId = url.searchParams.get('conceptId') || ''
  const concepts = db.thumbnailConcepts || []
  const concept = concepts.find((item) => conceptId && item.id === conceptId)
    || concepts.find((item) => videoPath && item.sourceVideoPath === videoPath)
  if (!concept) return send(res, 404, { error: 'Thumbnail Lab video transcript not found.' })

  const directTranscript = (db.transcripts || []).find((item) => item.id === concept.sourceTranscriptId)
  const clipTranscriptId = (db.clips || []).find((item) => item.id === concept.sourceTranscriptId || item.id === concept.sourceClipId)?.transcriptId
  const clipTranscript = clipTranscriptId ? (db.transcripts || []).find((item) => item.id === clipTranscriptId) : null
  const text = plainTextFromTranscriptPayload(directTranscript || clipTranscript)
    || await readTranscriptFile(concept.sourceTranscriptPath)
    || await readTranscriptFile(inferredLongformTranscriptPath(concept))
  if (!text.trim()) return send(res, 404, { error: 'Transcript text is not available for this Thumbnail Lab video yet.' })

  const title = (concept.sourceTitle || 'thumbnail-lab-video').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'thumbnail-lab-video'
  const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline'
  res.writeHead(200, {
    'content-type': 'text/plain; charset=utf-8',
    'content-disposition': `${disposition}; filename="${title}-full-transcript.txt"`,
  })
  res.end(text.trim() + '\n')
}

async function serveMedia(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const mediaRoot = path.join(root, 'media')
  const requested = decodeURIComponent(url.pathname.replace(/^\/media\/?/, ''))
  const file = path.resolve(mediaRoot, requested)
  if (!file.startsWith(mediaRoot + path.sep)) return send(res, 403, { error: 'Forbidden media path' })
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) return send(res, 404, { error: 'Media file not found' })
  const range = req.headers.range
  const baseHeaders = {
    'content-type': contentTypeFor(file),
    'accept-ranges': 'bytes',
    'content-disposition': `inline; filename="${path.basename(file).replaceAll('"', '')}"`,
  }
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match) return send(res, 416, { error: 'Invalid range request' }, { 'content-range': `bytes */${info.size}` })
    const suffixLength = !match[1] && match[2] ? Number(match[2]) : 0
    const start = suffixLength ? Math.max(info.size - suffixLength, 0) : Number(match[1] || 0)
    const end = suffixLength ? info.size - 1 : (match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1)
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) {
      return send(res, 416, { error: 'Range not satisfiable' }, { 'content-range': `bytes */${info.size}` })
    }
    res.writeHead(206, { ...baseHeaders, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${info.size}` })
    createReadStream(file, { start, end }).pipe(res)
    return
  }
  res.writeHead(200, { ...baseHeaders, 'content-length': info.size })
  createReadStream(file).pipe(res)
}

function safeUploadName(value = 'upload.bin') {
  return path.basename(value).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180) || 'upload.bin'
}
const transcriptUploadExts = new Set(['.txt', '.srt', '.vtt'])
const mediaUploadExts = new Set(['.mp4', '.mov', '.mkv', '.webm', '.m4v', '.mp3', '.wav', '.m4a'])
function mediaUploadTarget(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (transcriptUploadExts.has(ext)) return 'media/transcripts'
  if (mediaUploadExts.has(ext)) return 'media/downloads'
  return ''
}
async function handleMediaUpload(req, res, db, url) {
  await ensureMediaDirs()
  const filename = safeUploadName(url.searchParams.get('filename') || req.headers['x-filename'] || 'upload.bin')
  const targetDir = mediaUploadTarget(filename)
  if (!targetDir) return send(res, 415, { error: 'Unsupported upload type. Use video/audio, .txt, .srt, or .vtt files only.' })
  const targetPath = path.join(root, targetDir, filename)
  const relativePath = path.posix.join(targetDir, filename)
  await pipeline(req, createWriteStream(targetPath, { flags: 'w' }))
  const info = await stat(targetPath)
  const detail = `Uploaded ${filename} to ${relativePath} (${Math.round(info.size / 1024 / 1024 * 10) / 10} MB).`
  const job = await addMediaJob(db, 'upload', 'done', detail, '')
  return send(res, 200, { ok: true, path: relativePath, size: info.size, job })
}

function normalizeClip(clip) {
  return { platform: 'tiktok', status: 'idea', exportedAt: null, ...clip }
}
const dispatchStatuses = new Set(['drafted', 'needs_owner_review', 'approved_manual_upload', 'posted_manual', 'blocked', 'style_rework_needed', 'superseded'])
const currentStyleGateReadyPathList = [
  'media/renders/stream-2-build-clip-machine-restored-layout-v2-20260513T2012Z.mp4',
  'media/renders/stream-2-ai-agents-real-work-house-style-v3-20260513T1942Z.mp4',
  'media/renders/stream-2-project-progress-offline-house-v3-20260513T2234Z.mp4',
  'media/renders/day3-platform-creates-content-house-v3-20260513T2104Z.mp4',
  'media/renders/day3-honest-ai-chat-house-v3-20260513T2147Z.mp4',
  'media/renders/day3-agent-loop-keeps-building-house-v3-20260513T2147Z.mp4',
  'media/renders/day3-no-sleep-shipping-house-v3-20260513T2317Z.mp4',
  'media/renders/stream-2-build-while-i-sleep-house-v3-20260514T0047Z.mp4',
  'media/renders/stream-2-secure-vps-house-v3-20260514T0134Z.mp4',
  'media/renders/stream-2-rename-channel-house-v3-20260514T0217Z.mp4',
  'media/renders/stream-2-big-day-sprint-house-v3-20260514T0347Z.mp4',
  'media/renders/stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z.mp4',
  'media/renders/stream-2-live-no-leaks-house-v3-20260514T0517Z.mp4',
  'media/renders/stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z.mp4',
  'media/renders/stream-2-black-screen-flop-house-v3-20260514T0647Z.mp4',
  'media/renders/stream-2-mic-first-company-second-house-v3-20260514T0742Z.mp4',
  'media/renders/stream-2-billion-company-no-experience-house-v3-20260514T0817Z.mp4',
  'media/renders/stream2-start-posting-clips-template-20260514T0910Z.mp4',
  'media/renders/stream-2-post-while-i-sleep-house-v3-20260514T1045Z.mp4',
  'media/renders/thumbnail-looks-mid-house-v3-20260514T1125Z.mp4',
  'media/renders/stream-2-ai-still-working-house-v3-20260514T1208Z.mp4',
  'media/renders/template-trial-no-leaks-house-v3-20260514T1338Z.mp4',
  'media/renders/stream-2-phone-controls-build-house-v3-20260514T1510Z.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z/01-day3-one-stream-many-clips-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z/02-day3-iphone-for-streamers-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2118Z/03-day3-product-or-machine-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2200Z/04-day3-ship-live-fix-later-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2235Z/05-day3-first-auto-clip-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2300Z/06-day3-ai-building-ai-house-style.mp4',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2330Z/07-day3-practice-streaming-house-style.mp4',
]
const currentStyleGateReadyPaths = new Set(currentStyleGateReadyPathList)
const currentStyleGateReadyBundleList = [
  'media/exports/clip_stream2_build_clip_machine_restored_layout_v2_20260513T2012Z',
  'media/exports/clip_stream2_ai_agents_real_work_house_style_v3_20260513T1942Z',
  'media/exports/clip_stream2_project_progress_offline_house_v3_20260513T2234Z',
  'media/exports/clip_day3-platform-creates-content-house-v3-20260513T2104Z',
  'media/exports/clip_day3-honest-ai-chat-house-v3-20260513T2147Z',
  'media/exports/clip_day3-agent-loop-keeps-building-house-v3-20260513T2147Z',
  'media/exports/clip_day3-no-sleep-shipping-house-v3-20260513T2317Z',
  'media/exports/clip_stream-2-build-while-i-sleep-house-v3-20260514T0047Z',
  'media/exports/clip_stream-2-secure-vps-house-v3-20260514T0134Z',
  'media/exports/clip_stream-2-rename-channel-house-v3-20260514T0217Z',
  'media/exports/clip_stream-2-big-day-sprint-house-v3-20260514T0347Z',
  'media/exports/clip_stream-2-social-to-vps-plan-house-v3-privacycrop-20260514T0452Z',
  'media/exports/clip_stream-2-live-no-leaks-house-v3-20260514T0517Z',
  'media/exports/clip_stream-2-keep-stream-hide-secrets-house-v3-20260514T0608Z',
  'media/exports/clip_stream-2-black-screen-flop-house-v3-20260514T0647Z',
  'media/exports/clip_stream-2-mic-first-company-second-house-v3-20260514T0742Z',
  'media/exports/clip_stream-2-billion-company-no-experience-house-v3-20260514T0817Z',
  'media/exports/clip_stream2-start-posting-clips-template-20260514T0910Z',
  'media/exports/clip_stream-2-post-while-i-sleep-house-v3-20260514T1045Z',
  'media/exports/clip_thumbnail-looks-mid-house-v3-20260514T1125Z',
  'media/exports/clip_stream-2-ai-still-working-house-v3-20260514T1208Z',
  'media/exports/clip_template-trial-no-leaks-house-v3-20260514T1338Z',
  'media/exports/clip_stream-2-phone-controls-build-house-v3-20260514T1510Z',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T1855Z',
  'media/exports/READY_TO_SHIP_NOW/day3-top10-house-style-corrected-20260514T2030Z',
  'media/exports/clip_stream3_product_or_machine-house-style-corrected-20260514T2118Z',
  'media/exports/clip_stream3_ship_live_fix_later-house-style-corrected-20260514T2200Z',
  'media/exports/clip_stream3_first_auto_clip-house-style-corrected-20260514T2235Z',
  'media/exports/clip_stream3_ai_building_ai-house-style-corrected-20260514T2300Z',
  'media/exports/clip_stream3_practice_streaming-house-style-corrected-20260514T2330Z',
]
const currentStyleGateReadyBundles = new Set(currentStyleGateReadyBundleList)
function isCurrentStyleGateReady(item = {}) {
  const renderPath = item.renderPath || ''
  const exportBundlePath = item.exportBundlePath || ''
  return currentStyleGateReadyPaths.has(renderPath)
    || currentStyleGateReadyBundles.has(exportBundlePath)
    || /stream3-raw-source-audiofix-20260514T1915Z/.test(renderPath)
    || /clip_stream3_.*-raw-source-audiofix-20260514T1915Z/.test(exportBundlePath)
}
function dispatchQueueSummary(items = []) {
  const manifestReadyKeys = new Set(currentStyleGateReadyPathList.map((value) => path.posix.basename(value).replace(/\.mp4$/i, '')))
  const visibleManifestKeys = new Set(items.filter(isCurrentStyleGateReady).map((item) => path.posix.basename(item.renderPath || '').replace(/\.mp4$/i, '')).filter((key) => manifestReadyKeys.has(key)))
  const missingManifestReadyPaths = currentStyleGateReadyPathList.filter((value) => !visibleManifestKeys.has(path.posix.basename(value).replace(/\.mp4$/i, '')))
  return {
    manifestReady: manifestReadyKeys.size,
    manualReadyManifest: items.filter((item) => isCurrentStyleGateReady(item) && item.status === 'approved_manual_upload' && !item.blockers?.length).length,
    missingManifestReady: missingManifestReadyPaths.length,
    missingManifestReadyPaths,
    total: items.length,
    drafted: items.filter((item) => item.status === 'drafted').length,
    needsOwnerReview: items.filter((item) => item.status === 'needs_owner_review').length,
    approvedManualUpload: items.filter((item) => item.status === 'approved_manual_upload').length,
    currentStyleGateReady: items.filter(isCurrentStyleGateReady).length,
    styleSuspended: items.filter((item) => !isCurrentStyleGateReady(item) && item.blockers?.some((blocker) => /style gate/i.test(blocker))).length,
    postedManual: items.filter((item) => item.status === 'posted_manual').length,
    blocked: items.filter((item) => item.status === 'blocked' || (item.status !== 'superseded' && item.blockers?.length)).length,
    superseded: items.filter((item) => item.status === 'superseded').length,
  }
}
function dispatchReplacementKey(item = {}) {
  const haystack = [item.clipId, item.id, item.renderPath, item.exportBundlePath].filter(Boolean).join(' ')
  const datedClip = haystack.match(/clip_([a-z0-9_]+?)_\d{8}T\d{4}Z/i)
  if (datedClip) return datedClip[1].toLowerCase()
  return ''
}
function reconcileDispatchReplacements(items) {
  const readyByKey = new Map()
  for (const item of items) {
    const key = dispatchReplacementKey(item)
    if (!key || item.status === 'blocked' || item.status === 'superseded' || item.blockers?.length || !item.renderPath || !item.exportBundlePath) continue
    const current = readyByKey.get(key)
    if (!current || String(item.updatedAt).localeCompare(String(current.updatedAt)) > 0) readyByKey.set(key, item)
  }
  return items.map((item) => {
    if (item.status !== 'blocked' || !item.blockers?.length) return item
    const replacement = readyByKey.get(dispatchReplacementKey(item))
    if (!replacement || replacement.id === item.id) return item
    return {
      ...item,
      status: 'superseded',
      blockers: [],
      replacedByDispatchId: replacement.id,
      replacedByRenderPath: replacement.renderPath,
      replacedByBundlePath: replacement.exportBundlePath,
      lastAuditAction: `Replaced by ready rerender: ${replacement.title || replacement.id}`,
      updatedAt: replacement.updatedAt || item.updatedAt,
    }
  })
}
function expectedDispatchProofFrames(clip) {
  if (clip.proofFrames?.length) return clip.proofFrames
  if (clip.proofFramePath) return [clip.proofFramePath]
  if (clip.thumbnailProofPath) return [clip.thumbnailProofPath]
  return clip.exportBundlePath ? [`${clip.exportBundlePath}/proof-frame.jpg`, `${clip.exportBundlePath}/proof-frame-mid.jpg`] : []
}
function dispatchStatusForClip(clip) {
  if (!clip.renderPath || !clip.exportBundlePath) return 'blocked'
  if (clip.status === 'exported') return 'approved_manual_upload'
  if (clip.status === 'reviewed') return 'needs_owner_review'
  return 'drafted'
}
function clipDispatchSeed(clip) {
  const blockers = []
  if (!clip.renderPath) blockers.push('Missing rendered asset')
  if (!clip.exportBundlePath) blockers.push('Missing local upload bundle')
  if (clip.exportBundlePath && !expectedDispatchProofFrames(clip).length) blockers.push('Missing proof-frame metadata')
  const now = clip.exportedAt || clip.createdAt || new Date().toISOString()
  return {
    id: `dispatch_${clip.id}`,
    clipId: clip.id,
    title: clip.title || 'Untitled asset',
    platform: clip.platform || 'tiktok',
    status: dispatchStatusForClip(clip),
    renderPath: clip.renderPath || '',
    exportBundlePath: clip.exportBundlePath || '',
    proofFrames: expectedDispatchProofFrames(clip),
    blockers,
    lastAuditAction: blockers.length ? `Seeded locally with ${blockers.length} blocker(s)` : 'Seeded locally from rendered/exported asset',
    createdAt: now,
    updatedAt: now,
  }
}
function normalizeCopyOverride(copy = {}) {
  if (!copy || typeof copy !== 'object') return null
  const title = String(copy.title || '').trim().slice(0, 180)
  const postText = String(copy.postText || '').trim().slice(0, 3000)
  const description = String(copy.description || '').trim().slice(0, 5000)
  const hashtags = Array.isArray(copy.hashtags) ? copy.hashtags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 30) : []
  const updatedAt = String(copy.updatedAt || '').trim() || new Date().toISOString()
  if (!title && !postText && !description && !hashtags.length) return null
  return { title, postText, description, hashtags, updatedAt }
}
function normalizeCopyOverrides(overrides = {}) {
  if (!overrides || typeof overrides !== 'object') return {}
  return Object.fromEntries(Object.entries(overrides).map(([platform, copy]) => [platform, normalizeCopyOverride(copy)]).filter(([, copy]) => copy))
}
function normalizeManualResult(result = {}) {
  if (!result || typeof result !== 'object') return null
  const externalUrl = String(result.externalUrl || '').trim()
  const postedAt = String(result.postedAt || '').trim()
  const notes = String(result.notes || '').trim().slice(0, 500)
  const recordedAt = String(result.recordedAt || '').trim()
  const clean = { externalUrl, postedAt, notes, recordedAt }
  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) clean.externalUrl = ''
  if (!clean.externalUrl && !clean.postedAt && !clean.notes) return null
  clean.recordedAt = recordedAt || new Date().toISOString()
  return clean
}
function normalizeDispatchItem(item, clip = null) {
  const seed = clip ? clipDispatchSeed(clip) : {}
  const next = { ...seed, ...item }
  if (clip) {
    if (clip.renderPath) next.renderPath = clip.renderPath
    if (clip.exportBundlePath) next.exportBundlePath = clip.exportBundlePath
    const proofFrames = expectedDispatchProofFrames(clip)
    if (proofFrames.length) next.proofFrames = proofFrames
    const blockers = []
    if (!next.renderPath) blockers.push('Missing rendered asset')
    if (!next.exportBundlePath) blockers.push('Missing local upload bundle')
    if (next.exportBundlePath && !next.proofFrames?.length) blockers.push('Missing proof-frame metadata')
    next.blockers = blockers
    if (item?.status === 'blocked' && !blockers.length) next.status = dispatchStatusForClip(clip)
  }
  next.id = next.id || (clip?.id ? `dispatch_${clip.id}` : id('dispatch'))
  next.clipId = next.clipId || clip?.id || ''
  next.title = next.title || clip?.title || 'Untitled asset'
  next.platform = next.platform || clip?.platform || 'tiktok'
  next.status = dispatchStatuses.has(next.status) ? next.status : dispatchStatusForClip(clip || next)
  next.blockers = Array.isArray(next.blockers) ? next.blockers : []
  next.proofFrames = Array.isArray(next.proofFrames) ? next.proofFrames : []
  next.manualResult = normalizeManualResult(next.manualResult)
  next.copyOverrides = normalizeCopyOverrides(next.copyOverrides)
  if (isCurrentStyleGateReady(next)) {
    next.ownerGateRequired = true
    next.ownerGate = next.ownerGate || 'Final owner privacy/watch pass required before any public upload'
    next.privacyWatchRequired = true
    next.blockers = next.blockers.filter((blocker) => !/style gate|superseded|rejected blue-card|old facecam|low-text/i.test(blocker))
    if (!next.blockers.length && next.status !== 'posted_manual') next.status = 'approved_manual_upload'
    if (!next.lastAuditAction || /style gate|Seeded locally|Imported|Archived by house-style cleanup/i.test(next.lastAuditAction)) next.lastAuditAction = 'Current house-style gate passed — manual upload only after owner privacy/watch pass'
  } else if (next.status === 'approved_manual_upload' || next.status === 'needs_owner_review') {
    const styleBlocker = 'Style gate suspended: packaged legacy asset needs corrected house-style rerender/recheck before manual upload'
    if (!next.blockers.some((blocker) => /style gate suspended/i.test(blocker))) next.blockers = [styleBlocker, ...next.blockers]
    next.status = 'blocked'
    if (!next.lastAuditAction || !/style gate suspended/i.test(next.lastAuditAction)) next.lastAuditAction = 'Style gate suspended legacy/package candidate; do not upload until rerendered/rechecked'
  }
  next.createdAt = next.createdAt || seed.createdAt || new Date().toISOString()
  next.updatedAt = next.updatedAt || seed.updatedAt || next.createdAt
  next.lastAuditAction = next.lastAuditAction || 'Imported into local dispatch queue'
  return next
}
function normalizeDispatchItems(db) {
  const existing = new Map((db.dispatchItems || []).map((item) => [item.clipId || item.id, item]))
  const dispatchReadyClips = (db.clips || []).filter((clip) => clip.exportBundlePath || clip.renderPath || clip.status === 'reviewed' || clip.status === 'exported')
  const items = dispatchReadyClips.map((clip) => normalizeDispatchItem(existing.get(clip.id), clip))
  for (const item of db.dispatchItems || []) {
    const key = item.clipId || item.id
    const isPrimaryClipSeed = dispatchReadyClips.some((clip) => clip.id === key && item.id === `dispatch_${clip.id}`)
    if (!isPrimaryClipSeed) items.push(normalizeDispatchItem(item))
  }
  return reconcileDispatchReplacements(items).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 200)
}
async function ensureCurrentStyleGateReadyDispatchItems(db) {
  const items = normalizeDispatchItems(db)
  const visibleKeys = new Set(items.map((item) => path.posix.basename(item.renderPath || '').replace(/\.mp4$/i, '')).filter(Boolean))
  const additions = []
  for (const [index, renderPath] of currentStyleGateReadyPathList.entries()) {
    const renderKey = path.posix.basename(renderPath).replace(/\.mp4$/i, '')
    if (visibleKeys.has(renderKey)) continue
    const renderExists = await stat(path.join(root, renderPath)).then((info) => info.isFile()).catch(() => false)
    if (!renderExists) continue
    const exportBundlePath = currentStyleGateReadyBundleList[index] || ''
    const bundleDir = exportBundlePath ? path.join(root, exportBundlePath) : ''
    const bundleExists = bundleDir ? await stat(bundleDir).then((info) => info.isDirectory()).catch(() => false) : false
    const bundleFiles = bundleExists ? await readdir(bundleDir).catch(() => []) : []
    const uploadCopy = bundleExists ? await readFile(path.join(bundleDir, 'upload-card.md'), 'utf8')
      .catch(() => readFile(path.join(bundleDir, 'upload-copy.md'), 'utf8'))
      .catch(() => readFile(path.join(bundleDir, 'README.md'), 'utf8'))
      .catch(() => '') : ''
    const uploadTitle = uploadCopy.match(/^#\s*Upload (?:Bundle|Card)\s*[—-]\s*(.+)$/mi)?.[1]?.trim()
    const proofFrames = bundleFiles
      .filter((name) => /^proof-frame.*\.(jpe?g|png|webp)$/i.test(name))
      .sort()
      .map((name) => `${exportBundlePath}/${name}`)
    const blockers = []
    if (!bundleExists) blockers.push('Missing local upload bundle')
    if (bundleExists && !uploadCopy) blockers.push('Upload card/copy is missing')
    if (bundleExists && !proofFrames.length) blockers.push('Proof frame(s) missing')
    additions.push(normalizeDispatchItem({
      id: `dispatch_manifest_${renderKey}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      clipId: `manifest_${renderKey}`,
      title: uploadTitle || renderKey.replace(/[-_]+/g, ' '),
      platform: 'tiktok',
      status: blockers.length ? 'blocked' : 'approved_manual_upload',
      renderPath,
      exportBundlePath,
      proofFrames,
      blockers,
      lastAuditAction: blockers.length ? `Recovered from current READY manifest with ${blockers.length} blocker(s)` : 'Recovered from current READY manifest and local bundle scan',
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    visibleKeys.add(renderKey)
  }
  db.dispatchItems = normalizeDispatchItems({ ...db, dispatchItems: [...additions, ...items] })
  return additions.length
}
async function scanExportBundleDispatchItems(db) {
  const exportsDir = path.join(root, 'media/exports')
  const entries = await readdir(exportsDir, { withFileTypes: true }).catch(() => [])
  const items = []
  const known = new Set((db.dispatchItems || []).flatMap((item) => [item.id, item.clipId, item.exportBundlePath]).filter(Boolean))
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const bundlePath = path.posix.join('media/exports', entry.name)
    if (known.has(bundlePath)) continue
    const metadataPath = path.join(exportsDir, entry.name, 'metadata.json')
    const metadata = await readFile(metadataPath, 'utf8').then((text) => JSON.parse(text)).catch(() => null)
    const uploadCopy = await readFile(path.join(exportsDir, entry.name, 'upload-copy.md'), 'utf8')
      .catch(() => readFile(path.join(exportsDir, entry.name, 'upload-card.md'), 'utf8'))
      .catch(() => '')
    if (!metadata && !uploadCopy) continue
    const uploadTitle = uploadCopy.match(/^#\s*Upload (?:Bundle|Card)\s*[—-]\s*(.+)$/mi)?.[1]?.trim()
    const renderFromCopy = uploadCopy.match(/Render:\s*`?([^`\n]+?\.mp4)`?/i)?.[1]?.trim()
    const renderPath = metadata?.renderPath
      || (renderFromCopy?.startsWith('media/') ? renderFromCopy : renderFromCopy ? path.posix.join(bundlePath, path.posix.basename(renderFromCopy)) : '')
    const itemId = `dispatch_${metadata?.id || entry.name}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    if (known.has(itemId) || (metadata?.id && known.has(metadata.id))) continue
    const bundleFiles = await readdir(path.join(exportsDir, entry.name)).catch(() => [])
    const proofFrames = bundleFiles
      .filter((name) => /^proof-frame.*\.(jpe?g|png|webp)$/i.test(name))
      .sort()
      .map((name) => `${bundlePath}/${name}`)
    const blockers = []
    if (!renderPath) blockers.push(metadata ? 'Missing rendered asset path in metadata' : 'Missing rendered asset path in upload copy')
    if (!await stat(path.join(root, renderPath || '')).then((info) => info.isFile()).catch(() => false)) blockers.push('Rendered asset file is missing')
    if (!await stat(path.join(root, bundlePath, 'upload-card.md')).then((info) => info.isFile()).catch(() => false)
      && !await stat(path.join(root, bundlePath, 'upload-copy.md')).then((info) => info.isFile()).catch(() => false)) blockers.push('Upload card/copy is missing')
    if (!metadata && !uploadCopy) blockers.push('Metadata JSON or upload-copy notes are missing')
    if (!proofFrames.length) blockers.push('Proof frame(s) missing')
    const platform = String(metadata?.platform || metadata?.platforms?.[0] || 'tiktok').includes('youtube') ? 'youtube' : 'tiktok'
    items.push(normalizeDispatchItem({
      id: itemId,
      clipId: metadata?.sourceClipId || metadata?.id || entry.name,
      title: metadata?.title || uploadTitle || entry.name.replace(/[-_]+/g, ' '),
      platform,
      status: blockers.length ? 'blocked' : 'approved_manual_upload',
      renderPath,
      exportBundlePath: bundlePath,
      proofFrames,
      blockers,
      lastAuditAction: blockers.length ? `Seeded from upload bundle with ${blockers.length} blocker(s)` : metadata ? 'Seeded from local upload bundle metadata' : 'Seeded from local upload-copy bundle',
      createdAt: metadata?.createdAt || new Date().toISOString(),
      updatedAt: metadata?.createdAt || new Date().toISOString(),
    }))
  }
  if (!items.length) return db.dispatchItems
  db.dispatchItems = normalizeDispatchItems({ ...db, dispatchItems: [...items, ...(db.dispatchItems || [])] })
  return db.dispatchItems
}
function createDispatchItem(db, body = {}) {
  const clip = body.clipId ? (db.clips || []).find((candidate) => candidate.id === body.clipId) : null
  const now = new Date().toISOString()
  const item = normalizeDispatchItem({
    id: body.id || id('dispatch'),
    clipId: body.clipId || '',
    title: body.title || clip?.title || 'Untitled manual dispatch asset',
    platform: body.platform || clip?.platform || 'tiktok',
    status: dispatchStatuses.has(body.status) ? body.status : 'drafted',
    renderPath: body.renderPath || clip?.renderPath || '',
    exportBundlePath: body.exportBundlePath || clip?.exportBundlePath || '',
    proofFrames: Array.isArray(body.proofFrames) ? body.proofFrames : clip ? expectedDispatchProofFrames(clip) : [],
    blockers: Array.isArray(body.blockers) ? body.blockers : [],
    lastAuditAction: body.lastAuditAction || 'Created manually in local dispatch queue',
    createdAt: now,
    updatedAt: now,
  }, clip)
  db.dispatchItems = normalizeDispatchItems({ ...db, dispatchItems: [item, ...(db.dispatchItems || [])] })
  return db.dispatchItems.find((entry) => entry.id === item.id) || item
}

function normalizeRadarHandle(value = '') {
  return String(value).trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
}
function normalizeRadarTags(tags, fallback = []) {
  const source = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(/[,\n]/) : fallback
  return [...new Set(source.map(String).map((item) => item.trim()).filter(Boolean))].slice(0, 8)
}
function watchCadenceMinutes(tier = 'B') {
  if (tier === 'A') return 15
  if (tier === 'B') return 60
  return 240
}
function nextManualCheckAt(lastCheckedAt, tier = 'B') {
  const base = lastCheckedAt && !Number.isNaN(new Date(lastCheckedAt).getTime()) ? new Date(lastCheckedAt).getTime() : Date.now() - watchCadenceMinutes(tier) * 60 * 1000
  return new Date(base + watchCadenceMinutes(tier) * 60 * 1000).toISOString()
}
function watchPriorityScore(account = {}, nowMs = Date.now()) {
  const tierBoost = account.tier === 'A' ? 100 : account.tier === 'B' ? 70 : 40
  const nextMs = new Date(account.nextManualCheckAt || 0).getTime()
  const dueBoost = Number.isFinite(nextMs) && nextMs <= nowMs ? 40 : 0
  const staleHours = account.lastManualCheckedAt ? Math.max(0, (nowMs - new Date(account.lastManualCheckedAt).getTime()) / 3600000) : 24
  return Math.round(tierBoost + dueBoost + Math.min(40, staleHours * 2))
}
function normalizeWatchAccount(account = {}, index = 0) {
  const raw = typeof account === 'string' ? { handle: account, displayName: account } : account && typeof account === 'object' ? account : {}
  const handle = normalizeRadarHandle(raw.handle || raw.account || raw.username || '')
  if (!handle) return null
  const tier = ['A', 'B', 'C'].includes(String(raw.tier || '').toUpperCase()) ? String(raw.tier).toUpperCase() : index < 3 ? 'A' : 'B'
  const lastManualCheckedAt = raw.lastManualCheckedAt || raw.lastCheckedAt || null
  const accountRecord = {
    handle,
    displayName: String(raw.displayName || raw.name || `@${handle}`).trim().slice(0, 80),
    tier,
    topicTags: normalizeRadarTags(raw.topicTags || raw.topics || raw.tags),
    sourceMode: ['manual_search', 'api_pending', 'rss_pending'].includes(raw.sourceMode) ? raw.sourceMode : 'manual_search',
    lastSeenTweetId: raw.lastSeenTweetId ? String(raw.lastSeenTweetId).trim().slice(0, 80) : null,
    lastSeenAt: raw.lastSeenAt ? String(raw.lastSeenAt).trim().slice(0, 40) : null,
    lastManualCheckedAt: lastManualCheckedAt ? String(lastManualCheckedAt).trim().slice(0, 40) : null,
    nextManualCheckAt: raw.nextManualCheckAt ? String(raw.nextManualCheckAt).trim().slice(0, 40) : nextManualCheckAt(lastManualCheckedAt, tier),
    checkCadenceMinutes: Math.max(15, Number(raw.checkCadenceMinutes || watchCadenceMinutes(tier))),
    enabled: raw.enabled !== false,
  }
  accountRecord.priorityScore = watchPriorityScore(accountRecord)
  return accountRecord
}
function normalizeWatchAccounts(accounts) {
  const defaults = defaultDb.twitterRadar.watchAccounts
  const source = Array.isArray(accounts) && accounts.length ? accounts : defaults
  const seen = new Set()
  const normalized = []
  for (const account of source) {
    const item = normalizeWatchAccount(account, normalized.length)
    if (!item || seen.has(item.handle.toLowerCase())) continue
    seen.add(item.handle.toLowerCase())
    normalized.push(item)
    if (normalized.length >= 2000) break
  }
  return normalized
}
function normalizeRadarSourceAdapters(adapters) {
  const defaults = defaultDb.twitterRadar.sourceAdapters
  const source = Array.isArray(adapters) && adapters.length ? adapters : defaults
  return source.map((adapter = {}) => ({
    id: String(adapter.id || 'source').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'source',
    label: String(adapter.label || adapter.id || 'Radar source').trim().slice(0, 80),
    status: String(adapter.status || 'planned').trim().slice(0, 40),
    latencyClass: String(adapter.latencyClass || 'unknown').trim().slice(0, 60),
    requiresCredentials: Boolean(adapter.requiresCredentials),
    termsRisk: String(adapter.termsRisk || 'unknown').trim().slice(0, 30),
    minPollIntervalMs: Math.max(0, Number(adapter.minPollIntervalMs || 0)),
    capability: String(adapter.capability || '').trim().slice(0, 140),
    note: String(adapter.note || '').trim().slice(0, 240),
  })).slice(0, 12)
}
function normalizeRadarWorkerLanes(lanes) {
  const defaults = defaultDb.twitterRadar.workerLanes
  const source = Array.isArray(lanes) && lanes.length ? lanes : defaults
  return source.map((lane = {}) => ({
    id: String(lane.id || 'lane').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'lane',
    label: String(lane.label || lane.id || 'Radar lane').trim().slice(0, 80),
    status: String(lane.status || 'active').trim().slice(0, 40),
    focus: String(lane.focus || '').trim().slice(0, 180),
  })).slice(0, 8)
}
function normalizeTwitterRadar(radar = {}) {
  const defaults = defaultDb.twitterRadar
  const sourceAdapters = normalizeRadarSourceAdapters(radar.sourceAdapters)
  const enabledAdapter = sourceAdapters.find((adapter) => adapter.status === 'enabled') || sourceAdapters[0]
  return {
    status: radar.status || defaults.status,
    mode: radar.mode || defaults.mode,
    source: radar.source || enabledAdapter?.label || 'Manual X search openings',
    pollingMode: radar.pollingMode || '2h cron + manual refresh; no X fetch loop',
    lastScanAt: radar.lastScanAt || null,
    topics: Array.isArray(radar.topics) && radar.topics.length ? radar.topics : defaults.topics,
    watchAccounts: normalizeWatchAccounts(radar.watchAccounts),
    sourceAdapters,
    workerLanes: normalizeRadarWorkerLanes(radar.workerLanes),
    items: Array.isArray(radar.items) ? radar.items.slice(0, 80) : [],
  }
}
const twitterRadarReplyDrafts = [
  'I think the missing piece is proof. A lot of people post the result, but the useful part is seeing what broke and what changed.',
  'This is why I like building in public when it has receipts. The lesson lands harder when people can see the messy version too.',
  'The hard part is not making more output. It is knowing what is worth trusting enough to ship.',
  'I keep coming back to this. If a tool still leaves you with all the review work, it did not remove the job. It moved the job.',
  'This is the bit most people skip. The process is the signal. The polished result is only half the story.',
]
function buildTwitterSearchUrl(topic) {
  const query = `${topic} min_faves:5 -filter:replies`
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`
}
function buildTwitterAccountSearchUrl(account) {
  const tags = account.topicTags?.length ? ` (${account.topicTags.join(' OR ')})` : ''
  const query = `from:${account.handle}${tags} -filter:replies`
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`
}
function radarReason(topic, index) {
  const reasons = [
    'Good reply target because the topic maps to Vibe Zone and the reply can add a real builder angle.',
    'Likely to earn profile curiosity if the reply points at process, receipts, or the messy middle.',
    'Worth checking for newer accounts with active comments and lower competition.',
    'Useful scan lane for high intent builders, creators, and tool makers.',
  ]
  return `${reasons[index % reasons.length]} Topic: ${topic}.`
}
function makeRadarItem(topic, index, now) {
  return {
    id: `radar_${Date.now()}_${index}_${Math.random().toString(16).slice(2, 7)}`,
    topic,
    account: index % 3 === 0 ? 'High profile watch lane' : index % 3 === 1 ? 'New account discovery lane' : 'Niche search lane',
    text: `Manual screening lane for recent posts about ${topic}. Open the search, pick a live post, then use or tweak the reply draft.`,
    url: buildTwitterSearchUrl(topic),
    replyDraft: twitterRadarReplyDrafts[index % twitterRadarReplyDrafts.length],
    score: 86 - index * 3,
    reason: radarReason(topic, index),
    source: 'topic_search',
    status: 'needs_manual_screen',
    createdAt: now,
  }
}
function makeWatchlistRadarItem(account, index, now) {
  const topics = account.topicTags.length ? account.topicTags.join(', ') : 'Vibe Zone topics'
  return {
    id: `radar_watch_${Date.now()}_${index}_${Math.random().toString(16).slice(2, 7)}`,
    topic: account.topicTags[0] || 'watchlist',
    account: `@${account.handle} · ${account.displayName}`,
    handle: account.handle,
    watchTier: account.tier,
    sourceMode: account.sourceMode,
    text: `High-profile watchlist lane for @${account.handle}. Manually check recent posts matching: ${topics}. No timeline scraping or API calls were made.`,
    url: buildTwitterAccountSearchUrl(account),
    replyDraft: twitterRadarReplyDrafts[(index + 1) % twitterRadarReplyDrafts.length],
    score: Math.max(60, 94 - index * 2 - (account.tier === 'A' ? 0 : account.tier === 'B' ? 5 : 10)),
    reason: `High-profile ${account.tier}-tier account. Source mode: ${account.sourceMode}. Last seen: ${account.lastSeenAt || 'not recorded locally yet'}. Manual review required.`,
    source: 'watchlist_account',
    status: 'needs_manual_screen',
    createdAt: now,
  }
}
async function scanTwitterRadar(db, body = {}) {
  const radar = normalizeTwitterRadar(db.twitterRadar)
  const topics = Array.isArray(body.topics) && body.topics.length ? body.topics.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 12) : radar.topics
  const watchAccounts = normalizeWatchAccounts(Array.isArray(body.watchAccounts) ? body.watchAccounts : radar.watchAccounts)
  const now = new Date().toISOString()
  const topicItems = topics.slice(0, 8).map((topic, index) => makeRadarItem(topic, index, now))
  const watchItems = watchAccounts.filter((account) => account.enabled).slice(0, 20).map((account, index) => makeWatchlistRadarItem(account, index, now))
  const items = [...watchItems, ...topicItems]
  db.twitterRadar = { ...radar, topics, watchAccounts, lastScanAt: now, items: [...items, ...radar.items].slice(0, 80) }
  await addJob(db, 'twitter-radar-scan', 'Twitter Radar manual screening refreshed', 'done', `${topicItems.length} topic lane(s), ${watchItems.length} watchlist lane(s) queued. Draft-only; no X posting or scraping.`)
  await saveDb(db)
  return db.twitterRadar
}
async function updateTwitterRadar(db, body = {}) {
  const radar = normalizeTwitterRadar(db.twitterRadar)
  const topics = Array.isArray(body.topics) ? body.topics.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 20) : radar.topics
  const watchAccounts = Array.isArray(body.watchAccounts) ? normalizeWatchAccounts(body.watchAccounts) : radar.watchAccounts
  db.twitterRadar = { ...radar, topics, watchAccounts }
  await saveDb(db)
  return db.twitterRadar
}
async function updateTwitterRadarWatchlist(db, body = {}) {
  const radar = normalizeTwitterRadar(db.twitterRadar)
  const rawAccounts = Array.isArray(body) ? body : Array.isArray(body.accounts) ? body.accounts : Array.isArray(body.watchAccounts) ? body.watchAccounts : null
  if (!rawAccounts) return { accounts: radar.watchAccounts }
  db.twitterRadar = { ...radar, watchAccounts: normalizeWatchAccounts(rawAccounts) }
  await saveDb(db)
  return { accounts: db.twitterRadar.watchAccounts }
}
async function markTwitterRadarAccountChecked(db, body = {}) {
  const radar = normalizeTwitterRadar(db.twitterRadar)
  const handle = normalizeRadarHandle(body.handle || body.account || '')
  if (!handle) return { error: 'Watchlist handle is required.' }
  let updated = null
  const checkedAt = new Date().toISOString()
  const watchAccounts = radar.watchAccounts.map((account) => {
    if (account.handle.toLowerCase() !== handle.toLowerCase()) return account
    updated = normalizeWatchAccount({ ...account, lastManualCheckedAt: checkedAt, nextManualCheckAt: nextManualCheckAt(checkedAt, account.tier) })
    return updated
  })
  if (!updated) return { error: 'Watchlist account not found.' }
  db.twitterRadar = { ...radar, watchAccounts }
  await addJob(db, 'twitter-radar-check', `Marked @${updated.handle} manually checked`, 'done', `Next local check: ${updated.nextManualCheckAt}. No X fetch or action performed.`)
  await saveDb(db)
  return { account: updated, accounts: watchAccounts }
}

function normalizeDb(db) {
  db.settings = { ...defaultDb.settings, ...(db.settings || {}) }
  db.scans = (db.scans || []).slice(0, 50)
  db.videos = db.videos || []
  db.transcripts = db.transcripts || []
  db.clips = (db.clips || []).map(normalizeClip)
  db.dispatchItems = normalizeDispatchItems(db)
  db.postResults = Array.isArray(db.postResults) ? db.postResults.slice(0, 200) : []
  db.platformProfiles = Array.isArray(db.platformProfiles) && db.platformProfiles.length ? db.platformProfiles : defaultDb.platformProfiles
  db.scheduleItems = Array.isArray(db.scheduleItems) && db.scheduleItems.length ? db.scheduleItems : defaultDb.scheduleItems
  db.engagementTasks = Array.isArray(db.engagementTasks) && db.engagementTasks.length ? db.engagementTasks : defaultDb.engagementTasks
  db.monetizationOffers = Array.isArray(db.monetizationOffers) && db.monetizationOffers.length ? db.monetizationOffers : defaultDb.monetizationOffers
  db.socialConnectionState = db.socialConnectionState && typeof db.socialConnectionState === 'object' ? db.socialConnectionState : {}
  db.twitterRadar = normalizeTwitterRadar(db.twitterRadar)
  db.postingConnectors = normalizePostingConnectors(db.postingConnectors)
  db.mediaJobs = db.mediaJobs || []
  db.viralFinds = db.viralFinds || []
  db.chatMessages = db.chatMessages || []
  db.thumbnailConcepts = db.thumbnailConcepts || []
  db.jobs = db.jobs || []
  return db
}
async function commandExists(command, args = ['--version']) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 4500 })
    return { ok: true, detail: `${stdout || stderr}`.split('\n')[0].trim() }
  } catch (error) {
    return { ok: false, detail: error.code === 'ENOENT' ? 'not installed / not on PATH' : error.message }
  }
}
async function mediaProbe(db) {
  await ensureMediaDirs()
  const tools = {
    ytDlp: await commandExists(localYtDlp),
    ffmpeg: await commandExists('ffmpeg', ['-version']),
    whisper: await commandExists(localWhisper, ['--help']),
  }
  const allReady = tools.ytDlp.ok && tools.whisper.ok && tools.ffmpeg.ok
  await addJob(db, 'media-probe', 'Checked media pipeline tools', allReady ? 'done' : 'needs-review', `yt-dlp=${tools.ytDlp.ok}; whisper=${tools.whisper.ok}; ffmpeg=${tools.ffmpeg.ok}`)
  await saveDb(db)
  return { tools, expectedPaths: { downloads: 'media/downloads', transcripts: 'media/transcripts', renders: 'media/renders' } }
}
async function addMediaJob(db, step, status, detail, command = '') {
  const mediaJob = { id: id('media'), step, status, detail, command, createdAt: new Date().toISOString() }
  db.mediaJobs.unshift(mediaJob)
  db.mediaJobs = db.mediaJobs.slice(0, 80)
  await addJob(db, `media-${step}`, `Media pipeline: ${step}`, status, detail)
  await saveDb(db)
  return mediaJob
}
function buildYtDlpCommand(videoUrl) {
  return `${localYtDlp} --no-playlist -f "bv*+ba/b" --merge-output-format mp4 -o "media/downloads/%(id)s.%(ext)s" "${videoUrl}"`
}
function buildCustomDownloadCommand(videoUrl) {
  return `node scripts/vibe-download.mjs "${videoUrl}" "media/downloads/%(id)s.%(ext)s"`
}
function buildYtDlpPreflightCommand(videoUrl) {
  return `${localYtDlp} --skip-download --print "%(id)s | %(title)s | duration=%(duration_string)s | live=%(live_status)s" "${videoUrl}"`
}
function buildLocalCompanionCommand(videoUrl, videoId = '') {
  const idPart = videoId || 'VIDEO_ID'
  return `# Run on Masala's own machine if the VPS hits YouTube bot-checks. Latest stream only; no cookies required by default.\nmkdir -p media/downloads media/transcripts\nyt-dlp --no-playlist -f "bv*+ba/b" --merge-output-format mp4 -o "media/downloads/%(id)s.%(ext)s" "${videoUrl}"\nwhisper "media/downloads/${idPart}.mp4" --model base --language en --output_format all --output_dir media/transcripts\n# Then copy/import media/transcripts/${idPart}.txt, media/transcripts/${idPart}.srt, and media/downloads/${idPart}.mp4 into Vibe Zone and press “Import local transcript + score”.`
}
const youtubePreflightStrategies = [
  { name: 'live-hls-web-safari', args: ['--extractor-args', 'youtube:player_client=web_safari'] },
  { name: 'mweb-po-token-ready', args: ['--extractor-args', 'youtube:player_client=mweb'] },
  { name: 'embedded-public', args: ['--extractor-args', 'youtube:player_client=web_embedded'] },
  { name: 'standard-best', args: [] },
]
async function preflightYoutubeDownload(videoUrl) {
  const failures = []
  for (const strategy of youtubePreflightStrategies) {
    try {
      const { stdout, stderr } = await execFileAsync(localYtDlp, [...strategy.args, '--skip-download', '--print', '%(id)s | %(title)s | duration=%(duration_string)s | live=%(live_status)s', videoUrl], { timeout: 20000 })
      const detail = `${stdout || stderr}`.trim().split('\n').at(-1) || 'yt-dlp preflight succeeded'
      return { ok: true, strategy: strategy.name, detail: `${detail} via ${strategy.name}` }
    } catch (error) {
      const output = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`
      const line = output.trim().split('\n').find((item) => /ERROR|WARNING|Error/i.test(item)) || error.message
      failures.push({ strategy: strategy.name, blocked: youtubeBotBlockPattern.test(output), line })
    }
  }
  if (failures.some((failure) => failure.blocked)) {
    return { ok: false, blocked: true, detail: `YouTube blocked this VPS extraction with a bot-check across safe strategies (${failures.map((failure) => failure.strategy).join(', ')}). Do not use cookies by default; use the local companion download/import fallback unless Masala explicitly approves a specific cookie step.` }
  }
  return { ok: false, blocked: false, detail: failures.map((failure) => `${failure.strategy}: ${failure.line}`).join(' | ') }
}
function latestStreamCandidate(videos) {
  return videos.find((video) => video.kind === 'stream') || videos.find((video) => /\blive\b|stream|vibe coding|day \d+/i.test(video.title)) || videos[0]
}
function videoIdFromUrl(value = '') {
  return value.match(/^manual:\/\/([^?&/]+)/)?.[1] || value.match(/[?&]v=([^&]+)/)?.[1] || value.match(/youtu\.be\/([^?&/]+)/)?.[1] || ''
}
function latestOnlyBlocker(requestedId, latest) {
  if (!latest?.id || !requestedId || requestedId === latest.id) return ''
  return `Current scope is newest Masala stream only (${latest.id}: ${latest.title}). Ignored older/different video id ${requestedId}.`
}
function buildWhisperCommand(inputPath) {
  return `. /root/.openclaw/workspace/.venv-transcribe/bin/activate && whisper "${inputPath}" --model base --language en --output_format all --output_dir media/transcripts`
}
function drawTextEscape(value = '') {
  return String(value || 'Watch this get built live')
    .replace(/[\n\r]+/g, ' ')
    .replace(/[:'\\]/g, '')
    .replace(/[^\w\s!?.,-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}

function hookLines(value = '') {
  const text = drawTextEscape(value)
  const words = text.split(/\s+/).filter(Boolean)
  const lines = ['', '']
  for (const word of words) {
    const target = lines[0].length < 25 ? 0 : 1
    if ((lines[target] + ' ' + word).trim().length <= 30) lines[target] = `${lines[target]} ${word}`.trim()
  }
  return { line1: lines[0] || 'Watch this get built', line2: lines[1] || 'live' }
}

function centeredHookLines(value = '') {
  const text = drawTextEscape(value).toUpperCase().replace(/[.]+/g, '')
  if (/[|/]/.test(text)) {
    const [line1, line2] = text.split(/[|/]/).map((part) => part.trim()).filter(Boolean)
    return { line1: line1 || 'BUILDING WITH AI', line2: line2 || 'LIVE' }
  }
  const words = text.split(/\s+/).filter(Boolean)
  if (/STOP OVERBUILDING.*SHIP WORKFLOWS/.test(text)) return { line1: 'STOP OVERBUILDING', line2: 'SHIP WORKFLOWS' }
  if (/DONT LEAK.*STREAM|NO LEAKS.*STREAM/.test(text)) return { line1: 'NO LEAKS', line2: 'ON STREAM' }
  if (words.length === 3) return { line1: words.slice(0, 2).join(' '), line2: words.slice(2).join(' ') }
  if (words.length === 4) return { line1: words.slice(0, 2).join(' '), line2: words.slice(2).join(' ') }
  const split = Math.max(1, Math.ceil(words.length / 2))
  return { line1: words.slice(0, split).join(' ') || 'BUILDING WITH AI', line2: words.slice(split).join(' ') || 'LIVE' }
}

function brandWordmark(value = '') {
  const text = String(value || '').toLowerCase()
  if (/openclaw/.test(text)) return 'OpenClaw'
  if (/google/.test(text)) return 'Google'
  if (/apple|ios|iphone/.test(text)) return 'Apple'
  if (/youtube/.test(text)) return 'YouTube'
  if (/tiktok/.test(text)) return 'TikTok'
  if (/react|vite/.test(text)) return 'React'
  if (/ai|agent|automation/.test(text)) return 'AI Agents'
  return 'Vibe Zone'
}

function centeredHeadlineLayout(value = '') {
  const lines = centeredHookLines(value)
  const visibleLines = [lines.line1, lines.line2].filter((line) => line && line.trim())
  const longest = Math.max(...visibleLines.map((line) => line.length), 1)
  const box = { x: 90, y: 72, w: 900, h: 340 }
  const widthFit = Math.floor(box.w / (longest * 0.58))
  const heightFit = Math.floor(box.h / (visibleLines.length * 1.18))
  const fontSize = Math.max(54, Math.min(126, widthFit, heightFit))
  const lineHeight = Math.round(fontSize * 1.18)
  const totalHeight = lineHeight * visibleLines.length
  const firstY = Math.round(box.y + (box.h - totalHeight) / 2)
  return { lines: visibleLines, fontSize, lineHeight, firstY }
}


function assTime(value = 0) {
  const total = Math.max(0, Number(value) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secondsValue = total % 60
  const secondsPart = String(Math.floor(secondsValue)).padStart(2, '0')
  const centis = String(Math.round((secondsValue - Math.floor(secondsValue)) * 100)).padStart(2, '0')
  return `${hours}:${String(minutes).padStart(2, '0')}:${secondsPart}.${centis}`
}

function assEscape(value = '') {
  return String(value || '')
    .replace(/[{}]/g, '')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function captionChunks(text = '', oneWord = false) {
  const words = assEscape(text).split(/\s+/).filter(Boolean)
  if (oneWord) return words.length ? words : ['']
  const chunks = []
  for (let index = 0; index < words.length; index += 5) chunks.push(words.slice(index, index + 5).join(' '))
  return chunks.length ? chunks : ['']
}

async function writeSpokenCaptionAss(videoId, clip, timeOffset = 0, placement = 'bottom') {
  const transcriptPath = path.resolve(root, `media/transcripts/${videoId}.json`)
  const exists = await localFileExists(`media/transcripts/${videoId}.json`)
  if (!exists) return ''
  const transcript = JSON.parse(await readFile(transcriptPath, 'utf8'))
  const clipStart = seconds(clip.start, 0)
  const clipEnd = seconds(clip.end, clipStart + 12)
  const events = buildShortWordEvents({
    segments: transcript.segments || [],
    sourceStart: clipStart,
    sourceEnd: clipEnd,
    timelineOffset: timeOffset,
    minDuration: placement === 'centered-screen' ? 0.14 : 0.18,
    maxDuration: placement === 'centered-screen' ? 0.52 : 0.62,
    gap: 0.015,
  })
  const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
  if (!qa.ok) throw new Error(`Caption QA failed for ${clip.id}: ${qa.failures.slice(0, 4).join('; ')}`)
  const outPath = `media/transcripts/${videoId}-${clip.id}-one-word.ass`
  const ass = buildNormalizedAss(events, { mode: 'short', font: 'DejaVu Sans' })
  await writeFile(path.resolve(root, outPath), ass)
  await writeFile(path.resolve(root, outPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')
  return outPath
}

function ffmpegPlan({ inputPath, start = '0:00', end = '0:45', mode = 'short', subtitlePath = '', outputPath = '', cropX = 0, facecamBox = null, hookText = '', quality = 'standard', brandText = '', logoPath = '' }) {
  const subtitle = subtitlePath ? `,subtitles='${subtitlePath.replaceAll("'", "'\\''")}'` : ''
  const smartCropX = Math.max(0, Math.round(Number(cropX) || 0))
  const facecam = facecamBox || { x: 0, y: 0, w: 520, h: 330 }
  const pipBackgroundCropX = Math.max(0, Math.round(Number(facecam.bgCropX ?? smartCropX) || 0))
  const hook = hookLines(hookText)
  const hookCard = `drawbox=x=54:y=78:w=972:h=224:color=black@0.72:t=fill,drawbox=x=54:y=78:w=972:h=224:color=white@0.38:t=4,drawtext=text='${hook.line1}':x=92:y=122:fontcolor=white:fontsize=42:box=0,drawtext=text='${hook.line2}':x=92:y=180:fontcolor=white:fontsize=42:box=0`
  const headline = centeredHeadlineLayout(hookText)
  const centeredBrand = drawTextEscape(brandText || brandWordmark(`${hookText} ${inputPath}`)).slice(0, 24)
  const headlineFilter = headline.lines.map((line, index) => `drawtext=text='${drawTextEscape(line)}':x=(w-text_w)/2:y=${headline.firstY + index * headline.lineHeight}:fontcolor=white:fontsize=${headline.fontSize}:fontfile='media/assets/fonts/LilitaOne-Regular.ttf'`).join(',')
  const centeredBase = `scale=1028:658:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:588:color=black,${headlineFilter}`
  const centeredSubtitle = subtitlePath ? `subtitles='${subtitlePath.replaceAll("'", "'\\''")}'` : ''
  const centeredScreen = logoPath
    ? `[0:v]${centeredBase}[base];[1:v]scale=460:-1[logo];[base][logo]overlay=x=(W-w)/2:y=1390:format=auto[branded];${centeredSubtitle ? `[branded]${centeredSubtitle}[vout]` : '[branded]copy[vout]'}`
    : `${centeredBase},drawtext=text='${centeredBrand}':x=(w-text_w)/2:y=1426:fontcolor=white:fontsize=88:font='DejaVu Sans':borderw=3:bordercolor=black${centeredSubtitle ? `,${centeredSubtitle}` : ''}`
  const houseSubtitle = subtitlePath ? `[branded]subtitles='${subtitlePath.replaceAll("'", "'\\''")}'[vout]` : `[branded]copy[vout]`
  const houseStyle = logoPath
    ? `[0:v]split=2[srcmain][srcbg];[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.15:saturation=0.62[bg];color=c=0x050505:s=1080x1920:r=30:d=${Math.max(1, seconds(end, seconds(start, 0) + 45) - seconds(start, 0))}[base];[base][bg]overlay=0:0:format=auto,drawbox=x=0:y=0:w=1080:h=308:color=black@0.72:t=fill,drawbox=x=0:y=1035:w=1080:h=885:color=black@0.10:t=fill[underlay];[srcmain]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit];[1:v]scale=230:-1,format=rgba[logo];[underlay]${headlineFilter}[headline];[headline]drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel];[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto[withscreen];[withscreen][logo]overlay=x=(W-w)/2:y=1082:format=auto,drawtext=text='VIBE ZONE':x=(w-text_w)/2:y=1228:fontcolor=white@0.96:fontsize=78:fontfile='media/assets/fonts/LilitaOne-Regular.ttf':borderw=5:bordercolor=black,drawtext=text='SCREEN FIRST • WHITE TEXT • NO BLUE CARD':x=(w-text_w)/2:y=1322:fontcolor=white@0.82:fontsize=36:font='DejaVu Sans':borderw=4:bordercolor=black[branded];${houseSubtitle}`
    : `[0:v]split=2[srcmain][srcbg];[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:1,eq=brightness=-0.15:saturation=0.62[bg];[srcmain]scale=992:-2:force_original_aspect_ratio=decrease,setsar=1[screenfit];[bg]drawbox=x=0:y=0:w=1080:h=308:color=black@0.72:t=fill,${headlineFilter},drawbox=x=44:y=330:w=992:h=700:color=black@0.62:t=fill,drawbox=x=44:y=330:w=992:h=700:color=white@0.24:t=4[panel];[panel][screenfit]overlay=x=(W-w)/2:y=400:format=auto,drawtext=text='VIBE ZONE':x=(w-text_w)/2:y=1160:fontcolor=white:fontsize=88:fontfile='media/assets/fonts/LilitaOne-Regular.ttf':borderw=5:bordercolor=black${centeredSubtitle ? `,${centeredSubtitle}` : ''}`
  const facecamSubtitle = subtitlePath ? `[pipout]subtitles='${subtitlePath.replaceAll("'", "'\\''")}'[vout]` : `[pipout]copy[vout]`
  const facecamLowerFill = `drawbox=x=70:y=930:w=940:h=560:color=0x050505@0.84:t=fill,drawbox=x=70:y=930:w=940:h=560:color=white@0.28:t=4,drawtext=text='${hook.line1.toUpperCase()}':x=(w-text_w)/2:y=1058:fontcolor=white:fontsize=64:fontfile='media/assets/fonts/LilitaOne-Regular.ttf',drawtext=text='${hook.line2.toUpperCase()}':x=(w-text_w)/2:y=1134:fontcolor=white:fontsize=64:fontfile='media/assets/fonts/LilitaOne-Regular.ttf',drawtext=text='VIBE ZONE':x=(w-text_w)/2:y=1248:fontcolor=white@0.88:fontsize=34:font='DejaVu Sans':borderw=3:bordercolor=black`
  const facecamSmart = `[0:v]split=2[main][cam];[main]scale=-2:1920,crop=1080:1920:${pipBackgroundCropX}:0,boxblur=7:1,eq=brightness=-0.12:saturation=0.78[base];[cam]crop=${facecam.w}:${facecam.h}:${facecam.x}:${facecam.y},scale=520:-2,setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=white@0.34:t=3[face];[base][face]overlay=x=(W-w)/2:y=82:format=auto[withface];[withface]${facecamLowerFill}[pipout];${facecamSubtitle}`
  const filters = {
    long: { kind: 'vf', value: `scale=1920:-2${subtitle}` },
    'facecam-split': { kind: 'vf', value: `scale=-2:960,crop=1080:960,pad=1080:1920:0:0:color=0x101828,drawtext=text='Facecam / B-roll zone':x=(w-text_w)/2:y=1440:fontcolor=white@0.65:fontsize=44:box=1:boxcolor=black@0.35:boxborderw=24${subtitle}` },
    'right-focus': { kind: 'vf', value: `scale=-2:1920,crop=1080:1920:iw-ow-260:0${subtitle}` },
    'hook-card': { kind: 'vf', value: `scale=-2:1920,crop=1080:1920,${hookCard}${subtitle}` },
    'centered-screen': { kind: logoPath ? 'complex-logo' : 'vf', value: centeredScreen },
    'house-style': { kind: 'complex-logo', value: houseStyle },
    'facecam-smart': { kind: 'complex', value: facecamSmart },
    'facecam-right': { kind: 'vf', value: `scale=-2:1920,crop=1080:1920:iw-ow-260:0${subtitle}` },
    short: { kind: 'vf', value: `scale=-2:1920,crop=1080:1920${subtitle}` },
  }
  const filter = filters[mode] || filters.short
  // Coarse input seek plus accurate output trim avoids decoding a whole livestream,
  // while preventing tiny header-only MP4s when the start is far from a keyframe.
  const startSeconds = seconds(start, 0)
  const duration = Math.max(1, seconds(end, startSeconds + 45) - startSeconds)
  const preSeek = Math.max(0, startSeconds - 5)
  const trimSeek = startSeconds - preSeek
  const output = outputPath || `media/renders/${mode}-${Date.now()}.mp4`
  const filterArgs = filter.kind === 'complex' || filter.kind === 'complex-logo' ? ['-filter_complex', filter.value, '-map', '[vout]', '-map', '0:a?'] : ['-vf', filter.value]
  const encodeArgs = quality === 'draft' ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32'] : ['-c:v', 'libx264', '-preset', 'veryfast']
  const inputArgs = logoPath && ['centered-screen', 'house-style'].includes(mode) ? ['-ss', String(preSeek), '-i', inputPath, '-loop', '1', '-i', logoPath] : ['-ss', String(preSeek), '-i', inputPath]
  const args = ['-y', ...inputArgs, '-ss', String(trimSeek), '-t', String(duration), ...filterArgs, ...encodeArgs, '-c:a', 'aac', output]
  return { args, output, command: `ffmpeg ${args.map(shellArg).join(' ')}`, startSeconds, endSeconds: startSeconds + duration }
}
function shellArg(value) {
  const text = String(value)
  return /^[A-Za-z0-9_./:=+-]+$/.test(text) ? text : JSON.stringify(text)
}
async function sourceDimensions(inputPath) {
  const absolutePath = path.resolve(root, inputPath)
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', absolutePath], { timeout: 7000 })
  const [width, height] = stdout.trim().split('x').map(Number)
  return { width, height }
}
function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}
function roundedBox(box) {
  return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) }
}
function median(values = []) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
  if (!sorted.length) return 0
  return sorted[Math.floor(sorted.length / 2)]
}
function facecamFallback(reason = 'no-detection') {
  return {
    x: 0,
    y: 0,
    w: 520,
    h: 420,
    cropX: 0,
    bgCropX: 0,
    tracking: { fallback: true, reason, samples: [], detections: [], confidence: 0 },
  }
}
async function detectFacecamBox(inputPath, startSeconds = 0, endSeconds = startSeconds + 12) {
  const fallback = facecamFallback()
  try {
    const { width, height } = await sourceDimensions(inputPath)
    if (!width || !height) return facecamFallback('unknown-source-dimensions')
    const modelPath = path.join(root, '.venv-review', 'face_detection_yunet_2023mar.onnx')
    const pythonPath = path.join(root, '.venv-review', 'bin', 'python')
    const duration = Math.max(1, Number(endSeconds) - Number(startSeconds || 0))
    const rawSamples = [startSeconds + Math.min(2, duration * 0.18), startSeconds + duration * 0.5, Math.max(startSeconds + 0.5, endSeconds - Math.min(2, duration * 0.18))]
    const sampleSeconds = [...new Set(rawSamples.map((value) => Math.round(clampNumber(value, 0, Number.MAX_SAFE_INTEGER) * 100) / 100))]
    const script = `
import cv2, json, sys
video, model = sys.argv[1], sys.argv[2]
samples=[float(v) for v in sys.argv[3:]]
cap=cv2.VideoCapture(video)
results=[]
for ts in samples:
    cap.set(cv2.CAP_PROP_POS_MSEC, max(0, ts)*1000)
    ok, img=cap.read()
    if not ok:
        results.append({'ts':round(ts,2),'ok':False,'reason':'frame-read-failed'})
        continue
    h,w=img.shape[:2]
    det=cv2.FaceDetectorYN_create(model,'',(w,h),0.25,0.3,5000)
    ok, faces=det.detect(img)
    best=None
    if faces is not None:
        # Prefer real faces in the top half; that is where Masala's stream facecam lives.
        candidates=[]
        for d in faces:
            x,y,fw,fh,score = map(float, [d[0],d[1],d[2],d[3],d[-1]])
            if score < 0.25: continue
            top_bonus = 1.35 if y < h*0.45 else 0.75
            left_bonus = 1.15 if x < w*0.45 else 0.9
            area_bonus = min((fw*fh)/(w*h)*80, 1.3)
            candidates.append((score*top_bonus*left_bonus+area_bonus, x,y,fw,fh,score))
        if candidates:
            rank,x,y,fw,fh,score=max(candidates, key=lambda item:item[0])
            cx=x+fw/2; cy=y+fh/2
            box_w=min(w, max(390, fw*3.7))
            box_h=min(h, max(285, fh*2.25))
            bx=max(0, min(w-box_w, cx-box_w/2))
            by=max(0, min(h-box_h, cy-box_h*0.42))
            best={'ts':round(ts,2),'ok':True,'rank':round(rank,3),'x':round(bx),'y':round(by),'w':round(box_w),'h':round(box_h),'face':{'x':round(x),'y':round(y),'w':round(fw),'h':round(fh),'score':round(score,3)}}
    results.append(best or {'ts':round(ts,2),'ok':True,'reason':'no-face'})
print(json.dumps({'samples':results}))
`
    const result = await execFileAsync(pythonPath, ['-c', script, path.resolve(root, inputPath), modelPath, ...sampleSeconds.map(String)], { timeout: 25000, maxBuffer: 1024 * 1024 })
    const payload = JSON.parse(result.stdout || '{}')
    const detections = (payload.samples || []).filter((item) => item?.w && item?.h)
    if (!detections.length) {
      return { ...fallback, tracking: { ...fallback.tracking, samples: payload.samples || [], reason: 'no-face-across-samples' } }
    }
    const aggregate = roundedBox({
      x: median(detections.map((item) => item.x)),
      y: median(detections.map((item) => item.y)),
      w: median(detections.map((item) => item.w)),
      h: median(detections.map((item) => item.h)),
    })
    aggregate.w = Math.round(clampNumber(aggregate.w, 390, width))
    aggregate.h = Math.round(clampNumber(aggregate.h, 285, height))
    aggregate.x = Math.round(clampNumber(aggregate.x, 0, Math.max(0, width - aggregate.w)))
    aggregate.y = Math.round(clampNumber(aggregate.y, 0, Math.max(0, height - aggregate.h)))
    const scaledWidth = Math.round((width * 1920) / height)
    const faceCenterX = (aggregate.x + aggregate.w / 2) / width * scaledWidth
    const cropX = Math.max(0, Math.min(scaledWidth - 1080, Math.round(faceCenterX - 540)))
    const faceCenterSourceX = aggregate.x + aggregate.w / 2
    const bgCropX = faceCenterSourceX < width / 2 ? Math.max(0, scaledWidth - 1080) : 0
    const confidence = Math.round((detections.length / sampleSeconds.length) * 100) / 100
    return {
      ...aggregate,
      cropX,
      bgCropX,
      tracking: {
        fallback: false,
        reason: 'multi-sample-median',
        confidence,
        sampleSeconds,
        samples: payload.samples || [],
        detections: detections.map((item) => ({ ts: item.ts, x: item.x, y: item.y, w: item.w, h: item.h, score: item.face?.score || 0 })),
      },
    }
  } catch (error) {
    return facecamFallback((error.message || 'facecam-detect-error').slice(0, 120))
  }
}
function buildFfmpegCommand(options) { return ffmpegPlan(options).command }
function slug(value = 'clip') { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'clip' }
function selectedRenderPreset(presetId = 'house-style', videoId = 'VIDEO_ID') {
  const houseDefault = { preset: 'house-style', mode: 'house-style', subtitlePath: '' }
  const presets = {
    'punchy-captions': { preset: 'punchy-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'standard-captions': { preset: 'standard-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.srt` },
    'no-captions': { preset: 'no-captions', mode: 'short', subtitlePath: '' },
    'facecam-split': { preset: 'facecam-split', mode: 'facecam-split', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'right-focus-captions': { preset: 'right-focus-captions', mode: 'right-focus', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'hook-card': { preset: 'hook-card', mode: 'hook-card', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'house-style': houseDefault,
    // Masala regression guard: default/caught clips must stay in the branded
    // screen-context house layout. The older centered-screen preset can miss
    // the logo/brand lane, so keep it as an explicit variant only.
    'centered-screen': houseDefault,
    'centered-screen-variant': { preset: 'centered-screen-variant', mode: 'centered-screen', subtitlePath: '' },
    // Legacy callers used `facecam-smart` as a default, which collapsed caught
    // clips into the square face-box / blue-card family. Keep that style
    // available only under an explicit variant id; plain `facecam-smart` now
    // safely renders the screen/context-first house style.
    'facecam-smart': houseDefault,
    'facecam-smart-variant': { preset: 'facecam-smart-variant', mode: 'facecam-smart', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'facecam-right': { preset: 'facecam-right', mode: 'facecam-right', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'long-standard': { preset: 'long-standard', mode: 'long', subtitlePath: `media/transcripts/${videoId}.srt` },
  }
  return presets[presetId] || houseDefault
}
async function renderSelectedClip(db, clipId, body = {}) {
  await ensureMediaDirs()
  const clip = db.clips.find((item) => item.id === clipId)
  if (!clip) return { status: 404, body: { error: 'Clip not found' } }
  const latest = latestStreamCandidate(db.videos)
  const transcript = db.transcripts.find((item) => item.id === clip.transcriptId)
  if (!body.inputPath && !body.allowArchived && latest?.id && transcript?.sourceUrl && !transcript.sourceUrl.includes(latest.id)) {
    const detail = `Current scope is newest Masala stream only (${latest.id}). This clip belongs to ${transcript.sourceUrl || transcript.title}.`
    clip.renderStatus = 'needs-review'; clip.renderError = detail
    const job = await addMediaJob(db, 'render-selected', 'needs-review', detail, '')
    return { status: 200, body: { clip, job } }
  }
  const videoId = body.videoId || videoIdFromUrl(transcript?.sourceUrl || '') || latest?.id || 'VIDEO_ID'
  const presetConfig = selectedRenderPreset(body.presetId, videoId)
  const inputPath = body.inputPath || `media/downloads/${videoId}.mp4`
  const mode = body.mode || presetConfig.mode
  let subtitlePath = body.subtitlePath ?? presetConfig.subtitlePath
  if ((body.spokenCaptions ?? true) && ['facecam-smart', 'hook-card', 'short', 'centered-screen', 'house-style'].includes(mode)) {
    try {
      const startSeconds = seconds(clip.start, 0)
      const preSeek = Math.max(0, startSeconds - 5)
      subtitlePath = await writeSpokenCaptionAss(videoId, clip, startSeconds - preSeek, ['centered-screen', 'house-style'].includes(mode) ? 'centered-screen' : 'bottom') || subtitlePath
    } catch (error) {
      const detail = `Blocked render: one-word short-form caption QA failed. ${error.message || error}`
      clip.renderStatus = 'needs-review'; clip.renderError = detail; clip.renderPreset = presetConfig.preset
      const job = await addMediaJob(db, 'render-selected', 'needs-review', detail, '')
      return { status: 200, body: { clip, job } }
    }
  }
  const preset = presetConfig.preset
  const outputPath = body.outputPath || `media/renders/${videoId}-${clip.id.slice(-6)}-${slug(clip.title)}-${preset}.mp4`
  const probe = await commandExists('ffmpeg', ['-version'])
  const inputReady = await localFileExists(inputPath)
  const subtitleReady = !subtitlePath || await localFileExists(subtitlePath)
  if (!probe.ok || !inputReady || !subtitleReady) {
    const detail = !probe.ok ? 'ffmpeg missing; cannot render selected clip.' : !inputReady ? `Waiting for local source media: ${inputPath}` : `Waiting for subtitle preset file: ${subtitlePath}`
    clip.renderStatus = !probe.ok ? 'failed' : 'needs-review'; clip.renderError = detail; clip.renderPreset = preset
    const job = await addMediaJob(db, 'render-selected', clip.renderStatus, detail, buildFfmpegCommand({ inputPath, start: clip.start, end: clip.end, mode, subtitlePath, outputPath }))
    return { status: 200, body: { clip, job } }
  }
  const validation = await validateMediaFile(inputPath)
  const endSeconds = seconds(clip.end, 0)
  if (validation.status === 'partial' && validation.lastPacketSeconds && endSeconds > validation.lastPacketSeconds - 2) {
    const detail = `Blocked selected render: clip ends at ${stamp(endSeconds)}, but source is only decodable to ${stamp(validation.lastPacketSeconds)}. Import a complete newest-stream source first.`
    clip.renderStatus = 'needs-review'; clip.renderError = detail; clip.renderPreset = preset
    const job = await addMediaJob(db, 'render-selected', 'needs-review', detail, buildFfmpegCommand({ inputPath, start: clip.start, end: clip.end, mode, subtitlePath, outputPath }))
    return { status: 200, body: { clip, job } }
  }
  const facecamBox = mode === 'facecam-smart' ? await detectFacecamBox(inputPath, seconds(clip.start, 0), seconds(clip.end, seconds(clip.start, 0) + 12)) : null
  if (facecamBox?.tracking) clip.facecamTracking = facecamBox.tracking
  const plan = ffmpegPlan({ inputPath, start: clip.start, end: clip.end, mode, subtitlePath, outputPath, cropX: facecamBox?.cropX || 0, facecamBox, hookText: body.headline || (['hook-card', 'centered-screen', 'house-style'].includes(mode) ? clip.title : (clip.hook || clip.title)), quality: body.quality || 'standard', brandText: body.brandText || brandWordmark(`${clip.title} ${clip.hook}`), logoPath: body.logoPath || (mode === 'house-style' || (mode === 'centered-screen' && /openclaw/i.test(body.brandText || brandWordmark(`${clip.title} ${clip.hook}`))) ? 'media/assets/logos/openclaw-logo-text.png' : '') })
  clip.renderStatus = 'running'; clip.renderPreset = preset; clip.renderPath = outputPath; clip.renderError = ''
  await saveDb(db)
  try {
    await execFileAsync('ffmpeg', plan.args, { cwd: root, timeout: 180000, maxBuffer: 1024 * 1024 * 20 })
    clip.renderStatus = 'done'; clip.status = clip.status === 'idea' ? 'draft' : clip.status; clip.renderPath = outputPath; clip.renderUrl = `/${outputPath}`; clip.renderError = ''
    const facecamSummary = facecamBox?.tracking ? ` Facecam tracking: ${facecamBox.tracking.reason}, confidence ${facecamBox.tracking.confidence ?? 0}, fallback ${facecamBox.tracking.fallback ? 'yes' : 'no'}.` : ''
    const job = await addMediaJob(db, 'render-selected', 'done', `Rendered selected clip ${clip.title} (${clip.start}-${clip.end}) to ${outputPath}.${facecamSummary}`, plan.command)
    return { status: 200, body: { clip, job } }
  } catch (error) {
    const detail = `Selected clip render failed: ${(error.stderr || error.message || '').split('\n').slice(-4).join(' ')}`
    clip.renderStatus = 'failed'; clip.renderError = detail
    const job = await addMediaJob(db, 'render-selected', 'failed', detail, plan.command)
    return { status: 200, body: { clip, job } }
  }
}
function clipPlatformChecklist(platform = 'tiktok') {
  const common = ['Watch the full rendered file once before upload', 'Confirm subtitles are not covered by platform UI', 'Use manual posting only — Vibe Zone does not publish externally']
  if (platform === 'youtube') return ['Upload as YouTube Short if vertical and under 60s; otherwise use normal video flow', 'Title should lead with the strongest promise/result', ...common]
  if (platform === 'x') return ['Use the clip as proof, then add a short build-in-public lesson', 'Keep the post human and specific: what changed, what failed, what is next', ...common]
  return ['Post as TikTok first for quantity-first validation', 'Test 3 hook/caption variants before promoting winners to YouTube/X', ...common]
}
async function exportClipBundle(db, clipId) {
  await ensureMediaDirs()
  const clip = db.clips.find((item) => item.id === clipId)
  if (!clip) return { status: 404, body: { error: 'Clip not found' } }
  const transcript = db.transcripts.find((item) => item.id === clip.transcriptId)
  const platform = clip.platform || 'tiktok'
  const bundleDir = `media/exports/${clip.id}-${slug(clip.title)}`
  await mkdir(path.join(root, bundleDir), { recursive: true })
  const checklist = clipPlatformChecklist(platform)
  const metadata = {
    id: clip.id,
    title: clip.title,
    platform,
    status: 'exported',
    sourceUrl: transcript?.sourceUrl || '',
    start: clip.start,
    end: clip.end,
    hook: clip.hook,
    caption: clip.caption,
    hashtags: clip.hashtags || [],
    seo: clip.seo || null,
    renderPath: clip.renderPath || '',
    createdAt: new Date().toISOString(),
  }
  const seo = clip.seo || null
  const youtubeDescription = seo?.description || seo?.youtubeDescription || clip.caption || ''
  const tiktokDescription = seo?.tiktokDescription || seo?.tiktokCaption || clip.caption || ''
  const titleVariants = seo?.titleVariants || seo?.hookVariants || []
  const uploadCard = `# Upload Card — ${clip.title}

- Platform: ${platform.toUpperCase()}
- Source: ${metadata.sourceUrl || 'local transcript'}
- Timecode: ${clip.start}–${clip.end}
- Render: ${clip.renderPath || 'not rendered yet'}

## Hook
${clip.hook}

## Caption
${clip.caption}

## Hashtags
${(clip.hashtags || []).join(' ')}
${seo ? `
## YouTube SEO
- Primary keyword: ${seo.primaryKeyword || ''}
- Search intent: ${seo.searchIntent || ''}
- Suggested title: ${seo.youtubeTitle || clip.title}
- File name: ${seo.fileName || slug(`${clip.title}-${platform}`)}.mp4

### Description
${youtubeDescription}

### TikTok Description
${tiktokDescription}

### Tags
${(seo.tags || clip.hashtags || []).join(', ')}

### Title variants
${titleVariants.map((item) => `- ${item}`).join('\n')}

### Pinned comment
${seo.pinnedComment || seo.manualNote || ''}

### Thumbnail brief
${seo.thumbnailText ? `Text: ${seo.thumbnailText}` : ''}
` : ''}
## Manual upload checklist
${checklist.map((item) => `- [ ] ${item}`).join('\n')}
`
  await writeFile(path.join(root, bundleDir, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(root, bundleDir, 'upload-card.md'), uploadCard)
  clip.status = 'exported'
  clip.exportedAt = metadata.createdAt
  clip.exportBundlePath = bundleDir
  const job = await addMediaJob(db, 'export-bundle', 'done', `Built manual upload bundle for ${clip.title}: ${bundleDir}/upload-card.md`, '')
  return { status: 200, body: { clip, job, bundleDir, files: [`${bundleDir}/upload-card.md`, `${bundleDir}/metadata.json`] } }
}
async function ingestLatestLocalMedia(db, body = {}) {
  await ensureMediaDirs()
  const target = latestStreamCandidate(db.videos)
  const requestedId = body.videoId || videoIdFromUrl(body.sourceUrl || '') || target?.id
  const scopeBlocker = latestOnlyBlocker(requestedId, target)
  if (scopeBlocker) return await addMediaJob(db, 'local-ingest', 'needs-review', scopeBlocker, '')
  const videoId = target?.id || requestedId
  if (!videoId) return await addMediaJob(db, 'local-ingest', 'needs-review', 'Scan YouTube first so Vibe Zone knows the newest stream id to import.', '')
  const sourceUrl = target?.url || body.sourceUrl || `https://www.youtube.com/watch?v=${videoId}`
  const transcriptPath = body.transcriptPath || `media/transcripts/${videoId}.txt`
  const subtitlePath = body.subtitlePath || `media/transcripts/${videoId}.srt`
  const mediaPath = body.inputPath || `media/downloads/${videoId}.mp4`
  const transcriptReady = await localFileExists(transcriptPath)
  const subtitleReady = await localFileExists(subtitlePath)
  const mediaReady = await localFileExists(mediaPath)
  if (!transcriptReady) {
    return await addMediaJob(db, 'local-ingest', 'needs-review', `Waiting for newest stream transcript: ${transcriptPath}. Use local companion download/transcribe for ${sourceUrl}, then rerun local ingest.`, '')
  }
  const text = await readFile(path.resolve(root, transcriptPath), 'utf8')
  const scoringText = subtitleReady ? await readFile(path.resolve(root, subtitlePath), 'utf8') : text
  const existing = db.transcripts.find((item) => item.sourceUrl === sourceUrl || item.title.includes(videoId))
  const transcript = existing || { id: id('tx'), title: `${target?.title || 'Newest stream'} (${videoId})`, sourceUrl, text, createdAt: new Date().toISOString() }
  transcript.text = text
  transcript.sourceUrl = sourceUrl
  if (!existing) db.transcripts.unshift(transcript)
  const clips = scoreClips(transcript.id, scoringText)
  db.clips = [...clips, ...db.clips.filter((clip) => clip.transcriptId !== transcript.id)].slice(0, 80)
  const detail = `Imported ${transcriptPath} (${text.length} chars), generated ${clips.length} clip candidates. Media ${mediaReady ? 'ready' : 'missing'}: ${mediaPath}; subtitles ${subtitleReady ? 'ready' : 'missing'}: ${subtitlePath}.`
  return await addMediaJob(db, 'local-ingest', subtitleReady && mediaReady ? 'done' : 'needs-review', detail, subtitleReady && mediaReady ? buildFfmpegCommand({ inputPath: mediaPath, start: clips[0]?.start || '0:00', end: clips[0]?.end || '0:45', mode: 'short', subtitlePath }) : '')
}
function huntViralIdeas(videos, clips, transcripts = []) {
  const latest = latestStreamCandidate(videos)
  const latestTranscripts = latest ? transcripts.filter((item) => item.sourceUrl?.includes(latest.id) || item.title?.includes(latest.id)) : transcripts
  const latestTranscriptIds = new Set(latestTranscripts.map((item) => item.id))
  const scopedClips = latestTranscriptIds.size ? clips.filter((clip) => latestTranscriptIds.has(clip.transcriptId)) : clips
  const keywordScore = (text) => ['ai', 'money', 'company', 'privacy', 'live', 'app', 'coding', 'why', 'billion', 'possible', 'build', 'ship'].filter((k) => text.toLowerCase().includes(k)).length
  const opusPattern = (title, hook = '') => {
    const text = `${title} ${hook}`.toLowerCase()
    if (/money|mrr|\$|revenue/.test(text)) return 'Opus-style money/proof hook: lead with the number, then show the uncomfortable build-in-public lesson.'
    if (/fix|bug|stuck|blocked|failed|wrong/.test(text)) return 'Problem-resolution hook: open on the mistake/blocker, then cut quickly to the fix.'
    if (/agent|ai|automation|workflow/.test(text)) return 'AI workflow hook: show the agent outcome first, then reveal the setup in captions.'
    return 'Curiosity hook: tighten the first 2 seconds, add high-contrast captions, and test 3 platform-native titles.'
  }
  const newestStreamLead = latest ? [{
    source: 'newest-stream-scope',
    title: latest.title,
    url: latest.url,
    score: 70 + keywordScore(latest.title) * 6,
    angle: `Current-scope lead only: cut Masala's newest stream first (${latest.id}). ${opusPattern(latest.title)}`,
  }] : []
  return [...newestStreamLead, ...scopedClips.slice(0, 18).map((clip) => ({
    source: 'clip-factory',
    title: clip.title,
    url: '',
    score: Math.min(99, clip.score + 4 + keywordScore(`${clip.title} ${clip.hook}`) * 2),
    angle: `${opusPattern(clip.title, clip.hook)} Clip-first viral test: ${clip.hook}`,
  }))]
    .sort((a, b) => b.score - a.score).slice(0, 12)
}
async function parseBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
async function resolveChannelId(channelUrl) {
  const html = await (await fetch(channelUrl, { headers: { 'user-agent': 'VibeZoneLocal/0.1' } })).text()
  const match = html.match(/"channelId":"(UC[\w-]+)"/)
    || html.match(/<meta itemprop="channelId" content="(UC[\w-]+)">/)
    || html.match(/"externalId":"(UC[\w-]+)"/)
    || html.match(/channel_id=(UC[\w-]+)/)
  if (!match) throw new Error('Could not resolve channel id from public channel page')
  return match[1]
}
async function fetchTextOrThrow(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'VibeZoneLocal/0.1' } })
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)
  return await response.text()
}
async function scanYoutubeTab(channelUrl, tab, startedAt) {
  const url = `${channelUrl.replace(/\/$/, '')}/${tab}`
  const { stdout } = await execFileAsync(localYtDlp, ['--flat-playlist', '--dump-single-json', '--playlist-end', '20', url], { timeout: 45000, maxBuffer: 1024 * 1024 * 8 })
  const data = JSON.parse(stdout)
  return (data.entries || []).filter((entry) => entry.id && entry.title).map((entry, index) => ({
    id: entry.id,
    title: entry.title,
    url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
    published: entry.timestamp ? new Date(entry.timestamp * 1000).toISOString() : startedAt,
    author: data.uploader || data.channel || 'Modern Responsibility',
    kind: tab === 'streams' ? 'stream' : tab === 'shorts' ? 'short' : 'video',
    duration: entry.duration || null,
    sortRank: `${tab}:${String(index).padStart(3, '0')}`,
  }))
}
async function scanYoutubeFallback(channelUrl, startedAt) {
  const probe = await commandExists(localYtDlp)
  if (!probe.ok) throw new Error(`RSS scan failed and yt-dlp fallback is unavailable: ${probe.detail}`)
  const tabs = await Promise.all(['streams', 'shorts', 'videos'].map(async (tab) => {
    try { return await scanYoutubeTab(channelUrl, tab, startedAt) }
    catch { return [] }
  }))
  const seen = new Set()
  return tabs.flat().filter((video) => {
    if (seen.has(video.id)) return false
    seen.add(video.id)
    return true
  })
}
function tagText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? decode(match[1]) : ''
}
function decode(text) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
}

async function scanYoutube(db) {
  const startedAt = new Date().toISOString()
  const job = await addJob(db, 'youtube-scan', 'Scan YouTube channel', 'running', db.settings.channelUrl)
  await saveDb(db)
  try {
    const channelId = await resolveChannelId(db.settings.channelUrl)
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const xml = await fetchTextOrThrow(rssUrl)
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
      const entry = m[1]
      const videoId = tagText(entry, 'yt:videoId')
      return {
        id: videoId,
        title: tagText(entry, 'title'),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published: tagText(entry, 'published'),
        updated: tagText(entry, 'updated'),
        author: tagText(entry, 'name'),
        kind: /shorts/i.test(tagText(entry, 'link')) ? 'short' : 'video',
      }
    })
    if (!entries.length) throw new Error('Public RSS returned no videos')
    db.videos = entries
    const scan = { id: id('scan'), channelUrl: db.settings.channelUrl, channelId, status: 'done', startedAt, finishedAt: new Date().toISOString(), count: entries.length, error: null }
    db.scans.unshift(scan)
    job.status = 'done'; job.detail = `Found ${entries.length} recent public RSS videos.`
    await saveDb(db)
    return scan
  } catch (error) {
    try {
      const entries = await scanYoutubeFallback(db.settings.channelUrl, startedAt)
      if (!entries.length) throw new Error('yt-dlp fallback returned no public tab entries')
      db.videos = entries
      const scan = { id: id('scan'), channelUrl: db.settings.channelUrl, status: 'needs-review', startedAt, finishedAt: new Date().toISOString(), count: entries.length, error: `RSS unavailable (${error.message}); used yt-dlp public tab fallback.` }
      db.scans.unshift(scan)
      job.status = 'needs-review'; job.detail = `Found ${entries.length} public tab entries via yt-dlp fallback because RSS failed.`
      await saveDb(db)
      return scan
    } catch (fallbackError) {
      const scan = { id: id('scan'), channelUrl: db.settings.channelUrl, status: 'failed', startedAt, finishedAt: new Date().toISOString(), count: 0, error: `${error.message}; fallback failed: ${fallbackError.message}` }
      db.scans.unshift(scan)
      job.status = 'failed'; job.detail = scan.error
      await saveDb(db)
      return scan
    }
  }
}
async function localFileExists(inputPath) {
  try { return (await stat(path.resolve(root, inputPath))).isFile() }
  catch { return false }
}
function parseTranscript(text) {
  if (text.includes('-->')) {
    const blocks = text.split(/\n\s*\n/)
    const rows = []
    for (const [index, block] of blocks.entries()) {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      const timeLine = lines.find((line) => line.includes('-->'))
      if (!timeLine) continue
      const [startRaw, endRaw] = timeLine.split('-->').map((part) => part.trim())
      const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (textLines) rows.push({ time: normalizeStamp(startRaw), endTime: normalizeStamp(endRaw), text: textLines, index })
    }
    if (rows.length) return rows
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.map((line, index) => {
    const range = line.match(/^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d+)?)(?:\])?\s*[-–>]\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d+)?)\s+(.+)$/)
    if (range) return { time: normalizeStamp(range[1]), endTime: normalizeStamp(range[2]), text: range[3], index }
    const match = line.match(/^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?(?:[,.]\d+)?)(?:\])?\s*[-–:]?\s*(.+)$/)
    return match ? { time: normalizeStamp(match[1]), endTime: null, text: match[2], index } : { time: null, endTime: null, text: line, index }
  })
}
function normalizeStamp(value = '') { return value.replace(',', '.').replace(/^00:/, '') }
function seconds(time, fallback) {
  if (!time) return fallback
  const parts = String(time).replace(',', '.').split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return fallback
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
}
function stamp(total) {
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = Math.floor(total % 60)
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}
function timedChunks(rows) {
  if (!rows.some((row) => row.time)) {
    const chunks = []
    for (let i = 0; i < rows.length; i += 3) chunks.push(rows.slice(i, i + 7))
    return chunks
  }
  const chunks = []
  for (let i = 0; i < rows.length; i += 4) {
    const chunk = []
    for (let j = i; j < rows.length; j += 1) {
      chunk.push(rows[j])
      const start = seconds(chunk[0]?.time, i * 45)
      const last = chunk.at(-1)
      const end = seconds(last?.endTime || last?.time, start) + (last?.endTime ? 0 : 2)
      const duration = end - start
      const words = chunk.map((row) => row.text).join(' ').split(/\s+/).filter(Boolean).length
      if ((duration >= 12 && words >= 28) || duration >= 45 || words >= 90) break
    }
    const start = seconds(chunk[0]?.time, i * 45)
    const last = chunk.at(-1)
    const end = seconds(last?.endTime || last?.time, start) + (last?.endTime ? 0 : 2)
    if (chunk.length && end - start >= 6) chunks.push(chunk)
  }
  return chunks
}
function scoreClips(transcriptId, text) {
  const rows = parseTranscript(text)
  const chunks = timedChunks(rows)
  const keywords = ['why', 'how', 'build', 'secret', 'mistake', 'stop', 'actually', 'ship', 'money', 'creator', 'ai', 'local', 'stream', 'problem']
  const candidates = chunks.map((chunk, i) => {
    const body = chunk.map((r) => r.text).join(' ')
    const lower = body.toLowerCase()
    const keywordHits = keywords.filter((k) => lower.includes(k)).length
    const questionBoost = (body.match(/\?/g) || []).length * 4
    const energyBoost = Math.min(12, (body.match(/!|actually|really|never|always/gi) || []).length * 3)
    const score = Math.min(98, 45 + keywordHits * 7 + questionBoost + energyBoost + Math.min(10, Math.round(body.length / 180)))
    const start = seconds(chunk[0]?.time, i * 45)
    const last = chunk.at(-1)
    const rawEnd = seconds(last?.endTime || last?.time, start + 55) + (last?.endTime ? 0 : 8)
    const end = Math.max(start + 8, rawEnd)
    const hook = makeHook(body)
    return {
      id: id('clip'), transcriptId, score, platform: 'tiktok', status: 'idea', exportedAt: null, start: stamp(start), end: stamp(end),
      title: makeTitle(body), hook,
      caption: `${hook} ${body.slice(0, 180).replace(/\s+/g, ' ')}...`,
      hashtags: ['#BuildInPublic', '#CreatorTools', '#AIWorkflow', '#LocalFirst'].slice(0, 3 + (keywordHits > 2 ? 1 : 0)),
      reason: `Heuristic score: ${keywordHits} strong keyword hits, ${questionBoost ? 'question energy, ' : ''}${energyBoost ? 'high-emphasis language, ' : ''}dense clip-sized segment.`,
      createdAt: new Date().toISOString(),
    }
  }).filter((c) => c.score >= 55).sort((a, b) => b.score - a.score)
  return dedupeClips(candidates).slice(0, 12)
}
function textTokens(value = '') {
  const stop = new Set(['the', 'and', 'that', 'this', 'with', 'you', 'your', 'for', 'are', 'but', 'not', 'just', 'was', 'have', 'from', 'they', 'then', 'when', 'what', 'how', 'why', 'into', 'like'])
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 3 && !stop.has(word)))
}
function tokenSimilarity(a = '', b = '') {
  const left = textTokens(a), right = textTokens(b)
  if (!left.size || !right.size) return 0
  let overlap = 0
  for (const token of left) if (right.has(token)) overlap += 1
  return overlap / Math.min(left.size, right.size)
}
function clipStartSeconds(clip) { return seconds(clip.start, 0) }
function dedupeClips(clips, similarityLimit = 0.72, nearbySeconds = 90) {
  const selected = []
  for (const clip of clips) {
    const tooSimilar = selected.some((chosen) => {
      const nearby = Math.abs(clipStartSeconds(clip) - clipStartSeconds(chosen)) < nearbySeconds
      const similarTitle = clip.title === chosen.title
      const similarHook = tokenSimilarity(`${clip.title} ${clip.hook}`, `${chosen.title} ${chosen.hook}`) >= similarityLimit
      return similarTitle || (nearby && similarHook)
    })
    if (!tooSimilar) selected.push(clip)
  }
  return selected
}
function makeHook(body) {
  const sentence = body.split(/[.!?]/).map((s) => s.trim()).find((s) => s.length > 28) || body.slice(0, 90)
  if (/stop|don't|never/i.test(sentence)) return sentence.replace(/^./, (c) => c.toUpperCase()) + '.'
  if (/why|how/i.test(sentence)) return sentence.replace(/^./, (c) => c.toUpperCase()) + '?'
  return `The part nobody clips: ${sentence.slice(0, 80)}...`
}
function makeTitle(body) {
  if (/local/i.test(body)) return 'Why local-first creator tools matter'
  if (/ai|agent/i.test(body)) return 'AI agents that actually do work'
  if (/ship|build/i.test(body)) return 'Stop overbuilding and ship the workflow'
  return body.split(/\s+/).slice(0, 7).join(' ')
}

function thumbnailSlug(value = 'thumbnail-concept') {
  return String(value || 'thumbnail-concept').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'thumbnail-concept'
}
function thumbnailText(body = '') {
  const lower = body.toLowerCase()
  if (/thumbnail|blur|mid|face/i.test(body)) return 'WHY SO MID?'
  if (/agent|ai|automation/i.test(body)) return 'AI DID THIS?'
  if (/leak|secret|private/i.test(body)) return 'DON’T LEAK THIS'
  if (/upload|clip|short|tiktok|youtube/i.test(body)) return 'CLIP MACHINE'
  if (/build|ship|coding|vibe/i.test(body)) return 'BUILDING LIVE'
  return 'WAIT… WHAT?'
}
function thumbnailVisualAngle(body = '') {
  if (/thumbnail|blur|mid|face/i.test(body)) return 'Large expressive Masala face on one side, bad thumbnail/blurred preview on the other, red arrow/circle around the obvious flaw.'
  if (/agent|ai|automation/i.test(body)) return 'Masala reacting to a small army of AI agent windows doing work, one bright success signal in the background.'
  if (/leak|secret|private/i.test(body)) return 'Masala shocked, screen area intentionally blurred/blocked, giant warning tape motif; stream-safe, no readable private text.'
  if (/upload|clip|short|tiktok|youtube/i.test(body)) return 'Masala holding or pointing at a stack of short-form cards moving from stream to TikTok/YouTube.'
  return 'Masala face-led reaction, tight crop, one clear object from the stream, high contrast background, 2–4 word headline.'
}
function thumbnailConceptFromClip(clip, transcriptTitle = 'Stream transcript') {
  const sourceText = `${clip.title}. ${clip.hook}. ${clip.caption || ''}`
  const titleText = thumbnailText(sourceText)
  return {
    id: id('thumb'),
    sourceClipId: clip.id,
    sourceTranscriptId: clip.transcriptId,
    sourceTitle: transcriptTitle,
    status: 'idea',
    rating: null,
    title: clip.title,
    thumbnailText: titleText,
    visualAngle: thumbnailVisualAngle(sourceText),
    emotion: /secret|leak/i.test(sourceText) ? 'panic / caught-in-the-act' : /thumbnail|mid|blur/i.test(sourceText) ? 'frustrated disbelief' : 'surprised confidence',
    style: 'Hyper-realistic face-led, GothamChess-inspired contrast, huge readable text, arrows/circles only when they clarify the click.',
    prompt: `YouTube thumbnail concept: ${titleText}. ${thumbnailVisualAngle(sourceText)} Hyper-realistic expressive creator face, dramatic contrast, clean background, no private readable text, 16:9 composition.`,
    learningNotes: '',
    createdAt: new Date().toISOString(),
  }
}
function dedupeThumbnailConcepts(concepts) {
  const seen = new Set()
  return concepts.filter((concept) => {
    const key = `${concept.sourceClipId || ''}:${concept.thumbnailText}:${concept.visualAngle}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
function updateThumbnailPreferenceProfile(db, concept) {
  const concepts = db.thumbnailConcepts || []
  const liked = concepts.filter((item) => item.rating === 'like' || item.status === 'liked' || item.status === 'used')
  const disliked = concepts.filter((item) => item.rating === 'dislike' || item.status === 'disliked')
  const summarize = (items) => items.slice(0, 12).map((item) => ({
    id: item.id,
    text: item.thumbnailText,
    title: item.title,
    style: item.style,
    visualAngle: item.visualAngle,
    emotion: item.emotion,
    notes: item.learningNotes || '',
  }))
  db.settings = db.settings || {}
  db.settings.thumbnailPreferenceProfile = {
    updatedAt: new Date().toISOString(),
    lastFeedbackId: concept?.id || null,
    liked: summarize(liked),
    disliked: summarize(disliked),
    guidance: liked.length || disliked.length
      ? `Prefer patterns similar to liked thumbnails (${liked.map((item) => item.thumbnailText).filter(Boolean).slice(0, 6).join(', ') || 'none yet'}). Avoid disliked patterns (${disliked.map((item) => item.thumbnailText).filter(Boolean).slice(0, 6).join(', ') || 'none yet'}). Use this profile when generating future Thumbnail Lab concepts.`
      : 'No thumbnail preference feedback yet.',
  }
  db.settings.thumbnailStyle = `Learned thumbnail direction: ${db.settings.thumbnailPreferenceProfile.guidance}`.slice(0, 500)
}
function thumbnailVariant(concept, variantIndex = 0) {
  if (!variantIndex) return concept
  const textVariants = [concept.thumbnailText, 'WAIT… WHAT?', 'I BUILT THIS LIVE', 'THIS CHANGED EVERYTHING', 'AI DID THIS?', 'WHY SO MID?', 'CLIP MACHINE', 'DON’T LEAK THIS']
  const emotionVariants = ['shocked disbelief', 'focused confidence', 'frustrated laugh', 'caught-in-the-act panic', 'big breakthrough energy', 'curious “is this working?” face']
  const variantText = textVariants[(variantIndex + textVariants.indexOf(concept.thumbnailText) + textVariants.length) % textVariants.length]
  return {
    ...concept,
    id: id('thumb'),
    thumbnailText: variantText,
    emotion: emotionVariants[variantIndex % emotionVariants.length],
    visualAngle: `${concept.visualAngle} Variant ${variantIndex}: change the crop, expression, and colour contrast so it feels like a distinct A/B thumbnail concept.`,
    prompt: `YouTube thumbnail concept: ${variantText}. ${concept.visualAngle} Variant ${variantIndex}: distinct crop/expression/colour contrast. Hyper-realistic expressive creator face, dramatic contrast, clean background, no private readable text, 16:9 composition.`,
    createdAt: new Date().toISOString(),
  }
}
async function generateThumbnailConcepts(db, limit = 50) {
  const targetCount = Math.max(1, Number(limit || 50))
  const transcriptById = new Map(db.transcripts.map((t) => [t.id, t.title]))
  const feedback = db.settings?.thumbnailConceptFeedback || {}
  const preferenceProfile = db.settings?.thumbnailPreferenceProfile || {}
  const dislikedTexts = new Set([
    ...(db.thumbnailConcepts || []).filter((c) => c.rating === 'dislike' || feedback[c.id] === 'dislike').map((c) => String(c.thumbnailText || '').toLowerCase()),
    ...(preferenceProfile.disliked || []).map((c) => String(c.text || '').toLowerCase()),
  ].filter(Boolean))
  const existingKeys = new Set((db.thumbnailConcepts || []).map((c) => `${c.sourceClipId || ''}:${c.thumbnailText}:${c.emotion}`.toLowerCase()))
  const sourceClips = [...db.clips].sort((a, b) => (b.score || 0) - (a.score || 0))
  const generated = []
  let variantIndex = 0
  while (generated.length + (db.thumbnailConcepts || []).length < targetCount && sourceClips.length && variantIndex < targetCount * 3) {
    for (const clip of sourceClips) {
      if (generated.length + (db.thumbnailConcepts || []).length >= targetCount) break
      const base = thumbnailConceptFromClip(clip, transcriptById.get(clip.transcriptId) || 'Stream transcript')
      const concept = thumbnailVariant(base, variantIndex)
      const textKey = String(concept.thumbnailText || '').toLowerCase()
      const key = `${concept.sourceClipId || ''}:${concept.thumbnailText}:${concept.emotion}`.toLowerCase()
      if (dislikedTexts.has(textKey) || existingKeys.has(key)) continue
      existingKeys.add(key)
      generated.push(concept)
    }
    variantIndex += 1
  }
  db.thumbnailConcepts = [...generated, ...(db.thumbnailConcepts || [])].slice(0, Math.max(80, targetCount))
  await addJob(db, 'thumbnail-concepts', 'Generated thumbnail concepts', 'done', `${generated.length} new concepts; ${db.thumbnailConcepts.length} total in Thumbnail Lab.`)
  await saveDb(db)
  return generated
}
function contextSignals(context = '') {
  const text = String(context).toLowerCase()
  return {
    mic: /\bmic\b|\baudio\b|\bsound\b|\bvoice\b/.test(text),
    brand: /brand|name|modern|shipping|masala|coded|logo/.test(text),
    clip: /clip|short|tiktok|youtube|caption|render/.test(text),
    build: /build|ship|app|product|tool|feature|code|fix/.test(text),
    stuck: /broken|stuck|bad|sucks|error|not working|fix/.test(text),
    live: /stream|live|viewer|chat/.test(text),
  }
}
function pickPracticePrompts(topic = '', context = '') {
  const signals = contextSignals(`${topic} ${context}`)
  const pool = [
    `wait what are we trying to get shipped tonight?`,
    `can you explain what just broke like i'm new here?`,
    `what's the simplest version of this that would still be useful?`,
    `is this a tool just for you or could other streamers use it too?`,
    `what would make this actually feel good enough to use every stream?`,
    `what's the next tiny win if this part works?`,
    `are you building the product or the content machine right now?`,
    `what would you cut from this if you only had 20 minutes?`,
    `how do you know when this is ready to post?`,
    `what's the bit here that could become a short?`,
  ]
  if (signals.mic) pool.unshift(`is the mic fixed now or are we still fighting it?`, `what was the actual audio problem in the end?`)
  if (signals.brand) pool.unshift(`no sleep shipping is kind of a banger, what would the logo be?`, `does the new name need to be personal or more like a show?`)
  if (signals.clip) pool.unshift(`which clip style feels more natural, facecam or captions?`, `would this hook stop you scrolling?`)
  if (signals.build) pool.unshift(`what's the one feature that makes this feel real?`, `are we overbuilding this or is this the useful bit?`)
  if (signals.stuck) pool.unshift(`what's the annoying part right now?`, `if you had to guess, what's causing the problem?`)
  if (signals.live) pool.unshift(`new here, what's the chaos today?`, `what are we watching you build?`)
  return pool
}
function pickWisdomPrompts(topic = '', context = '') {
  const signals = contextSignals(`${topic} ${context}`)
  const pool = [
    `that's the actual product: making the boring repeatable so the creative part survives`,
    `this is why live building works, the audience sees the decision not just the demo`,
    `clip this bit: the tool is only valuable if it still works when you're tired`,
    `the best creator tools disappear into the workflow instead of becoming another job`,
    `that's weirdly the lesson, systems beat motivation when the stream gets chaotic`,
    `if it survives a refresh and a panic-click, it is much closer to real software`,
    `this is the difference between a feature and a habit`,
    `the content machine is really a memory machine for good moments`,
  ]
  if (signals.mic) pool.unshift(`audio is trust, if the mic feels off the whole stream feels off`)
  if (signals.clip) pool.unshift(`the best shorts sound like a thought you caught live, not an ad you wrote later`, `clip farming should preserve the messy insight, not sand it into nothing`)
  if (signals.build) pool.unshift(`you are not just building an app, you are building a rhythm you can return to every night`, `the killer feature is reducing the gap between idea and shipped artefact`)
  if (signals.stuck) pool.unshift(`the bug is annoying, but it is also telling you where the product needs a rail`)
  if (signals.live) pool.unshift(`live chat is not decoration, it is the feedback loop that keeps the build human`)
  return pool
}
function generatePracticeChat(topic, context, mode = 'chat') {
  const names = ['maya', 'jay', 'priya', 'kev', 'nina', 'sam', 'leah', 'owen', 'tariq', 'becky', 'marco', 'jess']
  const prompts = mode === 'wisdom' ? pickWisdomPrompts(topic, context) : pickPracticePrompts(topic, context)
  const count = mode === 'wisdom' ? 3 : 4
  const start = Math.floor(Math.random() * Math.max(prompts.length - count, 1))
  return prompts.slice(start, start + count).map((text, index) => ({
    id: id('chat'),
    name: names[(start + index) % names.length],
    text,
    label: mode === 'wisdom' ? 'clip-farm wisdom' : 'practice prompt',
    createdAt: new Date().toISOString(),
  }))
}
function fallbackStudioAi({ action, draft = '', format = 'one-liner', prompt = '', profile = {} }) {
  const seed = String(prompt || draft || 'building Vibe Zone live').trim()
  const safeSeed = seed.replace(/\s+/g, ' ').slice(0, 220)
  const baseDrafts = {
    'one-liner': `Boring systems beat flashy ideas when you have to ship every day.`,
    milestone: `Tiny milestone today: Vibe Zone is turning from a dashboard into an actual content engine.\n\nNot perfect yet.\nBut real enough to improve from.`,
    lesson: `Lesson learned: if a tool only works when you are calm and rested, it is not a workflow yet.\n\nThe boring rails are the product.`,
    stack: `My current build stack:\n\nVite frontend\nLocal media pipeline\nOAuth-connected socials\nManual review gates\nTiny agent loops that actually ship\n\nSimple beats magical when you need it every day.`,
  }
  const nextDraft = action === 'draft' ? (safeSeed.length > 8 && safeSeed !== draft ? `Building this live is teaching me something:\n\n${safeSeed}\n\nThe product is not the flashy AI part.\n\nIt is the boring loop that keeps working tomorrow.` : baseDrafts[format] || baseDrafts['one-liner']) : draft
  const hook = String(nextDraft || '').split(/\n|\./).find(Boolean) || ''
  const score = Math.min(19, Math.max(4, Math.round(5 + nextDraft.length / 24 + (/\?|:/.test(nextDraft) ? 2 : 0) + (/\n/.test(nextDraft) ? 2 : 0))))
  const coach = hook.length > 70 ? 'Strong idea, but the opening line is long. Make the first 6 words punchier.' : nextDraft.length > 235 ? 'Good substance. Trim one clause so it feels native to X.' : 'Solid draft. Add one concrete proof point if you want more replies.'
  return { draft: nextDraft, score, coach, predictedImpressions: Math.round(score * 18 + nextDraft.length * 1.7), provider: 'local-template', model: 'deterministic-fallback', notes: `Draft-only. Uses ${profile?.accountLabel || 'local profile'} context; no external posting.` }
}
function parseStudioJson(text, fallback) {
  const match = String(text || '').match(/\{[\s\S]*\}/)
  if (!match) return fallback
  try { return { ...fallback, ...JSON.parse(match[0]) } } catch { return fallback }
}
async function callOpenAiStudio(prompt) {
  if (!process.env.OPENAI_API_KEY) return null
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, temperature: 0.8, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are Vibe Zone Studio. Return compact JSON only with keys: draft, score, coach, predictedImpressions, notes. Draft for X/Twitter in Masala/Tom Jones build-in-public voice. Never post. Keep draft <= 280 chars unless explicitly writing a thread.' }, { role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 220)}`)
  const data = await response.json()
  return { provider: 'openai', model, text: data.choices?.[0]?.message?.content || '' }
}
async function callOllamaStudio(prompt) {
  const base = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
  const model = process.env.OLLAMA_MODEL || process.env.LLAMA_MODEL || 'qwen2.5:1.5b-instruct'
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, stream: false, prompt: `Return JSON only with keys draft, score, coach, predictedImpressions, notes. Draft for X/Twitter in Masala/Tom Jones build-in-public voice. Never post. <=280 chars.\n\n${prompt}` }),
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) return null
    const data = await response.json()
    return { provider: 'ollama', model, text: data.response || '' }
  } catch { return null }
}
async function generateStudioAi(db, body) {
  const profile = db.socialConnectionState?.x || {}
  const fallback = fallbackStudioAi({ ...body, profile })
  const prompt = JSON.stringify({ action: body.action || 'draft', format: body.format || 'one-liner', userPrompt: body.prompt || '', currentDraft: body.draft || '', xProfile: { accountLabel: profile.accountLabel, username: profile.username }, recentTopics: db.twitterRadar?.topics?.slice(0, 10), newestStream: db.videos?.[0]?.title || '' })
  try {
    const ai = await callOpenAiStudio(prompt) || await callOllamaStudio(prompt)
    if (!ai) return fallback
    const parsed = parseStudioJson(ai.text, fallback)
    return { ...parsed, provider: ai.provider, model: ai.model, draft: String(parsed.draft || fallback.draft).slice(0, 560), score: Math.max(0, Math.min(19, Number(parsed.score || fallback.score))), predictedImpressions: Math.max(0, Number(parsed.predictedImpressions || fallback.predictedImpressions)), coach: String(parsed.coach || fallback.coach).slice(0, 700), notes: String(parsed.notes || fallback.notes).slice(0, 500) }
  } catch (error) {
    return { ...fallback, provider: 'local-template', model: 'fallback-after-ai-error', notes: `AI provider unavailable: ${error.message}` }
  }
}
async function handleApi(req, res, db) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, await healthState(db))
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, await appState(db))
  if (req.method === 'GET' && url.pathname === '/api/posting/readiness') return send(res, 200, postingReadiness(db))
  if (req.method === 'GET' && url.pathname === '/api/social/connections') return send(res, 200, socialConnections(db))
  if (req.method === 'POST' && url.pathname.startsWith('/api/social/connect/') && url.pathname.endsWith('/start')) {
    const providerId = decodeURIComponent(url.pathname.split('/').at(-2))
    const result = buildOAuthUrl(providerId, db)
    if (result.status === 200) { await addJob(db, 'social-connection', `Started ${providerConfigs[providerId].label} connection`, 'needs-review', 'OAuth opened in owner browser; no public posting enabled.') }
    await saveDb(db)
    return send(res, result.status, result.body)
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/social/connect/') && url.pathname.endsWith('/manual')) {
    const providerId = decodeURIComponent(url.pathname.split('/').at(-2))
    const config = providerConfigs[providerId]
    if (!config) return send(res, 404, { error: 'Unknown social provider.' })
    const body = await parseBody(req)
    const accountUrl = String(body.accountUrl || '').trim()
    if (!/^https?:\/\//i.test(accountUrl)) return send(res, 400, { error: 'Paste a full public channel/profile URL starting with http:// or https://.' })
    db.socialConnectionState = db.socialConnectionState || {}
    db.socialConnectionState[providerId] = { ...(db.socialConnectionState[providerId] || {}), manualLinked: true, connected: false, connectedAt: new Date().toISOString(), manualUrl: accountUrl, accountLabel: accountUrl }
    await addJob(db, 'social-connection', `Linked ${config.label} profile manually`, 'done', 'Manual channel/profile URL saved locally. OAuth/posting still requires provider app credentials.')
    await saveDb(db)
    return send(res, 200, { status: 'manual_linked', message: `${config.label} profile linked locally. OAuth/posting still needs provider app credentials.`, connection: socialConnections(db).find((item) => item.id === providerId) })
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/social/connect/') && url.pathname.endsWith('/disconnect')) {
    const providerId = decodeURIComponent(url.pathname.split('/').at(-2))
    if (!providerConfigs[providerId]) return send(res, 404, { error: 'Unknown social provider.' })
    db.socialConnectionState = db.socialConnectionState || {}
    db.socialConnectionState[providerId] = { disconnectedAt: new Date().toISOString(), connected: false }
    await addJob(db, 'social-connection', `Disconnected ${providerConfigs[providerId].label} locally`, 'done', 'Local connection state cleared; revoke app access on the provider too if needed.')
    await saveDb(db)
    return send(res, 200, socialConnections(db).find((item) => item.id === providerId))
  }
  if (req.method === 'GET' && url.pathname.startsWith('/api/social/callback/')) {
    const providerId = decodeURIComponent(url.pathname.split('/').pop())
    const config = providerConfigs[providerId]
    if (!config) return send(res, 404, { error: 'Unknown social provider.' })
    const expectedState = db.socialConnectionState?.[providerId]?.pendingState
    const returnedState = url.searchParams.get('state') || ''
    if (!expectedState || expectedState !== returnedState) return send(res, 400, { error: 'OAuth state mismatch. Start the connection from Vibe Zone again.' })
    const code = url.searchParams.get('code') || ''
    if (!code) return send(res, 400, { error: 'Provider did not return an OAuth code.' })
    try {
      if (providerId === 'x') {
        const connection = await exchangeXOAuthCode(db, code)
        db.socialConnectionState[providerId] = { ...connection, pendingState: '', pendingCodeVerifier: '', codeReceived: true }
        await addJob(db, 'social-connection', `${config.label} OAuth connected`, 'done', `${connection.accountLabel || config.label} connected locally. Posting remains approval-gated.`)
      } else {
        db.socialConnectionState[providerId] = { oauthApproved: true, connected: false, connectedAt: new Date().toISOString(), accountLabel: `${config.label} OAuth approved`, codeReceived: true }
        await addJob(db, 'social-connection', `${config.label} OAuth callback received`, 'needs-review', 'OAuth code received. Token exchange/storage is still pending for this provider.')
      }
      await saveDb(db)
    } catch (error) {
      await addJob(db, 'social-connection', `${config.label} OAuth exchange failed`, 'failed', error.message)
      await saveDb(db)
      return send(res, 500, { error: error.message })
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    return res.end(`<h1>${config.label} connected to Vibe Zone</h1><p>You can close this tab and return to Vibe Zone. Posting is still approval-gated.</p>`)
  }
  if (req.method === 'GET' && url.pathname === '/api/twitter-radar') return send(res, 200, normalizeTwitterRadar(db.twitterRadar))
  if (req.method === 'GET' && url.pathname === '/api/twitter-radar/watchlist') return send(res, 200, { accounts: normalizeTwitterRadar(db.twitterRadar).watchAccounts })
  if (req.method === 'POST' && url.pathname === '/api/twitter-radar/watchlist') return send(res, 200, await updateTwitterRadarWatchlist(db, await parseBody(req)))
  if (req.method === 'POST' && url.pathname === '/api/twitter-radar/watchlist/check') {
    const result = await markTwitterRadarAccountChecked(db, await parseBody(req))
    return send(res, result.error ? 400 : 200, result)
  }
  if (req.method === 'POST' && url.pathname === '/api/twitter-radar/config') return send(res, 200, await updateTwitterRadar(db, await parseBody(req)))
  if (req.method === 'POST' && url.pathname === '/api/twitter-radar/scan') return send(res, 200, await scanTwitterRadar(db, await parseBody(req)))
  if (req.method === 'GET' && url.pathname === '/api/dispatch/list') {
    const recovered = await ensureCurrentStyleGateReadyDispatchItems(db)
    if (recovered) await saveDb(db)
    return send(res, 200, { items: db.dispatchItems, summary: dispatchQueueSummary(db.dispatchItems) })
  }
  if (req.method === 'POST' && url.pathname === '/api/dispatch/seed') {
    await ensureCurrentStyleGateReadyDispatchItems(db)
    await scanExportBundleDispatchItems(db)
    await addJob(db, 'dispatch', 'Seeded dispatch queue', 'done', `${db.dispatchItems.length} local dispatch item(s) available; no external posting performed.`)
    await saveDb(db)
    return send(res, 200, { items: db.dispatchItems, summary: dispatchQueueSummary(db.dispatchItems) })
  }
  if (req.method === 'POST' && url.pathname === '/api/dispatch/create') {
    const body = await parseBody(req)
    if (!body.title && !body.clipId) return send(res, 400, { error: 'Dispatch title or clipId is required.' })
    if (body.status && !dispatchStatuses.has(body.status)) return send(res, 400, { error: 'Unsupported dispatch status.' })
    const item = createDispatchItem(db, body)
    await addJob(db, 'dispatch', 'Created dispatch item', 'done', `${item.title}: ${item.status}`)
    await saveDb(db)
    return send(res, 200, item)
  }
  if (req.method === 'POST' && url.pathname === '/api/dispatch/update') {
    const body = await parseBody(req)
    if (!body.id) return send(res, 400, { error: 'Dispatch item id is required.' })
    if (!dispatchStatuses.has(body.status)) return send(res, 400, { error: 'Unsupported dispatch status.' })
    db.dispatchItems = normalizeDispatchItems(db)
    const item = db.dispatchItems.find((entry) => entry.id === body.id)
    if (!item) return send(res, 404, { error: 'Dispatch item not found.' })
    item.status = body.status
    if (body.copyOverrides && typeof body.copyOverrides === 'object') {
      item.copyOverrides = normalizeCopyOverrides({ ...(item.copyOverrides || {}), ...body.copyOverrides })
    }
    if (body.manualResult && typeof body.manualResult === 'object') {
      item.manualResult = normalizeManualResult(body.manualResult)
      if (item.manualResult) {
        db.postResults = [{ id: id('post_result'), dispatchItemId: item.id, title: item.title, platform: item.platform, status: 'posted_manual', ...item.manualResult }, ...(db.postResults || [])].slice(0, 200)
      }
    }
    item.updatedAt = new Date().toISOString()
    item.lastAuditAction = body.copyOverrides ? 'Per-platform draft copy saved locally; no external posting performed' : item.manualResult && body.status === 'posted_manual' ? 'Manual post result recorded locally; no external posting performed' : `Local status changed to ${body.status}`
    await addJob(db, 'dispatch', item.manualResult && body.status === 'posted_manual' ? 'Recorded manual post result' : 'Updated dispatch queue', 'done', `${item.title}: ${body.status}`)
    await saveDb(db)
    return send(res, 200, item)
  }
  if (req.method === 'GET' && url.pathname === '/api/media/files') return send(res, 200, await listMediaFiles())
  if (req.method === 'GET' && url.pathname === '/api/thumbnails/transcript') return await thumbnailTranscriptDownload(db, url, res)
  if (req.method === 'POST' && url.pathname === '/api/media/upload') return await handleMediaUpload(req, res, db, url)
  if (req.method === 'POST' && url.pathname === '/api/settings') {
    const body = await parseBody(req); db.settings = { ...db.settings, ...body }; await addJob(db, 'settings', 'Updated settings', 'done', db.settings.channelUrl); await saveDb(db); return send(res, 200, db.settings)
  }
  if (req.method === 'POST' && url.pathname === '/api/youtube/scan') return send(res, 200, await scanYoutube(db))
  if (req.method === 'POST' && url.pathname === '/api/media/probe') return send(res, 200, await mediaProbe(db))
  if (req.method === 'POST' && url.pathname === '/api/media/extract') {
    const body = await parseBody(req)
    const target = latestStreamCandidate(db.videos)
    const requestedUrl = body.videoUrl || target?.url || db.settings.channelUrl
    const requestedId = body.videoId || videoIdFromUrl(requestedUrl)
    const scopeBlocker = latestOnlyBlocker(requestedId, target)
    const videoUrl = target?.url || requestedUrl
    const videoId = target?.id || requestedId || ''
    const probe = await commandExists(localYtDlp)
    const command = buildCustomDownloadCommand(videoUrl)
    if (scopeBlocker) {
      return send(res, 200, await addMediaJob(db, 'youtube-extract', 'needs-review', scopeBlocker, `${buildYtDlpPreflightCommand(videoUrl)}\n\n${buildLocalCompanionCommand(videoUrl, videoId)}`))
    }
    if (!probe.ok) {
      return send(res, 200, await addMediaJob(db, 'youtube-extract', 'needs-review', `yt-dlp missing; install it before download. Planned source: ${videoUrl}`, command))
    }
    const preflight = await preflightYoutubeDownload(videoUrl)
    const status = preflight.ok ? 'queued' : 'needs-review'
    const detail = preflight.ok ? `Preflight passed for ${videoUrl}: ${preflight.detail}` : `${preflight.blocked ? 'VPS extraction blocked' : 'Extraction preflight failed'} for ${videoUrl}: ${preflight.detail}`
    const reviewCommand = `${buildYtDlpPreflightCommand(videoUrl)}\n${command}\n\n${buildLocalCompanionCommand(videoUrl, videoId)}`
    return send(res, 200, await addMediaJob(db, 'youtube-extract', status, detail, preflight.ok ? command : reviewCommand))
  }
  if (req.method === 'POST' && url.pathname === '/api/media/transcribe') {
    await ensureMediaDirs()
    const body = await parseBody(req)
    const inputPath = body.inputPath || 'media/downloads/VIDEO_ID.mp4'
    const probe = await commandExists(localWhisper, ['--help'])
    const command = buildWhisperCommand(inputPath)
    const inputReady = await localFileExists(inputPath)
    const status = probe.ok && inputReady ? 'queued' : 'needs-review'
    const detail = !probe.ok ? `Whisper command not ready at local venv path. Planned input: ${inputPath}` : inputReady ? `Ready to transcribe ${inputPath}` : `Waiting for local media file before transcription: ${inputPath}. Use the safe local companion/import flow if VPS YouTube extraction is blocked.`
    return send(res, 200, await addMediaJob(db, 'transcribe', status, detail, command))
  }
  if (req.method === 'POST' && url.pathname === '/api/media/render') {
    await ensureMediaDirs()
    const body = await parseBody(req)
    const probe = await commandExists('ffmpeg', ['-version'])
    const command = buildFfmpegCommand(body)
    const inputPath = body.inputPath || 'media/downloads/VIDEO_ID.mp4'
    const inputReady = await localFileExists(inputPath)
    const subtitleReady = !body.subtitlePath || await localFileExists(body.subtitlePath)
    const status = probe.ok && inputReady && subtitleReady ? 'queued' : probe.ok ? 'needs-review' : 'failed'
    const detail = !probe.ok ? 'ffmpeg missing; cannot render clips yet.' : !inputReady ? `Waiting for local media file before rendering: ${inputPath}` : !subtitleReady ? `Waiting for subtitle file before subtitle burn-in: ${body.subtitlePath}` : `Ready to render ${body.mode || 'short'} clip with subtitles`
    return send(res, 200, await addMediaJob(db, 'render-clips', status, detail, command))
  }
  if (req.method === 'POST' && url.pathname === '/api/media/ingest-local') return send(res, 200, await ingestLatestLocalMedia(db, await parseBody(req)))
  if (req.method === 'POST' && url.pathname === '/api/thumbnails/generate') {
    const body = await parseBody(req)
    return send(res, 200, await generateThumbnailConcepts(db, Number(body.limit || 50)))
  }
  if (req.method === 'PATCH' && url.pathname.startsWith('/api/thumbnails/')) {
    const conceptId = decodeURIComponent(url.pathname.split('/').pop())
    const body = await parseBody(req)
    const concept = (db.thumbnailConcepts || []).find((item) => item.id === conceptId)
    if (!concept) return send(res, 404, { error: 'Thumbnail concept not found' })
    const allowed = ['idea', 'liked', 'disliked', 'used']
    if (body.status && allowed.includes(body.status)) concept.status = body.status
    if (body.rating === 'like' || body.rating === 'dislike' || body.rating === null) concept.rating = body.rating
    if (typeof body.learningNotes === 'string') concept.learningNotes = body.learningNotes.slice(0, 500)
    concept.updatedAt = new Date().toISOString()
    updateThumbnailPreferenceProfile(db, concept)
    await addJob(db, 'thumbnail-feedback', 'Updated thumbnail feedback', 'done', `${concept.thumbnailText}: ${concept.rating || concept.status}; preference profile updated for future thumbnail generation.`)
    await saveDb(db)
    return send(res, 200, concept)
  }
  if (req.method === 'POST' && url.pathname === '/api/viral/hunt') {
    const finds = huntViralIdeas(db.videos, db.clips, db.transcripts).map((find) => ({ id: id('viral'), createdAt: new Date().toISOString(), ...find }))
    const seen = new Set()
    db.viralFinds = [...finds, ...db.viralFinds].filter((find) => {
      const key = `${find.source}:${find.title}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 40)
    await addJob(db, 'viral-hunter', 'Generated newest-stream Viral Hunter leads', 'done', `${finds.length} leads scoped to Masala's newest stream/clips; duplicates collapsed in backlog.`)
    await saveDb(db)
    return send(res, 200, finds)
  }
  if (req.method === 'POST' && url.pathname === '/api/studio/ai') {
    const body = await parseBody(req)
    const result = await generateStudioAi(db, body)
    await addJob(db, 'studio-ai', 'Generated Studio AI draft/score', 'done', `${result.provider}/${result.model}: ${body.action || 'draft'}; no posting performed.`)
    await saveDb(db)
    return send(res, 200, result)
  }
  if (req.method === 'POST' && url.pathname === '/api/transcripts') {
    const body = await parseBody(req); const t = { id: id('tx'), title: body.title || 'Untitled transcript', sourceUrl: body.sourceUrl || '', text: body.text || '', createdAt: new Date().toISOString() }
    db.transcripts.unshift(t); await addJob(db, 'transcript-import', 'Imported transcript', 'done', `${t.title} (${t.text.length} chars)`); await saveDb(db); return send(res, 200, t)
  }
  if (req.method === 'POST' && url.pathname === '/api/clips/generate') {
    const body = await parseBody(req); const transcript = db.transcripts.find((t) => t.id === body.transcriptId) || db.transcripts[0]
    if (!transcript) return send(res, 400, { error: 'Import a transcript first.' })
    const clips = scoreClips(transcript.id, transcript.text); db.clips = [...clips, ...db.clips.filter((c) => c.transcriptId !== transcript.id)].slice(0, 80)
    await addJob(db, 'clip-generation', 'Generated clip candidates', 'done', `${clips.length} clips from ${transcript.title}`); await saveDb(db); return send(res, 200, clips)
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/render')) {
    const clipId = decodeURIComponent(url.pathname.split('/').at(-2))
    const result = await renderSelectedClip(db, clipId, await parseBody(req))
    return send(res, result.status, result.body)
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/clips/') && url.pathname.endsWith('/export-bundle')) {
    const clipId = decodeURIComponent(url.pathname.split('/').at(-2))
    const result = await exportClipBundle(db, clipId)
    return send(res, result.status, result.body)
  }
  if (req.method === 'PATCH' && url.pathname.startsWith('/api/clips/')) {
    const clipId = decodeURIComponent(url.pathname.split('/').pop())
    const body = await parseBody(req)
    const clip = db.clips.find((item) => item.id === clipId)
    if (!clip) return send(res, 404, { error: 'Clip not found' })
    const statuses = ['idea', 'draft', 'reviewed', 'exported', 'ready_local_manual_upload', 'uploaded', 'archived', 'superseded']
    const platforms = ['tiktok', 'youtube', 'x']
    if (body.status && !statuses.includes(body.status)) return send(res, 400, { error: 'Invalid clip status' })
    if (body.platform && !platforms.includes(body.platform)) return send(res, 400, { error: 'Invalid platform' })
    Object.assign(clip, { status: body.status || clip.status, platform: body.platform || clip.platform })
    if (body.status === 'exported') clip.exportedAt = new Date().toISOString()
    if (body.status === 'uploaded') {
      clip.uploadedAt = new Date().toISOString()
      clip.renderStatus = 'done'
      for (const item of db.dispatchItems || []) {
        if (item.clipId === clip.id) {
          item.status = 'posted_manual'
          item.updatedAt = new Date().toISOString()
          item.lastAuditAction = 'marked-uploaded-by-owner'
        }
      }
    }
    await addJob(db, 'clip-update', body.status === 'uploaded' ? 'Marked clip uploaded' : 'Updated clip workflow status', 'done', `${clip.title}: ${clip.platform}/${clip.status}`)
    await saveDb(db)
    return send(res, 200, clip)
  }
  if (req.method === 'DELETE' && url.pathname === '/api/chat') {
    db.chatMessages = []
    await addJob(db, 'practice-chat', 'Cleared AI practice chat', 'done', 'Message history cleared')
    await saveDb(db)
    return send(res, 200, { ok: true })
  }
  if (req.method === 'POST' && url.pathname === '/api/chat/generate') {
    const body = await parseBody(req)
    const messages = generatePracticeChat(body.topic, body.context, body.mode)
    db.chatMessages = [...messages, ...db.chatMessages].slice(0, 40)
    await addJob(db, 'practice-chat', 'Generated practice prompts', 'done', `${body.topic || 'stream context'} • ${body.mode === 'wisdom' ? 'clip-farm wisdom' : 'normal chat'}`)
    await saveDb(db)
    return send(res, 200, messages)
  }
  return send(res, 404, { error: 'Not found' })
}
async function serveStatic(req, res) {
  const dist = path.join(root, 'dist')
  const url = new URL(req.url, `http://${req.headers.host}`)
  const safePath = path.normalize(url.pathname).replace(/^\.\.(\/|\\|$)/, '')
  let file = path.join(dist, safePath === '/' ? 'index.html' : safePath)
  try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html') } catch { file = path.join(dist, 'index.html') }
  const ext = path.extname(file)
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
  res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
}
createServer(async (req, res) => {
  const db = await loadDb()
  try {
    if (req.url.startsWith('/api/')) return await handleApi(req, res, db)
    if (req.url.startsWith('/media/')) return await serveMedia(req, res)
    return await serveStatic(req, res)
  } catch (error) { return send(res, 500, { error: error.message }) }
}).listen(port, '127.0.0.1', () => console.log(`Vibe Zone local server: http://127.0.0.1:${port}`))
