#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, normalizeTiming } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T0910Z'
const id = `stream2-start-posting-clips-template-${stamp}`
const source = 'media/downloads/stream-2.mp4'
const logoPath = 'media/assets/logos/openclaw-logo-text.png'
const transcriptPath = 'media/transcripts/stream-2.json'
const wordTimingPath = `media/transcripts/${id}.words.json`
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const reviewDir = 'media/reviews'
const exportDir = `media/exports/clip_${id}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const startSec = 132
const endSec = 175
const duration = endSec - startSec

const headerText = 'CLIPS FIND VIEWERS'
const headerColor = 'white'
const captionAssColor = '&H00FFFFFF' // house-style clean white captions (ASS is AABBGGRR)
const headerZoneTop = 80
const headerZoneBottom = 500
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const logoZoneTop = 1208
const logoZoneH = 148
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
let wordTimedEvents = []
try {
  const wordTiming = JSON.parse(await readFile(path.join(root, wordTimingPath), 'utf8'))
  wordTimedEvents = normalizeTiming((wordTiming.words || []).map((word) => ({ start: word.start, end: word.end, text: cleanCaptionWord(word.text) })).filter((word) => word.text), { minDuration: 0.14, maxDuration: 0.75, gap: 0.015, videoDuration: duration })
} catch {
  wordTimedEvents = []
}
const events = wordTimedEvents.length ? wordTimedEvents : fallbackEvents.map((event) => ({ ...event, text: cleanCaptionWord(event.text) })).filter((event) => event.text)
const captionEvents = events.filter((event) => event.text !== 'AI')
const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
if (!qa.ok) throw new Error(`Caption QA failed: ${qa.failures.join('; ')}`)
let ass = buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' })
ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', `Style: VibeShortWord,DejaVu Sans,104,${captionAssColor},${captionAssColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,${captionMarginV},1`)
await writeFile(path.join(root, assPath), ass)
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(qa, null, 2) + '\n')

const vf = [
  `[0:v]trim=start=0:end=${duration},setpts=PTS-STARTPTS,split=2[srcmain][srcbg]`,
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.08:saturation=0.72[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto[underlay]',
  `[underlay]drawtext=fontfile='${fontBold}':text='${esc(headerText)}':x=(w-text_w)/2:y=${headerZoneTop}+(${headerZoneBottom}-${headerZoneTop}-text_h)/2:fontcolor=${headerColor}:fontsize=82:borderw=5:bordercolor=black@0.70[headline]`,
  `[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
  `[headline]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=black@0.42:t=fill[panel]`,
  `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
  `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[withscreen]`,
  `[1:v]scale=430:-1,format=rgba[brandlogo]`,
  `[withscreen][brandlogo]overlay=x=(W-w)/2:y=${logoZoneTop}:format=auto[withlogo]`,
  `[withlogo]drawtext=fontfile='${fontBold}':text='${esc('VIBE ZONE')}':x=(w-text_w)/2:y=${logoZoneTop + 92}:fontcolor=white:fontsize=54:borderw=5:bordercolor=black@0.76[logozone]`,
  `[logozone]subtitles='${filterPath(assPath)}'[vout]`,
  `[0:a]atrim=start=0:end=${duration},asetpts=PTS-STARTPTS[aout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-ss', String(startSec), '-i', source, '-loop', '1', '-i', logoPath, '-t', String(duration), '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', `${reviewDir}/${id}-contact-sheet.jpg`])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '21', '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', `${exportDir}/thumbnail.jpg`])
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(qa, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, exportDir, 'contact-sheet.jpg'))
await copyFile(path.join(root, out), path.join(root, readyDir, 'short-clips-find-viewers-template.mp4'))
await copyFile(path.join(root, `${reviewDir}/${id}-contact-sheet.jpg`), path.join(root, readyDir, 'short-clips-find-viewers-template-contact-sheet.jpg'))
await copyFile(path.join(root, `${exportDir}/thumbnail.jpg`), path.join(root, readyDir, 'short-clips-find-viewers-template-thumbnail.jpg'))

const youtubeCopy = `# YouTube Shorts Upload Draft\n\nTitle: Clips Find Viewers\n\nDescription:\nBuilding the content loop live: stream, clip, post, and let new viewers find the project while the product keeps moving.\n\nManual upload only after owner privacy/watch pass.\n\nHashtags: #VibeCoding #BuildInPublic #YouTubeShorts #CreatorTools #AIWorkflow\n\nPinned comment idea: What platform would you post the first clip on — YouTube, TikTok, or X?\n`
const tiktokCopy = `# TikTok Upload Draft\n\nCaption: Stream the build. Cut the clips. Let viewers find the project while the machine keeps moving. #buildinpublic #vibecoding #creatorworkflow #aitools\n\nManual upload only after owner privacy/watch pass.\n`
const uploadCard = `# Upload Card — Clips Find Viewers\n\n- Render: ${out}\n- Ready copy: ${readyDir}/short-clips-find-viewers-template.mp4\n- Source: Stream 2, ${startSec}s–${endSec}s\n- Template: House-style short template 2026-05-14; blurred clip background, centered landscape source, visible OpenClaw logo + VIBE ZONE branding, and one-word clean white captions. The screen/context remains the hero; no blue-card-only or square-face default.\n- Hook: CLIPS FIND VIEWERS\n- Thumbnail: ${exportDir}/thumbnail.jpg\n- Contact sheet: ${reviewDir}/${id}-contact-sheet.jpg\n- Caption QA: ${captionEvents.length} one-word events, pass.\n- Privacy: sampled frames should still get final owner watch pass because screen content is visible; no external posting performed.\n`
await writeFile(path.join(root, exportDir, 'youtube-upload.md'), youtubeCopy)
await writeFile(path.join(root, exportDir, 'tiktok-upload.md'), tiktokCopy)
await writeFile(path.join(root, exportDir, 'upload-card.md'), uploadCard)
console.log(JSON.stringify({ id, out, readyCopy: `${readyDir}/short-clips-find-viewers-template.mp4`, contactSheet: `${reviewDir}/${id}-contact-sheet.jpg`, captionQa: qa, ffprobe: JSON.parse(probe.stdout), zones: { headerZoneTop, headerZoneBottom, videoX, videoY, videoW, videoH, logoZoneTop, logoZoneH, captionMarginV } }, null, 2))
