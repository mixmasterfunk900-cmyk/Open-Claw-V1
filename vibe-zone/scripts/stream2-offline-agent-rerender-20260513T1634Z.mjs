#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dbPath = path.join(root, 'data', 'vibe-zone.json')
const stamp = '20260513T1634Z'
const sourceClipId = 'clip_stream2_agents_work_offstream_20260512'
const clipId = `clip_stream2_agents_work_offstream_${stamp}`
const videoId = 'stream-2'
const inputPath = 'media/downloads/stream-2.mp4'
const title = 'Build While I Sleep'
const outputPath = `media/renders/stream-2-build-while-i-sleep-facecam-smart-${stamp}.mp4`
const bundleDir = `media/exports/${clipId}-build-while-i-sleep`
const ffprobePath = `media/exports/stream-2-build-while-i-sleep-facecam-smart-${stamp}.ffprobe.json`
const summaryPath = `media/exports/stream2-build-while-i-sleep-${stamp}.json`

const seo = {
  primaryKeyword: 'AI agent workflow',
  youtubeTitle: 'Build While I Sleep | AI Agent Workflow',
  description: 'Masala explains the real test for Vibe Zone/OpenClaw: the project should keep moving even when he can only stream at night.\n\nManual upload draft only. Owner approval required before posting.\n\n#AIAgents #BuildInPublic #OpenClaw #VibeCoding #CreatorTools',
  tiktokDescription: 'The real AI agent test: can the build keep moving while I sleep? #AIAgents #BuildInPublic #OpenClaw #VibeCoding #CreatorTools',
  tags: ['AI agents', 'agentic workflow', 'build in public', 'OpenClaw', 'creator tools', 'Vibe Zone'],
  titleVariants: ['Build While I Sleep', 'The Project Should Move Offline', 'AI Agents Keep The Build Moving'],
  pinnedComment: 'Would you trust an agent workflow to keep building while you are offline?',
  thumbnailText: 'BUILD WHILE I SLEEP',
}

function run(command, args, opts = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 80, ...opts })
}
async function api(pathname, body) {
  const response = await fetch(`http://127.0.0.1:8787${pathname}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
  const text = await response.text()
  if (!response.ok) throw new Error(`${pathname} ${response.status}: ${text}`)
  return JSON.parse(text)
}
async function ensureClip() {
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const source = db.clips.find((clip) => clip.id === sourceClipId)
  if (!source) throw new Error(`missing source clip ${sourceClipId}`)
  const payload = {
    ...source,
    id: clipId,
    title,
    hook: 'The project should keep moving while I sleep.',
    caption: 'The real AI agent workflow test: Masala can only stream at night, so Vibe Zone has to keep shipping useful work while he is offline.',
    hashtags: ['#AIAgents', '#BuildInPublic', '#OpenClaw', '#VibeCoding', '#CreatorTools'],
    reason: `Fresh rerender of ${sourceClipId}: upgrades the older centered-screen export to the tracked facecam-smart layout with tighter upload copy.`,
    score: 82,
    status: 'idea',
    renderStatus: '',
    renderPreset: '',
    renderPath: '',
    renderUrl: '',
    exportBundlePath: '',
    seo,
    createdAt: new Date().toISOString(),
    exportedAt: null,
  }
  const existing = db.clips.find((clip) => clip.id === clipId)
  if (existing) Object.assign(existing, payload, { createdAt: existing.createdAt || payload.createdAt })
  else db.clips.unshift(payload)
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}
async function finishBundle(reviewPath) {
  const absBundle = path.join(root, bundleDir)
  await mkdir(absBundle, { recursive: true })
  for (const [name, ss] of [['proof-frame-01.jpg', '2'], ['proof-frame-02.jpg', '8'], ['proof-frame-03.jpg', '14']]) {
    const frame = run('ffmpeg', ['-y', '-v', 'error', '-ss', ss, '-i', outputPath, '-frames:v', '1', '-q:v', '2', path.join(absBundle, name)])
    if (frame.status !== 0) throw new Error(`proof frame failed: ${frame.stderr}`)
  }
  await copyFile(path.join(root, ffprobePath), path.join(absBundle, 'ffprobe.json')).catch(() => {})
  const db = JSON.parse(await readFile(dbPath, 'utf8'))
  const clip = db.clips.find((item) => item.id === clipId)
  const metadata = {
    id: clipId,
    sourceClipId,
    title,
    platform: 'youtube+tiktok-manual',
    status: 'exported',
    sourceUrl: 'manual://stream-2',
    start: clip?.start || '3:36',
    end: clip?.end || '3:52',
    hook: clip?.hook,
    caption: clip?.caption,
    hashtags: clip?.hashtags || [],
    seo,
    renderPath: outputPath,
    reviewPath,
    ffprobePath,
    proofFrames: ['proof-frame-01.jpg', 'proof-frame-02.jpg', 'proof-frame-03.jpg'],
    manualUploadOnly: true,
    ownerApprovalRequired: true,
    facecamTracking: clip?.facecamTracking || null,
    qualityGate: 'local automated review + ffprobe + proof frames; owner review before upload',
    createdAt: new Date().toISOString(),
  }
  await writeFile(path.join(absBundle, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(path.join(absBundle, 'seo-copy.json'), JSON.stringify({ youtube: { title: seo.youtubeTitle, description: seo.description, tags: seo.tags, pinnedComment: seo.pinnedComment }, tiktok: { caption: seo.tiktokDescription }, variants: seo.titleVariants }, null, 2))
  await writeFile(path.join(absBundle, 'upload-card.md'), `# Manual Upload Card — ${title}\n\nStatus: **ready for owner review** — local-only bundle; do not post externally without Masala approval.\n\nRender: \`${outputPath}\`\n\n## YouTube Shorts\nTitle: ${seo.youtubeTitle}\n\nDescription:\n${seo.description}\n\nPinned comment: ${seo.pinnedComment}\n\n## TikTok\nCaption: ${seo.tiktokDescription}\n\n## Checklist\n- [ ] Watch render end-to-end\n- [ ] Confirm no private text/secrets are readable\n- [ ] Confirm captions clear Shorts/TikTok UI zones\n- [ ] Owner approval before upload\n`)
  await writeFile(path.join(absBundle, 'thumbnail-brief.md'), `# Thumbnail Brief — ${title}\n\n- Big text: ${seo.thumbnailText}\n- Visual: facecam + blurred terminal/build UI + Vibe Zone blue card.\n- Emotion: practical overnight automation, not guru hype.\n- Use proof-frame-02.jpg as the face/reference frame.\n- Avoid readable secrets, account screens, cookies, keys, or posting claims.\n`)
  await writeFile(path.join(absBundle, 'review-notes.md'), `# Review Notes — ${title}\n\nWhy this rerender exists:\n- upgrades the older centered-screen \"project move while offline\" clip into the current facecam-smart layout\n- keeps the facecam prominent and leaves the lower card for the hook/captions\n- uses a stronger short-form hook: \"Build While I Sleep\"\n- manual upload bundle only; no external posting or login work performed\n\nLocal gates:\n- ffprobe saved to ffprobe.json\n- automated review: ${reviewPath}\n- proof frames: proof-frame-01.jpg, proof-frame-02.jpg, proof-frame-03.jpg\n`)
  clip.status = 'exported'
  clip.exportedAt = new Date().toISOString()
  clip.exportBundlePath = bundleDir
  clip.seo = seo
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}

const result = { stamp, clipId, sourceClipId, outputPath, bundleDir, status: 'started' }
try {
  await ensureClip()
  const rendered = await api(`/api/clips/${clipId}/render`, { presetId: 'facecam-smart', inputPath, videoId, outputPath, quality: 'standard', brandText: 'VIBE ZONE', headline: 'BUILD WHILE I SLEEP' })
  if (rendered.clip?.renderStatus !== 'done') throw new Error(rendered.clip?.renderError || 'render did not finish')

  const review = run('node', ['scripts/review-render.mjs', outputPath])
  process.stdout.write(review.stdout || '')
  process.stderr.write(review.stderr || '')
  const reviewPath = `media/reviews/${path.basename(outputPath, '.mp4')}.review.md`
  if (review.status !== 0) throw new Error('automated review failed')

  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,duration', '-of', 'json', outputPath])
  if (probe.status !== 0) throw new Error(`ffprobe failed: ${probe.stderr}`)
  await writeFile(path.join(root, ffprobePath), probe.stdout)

  await finishBundle(reviewPath)
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
