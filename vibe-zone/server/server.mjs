import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataDir = path.join(root, 'data')
const dbPath = path.join(dataDir, 'vibe-zone.json')
const port = Number(process.env.PORT || 8787)

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
  chatMessages: [],
  jobs: [],
}

async function loadDb() {
  await mkdir(dataDir, { recursive: true })
  try {
    const stored = JSON.parse(await readFile(dbPath, 'utf8'))
    return { ...defaultDb, ...stored, settings: { ...defaultDb.settings, ...(stored.settings || {}) } }
  } catch {
    await saveDb(defaultDb)
    return structuredClone(defaultDb)
  }
}
async function saveDb(db) { await writeFile(dbPath, JSON.stringify(db, null, 2)) }
const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
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
    const xml = await (await fetch(rssUrl, { headers: { 'user-agent': 'VibeZoneLocal/0.1' } })).text()
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
      }
    })
    db.videos = entries
    const scan = { id: id('scan'), channelUrl: db.settings.channelUrl, channelId, status: 'done', startedAt, finishedAt: new Date().toISOString(), count: entries.length, error: null }
    db.scans.unshift(scan)
    job.status = 'done'; job.detail = `Found ${entries.length} recent public RSS videos.`
    await saveDb(db)
    return scan
  } catch (error) {
    const scan = { id: id('scan'), channelUrl: db.settings.channelUrl, status: 'failed', startedAt, finishedAt: new Date().toISOString(), count: 0, error: error.message }
    db.scans.unshift(scan)
    job.status = 'failed'; job.detail = error.message
    await saveDb(db)
    return scan
  }
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
      id: id('clip'), transcriptId, score, start: stamp(start), end: stamp(end),
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
  const names = ['MayaBot', 'PatchPal', 'StreamSage', 'PixelRex', 'LocalLarry', 'ClipCraftAI', 'DadModeDev', 'ShortsScout']
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
  if (req.method === 'POST' && url.pathname === '/api/transcripts') {
    const body = await parseBody(req); const t = { id: id('tx'), title: body.title || 'Untitled transcript', sourceUrl: body.sourceUrl || '', text: body.text || '', createdAt: new Date().toISOString() }
    db.transcripts.unshift(t); await addJob(db, 'transcript-import', 'Imported transcript', 'done', `${t.title} (${t.text.length} chars)`); await saveDb(db); return send(res, 200, t)
  }
  if (req.method === 'POST' && url.pathname === '/api/clips/generate') {
    const body = await parseBody(req); const transcript = db.transcripts.find((t) => t.id === body.transcriptId) || db.transcripts[0]
    if (!transcript) return send(res, 400, { error: 'Import a transcript first.' })
    const clips = scoreClips(transcript.id, transcript.text); db.clips = [...clips, ...db.clips.filter((c) => c.transcriptId !== transcript.id)].slice(0, 60)
    await addJob(db, 'clip-generation', 'Generated clip candidates', 'done', `${clips.length} clips from ${transcript.title}`); await saveDb(db); return send(res, 200, clips)
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
