#!/usr/bin/env node
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const videoId = process.argv[2] || 'dejKxLu_iM0'
const inputPath = `media/downloads/${videoId}.mp4`
const transcriptPath = `media/transcripts/${videoId}.txt`
const subtitlePath = `media/transcripts/${videoId}.srt`
const punchySubtitlePath = `media/transcripts/${videoId}.punchy.ass`
const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`

await mkdir(path.join(root, 'media', 'renders'), { recursive: true })

async function post(pathname, body) {
  const response = await fetch(`http://127.0.0.1:8787${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${pathname} failed: ${text}`)
  return JSON.parse(text)
}

function parseStamp(value = '0:00') {
  const parts = String(value).split(':').map(Number)
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
}
function overlapsTooMuch(a, b, minimumGap = 75) {
  const aStart = parseStamp(a.start), aEnd = parseStamp(a.end)
  const bStart = parseStamp(b.start), bEnd = parseStamp(b.end)
  const overlap = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
  const gap = Math.max(0, Math.max(aStart, bStart) - Math.min(aEnd, bEnd))
  return overlap > 0 || gap < minimumGap
}
function pickDiverseClips(clips, count = 3) {
  const selected = []
  for (const clip of clips) {
    if (selected.every((chosen) => !overlapsTooMuch(clip, chosen))) selected.push(clip)
    if (selected.length >= count) return selected
  }
  for (const clip of clips) {
    if (!selected.includes(clip)) selected.push(clip)
    if (selected.length >= count) break
  }
  return selected
}

function srtTimeToSeconds(value) {
  const match = value.match(/(\d+):(\d+):(\d+),(\d+)/)
  if (!match) return 0
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000
}
function assTime(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  const cs = Math.floor((total - Math.floor(total)) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
function assEscape(text) {
  return text.replace(/[{}]/g, '').replace(/\n/g, ' ').trim().toUpperCase()
}
async function buildPunchyAss(srtRelativePath, assRelativePath) {
  const srt = await readFile(path.join(root, srtRelativePath), 'utf8')
  const events = []
  for (const block of srt.split(/\n\s*\n/)) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const timeLine = lines.find((line) => line.includes('-->'))
    if (!timeLine) continue
    const [startRaw, endRaw] = timeLine.split('-->').map((part) => part.trim())
    const start = srtTimeToSeconds(startRaw)
    const end = srtTimeToSeconds(endRaw)
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(' ').replace(/\s+/g, ' ').trim()
    const words = text.split(/\s+/).filter(Boolean)
    if (!words.length || end <= start) continue
    const chunks = []
    for (let i = 0; i < words.length; i += words.length <= 4 ? 1 : 2) chunks.push(words.slice(i, i + (words.length <= 4 ? 1 : 2)).join(' '))
    const slice = (end - start) / chunks.length
    chunks.forEach((chunk, index) => {
      const chunkStart = start + slice * index
      const chunkEnd = index === chunks.length - 1 ? end : start + slice * (index + 1)
      events.push(`Dialogue: 0,${assTime(chunkStart)},${assTime(chunkEnd)},Punchy,,0,0,0,,${assEscape(chunk)}`)
    })
  }
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Punchy,DejaVu Sans,82,&H00FFFFFF,&H000000FF,&H00000000,&H7A000000,-1,0,0,0,100,100,0,0,1,7,1,2,80,80,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`
  await writeFile(path.join(root, assRelativePath), ass)
  return assRelativePath
}

function safeName(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'clip' }
function outputDuration(output) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', output], { cwd: root, encoding: 'utf8' })
  return Number.parseFloat((probe.stdout || '').trim()) || 0
}
function packetDuration(input) {
  const containerDuration = outputDuration(input)
  // Packet PTS is the safest check for partial/corrupt livestream downloads:
  // MP4 metadata can claim the full stream duration even when the file only
  // decodes through the first chunk. Keep a large buffer so healthy long
  // streams do not get truncated by spawnSync.
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', input], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 128 })
  const values = (probe.stdout || '').trim().split(/\s+/).map(Number).filter(Number.isFinite)
  const packetMax = values.length ? Math.max(...values) : 0
  if (packetMax > 1 && (probe.stderr?.includes('partial file') || packetMax + 10 < containerDuration)) return packetMax
  return containerDuration || packetMax
}
async function playableOutput(output) {
  try {
    const info = await stat(path.join(root, output))
    return info.size > 1024 * 1024 && outputDuration(output) > 1
  } catch { return false }
}
function addJob(db, step, status, detail, command = '') {
  const now = new Date().toISOString()
  const id = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
  db.mediaJobs = db.mediaJobs || []
  db.jobs = db.jobs || []
  db.mediaJobs.unshift({ id: `media_${id}`, step, status, detail, command, createdAt: now })
  db.jobs.unshift({ id: `job_${id}`, type: `media-${step}`, title: `Media pipeline: ${step}`, status, detail, createdAt: now })
  db.mediaJobs = db.mediaJobs.slice(0, 80)
  db.jobs = db.jobs.slice(0, 80)
}

console.log('[pipeline] Importing transcript and generating clip candidates')
await post('/api/media/ingest-local', { videoId, inputPath, transcriptPath, subtitlePath, sourceUrl })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const activeSubtitlePath = await buildPunchyAss(subtitlePath, punchySubtitlePath)
addJob(db, 'subtitle-style', 'done', `Built punchy 1-2 word safe-zone captions at ${activeSubtitlePath}.`, '')
const transcript = db.transcripts.find((item) => item.sourceUrl === sourceUrl || item.title.includes(videoId))
const mediaSeconds = packetDuration(inputPath)
const rankedClips = db.clips.filter((clip) => clip.transcriptId === transcript?.id).sort((a, b) => b.score - a.score)
const clips = pickDiverseClips(rankedClips.filter((clip) => parseStamp(clip.end) <= mediaSeconds - 2), 3)
if (rankedClips.length && clips.length < Math.min(3, rankedClips.length)) {
  addJob(db, 'render-clips', 'needs-review', `Local media appears playable through ${Math.round(mediaSeconds)}s, so later high-scoring clips were skipped until a complete download is imported.`, '')
}
if (!clips.length) {
  addJob(db, 'render-clips', 'needs-review', 'Transcript imported, but no clip candidates scored high enough to render automatically.')
  await writeFile(dbPath, JSON.stringify(db, null, 2))
  console.log('[pipeline] No clips to render')
  process.exit(0)
}

for (const [index, clip] of clips.entries()) {
  const start = Math.max(0, parseStamp(clip.start) - 1)
  const end = Math.max(start + 12, parseStamp(clip.end))
  const output = `media/renders/${videoId}-${String(index + 1).padStart(2, '0')}-${safeName(clip.title)}-punchy.mp4`
  const escapedSubtitle = activeSubtitlePath.replaceAll("'", "'\\''")
  const filter = `scale=-2:1920,crop=1080:1920,subtitles='${escapedSubtitle}'`
  // Coarse input seek plus accurate output trim avoids decoding a whole livestream,
  // while preventing tiny header-only MP4s when the requested range starts far from a keyframe.
  const duration = Math.max(12, end - start)
  const preSeek = Math.max(0, start - 5)
  const trimSeek = start - preSeek
  const args = ['-y', '-ss', String(preSeek), '-i', inputPath, '-ss', String(trimSeek), '-t', String(duration), '-vf', filter, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', output]
  const command = `ffmpeg ${args.map((arg) => arg.includes(' ') ? JSON.stringify(arg) : arg).join(' ')}`
  console.log(`[pipeline] Rendering ${output}`)
  const result = spawnSync('ffmpeg', args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 })
  if (result.status === 0 && await playableOutput(output)) addJob(db, 'render-clips', 'done', `Rendered ${clip.title} (${clip.start}-${clip.end}) to ${output}`, command)
  else addJob(db, 'render-clips', 'failed', `Failed rendering ${clip.title}: output was not playable. ${(result.stderr || result.error?.message || '').split('\n').slice(-4).join(' ')}`, command)
}
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log('[pipeline] Finished')
