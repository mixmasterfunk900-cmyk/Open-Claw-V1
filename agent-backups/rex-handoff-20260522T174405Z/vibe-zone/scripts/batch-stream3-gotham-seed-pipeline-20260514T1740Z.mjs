#!/usr/bin/env node
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const batchId = 'stream3-gotham-seed-pipeline-20260514T1740Z'
const readyDir = `media/exports/READY_TO_SHIP_NOW/${batchId}`
const seedDuration = 0.5
const seeds = {
  clip_stream3_one_stream_many_clips: '/root/.openclaw/media/tool-image-generation/seed-stream3-01-stream-once---8ef9b29d-9ee2-47c1-bee1-807c39204210.jpg',
  clip_stream3_iphone_for_streamers: '/root/.openclaw/media/tool-image-generation/seed-stream3-02-streamer-iphone---81d9c1de-bf04-4ead-9a1b-d8382469188c.jpg',
  clip_stream3_product_or_machine: '/root/.openclaw/media/tool-image-generation/seed-stream3-03-product-machine---352b971a-06bf-422a-9327-cf2f7124d81e.jpg',
  clip_stream3_ship_live_fix_later: '/root/.openclaw/media/tool-image-generation/seed-stream3-04-ship-broken---21513cab-47c6-49ba-9f49-5d230bdd98b2.jpg',
  clip_stream3_first_auto_clip: '/root/.openclaw/media/tool-image-generation/seed-stream3-05-first-shipped---9fe87637-206c-47d2-87a0-c453f672c689.jpg',
  clip_stream3_ai_building_ai: '/root/.openclaw/media/tool-image-generation/seed-stream3-06-ai-built-ai---5285bca0-fe11-4215-8cc9-8e5e81d8ae8f.jpg',
  clip_stream3_practice_streaming: '/root/.openclaw/media/tool-image-generation/seed-stream3-07-rehearse-first---ccffb786-be0b-47d5-a062-618a6b1b1f11.jpg',
  clip_stream3_facecam_missing: '/root/.openclaw/media/tool-image-generation/seed-stream3-08-where-did-i-go---7641f59b-53d6-41be-9116-adbf376231e5.jpg',
  clip_stream3_offstream_agent: '/root/.openclaw/media/tool-image-generation/seed-stream3-09-build-away---1e503ee4-a8c0-4627-ad4e-d9b2fc49cf06.jpg',
  clip_stream3_agent_loop: '/root/.openclaw/media/tool-image-generation/seed-stream3-10-agents-loop---0b03a459-d936-4ac9-b562-45b2fff9ae42.jpg',
}
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) }
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 120 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`)
  return result
}
await mkdir(path.join(root, 'media/renders'), { recursive: true })
await mkdir(path.join(root, 'media/reviews'), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })
const db = JSON.parse(await readFile(dbPath, 'utf8'))
const clips = (db.clips || []).filter((clip) => seeds[clip.id] && clip.status === 'exported').sort((a, b) => (b.score || 0) - (a.score || 0))
const manifest = []
for (const clip of clips) {
  const base = `${String(clip.id).replace(/^clip_/, '')}-gotham-seed-20260514T1740Z`
  const bundle = `media/exports/clip_${base}`
  const seed = `media/renders/${base}-seed-frame.jpg`
  const seedVideo = `media/renders/${base}-seed.mp4`
  const concatList = `media/renders/${base}-concat.txt`
  const out = `media/renders/${base}.mp4`
  const ready = `${readyDir}/${String(clips.indexOf(clip)+1).padStart(2,'0')}-${slug(clip.title)}.mp4`
  const review = `media/reviews/${base}-contact-sheet.jpg`
  const input = clip.renderPath
  if (!existsSync(path.join(root, input))) throw new Error(`Missing input for ${clip.id}: ${input}`)
  await mkdir(path.join(root, bundle), { recursive: true })
  run('ffmpeg', ['-y', '-v', 'error', '-i', seeds[clip.id], '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-q:v', '2', seed])
  run('ffmpeg', ['-y', '-v', 'error', '-loop', '1', '-framerate', '30', '-t', String(seedDuration), '-i', seed, '-f', 'lavfi', '-t', String(seedDuration), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-shortest', seedVideo])
  await writeFile(path.join(root, concatList), `file '${path.resolve(root, seedVideo).replaceAll("'", "'\\''")}'\nfile '${path.resolve(root, input).replaceAll("'", "'\\''")}'\n`)
  run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/3,scale=320:-1,tile=7x1', '-frames:v', '1', '-q:v', '3', review])
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height', '-of', 'json', out])
  await copyFile(path.join(root, out), path.join(root, ready))
  await copyFile(path.join(root, out), path.join(root, bundle, `${base}.mp4`))
  await copyFile(path.join(root, seed), path.join(root, bundle, 'seed-frame.jpg'))
  await copyFile(path.join(root, review), path.join(root, bundle, 'contact-sheet.jpg'))
  const metadata = {
    id: clip.id,
    title: clip.title,
    hook: clip.hook,
    caption: clip.caption,
    hashtags: clip.hashtags || [],
    seedDuration,
    renderPath: out,
    readyPath: ready,
    seedFramePath: seed,
    proofFramePath: review,
    preset: 'confirmed-template-01-gotham-seed-upload-test',
    note: '0.5s face-led Gotham-style thumbnail seed frame prepended for YouTube Shorts thumbnail-selection testing. Manual upload only.'
  }
  await writeFile(path.join(root, bundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(root, bundle, 'upload-card.md'), `# ${clip.title}\n\nRender: \`${ready}\`\n\nSeed frame: \`${seed}\`\n\nHook: ${clip.hook}\n\nCaption: ${clip.caption}\n\nHashtags: ${(clip.hashtags || []).join(' ')}\n\nPreset: confirmed-template-01-gotham-seed-upload-test\n\nManual upload only. Use this batch to test whether YouTube offers the first 0.5s seed frame as a thumbnail option.\n`)
  const oldVariant = { renderPath: clip.renderPath, exportBundlePath: clip.exportBundlePath, renderPreset: clip.renderPreset, updatedAt: new Date().toISOString(), note: 'Previous pre-seed Stream 3 render preserved.' }
  clip.renderVariants = Array.isArray(clip.renderVariants) ? [oldVariant, ...clip.renderVariants].slice(0, 8) : [oldVariant]
  clip.renderPath = out
  clip.renderUrl = `/${out}`
  clip.renderPreset = 'confirmed-template-01-gotham-seed-upload-test'
  clip.renderStatus = 'done'
  clip.exportBundlePath = bundle
  clip.proofFramePath = review
  clip.proofFrames = [seed, review]
  clip.thumbnailProofPath = seed
  clip.exportedAt = new Date().toISOString()
  clip.caption = `${clip.caption} Gotham-style 0.5s seed frame added for YouTube Shorts thumbnail-selection testing.`
  manifest.push({ ...metadata, ffprobe: JSON.parse(probe.stdout) })
}
await writeFile(path.join(root, readyDir, 'manifest.json'), JSON.stringify({ batchId, seedDuration, count: manifest.length, createdAt: new Date().toISOString(), items: manifest }, null, 2))
// Normalize/refresh dispatch rows for these clips so website queue points at the new assets.
db.dispatchItems = db.dispatchItems || []
const byClip = new Map(db.dispatchItems.map((item) => [item.clipId, item]))
for (const clip of clips) {
  const existing = byClip.get(clip.id)
  const item = existing || { id: `dispatch_${clip.id}_${Date.now()}`, clipId: clip.id, createdAt: new Date().toISOString() }
  item.title = clip.title
  item.platform = clip.platform || 'youtube'
  item.status = 'approved_manual_upload'
  item.renderPath = clip.renderPath
  item.exportBundlePath = clip.exportBundlePath
  item.proofFrames = clip.proofFrames || []
  item.blockers = []
  item.lastAuditAction = 'Updated with approved face-led Gotham seed-frame upload-test look; manual upload only.'
  item.ownerGateRequired = true
  item.ownerGate = 'Manual owner upload/review required; no external posting performed.'
  item.privacyWatchRequired = true
  item.updatedAt = new Date().toISOString()
  if (!existing) db.dispatchItems.unshift(item)
}
db.mediaJobs = db.mediaJobs || []
db.mediaJobs.unshift({ id: `media_job_${Date.now()}_${batchId}`, step: 'Batch updated Stream 3 pipeline videos', status: 'done', detail: `Rendered ${manifest.length} Stream 3 clips with 0.5s face-led Gotham seed frames and registered them in the website pipeline.`, command: `node scripts/batch-stream3-gotham-seed-pipeline-20260514T1740Z.mjs`, createdAt: new Date().toISOString() })
db.mediaJobs = db.mediaJobs.slice(0, 100)
await writeFile(dbPath, JSON.stringify(db, null, 2))
console.log(JSON.stringify({ batchId, count: manifest.length, readyDir, items: manifest.map(i => ({ title: i.title, readyPath: i.readyPath })) }, null, 2))
