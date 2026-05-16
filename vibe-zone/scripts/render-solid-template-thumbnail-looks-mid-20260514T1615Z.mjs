#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, mergeTimedCaptionEvents, captionCoverage } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const id = 'thumbnail-looks-mid-solid-template-20260514T1615Z'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const wordTimingPath = 'media/transcripts/thumbnail-looks-mid-template-20260514T0852Z.words.json'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const review = `media/reviews/${id}-contact-sheet.jpg`
const exportDir = `media/exports/clip_${id}`
const ready = `media/exports/READY_TO_SHIP_NOW/${id}.mp4`
const thumb = `media/exports/READY_TO_SHIP_NOW/${id}-thumbnail.jpg`
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const startSec = 320
const endSec = 338
const duration = endSec - startSec

const headerZoneTop = 80
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const frameX = 32
const frameY = 582
const frameW = 1016
const frameH = 614
const captionMarginV = 500 // slightly lower than recent approved strict-template tests, still above controls

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\''") }
function cleanCaptionWord(value) { return String(value || '').replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase() }

await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/transcripts'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, 'media/exports/READY_TO_SHIP_NOW'), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const fallbackEvents = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
  .map((event) => ({ ...event, text: cleanCaptionWord(event.text) }))
  .filter((event) => event.text && event.text !== 'AI')
let wordTimedEvents = []
try {
  const wordTiming = JSON.parse(await readFile(path.join(root, wordTimingPath), 'utf8'))
  wordTimedEvents = (wordTiming.words || []).map((word) => ({ start: word.start, end: word.end, text: cleanCaptionWord(word.text) })).filter((word) => word.text && word.text !== 'AI')
} catch {}
const captionPlan = mergeTimedCaptionEvents(wordTimedEvents, fallbackEvents, { videoDuration: duration, maxGap: 4 })
const captionEvents = captionPlan.events.filter((event) => event.text && event.text !== 'AI' && event.end - event.start >= 0.12)
const coverage = captionCoverage(captionEvents, { videoDuration: duration, maxGap: 4 })
const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
if (!coverage.ok) throw new Error(`Caption coverage failed: ${JSON.stringify(coverage)}`)
let ass = buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' })
ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', `Style: VibeShortWord,DejaVu Sans,104,&H0000FF66,&H0000FF66,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,${captionMarginV},1`)
await writeFile(path.join(root, assPath), ass)
const captionQa = { ...qa, timingSource: captionPlan.source, coverage, primaryCoverage: captionPlan.primaryCoverage || null }
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(captionQa, null, 2) + '\n')

const q = (n) => Number(n.toFixed(2))
const chains = []
chains.push(`[0:v]trim=start=${startSec}:end=${endSec},setpts=PTS-STARTPTS,split=2[srcmain][srcbg]`)
chains.push('[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.08:saturation=0.72[bg]')
chains.push(`color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`)
chains.push('[base][bg]overlay=0:0:format=auto[underlay]')
// Solid template: contrast-aware yellow title because the blurred top zone can be light/white.
chains.push(`[underlay]drawtext=fontfile='${fontBold}':text='${esc('THUMBNAIL')}':x=(w-text_w)/2:y=${headerZoneTop}+34:fontcolor=0xFFD400:fontsize=130:borderw=7:bordercolor=black@0.82[head1]`)
chains.push(`[head1]drawtext=fontfile='${fontBold}':text='${esc('LOOKS MID')}':x=(w-text_w)/2:y=${headerZoneTop}+166:fontcolor=0xFFD400:fontsize=132:borderw=7:bordercolor=black@0.82[headline]`)
chains.push(`[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`)
chains.push(`[headline]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=black@0.42:t=fill[panel]`)
chains.push(`[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`)
chains.push(`[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[withscreen]`)
chains.push(`[withscreen]subtitles='${filterPath(assPath)}'[captioned]`)
chains.push(`[captioned]drawbox=x=${frameX}:y=${frameY}:w=${frameW}:h=${frameH}:color=0x66ff00@0.70:t=5,drawbox=x=${frameX + 7}:y=${frameY + 7}:w=${frameW - 14}:h=${frameH - 14}:color=white@0.20:t=2[base0]`)
let current = 'base0'
let idx = 0
function overlayMoving({ label, sw, sh, color, xExpr, yExpr, start, end }) {
  const colorLabel = `${label}c${idx}`
  const next = `${label}o${idx}`
  chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${colorLabel}]`)
  chains.push(`[${current}][${colorLabel}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
  current = next
  idx += 1
}
for (const start of [0.6, 5.7, 11.8, 15.6]) {
  const a = start, b = start + 0.62, c = start + 1.24, d = start + 1.86, e = start + 2.48
  overlayMoving({ label: 'topGlow', sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${frameX}-180+((t-${a})/${b - a})*${frameW + 360}`, yExpr: `${frameY - 11}`, start: a, end: b })
  overlayMoving({ label: 'topHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX}-60+((t-${a})/${b - a})*${frameW + 120}`, yExpr: `${frameY - 6}`, start: a, end: b })
  overlayMoving({ label: 'rightGlow', sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${frameX + frameW - 13}`, yExpr: `${frameY}-180+((t-${b})/${c - b})*${frameH + 360}`, start: b, end: c })
  overlayMoving({ label: 'rightHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX + frameW - 8}`, yExpr: `${frameY}-60+((t-${b})/${c - b})*${frameH + 120}`, start: b, end: c })
  overlayMoving({ label: 'bottomGlow', sw: 360, sh: 26, color: '0xfff3a0@0.62', xExpr: `${frameX + frameW}-180-((t-${c})/${d - c})*${frameW + 360}`, yExpr: `${frameY + frameH - 13}`, start: c, end: d })
  overlayMoving({ label: 'bottomHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX + frameW}-60-((t-${c})/${d - c})*${frameW + 120}`, yExpr: `${frameY + frameH - 8}`, start: c, end: d })
  overlayMoving({ label: 'leftGlow', sw: 26, sh: 360, color: '0xfff3a0@0.62', xExpr: `${frameX - 13}`, yExpr: `${frameY + frameH}-180-((t-${d})/${e - d})*${frameH + 360}`, start: d, end: e })
  overlayMoving({ label: 'leftHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX - 8}`, yExpr: `${frameY + frameH}-60-((t-${d})/${e - d})*${frameH + 120}`, start: d, end: e })
}
chains.push(`[${current}]format=yuv420p[vout]`)
chains.push(`[0:a]atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS[aout]`)
run('ffmpeg', ['-y', '-v', 'error', '-i', source, '-filter_complex', chains.join(';'), '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', review])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', thumb])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(captionQa, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'notes.md'), `# Solid template example\n\nPreviously accepted clip: Thumbnail Looks Mid.\n\nBurned-in solid-template changes: wrapped/contrast-aware title, slightly lower captions, thin extended green retention border, visible travelling shine overlay.\n`)
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, review), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, ready))
console.log(JSON.stringify({ id, out, ready, review, thumb, exportDir, captionQa, ffprobe: JSON.parse(probe.stdout) }, null, 2))
