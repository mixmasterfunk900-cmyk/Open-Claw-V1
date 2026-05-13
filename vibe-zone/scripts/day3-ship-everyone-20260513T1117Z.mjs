#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T1117Z'
const videoId = 'SxOhgmSWqD4'
const inputPath = 'media/downloads/Day 3 - Addicted to vibe coding LIVE.mp4'
const transcriptId = 'tx_1778654489042_25b369'

const spec = {
  id: 'clip_day3_ship_this_to_everyone_now_20260513T1117Z',
  platform: 'youtube',
  start: '43:06',
  end: '43:28',
  title: 'Ship This To Everyone Now',
  hook: 'I want to ship this to everyone now — but the live workflow is showing the next bottleneck.',
  caption: 'A candid build-in-public moment from Day 3: Masala spots the difference between a cool demo and a workflow that is ready for real streamers every day.',
  hashtags: ['#BuildInPublic', '#CreatorTools', '#VibeCoding', '#AIAgents', '#StreamerTools'],
  score: 84,
  reason: 'Fresh Day 3 manual pick after the existing facecam/tracking clips: candid product-pull moment, not the same topic as the earlier facecam/agent/funnel exports.',
  preset: 'facecam-smart',
  seo: {
    youtubeTitle: 'Ship This To Everyone Now | Vibe Zone Day 3',
    description: 'A candid build-in-public moment: the demo works, the product pull is real, and the next workflow bottleneck is obvious.\n\nManual upload draft from Day 3 (SxOhgmSWqD4).',
    tiktokDescription: 'The exact moment a live build starts feeling like a product. #BuildInPublic #CreatorTools #VibeCoding #AIAgents #StreamerTools',
    tags: ['build in public', 'creator tools', 'AI agents', 'streamer tools', 'Vibe Zone'],
    titleVariants: ['Ship This To Everyone Now', 'The Build Started Feeling Like A Product', 'Live Workflow Bottleneck'],
    pinnedComment: 'What is the first workflow bottleneck you would automate for streamers?',
    primaryKeyword: 'AI creator tools',
    fileName: `ship-this-to-everyone-now-${stamp}.mp4`,
    thumbnailText: 'SHIP IT NOW',
  },
}

const slug = (value = 'clip') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'clip'
function run(command, args, opts = {}) { return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 40, ...opts }) }
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
async function proofAndExtras(bundleDir, renderPath, reviewPath) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  run('ffmpeg', ['-y', '-v', 'error', '-ss', '2', '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, 'proof-frame.jpg')])
  run('ffmpeg', ['-y', '-v', 'error', '-ss', '11', '-i', renderPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, 'proof-frame-mid.jpg')])
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Lab Draft — ${spec.title}\n\n- Big text: ${spec.seo.thumbnailText}\n- Visual reference: proof-frame.jpg + proof-frame-mid.jpg.\n- Concept: Masala on cam + active build screen, bold product-pull energy.\n- Avoid: readable secrets, terminal/API tokens, login/cookie screens, public-posting claims.\n- Manual upload only; owner approval required.\n`)
  await writeFile(path.join(absBundle, 'youtube-upload.md'), `# YouTube Shorts Draft — ${spec.title}\n\nTitle: ${spec.seo.youtubeTitle}\n\nDescription:\n${spec.seo.description}\n\n${spec.hashtags.join(' ')}\n\nPinned comment:\n${spec.seo.pinnedComment}\n\nGate evidence:\n- Render: ${path.relative(root, renderPath)}\n- Automated review: ${reviewPath}\n- Proof frames: proof-frame.jpg, proof-frame-mid.jpg\n\nChecklist:\n- [ ] Watch render end-to-end\n- [ ] Confirm captions clear Shorts UI\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'tiktok-upload.md'), `# TikTok Draft — ${spec.title}\n\nCaption:\n${spec.seo.tiktokDescription}\n\nGate evidence:\n- Render: ${path.relative(root, renderPath)}\n- Automated review: ${reviewPath}\n- Proof frames: proof-frame.jpg, proof-frame-mid.jpg\n\nChecklist:\n- [ ] Check first 2 seconds hook\n- [ ] Confirm no private text is readable\n- [ ] Owner approval before upload\n`)
}

await ensureClip()
const outputPath = `media/renders/day3-${slug(spec.title)}-${spec.preset}-${stamp}.mp4`
const result = { stamp, videoId, spec: { id: spec.id, title: spec.title, start: spec.start, end: spec.end, preset: spec.preset }, status: 'started', outputPath }
try {
  console.log(`[day3-1117] render ${spec.title} -> ${outputPath}`)
  const rendered = await api(`/api/clips/${spec.id}/render`, { presetId: spec.preset, outputPath, quality: 'draft', inputPath, videoId, brandText: 'VIBE ZONE', headline: spec.hook })
  if (rendered.clip?.renderStatus !== 'done') throw new Error(rendered.clip?.renderError || 'render did not finish')
  const review = run('node', ['scripts/review-render.mjs', outputPath])
  process.stdout.write(review.stdout || '')
  if (review.status !== 0) {
    result.status = 'needs-review'
    result.blocker = 'automated review failed'
    result.reviewStdout = review.stdout
    result.reviewStderr = review.stderr
  } else {
    const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,duration', '-of', 'json', outputPath])
    const reviewPath = `media/reviews/${path.basename(outputPath, '.mp4')}.review.md`
    const exported = await api(`/api/clips/${spec.id}/export-bundle`, {})
    await proofAndExtras(exported.bundleDir, path.join(root, outputPath), reviewPath)
    result.status = 'ready'
    result.bundleDir = exported.bundleDir
    result.review = reviewPath
    result.ffprobe = JSON.parse(probe.stdout || '{}')
  }
} catch (err) {
  result.status = 'needs-review'
  result.blocker = err?.message || String(err)
}
await writeFile(path.join(root, 'media', 'exports', `day3-ship-everyone-${stamp}.json`), JSON.stringify(result, null, 2))
console.log('[day3-1117] summary')
console.log(JSON.stringify({ ...result, ffprobe: result.ffprobe ? '[saved]' : undefined }, null, 2))
process.exit(result.status === 'ready' ? 0 : 3)
