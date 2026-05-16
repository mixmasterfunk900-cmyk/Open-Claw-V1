#!/usr/bin/env node
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { secondsFromStamp } from '../lib/caption-normalizer.mjs'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const source = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const candidatePath = 'media/exports/stream3-top10-short-candidates-20260514T0930Z.json'
const batchId = 'stream3-raw-source-audiofix-20260514T1915Z'
// Style regression guard: this batch uses seed-frame overlays / colored template
// visuals, so it must not be promoted directly to READY. Render into HOLD until
// a visual gate explicitly confirms house branding, clean white text, and no
// colored card/frame artifacts.
const readyDir = `media/exports/STYLE_REVIEW_HOLD/${batchId}`
const preset = 'confirmed-template-01-gotham-seed-raw-source-audio-wrapped-title'
const seedDuration = 0.5
const visualInputs = {
  // Use the later accepted Stream Once render for the body because Masala said this one looked broken in the batch.
  clip_stream3_one_stream_many_clips: 'media/exports/READY_TO_SHIP_NOW/day3-one-stream-shine-contrast-heading-20260514T1605Z.mp4',
  clip_stream3_iphone_for_streamers: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/02-iphone-for-streamers.mp4',
  clip_stream3_product_or_machine: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/03-product-or-machine.mp4',
  clip_stream3_ship_live_fix_later: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/04-ship-live-fix-later.mp4',
  clip_stream3_first_auto_clip: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/05-first-clip-shipped.mp4',
  clip_stream3_ai_building_ai: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/06-ai-built-more-ai.mp4',
  clip_stream3_practice_streaming: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/07-practice-streaming-here.mp4',
  clip_stream3_facecam_missing: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/08-where-is-my-face.mp4',
  clip_stream3_offstream_agent: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/09-build-while-away.mp4',
  clip_stream3_agent_loop: 'media/exports/READY_TO_SHIP_NOW/stream3-hard-audiofix-20260514T1838Z/10-agents-never-stop.mp4',
}
const seeds = {
  clip_stream3_one_stream_many_clips: '/root/.openclaw/media/tool-image-generation/stream3-one-stream-new-params-seed-frame---208790bb-b96f-4ef1-ae96-6a89e1056a08.jpg',
  clip_stream3_iphone_for_streamers: 'media/renders/stream3_iphone_for_streamers-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_product_or_machine: 'media/renders/stream3_product_or_machine-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_ship_live_fix_later: 'media/renders/stream3_ship_live_fix_later-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_first_auto_clip: 'media/renders/stream3_first_auto_clip-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_ai_building_ai: 'media/renders/stream3_ai_building_ai-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_practice_streaming: 'media/renders/stream3_practice_streaming-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_facecam_missing: 'media/renders/stream3_facecam_missing-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_offstream_agent: 'media/renders/stream3_offstream_agent-gotham-seed-20260514T1740Z-seed-frame.jpg',
  clip_stream3_agent_loop: 'media/renders/stream3_agent_loop-gotham-seed-20260514T1740Z-seed-frame.jpg',
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) }
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 180 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const candidates = JSON.parse(await readFile(path.join(root, candidatePath), 'utf8')).candidates.slice(0, 10)
const byClipId = new Map(candidates.map((c) => [`clip_${c.id}`, c]))
const clips = (db.clips || []).filter((clip) => visualInputs[clip.id] && byClipId.has(clip.id)).sort((a, b) => (b.score || 0) - (a.score || 0))
const manifest = []
for (const [index, clip] of clips.entries()) {
  const candidate = byClipId.get(clip.id)
  const startSec = secondsFromStamp(candidate.start)
  const endSec = secondsFromStamp(candidate.end)
  const duration = endSec - startSec
  const base = `${String(clip.id).replace(/^clip_/, '')}-raw-source-audiofix-20260514T1915Z`
  const bundle = `media/exports/clip_${base}`
  const visual = visualInputs[clip.id]
  const seed = seeds[clip.id]
  const out = `media/renders/${base}.mp4`
  const ready = `${readyDir}/${String(index + 1).padStart(2, '0')}-${slug(clip.title)}.mp4`
  const review = `media/reviews/${base}-contact-sheet.jpg`
  for (const required of [source, visual, seed]) if (!existsSync(path.isAbsolute(required) ? required : path.join(root, required))) throw new Error(`Missing required file: ${required}`)
  await mkdir(path.join(root, bundle), { recursive: true })
  run('ffmpeg', [
    '-y', '-v', 'error',
    '-i', visual,
    '-i', source,
    '-loop', '1', '-t', String(seedDuration), '-i', seed,
    '-filter_complex', `[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=rgba[seed];[0:v][seed]overlay=0:0:enable='between(t,0,${seedDuration})',format=yuv420p[vout];[1:a]atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=2.2,loudnorm=I=-14:TP=-1.0:LRA=9[aout]`,
    '-map', '[vout]', '-map', '[aout]',
    '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '224k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', '-shortest', out,
  ])
  run('ffmpeg', ['-v', 'error', '-i', out, '-map', '0:a:0', '-t', '2', '-f', 'wav', '-y', '/tmp/vz-raw-audio-check.wav'])
  const audioProbe = run('ffmpeg', ['-hide_banner', '-i', out, '-af', 'volumedetect', '-t', '5', '-f', 'null', '-'])
  const audioLog = audioProbe.stderr || audioProbe.stdout || ''
  if (/mean_volume:\s*-91\.0 dB/.test(audioLog) || !/mean_volume:/.test(audioLog)) throw new Error(`${clip.id} audio appears silent: ${audioLog}`)
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', review])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=index,codec_type,codec_name,width,height,sample_rate,channels,bit_rate,duration', '-of', 'json', out])
  await copyFile(path.join(root, out), path.join(root, ready))
  await copyFile(path.join(root, out), path.join(root, bundle, `${base}.mp4`))
  const seedTarget = path.join(root, bundle, 'seed-frame.jpg')
  await copyFile(path.isAbsolute(seed) ? seed : path.join(root, seed), seedTarget)
  await copyFile(path.join(root, review), path.join(root, bundle, 'contact-sheet.jpg'))
  const metadata = { id: clip.id, title: clip.title, hook: clip.hook, caption: clip.caption, start: candidate.start, end: candidate.end, seedDuration, audioFix: 'Audio rebuilt directly from raw Day 3 source using candidate timecodes, boosted/normalized/re-encoded AAC 48k stereo.', visualFix: clip.id === 'clip_stream3_one_stream_many_clips' ? 'Stream Once body replaced with known-good later approved render.' : 'Visual retained from latest hard-audio/wrapped-title render.', visual, renderPath: ready, seedFramePath: seed, preset }
  await writeFile(path.join(root, bundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(root, bundle, 'upload-card.md'), `# ${clip.title}\n\nRender: \`${ready}\`\n\nAudio: rebuilt directly from raw Day 3 source (${candidate.start}–${candidate.end}), boosted/normalized AAC.\n\nVisual: ${metadata.visualFix}\n\nHook: ${clip.hook}\n\nCaption: ${clip.caption}\n\nHashtags: ${(clip.hashtags || []).join(' ')}\n\nManual upload only.\n`)
  clip.renderVariants = Array.isArray(clip.renderVariants) ? [{ renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, renderPreset: clip.renderPreset, updatedAt: new Date().toISOString(), note: 'Superseded by raw-source audio rebuild.' }, ...clip.renderVariants].slice(0, 10) : []
  clip.renderPath = ready
  clip.renderUrl = `/${ready}`
  clip.renderPreset = preset
  clip.exportBundlePath = bundle
  clip.proofFramePath = review
  clip.proofFrames = [metadata.seedFramePath, review]
  clip.thumbnailProofPath = metadata.seedFramePath
  clip.renderStatus = 'done'
  clip.status = 'exported'
  clip.exportedAt = new Date().toISOString()
  manifest.push({ ...metadata, ffprobe: JSON.parse(probe.stdout), audioProbe: audioLog.match(/mean_volume:.*|max_volume:.*/g) || [] })
}
await writeFile(path.join(root, readyDir, 'manifest.json'), JSON.stringify({ batchId, count: manifest.length, createdAt: new Date().toISOString(), items: manifest }, null, 2))
for (const item of db.dispatchItems || []) {
  const clip = clips.find((candidate) => candidate.id === item.clipId)
  if (!clip) continue
  item.renderPath = clip.renderPath
  item.exportBundlePath = clip.exportBundlePath
  item.proofFrames = clip.proofFrames || []
  item.status = 'style_review_hold'
  item.blockers = ['STYLE_GATE_REQUIRED: raw-source audiofix batch must pass house-style visual review before READY/manual upload.']
  item.lastAuditAction = 'Audio rebuilt from raw Day 3 source; held from READY pending no-blue-card / house-brand / white-text / screen-context gate.'
  item.updatedAt = new Date().toISOString()
}
db.clips = clips
db.dispatchItems = (db.dispatchItems || []).filter((item) => clips.some((clip) => clip.id === item.clipId))
db.settings = db.settings || {}
db.settings.activeClipWorkflow = { ...(db.settings.activeClipWorkflow || {}), id: preset, label: 'STYLE REVIEW HOLD — raw-source audio rebuild + seed overlay', seedFrameDurationSeconds: seedDuration, activeBatch: batchId, updatedAt: new Date().toISOString(), rules: ['Render to STYLE_REVIEW_HOLD, not READY_TO_SHIP_NOW.', 'Must pass house-style visual gate before manual upload approval.', 'Required gate: VIBE ZONE/OpenClaw branding, clean white text/captions, screen/context-first body, no colored card/frame artifacts, no square-face default.', 'No external posting/owner approval bypass.'] }
db.mediaJobs = db.mediaJobs || []
db.mediaJobs.unshift({ id: `media_job_${Date.now()}_${batchId}`, step: 'Rebuild Stream 3 audio from raw source', status: 'done', detail: `Rendered ${manifest.length} clips with raw-source audio and fixed Stream Once visual.`, command: 'node scripts/batch-stream3-raw-source-audiofix-20260514T1915Z.mjs', createdAt: new Date().toISOString() })
db.mediaJobs = db.mediaJobs.slice(0, 100)
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log(JSON.stringify({ batchId, readyDir, count: manifest.length, probes: manifest.map((item) => ({ title: item.title, audioProbe: item.audioProbe, visual: item.visual })) }, null, 2))
