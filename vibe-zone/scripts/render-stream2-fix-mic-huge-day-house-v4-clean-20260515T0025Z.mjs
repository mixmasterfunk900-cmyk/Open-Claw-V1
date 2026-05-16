#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, captionCoverage } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260515T0025Z'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const reviewDir = 'media/reviews'
const renderDir = 'media/renders'
const readyDir = `media/exports/READY_TO_SHIP_NOW/stream2-fix-mic-huge-day-house-v4-${stamp}`
const exportDir = `media/exports/stream2-fix-mic-huge-day-house-v4-${stamp}`

const clip = {
  id: 'clip_stream2_fix_mic_huge_day_house_v4_clean_20260515T0025Z',
  title: 'Fix The Mic, Then Build',
  hook: 'FIX MIC THEN BUILD',
  start: 670.0,
  end: 696.0,
  score: 88,
  caption: 'A stream-safe founder moment: before the big AI build sprint can start, the mic has to work. Messy setup, clear momentum.',
  hashtags: ['#VibeZone', '#BuildInPublic', '#StreamerTools', '#AI'],
}

const headerZoneTop = 76
const headerZoneBottom = 494
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const brandY = 1460
const brandH = 142
const seedDuration = 0.5

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\''") }
function cleanCaptionWord(value) {
  const word = String(value || '').replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase()
  if (word === 'SHIT') return 'SETUP'
  return word
}
function headerDraw(inputLabel, outputLabel, text) {
  const words = String(text).trim().split(/\s+/)
  const lines = words.length >= 4 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [words.join(' ')]
  const fontSize = lines.length > 1 ? 118 : 112
  return `[${inputLabel}]drawtext=fontfile='${fontBold}':text='${esc(lines.join('\n'))}':x=(w-text_w)/2:y=${headerZoneTop}+(${headerZoneBottom}-${headerZoneTop}-text_h)/2:fontcolor=white:fontsize=${fontSize}:line_spacing=-10:borderw=7:bordercolor=black@0.82[${outputLabel}]`
}
function relTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, renderDir), { recursive: true })
await mkdir(path.join(root, exportDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
if (!existsSync(path.join(root, source))) throw new Error(`missing source video ${source}`)

const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const duration = clip.end - clip.start
const id = `stream-2-fix-mic-huge-day-house-v4-${stamp}`
const mainOut = `media/renders/${id}-main.mp4`
const seedFrame = `media/renders/${id}-seed-frame.jpg`
const seedOut = `media/renders/${id}-seed.mp4`
const concatList = `media/renders/${id}-concat.txt`
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
const thumbnail = `${exportDir}/thumbnail.jpg`
const readyPath = `${readyDir}/short-fix-mic-then-build-house-v4.mp4`

let captionEvents = buildShortWordEvents({
  segments: transcript.segments || [],
  sourceStart: clip.start,
  sourceEnd: clip.end,
  minDuration: 0.16,
  maxDuration: 0.68,
  gap: 0.012,
}).map((event) => ({ ...event, text: cleanCaptionWord(event.text) })).filter((event) => event.text && event.text !== 'AI')
captionEvents = captionEvents.filter((event) => event.start >= 0 && event.end <= duration + 0.05 && event.end - event.start >= 0.12)
const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.12, maxDuration: 0.75 })
const coverage = captionCoverage(captionEvents, { videoDuration: duration, maxGap: 5.0 })
if (!qa.ok) throw new Error(`caption QA failed: ${qa.failures.join('; ')}`)
if (!coverage.ok) throw new Error(`caption coverage failed: ${JSON.stringify(coverage)}`)
let ass = buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' })
ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', 'Style: VibeShortWord,DejaVu Sans,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,596,1')
await writeFile(path.join(root, assPath), ass)
await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify({ ...qa, coverage, timingSource: 'whisper-segment-even-word-split' }, null, 2) + '\n')

const vf = [
  `[0:v]trim=start=${clip.start}:end=${clip.end},setpts=PTS-STARTPTS,split=2[srcmain][srcbg]`,
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.055:saturation=0.78[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto[underlay]',
  headerDraw('underlay', 'headline', clip.hook),
  `[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
  `[headline]drawbox=x=${videoX - 12}:y=${videoY - 12}:w=${videoW + 24}:h=${videoH + 24}:color=black@0.44:t=fill[panel]`,
  `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
  `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[framed]`,
  `[framed]drawbox=x=204:y=${brandY}:w=672:h=${brandH}:color=black@0.50:t=fill[brandbox]`,
  `[brandbox]drawtext=font='DejaVu Sans':text='VIBE ZONE':x=(w-text_w)/2:y=${brandY + 18}:fontcolor=0x66ff00:fontsize=78:borderw=3:bordercolor=black@0.88[brand1]`,
  `[brand1]drawtext=font='DejaVu Sans':text='LOCAL CLIP FACTORY':x=(w-text_w)/2:y=${brandY + 96}:fontcolor=white:fontsize=30:borderw=2:bordercolor=black@0.88[brand2]`,
  `[brand2]subtitles='${filterPath(assPath)}'[vout]`,
  `[0:a]atrim=start=${clip.start}:end=${clip.end},asetpts=PTS-STARTPTS[aout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-i', source, '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', mainOut])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '7', '-i', mainOut, '-frames:v', '1', '-q:v', '2', seedFrame])
run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-t', String(seedDuration), '-i', seedFrame, '-f', 'lavfi', '-t', String(seedDuration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-vf', 'scale=1080:1920,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', seedOut])
await writeFile(path.join(root, concatList), `file '${path.resolve(root, seedOut)}'\nfile '${path.resolve(root, mainOut)}'\n`)
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', contactSheet])
await copyFile(path.join(root, seedFrame), path.join(root, thumbnail))
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])

const seo = {
  youtubeTitle: 'Fixing the Mic Before the AI Build Sprint',
  youtubeDescription: `Before the big Vibe Zone AI build sprint, the most founder-coded blocker was simple: fix the mic first. This is a quick build-in-public moment from Stream 2: messy setup, visible momentum, and the local clip factory turning the stream into a post-ready short.\n\nManual upload bundle only. No external posting/API work was performed.`,
  tiktokDescription: 'Before the AI build sprint: fix the mic, then build the machine. #VibeZone #BuildInPublic #StreamerTools #AI',
  hashtags: clip.hashtags,
  suggestedPinnedComment: 'What is always the first thing that breaks before a stream: mic, camera, or screen share?',
  thumbnailText: 'FIX MIC THEN BUILD',
}
const ffprobe = JSON.parse(probe.stdout)
const manifest = {
  createdAt: new Date().toISOString(),
  id: clip.id,
  title: clip.title,
  hook: clip.hook,
  source,
  transcriptPath,
  start: relTime(clip.start),
  end: relTime(clip.end),
  startSec: clip.start,
  endSec: clip.end,
  seedDuration,
  renderPath: out,
  mainRenderPath: mainOut,
  readyPath,
  seedFramePath: seedFrame,
  thumbnailPath: thumbnail,
  proofFramePath: contactSheet,
  captionQaPath: assPath.replace(/\.ass$/, '.qa.json'),
  ffprobe,
  seo,
  reviewNotes: [
    'Fresh Stream 2 local-only render using the centered-screen house v4 layout and VIBE ZONE branding.',
    '0.5s seed frame prepended for manual Shorts thumbnail-selection tests.',
    'White one-word captions stay in the safe zone above the brand lane; screen remains centered and readable.',
    'Clip is stream-safe: profanity sanitized, no secrets, no login/cookies/API posting, and no external service use.',
  ],
}
await writeFile(path.join(root, exportDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'seo.json'), JSON.stringify(seo, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'upload-card.md'), `# ${clip.title}\n\n**Status:** local manual-upload candidate — do not post externally without Masala approval.\n\n## Files\n- Render: ${out}\n- Ready copy: ${readyPath}\n- Thumbnail/seed: ${thumbnail}\n- Proof sheet: ${contactSheet}\n\n## YouTube Shorts\nTitle: ${seo.youtubeTitle}\n\nDescription:\n${seo.youtubeDescription}\n\n## TikTok\n${seo.tiktokDescription}\n\n## Pinned comment\n${seo.suggestedPinnedComment}\n\n## Review notes\n- Centered screen, white captions, VIBE ZONE brand lane.\n- Start/end: ${relTime(clip.start)}–${relTime(clip.end)} from Stream 2.\n- Verified by ffprobe and full decode in the render script.\n`)
await writeFile(path.join(root, exportDir, 'review-notes.md'), `# Review — ${clip.title}\n\n- Render: ${out}\n- Ready copy: ${readyPath}\n- Proof sheet: ${contactSheet}\n- Thumbnail/seed frame: ${thumbnail}\n- Verification: ffprobe + full decode pass completed in script.\n- Quality: centered screen, clean white one-word captions, VIBE ZONE branding, no blue-card/square-face regression.\n- Stream safety: setup/mic/build topic only, profanity sanitized; no secrets or external posting.\n`)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), JSON.stringify(ffprobe, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, readyPath))
await copyFile(path.join(root, contactSheet), path.join(root, `${readyDir}/contact-sheet.jpg`))
await copyFile(path.join(root, thumbnail), path.join(root, `${readyDir}/thumbnail.jpg`))
await copyFile(path.join(root, exportDir, 'manifest.json'), path.join(root, `${readyDir}/manifest.json`))
await copyFile(path.join(root, exportDir, 'seo.json'), path.join(root, `${readyDir}/seo.json`))
await copyFile(path.join(root, exportDir, 'upload-card.md'), path.join(root, `${readyDir}/upload-card.md`))
await copyFile(path.join(root, exportDir, 'review-notes.md'), path.join(root, `${readyDir}/README.md`))

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const clipRecord = {
  platform: 'tiktok',
  status: 'ready_local_manual_upload',
  exportedAt: new Date().toISOString(),
  id: clip.id,
  transcriptId: 'stream-2',
  score: clip.score,
  start: relTime(clip.start),
  end: relTime(clip.end),
  title: clip.title,
  hook: clip.hook,
  caption: clip.caption,
  hashtags: clip.hashtags,
  reason: 'Fresh Stream 2 overnight production clip: relatable setup blocker before the AI/build sprint, rendered with the current house-style layout.',
  createdAt: new Date().toISOString(),
  renderPath: out,
  renderUrl: `/${out}`,
  renderPreset: 'stream2-house-v4-centered-screen-gotham-seed',
  renderStatus: 'done',
  exportBundlePath: exportDir,
  proofFramePath: contactSheet,
  proofFrames: [seedFrame, contactSheet],
  thumbnailProofPath: thumbnail,
  seo,
}
const dispatchRecord = {
  id: `dispatch_${clip.id}`,
  clipId: clip.id,
  title: clip.title,
  status: 'approved_manual_upload',
  platform: 'manual_review_only',
  renderPath: out,
  readyPath,
  exportBundlePath: exportDir,
  thumbnailPath: thumbnail,
  proofFramePath: contactSheet,
  createdAt: new Date().toISOString(),
  note: 'Prepared local-only upload bundle; do not externally post without explicit Masala approval.',
}
data.clips = [clipRecord, ...(data.clips || []).filter((item) => item.id !== clip.id)].slice(0, 12)
data.dispatchItems = [dispatchRecord, ...(data.dispatchItems || []).filter((item) => item.id !== dispatchRecord.id)].slice(0, 12)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

console.log(JSON.stringify({ renderPath: out, readyPath, exportDir, contactSheet, thumbnail, ffprobe }, null, 2))
