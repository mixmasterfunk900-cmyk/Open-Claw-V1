#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { cleanCaptionText, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'stream2-founder-story-trimmed-hook-subtitles-fixed-20260515'
const trimStart = 30
const base = 'media/renders/long-form/.tmp-stream2-founder-story-crisp-subtitles-fixed-20260515/base-crisp.mp4'
const previousAss = 'media/renders/long-form/stream2-founder-story-crisp-subtitles-fixed-20260515.ass'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const out = `media/renders/long-form/${id}.mp4`
const assPath = `media/renders/long-form/${id}.ass`
const qaPath = `media/renders/long-form/${id}.qa.json`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const ready = `${readyDir}/long-stream2-founder-story-trimmed-hook-subtitles-fixed-20260515.mp4`
const reviewDir = 'media/reviews/long-form'
const contactSheet = `${readyDir}/long-stream2-founder-story-trimmed-hook-subtitles-fixed-contact-sheet-20260515.jpg`
const firstMinuteStrip = `${reviewDir}/${id}-first-minute-strip.jpg`

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }
function assEscape(value = '') { return cleanCaptionText(value).replace(/\\/g, '\\\\') }
function parseAssTime(value) {
  const match = String(value).match(/^(\d+):(\d{2}):(\d{2})\.(\d{2})$/)
  if (!match) throw new Error(`bad ASS time: ${value}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 100
}
function assTime(value = 0) {
  const total = Math.max(0, Number(value) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secondsValue = total % 60
  const secondsPart = String(Math.floor(secondsValue)).padStart(2, '0')
  const centis = String(Math.floor((secondsValue - Math.floor(secondsValue)) * 100)).padStart(2, '0')
  return `${hours}:${String(minutes).padStart(2, '0')}:${secondsPart}.${centis}`
}
function parseDialogue(line) {
  const parts = line.split(',')
  if (parts.length < 10) return null
  const start = parseAssTime(parts[1])
  const end = parseAssTime(parts[2])
  const text = cleanCaptionText(parts.slice(9).join(','))
  if (!text || end <= trimStart) return null
  return { start: Math.max(0, start - trimStart), end: Math.max(0.35, end - trimStart), text }
}
function buildBigAss(events) {
  const lines = events.map((event) => `Dialogue: 0,${assTime(event.start)},${assTime(event.end)},VibeLongReadable,,0,0,0,,${assEscape(event.text)}`)
  return `[Script Info]\nTitle: Vibe Zone Stream 2 trimmed hook readable captions\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\nPlayResX: 1920\nPlayResY: 1080\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: VibeLongReadable,DejaVu Sans,58,&H00FFFFFF,&H00FFFFFF,&H00100010,&HAA000000,-1,0,0,0,100,100,0,0,1,7,1.6,2,190,190,110,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${lines.join('\n')}\n`
}
function probeDuration(file) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).stdout.trim())
}
function coverage(events, duration) {
  let maxGap = events[0]?.start ?? duration
  let previousEnd = 0
  for (const event of events) {
    maxGap = Math.max(maxGap, event.start - previousEnd)
    previousEnd = Math.max(previousEnd, event.end)
  }
  return { maxGap: Number(maxGap.toFixed(3)), finalGap: Number(Math.max(0, duration - previousEnd).toFixed(3)), firstStart: events[0]?.start ?? null, lastEnd: events.at(-1)?.end ?? null }
}

await mkdir(path.join(root, readyDir), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })

const ass = await readFile(path.join(root, previousAss), 'utf8')
const events = ass.split('\n').filter((line) => line.startsWith('Dialogue:')).map(parseDialogue).filter(Boolean)
const normalized = events.map((event, index, list) => {
  const next = list[index + 1]
  let end = Math.max(event.start + 0.55, event.end)
  if (next) end = Math.min(end, Math.max(event.start + 0.55, next.start - 0.035))
  return { ...event, end }
}).filter((event) => event.end > event.start + 0.05)
const qa = qaCaptionEvents(normalized, { mode: 'long', maxWords: 7, maxChars: 52, minDuration: 0.5, maxDuration: 3.0 })
if (!qa.ok) throw new Error(`caption QA failed: ${qa.failures.slice(0, 10).join('; ')}`)
await writeFile(path.join(root, assPath), buildBigAss(normalized))

const expectedDuration = Math.max(0, probeDuration(base) - trimStart)
const filter = `[0:v]trim=start=${trimStart},setpts=PTS-STARTPTS,subtitles='${filterPath(assPath)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto:shortest=1[vout];[0:a]atrim=start=${trimStart},asetpts=PTS-STARTPTS[aout]`
run('ffmpeg', ['-y', '-v', 'error', '-i', base, '-loop', '1', '-i', logoPath, '-filter_complex', filter, '-map', '[vout]', '-map', '[aout]', '-t', String(expectedDuration.toFixed(3)), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)
const duration = probeDuration(out)
const cov = coverage(normalized, duration)
await writeFile(path.join(root, qaPath), JSON.stringify({ ...qa, coverage: cov, duration, sourceAss: previousAss, trimStartSeconds: trimStart, editNote: 'Removed messy original 0-30s; new video starts at previous 30s hook.' }, null, 2) + '\n')
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', "select='eq(n,0)+eq(n,300)+eq(n,600)+eq(n,900)+eq(n,1200)+eq(n,1500)+eq(n,1800)',scale=480:-1,tile=7x1", '-frames:v', '1', '-q:v', '2', firstMinuteStrip])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/55,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
await copyFile(path.join(root, out), path.join(root, ready))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, contactSheet))
await copyFile(path.join(root, qaPath), path.join(root, ready.replace(/\.mp4$/, '.caption-qa.json')))

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const now = new Date().toISOString()
for (const concept of data.thumbnailConcepts || []) {
  if (String(concept.id || '').startsWith('thumb_long-stream2-founder-story_')) {
    concept.sourceVideoPath = ready
    concept.sourceProofPath = contactSheet
    concept.updatedAt = now
    concept.notes = [concept.notes, 'Long-form hook tightened: removed messy first 30 seconds; subtitles enlarged and QA-passed.'].filter(Boolean).join(' ')
  }
}
data.mediaJobs = data.mediaJobs || []
data.mediaJobs.unshift({
  id: `media_job_${Date.now()}_stream2_trimmed_hook_caption_fix`,
  type: 'render-fix',
  title: 'Tightened Stream 2 Founder Story opening hook and subtitles',
  step: 'Remove weak first 30s and enlarge/QA captions',
  status: 'done',
  detail: 'Rebuilt Stream 2 Founder Story Prototype to start at the stronger 30s hook, shifted caption timings, enlarged long-form subtitle styling, generated QA/contact sheet, and repointed Thumbnail Lab concepts.',
  command: 'node scripts/fix-stream2-founder-trim-hook-subtitles-20260515.mjs',
  createdAt: now,
})
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out]).stdout)
console.log(JSON.stringify({ ok: true, out, ready, duration, captions: normalized.length, qaOk: qa.ok, coverage: cov, firstCaption: normalized[0], firstMinuteStrip, contactSheet, probe }, null, 2))
