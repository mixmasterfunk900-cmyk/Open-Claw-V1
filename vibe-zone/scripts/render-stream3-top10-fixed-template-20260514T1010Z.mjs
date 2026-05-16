#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { buildShortWordEvents, buildAss, qaCaptionEvents, mergeTimedCaptionEvents, secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const stamp = '20260514T1010Z'
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptPath = 'media/transcripts/SxOhgmSWqD4.json'
const candidatePath = 'media/exports/stream3-top10-short-candidates-20260514T0930Z.json'
const reviewDir = 'media/reviews'
const exportBase = `media/exports/stream3-top10-fixed-template-${stamp}`
const readyDir = 'media/exports/READY_TO_SHIP_NOW/day3-top10-fixed-template'
const fontBold = 'media/assets/fonts/LilitaOne-Regular.ttf'

const headerZoneTop = 80
const headerZoneBottom = 500
const videoX = 44
const videoY = 610
const videoW = 992
const videoH = 558
const logoZoneTop = 1208
const logoZoneH = 148
const captionMarginV = 600

const hookOverrides = {
  stream3_one_stream_many_clips: 'STREAM ONCE FOREVER',
  stream3_iphone_for_streamers: 'THE STREAMER IPHONE',
  stream3_product_or_machine: 'PRODUCT OR MACHINE?',
  stream3_ship_live_fix_later: 'SHIP IT BROKEN',
  stream3_first_auto_clip: 'FIRST CLIP SHIPPED',
  stream3_ai_building_ai: 'AI BUILT AI',
  stream3_practice_streaming: 'PRACTICE BEFORE LIVE',
  stream3_facecam_missing: 'WHERE DID I GO?',
  stream3_offstream_agent: 'BUILD WHILE AWAY',
  stream3_agent_loop: 'AGENTS NEVER STOP',
}

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

await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, exportBase), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

if (!existsSync(path.join(root, source))) throw new Error(`missing source video ${source}`)
const transcript = JSON.parse(await readFile(path.join(root, transcriptPath), 'utf8'))
const startRank = Number(process.env.START_RANK || 1)
const candidates = JSON.parse(await readFile(path.join(root, candidatePath), 'utf8')).candidates.slice(0, 10).filter((candidate) => candidate.rank >= startRank)
const results = []

for (const candidate of candidates) {
  const startSec = secondsFromStamp(candidate.start)
  const endSec = secondsFromStamp(candidate.end)
  const duration = endSec - startSec
  const safeSlug = slug(candidate.id.replace(/^stream3_/, 'day3-'))
  const id = `${safeSlug}-fixed-template-${stamp}`
  const headerText = hookOverrides[candidate.id] || candidate.hook || candidate.title
  const headerColor = candidate.rank % 2 ? 'white' : '0x66ff00'
  const captionAssColor = candidate.rank % 2 ? '&H0000FF66' : '&H00FFFFFF'
  const out = `media/renders/${id}.mp4`
  const assPath = `media/transcripts/${id}.ass`
  const exportDir = `${exportBase}/${String(candidate.rank).padStart(2, '0')}-${safeSlug}`
  await mkdir(path.join(root, exportDir), { recursive: true })

  const fallbackEvents = buildShortWordEvents({ segments: transcript.segments || [], sourceStart: startSec, sourceEnd: endSec, minDuration: 0.18, maxDuration: 0.62, gap: 0.015 })
    .map((event) => ({ ...event, text: cleanCaptionWord(event.text) }))
    .filter((event) => event.text && event.text !== 'AI')
  const wordTimedEvents = []
  const captionPlan = mergeTimedCaptionEvents(wordTimedEvents, fallbackEvents, { videoDuration: duration, maxGap: 4.5 })
  const captionEvents = captionPlan.events.filter((event) => event.text && event.text !== 'AI')
  const qa = qaCaptionEvents(captionEvents, { mode: 'short', maxWords: 1, maxChars: 24, minDuration: 0.14, maxDuration: 0.75 })
  if (!qa.ok) throw new Error(`${id} caption QA failed: ${qa.failures.join('; ')}`)
  if (!captionPlan.coverage.ok) throw new Error(`${id} caption coverage failed: ${JSON.stringify(captionPlan.coverage)}`)
  let ass = buildAss(captionEvents, { mode: 'short', font: 'DejaVu Sans' })
  ass = ass.replace('Style: VibeShortWord,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1', `Style: VibeShortWord,DejaVu Sans,104,${captionAssColor},${captionAssColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,${captionMarginV},1`)
  await writeFile(path.join(root, assPath), ass)
  const captionQa = { ...qa, timingSource: captionPlan.source, coverage: captionPlan.coverage, primaryCoverage: captionPlan.primaryCoverage || null }
  await writeFile(path.join(root, assPath.replace(/\.ass$/, '.qa.json')), JSON.stringify(captionQa, null, 2) + '\n')

  const vf = [
    `[0:v]trim=start=${startSec}:end=${endSec},setpts=PTS-STARTPTS,split=2[srcmain][srcbg]`,
    '[srcbg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=0.08:saturation=0.72[bg]',
    `color=c=0x050505:s=1080x1920:r=30:d=${duration}[base]`,
    '[base][bg]overlay=0:0:format=auto[underlay]',
    `[underlay]drawtext=fontfile='${fontBold}':text='${esc(headerText)}':x=(w-text_w)/2:y=${headerZoneTop}+(${headerZoneBottom}-${headerZoneTop}-text_h)/2:fontcolor=${headerColor}:fontsize=104:borderw=5:bordercolor=black@0.70[headline]`,
    `[srcmain]crop=iw:ih-92:0:92,scale=${videoW}:${videoH}:force_original_aspect_ratio=increase,crop=${videoW}:${videoH},setsar=1[screenfit]`,
    `[headline]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=black@0.42:t=fill[panel]`,
    `[panel][screenfit]overlay=x=${videoX}:y=${videoY}:format=auto[withscreenraw]`,
    `[withscreenraw]drawbox=x=${videoX}:y=${videoY}:w=${videoW}:h=${videoH}:color=white@0.72:t=4[withscreen]`,
    `[withscreen]null[logozone]`,
    `[logozone]subtitles='${filterPath(assPath)}'[vout]`,
    `[0:a]atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS[aout]`,
  ].join(';')

  run('ffmpeg', ['-y', '-v', 'error', '-i', source, '-filter_complex', vf, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out])
  const contactSheet = `${reviewDir}/${id}-contact-sheet.jpg`
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=6x1', '-frames:v', '1', '-q:v', '3', contactSheet])
  const thumb = `${exportDir}/thumbnail.jpg`
  run('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.min(9, Math.max(1, duration / 2))), '-i', out, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', thumb])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  await writeFile(path.join(root, exportDir, 'metadata.json'), JSON.stringify({ ...candidate, headerText, renderPath: out, readyPath: `${readyDir}/${String(candidate.rank).padStart(2, '0')}-${safeSlug}.mp4`, contactSheet, captionQa, zones: { headerZoneTop, headerZoneBottom, videoX, videoY, videoW, videoH, logoZoneTop, logoZoneH, captionMarginV } }, null, 2) + '\n')
  await writeFile(path.join(root, exportDir, 'caption-qa.json'), JSON.stringify(captionQa, null, 2) + '\n')
  await writeFile(path.join(root, exportDir, 'ffprobe.json'), probe.stdout)
  await copyFile(path.join(root, out), path.join(root, exportDir, `${id}.mp4`))
  await copyFile(path.join(root, contactSheet), path.join(root, exportDir, 'contact-sheet.jpg'))
  const readyPath = `${readyDir}/${String(candidate.rank).padStart(2, '0')}-${safeSlug}.mp4`
  const readySheet = `${readyDir}/${String(candidate.rank).padStart(2, '0')}-${safeSlug}-contact-sheet.jpg`
  await copyFile(path.join(root, out), path.join(root, readyPath))
  await copyFile(path.join(root, contactSheet), path.join(root, readySheet))
  results.push({ rank: candidate.rank, id, title: candidate.title, headerText, renderPath: out, readyPath, contactSheet: readySheet, captionQa, ffprobe: JSON.parse(probe.stdout) })
  console.log(`rendered ${candidate.rank}/10 ${id}`)
}
await writeFile(path.join(root, exportBase, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), source, transcriptPath, candidatePath, template: 'permanent-fixed-template', results }, null, 2) + '\n')
await writeFile(path.join(root, readyDir, 'README.md'), `# Day 3 top 10 fixed-template shorts\n\nRendered ${results.length} clips with the approved permanent Vibe Zone short template.\n\n${results.map((r) => `${r.rank}. ${r.headerText} — ${r.readyPath}`).join('\n')}\n`)
console.log(JSON.stringify({ count: results.length, manifest: `${exportBase}/manifest.json`, readyDir, results }, null, 2))
