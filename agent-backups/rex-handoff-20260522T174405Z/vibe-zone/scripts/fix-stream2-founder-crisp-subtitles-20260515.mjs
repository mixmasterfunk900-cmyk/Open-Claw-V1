#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, cleanCaptionText, normalizeTiming, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'stream2-founder-story-crisp-subtitles-fixed-20260515'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/longform-corrected-20260515/base-privacy-safe.json'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const out = `media/renders/long-form/${id}.mp4`
const assPath = `media/renders/long-form/${id}.ass`
const qaPath = `media/renders/long-form/${id}.qa.json`
const work = `media/renders/long-form/.tmp-${id}`
const reviewDir = 'media/reviews/long-form'
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const ready = `${readyDir}/long-stream2-founder-story-crisp-subtitles-fixed-20260515.mp4`
const contactSheet = `${readyDir}/long-stream2-founder-story-crisp-subtitles-fixed-contact-sheet-20260515.jpg`

// Same edit as the previous privacy-safe render, but without the accidental all-over blur.
// Keeping the exact beat durations means the corrected transcript stays aligned.
const beats = [
  { order: 1, role: 'hook', start: '01:21:32.0', end: '01:22:02.0' },
  { order: 2, role: 'problem', start: '00:02:12.0', end: '00:03:32.0' },
  { order: 3, role: 'blocker', start: '00:04:58.0', end: '00:05:31.0' },
  { order: 4, role: 'build', start: '00:06:00.0', end: '00:07:42.0' },
  { order: 5, role: 'blocker', start: '00:10:16.0', end: '00:12:12.0' },
  { order: 6, role: 'result', start: '00:20:10.8', end: '00:20:48.0' },
  { order: 7, role: 'cta', start: '00:03:24.0', end: '00:03:32.0' },
]

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function filterPath(p) { return p.replace(/:/g, '\\:').replace(/'/g, "'\\''") }
function probeDuration(file) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).stdout.trim())
}
function wordText(word) {
  return cleanCaptionText(String(word?.word || word?.text || '').replace(/^\s+/, ''))
}
function collectWords(transcript) {
  const words = []
  for (const segment of transcript.segments || []) {
    if (Array.isArray(segment.words) && segment.words.length) {
      for (const word of segment.words) {
        const text = wordText(word)
        const start = Number(word.start)
        const end = Number(word.end)
        if (text && Number.isFinite(start) && Number.isFinite(end) && end > start) words.push({ start, end, text })
      }
      continue
    }
    const text = cleanCaptionText(segment.text)
    const start = Number(segment.start)
    const end = Number(segment.end)
    const parts = text.split(/\s+/).filter(Boolean)
    if (!parts.length || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    parts.forEach((part, index) => words.push({
      start: start + (end - start) * (index / parts.length),
      end: start + (end - start) * ((index + 1) / parts.length),
      text: part,
    }))
  }
  return words.sort((a, b) => a.start - b.start)
}
function flush(events, phrase) {
  if (!phrase.length) return
  events.push({ start: phrase[0].start, end: phrase.at(-1).end, text: phrase.map((w) => w.text).join(' ').toUpperCase() })
}
function applyDomainCorrections(text) {
  return cleanCaptionText(text)
    .replace(/\bOPENCROW\b/g, 'OPENCLAW')
    .replace(/\bOPEN CROP\b/g, 'OPENCLAW')
    .replace(/\bOPEN CLOUD\b/g, 'OPENCLAW')
    .replace(/\bCLOUD CODEC\b/g, 'CLAUDE CODE')
    .replace(/\bOPEN AI CODECS\b/g, 'OPENAI CODEX')
    .replace(/\bOPENAICOLDX\b/g, 'OPENAI CODEX')
    .replace(/\bCLOUDCOLDER\b/g, 'CLAUDE CODE')
    .replace(/\bCHAT GBT\b/g, 'CHATGPT')
    .replace(/\bAGENTX SOFTWARE\b/g, 'AGENTIC SOFTWARE')
    .replace(/SO TODAY WE WANT TO BUSH\./g, 'SO TODAY WE WANT TO PUSH.')
    .replace(/I'M HOPING THE NOT CLOUD CHAT/g, "I'M HOPING CLAUDE OR CHATGPT")
    .replace(/^GBT WILL SORT ME OUT FOR/g, 'WILL SORT ME OUT FOR')
    .replace(/RUN IN 24 -7/g, 'RUNNING 24/7')
}
function buildPhraseEventsFromWords(words) {
  const events = []
  let phrase = []
  const maxWords = 6
  const maxChars = 42
  const maxGap = 0.75
  for (const word of words) {
    const candidate = [...phrase, word]
    const candidateText = candidate.map((item) => item.text).join(' ')
    const previous = phrase.at(-1)
    const gap = previous ? word.start - previous.end : 0
    if (phrase.length && (gap > maxGap || phrase.length >= maxWords || cleanCaptionText(candidateText).length > maxChars)) {
      flush(events, phrase)
      phrase = []
    }
    phrase.push(word)
    if (/[.!?]$/.test(word.text) || phrase.length >= maxWords || cleanCaptionText(phrase.map((item) => item.text).join(' ')).length >= maxChars) {
      flush(events, phrase)
      phrase = []
    }
  }
  flush(events, phrase)
  const stretched = events.map((event, index, list) => {
    const next = list[index + 1]
    const start = Math.max(0, event.start)
    let end = Math.max(start + 0.7, event.end)
    if (next) end = Math.min(end, Math.max(start + 0.7, next.start - 0.04))
    end = Math.min(end, start + 2.8)
    return { ...event, start, end }
  }).filter((event) => event.end > event.start + 0.05)
  return normalizeTiming(stretched, { minDuration: 0.55, maxDuration: 2.8, gap: 0.035 })
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

await mkdir(path.join(root, work), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const concat = []
let index = 1
for (const beat of beats) {
  const segPath = `${work}/${String(index++).padStart(2, '0')}-${beat.role}.mp4`
  const vf = ['fps=30', 'scale=1920:1080:force_original_aspect_ratio=decrease', 'pad=1920:1080:(ow-iw)/2:(oh-ih)/2', 'setsar=1'].join(',')
  run('ffmpeg', ['-y', '-v', 'error', '-ss', beat.start, '-to', beat.end, '-i', source, '-map', '0:v:0', '-map', '0:a:0', '-vf', vf, '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', segPath])
  concat.push(segPath)
}
const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
const baseOut = `${work}/base-crisp.mp4`
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', baseOut])

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const duration = probeDuration(baseOut)
const words = collectWords(transcript)
const events = buildPhraseEventsFromWords(words).map((event) => ({ ...event, text: applyDomainCorrections(event.text) }))
const qa = qaCaptionEvents(events, { mode: 'long', maxWords: 7, maxChars: 52, minDuration: 0.55, maxDuration: 3.0 })
if (!qa.ok) throw new Error(`subtitle QA failed: ${qa.failures.slice(0, 12).join('; ')}`)
const cov = coverage(events, duration)
if (cov.maxGap > 30 || cov.finalGap > 3) throw new Error(`caption coverage failed: ${JSON.stringify(cov)}`)
await writeFile(path.join(root, assPath), buildAss(events, { mode: 'long', font: 'DejaVu Sans' }))
await writeFile(path.join(root, qaPath), JSON.stringify({ ...qa, coverage: cov, duration, transcript: transcriptPath, wordCount: words.length }, null, 2) + '\n')

const vfFinal = `[0:v]subtitles='${filterPath(assPath)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto[vout]`
run('ffmpeg', ['-y', '-v', 'error', '-i', baseOut, '-loop', '1', '-i', logoPath, '-filter_complex', vfFinal, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
if (decode.status !== 0) throw new Error(`decode failed\n${decode.stderr || decode.stdout}`)
const localContact = `${reviewDir}/${id}-contact-sheet.jpg`
const localFrame = `${reviewDir}/${id}-frame-150s.jpg`
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/55,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', localContact])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:02:30', '-i', out, '-frames:v', '1', '-q:v', '2', localFrame])
await copyFile(path.join(root, out), path.join(root, ready))
await copyFile(path.join(root, localContact), path.join(root, contactSheet))
await copyFile(path.join(root, qaPath), path.join(root, ready.replace(/\.mp4$/, '.caption-qa.json')))

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const now = new Date().toISOString()
for (const concept of data.thumbnailConcepts || []) {
  if (String(concept.id || '').startsWith('thumb_long-stream2-founder-story_')) {
    concept.sourceVideoPath = ready
    concept.sourceProofPath = contactSheet
    concept.updatedAt = now
    concept.notes = [concept.notes, 'Crisp no-blur source video restored; corrected exact-cut subtitles burned in.'].filter(Boolean).join(' ')
  }
}
data.mediaJobs = data.mediaJobs || []
data.mediaJobs.unshift({
  id: `media_job_${Date.now()}_stream2_crisp_subtitles_fix`,
  type: 'render-fix',
  title: 'Fixed Stream 2 long-form blur and subtitles',
  step: 'Re-render crisp Stream 2 Founder Story with corrected captions',
  status: 'done',
  detail: 'The previous Thumbnail Lab source pointed at the privacy-safe blurred render. Re-rendered the same edit without global blur, burned corrected exact-cut captions, generated QA/contact sheet, and repointed all Stream 2 thumbnail concepts.',
  command: 'node scripts/fix-stream2-founder-crisp-subtitles-20260515.mjs',
  createdAt: now,
})
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', out]).stdout)
console.log(JSON.stringify({ ok: true, out, ready, contactSheet, localFrame, duration, captions: events.length, words: words.length, coverage: cov, qaOk: qa.ok, probe }, null, 2))
