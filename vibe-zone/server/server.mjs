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
const port = Number(process.env.PORT || 8787)
const localYtDlp = path.join(root, '.venv-media', 'bin', 'yt-dlp')
const localWhisper = '/root/.openclaw/workspace/.venv-transcribe/bin/whisper'
const youtubeBotBlockPattern = /sign in to confirm you.?re not a bot|use --cookies|cookies-from-browser/i
const mediaDirs = ['media/downloads', 'media/transcripts', 'media/renders', 'media/exports']

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
  mediaJobs: [],
  viralFinds: [],
  chatMessages: [],
  jobs: [],
}

async function loadDb() {
  await mkdir(dataDir, { recursive: true })
  try {
    const stored = JSON.parse(await readFile(dbPath, 'utf8'))
    return normalizeDb({ ...defaultDb, ...stored })
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
        ...(group.kind === 'source' ? { validation: await validateMediaFile(relativePath) } : {}),
      })
    }
  }
  return files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function isVideoLike(relativePath) {
  return ['.mp4', '.mov', '.mkv', '.webm', '.m4v'].includes(path.extname(relativePath).toLowerCase())
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
async function validateMediaFile(relativePath) {
  if (!isVideoLike(relativePath)) return { status: 'unknown', detail: 'Audio/source file; video duration validation not applied.' }
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
async function appState(db) {
  return { ...db, mediaFiles: await listMediaFiles() }
}
async function healthState(db) {
  const mediaFiles = await listMediaFiles()
  return {
    ok: true,
    latestStream: latestStreamCandidate(db.videos) || null,
    counts: {
      videos: db.videos.length,
      transcripts: db.transcripts.length,
      clips: db.clips.length,
      mediaJobs: db.mediaJobs.length,
      renders: mediaFiles.filter((file) => file.kind === 'render').length,
    },
    newestMediaJob: db.mediaJobs[0] || null,
  }
}
function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase()
  return ({
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
    '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8', '.json': 'application/json; charset=utf-8', '.tsv': 'text/tab-separated-values; charset=utf-8',
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
  res.writeHead(200, {
    'content-type': contentTypeFor(file),
    'content-length': info.size,
    'accept-ranges': 'bytes',
    'content-disposition': `inline; filename="${path.basename(file).replaceAll('"', '')}"`,
  })
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
function normalizeDb(db) {
  db.settings = { ...defaultDb.settings, ...(db.settings || {}) }
  db.scans = (db.scans || []).slice(0, 50)
  db.videos = db.videos || []
  db.transcripts = db.transcripts || []
  db.clips = (db.clips || []).map(normalizeClip)
  db.mediaJobs = db.mediaJobs || []
  db.viralFinds = db.viralFinds || []
  db.chatMessages = db.chatMessages || []
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
  return value.match(/[?&]v=([^&]+)/)?.[1] || value.match(/youtu\.be\/([^?&/]+)/)?.[1] || ''
}
function latestOnlyBlocker(requestedId, latest) {
  if (!latest?.id || !requestedId || requestedId === latest.id) return ''
  return `Current scope is newest Masala stream only (${latest.id}: ${latest.title}). Ignored older/different video id ${requestedId}.`
}
function buildWhisperCommand(inputPath) {
  return `. /root/.openclaw/workspace/.venv-transcribe/bin/activate && whisper "${inputPath}" --model base --language en --output_format all --output_dir media/transcripts`
}
function ffmpegPlan({ inputPath, start = '0:00', end = '0:45', mode = 'short', subtitlePath = '', outputPath = '' }) {
  const subtitle = subtitlePath ? `,subtitles='${subtitlePath.replaceAll("'", "'\\''")}'` : ''
  const filters = {
    long: `scale=1920:-2${subtitle}`,
    'facecam-split': `scale=-2:960,crop=1080:960,pad=1080:1920:0:0:color=0x101828,drawtext=text='Facecam / B-roll zone':x=(w-text_w)/2:y=1440:fontcolor=white@0.65:fontsize=44:box=1:boxcolor=black@0.35:boxborderw=24${subtitle}`,
    short: `scale=-2:1920,crop=1080:1920${subtitle}`,
  }
  const filter = filters[mode] || filters.short
  // Coarse input seek plus accurate output trim avoids decoding a whole livestream,
  // while preventing tiny header-only MP4s when the start is far from a keyframe.
  const startSeconds = seconds(start, 0)
  const duration = Math.max(1, seconds(end, startSeconds + 45) - startSeconds)
  const preSeek = Math.max(0, startSeconds - 5)
  const trimSeek = startSeconds - preSeek
  const output = outputPath || `media/renders/${mode}-${Date.now()}.mp4`
  const args = ['-y', '-ss', String(preSeek), '-i', inputPath, '-ss', String(trimSeek), '-t', String(duration), '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', output]
  return { args, output, command: `ffmpeg ${args.map(shellArg).join(' ')}`, startSeconds, endSeconds: startSeconds + duration }
}
function shellArg(value) {
  const text = String(value)
  return /^[A-Za-z0-9_./:=+-]+$/.test(text) ? text : JSON.stringify(text)
}
function buildFfmpegCommand(options) { return ffmpegPlan(options).command }
function slug(value = 'clip') { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'clip' }
function selectedRenderPreset(presetId = 'punchy-captions', videoId = 'VIDEO_ID') {
  const presets = {
    'punchy-captions': { preset: 'punchy-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
    'standard-captions': { preset: 'standard-captions', mode: 'short', subtitlePath: `media/transcripts/${videoId}.srt` },
    'no-captions': { preset: 'no-captions', mode: 'short', subtitlePath: '' },
    'facecam-split': { preset: 'facecam-split', mode: 'facecam-split', subtitlePath: `media/transcripts/${videoId}.punchy.ass` },
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
  if (latest?.id && transcript?.sourceUrl && !transcript.sourceUrl.includes(latest.id)) {
    const detail = `Current scope is newest Masala stream only (${latest.id}). This clip belongs to ${transcript.sourceUrl || transcript.title}.`
    clip.renderStatus = 'needs-review'; clip.renderError = detail
    const job = await addMediaJob(db, 'render-selected', 'needs-review', detail, '')
    return { status: 200, body: { clip, job } }
  }
  const videoId = latest?.id || videoIdFromUrl(transcript?.sourceUrl || '') || 'VIDEO_ID'
  const presetConfig = selectedRenderPreset(body.presetId, videoId)
  const inputPath = body.inputPath || `media/downloads/${videoId}.mp4`
  const subtitlePath = body.subtitlePath ?? presetConfig.subtitlePath
  const mode = body.mode || presetConfig.mode
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
  const plan = ffmpegPlan({ inputPath, start: clip.start, end: clip.end, mode, subtitlePath, outputPath })
  clip.renderStatus = 'running'; clip.renderPreset = preset; clip.renderPath = outputPath; clip.renderError = ''
  await saveDb(db)
  try {
    await execFileAsync('ffmpeg', plan.args, { cwd: root, timeout: 180000, maxBuffer: 1024 * 1024 * 20 })
    clip.renderStatus = 'done'; clip.status = clip.status === 'idea' ? 'draft' : clip.status; clip.renderPath = outputPath; clip.renderUrl = `/${outputPath}`; clip.renderError = ''
    const job = await addMediaJob(db, 'render-selected', 'done', `Rendered selected clip ${clip.title} (${clip.start}-${clip.end}) to ${outputPath}.`, plan.command)
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
    renderPath: clip.renderPath || '',
    createdAt: new Date().toISOString(),
  }
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
  const existing = db.transcripts.find((item) => item.sourceUrl === sourceUrl || item.title.includes(videoId))
  const transcript = existing || { id: id('tx'), title: `${target?.title || 'Newest stream'} (${videoId})`, sourceUrl, text, createdAt: new Date().toISOString() }
  transcript.text = text
  transcript.sourceUrl = sourceUrl
  if (!existing) db.transcripts.unshift(transcript)
  const clips = scoreClips(transcript.id, text)
  db.clips = [...clips, ...db.clips.filter((clip) => clip.transcriptId !== transcript.id)].slice(0, 80)
  const detail = `Imported ${transcriptPath} (${text.length} chars), generated ${clips.length} clip candidates. Media ${mediaReady ? 'ready' : 'missing'}: ${mediaPath}; subtitles ${subtitleReady ? 'ready' : 'missing'}: ${subtitlePath}.`
  return await addMediaJob(db, 'local-ingest', subtitleReady && mediaReady ? 'done' : 'needs-review', detail, subtitleReady && mediaReady ? buildFfmpegCommand({ inputPath: mediaPath, start: clips[0]?.start || '0:00', end: clips[0]?.end || '0:45', mode: 'short', subtitlePath }) : '')
}
function huntViralIdeas(videos, clips) {
  const keywordScore = (text) => ['ai', 'money', 'company', 'privacy', 'live', 'app', 'coding', 'why', 'billion', 'possible'].filter((k) => text.toLowerCase().includes(k)).length
  return [...videos.map((video) => ({ source: 'youtube-rss', title: video.title, url: video.url, score: 55 + keywordScore(video.title) * 8, angle: `Turn “${video.title}” into a sharper hook, then test as 3 Shorts variants.` })), ...clips.slice(0, 12).map((clip) => ({ source: 'clip-factory', title: clip.title, url: '', score: Math.min(99, clip.score + 4), angle: `Clip-first viral test: ${clip.hook}` }))]
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
async function ollamaDraft(prompt) {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'qwen2.5:1.5b-instruct', prompt, stream: false, options: { temperature: 0.7, num_predict: 220 } }),
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) throw new Error(`Ollama ${response.status}`)
    const data = await response.json()
    return String(data.response || '').trim()
  } catch { return '' }
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
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const timed = lines.map((line, index) => {
    const match = line.match(/^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?\s*[-–:]?\s*(.+)$/)
    return match ? { time: match[1], text: match[2], index } : { time: null, text: line, index }
  })
  return timed
}
function seconds(time, fallback) {
  if (!time) return fallback
  const parts = time.split(':').map(Number)
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
}
function stamp(total) {
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = Math.floor(total % 60)
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}
function scoreClips(transcriptId, text) {
  const rows = parseTranscript(text)
  const chunks = []
  // Quantity-first: overlapping windows create many candidates. Platform results decide later.
  for (let i = 0; i < rows.length; i += 3) chunks.push(rows.slice(i, i + 7))
  const keywords = ['why', 'how', 'build', 'secret', 'mistake', 'stop', 'actually', 'ship', 'money', 'creator', 'ai', 'local', 'stream', 'problem']
  return chunks.map((chunk, i) => {
    const body = chunk.map((r) => r.text).join(' ')
    const lower = body.toLowerCase()
    const keywordHits = keywords.filter((k) => lower.includes(k)).length
    const questionBoost = (body.match(/\?/g) || []).length * 4
    const energyBoost = Math.min(12, (body.match(/!|actually|really|never|always/gi) || []).length * 3)
    const score = Math.min(98, 45 + keywordHits * 7 + questionBoost + energyBoost + Math.min(10, Math.round(body.length / 180)))
    const start = seconds(chunk[0]?.time, i * 45)
    const end = seconds(chunk.at(-1)?.time, start + 55) + 8
    const hook = makeHook(body)
    return {
      id: id('clip'), transcriptId, score, platform: 'tiktok', status: 'idea', exportedAt: null, start: stamp(start), end: stamp(end),
      title: makeTitle(body), hook,
      caption: `${hook} ${body.slice(0, 180).replace(/\s+/g, ' ')}...`,
      hashtags: ['#BuildInPublic', '#CreatorTools', '#AIWorkflow', '#LocalFirst'].slice(0, 3 + (keywordHits > 2 ? 1 : 0)),
      reason: `Heuristic score: ${keywordHits} strong keyword hits, ${questionBoost ? 'question energy, ' : ''}${energyBoost ? 'high-emphasis language, ' : ''}dense clip-sized segment.`,
      createdAt: new Date().toISOString(),
    }
  }).filter((c) => c.score >= 55).sort((a, b) => b.score - a.score).slice(0, 12)
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
function generatePracticeChat(topic, context) {
  const names = ['Maya from chat', 'JayDev', 'PriyaBuilds', 'UncleKev', 'NinaClips', 'SamTheMod', 'LeahLearns', 'OwenShorts', 'TariqTools', 'BeckyBytes', 'MarcoMRR', 'JessFromLeeds']
  const prompts = [
    `wait so is ${topic || 'this'} meant for streamers or just your setup?`,
    `clip that bit, the quantity-first thing actually makes sense`,
    `how would TikTok decide what goes to YouTube?`,
    `could this write X posts in your tone from the transcript?`,
    `thumbnail idea: face reaction + simple 3 word promise?`,
    `what's the cheap/local version before paying for APIs?`,
    `new viewer here — what are we building tonight?`,
    `is the chat simulated? appreciate the label if it is`,
  ]
  return prompts.map((text, index) => ({ id: id('chat'), name: names[index], text: context ? `${text} — heard: ${context.slice(0, 70)}` : text, label: 'AI practice chat - fictional viewer, transparent simulation', createdAt: new Date().toISOString() }))
}
async function handleApi(req, res, db) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, await healthState(db))
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, await appState(db))
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
  if (req.method === 'POST' && url.pathname === '/api/viral/hunt') {
    const finds = huntViralIdeas(db.videos, db.clips).map((find) => ({ id: id('viral'), createdAt: new Date().toISOString(), ...find }))
    db.viralFinds = [...finds, ...db.viralFinds].slice(0, 40)
    await addJob(db, 'viral-hunter', 'Generated Viral Hunter leads', 'done', `${finds.length} leads from RSS videos and clip candidates`)
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
    const body = await parseBody(req);
    const localDraft = await ollamaDraft(`Write 4 short natural livestream chat messages about: ${body.topic || 'the stream'}. Context: ${body.context || ''}. They must be transparent AI practice chat, not fake viewers. Return one per line.`)
    const aiMessages = localDraft ? localDraft.split(/\n+/).map((line, index) => ({ id: id('chat'), name: `LocalModel${index + 1}`, text: line.replace(/^[-*\d.)\s]+/, '').trim(), label: 'AI practice chat - Ollama local draft, transparent simulation', createdAt: new Date().toISOString() })).filter((m) => m.text).slice(0, 4) : []
    const messages = [...aiMessages, ...generatePracticeChat(body.topic, body.context)].slice(0, 8); db.chatMessages = [...messages, ...db.chatMessages].slice(0, 50)
    await addJob(db, 'practice-chat', 'Generated AI practice chat', 'done', body.topic || 'No topic'); await saveDb(db); return send(res, 200, messages)
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
