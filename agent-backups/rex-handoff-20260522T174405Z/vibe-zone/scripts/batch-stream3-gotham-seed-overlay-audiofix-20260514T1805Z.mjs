#!/usr/bin/env node
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const batchId = 'stream3-gotham-seed-audiofix-20260514T1805Z'
const readyDir = `media/exports/READY_TO_SHIP_NOW/${batchId}`
const seedDuration = 0.5
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
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
function originalInput(clip) {
  const previous = Array.isArray(clip.renderVariants) ? clip.renderVariants.find((variant) => variant.renderPath && !String(variant.renderPath).includes('gotham-seed')) : null
  return previous?.renderPath || clip.renderPath
}
await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const clips = (db.clips || []).filter((clip) => seeds[clip.id]).sort((a, b) => (b.score || 0) - (a.score || 0))
const manifest = []
for (const [index, clip] of clips.entries()) {
  const base = `${String(clip.id).replace(/^clip_/, '')}-gotham-seed-audiofix-20260514T1805Z`
  const bundle = `media/exports/clip_${base}`
  const input = originalInput(clip)
  const seed = seeds[clip.id]
  const out = `media/renders/${base}.mp4`
  const ready = `${readyDir}/${String(index + 1).padStart(2, '0')}-${slug(clip.title)}.mp4`
  const review = `media/reviews/${base}-contact-sheet.jpg`
  if (!existsSync(path.join(root, input))) throw new Error(`Missing original input for ${clip.id}: ${input}`)
  if (!existsSync(path.join(root, seed))) throw new Error(`Missing seed frame for ${clip.id}: ${seed}`)
  await mkdir(path.join(root, bundle), { recursive: true })
  // Overlay the seed image visually for the first 0.5s over the real clip; do not prepend silence.
  // Audio is copied from the original clip and starts immediately.
  run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-loop', '1', '-t', String(seedDuration), '-i', seed, '-filter_complex', `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=rgba[seed];[0:v][seed]overlay=0:0:enable='between(t,0,${seedDuration})',format=yuv420p[vout]`, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  const audioProbe = run('ffmpeg', ['-hide_banner', '-i', out, '-af', 'volumedetect', '-t', '3', '-f', 'null', '-'])
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', review])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,sample_rate,channels,duration', '-of', 'json', out])
  await copyFile(path.join(root, out), path.join(root, ready))
  await copyFile(path.join(root, out), path.join(root, bundle, `${base}.mp4`))
  await copyFile(path.join(root, seed), path.join(root, bundle, 'seed-frame.jpg'))
  await copyFile(path.join(root, review), path.join(root, bundle, 'contact-sheet.jpg'))
  const metadata = { id: clip.id, title: clip.title, hook: clip.hook, caption: clip.caption, hashtags: clip.hashtags || [], seedDuration, audioFix: 'Seed frame overlays first 0.5s; original audio starts immediately.', sourceInput: input, renderPath: out, readyPath: ready, seedFramePath: seed, proofFramePath: review, preset: 'confirmed-template-01-gotham-seed-audiofix' }
  await writeFile(path.join(root, bundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(root, bundle, 'upload-card.md'), `# ${clip.title}\n\nRender: \`${ready}\`\n\nSeed frame: \`${seed}\`\n\nAudio fix: seed frame is visual overlay only; original audio starts immediately.\n\nHook: ${clip.hook}\n\nCaption: ${clip.caption}\n\nHashtags: ${(clip.hashtags || []).join(' ')}\n\nManual upload only.\n`)
  clip.renderVariants = Array.isArray(clip.renderVariants) ? [{ renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, renderPreset: clip.renderPreset, updatedAt: new Date().toISOString(), note: 'Superseded concat-seed version with silent lead-in.' }, ...clip.renderVariants].slice(0, 10) : []
  clip.renderPath = out
  clip.renderUrl = `/${out}`
  clip.renderPreset = 'confirmed-template-01-gotham-seed-audiofix'
  clip.exportBundlePath = bundle
  clip.proofFramePath = review
  clip.proofFrames = [seed, review]
  clip.thumbnailProofPath = seed
  clip.renderStatus = 'done'
  clip.status = 'exported'
  clip.exportedAt = new Date().toISOString()
  manifest.push({ ...metadata, ffprobe: JSON.parse(probe.stdout), audioProbe: audioProbe.stderr.match(/mean_volume:.*|max_volume:.*/g) || [] })
}
await writeFile(path.join(root, readyDir, 'manifest.json'), JSON.stringify({ batchId, seedDuration, count: manifest.length, createdAt: new Date().toISOString(), items: manifest }, null, 2))
for (const item of db.dispatchItems || []) {
  const clip = clips.find((candidate) => candidate.id === item.clipId)
  if (!clip) continue
  item.renderPath = clip.renderPath
  item.exportBundlePath = clip.exportBundlePath
  item.proofFrames = clip.proofFrames || []
  item.status = 'approved_manual_upload'
  item.blockers = []
  item.lastAuditAction = 'Audio-fixed Gotham seed-frame render: seed is visual overlay only, original audio starts immediately.'
  item.updatedAt = new Date().toISOString()
}
db.settings = db.settings || {}
db.settings.activeClipWorkflow = { ...(db.settings.activeClipWorkflow || {}), id: 'confirmed-template-01-gotham-seed-audiofix', label: 'Confirmed Template #1 + varied Gotham seed overlay with immediate audio', seedFrameDurationSeconds: seedDuration, activeBatch: batchId, updatedAt: new Date().toISOString() }
db.mediaJobs = db.mediaJobs || []
db.mediaJobs.unshift({ id: `media_job_${Date.now()}_${batchId}`, step: 'Fix seed-frame batch audio', status: 'done', detail: `Rendered ${manifest.length} clips with seed frame as visual overlay so original audio starts immediately.`, command: 'node scripts/batch-stream3-gotham-seed-overlay-audiofix-20260514T1805Z.mjs', createdAt: new Date().toISOString() })
db.mediaJobs = db.mediaJobs.slice(0, 100)
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log(JSON.stringify({ batchId, count: manifest.length, readyDir, firstAudioProbe: manifest[0]?.audioProbe, items: manifest.map((item) => ({ title: item.title, readyPath: item.readyPath })) }, null, 2))
