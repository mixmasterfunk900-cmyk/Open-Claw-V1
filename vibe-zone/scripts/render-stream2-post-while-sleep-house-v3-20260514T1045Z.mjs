#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, mergeTimedCaptionEvents } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T1045Z'
const id = `stream-2-post-while-i-sleep-house-v3-${stamp}`
const source = 'media/downloads/stream-2.mp4'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const transcriptPath = 'media/transcripts/stream-2.json'
const wordTimingPath = 'media/transcripts/socials-to-vps-template-20260514T0910Z.words.json'
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const exportDir = `media/exports/clip_${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const startSec = 166
const endSec = 197
const duration = endSec - startSec

const headerText = 'POST WHILE I SLEEP'
const captionAssColor = '&H00FFFFFF'
const headerZoneTop = 80
const headerZoneBottom = 500
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const logoZoneTop = 1208
const captionMarginV = 440

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\\\''") }
function cleanCaptionWord(value) {
  return String(value || '').replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase()
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const fallbackEvents = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
  .map((event) => ({ ...event, text: cleanCaptionWord(event.text) }))
  .filter((event) => event.text)
let wordTimedEvents = []
try {
  const wordTiming = JSON.parse(await readFile(path.join(root, wordTimingPath), 'utf8'))
  wordTimedEvents = (wordTiming.words || []).map((word) => ({ start: word.start, end: word.end, text: cleanCaptionWord(word.text) })).filter((word) => word.text)
} catch {
  wordTimedEvents = []
}
const captionPlan = mergeTimedCaptionEvents(wordTimedEvents, fallbackEvents, { videoDuration: duration, maxGap: 4 })
const captionEvents = captionPlan.events.filter((event) => event.text && event.text !== 'AI')
const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
if (!captionPlan.coverage.ok) throw new Error(`Caption coverage failed: ${JSON.stringify(captionPlan.coverage)}`)
let ass = buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' })
ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', `Style: VibeShortWord,DejaVu Sans,104,${captionAssColor},${captionAssColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,${captionMarginV},1`)
await writeFile(path.join(root, assPath), ass)
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify({ ...qa, timingSource: captionPlan.source, coverage: captionPlan.coverage, primaryCoverage: captionPlan.primaryCoverage }, null, 2) + '\n')

const vf = [
  `[0:v]trim=start=${startSec}:end=${endSec},setpts=PTS-STARTPTS,split=2[srcmain][srcbg]`,
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.08:saturation=0.72[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto[underlay]',
  `[underlay]drawtext=fontfile='${fontBold}':text='${esc(headerText)}':x=(w-text_w)/2:y=${headerZoneTop}+(${headerZoneBottom}-${headerZoneTop}-text_h)/2:fontcolor=white:fontsize=82:borderw=5:bordercolor=black@0.70[headline]`,
  `[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
  `[headline]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=black@0.42:t=fill[panel]`,
  `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
  `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[withscreen]`,
  `[1:v]scale=430:-1,format=rgba[brandlogo]`,
  `[withscreen][brandlogo]overlay=x=(W-w)/2:y=${logoZoneTop}:format=auto[withlogo]`,
  `[withlogo]drawtext=fontfile='${fontBold}':text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=${logoZoneTop + 92}:fontcolor=white:fontsize=54:borderw=5:bordercolor=black@0.76[logozone]`,
  `[logozone]subtitles='${filterPath(assPath)}'[vout]`,
  `[0:a]atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS[aout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '9', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${exportDir}/thumbnail.jpg`])
for (const [i, t] of [4, 15, 27].entries()) {
  run('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${exportDir}/proof-frame-${String(i + 1).padStart(2, '0')}.jpg`])
}
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify({ ...qa, timingSource: captionPlan.source, coverage: captionPlan.coverage, primaryCoverage: captionPlan.primaryCoverage }, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-post-while-i-sleep-house-v3.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-post-while-i-sleep-house-v3-contact-sheet.jpg'))
await copyFile(path.join(root, `${exportDir}/thumbnail.jpg`), path.join(root, readyDir, 'short-post-while-i-sleep-house-v3-thumbnail.jpg'))

const youtubeCopy = `# YouTube Shorts Upload Draft\n\nTitle: Post While I Sleep | Build In Public Content Machine\n\nDescription:\nThe build-in-public loop: set up the socials, get the VPS running, and let clips keep finding viewers while the project moves offline.\n\nManual upload only after owner privacy/watch pass.\n\nHashtags: #BuildInPublic #VibeCoding #CreatorWorkflow #AIWorkflow #YouTubeShorts\n\nPinned comment idea: Would you rather automate clip posting first or the product build first?\n`
const tiktokCopy = `# TikTok Upload Draft\n\nCaption: Build on stream, post while you sleep, let the project keep moving. Manual upload only after owner privacy/watch pass. #buildinpublic #vibecoding #creatorworkflow #aitools\n`
const uploadCard = `# Upload Card — Post While I Sleep\n\n- Render: ${out}\n- Ready copy: ${readyDir}/short-post-while-i-sleep-house-v3.mp4\n- Source: Stream 2, ${startSec}s–${endSec}s\n- Template: Restored house-style v3; centered/cropped source screen, blurred source underlay, OpenClaw logo + VIBE ZONE branding, clean white hook/captions, no blue card, no square-face default.\n- Hook: ${headerText}\n- Thumbnail: ${exportDir}/thumbnail.jpg\n- Contact sheet: ${reviewDir}/${id}-contact-sheet.jpg\n- Proof frames: ${exportDir}/proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n- Caption QA: ${captionEvents.length} one-word events, pass; timing source ${captionPlan.source}.\n- SEO: creator content workflow / build in public content machine.\n- Privacy: final owner watch pass required because source screen/chat text is visible; no external posting performed.\n`
await writeFile(path.join(root, exportDir, 'youtube-upload.md'), youtubeCopy)
await writeFile(path.join(root, exportDir, 'tiktok-upload.md'), tiktokCopy)
await writeFile(path.join(root, exportDir, 'upload-card.md'), uploadCard)
console.log(JSON.stringify({ id, out, readyCopy: `${readyDir}/short-post-while-i-sleep-house-v3.mp4`, exportDir, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, captionQa: { ...qa, timingSource: captionPlan.source, coverage: captionPlan.coverage, primaryCoverage: captionPlan.primaryCoverage }, ffprobe: JSON.parse(probe.stdout), zones: { headerZoneTop, headerZoneBottom, videoX, videoY, videoW, videoH, logoZoneTop, captionMarginV } }, null, 2))
