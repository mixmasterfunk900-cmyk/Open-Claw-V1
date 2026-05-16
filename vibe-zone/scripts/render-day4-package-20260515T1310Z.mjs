#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, captionCoverage, normalizeTiming, cleanCaptionText } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const videoId = '_R2pPID8N-o'
const packageStamp = '20260515T1310Z'
const source = `media/downloads/${videoId}.mp4`
const transcriptPath = `media/transcripts/${videoId}.json`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const renderDir = 'media/renders/day4-package-20260515T1310Z'
const reviewDir = 'media/reviews/day4-package-20260515T1310Z'
const exportRoot = 'media/exports/day4-package-20260515T1310Z'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const logoPath = 'media/assets/logos/openclaw-title-card.png'
const seedHold = 0.55

const Z = {
  videoX: 44, videoY: 610, videoW: 992, videoH: 558,
  frameX: 32, frameY: 582, frameW: 1016, frameH: 614,
  captionMarginV: 440,
}

const clips = [
  {
    id: 'day4-stream-once-forever',
    start: 1834, end: 1887,
    header: ['STREAM ONCE', 'FOREVER'],
    title: 'Stream Once Forever', hook: 'STREAM ONCE FOREVER',
    caption: 'The core product pitch: stream once, then let the Vibe Zone machine turn the stream into social clips and marketing while you keep building.',
    seoTitle: 'Stream Once. Let AI Ship the Rest.',
    thumbnailText: 'STREAM ONCE FOREVER',
  },
  {
    id: 'day4-zero-risk-creator',
    start: 1834, end: 1893,
    header: ['ZERO RISK', 'CREATOR'],
    title: 'Zero Risk Creator Stack', hook: 'ZERO RISK CREATOR',
    caption: 'Masala sketches a creator SaaS model where the entry price stays tiny and the platform only earns more after the creator gets results.',
    seoTitle: 'The Fairest Creator SaaS Pricing Model?',
    thumbnailText: 'ZERO RISK CREATOR',
  },
  {
    id: 'day4-telegram-is-chaos',
    start: 1772, end: 1826,
    header: ['TELEGRAM IS', 'CHAOS'],
    title: 'Telegram Is Chaos', hook: 'TELEGRAM IS CHAOS',
    caption: 'The pain point that kicked off the multi-agent terminal/chat dashboard: one Telegram lane keeps overriding itself.',
    seoTitle: 'Telegram Broke My AI Workflow',
    thumbnailText: 'TELEGRAM CHAOS',
  },
  {
    id: 'day4-algorithm-wakes-up',
    start: 3673, end: 3730,
    header: ['ALGORITHM', 'WOKE UP'],
    title: 'Algorithm Woke Up', hook: 'ALGORITHM WOKE UP',
    caption: 'Early traction starts showing up: clips are getting impressions and views before the workflow is even fully automated.',
    seoTitle: 'The Algorithm Finally Noticed',
    thumbnailText: 'ALGORITHM WOKE UP',
  },
  {
    id: 'day4-one-billion-live',
    start: 4013, end: 4070,
    header: ['ONE BILLION', 'LIVE'],
    title: 'One Billion Live', hook: 'ONE BILLION LIVE',
    caption: 'The mission statement: build an all-in-one platform that clips and ships livestreams everywhere, live in public.',
    seoTitle: 'Building a $1B Company Live',
    thumbnailText: '$1B LIVE',
  },
]

const longBeats = [
  { role: 'problem', start: 1772, end: 1899 },
  { role: 'traction', start: 3673, end: 3895 },
  { role: 'pitch', start: 3896, end: 4154 },
]

function run(command, args, opts = {}) {
  const r = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 220, ...opts })
  if (r.status !== 0) throw new Error(`${command} failed\n${r.stderr || r.stdout}`)
  return r
}
function ts(s) {
  s = Math.max(0, Number(s) || 0)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
function escDraw(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:').replaceAll('%', '\\%') }
function filterPath(p) { return String(p).replace(/:/g, '\\:').replace(/'/g, "'\\''") }
function cleanWord(value) { return cleanCaptionText(value).replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase() }
function q(n) { return Number(n.toFixed(2)) }
function assWithStyle(events, { mode, short = false } = {}) {
  let ass = buildAss(events, { mode, font: 'DejaVu Sans' })
  if (short) {
    ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', `Style: VibeShortWord,DejaVu Sans,104,&H0000FF66,&H0000FF66,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,${Z.captionMarginV},1`)
  }
  return ass
}
function titleFilters(inputLabel, lines) {
  const top = lines.length > 1 ? 116 : 176
  const size = lines.length > 1 ? 118 : 142
  const gap = lines.length > 1 ? 122 : 0
  let current = inputLabel
  const out = []
  lines.forEach((line, i) => {
    const next = `head${Math.random().toString(16).slice(2)}`
    out.push(`[${current}]drawtext=fontfile='${fontBold}':text='${escDraw(line)}':x=(w-text_w)/2:y=${top + i * gap}:fontcolor=0xFFD400:fontsize=${size}:borderw=7:bordercolor=black@0.86[${next}]`)
    current = next
  })
  return { chains: out, label: current }
}
function addRetention(chains, inputLabel, duration) {
  chains.push(`[${inputLabel}]drawbox=x=${Z.frameX}:y=${Z.frameY}:w=${Z.frameW}:h=${Z.frameH}:color=0x66ff00@0.70:t=5:enable='gte(t,${seedHold})',drawbox=x=${Z.frameX + 7}:y=${Z.frameY + 7}:w=${Z.frameW - 14}:h=${Z.frameH - 14}:color=white@0.20:t=2:enable='gte(t,${seedHold})'[ret0]`)
  let current = 'ret0', idx = 0
  function moving({ sw, sh, color, xExpr, yExpr, start, end }) {
    const c = `glow${idx}`, next = `ret${idx + 1}`
    chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${c}]`)
    chains.push(`[${current}][${c}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
    current = next; idx++
  }
  for (const start of [0.85, 11.8, 27, 45].filter((t) => t < duration - 0.8)) {
    const a = start, b = start + 0.62, c = start + 1.24, d = start + 1.86, e = start + 2.48
    moving({ sw:360, sh:26, color:'0xfff3a0@0.62', xExpr:`${Z.frameX}-180+((t-${a})/${b-a})*${Z.frameW+360}`, yExpr:`${Z.frameY-11}`, start:a, end:b })
    moving({ sw:120, sh:16, color:'white@0.96', xExpr:`${Z.frameX}-60+((t-${a})/${b-a})*${Z.frameW+120}`, yExpr:`${Z.frameY-6}`, start:a, end:b })
    moving({ sw:26, sh:360, color:'0xfff3a0@0.62', xExpr:`${Z.frameX+Z.frameW-13}`, yExpr:`${Z.frameY}-180+((t-${b})/${c-b})*${Z.frameH+360}`, start:b, end:c })
    moving({ sw:16, sh:120, color:'white@0.96', xExpr:`${Z.frameX+Z.frameW-8}`, yExpr:`${Z.frameY}-60+((t-${b})/${c-b})*${Z.frameH+120}`, start:b, end:c })
    moving({ sw:360, sh:26, color:'0xfff3a0@0.62', xExpr:`${Z.frameX+Z.frameW}-180-((t-${c})/${d-c})*${Z.frameW+360}`, yExpr:`${Z.frameY+Z.frameH-13}`, start:c, end:d })
    moving({ sw:120, sh:16, color:'white@0.96', xExpr:`${Z.frameX+Z.frameW}-60-((t-${c})/${d-c})*${Z.frameW+120}`, yExpr:`${Z.frameY+Z.frameH-8}`, start:c, end:d })
    moving({ sw:26, sh:360, color:'0xfff3a0@0.62', xExpr:`${Z.frameX-13}`, yExpr:`${Z.frameY+Z.frameH}-180-((t-${d})/${e-d})*${Z.frameH+360}`, start:d, end:e })
    moving({ sw:16, sh:120, color:'white@0.96', xExpr:`${Z.frameX-8}`, yExpr:`${Z.frameY+Z.frameH}-60-((t-${d})/${e-d})*${Z.frameH+120}`, start:d, end:e })
  }
  return current
}
function buildShortFilter({ clip, assPath }) {
  const duration = clip.end - clip.start
  const chains = []
  chains.push('[0:v]setpts=PTS-STARTPTS,split=2[srcmain][srcbg]')
  chains.push('[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.04:saturation=0.72[bg]')
  chains.push(`color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`)
  chains.push('[base][bg]overlay=0:0:format=auto[underlay]')
  const title = titleFilters('underlay', clip.header)
  chains.push(...title.chains)
  chains.push(`[srcmain]scale=${Z.videoW}:${Z.videoH}:force_original_aspect_ratio=decrease,pad=${Z.videoW}:${Z.videoH}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[screenfit]`)
  chains.push(`[${title.label}]drawbox=x=${Z.videoX}:y=${Z.videoY}:w=${Z.videoW}:h=${Z.videoH}:color=black@0.28:t=fill[panel]`)
  chains.push(`[panel][screenfit]overlay=x=${Z.videoX}:y=${Z.videoY}:format=auto[withscreenraw]`)
  chains.push(`[withscreenraw]drawbox=x=${Z.videoX}:y=${Z.videoY}:w=${Z.videoW}:h=${Z.videoH}:color=white@0.62:t=4[withscreen]`)
  chains.push(`[withscreen]subtitles='${filterPath(assPath)}'[captioned]`)
  const ret = addRetention(chains, 'captioned', duration)
  chains.push(`[${ret}]format=yuv420p[vout]`)
  chains.push('[0:a]asetpts=PTS-STARTPTS[aout]')
  return chains.join(';')
}
function collectWords(transcript) {
  const words = []
  for (const segment of transcript.segments || []) {
    if (Array.isArray(segment.words)) for (const w of segment.words) {
      const text = cleanCaptionText(w.word || w.text || '')
      if (text && Number.isFinite(Number(w.start)) && Number.isFinite(Number(w.end)) && Number(w.end) > Number(w.start)) words.push({ start: Number(w.start), end: Number(w.end), text })
    }
  }
  return words.sort((a, b) => a.start - b.start)
}
function buildLongEvents(words, beats) {
  let offset = 0
  const raw = []
  for (const beat of beats) {
    const selected = words.filter((w) => w.end > beat.start && w.start < beat.end).map((w) => ({ start: Math.max(w.start, beat.start) - beat.start + offset, end: Math.min(w.end, beat.end) - beat.start + offset, text: w.text }))
    let phrase = []
    const flush = () => {
      if (!phrase.length) return
      raw.push({ start: phrase[0].start, end: phrase.at(-1).end, text: phrase.map((w) => w.text).join(' ').toUpperCase() })
      phrase = []
    }
    for (const word of selected) {
      const prev = phrase.at(-1)
      const candidate = [...phrase, word].map((w) => w.text).join(' ')
      if (phrase.length && ((prev && word.start - prev.end > 0.75) || phrase.length >= 6 || cleanCaptionText(candidate).length > 42)) flush()
      phrase.push(word)
      if (/[.!?]$/.test(word.text) || phrase.length >= 6 || cleanCaptionText(phrase.map((w) => w.text).join(' ')).length >= 42) flush()
    }
    flush()
    offset += beat.end - beat.start
  }
  return normalizeTiming(raw, { minDuration: 0.55, maxDuration: 2.8, gap: 0.035, videoDuration: offset })
}
function coverage(events, duration) {
  let maxGap = events[0]?.start ?? duration, previousEnd = 0
  for (const event of events) { maxGap = Math.max(maxGap, event.start - previousEnd); previousEnd = Math.max(previousEnd, event.end) }
  return { maxGap: Number(maxGap.toFixed(3)), finalGap: Number(Math.max(0, duration - previousEnd).toFixed(3)), lastEnd: events.at(-1)?.end ?? null }
}

await mkdir(path.join(root, renderDir), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportRoot), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
await mkdir(path.join(root, 'media/transcripts'), { recursive: true })
await mkdir(path.join(root, 'media/thumbnails/day4-package-20260515T1310Z'), { recursive: true })

if (!existsSync(path.join(root, source))) throw new Error(`missing source ${source}`)
const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const rendered = []
for (const clip of clips) {
  const duration = clip.end - clip.start
  const events = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: clip.start, sourceEnd: clip.end, minDuration: 0.14, maxDuration: 0.62, gap: 0.015 })
    .map((event) => ({ ...event, text: cleanWord(event.text) }))
    .filter((event) => event.text && event.text !== 'AI')
  const qa = qaCaptionEvents(events, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.09, maxDuration: 0.75 })
  const cov = captionCoverage(events, { videoDuration: duration, maxGap: 10 })
  if (!qa.ok || !cov.ok) throw new Error(`caption QA failed for ${clip.id}: ${JSON.stringify({ qa, cov })}`)
  const assPath = `media/transcripts/${clip.id}-${packageStamp}.ass`
  await writeFile(path.join(root, assPath), assWithStyle(events, { mode: 'short', short: true }))
  await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify({ ...qa, coverage: cov, clip }, null, 2) + '\n')
  const out = `${renderDir}/${clip.id}-confirmed-template-01.mp4`
  const ready = `${readyDir}/${clip.id}-confirmed-template-01.mp4`
  const thumb = `media/thumbnails/day4-package-20260515T1310Z/${clip.id}-seed-thumbnail.jpg`
  const contact = `${reviewDir}/${clip.id}-contact-sheet.jpg`
  const filter = buildShortFilter({ clip, assPath })
  if (!existsSync(path.join(root, out))) {
    run('ffmpeg', ['-y', '-v', 'error', '-ss', ts(clip.start), '-t', String(duration), '-i', source, '-filter_complex', filter, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
  }
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  if (!existsSync(path.join(root, thumb))) run('ffmpeg', ['-y', '-v', 'error', '-ss', '0.10', '-i', out, '-frames:v', '1', '-q:v', '2', thumb])
  if (!existsSync(path.join(root, contact))) run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/8,scale=320:-1,tile=8x1', '-frames:v', '1', '-q:v', '3', contact])
  await copyFile(path.join(root, out), path.join(root, ready))
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out]).stdout)
  rendered.push({ ...clip, duration, out, ready, thumb, contact, assPath, qa, coverage: cov, probe })
}

// Long-form montage with exact beat captions.
const work = `${renderDir}/.tmp-long-day4-product-machine`
await mkdir(path.join(root, work), { recursive: true })
const concat = []
let i = 1
for (const beat of longBeats) {
  const seg = `${work}/${String(i++).padStart(2, '0')}-${beat.role}.mp4`
  if (!existsSync(path.join(root, seg))) run('ffmpeg', ['-y', '-v', 'error', '-ss', ts(beat.start), '-to', ts(beat.end), '-i', source, '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1', '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5,aresample=48000', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', seg])
  concat.push(seg)
}
const concatPath = `${work}/concat.txt`
await writeFile(path.join(root, concatPath), concat.map((p) => `file '${path.resolve(root, p).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
const longBase = `${work}/base.mp4`
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy', longBase])
const longDuration = longBeats.reduce((sum, beat) => sum + beat.end - beat.start, 0)
const longEvents = buildLongEvents(collectWords(transcript), longBeats)
const longQa = qaCaptionEvents(longEvents, { mode: 'long', maxWords: 7, maxChars: 52, minDuration: 0.55, maxDuration: 3.0 })
const longCov = coverage(longEvents, longDuration)
if (!longQa.ok || longCov.maxGap > 60 || longCov.finalGap > 4) throw new Error(`long caption QA failed ${JSON.stringify({ longQa, longCov })}`)
const longAss = `${renderDir}/day4-product-machine-longform.ass`
await writeFile(path.join(root, longAss), buildAss(longEvents, { mode: 'long', font: 'DejaVu Sans' }))
await writeFile(path.join(root, `${renderDir}/day4-product-machine-longform.qa.json`), JSON.stringify({ ...longQa, coverage: longCov, beats: longBeats, captions: longEvents.length }, null, 2) + '\n')
const longOut = `${renderDir}/day4-product-machine-longform.mp4`
const longReady = `${readyDir}/long-day4-product-machine-subtitles-20260515.mp4`
const longContact = `${reviewDir}/long-day4-product-machine-contact-sheet.jpg`
const longThumb = `media/thumbnails/day4-package-20260515T1310Z/long-day4-product-machine-thumbnail.jpg`
const vfLong = `[0:v]subtitles='${filterPath(longAss)}'[subbed];[1:v]scale=118:-1,format=rgba[logo];[subbed][logo]overlay=x=w-overlay_w-62:y=54:format=auto[vout]`
run('ffmpeg', ['-y', '-v', 'error', '-i', longBase, '-loop', '1', '-i', logoPath, '-filter_complex', vfLong, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', longOut])
run('ffmpeg', ['-v', 'error', '-i', longOut, '-f', 'null', '-'])
run('ffmpeg', ['-y', '-v', 'error', '-i', longOut, '-vf', 'fps=1/75,scale=480:-1,tile=4x2', '-frames:v', '1', '-q:v', '3', longContact])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '00:06:20', '-i', longOut, '-frames:v', '1', '-q:v', '2', longThumb])
await copyFile(path.join(root, longOut), path.join(root, longReady))
const longProbe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', longOut]).stdout)

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const now = new Date().toISOString()
data.transcripts = data.transcripts || []
const transcriptRecord = {
  id: videoId,
  title: 'Day 4 - Vibe Coding A $1 BILLION COMPANY - LIVE!!',
  sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
  path: transcriptPath,
  textPath: `media/transcripts/${videoId}.txt`,
  subtitlePath: `media/transcripts/${videoId}.srt`,
  createdAt: now,
}
const existingTranscript = data.transcripts.findIndex((item) => item.id === videoId || item.sourceUrl?.includes(videoId))
if (existingTranscript >= 0) data.transcripts[existingTranscript] = { ...data.transcripts[existingTranscript], ...transcriptRecord, updatedAt: now }
else data.transcripts.unshift(transcriptRecord)

data.clips = data.clips || []
for (const item of rendered) {
  const record = {
    id: `clip_${item.id}_${packageStamp}`,
    transcriptId: videoId,
    platform: 'tiktok',
    status: 'draft',
    score: item.id.includes('one-billion') ? 98 : item.id.includes('stream-once') ? 97 : item.id.includes('algorithm') ? 95 : 93,
    start: ts(item.start), end: ts(item.end),
    title: item.title, hook: item.hook, caption: item.caption,
    hashtags: ['#VibeZone', '#BuildInPublic', '#AI', '#StreamerTools', '#CreatorTools'],
    reason: 'Day 4 upload-drive production pass using Confirmed Template #1 with clean seed, fixed zones, word-level one-word captions, and retention border/shine after seed.',
    createdAt: now, updatedAt: now,
    renderPath: item.ready, renderUrl: `/${item.ready}`,
    renderPreset: 'confirmed-template-01+clean-seed+retention-border-shine+word-captions', renderStatus: 'done',
    proofFramePath: item.contact, proofFrames: [item.thumb, item.contact], thumbnailProofPath: item.thumb,
    exportBundlePath: exportRoot,
    seo: { youtubeTitle: item.seoTitle, tiktokDescription: item.caption, hashtags: ['#VibeZone', '#BuildInPublic', '#AI', '#StreamerTools'], thumbnailText: item.thumbnailText },
    qa: { captionQaPath: item.assPath.replace(/\.ass$/, '.qa.json'), coverage: item.coverage, duration: item.duration, contactSheet: item.contact },
  }
  const idx = data.clips.findIndex((clip) => clip.id === record.id)
  if (idx >= 0) data.clips[idx] = record
  else data.clips.unshift(record)
}

data.thumbnailConcepts = data.thumbnailConcepts || []
const longConcepts = [
  { id: `thumb_long-day4-product-machine_01_${packageStamp}`, title: 'STREAM ONCE FOREVER', thumbnailText: 'STREAM ONCE FOREVER', visualAngle: 'Face-led creator-machine promise: one live stream becomes an always-on content engine.' },
  { id: `thumb_long-day4-product-machine_02_${packageStamp}`, title: 'ZERO RISK CREATOR', thumbnailText: 'ZERO RISK CREATOR', visualAngle: 'Bold SaaS/business-model hook: creator pays almost nothing until results arrive.' },
  { id: `thumb_long-day4-product-machine_03_${packageStamp}`, title: '$1B LIVE', thumbnailText: '$1B LIVE', visualAngle: 'Outrageous build-in-public ambition with neon agent/dashboard energy.' },
]
for (const concept of longConcepts) {
  data.thumbnailConcepts.unshift({
    ...concept,
    sourceClipId: 'long-day4-product-machine', sourceTranscriptId: videoId,
    sourceTitle: 'Day 4 Product Machine', sourceVideoPath: longReady, sourceProofPath: longContact,
    status: 'ready', rating: null,
    emotion: 'confident disbelief',
    style: 'GothamChess-inspired: huge expressive creator face, dark high-contrast background, neon accent, one bold readable headline, single full-frame composition.',
    prompt: `Polished GothamChess-style YouTube thumbnail. Text: ${concept.thumbnailText}. ${concept.visualAngle} Single 16:9 full-frame composition, huge expressive creator face, high contrast, no split/collage, no tiny UI.`,
    imageUrl: longThumb,
    createdAt: now, updatedAt: now,
  })
}

data.mediaJobs = data.mediaJobs || []
data.mediaJobs.unshift({
  id: `media_job_day4_package_${packageStamp}`,
  type: 'upload-drive-production', title: 'Day 4 upload-drive package', status: 'done',
  detail: `Rendered ${rendered.length} Confirmed Template #1 shorts, one long-form montage, seed thumbnails, contact sheets, caption QA, and ready-to-ship copies.`,
  command: 'node scripts/render-day4-package-20260515T1310Z.mjs', createdAt: now,
  reportPath: `${reviewDir}/report.json`,
})
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

const report = { ok: true, source, transcriptPath, clips: rendered, longForm: { out: longOut, ready: longReady, contact: longContact, thumb: longThumb, qa: { ...longQa, coverage: longCov }, probe: longProbe, beats: longBeats }, dataUpdated: dataPath }
await writeFile(path.join(root, `${reviewDir}/report.json`), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, shortCount: rendered.length, longReady, reportPath: `${reviewDir}/report.json`, shorts: rendered.map((item) => ({ id: item.id, ready: item.ready, duration: item.duration, maxSilentGap: item.coverage.maxSilentGap })), longDuration: longProbe.format?.duration }, null, 2))
