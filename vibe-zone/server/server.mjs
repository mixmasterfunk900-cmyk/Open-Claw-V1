import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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


async function listMediaFiles() {
  await ensureMediaDirs()
  const groups = [
    { kind: 'source', dir: 'media/downloads' },
    { kind: 'transcript', dir: 'media/transcripts' },
    { kind: 'render', dir: 'media/renders' },
    { kind: 'export', dir: 'media/exports' },
  ]
  const files = []
  for (const group of groups) {
    const absoluteDir = path.join(root, group.dir)
    for (const name of await readdir(absoluteDir)) {
      const absolutePath = path.join(absoluteDir, name)
      const info = await stat(absolutePath).catch(() => null)
      if (!info?.isFile()) continue
      const relativePath = path.posix.join(group.dir, name)
      files.push({
        name,
        kind: group.kind,
        path: relativePath,
        url: `/${relativePath}`,
        size: info.size,
        updatedAt: info.mtime.toISOString(),
        ...(group.kind === 'source' ? { validation: await validateMediaFile(relativePath, info) } : {}),
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
async function appState(db) {
  return { ...db, mediaFiles: await listMediaFiles() }
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
async function healthState(db) {
  const mediaFiles = await listMediaFiles()
  const latestStream = latestStreamCandidate(db.videos) || null
  const latestSource = latestStream ? findStreamArtifact(mediaFiles, latestStream, 'source') : null
  const latestTranscript = latestStream ? findStreamTranscriptText(mediaFiles, latestStream) : null
  const latestCaption = latestStream ? findStreamCaption(mediaFiles, latestStream) : null
  const activeMediaJobs = db.mediaJobs.filter((job) => ['running', 'queued'].includes(job.status))
  const failedMediaJobs = db.mediaJobs.filter((job) => job.status === 'failed').slice(0, 5)
  const blockers = []
  if (!latestStream) blockers.push('No latest stream has been discovered yet; run a public YouTube scan first.')
  if (latestStream && !latestSource) blockers.push(`Newest stream source ${latestStream.id} is missing; import/download this stream before rendering clips.`)
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
const dispatchStatuses = new Set(['drafted', 'needs_owner_review', 'approved_manual_upload', 'posted_manual', 'blocked'])
function dispatchQueueSummary(items = []) {
  return {
    total: items.length,
    drafted: items.filter((item) => item.status === 'drafted').length,
    needsOwnerReview: items.filter((item) => item.status === 'needs_owner_review').length,
    approvedManualUpload: items.filter((item) => item.status === 'approved_manual_upload').length,
    postedManual: items.filter((item) => item.status === 'posted_manual').length,
    blocked: items.filter((item) => item.status === 'blocked' || item.blockers?.length).length,
  }
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
function normalizeDispatchItem(item, clip = null) {
  const seed = clip ? clipDispatchSeed(clip) : {}
  const next = { ...seed, ...item }
  next.id = next.id || (clip?.id ? `dispatch_${clip.id}` : id('dispatch'))
  next.clipId = next.clipId || clip?.id || ''
  next.title = next.title || clip?.title || 'Untitled asset'
  next.platform = next.platform || clip?.platform || 'tiktok'
  next.status = dispatchStatuses.has(next.status) ? next.status : dispatchStatusForClip(clip || next)
  next.blockers = Array.isArray(next.blockers) ? next.blockers : []
  next.proofFrames = Array.isArray(next.proofFrames) ? next.proofFrames : []
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
  return items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 200)
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
    if (!metadata) continue
    const itemId = `dispatch_${metadata.id || entry.name}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    if (known.has(itemId) || known.has(metadata.id)) continue
    const proofFrames = [
      `${bundlePath}/proof-frame.jpg`,
      `${bundlePath}/proof-frame-mid.jpg`,
    ]
    const missingProof = []
    for (const frame of proofFrames) {
      if (!await stat(path.join(root, frame)).then((info) => info.isFile()).catch(() => false)) missingProof.push(frame)
    }
    const blockers = []
    if (!metadata.renderPath) blockers.push('Missing rendered asset path in metadata')
    if (!await stat(path.join(root, metadata.renderPath || '')).then((info) => info.isFile()).catch(() => false)) blockers.push('Rendered asset file is missing')
    if (!await stat(path.join(root, bundlePath, 'upload-card.md')).then((info) => info.isFile()).catch(() => false)) blockers.push('Upload card is missing')
    if (!await stat(path.join(root, bundlePath, 'metadata.json')).then((info) => info.isFile()).catch(() => false)) blockers.push('Metadata JSON is missing')
    if (missingProof.length) blockers.push('Proof frame(s) missing')
    const platform = String(metadata.platform || metadata.platforms?.[0] || 'tiktok').includes('youtube') ? 'youtube' : 'tiktok'
    items.push(normalizeDispatchItem({
      id: itemId,
      clipId: metadata.sourceClipId || metadata.id || entry.name,
      title: metadata.title || entry.name.replace(/[-_]+/g, ' '),
      platform,
      status: blockers.length ? 'blocked' : 'approved_manual_upload',
      renderPath: metadata.renderPath || '',
      exportBundlePath: bundlePath,
      proofFrames: missingProof.length ? [] : proofFrames,
      blockers,
      lastAuditAction: blockers.length ? `Seeded from upload bundle with ${blockers.length} blocker(s)` : 'Seeded from local upload bundle metadata',
      createdAt: metadata.createdAt || new Date().toISOString(),
      updatedAt: metadata.createdAt || new Date().toISOString(),
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
function normalizeDb(db) {
  db.settings = { ...defaultDb.settings, ...(db.settings || {}) }
  db.scans = (db.scans || []).slice(0, 50)
  db.videos = db.videos || []
  db.transcripts = db.transcripts || []
  db.clips = (db.clips || []).map(normalizeClip)
  db.dispatchItems = normalizeDispatchItems(db)
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
  const events = []
  for (const segment of transcript.segments || []) {
    if (segment.end < clipStart || segment.start >= clipEnd - 0.15) continue
    const localStart = Math.max(0, Number(segment.start) - clipStart)
    const localEnd = Math.max(localStart + 0.35, Math.min(clipEnd - clipStart, Number(segment.end) - clipStart))
    if (placement === 'centered-screen' && localEnd - localStart < 0.45) continue
    const chunks = captionChunks(segment.text, placement === 'centered-screen')
    const chunkDuration = placement === 'centered-screen' ? Math.max(0.28, (localEnd - localStart) / chunks.length) : Math.max(0.7, (localEnd - localStart) / chunks.length)
    chunks.forEach((chunk, index) => {
      const timingNudge = placement === 'centered-screen' ? -0.18 : 0
      const startAt = Math.max(0, localStart + index * chunkDuration + timeOffset + timingNudge)
      const endAt = placement === 'centered-screen' ? Math.min(localEnd + timeOffset + timingNudge, startAt + Math.max(0.18, chunkDuration * 0.96)) : Math.min(localEnd + timeOffset, startAt + chunkDuration + 0.08)
      if (chunk && endAt > startAt) events.push(`Dialogue: 0,${assTime(startAt)},${assTime(endAt)},BoldCaption,,0,0,0,,${assEscape(chunk)}`)
    })
  }
  if (!events.length) return ''
  const outPath = `media/transcripts/${videoId}-${clip.id}-spoken.ass`
  const style = placement === 'centered-screen'
    ? 'Style: BoldCaption,Lilita One,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,7,0,8,70,70,1262,1'
    : 'Style: BoldCaption,DejaVu Sans,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,6,0,2,70,70,286,1'
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${style}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`
  await writeFile(path.resolve(root, outPath), ass)
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
  const facecamSubtitle = subtitlePath ? `[pipout]subtitles='${subtitlePath.replaceAll("'", "'\\''")}'[vout]` : `[pipout]copy[vout]`
  const facecamLowerFill = `drawbox=x=70:y=930:w=940:h=560:color=0x1d4ed8@0.92:t=fill,drawbox=x=70:y=930:w=940:h=560:color=white@0.24:t=4,drawtext=text='${hook.line1.toUpperCase()}':x=(w-text_w)/2:y=1058:fontcolor=white:fontsize=64:fontfile='media/assets/fonts/LilitaOne-Regular.ttf',drawtext=text='${hook.line2.toUpperCase()}':x=(w-text_w)/2:y=1134:fontcolor=white:fontsize=64:fontfile='media/assets/fonts/LilitaOne-Regular.ttf',drawtext=text='local-first clip factory proof':x=(w-text_w)/2:y=1248:fontcolor=white@0.88:fontsize=34:font='DejaVu Sans'`
  const facecamSmart = `[0:v]split=2[main][cam];[main]scale=-2:1920,crop=1080:1920:${pipBackgroundCropX}:0,boxblur=10:1,eq=brightness=-0.18:saturation=0.65[base];[cam]crop=${facecam.w}:${facecam.h}:${facecam.x}:${facecam.y},scale=560:-2,setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=white@0.34:t=3[face];[base][face]overlay=x=(W-w)/2:y=74:format=auto[withface];[withface]${facecamLowerFill}[pipout];${facecamSubtitle}`
  const filters = {
    long: { kind: 'vf', value: `scale=1920:-2${subtitle}` },
    'facecam-split': { kind: 'vf', value: `scale=-2:960,crop=1080:960,pad=1080:1920:0:0:color=0x101828,drawtext=text='Facecam / B-roll zone':x=(w-text_w)/2:y=1440:fontcolor=white@0.65:fontsize=44:box=1:boxcolor=black@0.35:boxborderw=24${subtitle}` },
    'right-focus': { kind: 'vf', value: `scale=-2:1920,crop=1080:1920:iw-ow-260:0${subtitle}` },
    'hook-card': { kind: 'vf', value: `scale=-2:1920,crop=1080:1920,${hookCard}${subtitle}` },
    'centered-screen': { kind: logoPath ? 'complex-logo' : 'vf', value: centeredScreen },
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
  const inputArgs = logoPath && mode === 'centered-screen' ? ['-ss', String(preSeek), '-i', inputPath, '-loop', '1', '-i', logoPath] : ['-ss', String(preSeek), '-i', inputPath]
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
function selectedRenderPreset(presetId = 'punchy-captions', videoId = 'VIDEO_ID') {
  const presets = {
    'punchy-captions': { preset: 'punchy-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'standard-captions': { preset: 'standard-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.srt` },
    'no-captions': { preset: 'no-captions', mode: 'short', subtitlePath: '' },
    'facecam-split': { preset: 'facecam-split', mode: 'facecam-split', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'right-focus-captions': { preset: 'right-focus-captions', mode: 'right-focus', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'hook-card': { preset: 'hook-card', mode: 'hook-card', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'centered-screen': { preset: 'centered-screen', mode: 'centered-screen', subtitlePath: '' },
    'facecam-smart': { preset: 'facecam-smart', mode: 'facecam-smart', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'facecam-right': { preset: 'facecam-right', mode: 'facecam-right', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'long-standard': { preset: 'long-standard', mode: 'long', subtitlePath: `media/transcripts/${videoId}.srt` },
  }
  return presets[presetId] || presets['punchy-captions']
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
  if ((body.spokenCaptions ?? true) && ['facecam-smart', 'hook-card', 'short', 'centered-screen'].includes(mode)) {
    const startSeconds = seconds(clip.start, 0)
    const preSeek = Math.max(0, startSeconds - 5)
    subtitlePath = await writeSpokenCaptionAss(videoId, clip, startSeconds - preSeek, mode === 'centered-screen' ? 'centered-screen' : 'bottom') || subtitlePath
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
  const plan = ffmpegPlan({ inputPath, start: clip.start, end: clip.end, mode, subtitlePath, outputPath, cropX: facecamBox?.cropX || 0, facecamBox, hookText: body.headline || (['hook-card', 'centered-screen'].includes(mode) ? clip.title : (clip.hook || clip.title)), quality: body.quality || 'standard', brandText: body.brandText || brandWordmark(`${clip.title} ${clip.hook}`), logoPath: body.logoPath || (mode === 'centered-screen' && /openclaw/i.test(body.brandText || brandWordmark(`${clip.title} ${clip.hook}`)) ? 'media/assets/logos/openclaw-logo-text.png' : '') })
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
  const dislikedTexts = new Set((db.thumbnailConcepts || []).filter((c) => c.rating === 'dislike' || feedback[c.id] === 'dislike').map((c) => String(c.thumbnailText || '').toLowerCase()))
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
function generatePracticeChat(topic, context) {
  const names = ['maya', 'jay', 'priya', 'kev', 'nina', 'sam', 'leah', 'owen', 'tariq', 'becky', 'marco', 'jess']
  const prompts = pickPracticePrompts(topic, context)
  const start = Math.floor(Math.random() * Math.max(prompts.length - 4, 1))
  return prompts.slice(start, start + 4).map((text, index) => ({
    id: id('chat'),
    name: names[(start + index) % names.length],
    text,
    label: 'practice prompt',
    createdAt: new Date().toISOString(),
  }))
}
async function handleApi(req, res, db) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, await healthState(db))
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, await appState(db))
  if (req.method === 'GET' && url.pathname === '/api/dispatch/list') {
    db.dispatchItems = normalizeDispatchItems(db)
    return send(res, 200, { items: db.dispatchItems, summary: dispatchQueueSummary(db.dispatchItems) })
  }
  if (req.method === 'POST' && url.pathname === '/api/dispatch/seed') {
    db.dispatchItems = normalizeDispatchItems(db)
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
    item.updatedAt = new Date().toISOString()
    item.lastAuditAction = `Local status changed to ${body.status}`
    await addJob(db, 'dispatch', 'Updated dispatch queue', 'done', `${item.title}: ${body.status}`)
    await saveDb(db)
    return send(res, 200, item)
  }
  if (req.method === 'GET' && url.pathname === '/api/media/files') return send(res, 200, await listMediaFiles())
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
    await addJob(db, 'thumbnail-feedback', 'Updated thumbnail feedback', 'done', `${concept.thumbnailText}: ${concept.rating || concept.status}`)
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
    const statuses = ['idea', 'draft', 'reviewed', 'exported']
    const platforms = ['tiktok', 'youtube', 'x']
    if (body.status && !statuses.includes(body.status)) return send(res, 400, { error: 'Invalid clip status' })
    if (body.platform && !platforms.includes(body.platform)) return send(res, 400, { error: 'Invalid platform' })
    Object.assign(clip, { status: body.status || clip.status, platform: body.platform || clip.platform })
    if (body.status === 'exported') clip.exportedAt = new Date().toISOString()
    await addJob(db, 'clip-update', 'Updated clip workflow status', 'done', `${clip.title}: ${clip.platform}/${clip.status}`)
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
    const messages = generatePracticeChat(body.topic, body.context)
    db.chatMessages = [...messages, ...db.chatMessages].slice(0, 40)
    await addJob(db, 'practice-chat', 'Generated practice prompts', 'done', body.topic || 'stream context')
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
