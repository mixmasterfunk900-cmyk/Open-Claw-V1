#!/usr/bin/env node
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const batchId = 'stream3-hard-audiofix-20260514T1838Z'
// Style regression fix: this batch uses seed-frame/face-forward overlays and must not be
// copied into READY without a visual house-style audit.
const readyDir = `media/exports/STYLE_REVIEW_HOLD/${batchId}`
const seedDuration = 0.5
const preset = 'confirmed-template-01-gotham-seed-hard-audiofix-wrapped-title'
const inputs = {
  clip_stream3_one_stream_many_clips: 'media/renders/day3-one-stream-many-clips-fixed-template-20260514T1810Z.mp4',
  clip_stream3_iphone_for_streamers: 'media/renders/day3-iphone-for-streamers-fixed-template-20260514T1810Z.mp4',
  clip_stream3_product_or_machine: 'media/renders/day3-product-or-machine-fixed-template-20260514T1810Z.mp4',
  clip_stream3_ship_live_fix_later: 'media/renders/day3-ship-live-fix-later-fixed-template-20260514T1810Z.mp4',
  clip_stream3_first_auto_clip: 'media/renders/day3-first-auto-clip-fixed-template-20260514T1810Z.mp4',
  clip_stream3_ai_building_ai: 'media/renders/day3-ai-building-ai-fixed-template-20260514T1810Z.mp4',
  clip_stream3_practice_streaming: 'media/renders/day3-practice-streaming-fixed-template-20260514T1810Z.mp4',
  clip_stream3_facecam_missing: 'media/renders/day3-facecam-missing-fixed-template-20260514T1810Z.mp4',
  clip_stream3_offstream_agent: 'media/renders/day3-offstream-agent-fixed-template-20260514T1810Z.mp4',
  clip_stream3_agent_loop: 'media/renders/day3-agent-loop-fixed-template-20260514T1810Z.mp4',
}
const seeds = {
  clip_stream3_one_stream_many_clips: 'media/renders/stream3_one_stream_many_clips-gotham-seed-20260514T1740Z-seed-frame.jpg',
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
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const clips = (db.clips || []).filter((clip) => inputs[clip.id]).sort((a, b) => (b.score || 0) - (a.score || 0))
const manifest = []
for (const [index, clip] of clips.entries()) {
  const base = `${String(clip.id).replace(/^clip_/, '')}-hard-audiofix-20260514T1838Z`
  const bundle = `media/exports/clip_${base}`
  const input = inputs[clip.id]
  const seed = seeds[clip.id]
  const out = `media/renders/${base}.mp4`
  const ready = `${readyDir}/${String(index + 1).padStart(2, '0')}-${slug(clip.title)}.mp4`
  const review = `media/reviews/${base}-contact-sheet.jpg`
  if (!existsSync(path.join(root, input))) throw new Error(`Missing input: ${input}`)
  if (!existsSync(path.join(root, seed))) throw new Error(`Missing seed: ${seed}`)
  await mkdir(path.join(root, bundle), { recursive: true })
  // IMPORTANT: no audio copy. Decode + resample + normalize + AAC encode to avoid silent/browser-incompatible tracks.
  run('ffmpeg', [
    '-y', '-v', 'error',
    '-i', input,
    '-loop', '1', '-t', String(seedDuration), '-i', seed,
    '-filter_complex', `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=rgba[seed];[0:v][seed]overlay=0:0:enable='between(t,0,${seedDuration})',format=yuv420p[vout];[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
    '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', '-shortest', out,
  ])
  run('ffmpeg', ['-v', 'error', '-i', out, '-map', '0:a:0', '-t', '1', '-f', 'wav', '-y', '/tmp/vz-audio-check.wav'])
  const audioProbe = run('ffmpeg', ['-hide_banner', '-i', out, '-af', 'volumedetect', '-t', '3', '-f', 'null', '-'])
  const audioLog = audioProbe.stderr || audioProbe.stdout || ''
  if (/mean_volume:\s*-91\.0 dB/.test(audioLog) || !/mean_volume:/.test(audioLog)) throw new Error(`${clip.id} audio appears silent: ${audioLog}`)
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', review])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=index,codec_type,codec_name,width,height,sample_rate,channels,bit_rate,duration', '-of', 'json', out])
  await copyFile(path.join(root, out), path.join(root, ready))
  await copyFile(path.join(root, out), path.join(root, bundle, `${base}.mp4`))
  await copyFile(path.join(root, seed), path.join(root, bundle, 'seed-frame.jpg'))
  await copyFile(path.join(root, review), path.join(root, bundle, 'contact-sheet.jpg'))
  const metadata = { id: clip.id, title: clip.title, hook: clip.hook, caption: clip.caption, hashtags: clip.hashtags || [], seedDuration, audioFix: 'Hard audio fix: decoded/resampled/normalized/re-encoded AAC 48k stereo; no copied audio track.', titleFix: 'Wrapped title body render.', sourceInput: input, renderPath: out, readyPath: ready, seedFramePath: seed, proofFramePath: review, preset }
  await writeFile(path.join(root, bundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(root, bundle, 'upload-card.md'), `# ${clip.title}\n\nRender: \`${ready}\`\n\nStatus: STYLE REVIEW HOLD — not READY until Masala house-style gate passes.\n\nFixes: wrapped title + hard AAC audio re-encode + seed visual overlay only.\n\nHook: ${clip.hook}\n\nCaption: ${clip.caption}\n\nHashtags: ${(clip.hashtags || []).join(' ')}\n\nManual upload only after owner visual approval.\n`)
  clip.renderVariants = Array.isArray(clip.renderVariants) ? [{ renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, renderPreset: clip.renderPreset, updatedAt: new Date().toISOString(), note: 'Superseded due to reported silent playback.' }, ...clip.renderVariants].slice(0, 10) : []
  clip.renderPath = out
  clip.renderUrl = `/${out}`
  clip.renderPreset = preset
  clip.exportBundlePath = bundle
  clip.proofFramePath = review
  clip.proofFrames = [seed, review]
  clip.thumbnailProofPath = seed
  clip.renderStatus = 'done'
  clip.status = 'exported'
  clip.exportedAt = new Date().toISOString()
  manifest.push({ ...metadata, ffprobe: JSON.parse(probe.stdout), audioProbe: audioLog.match(/mean_volume:.*|max_volume:.*/g) || [] })
}
await writeFile(path.join(root, readyDir, 'manifest.json'), JSON.stringify({ batchId, seedDuration, count: manifest.length, createdAt: new Date().toISOString(), items: manifest }, null, 2))
for (const item of db.dispatchItems || []) {
  const clip = clips.find((candidate) => candidate.id === item.clipId)
  if (!clip) continue
  item.renderPath = clip.renderPath
  item.exportBundlePath = clip.exportBundlePath
  item.proofFrames = clip.proofFrames || []
  item.status = 'style_review_hold'
  item.blockers = ['Style regression recheck required before READY/manual upload: verify house branding, white text, no unwanted card/box artifact, screen-context fit, no secrets.']
  item.lastAuditAction = 'Hard audio fix render held from READY pending Masala house-style visual gate.'
  item.updatedAt = new Date().toISOString()
}
db.settings = db.settings || {}
db.settings.activeClipWorkflow = { ...(db.settings.activeClipWorkflow || {}), id: preset, label: 'Confirmed Template #1 + wrapped titles + hard AAC audio fix + STYLE REVIEW HOLD', seedFrameDurationSeconds: seedDuration, activeBatch: batchId, updatedAt: new Date().toISOString(), rules: ['Use Confirmed Template #1 for the short body.', 'Restore VIBE ZONE/OpenClaw branding and clean white captions/hooks before READY.', 'Keep face/seed overlays optional only; never default READY style.', 'Decode/resample/normalize/re-encode audio as AAC 48k stereo; never copy audio in seeded exports.', 'Do not copy to READY_TO_SHIP_NOW until visual style gate passes.'] }
db.mediaJobs = db.mediaJobs || []
db.mediaJobs.unshift({ id: `media_job_${Date.now()}_${batchId}`, step: 'Hard-fix Stream 3 audio', status: 'done', detail: `Rendered ${manifest.length} clips with hard AAC audio re-encode, wrapped titles, and seed overlay.`, command: 'node scripts/batch-stream3-hard-audiofix-20260514T1838Z.mjs', createdAt: new Date().toISOString() })
db.mediaJobs = db.mediaJobs.slice(0, 100)
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log(JSON.stringify({ batchId, count: manifest.length, readyDir, probes: manifest.map((m) => ({ title: m.title, audioProbe: m.audioProbe })) }, null, 2))
