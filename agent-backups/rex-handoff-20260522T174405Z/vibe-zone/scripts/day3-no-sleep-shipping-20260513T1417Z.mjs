#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T1417Z'
const videoId = 'SxOhgmSWqD4'
const inputPath = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptId = 'tx_1778654489042_25b369'

const spec = {
  id: `clip_day3_no_sleep_shipping_${stamp}`,
  platform: 'youtube',
  start: '26:47',
  end: '27:17',
  title: 'No Sleep Shipping Constantly',
  hook: 'Keep shipping live — no polish pause.',
  caption: 'A raw build-in-public moment from Day 3: Masala chooses momentum over polish and keeps the creator-content machine moving live.',
  hashtags: ['#BuildInPublic', '#VibeCoding', '#CreatorTools', '#ShipIt', '#AIAgents'],
  score: 82,
  reason: 'Fresh Day 3 manual pick: unique shipping/momentum beat away from previously exported product, face-tracking, funnel, and agent-pipeline clips.',
  preset: 'facecam-smart',
  seo: {
    youtubeTitle: 'No Sleep Shipping Constantly | Vibe Zone Day 3',
    description: 'A raw build-in-public moment: the clip is basic, but the momentum matters. Masala keeps shipping the creator-content machine live instead of waiting for perfect polish.\n\nManual upload draft from Day 3 (SxOhgmSWqD4).',
    tiktokDescription: "The clip is basic, but the momentum is real — no-sleep shipping live. #BuildInPublic #VibeCoding #CreatorTools #ShipIt #AIAgents",
    tags: ['build in public', 'ship it', 'creator tools', 'AI agents', 'Vibe Zone'],
    titleVariants: ['No Sleep Shipping Constantly', 'Ship It Before It Is Perfect', 'The Live Build Momentum Clip'],
    pinnedComment: 'Would you ship the rough version live or wait until it is polished?',
    primaryKeyword: 'build in public',
    fileName: `no-sleep-shipping-constantly-${stamp}.mp4`,
    thumbnailText: 'SHIP IT LIVE',
  },
}

const slug = (value = 'clip') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'clip'
function run(command, args, opts = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 60, ...opts })
}
async function api(pathname, body) {
  const res = await fetch(`http://127.0.0.1:8787${pathname}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${text}`)
  return JSON.parse(text)
}
async function ensureClip() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const payload = {
    id: spec.id,
    transcriptId,
    platform: spec.platform,
    status: 'idea',
    exportedAt: null,
    score: spec.score,
    start: spec.start,
    end: spec.end,
    title: spec.title,
    hook: spec.hook,
    caption: spec.caption,
    hashtags: spec.hashtags,
    reason: spec.reason,
    createdAt: new Date().toISOString(),
    seo: spec.seo,
  }
  const existing = db.clips.find((clip) => clip.id === spec.id)
  if (existing) Object.assign(existing, payload, { createdAt: existing.createdAt || payload.createdAt })
  else db.clips.unshift(payload)
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function proofAndExtras(bundleDir, renderPath, reviewPath, ffprobePath) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  const frameSpecs = [['proof-frame-01.jpg', '3'], ['proof-frame-02.jpg', '15'], ['proof-frame-03.jpg', '27']]
  for (const [name, ss] of frameSpecs) run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, name)])
  await copyFile(path.join(root, ffprobePath), path.join(absBundle, 'ffprobe.json')).catch(() => {})
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Lab Draft — ${spec.title}\n\n- Big text: ${spec.seo.thumbnailText}\n- Visual reference: proof-frame-01.jpg / proof-frame-02.jpg / proof-frame-03.jpg.\n- Concept: Masala on cam beside the live build screen; emphasize rough-but-shipped creator energy.\n- Avoid: readable private text, secrets, terminal tokens, login/cookie screens, or claims of external posting.\n- Manual upload only; owner approval required.\n`)
  await writeFile(path.join(absBundle, 'youtube-upload.md'), `# YouTube Shorts Draft — ${spec.title}\n\nTitle: ${spec.seo.youtubeTitle}\n\nDescription:\n${spec.seo.description}\n\n${spec.hashtags.join(' ')}\n\nPinned comment:\n${spec.seo.pinnedComment}\n\nGate evidence:\n- Render: ${path.relative(root, renderPath)}\n- Automated review: ${reviewPath}\n- ffprobe: ffprobe.json\n- Proof frames: proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n\nChecklist:\n- [ ] Watch render end-to-end\n- [ ] Confirm captions clear Shorts UI\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'tiktok-upload.md'), `# TikTok Draft — ${spec.title}\n\nCaption:\n${spec.seo.tiktokDescription}\n\nGate evidence:\n- Render: ${path.relative(root, renderPath)}\n- Automated review: ${reviewPath}\n- ffprobe: ffprobe.json\n- Proof frames: proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n\nChecklist:\n- [ ] Check first 2 seconds hook\n- [ ] Confirm no private text is readable\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'review-notes.md'), `# Review Notes — ${spec.title}\n\nStatus: gated after local ffprobe, automated review, and proof-frame review.\n\nKnown caveat: speech is intentionally rough/live; upload card keeps manual owner approval required.\n`)
}

await ensureClip()
const outputPath = `media/renders/day3-${slug(spec.title)}-${spec.preset}-${stamp}.mp4`
const summaryPath = path.join(root, 'media', 'exports', `day3-no-sleep-shipping-${stamp}.json`)
const result = { stamp, videoId, spec: { id: spec.id, title: spec.title, start: spec.start, end: spec.end, preset: spec.preset }, status: 'started', outputPath }
try {
  console.log(`[day3-1417] render ${spec.title} -> ${outputPath}`)
  const rendered = await api(`/api/clips/${spec.id}/render`, { presetId: spec.preset, outputPath, quality: 'draft', inputPath, videoId, brandText: 'VIBE ZONE', headline: spec.hook })
  if (rendered.clip?.renderStatus !== 'done') throw new Error(rendered.clip?.renderError || 'render did not finish')

  const review = run('node', ['scripts/review-render.mjs', outputPath])
  process.stdout.write(review.stdout || '')
  process.stderr.write(review.stderr || '')
  const reviewPath = `media/reviews/${path.basename(outputPath, '.mp4')}.review.md`
  if (review.status !== 0) throw new Error('automated review failed')

  const ffprobePath = `media/exports/${path.basename(outputPath, '.mp4')}.ffprobe.json`
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,duration', '-of', 'json', outputPath])
  if (probe.status !== 0) throw new Error(`ffprobe failed: ${probe.stderr}`)
  await writeFile(path.join(root, ffprobePath), probe.stdout)

  const exported = await api(`/api/clips/${spec.id}/export-bundle`, {})
  await proofAndExtras(exported.bundleDir, path.join(root, outputPath), reviewPath, ffprobePath)
  result.status = 'ready'
  result.bundleDir = exported.bundleDir
  result.review = reviewPath
  result.ffprobePath = ffprobePath
  result.ffprobe = JSON.parse(probe.stdout || '{}')
} catch (err) {
  result.status = 'needs-review'
  result.blocker = err?.message || String(err)
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const clip = db.clips.find((clip) => clip.id === spec.id)
  if (clip) {
    clip.status = 'needs-review'
    clip.renderStatus = 'needs-review'
    clip.renderError = result.blocker
    await writeFile(dbPath, JSON.stringify(db, null, 2))
  }
}
await writeFile(summaryPath, JSON.stringify(result, null, 2))
console.log('[day3-1417] summary')
console.log(JSON.stringify({ ...result, ffprobe: result.ffprobe ? '[saved]' : undefined }, null, 2))
process.exit(result.status === 'ready' ? 0 : 3)
