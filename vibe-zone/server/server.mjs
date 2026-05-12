import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
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
const mediaDirs = ['media/downloads', 'media/transcripts', 'media/renders']

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
function buildYtDlpPreflightCommand(videoUrl) {
  return `${localYtDlp} --skip-download --print "%(id)s | %(title)s | duration=%(duration_string)s | live=%(live_status)s" "${videoUrl}"`
}
function buildLocalCompanionCommand(videoUrl, videoId = '') {
  const idPart = videoId || 'VIDEO_ID'
  return `# Run on Masala's own machine if the VPS hits YouTube bot-checks. Latest stream only; no cookies required by default.\nmkdir -p media/downloads media/transcripts\nyt-dlp --no-playlist -f "bv*+ba/b" --merge-output-format mp4 -o "media/downloads/%(id)s.%(ext)s" "${videoUrl}"\nwhisper "media/downloads/${idPart}.mp4" --model base --language en --output_format all --output_dir media/transcripts\n# Then copy/import media/transcripts/${idPart}.txt, media/transcripts/${idPart}.srt, and media/downloads/${idPart}.mp4 into Vibe Zone and press “Import local transcript + score”.`
}
async function preflightYoutubeDownload(videoUrl) {
  try {
    const { stdout, stderr } = await execFileAsync(localYtDlp, ['--skip-download', '--print', '%(id)s | %(title)s | duration=%(duration_string)s | live=%(live_status)s', videoUrl], { timeout: 20000 })
    return { ok: true, detail: `${stdout || stderr}`.trim().split('\n').at(-1) || 'yt-dlp preflight succeeded' }
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || ''}`
    if (youtubeBotBlockPattern.test(output)) {
      return { ok: false, blocked: true, detail: 'YouTube blocked this VPS extraction with a bot-check. Do not use cookies by default; use the local companion download/import fallback unless Masala explicitly approves a specific cookie step.' }
    }
    return { ok: false, blocked: false, detail: output.trim().split('\n').find((line) => /ERROR|WARNING|Error/i.test(line)) || error.message }
  }
}
function latestStreamCandidate(videos) {
  return videos.find((video) => video.kind === 'stream') || videos.find((video) => /\blive\b|stream|vibe coding|day \d+/i.test(video.title)) || videos[0]
}
function buildWhisperCommand(inputPath) {
  return `. /root/.openclaw/workspace/.venv-transcribe/bin/activate && whisper "${inputPath}" --model base --language en --output_format all --output_dir media/transcripts`
}
function buildFfmpegCommand({ inputPath, start = '0:00', end = '0:45', mode = 'short', subtitlePath = '' }) {
  const scale = mode === 'long' ? 'scale=1920:-2' : 'scale=-2:1920,crop=1080:1920'
  const subtitle = subtitlePath ? `,subtitles='${subtitlePath.replaceAll("'", "'\\''")}'` : ''
  return `ffmpeg -y -ss ${start} -to ${end} -i "${inputPath}" -vf "${scale}${subtitle}" -c:v libx264 -preset veryfast -c:a aac "media/renders/${mode}-${Date.now()}.mp4"`
}
async function ingestLatestLocalMedia(db, body = {}) {
  await ensureMediaDirs()
  const target = latestStreamCandidate(db.videos)
  const videoId = body.videoId || target?.id
  if (!videoId) return await addMediaJob(db, 'local-ingest', 'needs-review', 'Scan YouTube first so Vibe Zone knows the newest stream id to import.', '')
  const sourceUrl = body.sourceUrl || target?.url || `https://www.youtube.com/watch?v=${videoId}`
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
  if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, db)
  if (req.method === 'POST' && url.pathname === '/api/settings') {
    const body = await parseBody(req); db.settings = { ...db.settings, ...body }; await addJob(db, 'settings', 'Updated settings', 'done', db.settings.channelUrl); await saveDb(db); return send(res, 200, db.settings)
  }
  if (req.method === 'POST' && url.pathname === '/api/youtube/scan') return send(res, 200, await scanYoutube(db))
  if (req.method === 'POST' && url.pathname === '/api/media/probe') return send(res, 200, await mediaProbe(db))
  if (req.method === 'POST' && url.pathname === '/api/media/extract') {
    const body = await parseBody(req)
    const target = latestStreamCandidate(db.videos)
    const videoUrl = body.videoUrl || target?.url || db.settings.channelUrl
    const videoId = body.videoId || target?.id || videoUrl.match(/[?&]v=([^&]+)/)?.[1] || ''
    const probe = await commandExists(localYtDlp)
    const command = buildYtDlpCommand(videoUrl)
    if (!probe.ok) {
      return send(res, 200, await addMediaJob(db, 'youtube-extract', 'needs-review', `yt-dlp missing; install it before download. Planned source: ${videoUrl}`, command))
    }
    const preflight = await preflightYoutubeDownload(videoUrl)
    const status = preflight.ok ? 'queued' : 'needs-review'
    const detail = preflight.ok ? `Preflight passed for ${videoUrl}: ${preflight.detail}` : `${preflight.blocked ? 'VPS extraction blocked' : 'Extraction preflight failed'} for ${videoUrl}: ${preflight.detail}`
    return send(res, 200, await addMediaJob(db, 'youtube-extract', status, detail, preflight.ok ? command : `${buildYtDlpPreflightCommand(videoUrl)}\n\n${buildLocalCompanionCommand(videoUrl, videoId)}`))
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
    return await serveStatic(req, res)
  } catch (error) { return send(res, 500, { error: error.message }) }
}).listen(port, '127.0.0.1', () => console.log(`Vibe Zone local server: http://127.0.0.1:${port}`))
