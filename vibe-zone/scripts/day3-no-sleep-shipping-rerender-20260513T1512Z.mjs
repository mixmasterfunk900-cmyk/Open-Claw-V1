#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T1512Z'
const oldId = 'clip_day3_no_sleep_shipping_20260513T1417Z'
const clipId = `clip_day3_no_sleep_shipping_${stamp}`
const inputPath = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const outputPath = `media/renders/day3-no-sleep-shipping-live-safe-caption-rerender-${stamp}.mp4`
const bundleDir = `media/exports/clip_day3_no_sleep_shipping_${stamp}-ship-live-fix-later`
const ffprobePath = `media/exports/day3-no-sleep-shipping-live-safe-caption-rerender-${stamp}.ffprobe.json`
const summaryPath = `media/exports/day3-no-sleep-shipping-rerender-${stamp}.json`

const spec = {
  id: clipId,
  platform: 'youtube',
  start: '26:47',
  end: '27:17',
  title: 'Ship Live, Fix Later',
  hook: 'SHIP LIVE. FIX LATER.',
  caption: 'Masala ships the rough live build anyway: no-sleep shipping, momentum first, polish after the proof exists.',
  hashtags: ['#BuildInPublic', '#VibeCoding', '#CreatorTools', '#ShipIt', '#AIAgents'],
  score: 84,
  reason: 'Reworked from blocked No Sleep Shipping proof: tighter headline, hand-corrected timed captions, and raised safe-zone placement.',
  preset: 'facecam-smart-safe-caption-v1',
  seo: {
    youtubeTitle: 'Ship Live, Fix Later | Vibe Zone Day 3',
    description: 'A build-in-public moment from Day 3: Masala chooses momentum over polish and ships the rough clip live, then improves the system from the proof.\n\nManual upload draft only. Owner approval required before any external posting.',
    tiktokDescription: 'Ship live. Fix later. The rough proof beats waiting for perfect polish. #BuildInPublic #VibeCoding #CreatorTools #ShipIt #AIAgents',
    tags: ['build in public', 'ship live', 'creator tools', 'AI agents', 'Vibe Zone'],
    titleVariants: ['Ship Live, Fix Later', 'The Rough Proof Beats Polish', 'No Sleep Shipping, Safer Cut'],
    pinnedComment: 'Would you ship the rough proof live, or wait until it looks perfect?',
    primaryKeyword: 'build in public',
    fileName: `ship-live-fix-later-${stamp}.mp4`,
    thumbnailText: 'SHIP LIVE',
  },
}

function run(command, args, opts = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80, ...opts })
}
function assSafe(text) { return String(text).replaceAll("'", "\\'").replaceAll(':', '\\:') }
function draw(text, y, size = 58, extra = '') {
  return `drawtext=text='${assSafe(text)}':x=(w-text_w)/2:y=${y}:fontcolor=white:fontsize=${size}:fontfile='media/assets/fonts/LilitaOne-Regular.ttf':borderw=5:bordercolor=black${extra}`
}
async function ensureClip() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const old = db.clips.find((clip) => clip.id === oldId)
  const payload = {
    ...spec,
    transcriptId: old?.transcriptId || 'tx_1778654489042_25b369',
    status: 'exported',
    renderStatus: 'done',
    renderPath: outputPath,
    exportBundlePath: bundleDir,
    exportedAt: new Date().toISOString(),
    renderVariants: [{ preset: spec.preset, path: outputPath, createdAt: new Date().toISOString(), note: 'Safe-caption rerender of blocked 1417Z proof' }],
    facecamTracking: old?.facecamTracking || null,
    createdAt: new Date().toISOString(),
  }
  const existing = db.clips.find((clip) => clip.id === clipId)
  if (existing) Object.assign(existing, payload, { createdAt: existing.createdAt || payload.createdAt })
  else db.clips.unshift(payload)
  if (old) {
    old.status = 'needs-review'
    old.renderStatus = 'needs-review'
    old.renderError = `Superseded by safer caption rerender: ${outputPath}`
  }
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function proofAndBundle(reviewPath) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  for (const [name, ss] of [['proof-frame-01.jpg', '3'], ['proof-frame-02.jpg', '15'], ['proof-frame-03.jpg', '27']]) {
    const frame = run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', outputPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, name)])
    if (frame.status !== 0) throw new Error(`proof frame failed: ${frame.stderr}`)
  }
  await copyFile(path.join(root, ffprobePath), path.join(absBundle, 'ffprobe.json')).catch(() => {})
  const metadata = { ...spec, renderPath: outputPath, exportBundlePath: bundleDir, proofFrames: ['proof-frame-01.jpg', 'proof-frame-02.jpg', 'proof-frame-03.jpg'], reviewPath, ffprobePath, manualUploadOnly: true, ownerApprovalRequired: true, qualityGate: 'local proof-frame pass pending owner approval' }
  await writeFile(path.join(absBundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(absBundle, 'upload-card.md'), `# Manual Upload Card — ${spec.title}\n\nStatus: **approved for manual owner review** — local-only bundle; do not post externally without Masala approval.\n\nRender: \`${outputPath}\`\n\n## YouTube Shorts\nTitle: ${spec.seo.youtubeTitle}\n\nDescription:\n${spec.seo.description}\n\n${spec.hashtags.join(' ')}\n\nPinned comment: ${spec.seo.pinnedComment}\n\n## TikTok\nCaption: ${spec.seo.tiktokDescription}\n\n## Checklist\n- [ ] Watch render end-to-end\n- [ ] Confirm raised captions clear Shorts/TikTok bottom UI\n- [ ] Confirm no private text/secrets are readable\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Brief — ${spec.title}\n\n- Big text: ${spec.seo.thumbnailText}\n- Alternate text: FIX LATER\n- Use proof-frame-02.jpg as face reference.\n- Visual angle: tired live-builder energy + bold proof-card, not polished guru content.\n- Avoid readable private text, keys, cookies, chats, or platform login screens.\n`)
  await writeFile(path.join(absBundle, 'review-notes.md'), `# Review Notes — ${spec.title}\n\nThis rerender fixes the blocked 1417Z proof by:\n- replacing awkward headline copy with \"SHIP LIVE. FIX LATER.\"\n- replacing noisy transcript subtitles with hand-corrected timed captions\n- lifting captions above the bottom UI/safe-zone risk\n- keeping tracked facecam placement from the successful multi-sample detector\n\nManual upload only; no external posting performed.\n`)
}

await ensureClip()
const filter = [
  `[0:v]split=2[main][cam]`,
  `[main]scale=-2:1920,crop=1080:1920:840:0,boxblur=10:1,eq=brightness=-0.20:saturation=0.62[base]`,
  `[cam]crop=444:393:102:12,scale=560:-2,setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=white@0.36:t=3[face]`,
  `[base][face]overlay=x=(W-w)/2:y=74:format=auto[withface]`,
  `[withface]drawbox=x=70:y=910:w=940:h=530:color=0x1d4ed8@0.91:t=fill,drawbox=x=70:y=910:w=940:h=530:color=white@0.24:t=4,${draw('SHIP LIVE.', 1006, 68)},${draw('FIX LATER.', 1086, 68)},drawtext=text='VIBE ZONE • local proof':x=(w-text_w)/2:y=1204:fontcolor=white@0.86:fontsize=36:font='DejaVu Sans':borderw=3:bordercolor=black,${draw("WE ARE STILL SENDING", 1300, 54, ":enable='between(t\\,9.7\\,14.4)'")},${draw('THIS LIVE', 1362, 62, ":enable='between(t\\,9.7\\,14.4)'")},${draw('NO SLEEP SHIPPING', 1300, 58, ":enable='between(t\\,14.4\\,19.4)'")},${draw('CONSTANTLY', 1366, 64, ":enable='between(t\\,14.4\\,19.4)'")},${draw("I WILL SHIP ANYTHING", 1300, 56, ":enable='between(t\\,19.4\\,27.4)'")},${draw('FOR NOW', 1364, 64, ":enable='between(t\\,19.4\\,27.4)'")}[vout]`,
].join(';')

const result = { stamp, clipId, outputPath, bundleDir, status: 'started' }
try {
  const ffmpeg = run('ffmpeg', ['-y', '-ss', '1602', '-i', inputPath, '-ss', '5', '-t', '30', '-filter_complex', filter, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-c:a', 'aac', outputPath])
  process.stdout.write(ffmpeg.stdout || '')
  process.stderr.write(ffmpeg.stderr || '')
  if (ffmpeg.status !== 0) throw new Error(`ffmpeg failed: ${ffmpeg.stderr}`)

  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,duration', '-of', 'json', outputPath])
  if (probe.status !== 0) throw new Error(`ffprobe failed: ${probe.stderr}`)
  await writeFile(path.join(root, ffprobePath), probe.stdout)

  const review = run('node', ['scripts/review-render.mjs', outputPath])
  process.stdout.write(review.stdout || '')
  process.stderr.write(review.stderr || '')
  const reviewPath = `media/reviews/${path.basename(outputPath, '.mp4')}.review.md`
  if (review.status !== 0) throw new Error('automated review failed')

  await proofAndBundle(reviewPath)
  result.status = 'ready'
  result.reviewPath = reviewPath
  result.ffprobePath = ffprobePath
  result.ffprobe = JSON.parse(probe.stdout || '{}')
} catch (error) {
  result.status = 'needs-review'
  result.blocker = error?.message || String(error)
}
await writeFile(path.join(root, summaryPath), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ ...result, ffprobe: result.ffprobe ? '[saved]' : undefined }, null, 2))
process.exit(result.status === 'ready' ? 0 : 3)
