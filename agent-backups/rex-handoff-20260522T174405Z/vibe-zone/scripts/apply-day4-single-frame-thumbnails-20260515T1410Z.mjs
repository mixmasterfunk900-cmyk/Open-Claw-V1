#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync, execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data/vibe-zone.json')
const stamp = '20260515T1410Z'
const frameSeconds = 1 / 30
const readyDir = 'media/exports/READY_TO_SHIP_NOW'
const renderDir = `media/renders/day4-single-frame-thumbnail-${stamp}`
const reviewDir = `media/reviews/day4-single-frame-thumbnail-${stamp}`

const pairs = [
  {
    clipId: 'clip_day4-stream-once-forever_20260515T1310Z',
    input: 'media/exports/READY_TO_SHIP_NOW/day4-stream-once-forever-confirmed-template-01.mp4',
    thumb: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-stream-once-forever-thumbnail.png',
    outName: 'day4-stream-once-forever-confirmed-template-01-single-frame-thumbnail.mp4',
  },
  {
    clipId: 'clip_day4-zero-risk-creator_20260515T1310Z',
    input: 'media/exports/READY_TO_SHIP_NOW/day4-zero-risk-creator-confirmed-template-01.mp4',
    thumb: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-zero-risk-creator-thumbnail.png',
    outName: 'day4-zero-risk-creator-confirmed-template-01-single-frame-thumbnail.mp4',
  },
  {
    clipId: 'clip_day4-telegram-is-chaos_20260515T1310Z',
    input: 'media/exports/READY_TO_SHIP_NOW/day4-telegram-is-chaos-confirmed-template-01.mp4',
    thumb: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-telegram-is-chaos-thumbnail.png',
    outName: 'day4-telegram-is-chaos-confirmed-template-01-single-frame-thumbnail.mp4',
  },
  {
    clipId: 'clip_day4-algorithm-wakes-up_20260515T1310Z',
    input: 'media/exports/READY_TO_SHIP_NOW/day4-algorithm-wakes-up-confirmed-template-01.mp4',
    thumb: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-algorithm-wakes-up-thumbnail.png',
    outName: 'day4-algorithm-wakes-up-confirmed-template-01-single-frame-thumbnail.mp4',
  },
  {
    clipId: 'clip_day4-one-billion-live_20260515T1310Z',
    input: 'media/exports/READY_TO_SHIP_NOW/day4-one-billion-live-confirmed-template-01.mp4',
    thumb: 'media/thumbnails/day4-package-20260515T1310Z/generated-clickable/day4-one-billion-live-thumbnail.png',
    outName: 'day4-one-billion-live-confirmed-template-01-single-frame-thumbnail.mp4',
  },
]

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 160 })
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`)
  return result
}
function probe(file) {
  return JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', file]).stdout)
}
function sampleFirstFrameHash(file) {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(root, file), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1080 * 1920 * 3 + 1024 }).subarray(0, 128).toString('hex')
}

await mkdir(path.join(root, renderDir), { recursive: true })
await mkdir(path.join(root, reviewDir), { recursive: true })
await mkdir(path.join(root, readyDir), { recursive: true })

const db = JSON.parse(await readFile(dbPath, 'utf8'))
const now = new Date().toISOString()
const results = []
for (const item of pairs) {
  const input = item.input
  const thumb = item.thumb
  const out = `${renderDir}/${item.outName}`
  const ready = `${readyDir}/${item.outName}`
  const firstFrame = `${reviewDir}/${item.outName.replace(/\.mp4$/, '-first-frame.jpg')}`
  const afterFrame = `${reviewDir}/${item.outName.replace(/\.mp4$/, '-after-frame.jpg')}`
  const contact = `${reviewDir}/${item.outName.replace(/\.mp4$/, '-contact-sheet.jpg')}`
  if (!existsSync(path.join(root, input))) throw new Error(`Missing short input: ${input}`)
  if (!existsSync(path.join(root, thumb))) throw new Error(`Missing thumbnail: ${thumb}`)

  // Keep the existing short exactly as the base. Only overlay the generated thumbnail
  // for the first output frame (~1/30s). Audio starts immediately; no silence/pre-roll.
  // The thumbnail is shown as a clean full 16:9 card over a blurred vertical copy so the
  // full thumbnail remains readable in a 9:16 Shorts frame.
  const filter = [
    `[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:2,eq=brightness=-0.04:saturation=0.85[tnbg]`,
    `[1:v]scale=1080:-2:force_original_aspect_ratio=decrease,pad=1080:608:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[tncard]`,
    `[tnbg][tncard]overlay=x=0:y=(H-h)/2:format=auto,format=rgba[tnframe]`,
    `[0:v][tnframe]overlay=x=0:y=0:enable='lt(t,${frameSeconds})',format=yuv420p[vout]`,
  ].join(';')
  run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-loop', '1', '-i', thumb, '-filter_complex', filter, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', out])
  run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'])
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-frames:v', '1', '-q:v', '2', firstFrame])
  run('ffmpeg', ['-y', '-v', 'error', '-ss', '0.08', '-i', out, '-frames:v', '1', '-q:v', '2', afterFrame])
  run('ffmpeg', ['-y', '-v', 'error', '-i', out, '-vf', 'fps=1/8,scale=320:-1,tile=8x1', '-frames:v', '1', '-q:v', '3', contact])
  await copyFile(path.join(root, out), path.join(root, ready))

  const clip = (db.clips || []).find((candidate) => candidate.id === item.clipId)
  if (clip) {
    clip.renderVariants = Array.isArray(clip.renderVariants) ? [{ renderPath: clip.renderPath, renderPreset: clip.renderPreset, thumbnailProofPath: clip.thumbnailProofPath, updatedAt: now, note: 'Superseded by same short with generated thumbnail overlaid on first video frame only.' }, ...clip.renderVariants].slice(0, 12) : []
    clip.renderPath = ready
    clip.renderUrl = `/${ready}`
    clip.renderPreset = `${String(clip.renderPreset || 'confirmed-template-01')}+single-frame-thumbnail-start`
    clip.thumbnailProofPath = thumb
    clip.proofFrames = [firstFrame, afterFrame, thumb, contact]
    clip.proofFramePath = contact
    clip.singleFrameThumbnail = { appliedAt: now, durationSeconds: frameSeconds, thumbnailPath: thumb, firstFramePath: firstFrame, afterFramePath: afterFrame, previousRenderPath: input }
    clip.updatedAt = now
  }
  for (const dispatch of db.dispatchItems || []) {
    if (dispatch.clipId !== item.clipId) continue
    dispatch.renderPath = ready
    dispatch.proofFrames = [firstFrame, afterFrame, thumb, contact]
    dispatch.lastAuditAction = 'Applied generated thumbnail as the first single video frame; no other template/layout changes.'
    dispatch.updatedAt = now
  }
  results.push({ clipId: item.clipId, input, thumb, out, ready, firstFrame, afterFrame, contact, probe: probe(out), firstFrameHash: sampleFirstFrameHash(out) })
}

db.settings ||= {}
db.settings.confirmedShortWorkflow = {
  ...(db.settings.confirmedShortWorkflow || {}),
  singleFrameThumbnailAtStart: true,
  singleFrameThumbnailDurationSeconds: frameSeconds,
  note: 'Standard short workflow: generated clickable thumbnail appears as the first visual frame only. Do not otherwise alter Confirmed Template #1 layout.',
  updatedAt: now,
}
db.mediaJobs ||= []
db.mediaJobs.unshift({
  id: `media_job_day4_single_frame_thumbnail_${stamp}`,
  type: 'render-fix',
  title: 'Applied single-frame thumbnails to Day 4 shorts',
  status: 'done',
  detail: `Applied generated clickable thumbnail as the first video frame only for ${results.length} Day 4 shorts. Existing short layout/render remains unchanged after frame 1; audio starts immediately.`,
  command: 'node scripts/apply-day4-single-frame-thumbnails-20260515T1410Z.mjs',
  createdAt: now,
  reportPath: `${reviewDir}/report.json`,
})
db.mediaJobs = db.mediaJobs.slice(0, 160)
await writeFile(dbPath, JSON.stringify(db, null, 2) + '\n')
await writeFile(path.join(root, `${reviewDir}/report.json`), JSON.stringify({ ok: true, frameSeconds, count: results.length, results }, null, 2) + '\n')
console.log(JSON.stringify({ ok: true, frameSeconds, count: results.length, ready: results.map((r) => r.ready), reportPath: `${reviewDir}/report.json` }, null, 2))
