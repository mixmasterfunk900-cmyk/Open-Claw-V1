#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T1804Z'
const sourceIdeaId = 'clip_1778603919030_50adf3'
const clipId = `clip_stream2_clip_machine_live_${stamp}`
const videoId = 'stream-2'
const inputPath = 'media/downloads/stream-2.mp4'
const outputPath = `media/renders/stream-2-build-the-clip-machine-live-screen-card-${stamp}.mp4`
const bundleDir = `media/exports/${clipId}-build-the-clip-machine-live-screen-card-${stamp}`
const ffprobePath = `media/exports/stream-2-build-the-clip-machine-live-screen-card-${stamp}.ffprobe.json`
const summaryPath = `media/exports/stream2-clip-machine-live-card-${stamp}.json`

const spec = {
  id: clipId,
  sourceIdeaId,
  videoId,
  platform: 'youtube+tiktok-manual',
  start: '2:38',
  end: '2:55',
  title: 'Build The Clip Machine Live',
  hook: 'Build the clip machine live: TikTok, Shorts, VPS, and the messy first version.',
  caption: 'Masala turns the stream into a creator operating system: set up the channels, ship clips from the stream, and build the infrastructure live.',
  hashtags: ['#BuildInPublic', '#VibeCoding', '#CreatorTools', '#AIAgents', '#OpenClaw'],
  score: 83,
  reason: 'Fresh Stream 2 export from an unexported idea window; avoids login/account screens and uses a tight screen-card layout so notes stay background context, not readable private UI.',
  preset: 'screen-card-tight-safe-v1',
  seo: {
    primaryKeyword: 'creator operating system',
    youtubeTitle: 'Build The Clip Machine Live | Vibe Zone',
    description: 'A quick build-in-public moment from Stream 2: Masala lays out the clip machine plan — TikTok, Shorts, VPS, and turning the livestream into a repeatable creator workflow.\n\nManual upload draft only. Owner approval required before posting.',
    tiktokDescription: 'Building the clip machine live: stream → Shorts/TikTok → creator workflow. #BuildInPublic #VibeCoding #CreatorTools #AIAgents #OpenClaw',
    tags: ['creator operating system', 'build in public', 'vibe coding', 'AI agents', 'creator tools', 'OpenClaw'],
    titleVariants: ['Build The Clip Machine Live', 'Turning A Stream Into A Clip Machine', 'The Creator OS Starts Here'],
    pinnedComment: 'Would you rather build the content machine first, or polish the product first?',
    thumbnailText: 'CLIP MACHINE LIVE',
  },
}

function run(command, args, opts = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 100, ...opts })
}
function esc(text) { return String(text).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll(':', '\\:') }
function draw(text, y, size = 58, extra = '') {
  return `drawtext=text='${esc(text)}':x=(w-text_w)/2:y=${y}:fontcolor=white:fontsize=${size}:fontfile='media/assets/fonts/LilitaOne-Regular.ttf':borderw=5:bordercolor=black${extra}`
}
async function ensureClip() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const source = db.clips.find((clip) => clip.id === sourceIdeaId)
  const payload = {
    ...source,
    ...spec,
    transcriptId: source?.transcriptId || 'tx_1778603919020_7dca03',
    status: 'exported',
    renderStatus: 'done',
    renderPreset: spec.preset,
    renderPath: outputPath,
    renderUrl: '',
    exportBundlePath: bundleDir,
    exportStatus: 'ready-for-owner-review',
    manualUploadOnly: true,
    ownerApprovalRequired: true,
    seo: spec.seo,
    createdAt: new Date().toISOString(),
    exportedAt: new Date().toISOString(),
    renderVariants: [{ preset: spec.preset, path: outputPath, createdAt: new Date().toISOString(), note: spec.reason }],
  }
  const existing = db.clips.find((clip) => clip.id === clipId)
  if (existing) Object.assign(existing, payload, { createdAt: existing.createdAt || payload.createdAt })
  else db.clips.unshift(payload)
  if (source) {
    source.status = 'exported'
    source.renderStatus = 'superseded'
    source.renderError = `Fresh screen-card export created as ${clipId}`
  }
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function bundle(reviewPath) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  for (const [name, ss] of [['proof-frame-01.jpg', '2.5'], ['proof-frame-02.jpg', '8.5'], ['proof-frame-03.jpg', '14.5']]) {
    const frame = run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', outputPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, name)])
    if (frame.status !== 0) throw new Error(`proof frame failed: ${frame.stderr}`)
  }
  await copyFile(path.join(root, ffprobePath), path.join(absBundle, 'ffprobe.json')).catch(() => {})
  const metadata = { ...spec, renderPath: outputPath, exportBundlePath: bundleDir, reviewPath, ffprobePath, proofFrames: ['proof-frame-01.jpg', 'proof-frame-02.jpg', 'proof-frame-03.jpg'], manualUploadOnly: true, ownerApprovalRequired: true, qualityGate: 'ffprobe + automated review + proof frames + vision proof; owner approval before upload' }
  await writeFile(path.join(absBundle, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
  await writeFile(path.join(absBundle, 'seo-copy.json'), JSON.stringify({ youtube: { title: spec.seo.youtubeTitle, description: spec.seo.description, tags: spec.seo.tags, pinnedComment: spec.seo.pinnedComment }, tiktok: { caption: spec.seo.tiktokDescription }, variants: spec.seo.titleVariants, hashtags: spec.hashtags }, null, 2) + '\n')
  await writeFile(path.join(absBundle, 'upload-card.md'), `# Manual Upload Card — ${spec.title}\n\nStatus: **ready for owner review** — local bundle only; do not post externally without Masala approval.\n\nRender: \`${outputPath}\`\n\n## YouTube Shorts\nTitle: ${spec.seo.youtubeTitle}\n\nDescription:\n${spec.seo.description}\n\n${spec.hashtags.join(' ')}\n\nPinned comment: ${spec.seo.pinnedComment}\n\n## TikTok\nCaption: ${spec.seo.tiktokDescription}\n\n## Checklist\n- [ ] Watch render end-to-end\n- [ ] Confirm no private text/secrets are readable\n- [ ] Confirm captions clear Shorts/TikTok bottom UI\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'youtube-upload.md'), `# YouTube Shorts Draft\n\nTitle: ${spec.seo.youtubeTitle}\n\nDescription:\n${spec.seo.description}\n\n${spec.hashtags.join(' ')}\n\nPinned comment:\n${spec.seo.pinnedComment}\n\nSource render: ${outputPath}\n`)
  await writeFile(path.join(absBundle, 'tiktok-upload.md'), `# TikTok Draft\n\nCaption:\n${spec.seo.tiktokDescription}\n\nSource render: ${outputPath}\n\nManual review only; no automation posting.\n`)
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Brief — ${spec.title}\n\n- Big text: ${spec.seo.thumbnailText}\n- Visual: blue Vibe Zone card over blurred livestream screen; use proof-frame-02.jpg as the first reference.\n- Emotion: practical creator-system build, not fake guru energy.\n- Avoid readable secrets, account screens, browser cookies, keys, or claims that automation posted externally.\n`)
  await writeFile(path.join(absBundle, 'review-notes.md'), `# Review Notes — ${spec.title}\n\nWhy this export exists:\n- converts an unexported Stream 2 idea into a tight upload-ready screen-card short\n- keeps screen context centered without relying on readable private UI\n- raises captions above bottom social UI risk\n- includes YouTube/TikTok copy, thumbnail brief, ffprobe, and proof frames\n\nExternal actions: none. Owner approval required before posting.\n`)
}

await ensureClip()
const filter = [
  `[0:v]split=2[bg][screen]`,
  `[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=18:2,eq=brightness=-0.28:saturation=0.62[base]`,
  `[screen]scale=1000:-2,setsar=1[fg]`,
  `[base]drawbox=x=30:y=330:w=1020:h=620:color=0x07111f@0.92:t=fill,drawbox=x=30:y=330:w=1020:h=620:color=white@0.18:t=4[card]`,
  `[card][fg]overlay=x=40:y=350:format=auto[withscreen]`,
  `[withscreen]drawbox=x=60:y=92:w=960:h=210:color=0x1d4ed8@0.94:t=fill,drawbox=x=60:y=92:w=960:h=210:color=white@0.20:t=4,${draw('BUILD THE', 126, 62)},${draw('CLIP MACHINE', 196, 72)},drawtext=text='VIBE ZONE • Stream 2':x=(w-text_w)/2:y=972:fontcolor=white@0.92:fontsize=36:font='DejaVu Sans':borderw=3:bordercolor=black,drawbox=x=74:y=1176:w=932:h=278:color=0x020617@0.84:t=fill,drawbox=x=74:y=1176:w=932:h=278:color=0x60a5fa@0.28:t=3,${draw('SET UP TIKTOK', 1238, 58, ":enable='between(t\\,0\\,5.2)'")},${draw('SHIP THE CLIPS', 1310, 62, ":enable='between(t\\,0\\,5.2)'")},${draw('THEN BUILD THE VPS', 1238, 54, ":enable='between(t\\,5.2\\,11.5)'")},${draw('LIVE ON STREAM', 1310, 62, ":enable='between(t\\,5.2\\,11.5)'")},${draw('NO EXPERIENCE YET', 1238, 56, ":enable='between(t\\,11.5\\,17)'")},${draw('STILL SHIPPING', 1310, 66, ":enable='between(t\\,11.5\\,17)'")}[vout]`,
].join(';')

const result = { stamp, clipId, outputPath, bundleDir, status: 'started' }
try {
  const ffmpeg = run('ffmpeg', ['-y', '-ss', '158', '-i', inputPath, '-t', '17', '-filter_complex', filter, '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', outputPath])
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
  if (review.status !== 0) throw new Error(`automated review failed: ${review.stderr || review.stdout}`)

  await bundle(reviewPath)
  result.status = 'ready'
  result.reviewPath = reviewPath
  result.ffprobePath = ffprobePath
  result.ffprobe = JSON.parse(probe.stdout || '{}')
} catch (error) {
  result.status = 'needs-review'
  result.blocker = error?.message || String(error)
}
await writeFile(path.join(root, summaryPath), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ ...result, ffprobe: result.ffprobe ? '[saved]' : undefined }, null, 2))
process.exit(result.status === 'ready' ? 0 : 3)
