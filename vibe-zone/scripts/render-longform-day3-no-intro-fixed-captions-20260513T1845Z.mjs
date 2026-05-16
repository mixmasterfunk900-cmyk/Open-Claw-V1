#!/usr/bin/env node
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, buildLongPhraseEvents, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const baseId = 'day3-product-content-machine-v3-20260513T1500Z'
const finalId = 'day3-product-content-machine-no-intro-fixed-captions-20260513T1845Z'
const source = `media/renders/long-form/${baseId}.mp4`
const out = `media/renders/long-form/${finalId}.mp4`
const captionPath = `media/renders/long-form/${finalId}.ass`
const reviewDir = 'media/reviews/long-form'
const exportDir = `media/exports/long-form/${finalId}`
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const font = 'DejaVu Sans'

// Same story beats as v3, but we trim the 5 second intro card off the render.
const beats = [
  { role: 'Hook', start: '00:11:58.4', end: '00:12:12.4' },
  { role: 'Problem', start: '00:14:56.4', end: '00:15:38.4' },
  { role: 'Blocker', start: '00:24:00.4', end: '00:24:52.4' },
  { role: 'Build', start: '00:26:11.4', end: '00:26:28.4' },
  { role: 'Stakes', start: '00:30:10.4', end: '00:30:49.4' },
  { role: 'Result', start: '00:44:48.4', end: '00:46:14.4' },
  { role: 'Next', start: '00:47:13.4', end: '00:47:46.4' },
]

function run(command, args) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function toSec(ts) {
  const [h, m, rest] = ts.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(rest)
}
function assTime(sec) {
  sec = Math.max(0, sec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const cs = Math.floor((sec - Math.floor(sec)) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
function cleanText(s) {
  return String(s || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[{}]/g, '')
    .trim()
}
function escAss(s) {
  return s.replace(/\\/g, '\\\\').replace(/\{/g, '').replace(/\}/g, '')
}
function chunkWords(words, max = 6) {
  const chunks = []
  let current = []
  for (const word of words) {
    current.push(word)
    if (current.length >= max || /[.!?]$/.test(word)) {
      chunks.push(current)
      current = []
    }
  }
  if (current.length) chunks.push(current)
  return chunks
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const timeline = beats.reduce((total, beat) => total + Math.max(0, toSec(beat.end) - toSec(beat.start)), 0)
const events = buildLongPhraseEvents({
  segments: transcript.segments || [],
  beats,
  maxWords: 6,
  maxChars: 42,
  minDuration: 0.72,
  maxDuration: 2.6,
  gap: 0.035,
})
const qa = qaCaptionEvents(events, { mode: 'long', maxWords: 7, maxChars: 46, minDuration: 0.65, maxDuration: 2.8 })
if (!qa.ok) throw new Error(`Long-form caption QA failed: ${qa.failures.slice(0, 8).join('; ')}`)
const ass = buildAss(events, { mode: 'long', font })
await writeFile(path.join(root, captionPath), ass)
await writeFile(path.join(root, captionPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const escapedCaption = captionPath.replace(/:/g, '\\:').replace(/'/g, "'\\''")
const vf = `subtitles='${escapedCaption}',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='VIBE ZONE':fontcolor=#ff3b6b:fontsize=24:x=w-text_w-90:y=72:box=1:boxcolor=black@0.28:boxborderw=12`
run('ffmpeg', [
  '-y', '-v', 'error', '-ss', '5', '-i', source,
  '-vf', vf,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy', out,
])

run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:02', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${finalId}-first-frame.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:00:47', '-i', out, '-frames:v', '1', '-q:v', '2', `${reviewDir}/${finalId}-screenshot.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/40,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${finalId}-contact-sheet.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out])
await writeFile(path.join(root, `${reviewDir}/${finalId}.ffprobe.json`), probe.stdout)
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
await writeFile(path.join(root, `${reviewDir}/${finalId}.decode.log`), decode.stderr || decode.stdout || '')
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)

await copyFile(path.join(root, 'media/exports/long-form/day3-product-content-machine-v3-20260513T1500Z/upload-notes.md'), path.join(root, exportDir, 'upload-notes-base.md')).catch(() => {})
await writeFile(path.join(root, exportDir, 'upload-notes.md'), `# Manual Upload Notes — Day 3 Product + Content Machine No Intro Fixed Captions\n\nRender: \`${out}\`  \nCaptions: fixed single-line captions, no vertical bouncing, no overlapping caption events.  \nFirst frame proof: \`${reviewDir}/${finalId}-first-frame.jpg\`  \nContact sheet: \`${reviewDir}/${finalId}-contact-sheet.jpg\`  \nCaption source: \`${captionPath}\`  \nStatus: corrected local draft; manual upload only; owner approval required.\n\n## What changed from rejected version\n\n- Removed the 5 second intro card. Video starts immediately on stream footage.\n- Replaced messy incremental captions with fixed-lane phrase captions.\n- Caption line stays in one position at the bottom.\n- Caption events are forced non-overlapping.\n- VIBE ZONE burn retained.\n\n## Still required\n\n- Masala visual approval.\n- Full-res privacy/watch pass before public upload.\n`)

console.log(JSON.stringify({ finalId, out, captions: captionPath, captionQa: qa, events: events.length, exportDir, ffprobe: JSON.parse(probe.stdout) }, null, 2))
