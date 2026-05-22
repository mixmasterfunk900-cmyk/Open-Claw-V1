#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildAss, cleanCaptionText, normalizeTiming, qaCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const transcriptDir = 'media/transcripts/longform-corrected-20260515'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const reviewDir = 'media/reviews/long-form'

const jobs = [
  {
    key: 'day3',
    title: 'Day 3 Product + Content Machine',
    base: 'media/renders/long-form/.tmp-day3-product-content-machine-upload-candidate-20260513T2300Z/base-clean.mp4',
    transcript: `${transcriptDir}/base-clean.json`,
    render: 'media/renders/long-form/day3-product-content-machine-upload-candidate-subtitles-fixed-20260515.mp4',
    ass: 'media/renders/long-form/day3-product-content-machine-upload-candidate-subtitles-fixed-20260515.ass',
    ready: `${readyDir}/long-day3-product-content-machine-subtitles-fixed-20260515.mp4`,
    contactSheet: `${readyDir}/long-day3-product-content-machine-subtitles-fixed-contact-sheet-20260515.jpg`,
    conceptPrefix: 'thumb_long-day3-product-content-machine_',
  },
  {
    key: 'stream2',
    title: 'Stream 2 Founder Story Prototype',
    base: 'media/renders/long-form/.tmp-stream2-founder-story-privacy-safe-20260514T1100Z/base-privacy-safe.mp4',
    transcript: `${transcriptDir}/base-privacy-safe.json`,
    render: 'media/renders/long-form/stream2-founder-story-privacy-safe-subtitles-fixed-20260515.mp4',
    ass: 'media/renders/long-form/stream2-founder-story-privacy-safe-subtitles-fixed-20260515.ass',
    ready: `${readyDir}/long-stream2-founder-story-subtitles-fixed-20260515.mp4`,
    contactSheet: `${readyDir}/long-stream2-founder-story-subtitles-fixed-contact-sheet-20260515.jpg`,
    conceptPrefix: 'thumb_long-stream2-founder-story_',
  },
]

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}

function filterPath(p) {
  return p.replace(/:/g, '\\:').replace(/'/g, "'\\''")
}

function weightedLength(text = '') {
  return cleanCaptionText(text).length
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
    parts.forEach((part, index) => {
      words.push({
        start: start + (end - start) * (index / parts.length),
        end: start + (end - start) * ((index + 1) / parts.length),
        text: part,
      })
    })
  }
  return words.sort((a, b) => a.start - b.start)
}

function flushPhrase(events, phrase) {
  if (!phrase.length) return
  const text = phrase.map((word) => word.text).join(' ').toUpperCase()
  events.push({ start: phrase[0].start, end: phrase.at(-1).end, text })
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
    if (phrase.length && (gap > maxGap || phrase.length >= maxWords || weightedLength(candidateText) > maxChars)) {
      flushPhrase(events, phrase)
      phrase = []
    }
    phrase.push(word)
    if (/[.!?]$/.test(word.text) || phrase.length >= maxWords || weightedLength(phrase.map((item) => item.text).join(' ')) >= maxChars) {
      flushPhrase(events, phrase)
      phrase = []
    }
  }
  flushPhrase(events, phrase)
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

function probeDuration(file) {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).stdout.trim())
}

function applyDomainCorrections(text) {
  return cleanCaptionText(text)
    .replace(/\bOPENCROW\b/g, 'OPENCLAW')
    .replace(/\bOPEN CROP\b/g, 'OPENCLAW')
    .replace(/\bOPEN CLOUD\b/g, 'OPENCLAW')
    .replace(/\bCLOUD CODEC\b/g, 'CLAUDE CODE')
    .replace(/\bOPEN AI CODECS\b/g, 'OPENAI CODEX')
    .replace(/\bCHAT GBT\b/g, 'CHATGPT')
    .replace(/THE NOT CLOUD CHAT$/g, 'CLAUDE OR CHATGPT')
    .replace(/^GBT WILL SORT/g, 'WILL SORT')
    .replace(/\bAGENTEX SOFTWARE\b/g, 'AGENTIC SOFTWARE')
    .replace(/SO TODAY WE WANT TO BUSH\./g, 'SO TODAY WE WANT TO PUSH.')
    .replace(/LET'S THAT'S ACTUALLY/g, "THAT'S ACTUALLY")
    .replace(/RUN IN 24 -7/g, 'RUNNING 24/7')
}

function eventCoverage(events, duration) {
  let maxGap = events[0]?.start ?? duration
  let previousEnd = 0
  for (const event of events) {
    maxGap = Math.max(maxGap, event.start - previousEnd)
    previousEnd = Math.max(previousEnd, event.end)
  }
  const finalGap = Math.max(0, duration - previousEnd)
  return { maxGap: Number(maxGap.toFixed(3)), finalGap: Number(finalGap.toFixed(3)), firstStart: events[0]?.start ?? null, lastEnd: events.at(-1)?.end ?? null }
}

await mkdir(path.join(root, readyDir), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })

const results = []
for (const job of jobs) {
  const transcript = JSON.parse(await readFile(path.join(root, job.transcript), 'utf8'))
  const duration = probeDuration(job.base)
  const words = collectWords(transcript)
  const events = buildPhraseEventsFromWords(words).map((event) => ({ ...event, text: applyDomainCorrections(event.text) }))
  const qa = qaCaptionEvents(events, { mode: 'long', maxWords: 7, maxChars: 52, minDuration: 0.55, maxDuration: 3.0 })
  if (!qa.ok) throw new Error(`${job.key} subtitle QA failed: ${qa.failures.slice(0, 12).join('; ')}`)
  const coverage = eventCoverage(events, duration)
  await writeFile(path.join(root, job.ass), buildAss(events, { mode: 'long', font: 'DejaVu Sans' }))
  await writeFile(path.join(root, job.ass.replace(/\.ass$/, '.qa.json')), JSON.stringify({ ...qa, coverage, duration, transcript: job.transcript, wordCount: words.length }, null, 2) + '\n')

  const vfFinal = `[0:v]subtitles='${filterPath(job.ass)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto[vout]`
  run('ffmpeg', ['-y', '-v', 'error', '-i', job.base, '-loop', '1', '-i', logoPath, '-filter_complex', vfFinal, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', job.render])
  const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', job.render, '-f', 'null', '-'], { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40 })
  if (decode.status !== 0) throw new Error(`${job.key} decode failed\n${decode.stderr || decode.stdout}`)
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', job.render]).stdout)
  const localContact = `media/reviews/long-form/${path.basename(job.render, '.mp4')}-contact-sheet.jpg`
  run('ffmpeg', ['-y', '-v', 'error', '-i', job.render, '-vf', 'fps=1/55,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', localContact])
  await copyFile(path.join(root, job.render), path.join(root, job.ready))
  await copyFile(path.join(root, localContact), path.join(root, job.contactSheet))
  await copyFile(path.join(root, job.ass.replace(/\.ass$/, '.qa.json')), path.join(root, job.ready.replace(/\.mp4$/, '.caption-qa.json')))
  results.push({ ...job, duration, words: words.length, captions: events.length, qa, coverage, probe, localContact })
}

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
for (const job of jobs) {
  for (const concept of data.thumbnailConcepts || []) {
    if (String(concept.id || '').startsWith(job.conceptPrefix)) {
      concept.sourceVideoPath = job.ready
      concept.sourceProofPath = job.contactSheet
      concept.updatedAt = new Date().toISOString()
    }
  }
}
data.mediaJobs = data.mediaJobs || []
data.mediaJobs.unshift({
  id: `media_job_${Date.now()}_longform_subtitle_fix`,
  type: 'caption-fix',
  title: 'Fixed Thumbnail Lab long-form subtitles',
  step: 'Regenerate exact-cut long-form subtitles',
  status: 'done',
  detail: 'Re-transcribed the exact clean long-form cuts for Day 3 Product + Content Machine and Stream 2 Founder Story, rerendered burned captions, and repointed Thumbnail Lab at the corrected files.',
  command: 'node scripts/fix-longform-thumbnail-lab-subtitles-20260515.mjs',
  createdAt: new Date().toISOString(),
})
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

console.log(JSON.stringify({ ok: true, results: results.map(({ key, title, ready, contactSheet, duration, words, captions, coverage }) => ({ key, title, ready, contactSheet, duration, words, captions, coverage })) }, null, 2))
