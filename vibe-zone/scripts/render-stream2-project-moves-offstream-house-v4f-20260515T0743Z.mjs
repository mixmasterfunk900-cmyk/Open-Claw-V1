#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, captionCoverage } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260515T0743Z'
const source = 'media/downloads/stream-2.mp4'
const transcriptPath = 'media/transcripts/stream-2.json'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'
const reviewDir = 'media/reviews'
const renderDir = 'media/renders'
const readyDir = `media/exports/READY_TO_SHIP_NOW/stream2-project-moves-offstream-house-v4f-${stamp}`
const exportDir = `media/exports/stream2-project-moves-offstream-house-v4f-${stamp}`

const clip = {
  id: 'clip_stream2_project_moves_offstream_house_v4f_20260515T0743Z',
  title: 'Build Moves Offline',
  hook: `BUILD MOVES
OFFLINE`,
  start: 192.0,
  end: 212.0,
  score: 90,
  caption: 'A compact Stream 2 founder moment: Rex explains why the system has to keep progressing after work hours and off-stream, not just during the live window.',
  hashtags: ['#VibeZone', '#BuildInPublic', '#CreatorTools', '#IndieHacker', '#AI'],
}

const headerZoneTop = 76
const headerZoneBottom = 494
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const brandY = 1460
const brandH = 178
const seedDuration = 0.5
const frameX = 32
const frameY = 582
const frameW = 1016
const frameH = 614

function q(n) { return Number(n.toFixed(2)) }
function retentionBorderChains(inputLabel, outputLabel, duration) {
  const chains = [
    `[${inputLabel}]drawbox=x=${frameX}:y=${frameY}:w=${frameW}:h=${frameH}:color=white@0.55:t=4,drawbox=x=${frameX + 8}:y=${frameY + 8}:w=${frameW - 16}:h=${frameH - 16}:color=black@0.35:t=2[retentionBase]`,
  ]
  let current = 'retentionBase'
  let idx = 0
  function overlayMoving({ label, sw, sh, color, xExpr, yExpr, start, end }) {
    const colorLabel = `${label}Color${idx}`
    const next = `${label}Overlay${idx}`
    chains.push(`color=c=${color}:s=${sw}x${sh}:r=30:d=${duration},format=rgba[${colorLabel}]`)
    chains.push(`[${current}][${colorLabel}]overlay=x='${xExpr}':y='${yExpr}':enable='between(t,${q(start)},${q(end)})'[${next}]`)
    current = next
    idx += 1
  }
  for (const start of [0.6, 5.7, 11.8, 15.6]) {
    const a = start, b = start + 0.62, c = start + 1.24, d = start + 1.86, e = start + 2.48
    overlayMoving({ label: 'topGlow', sw: 360, sh: 26, color: 'white@0.40', xExpr: `${frameX}-180+((t-${a})/${b - a})*${frameW + 360}`, yExpr: `${frameY - 11}`, start: a, end: b })
    overlayMoving({ label: 'topHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX}-60+((t-${a})/${b - a})*${frameW + 120}`, yExpr: `${frameY - 6}`, start: a, end: b })
    overlayMoving({ label: 'rightGlow', sw: 26, sh: 360, color: 'white@0.40', xExpr: `${frameX + frameW - 13}`, yExpr: `${frameY}-180+((t-${b})/${c - b})*${frameH + 360}`, start: b, end: c })
    overlayMoving({ label: 'rightHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX + frameW - 8}`, yExpr: `${frameY}-60+((t-${b})/${c - b})*${frameH + 120}`, start: b, end: c })
    overlayMoving({ label: 'bottomGlow', sw: 360, sh: 26, color: 'white@0.40', xExpr: `${frameX + frameW}-180-((t-${c})/${d - c})*${frameW + 360}`, yExpr: `${frameY + frameH - 13}`, start: c, end: d })
    overlayMoving({ label: 'bottomHead', sw: 120, sh: 16, color: 'white@0.96', xExpr: `${frameX + frameW}-60-((t-${c})/${d - c})*${frameW + 120}`, yExpr: `${frameY + frameH - 8}`, start: c, end: d })
    overlayMoving({ label: 'leftGlow', sw: 26, sh: 360, color: 'white@0.40', xExpr: `${frameX - 13}`, yExpr: `${frameY + frameH}-180-((t-${d})/${e - d})*${frameH + 360}`, start: d, end: e })
    overlayMoving({ label: 'leftHead', sw: 16, sh: 120, color: 'white@0.96', xExpr: `${frameX - 8}`, yExpr: `${frameY + frameH}-60-((t-${d})/${e - d})*${frameH + 120}`, start: d, end: e })
  }
  chains.push(`[${current}]format=yuv420p[${outputLabel}]`)
  return chains
}


function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function filterPath(value) { return String(value).replaceAll("'", "'\\''") }
function cleanCaptionWord(value) {
  return String(value || '').replace(/^[-–—]+|[-–—]+$/g, '').replace(/[^\p{L}\p{N}'-]/gu, '').toUpperCase()
}
function headerDraw(inputLabel, outputLabel, text) {
  const rawLines = String(text).trim().split(/\n+/)
  const words = String(text).trim().split(/\s+/)
  const lines = rawLines.length > 1 ? rawLines : (words.length >= 3 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [words.join(' ')])
  const fontSize = lines.length > 1 ? 104 : 96
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
const id = `stream-2-project-moves-offstream-house-v4f-${stamp}`
const mainOut = `media/renders/${id}-main.mp4`
const seedFrame = `media/renders/${id}-seed-frame.jpg`
const seedOut = `media/renders/${id}-seed.mp4`
const concatList = `media/renders/${id}-concat.txt`
const out = `media/renders/${id}.mp4`
const assPath = `media/transcripts/${id}.ass`
const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
const thumbnail = `${exportDir}/thumbnail.jpg`
const readyPath = `${readyDir}/short-project-moves-offstream-house-v4f.mp4`

let captionEvents = buildShortWordEvents({
  segments: transcript.segments || [],
  sourceStart: clip.start,
  sourceEnd: clip.end,
  minDuration: 0.16,
  maxDuration: 0.68,
  gap: 0.012,
}).map((event) => ({ ...event, text: cleanCaptionWord(event.text) })).filter((event) => event.text && !['UM', 'UH', 'I'].includes(event.text))
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
  `[srcmain]crop=iw*0.34:ih-92:0:92,eq=brightness=0.09:contrast=1.10:saturation=1.08,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
  `[headline]drawbox=x=${videoX - 12}:y=${videoY - 12}:w=${videoW + 24}:h=${videoH + 24}:color=black@0.44:t=fill[panel]`,
  `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
  `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[framed]`,
  `[framed]drawbox=x=204:y=${brandY}:w=672:h=${brandH}:color=black@0.50:t=fill[brandbox]`,
  `[brandbox]drawtext=font='DejaVu Sans':text='VIBE ZONE':x=(w-text_w)/2:y=${brandY + 14}:fontcolor=white:fontsize=76:borderw=3:bordercolor=black@0.88[brand1]`,
  `[brand1]drawtext=font='DejaVu Sans':text='OPENCLAW':x=(w-text_w)/2:y=${brandY + 88}:fontcolor=white:fontsize=40:borderw=3:bordercolor=black@0.88[brandOpenClaw]`,
  `[brandOpenClaw]drawtext=font='DejaVu Sans':text='LOCAL CLIP FACTORY':x=(w-text_w)/2:y=${brandY + 134}:fontcolor=white@0.92:fontsize=28:borderw=2:bordercolor=black@0.88[brand2]`,
  `[brand2]subtitles='${filterPath(assPath)}'[captioned]`,
  ...retentionBorderChains('captioned', 'vout', duration),
  `[0:a]atrim=start=${clip.start}:end=${clip.end},asetpts=PTS-STARTPTS[aout]`,
].join(';')

run('ffmpeg', ['-y', '-v', 'error', '-i', source, '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', mainOut])
run('ffmpeg', ['-y', '-v', 'error', '-ss', '8', '-i', mainOut, '-frames:v', '1', '-q:v', '2', seedFrame])
run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-t', String(seedDuration), '-i', seedFrame, '-f', 'lavfi', '-t', String(seedDuration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-vf', 'scale=1080:1920,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', seedOut])
await writeFile(path.join(root, concatList), `file '${path.resolve(root, seedOut)}'\nfile '${path.resolve(root, mainOut)}'\n`)
run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', out])
run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/7,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', contactSheet])
await copyFile(path.join(root, seedFrame), path.join(root, thumbnail))
const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])

const seo = {
  youtubeTitle: 'The Build Has To Move While I’m Offline',
  youtubeDescription: `A tight build-in-public moment from Stream 2: Rex explains why Vibe Zone needs to keep progressing even when he is offline after a full-time job.\n\nPrepared as a local manual-upload bundle only. No external posting, cookies, logins, or API writes were used.`,
  tiktokDescription: 'The build can’t only move when the stream is live. That’s the whole point of the agentic clip factory. #VibeZone #BuildInPublic #CreatorTools #AI',
  hashtags: clip.hashtags,
  suggestedPinnedComment: 'What should an off-stream creator agent handle first: clips, planning, or uploads?',
  thumbnailText: 'BUILD WHILE OFFSTREAM',
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
    'Fresh Stream 2 local-only improvement render using a brighter active-screen crop, restored neutral house frame, subtle travelling shine, centered-screen house v4 layout, and VIBE ZONE + OpenClaw branding.',
    '0.5s seed frame prepended for manual Shorts thumbnail-selection tests.',
    'White one-word captions stay in the safe zone above the brand lane; source screen is brightened and tight active-left-zoomed to reduce dead desktop space.',
    'Stream-safe founder-momentum clip: off-stream progress and creator workflow only; no secrets/logins/cookies/API posting.',
  ],
}
await writeFile(path.join(root, exportDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'seo.json'), JSON.stringify(seo, null, 2) + '\n')
await writeFile(path.join(root, exportDir, 'youtube-upload.md'), `# YouTube Shorts draft\n\nTitle: ${seo.youtubeTitle}\n\nDescription:\n${seo.youtubeDescription}\n\nHashtags: ${seo.hashtags.join(' ')}\n`)
await writeFile(path.join(root, exportDir, 'tiktok-upload.md'), `# TikTok draft\n\n${seo.tiktokDescription}\n\nPinned comment: ${seo.suggestedPinnedComment}\n`)
await writeFile(path.join(root, exportDir, 'upload-card.md'), `# ${clip.title}\n\n**Status:** local manual-upload candidate — do not post externally without Masala approval.\n\n## Files\n- Render: ${out}\n- Ready copy: ${readyPath}\n- Thumbnail/seed: ${thumbnail}\n- Proof sheet: ${contactSheet}\n\n## YouTube Shorts\nTitle: ${seo.youtubeTitle}\n\nDescription:\n${seo.youtubeDescription}\n\n## TikTok\n${seo.tiktokDescription}\n\n## Pinned comment\n${seo.suggestedPinnedComment}\n\n## Review notes\n- Centered screen, white captions, VIBE ZONE + OpenClaw brand lane.\n- Start/end: ${relTime(clip.start)}–${relTime(clip.end)} from Stream 2.\n- Verified by caption QA, ffprobe, and full decode in the render script.\n`)
await writeFile(path.join(root, exportDir, 'review-notes.md'), `# Review — ${clip.title}\n\n- Render: ${out}\n- Ready copy: ${readyPath}\n- Proof sheet: ${contactSheet}\n- Thumbnail/seed frame: ${thumbnail}\n- Verification: caption QA + ffprobe + full decode pass completed in script.\n- Quality: tight active-left-zoomed source screen, clean white one-word captions, VIBE ZONE + OpenClaw branding, no colored-card/square-face regression.\n- Stream safety: off-stream progress / creator workflow topic only; no secrets, no login/cookies, no external posting. Final owner privacy/watch pass still required.\n`)
await writeFile(path.join(root, exportDir, 'ffprobe.json'), JSON.stringify(ffprobe, null, 2) + '\n')
await copyFile(path.join(root, out), path.join(root, readyPath))
await copyFile(path.join(root, contactSheet), path.join(root, `${readyDir}/contact-sheet.jpg`))
await copyFile(path.join(root, thumbnail), path.join(root, `${readyDir}/thumbnail.jpg`))
for (const file of ['manifest.json', 'seo.json', 'youtube-upload.md', 'tiktok-upload.md', 'upload-card.md', 'review-notes.md', 'ffprobe.json']) {
  await copyFile(path.join(root, exportDir, file), path.join(root, `${readyDir}/${file === 'review-notes.md' ? 'README.md' : file}`))
}

const dataPath = path.join(root, 'data/vibe-zone.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const now = new Date().toISOString()
const clipRecord = {
  platform: 'tiktok',
  status: 'ready_local_manual_upload',
  exportedAt: now,
  id: clip.id,
  transcriptId: 'stream-2',
  score: clip.score,
  start: relTime(clip.start),
  end: relTime(clip.end),
  title: clip.title,
  hook: clip.hook,
  caption: clip.caption,
  hashtags: clip.hashtags,
  reason: 'Fresh Stream 2 improvement render: concise off-stream progress thesis, rerendered with brighter centered-screen layout and seed frame.',
  createdAt: now,
  renderPath: out,
  renderUrl: `/${out}`,
  renderPreset: 'stream2-house-v4f-bright-screen-neutral-frame-seed',
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
  createdAt: now,
  note: 'Prepared local-only upload bundle; do not externally post without explicit Masala approval.',
}
data.clips = [clipRecord, ...(data.clips || []).filter((item) => item.id !== clip.id)].slice(0, 80)
data.dispatchItems = [dispatchRecord, ...(data.dispatchItems || []).filter((item) => item.id !== dispatchRecord.id)].slice(0, 120)
data.mediaJobs = [{
  id: `job_${clip.id}`,
  type: 'render',
  status: 'completed',
  title: clip.title,
  createdAt: now,
  completedAt: now,
  outputPath: out,
  exportBundlePath: exportDir,
  note: 'Local-only Stream 2 improvement render for off-stream progress; no external posting/API work.',
}, ...(data.mediaJobs || []).filter((item) => item.id !== `job_${clip.id}`)].slice(0, 120)
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n')

console.log(JSON.stringify({ renderPath: out, readyPath, exportDir, contactSheet, thumbnail, ffprobe }, null, 2))
