#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, captionCoverage } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T1820Z'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const reviewDir = 'media/reviews'
const renderDir = 'media/renders'
const readyDir = `media/exports/READY_TO_SHIP_NOW/stream2-fulltime-247-build-house-v4-${stamp}`
const exportDir = `media/exports/stream2-fulltime-247-build-house-v4-${stamp}`

const clip = {
  id: 'clip_stream2_fulltime_247_build',
  title: 'Full-Time Job, 24/7 Build',
  hook: 'BUILD WHILE I WORK',
  start: 185.0,
  end: 215.0,
  score: 96,
  caption: 'The founder thesis in one clip: he can only stream at night, so the OpenClaw/VPS agent stack needs to keep the build moving while he works.',
  hashtags: ['#VibeZone', '#BuildInPublic', '#AI', '#StreamerTools'],
}

const headerZoneTop = 76
const headerZoneBottom = 494
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const captionMarginV = 596
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
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function cleanCaptionWord(value) {
  return String(value || '').replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase()
}
function headerDraw(inputLabel, outputLabel, text) {
  const words = String(text).trim().split(/\s+/)
  const lines = words.length >= 4 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [words.join(' ')]
  const fontSize = lines.length > 1 ? 120 : 112
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
const id = `stream-2-fulltime-247-build-house-v4-${stamp}`
const mainOut = `media/renders/${id}-main.mp4`
const seedFrame = `media/renders/${id}-seed-frame.jpg`
const seedOut = `media/renders/${id}-seed.mp4`
const concatList = `media/renders/${id}-concat.txt`
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
const thumbnail = `${exportDir}/thumbnail.jpg`
const readyPath = `${readyDir}/short-fulltime-247-build-house-v4.mp4`

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
  '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.06:saturation=0.74[bg]',
  `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
  '[base][bg]overlay=0:0:format=auto[underlay]',
  headerDraw('underlay', 'headline', clip.hook),
  `[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
  `[headline]drawbox=x=${videoX - 12}:y=${videoY - 12}:w=${videoW + 24}:h=${videoH + 24}:color=black@0.44:t=fill[panel]`,
  `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
  `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[framed]`,
  // Keep the VIBE ZONE brand lane below the one-word caption lane so clean
  // white captions never cover the logo/branding in proof frames.
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
  youtubeTitle: 'Building a 24/7 AI Agent While Working Full-Time',
  youtubeDescription: `I can only stream in the evenings, so the build has to keep moving while I work. This clip is the core Vibe Zone thesis: livestream the build, use OpenClaw agents/VPS locally and safely, and turn the work into clips without exposing secrets.\n\nNo external posting from this bundle; prepared for manual review/upload only.`,
  tiktokDescription: 'I can only build at night, so the AI agent stack has to keep going while I work. #VibeZone #BuildInPublic #AI #StreamerTools',
  hashtags: clip.hashtags,
  suggestedPinnedComment: 'Should the agent build while the founder is offline, or is that too risky?',
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
    'Fresh Stream 2 local-only render using the current centered-screen house layout.',
    '0.5s thumbnail seed frame prepended for Shorts thumbnail-selection tests.',
    'Caption layer stays clean white below the screen panel and above the VIBE ZONE brand zone; no external posting/API work performed.',
    'Source section is stream-safe: discusses setup goals and full-time-work constraint, with no secrets shown by this local render step.',
  ],
}
await writeFile(path.join(root, exportDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'seo.json'), JSON.stringify(seo, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'review-notes.md'), `# ${clip.title}\n\n- Render: ${out}\n- Ready copy: ${readyPath}\n- Proof sheet: ${contactSheet}\n- Thumbnail/seed frame: ${thumbnail}\n- Verification: ffprobe + full decode pass completed in script.\n- Review: centered screen, clean white caption zone, VIBE ZONE branding, no external posting.\n\n## SEO\n\nYouTube title: ${seo.youtubeTitle}\n\nTikTok: ${seo.tiktokDescription}\n`)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), JSON.stringify(ffprobe, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, readyPath))
await copyFile(path.join(root, contactSheet), path.join(root, `${readyDir}/contact-sheet.jpg`))
await copyFile(path.join(root, thumbnail), path.join(root, `${readyDir}/thumbnail.jpg`))
await copyFile(path.join(root, exportDir, 'manifest.json'), path.join(root, `${readyDir}/manifest.json`))
await copyFile(path.join(root, exportDir, 'seo.json'), path.join(root, `${readyDir}/seo.json`))
await copyFile(path.join(root, exportDir, 'review-notes.md'), path.join(root, `${readyDir}/README.md`))

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const clipRecord = {
  platform: 'tiktok',
  status: 'exported',
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
  reason: 'Fresh Stream 2 overnight production clip: founder can only stream evenings, so local agents need to keep the project moving while he works.',
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
