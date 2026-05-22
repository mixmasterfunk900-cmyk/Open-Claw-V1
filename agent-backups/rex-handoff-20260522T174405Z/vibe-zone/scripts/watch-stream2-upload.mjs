import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { stat, readFile, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'media/downloads/Stream 2.mp4')
const canonical = path.join(root, 'media/downloads/stream-2.mp4')
const dbPath = path.join(root, 'data/vibe-zone.json')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const stamp = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

async function fileOpen(file) {
  try {
    await execFileAsync('lsof', [file], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}
async function duration(file) {
  const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { timeout: 10000 })
  return Number(stdout.trim())
}
async function lastPacket(file) {
  try {
    const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', file], { timeout: 30000, maxBuffer: 1024 * 1024 * 128 })
    return Number(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1)) || 0
  } catch (error) {
    const stdout = String(error.stdout || '')
    return Number(stdout.trim().split(/\r?\n/).filter(Boolean).at(-1)) || 0
  }
}
async function addMediaJob(detail, status = 'done') {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  db.jobs = db.jobs || []
  db.mediaJobs = db.mediaJobs || []
  const now = new Date().toISOString()
  const job = { id: `job_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, type: 'stream-2-upload', title: 'Stream 2 upload watcher', status, detail, createdAt: now }
  const mediaJob = { id: `media_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, step: 'stream-2-upload', status, detail, command: 'node scripts/watch-stream2-upload.mjs', createdAt: now }
  db.jobs.unshift(job)
  db.jobs = db.jobs.slice(0, 80)
  db.mediaJobs.unshift(mediaJob)
  db.mediaJobs = db.mediaJobs.slice(0, 80)
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function registerManualStream(size, durationSeconds) {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  db.videos = db.videos || []
  db.videos = db.videos.filter((video) => video.id !== 'stream-2')
  db.videos.unshift({
    id: 'stream-2',
    title: 'Stream 2 - manual upload',
    url: 'manual://stream-2',
    published: new Date().toISOString(),
    author: 'Masala',
    kind: 'stream',
    duration: Number.isFinite(durationSeconds) ? durationSeconds : null,
  })
  db.jobs = db.jobs || []
  db.mediaJobs = db.mediaJobs || []
  const detail = `Registered Stream 2 manual upload as media/downloads/stream-2.mp4 (${Math.round(size / 1024 / 1024)} MB, ${stamp(durationSeconds)}). Ready for transcription/clips.`
  const now = new Date().toISOString()
  db.jobs.unshift({ id: `job_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, type: 'stream-2-upload', title: 'Stream 2 registered', status: 'done', detail, createdAt: now })
  db.mediaJobs.unshift({ id: `media_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`, step: 'stream-2-upload', status: 'done', detail, command: 'node scripts/watch-stream2-upload.mjs', createdAt: now })
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}

let lastSize = -1
let stableChecks = 0
for (let i = 0; i < 360; i += 1) {
  const info = await stat(source).catch(() => null)
  if (!info) { await sleep(10000); continue }
  const open = await fileOpen(source)
  if (!open && info.size === lastSize) stableChecks += 1
  else stableChecks = 0
  lastSize = info.size
  if (stableChecks >= 2) break
  await sleep(15000)
}

const info = await stat(source)
const total = await duration(source).catch(() => 0)
const last = await lastPacket(source).catch(() => 0)
if (!total || !last || (total - last > 120 && last < total * 0.9)) {
  await addMediaJob(`Stream 2 upload finished but still looks partial: metadata ${stamp(total)}, decodable ${stamp(last)}, size ${Math.round(info.size / 1024 / 1024)} MB. Reupload needed before late-stream clips.`, 'needs-review')
  process.exit(2)
}
await copyFile(source, canonical)
await registerManualStream(info.size, total)
console.log(`Stream 2 upload valid: ${Math.round(info.size / 1024 / 1024)} MB, ${stamp(total)}.`)
