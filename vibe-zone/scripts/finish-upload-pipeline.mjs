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
function safeName(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'clip' }
function outputDuration(output) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', output], { cwd: root, encoding: 'utf8' })
  return Number.parseFloat((probe.stdout || '').trim()) || 0
}
function packetDuration(input) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', input], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 })
  const values = (probe.stdout || '').trim().split(/\s+/).map(Number).filter(Number.isFinite)
  return values.length ? Math.max(...values) : outputDuration(input)
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
const transcript = db.transcripts.find((item) => item.sourceUrl === sourceUrl || item.title.includes(videoId))
const mediaSeconds = packetDuration(inputPath)
const rankedClips = db.clips.filter((clip) => clip.transcriptId === transcript?.id).sort((a, b) => b.score - a.score)
const clips = rankedClips.filter((clip) => parseStamp(clip.end) <= mediaSeconds - 2).slice(0, 3)
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
  const output = `media/renders/${videoId}-${String(index + 1).padStart(2, '0')}-${safeName(clip.title)}.mp4`
  const filter = `scale=-2:1920,crop=1080:1920${subtitlePath ? `,subtitles='${subtitlePath.replaceAll("'", "'\\''")}'` : ''}`
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
